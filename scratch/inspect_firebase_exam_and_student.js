const https = require('https');
const { firebaseConfig } = require('../shared/firebase/firebaseConfig');
const { all, get } = require('../shared/db/database');

const projectId = firebaseConfig.projectId || 'smartslate-bd117';
const apiKey = firebaseConfig.apiKey;

function firestoreGet(collection, docId = '') {
    return new Promise((resolve) => {
        const path = `/v1/projects/${projectId}/databases/(default)/documents/${collection}${docId ? '/' + docId : ''}${apiKey ? '?key=' + apiKey : ''}`;
        const req = https.request({
            hostname: 'firestore.googleapis.com',
            path,
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch(e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', (err) => resolve({ status: 500, error: err.message }));
        req.end();
    });
}

function parseFirestoreFields(fields = {}) {
    const res = {};
    for (const k of Object.keys(fields)) {
        const valObj = fields[k];
        if (valObj.stringValue !== undefined) res[k] = valObj.stringValue;
        else if (valObj.integerValue !== undefined) res[k] = parseInt(valObj.integerValue, 10);
        else if (valObj.doubleValue !== undefined) res[k] = parseFloat(valObj.doubleValue);
        else if (valObj.booleanValue !== undefined) res[k] = valObj.booleanValue;
        else if (valObj.timestampValue !== undefined) res[k] = valObj.timestampValue;
        else if (valObj.arrayValue !== undefined) {
            res[k] = (valObj.arrayValue.values || []).map(v => v.stringValue || v.integerValue || v);
        } else if (valObj.mapValue !== undefined) {
            res[k] = parseFirestoreFields(valObj.mapValue.fields);
        } else {
            res[k] = valObj;
        }
    }
    return res;
}

async function inspect() {
    console.log('====================================================');
    console.log('🔍 1. INSPECTING FIRESTORE EXAMS');
    console.log('====================================================');

    const examsRes = await firestoreGet('exams');
    if (examsRes.status === 200 && examsRes.data.documents) {
        console.log(`Found ${examsRes.data.documents.length} exam document(s) in Firestore collection 'exams':\n`);
        for (const doc of examsRes.data.documents) {
            const data = parseFirestoreFields(doc.fields);
            const docName = doc.name.split('/').pop();
            console.log('[EXAM DEBUG]');
            console.log(`Exam ID: ${data.id || docName}`);
            console.log(`Teacher UID: ${data.teacherUid || data.teacher_uid || data.created_by}`);
            console.log(`Subject: ${data.subject}`);
            console.log(`Target Class: ${data.targetClass || data.target_class || data.className || data.class_name}`);
            console.log(`Target Section: ${data.targetSection || data.target_section || data.section || 'All'}`);
            console.log(`Start At: ${data.startTime || data.start_time || data.startDate || data.start_date}`);
            console.log(`End At: ${data.endTime || data.end_time || data.endDate || data.end_date}`);
            console.log(`Created At: ${data.createdAt || data.created_at}`);
            console.log('----------------------------------------------------');
        }
    } else {
        console.log('No documents in Firestore collection "exams". Status:', examsRes.status);
    }

    console.log('\n====================================================');
    console.log('🔍 2. INSPECTING FIRESTORE STUDENT PROFILES');
    console.log('====================================================');

    const studentsRes = await firestoreGet('students');
    if (studentsRes.status === 200 && studentsRes.data.documents) {
        console.log(`Found ${studentsRes.data.documents.length} student profile(s) in Firestore collection 'students':\n`);
        for (const doc of studentsRes.data.documents) {
            const data = parseFirestoreFields(doc.fields);
            const docName = doc.name.split('/').pop();
            console.log('[STUDENT EXAM DEBUG]');
            console.log(`Firebase Auth UID: ${docName}`);
            console.log(`Student Profile UID: ${data.uid || data.studentUid || docName}`);
            console.log(`Student Name: ${data.fullName || data.name}`);
            console.log(`Student Class: ${data.className || data.classGrade || data.grade || data.class}`);
            console.log(`Student Section: ${data.section || 'A'}`);
            console.log(`Education Level: ${data.educationLevel || data.education_level || '6to10th'}`);
            console.log('----------------------------------------------------');
        }
    } else {
        console.log('No documents in Firestore collection "students". Status:', studentsRes.status);
    }

    console.log('\n====================================================');
    console.log('🔍 3. INSPECTING STUDENT-TEACHER CONNECTIONS (FIRESTORE & SQLITE)');
    console.log('====================================================');

    const connsRes = await firestoreGet('student_teacher_connections');
    if (connsRes.status === 200 && connsRes.data.documents) {
        console.log(`Found ${connsRes.data.documents.length} connection(s) in Firestore:\n`);
        for (const doc of connsRes.data.documents) {
            const data = parseFirestoreFields(doc.fields);
            console.log('[EXAM CONNECTION (Firestore)]');
            console.log(`Student UID: ${data.studentUid || data.student_uid}`);
            console.log(`Teacher UID: ${data.teacherUid || data.teacher_uid}`);
            console.log(`Status: ${data.status}`);
            console.log('----------------------------------------------------');
        }
    }

    const sqliteConns = await all('SELECT * FROM student_teacher_connections').catch(() => []);
    console.log(`Found ${sqliteConns.length} connection(s) in SQLite:`);
    for (const c of sqliteConns) {
        console.log(`  - Student UID: ${c.student_uid}, Teacher UID: ${c.teacher_uid}, Status: ${c.status}`);
    }

    const sqliteExams = await all('SELECT * FROM exams ORDER BY id DESC LIMIT 5').catch(() => []);
    console.log(`\nFound ${sqliteExams.length} recent exam(s) in SQLite:`);
    for (const e of sqliteExams) {
        console.log(`  - ID: ${e.id}, Title: "${e.title}", Target Class: "${e.target_class}", Subject: "${e.subject}", Start: ${e.start_date} ${e.start_time}, End: ${e.end_date} ${e.end_time}`);
    }
}

inspect().catch(console.error);
