/**
 * FIX & VERIFY 3 TARGET ACCOUNTS:
 * 1. student_151@smartslate.test (B.Tech)
 * 2. parent_ramesh@smartslate.test (Parent)
 * 3. teacher_math_hs@smartslate.test (Teacher)
 */

const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const API_KEY = "AIzaSyBOgNWBVqSYfMypeZS8NwRLOYpq7DY3-ls";
const PROJECT_ID = "smartslate-bd117";
const DEFAULT_PASSWORD = "SmartSlate@123";

const SHARED_DB_PATH = path.join(__dirname, '..', 'shared', 'db', 'smartslate.db');
const BTECH_DB = path.join(__dirname, '..', 'btech', 'data', 'smartslate-btech.db');

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function requestJson(url, method, data = null, token = null, retries = 5) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await new Promise((resolve, reject) => {
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
        } catch (err) {
            const isRetryable = err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'EAI_AGAIN' || err.message.includes('socket hang up') || err.message.includes('ECONNRESET');
            if (isRetryable && attempt < retries) {
                console.log(`[Network retry ${attempt}/${retries}] Retrying in 2s...`);
                await sleep(2000);
                continue;
            }
            throw err;
        }
    }
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
                    values: value.map(v => {
                        if (typeof v === 'string') return { stringValue: v };
                        if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
                        if (typeof v === 'object') return { mapValue: { fields: toFirestoreFields(v) } };
                        return { stringValue: String(v) };
                    })
                }
            };
        } else if (typeof value === 'object') {
            fields[key] = { mapValue: { fields: toFirestoreFields(value) } };
        }
    }
    return fields;
}

async function getOrCreateAuth(email, password = DEFAULT_PASSWORD) {
    try {
        const res = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, 'POST', {
            email,
            password,
            returnSecureToken: true
        });
        return { uid: res.localId, idToken: res.idToken, isNew: false };
    } catch (err) {
        if (err.message.includes('EMAIL_NOT_FOUND') || err.message.includes('INVALID_LOGIN_CREDENTIALS') || err.message.includes('INVALID_PASSWORD')) {
            try {
                const res = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, 'POST', {
                    email,
                    password,
                    returnSecureToken: true
                });
                return { uid: res.localId, idToken: res.idToken, isNew: true };
            } catch (signUpErr) {
                if (signUpErr.message.includes('EMAIL_EXISTS')) {
                    // Reset password to SmartSlate@123 using Admin or signIn
                    const res = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, 'POST', {
                        email,
                        password,
                        returnSecureToken: true
                    });
                    return { uid: res.localId, idToken: res.idToken, isNew: false };
                }
                throw signUpErr;
            }
        }
        throw err;
    }
}

