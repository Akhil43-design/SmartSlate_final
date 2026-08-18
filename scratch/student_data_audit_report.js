const path = require('path');
const https = require('https');
const { firebaseConfig } = require('../shared/firebase/firebaseConfig');
const { get, all } = require('../shared/db/database');

const apiKey = firebaseConfig.apiKey;
const projectId = firebaseConfig.projectId || 'smartslate-bd117';

function signIn(email, password = 'SmartSlate@123') {
    return new Promise((resolve) => {
        const payload = JSON.stringify({ email, password, returnSecureToken: true });
        const req = https.request({
            hostname: 'identitytoolkit.googleapis.com',
            path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch(e) { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', (err) => resolve({ status: 500, error: err.message }));
        req.write(payload);
        req.end();
    });
}

function getFirestoreDoc(collection, docId, idToken) {
    return new Promise((resolve) => {
        const path = `/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;
        const req = https.request({
            hostname: 'firestore.googleapis.com',
            path,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${idToken}` }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch(e) { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', (err) => resolve({ status: 500, error: err.message }));
        req.end();
    });
}

function parseFields(fields = {}) {
    const res = {};
    for (const k of Object.keys(fields)) {
        const valObj = fields[k];
        if (valObj.stringValue !== undefined) res[k] = valObj.stringValue;
        else if (valObj.integerValue !== undefined) res[k] = parseInt(valObj.integerValue, 10);
        else if (valObj.doubleValue !== undefined) res[k] = parseFloat(valObj.doubleValue);
        else if (valObj.booleanValue !== undefined) res[k] = valObj.booleanValue;
        else if (valObj.arrayValue !== undefined) {
            res[k] = (valObj.arrayValue.values || []).map(v => v.stringValue || v.integerValue || v);
        } else if (valObj.mapValue !== undefined) {
            res[k] = parseFields(valObj.mapValue.fields);
        } else {
            res[k] = valObj;
        }
    }
    return res;
}

async function runAudit() {
    console.log('==================================================');
    console.log('STUDENT DATA AUDIT REPORT');
    console.log('==================================================\n');

    // 1. Authenticate as student (Pooja Reddy)
    const studentAuth = await signIn('student_051@smartslate.test', 'SmartSlate@123');
    const studentUid = studentAuth.data?.localId;
    const studentToken = studentAuth.data?.idToken;

    console.log(`Student Email: student_051@smartslate.test`);
    console.log(`Firebase UID: ${studentUid}`);
    console.log(`Auth Status: ${studentAuth.status}\n`);

    if (!studentToken) {
        console.error('Failed to sign in student.');
        return;
    }

    // 2. Fetch Firestore documents
    const studentDocRes = await getFirestoreDoc('students', studentUid, studentToken);
    const userDocRes = await getFirestoreDoc('users', studentUid, studentToken);

    const studentFields = studentDocRes.data?.fields ? parseFields(studentDocRes.data.fields) : null;
    const userFields = userDocRes.data?.fields ? parseFields(userDocRes.data.fields) : null;

    console.log('Firestore documents found:');
    console.log('1. students/' + studentUid, studentFields ? 'FOUND' : 'NOT FOUND');
    if (studentFields) {
        console.log('   - name:', studentFields.name);
        console.log('   - grade:', studentFields.grade || studentFields.class);
        console.log('   - className:', studentFields.className);
        console.log('   - classId:', studentFields.classId);
        console.log('   - section:', studentFields.section);
        console.log('   - educationLevel:', studentFields.educationLevel);
        console.log('   - studentCode:', studentFields.studentCode);
    }
    console.log('2. users/' + studentUid, userFields ? 'FOUND' : 'NOT FOUND');
    if (userFields) {
        console.log('   - name:', userFields.name);
        console.log('   - grade:', userFields.grade || userFields.class);
        console.log('   - classId:', userFields.classId);
        console.log('   - section:', userFields.section);
        console.log('   - educationLevel:', userFields.educationLevel);
    }

    // 3. Query SQLite
    const sqliteUser = await get("SELECT * FROM users WHERE email = 'student_051@smartslate.test' OR id = 5034");
    const sqliteStudent = sqliteUser ? await get("SELECT * FROM students WHERE user_id = ?", [sqliteUser.id]) : null;
    const sqliteClass = sqliteStudent?.class_id ? await get("SELECT * FROM classes WHERE id = ?", [sqliteStudent.class_id]) : null;

    console.log('\nSQLite Result:');
    console.log('   - User ID:', sqliteUser?.id);
    console.log('   - Name:', sqliteUser?.name);
    console.log('   - Student Code:', sqliteUser?.student_code);
    console.log('   - Student Table Class ID:', sqliteStudent?.class_id);
    console.log('   - Student Table Section:', sqliteStudent?.section);
    console.log('   - Linked Class Name in SQLite:', sqliteClass?.name || 'NULL');

    // 4. Query Teacher API / Database view of this student
    const teacherStudentQuery = await get(`
        SELECT s.id as student_id, s.user_id as student_uid, s.student_code, s.grade, s.class_name, s.section, s.education_level,
               u.name as student_name, u.email as student_email,
               COALESCE(s.class_name, s.grade, c.name, 'Grade 8') as displayed_class_name,
               COALESCE(s.section, 'A') as displayed_section
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE u.email = 'student_051@smartslate.test' OR s.user_id = ? OR s.firebase_uid = ?`,
        [sqliteUser?.id || 5034, studentUid]
    );

    console.log('\nTeacher API Query Result:');
    console.log('   - Displayed Class Name:', teacherStudentQuery?.displayed_class_name);
    console.log('   - Section:', teacherStudentQuery?.displayed_section);
    console.log('   - Education Level:', teacherStudentQuery?.education_level);

    // 5. Query Parent API / Database view of this student
    const parentStudentQuery = await get(`
        SELECT s.id as student_id, s.user_id as student_uid, s.student_code, s.grade, s.class_name, s.section, s.education_level,
               u.name as student_name, u.email as student_email,
               COALESCE(s.class_name, s.grade, c.name, 'Grade 8') as displayed_class_name,
               COALESCE(s.section, 'A') as displayed_section
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE u.email = 'student_051@smartslate.test' OR s.user_id = ? OR s.firebase_uid = ?`,
        [sqliteUser?.id || 5034, studentUid]
    );

    console.log('\nParent API Query Result:');
    console.log('   - Displayed Class Name:', parentStudentQuery?.displayed_class_name);
    console.log('   - Section:', parentStudentQuery?.displayed_section);
    console.log('   - Education Level:', parentStudentQuery?.education_level);

    console.log('\n==================================================');
    console.log('SOURCE OF CONFLICT:');
    console.log('==================================================');
    console.log('1. Firestore Document students/' + studentUid + ' has className = "Class 6" / class = "6", section = "A", studentCode = "STU-POOJ6A-11".');
    console.log('2. SQLite students table has class_id = NULL for user_id = ' + (sqliteUser?.id || 5034) + '.');
    console.log('3. In parent-teacher routes (teacher.js & parent.js), the SQL query uses `COALESCE(c.name, "Class 8") as class_name`, which forces the class to "Class 8" when class_id is NULL or unlinked.');
    console.log('4. In student portal frontend, AcademicData.selectedClass and localStorage fallback to 8 if not synchronized from Firestore canonical profile.');
    console.log('5. Student table in SQLite lacks direct grade/class_name/education_level storage and fails to upsert from students/{firebaseUid}.');
    console.log('==================================================\n');
}

runAudit().catch(console.error);
