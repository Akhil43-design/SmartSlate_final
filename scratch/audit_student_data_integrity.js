const path = require('path');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const { firebaseConfig } = require('../shared/firebase/firebaseConfig');

const DB_PATH = path.join(__dirname, '..', 'shared', 'db', 'smartslate.db');
const db = new sqlite3.Database(DB_PATH);

function queryDb(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function fetchFirestore(collectionName) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            path: `/v1/projects/smartslate-bd117/databases/(default)/documents/${collectionName}?key=${firebaseConfig.apiKey}`,
            method: 'GET'
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    resolve(data.documents || []);
                } catch (e) {
                    resolve([]);
                }
            });
        });
        req.on('error', () => resolve([]));
        req.end();
    });
}

function parseFirestoreDoc(doc) {
    if (!doc || !doc.fields) return {};
    const obj = {};
    const pathParts = doc.name ? doc.name.split('/') : [];
    obj._id = pathParts[pathParts.length - 1];
    
    for (const [key, field] of Object.entries(doc.fields)) {
        if ('stringValue' in field) obj[key] = field.stringValue;
        else if ('integerValue' in field) obj[key] = parseInt(field.integerValue, 10);
        else if ('doubleValue' in field) obj[key] = parseFloat(field.doubleValue);
        else if ('booleanValue' in field) obj[key] = field.booleanValue;
        else if ('arrayValue' in field) {
            obj[key] = (field.arrayValue.values || []).map(v => v.stringValue || v.integerValue || v);
        }
        else if ('mapValue' in field) obj[key] = field.mapValue;
    }
    return obj;
}

async function audit() {
    console.log('==================================================');
    console.log('🔍 RUNNING COMPREHENSIVE STUDENT DATA AUDIT');
    console.log('==================================================\n');

    // 1. Fetch table schemas
    const userCols = await queryDb(`PRAGMA table_info(users)`);
    const studentCols = await queryDb(`PRAGMA table_info(students)`);
    console.log(`User columns:`, userCols.map(c => c.name));
    console.log(`Student columns:`, studentCols.map(c => c.name));

    // Fetch SQLite Students
    const sqliteStudents = await queryDb(`
        SELECT s.*, u.name, u.email, u.role, u.student_code as u_code, c.name as class_name, c.section as class_sec
        FROM students s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN classes c ON s.class_id = c.id
    `);

    console.log(`📊 SQLite Students Found: ${sqliteStudents.length}`);
    sqliteStudents.forEach(s => {
        console.log(`- SQLite User ID: ${s.user_id}, Name: ${s.name}, Email: ${s.email}, Firebase UID: ${s.firebase_uid}`);
        console.log(`  Class ID: ${s.class_id}, Class Name: ${s.class_name}, Grade: ${s.grade}, Section: ${s.section}, Student Code: ${s.student_code || s.u_code}`);
    });

    // 2. Fetch Firestore Students collection
    console.log('\n📊 Fetching Cloud Firestore /students documents...');
    const firestoreStudentDocs = await fetchFirestore('students');
    const firestoreStudents = firestoreStudentDocs.map(parseFirestoreDoc);
    console.log(`Found ${firestoreStudents.length} documents in /students:`);
    firestoreStudents.forEach(s => {
        console.log(`- Document ID: ${s._id} | Name: ${s.name} | UID: ${s.uid || s.firebase_uid}`);
        console.log(`  Grade: "${s.grade}", Class: "${s.class}", ClassId: "${s.classId || s.class_id}", Section: "${s.section}", EducationLevel: "${s.educationLevel || s.education_level}"`);
        console.log(`  StudentCode: "${s.studentCode || s.student_code}", ParentIds: [${(s.parentIds||[]).join(', ')}], TeacherIds: [${(s.teacherIds||[]).join(', ')}]`);
    });

    // 3. Fetch Firestore Users collection
    console.log('\n📊 Fetching Cloud Firestore /users documents...');
    const firestoreUserDocs = await fetchFirestore('users');
    const firestoreUsers = firestoreUserDocs.map(parseFirestoreDoc);
    console.log(`Found ${firestoreUsers.length} documents in /users:`);
    firestoreUsers.forEach(u => {
        console.log(`- Document ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
        console.log(`  Grade: "${u.grade}", Class: "${u.class || u.classGrade || u.className}", ClassId: "${u.classId}", Section: "${u.section}", EducationLevel: "${u.educationLevel}"`);
    });

    // 4. Fetch Connections in SQLite and Firestore
    const sqliteConnections = await queryDb(`SELECT * FROM student_teacher_connections`);
    console.log(`\n📊 SQLite Student-Teacher Connections: ${sqliteConnections.length}`);
    sqliteConnections.forEach(c => {
        console.log(`- Student: ${c.student_uid || c.student_code}, Teacher: ${c.teacher_uid || c.teacher_code}, Status: ${c.status}`);
    });

    db.close();
}

audit().catch(console.error);