async function fixAndVerify() {
    console.log('\n=============================================================');
    console.log('CHECKING AND VERIFYING TARGET ACCOUNTS');
    console.log('=============================================================\n');

    // 1. Check B.TECH: student_151@smartslate.test
    console.log('1. Checking B.Tech student: student_151@smartslate.test');
    const stuAuth = await getOrCreateAuth('student_151@smartslate.test', DEFAULT_PASSWORD);
    console.log(`- Auth UID: ${stuAuth.uid}`);

    const stuDocData = {
        uid: stuAuth.uid,
        name: "Meghana Vardhan",
        email: "student_151@smartslate.test",
        studentId: "STU-MEGHB1A-11",
        studentCode: "STU-MEGHB1A-11",
        class: "B1",
        className: "B.Tech 1st Year",
        section: "A",
        educationLevel: "btech",
        program: "B.Tech",
        branch: "Computer Science & Engineering",
        year: "1st Year",
        semester: "1st Semester",
        institution: "SmartSlate Institute of Technology",
        schoolName: "SmartSlate Institute of Technology",
        parentIds: ["kExI0Vtkw4Rka2mmobnSGxmKYjy1"],
        parentCode: "PAR-RAMES-101",
        parentName: "Ramesh Kumar",
        teacherIds: ["TCH-DRSUR-DATA-14"],
        createdAt: new Date().toISOString()
    };

    // Ensure Firestore document exists
    await requestJson(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students/${stuAuth.uid}`,
        'PATCH',
        { fields: toFirestoreFields(stuDocData) },
        stuAuth.idToken
    );

    // Verify read
    const stuRead = await requestJson(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students/${stuAuth.uid}`,
        'GET',
        null,
        stuAuth.idToken
    );
    console.log(`- Firestore Profile Verified: Name="${stuRead.fields.name.stringValue}", Class="${stuRead.fields.className.stringValue}", Code="${stuRead.fields.studentCode.stringValue}"`);

    // 2. Check PARENT: parent_ramesh@smartslate.test
    console.log('\n2. Checking Parent: parent_ramesh@smartslate.test');
    const parAuth = await getOrCreateAuth('parent_ramesh@smartslate.test', DEFAULT_PASSWORD);
    console.log(`- Auth UID: ${parAuth.uid}`);

    const parDocData = {
        uid: parAuth.uid,
        name: "Ramesh Kumar",
        email: "parent_ramesh@smartslate.test",
        phone: "+91 98480 11001",
        parentCode: "PAR-RAMES-101",
        role: "parent",
        createdAt: new Date().toISOString()
    };

    await requestJson(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/parents/${parAuth.uid}`,
        'PATCH',
        { fields: toFirestoreFields(parDocData) },
        parAuth.idToken
    );

    const parRead = await requestJson(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/parents/${parAuth.uid}`,
        'GET',
        null,
        parAuth.idToken
    );
    console.log(`- Firestore Profile Verified: Name="${parRead.fields.name.stringValue}", Code="${parRead.fields.parentCode.stringValue}"`);

    // 3. Check TEACHER: teacher_math_hs@smartslate.test
    console.log('\n3. Checking Teacher: teacher_math_hs@smartslate.test');
    const tchAuth = await getOrCreateAuth('teacher_math_hs@smartslate.test', DEFAULT_PASSWORD);
    console.log(`- Auth UID: ${tchAuth.uid}`);

    const tchDocData = {
        uid: tchAuth.uid,
        name: "Priya Sharma",
        email: "teacher_math_hs@smartslate.test",
        teacherCode: "TCH-PRIYA-MATH-05",
        subject: "Mathematics",
        classes: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
        educationLevel: "secondary",
        schoolName: "SmartSlate High School",
        role: "teacher",
        createdAt: new Date().toISOString()
    };

    await requestJson(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/teachers/${tchAuth.uid}`,
        'PATCH',
        { fields: toFirestoreFields(tchDocData) },
        tchAuth.idToken
    );

    const tchRead = await requestJson(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/teachers/${tchAuth.uid}`,
        'GET',
        null,
        tchAuth.idToken
    );
    console.log(`- Firestore Profile Verified: Name="${tchRead.fields.name.stringValue}", Subject="${tchRead.fields.subject.stringValue}", Code="${tchRead.fields.teacherCode.stringValue}"`);

    // 4. Update SQLite Users table password hashes for parent-teacher portal
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const sharedDb = new sqlite3.Database(SHARED_DB_PATH);

    await new Promise((resolve) => {
        sharedDb.serialize(() => {
            sharedDb.run(
                `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, parent_code)
                 VALUES (?, 'Ramesh Kumar', 'parent_ramesh@smartslate.test', ?, 'parent', 'PAR-RAMES-101')`,
                [parAuth.uid, passwordHash]
            );
            sharedDb.run(
                `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, teacher_code, subject)
                 VALUES (?, 'Priya Sharma', 'teacher_math_hs@smartslate.test', ?, 'teacher', 'TCH-PRIYA-MATH-05', 'Mathematics')`,
                [tchAuth.uid, passwordHash]
            );
            sharedDb.run(
                `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, student_code)
                 VALUES (?, 'Meghana Vardhan', 'student_151@smartslate.test', ?, 'student', 'STU-MEGHB1A-11')`,
                [stuAuth.uid, passwordHash]
            );
            resolve();
        });
    });
    sharedDb.close();

    console.log('\n=============================================================');
    console.log('ALL 3 TARGET ACCOUNTS VERIFIED AND SYNCHRONIZED!');
    console.log('=============================================================\n');
}

fixAndVerify().catch(console.error);
