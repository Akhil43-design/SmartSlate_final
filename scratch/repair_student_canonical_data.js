const https = require('https');
const { get, all, run } = require('../shared/db/database');
const { firebaseConfig } = require('../shared/firebase/firebaseConfig');

const apiKey = firebaseConfig.apiKey;
const projectId = firebaseConfig.projectId || 'smartslate-bd117';

function signIn(email, password = 'SmartSlate@123') {
    return new Promise((resolve) => {
        const payload = JSON.stringify({ email, password, returnSecureToken: true });
        const req = https.request({
            hostname: 'identitytoolkit.googleapis.com',
            path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
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

function updateFirestoreDoc(collection, docId, fields, idToken) {
    return new Promise((resolve) => {
        const updateMaskParams = Object.keys(fields).map(f => `updateMask.fieldPaths=${f}`).join('&');
        const path = `/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?${updateMaskParams}`;
        const firestoreFields = {};
        for (const [k, v] of Object.entries(fields)) {
            if (typeof v === 'string') firestoreFields[k] = { stringValue: v };
            else if (typeof v === 'number') firestoreFields[k] = { integerValue: String(v) };
            else if (typeof v === 'boolean') firestoreFields[k] = { booleanValue: v };
            else if (Array.isArray(v)) firestoreFields[k] = { arrayValue: { values: v.map(item => ({ stringValue: String(item) })) } };
        }

        const payload = JSON.stringify({ fields: firestoreFields });
        const req = https.request({
            hostname: 'firestore.googleapis.com',
            path,
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
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

async function repairData() {
    console.log('==================================================');
    console.log('REPAIRING AND CANONICALIZING STUDENT DATA');
    console.log('==================================================\n');

    // 1. Sign in student Pooja Reddy
    const studentAuth = await signIn('student_051@smartslate.test', 'SmartSlate@123');
    console.log('Student Signin Response Status:', studentAuth.status);

    if (!studentAuth.data?.idToken) {
        console.error('Failed to sign in student:', studentAuth.data);
        return;
    }

    const studentUid = studentAuth.data.localId;
    const idToken = studentAuth.data.idToken;
    console.log(`Student Auth UID: ${studentUid}`);

    // Canonical Placement for Pooja Reddy (Class 6, Section A, High School)
    const canonicalProfile = {
        uid: studentUid,
        studentId: 'STU-POOJ6A-11',
        studentCode: 'STU-POOJ6A-11',
        name: 'Pooja Krishna',
        email: 'student_051@smartslate.test',
        educationLevel: 'High School',
        grade: 'Grade 6',
        classId: 'class-grade-6-a',
        className: 'Class 6',
        class: '6',
        section: 'A',
        schoolName: 'SmartSlate High School',
        parentName: 'Ramesh Kumar',
        parentCode: 'PAR-RAMES-101',
        parentIds: ['kExI0Vtkw4Rka2mmobnSGxmKYjy1'],
        teacherIds: ['TCH-PRIYA-MATH-05', 'TCH-RADHA-BIOL-07', 'TCH-VENKA-SOCI-08', 'TCH-ANURA-ENGL-09'],
        updatedAt: new Date().toISOString()
    };

    // Update Firestore students/8jKDKLlaa4SwPTipZ9mSIDyqWvH2
    console.log('1. Updating Firestore students/' + studentUid);
    const fsRes = await updateFirestoreDoc('students', studentUid, canonicalProfile, idToken);
    console.log('   Firestore students update status:', fsRes.status);

    // Update Firestore users/8jKDKLlaa4SwPTipZ9mSIDyqWvH2
    console.log('2. Updating Firestore users/' + studentUid);
    const fsUserRes = await updateFirestoreDoc('users', studentUid, {
        uid: studentUid,
        name: canonicalProfile.name,
        email: canonicalProfile.email,
        role: 'student',
        studentCode: canonicalProfile.studentCode,
        educationLevel: canonicalProfile.educationLevel,
        grade: canonicalProfile.grade,
        classId: canonicalProfile.classId,
        className: canonicalProfile.className,
        section: canonicalProfile.section,
        updatedAt: canonicalProfile.updatedAt
    }, idToken);
    console.log('   Firestore users update status:', fsUserRes.status);

    // 3. Update SQLite users table
    console.log('3. Updating SQLite users table...');
    await run(
        `UPDATE users SET firebase_uid = ?, student_code = ? WHERE email = ? OR id = 5034`,
        [studentUid, canonicalProfile.studentCode, canonicalProfile.email]
    );

    const userRow = await get("SELECT id FROM users WHERE email = ? OR id = 5034", [canonicalProfile.email]);
    const userId = userRow?.id || 5034;

    // 4. Update SQLite students table
    console.log('4. Updating SQLite students table...');
    const existingStudent = await get("SELECT id FROM students WHERE user_id = ? OR student_code = ?", [userId, canonicalProfile.studentCode]);
    if (existingStudent) {
        await run(
            `UPDATE students SET firebase_uid = ?, grade = ?, class_name = ?, class_id_str = ?, section = ?, education_level = ?, school_name = ?, student_code = ?
             WHERE id = ?`,
            [
                studentUid,
                canonicalProfile.grade,
                canonicalProfile.className,
                canonicalProfile.classId,
                canonicalProfile.section,
                canonicalProfile.educationLevel,
                canonicalProfile.schoolName,
                canonicalProfile.studentCode,
                existingStudent.id
            ]
        );
    } else {
        await run(
            `INSERT INTO students (user_id, firebase_uid, student_code, grade, class_name, class_id_str, section, education_level, school_name)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                studentUid,
                canonicalProfile.studentCode,
                canonicalProfile.grade,
                canonicalProfile.className,
                canonicalProfile.classId,
                canonicalProfile.section,
                canonicalProfile.educationLevel,
                canonicalProfile.schoolName
            ]
        );
    }

    // 5. Update SQLite connections
    console.log('5. Updating SQLite connection tables...');
    await run(
        `UPDATE student_teacher_connections SET student_uid = ? WHERE student_code = ? OR student_uid = ?`,
        [studentUid, canonicalProfile.studentCode, String(userId)]
    );
    await run(
        `UPDATE student_parent_connections SET student_uid = ? WHERE student_code = ? OR student_uid = ?`,
        [studentUid, canonicalProfile.studentCode, String(userId)]
    );

    console.log('\n✅ Repair & Canonicalization complete for UID ' + studentUid + '!');
}

repairData().catch(console.error);
