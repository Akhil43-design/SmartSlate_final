/**
 * STEP 1: AUDIT EXISTING FIRESTORE DATA
 * Inspects all documents in Cloud Firestore via REST API using signed-in test admin token.
 */

const https = require('https');

const API_KEY = "AIzaSyBOgNWBVqSYfMypeZS8NwRLOYpq7DY3-ls";
const PROJECT_ID = "smartslate-bd117";

function postJson(url, data, token = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(data || {});
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request({
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
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
                    resolve(body);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function getJson(url, token = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request({
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
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
                    resolve(body);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function auditFirestore() {
    console.log('--- Step 1: Auditing Firebase Auth & Firestore ---');
    
    // Acquire an ID token to query Firestore with read permissions
    // Try signing up or signing in a temp auditor account
    const auditEmail = `auditor_${Date.now()}@smartslate.test`;
    const auditPass = "SmartSlate@123";

    let idToken = null;
    try {
        const authRes = await postJson(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
            email: auditEmail,
            password: auditPass,
            returnSecureToken: true
        });
        idToken = authRes.idToken;
        console.log('Authenticated auditor token acquired successfully.');
    } catch (err) {
        console.warn('Sign-up failed, trying sign-in:', err.message);
    }

    const collectionsToCheck = [
        'users',
        'students',
        'parents',
        'teachers',
        'student_parent_connections',
        'student_teacher_connections',
        'parent_links',
        'books',
        'notes',
        'assignments',
        'submissions',
        'tasks',
        'announcements',
        'exams',
        'exam_results',
        'attendance',
        'progress',
        'search_history',
        'classes'
    ];

    const auditSummary = {};

    for (const coll of collectionsToCheck) {
        try {
            const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${coll}?pageSize=100`;
            const data = await getJson(url, idToken);
            const docCount = data.documents ? data.documents.length : 0;
            auditSummary[coll] = {
                count: docCount,
                sampleDocNames: (data.documents || []).slice(0, 3).map(d => d.name.split('/').pop())
            };
            console.log(`Collection [${coll}]: ${docCount} documents found.`);
        } catch (err) {
            auditSummary[coll] = { error: err.message };
            console.log(`Collection [${coll}]: error -> ${err.message}`);
        }
    }

    console.log('\n--- Collection Audit Complete ---');
    console.log(JSON.stringify(auditSummary, null, 2));
}

auditFirestore().catch(console.error);
