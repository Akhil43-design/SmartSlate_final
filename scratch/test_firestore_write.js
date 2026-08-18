const https = require('https');

const API_KEY = "AIzaSyBOgNWBVqSYfMypeZS8NwRLOYpq7DY3-ls";
const PROJECT_ID = "smartslate-bd117";

function requestJson(url, method, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const headers = { 'Content-Type': 'application/json' };
        let postData = '';
        if (data) {
            postData = JSON.stringify(data);
            headers['Content-Length'] = Buffer.byteLength(postData);
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request({
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: headers
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
                    }
                } catch (e) {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(body);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                    }
                }
            });
        });

        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

function toFirestoreFields(obj) {
    const fields = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            fields[key] = { nullValue: null };
        } else if (typeof value === 'boolean') {
            fields[key] = { booleanValue: value };
        } else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                fields[key] = { integerValue: String(value) };
            } else {
                fields[key] = { doubleValue: value };
            }
        } else if (typeof value === 'string') {
            fields[key] = { stringValue: value };
        } else if (Array.isArray(value)) {
            fields[key] = {
                arrayValue: {
                    values: value.map(v => ({ stringValue: String(v) }))
                }
            };
        } else if (typeof value === 'object') {
            fields[key] = { mapValue: { fields: toFirestoreFields(value) } };
        }
    }
    return fields;
}

async function testFull() {
    const studentEmail = `student_test_${Date.now()}@smartslate.test`;
    const parentEmail = `parent_test_${Date.now()}@smartslate.test`;
    const teacherEmail = `teacher_test_${Date.now()}@smartslate.test`;

    // 1. Create Teacher
    console.log('1. Creating Teacher...');
    const tchAuth = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, 'POST', {
        email: teacherEmail, password: "SmartSlate@123", returnSecureToken: true
    });
    const tchData = {
        uid: tchAuth.localId,
        name: "Priya Sharma",
        email: teacherEmail,
        teacherCode: "TCH-PRIYA-MATH-01",
        subject: "Mathematics",
        createdAt: new Date().toISOString()
    };
    await requestJson(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/teachers/${tchAuth.localId}`, 'PATCH', { fields: toFirestoreFields(tchData) }, tchAuth.idToken);
    console.log('Teacher created successfully!');

    // 2. Create Parent
    console.log('2. Creating Parent...');
    const parAuth = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, 'POST', {
        email: parentEmail, password: "SmartSlate@123", returnSecureToken: true
    });
    const parData = {
        uid: parAuth.localId,
        name: "Ramesh Kumar",
        email: parentEmail,
        phone: "+91 98480 11001",
        parentCode: "PAR-RAMESH-001",
        createdAt: new Date().toISOString()
    };
    await requestJson(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/parents/${parAuth.localId}`, 'PATCH', { fields: toFirestoreFields(parData) }, parAuth.idToken);
    console.log('Parent created successfully!');

    // 3. Create Student
    console.log('3. Creating Student...');
    const stuAuth = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, 'POST', {
        email: studentEmail, password: "SmartSlate@123", returnSecureToken: true
    });
    const stuData = {
        uid: stuAuth.localId,
        name: "Daya Nayak",
        email: studentEmail,
        studentId: "STU-DAYA8A-11",
        studentCode: "STU-DAYA8A-11",
        class: "8",
        className: "Class 8",
        section: "A",
        educationLevel: "secondary",
        schoolName: "SmartSlate High School",
        parentIds: [parAuth.localId],
        parentCode: "PAR-RAMESH-001",
        parentName: "Ramesh Kumar",
        teacherIds: ["TCH-PRIYA-MATH-01"],
        createdAt: new Date().toISOString()
    };
    await requestJson(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students/${stuAuth.localId}`, 'PATCH', { fields: toFirestoreFields(stuData) }, stuAuth.idToken);
    console.log('Student created successfully!');

    // 4. Create Note under student
    console.log('4. Creating Note...');
    const noteData = {
        noteId: "note_1",
        studentUid: stuAuth.localId,
        title: "Mathematics — Algebraic Expressions",
        subject: "Mathematics",
        content: "Algebraic expressions consist of variables and constants combined using arithmetic operations.",
        createdAt: new Date().toISOString()
    };
    await requestJson(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students/${stuAuth.localId}/notes/note_1`, 'PATCH', { fields: toFirestoreFields(noteData) }, stuAuth.idToken);
    console.log('Note created successfully under student!');

    // 5. Create Task under student
    console.log('5. Creating Task...');
    const taskData = {
        taskId: "task_1",
        title: "Complete Exercise 4.2",
        subject: "Mathematics",
        dueDate: "2026-08-25",
        status: "pending",
        createdAt: new Date().toISOString()
    };
    await requestJson(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students/${stuAuth.localId}/tasks/task_1`, 'PATCH', { fields: toFirestoreFields(taskData) }, stuAuth.idToken);
    console.log('Task created successfully under student!');
}

testFull().catch(console.error);
