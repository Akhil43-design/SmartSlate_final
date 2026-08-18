const https = require('https');
const { firebaseConfig } = require('../shared/firebase/firebaseConfig');

const apiKey = firebaseConfig.apiKey;
const projectId = firebaseConfig.projectId || 'smartslate-bd117';

function signInWithPassword(email, password = 'SmartSlate@123') {
    return new Promise((resolve) => {
        const payload = JSON.stringify({
            email,
            password,
            returnSecureToken: true
        });
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
                } catch(e) {
                    resolve({ status: res.statusCode, data });
                }
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
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
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

function queryFirestoreCollection(collection, idToken) {
    return new Promise((resolve) => {
        const path = `/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
        const req = https.request({
            hostname: 'firestore.googleapis.com',
            path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
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

function parseFields(fields = {}) {
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
            res[k] = parseFields(valObj.mapValue.fields);
        } else {
            res[k] = valObj;
        }
    }
    return res;
}

async function test() {
    console.log('Testing Teacher sign in...');
    const teacherAuth = await signInWithPassword('teacher_math_hs@smartslate.test');
    console.log('Teacher Auth Status:', teacherAuth.status, 'UID:', teacherAuth.data?.localId);

    console.log('\nTesting Student sign in (Pooja Reddy)...');
    const studentAuth = await signInWithPassword('student_051@smartslate.test');
    console.log('Student Auth Status:', studentAuth.status, 'UID:', studentAuth.data?.localId);

    if (studentAuth.data?.idToken) {
        const idToken = studentAuth.data.idToken;
        const uid = studentAuth.data.localId;
        const profile = await getFirestoreDoc('students', uid, idToken);
        console.log('\n[STUDENT PROFILE IN FIRESTORE]');
        console.log('Status:', profile.status);
        if (profile.data?.fields) {
            console.log('Fields:', parseFields(profile.data.fields));
        }

        console.log('\n[EXAMS IN FIRESTORE]');
        const exams = await queryFirestoreCollection('exams', idToken);
        console.log('Exams collection status:', exams.status);
        if (exams.data?.documents) {
            console.log(`Found ${exams.data.documents.length} exam(s):`);
            for (const doc of exams.data.documents) {
                console.log('Doc:', doc.name.split('/').pop(), parseFields(doc.fields));
            }
        } else {
            console.log('Exams payload:', exams.data);
        }
    }
}

test().catch(console.error);
