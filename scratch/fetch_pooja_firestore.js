const https = require('https');
const { firebaseConfig } = require('../shared/services/firebaseAuthService');

function signIn(email, password = 'SmartSlate@123') {
    return new Promise((resolve) => {
        const payload = JSON.stringify({ email, password, returnSecureToken: true });
        const req = https.request({
            hostname: 'identitytoolkit.googleapis.com',
            path: `/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.write(payload);
        req.end();
    });
}

async function run() {
    const auth = await signIn('student_051@smartslate.test');
    const token = auth.idToken;
    const uid = auth.localId;
    console.log('Signed in UID:', uid);

    const projectId = 'smartslate-bd117';
    const docPath = `students/${uid}`;

    https.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
            console.log('Firestore doc for student:');
            console.log(body);
            process.exit(0);
        });
    });
}

run().catch(console.error);
