const https = require('https');
const http = require('http');
const { firebaseConfig } = require('../shared/firebase/firebaseConfig');

const apiKey = firebaseConfig.apiKey;

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

function httpGet(url, token) {
    return new Promise((resolve) => {
        const parsed = new URL(url);
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        http.get({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            headers
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        }).on('error', (err) => resolve({ status: 500, error: err.message }));
    });
}

async function testDebug() {
    const studentAuth = await signIn('student_051@smartslate.test', 'SmartSlate@123');
    const token = studentAuth.data?.idToken;

    console.log('Testing GET /api/debug/student/8jKDKLlaa4SwPTipZ9mSIDyqWvH2 on Port 3001...');
    const res3001 = await httpGet('http://localhost:3001/api/debug/student/8jKDKLlaa4SwPTipZ9mSIDyqWvH2', token);
    console.log('Port 3001 Status:', res3001.status);
    console.log('Port 3001 Response:', JSON.stringify(res3001.data, null, 2));

    console.log('\nTesting GET /api/debug/student/8jKDKLlaa4SwPTipZ9mSIDyqWvH2 on Port 3003...');
    const res3003 = await httpGet('http://localhost:3003/api/debug/student/8jKDKLlaa4SwPTipZ9mSIDyqWvH2', token);
    console.log('Port 3003 Status:', res3003.status);
    console.log('Port 3003 Response:', JSON.stringify(res3003.data, null, 2));
}

testDebug().catch(console.error);
