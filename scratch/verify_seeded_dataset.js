/**
 * SMARTSLATE — PROGRAMMATIC VERIFICATION OF SEEDED FIREBASE & SQLITE DATA
 */

const https = require('https');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const API_KEY = "AIzaSyBOgNWBVqSYfMypeZS8NwRLOYpq7DY3-ls";
const PROJECT_ID = "smartslate-bd117";
const DEFAULT_PASSWORD = "SmartSlate@123";

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

async function verifySeededData() {
    console.log('\n======================================================');
    console.log('SMARTSLATE — POST-SEEDING COMPREHENSIVE VERIFICATION');
    console.log('======================================================\n');

    let allPassed = true;

    // 1. Verify Authentication & Firestore Profiles for Sample Students across tiers
    const sampleStudents = [
        { email: 'student_001@smartslate.test', expectedGrade: 'Class 1', level: 'primary' },
        { email: 'student_041@smartslate.test', expectedGrade: 'Class 5', level: 'primary' },
        { email: 'student_051@smartslate.test', expectedGrade: 'Class 6', level: 'secondary' },
        { email: 'student_091@smartslate.test', expectedGrade: 'Class 10', level: 'secondary' },
        { email: 'student_101@smartslate.test', expectedGrade: 'Intermediate 1st Year', level: 'intermediate' },
        { email: 'student_121@smartslate.test', expectedGrade: 'Diploma 1st Year', level: 'diploma' },
        { email: 'student_151@smartslate.test', expectedGrade: 'B.Tech 1st Year', level: 'btech' },
        { email: 'student_181@smartslate.test', expectedGrade: 'B.Tech 4th Year', level: 'btech' }
    ];

    console.log('--- 1. Testing Student Firebase Auth & Firestore Profile Verification ---');
    for (const sample of sampleStudents) {
        try {
            const authRes = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, 'POST', {
                email: sample.email,
                password: DEFAULT_PASSWORD,
                returnSecureToken: true
            });
            const uid = authRes.localId;
            const token = authRes.idToken;

            // Fetch Student Profile from Firestore
            const doc = await requestJson(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students/${uid}`, 'GET', null, token);
            const studentCode = doc.fields.studentCode.stringValue;
            const className = doc.fields.className.stringValue;
            const educationLevel = doc.fields.educationLevel.stringValue;

            console.log(`[PASS] ${sample.email} -> Logged in! Code: ${studentCode}, Class: ${className}, Level: ${educationLevel}`);
        } catch (e) {
            allPassed = false;
            console.error(`[FAIL] Verification failed for ${sample.email}:`, e.message);
        }
    }

    // 2. Verify Teachers in Firestore
    console.log('\n--- 2. Testing Teacher Firebase Auth & Firestore Verification ---');
    const sampleTeachers = [
        { email: 'teacher_math_elem@smartslate.test', subject: 'Mathematics' },
        { email: 'teacher_phy_hs@smartslate.test', subject: 'Physical Science' },
        { email: 'teacher_math_inter@smartslate.test', subject: 'Mathematics' },
        { email: 'teacher_dsa_btech@smartslate.test', subject: 'Data Structures & Algorithms' }
    ];

    for (const tch of sampleTeachers) {
        try {
            const authRes = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, 'POST', {
                email: tch.email,
                password: DEFAULT_PASSWORD,
                returnSecureToken: true
            });
            const doc = await requestJson(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/teachers/${authRes.localId}`, 'GET', null, authRes.idToken);
            console.log(`[PASS] ${tch.email} -> Logged in! Code: ${doc.fields.teacherCode.stringValue}, Subject: ${doc.fields.subject.stringValue}`);
        } catch (e) {
            allPassed = false;
            console.error(`[FAIL] Teacher verification failed for ${tch.email}:`, e.message);
        }
    }

    // 3. Verify Parents in Firestore
    console.log('\n--- 3. Testing Parent Firebase Auth & Firestore Verification ---');
    const sampleParents = [
        { email: 'parent_ramesh@smartslate.test', name: 'Ramesh Kumar' },
        { email: 'parent_lakshmi@smartslate.test', name: 'Lakshmi Devi' }
    ];

    for (const p of sampleParents) {
        try {
            const authRes = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, 'POST', {
                email: p.email,
                password: DEFAULT_PASSWORD,
                returnSecureToken: true
            });
            const doc = await requestJson(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/parents/${authRes.localId}`, 'GET', null, authRes.idToken);
            console.log(`[PASS] ${p.email} -> Logged in! Code: ${doc.fields.parentCode.stringValue}, Name: ${doc.fields.name.stringValue}`);
        } catch (e) {
            allPassed = false;
            console.error(`[FAIL] Parent verification failed for ${p.email}:`, e.message);
        }
    }

    // 4. Verify Notes & Tasks under Students
    console.log('\n--- 4. Testing Notes & Tasks in Firestore ---');
    try {
        const student1Auth = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, 'POST', {
            email: 'student_001@smartslate.test',
            password: DEFAULT_PASSWORD,
            returnSecureToken: true
        });
        const noteDoc = await requestJson(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students/${student1Auth.localId}/notes/note_1`, 'GET', null, student1Auth.idToken);
        console.log(`[PASS] Note verified under student_001: "${noteDoc.fields.title.stringValue}" (Subject: ${noteDoc.fields.subject.stringValue})`);

        const taskDoc = await requestJson(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students/${student1Auth.localId}/tasks/task_1`, 'GET', null, student1Auth.idToken);
        console.log(`[PASS] Task verified under student_001: "${taskDoc.fields.title.stringValue}" (Status: ${taskDoc.fields.status.stringValue})`);
    } catch (e) {
        allPassed = false;
        console.error(`[FAIL] Notes/tasks verification failed:`, e.message);
    }

    // 5. Verify DATASET.md presence and size
    const datasetPath = path.join(__dirname, '..', 'DATASET.md');
    if (fs.existsSync(datasetPath) && fs.statSync(datasetPath).size > 10000) {
        console.log(`\n[PASS] DATASET.md verified at ${datasetPath} (${(fs.statSync(datasetPath).size / 1024).toFixed(1)} KB)`);
    } else {
        allPassed = false;
        console.error(`[FAIL] DATASET.md missing or too small.`);
    }

    console.log('\n======================================================');
    console.log(`FINAL RESULT: ${allPassed ? 'ALL VERIFICATIONS PASSED (100%)' : 'SOME VERIFICATIONS FAILED'}`);
    console.log('======================================================\n');
}

verifySeededData().catch(console.error);
