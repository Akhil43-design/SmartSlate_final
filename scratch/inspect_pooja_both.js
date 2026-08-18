const https = require('https');
const { get } = require('../shared/db/database');

async function check() {
    const student = await get("SELECT * FROM students WHERE firebase_uid = '8jKDKLlaa4SwPTipZ9mSIDyqWvH2'");
    console.log('SQLite student record for Pooja:');
    console.log(student);

    const projectId = 'smartslate-bd117';
    const docPath = 'students/8jKDKLlaa4SwPTipZ9mSIDyqWvH2';
    
    https.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
            console.log('Firestore document for Pooja:');
            console.log(body);
            process.exit(0);
        });
    });
}

check().catch(console.error);
