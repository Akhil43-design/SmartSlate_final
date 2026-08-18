const https = require('https');

const API_KEY = "AIzaSyBOgNWBVqSYfMypeZS8NwRLOYpq7DY3-ls";
const PROJECT_ID = "smartslate-bd117";

async function testRunQuery() {
    const postData = JSON.stringify({
        structuredQuery: {
            from: [{ collectionId: 'students' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'studentCode' },
                    op: 'EQUAL',
                    value: { stringValue: 'STU-VAMS1A-11' }
                }
            },
            limit: 1
        }
    });

    const req = https.request({
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log('Body:', body);
        });
    });
    req.write(postData);
    req.end();
}

testRunQuery();
