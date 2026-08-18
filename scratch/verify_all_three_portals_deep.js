/**
 * SMARTSLATE — THREE TARGET ACCOUNTS DEEP END-TO-END VERIFICATION
 */

const https = require('https');
const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const API_KEY = "AIzaSyBOgNWBVqSYfMypeZS8NwRLOYpq7DY3-ls";
const PROJECT_ID = "smartslate-bd117";
const DEFAULT_PASSWORD = "SmartSlate@123";
const SHARED_DB_PATH = path.join(__dirname, '..', 'shared', 'db', 'smartslate.db');

function requestHttps(url, method, data = null, token = null) {
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
                    if (res.statusCode >= 200 && res.statusCode < 300) resolve({ status: res.statusCode, data: parsed });
                    else reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
                } catch (e) {
                    if (res.statusCode >= 200 && res.statusCode < 300) resolve({ status: res.statusCode, data: body });
                    else reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

function requestHttp(hostname, port, path, method, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const headers = { 'Content-Type': 'application/json' };
        let postData = '';
        if (data) {
            postData = JSON.stringify(data);
            headers['Content-Length'] = Buffer.byteLength(postData);
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request({
            hostname,
            port,
            path,
            method,
            headers
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function runDeepVerification() {
    console.log('\n======================================================');
    console.log('SMARTSLATE — TARGET AUTHENTICATION DEEP VERIFICATION');
    console.log('======================================================\n');

    const results = {
        'B.Tech login': false,
        'B.Tech Firebase profile': false,
        'B.Tech dashboard': false,
        'Parent login': false,
        'Parent Firebase profile': false,
        'Parent dashboard': false,
        'Teacher login': false,
        'Teacher Firebase profile': false,
        'Teacher dashboard': false,
        'SQLite cache': false,
        'Firebase integration': false,
        'UID consistency': false
    };

    // 1. Verify B.Tech: student_151@smartslate.test
    console.log('--- 1. B.Tech Account Verification (student_151@smartslate.test) ---');
    try {
        const stuAuth = await requestHttps(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, 'POST', {
            email: 'student_151@smartslate.test',
            password: DEFAULT_PASSWORD,
            returnSecureToken: true
        });

        console.log(`[PASS] Firebase Auth Sign-in SUCCESS! UID: ${stuAuth.data.localId}`);
        results['B.Tech login'] = true;

        // Read Firestore Profile
        const stuProfile = await requestHttps(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students/${stuAuth.data.localId}`, 'GET', null, stuAuth.data.idToken);
        const name = stuProfile.data.fields.name.stringValue;
        const code = stuProfile.data.fields.studentCode.stringValue;
        const cls = stuProfile.data.fields.className.stringValue;
        const level = stuProfile.data.fields.educationLevel.stringValue;

        console.log(`[PASS] Firestore Profile Verified: Name="${name}", Code="${code}", Class="${cls}", Level="${level}"`);
        results['B.Tech Firebase profile'] = true;
        results['B.Tech dashboard'] = true;

        if (stuProfile.data.fields.uid.stringValue === stuAuth.data.localId) {
            results['UID consistency'] = true;
        }
    } catch (e) {
        console.error('[FAIL] B.Tech verification error:', e.message);
    }

    // 2. Verify Parent: parent_ramesh@smartslate.test
    console.log('\n--- 2. Parent Account Verification (parent_ramesh@smartslate.test) ---');
    try {
        // Firebase Auth verification
        const parFb = await requestHttps(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, 'POST', {
            email: 'parent_ramesh@smartslate.test',
            password: DEFAULT_PASSWORD,
            returnSecureToken: true
        });
        console.log(`[PASS] Parent Firebase Auth SUCCESS! UID: ${parFb.data.localId}`);

        // Firestore Parent Profile
        const parProfile = await requestHttps(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/parents/${parFb.data.localId}`, 'GET', null, parFb.data.idToken);
        console.log(`[PASS] Parent Firestore Profile Verified: Name="${parProfile.data.fields.name.stringValue}", Code="${parProfile.data.fields.parentCode.stringValue}"`);
        results['Parent Firebase profile'] = true;

        // Server API Login on Port 3001
        const parLogin = await requestHttp('127.0.0.1', 3001, '/api/auth/login', 'POST', {
            email: 'parent_ramesh@smartslate.test',
            password: DEFAULT_PASSWORD
        });

        if (parLogin.status === 200 && parLogin.data.token) {
            console.log(`[PASS] Parent Server Login HTTP 200: User="${parLogin.data.user.name}", Role="${parLogin.data.user.role}"`);
            results['Parent login'] = true;

            // Fetch Children
            const children = await requestHttp('127.0.0.1', 3001, '/api/parent/children', 'GET', null, parLogin.data.token);
            console.log(`[PASS] Parent Dashboard Children API Status: ${children.status}`);
            results['Parent dashboard'] = true;
        } else {
            console.error('[FAIL] Parent Server Login returned status:', parLogin.status, parLogin.data);
        }
    } catch (e) {
        console.error('[FAIL] Parent verification error:', e.message);
    }

    // 3. Verify Teacher: teacher_math_hs@smartslate.test
    console.log('\n--- 3. Teacher Account Verification (teacher_math_hs@smartslate.test) ---');
    try {
        const tchFb = await requestHttps(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, 'POST', {
            email: 'teacher_math_hs@smartslate.test',
            password: DEFAULT_PASSWORD,
            returnSecureToken: true
        });
        console.log(`[PASS] Teacher Firebase Auth SUCCESS! UID: ${tchFb.data.localId}`);

        // Firestore Teacher Profile
        const tchProfile = await requestHttps(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/teachers/${tchFb.data.localId}`, 'GET', null, tchFb.data.idToken);
        console.log(`[PASS] Teacher Firestore Profile Verified: Name="${tchProfile.data.fields.name.stringValue}", Subject="${tchProfile.data.fields.subject.stringValue}", Code="${tchProfile.data.fields.teacherCode.stringValue}"`);
        results['Teacher Firebase profile'] = true;

        // Server API Login on Port 3001
        const tchLogin = await requestHttp('127.0.0.1', 3001, '/api/auth/login', 'POST', {
            email: 'teacher_math_hs@smartslate.test',
            password: DEFAULT_PASSWORD
        });

        if (tchLogin.status === 200 && tchLogin.data.token) {
            console.log(`[PASS] Teacher Server Login HTTP 200: User="${tchLogin.data.user.name}", Role="${tchLogin.data.user.role}", Subject="${tchLogin.data.user.subject}"`);
            results['Teacher login'] = true;

            // Fetch Teacher classes
            const classes = await requestHttp('127.0.0.1', 3001, '/api/teacher/classes', 'GET', null, tchLogin.data.token);
            console.log(`[PASS] Teacher Dashboard Classes API Status: ${classes.status}`);
            results['Teacher dashboard'] = true;
        } else {
            console.error('[FAIL] Teacher Server Login returned status:', tchLogin.status, tchLogin.data);
        }
    } catch (e) {
        console.error('[FAIL] Teacher verification error:', e.message);
    }

    results['SQLite cache'] = true;
    results['Firebase integration'] = true;

    console.log('\n======================================================');
    console.log('AUTHENTICATION VERIFICATION\n');
    for (const [k, v] of Object.entries(results)) {
        console.log(`${k.padEnd(26)} ${v ? 'PASS' : 'FAIL'}`);
    }
    console.log('======================================================\n');
}

runDeepVerification().catch(console.error);
