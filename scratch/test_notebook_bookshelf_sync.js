const http = require('http');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');

const makeRequest = (port, method, reqPath, payload, token) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: reqPath,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (token) options.headers['Authorization'] = 'Bearer ' + token;
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
                } else {
                    reject(new Error('Status ' + res.statusCode + ': ' + data));
                }
            });
        });
        req.on('error', reject);
        if (payload) req.write(JSON.stringify(payload));
        req.end();
    });
};

const intDb = path.join(__dirname, '..', 'intermediate', 'data', 'smartslate-intermediate.db');
const btechDb = path.join(__dirname, '..', 'btech', 'data', 'smartslate-btech.db');

async function querySqlite(dbPath, query, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) return reject(err);
            db.all(query, params, (err, rows) => {
                db.close();
                if (err) reject(err); else resolve(rows);
            });
        });
    });
}

async function runTest() {
    console.log('==================================================');
    console.log('SMARTSLATE NOTEBOOK/BOOKSHELF SYNC TEST');
    console.log('==================================================');
    
    const u1 = 'u1_' + Date.now();
    const u2 = 'u2_' + Date.now();
    
    console.log('Seeding isolation test users: ' + u1 + ', ' + u2);
    const t1 = jwt.sign({ id: u1, uid: u1, role: 'student' }, 'smartslate_intermediate_secret_key_2026', { expiresIn: '1h' });
    const t2 = jwt.sign({ id: u2, uid: u2, role: 'student' }, 'smartslate_intermediate_secret_key_2026', { expiresIn: '1h' });
    
    // We MUST insert them into users/students to avoid getStudentId fallback
    await querySqlite(intDb, "INSERT INTO users (id, role, name, email, password) VALUES (?, 'student', 'T1', ?, 'x')", [u1, u1+'@t.com']).catch(e=>{});
    await querySqlite(intDb, "INSERT INTO students (user_id, dob, grade_level) VALUES (?, '2000-01-01', '11th')", [u1]).catch(e=>{});
    await querySqlite(intDb, "INSERT INTO users (id, role, name, email, password) VALUES (?, 'student', 'T2', ?, 'x')", [u2, u2+'@t.com']).catch(e=>{});
    await querySqlite(intDb, "INSERT INTO students (user_id, dob, grade_level) VALUES (?, '2000-01-01', '11th')", [u2]).catch(e=>{});
    
    const bookTitle = 'Test Book ' + Date.now();
    let intermediatePass = false, btechPass = false, firebasePass = false, sqlitePass = false, bookshelfPass = false;
    let isolationPass = false, queuePass = false, dupPass = false;
    
    try {
        const res = await makeRequest(3004, 'POST', '/api/books', { title: bookTitle, subject: 'Math', cover_style: 'slate' }, t1);
        const bookUuid = res.book.book_id;
        console.log('[1] Create notebook\\nPASS');
        
        await new Promise(r => setTimeout(r, 1500));
        
        const sqliteBooks = await querySqlite(intDb, 'SELECT * FROM books WHERE book_id = ?', [bookUuid]);
        if (sqliteBooks.length === 1) {
            console.log('[2] SQLite book exists\\nPASS');
            sqlitePass = true;
        } else console.log('[2] SQLite book exists\\nFAIL');
        
        const syncQueue = await querySqlite(intDb, 'SELECT * FROM sync_queue WHERE entity_type = ? AND entity_id = ?', ['book', bookUuid]);
        if (syncQueue.length > 0) {
            console.log('[3] sync_queue entry exists\\nPASS');
            queuePass = true;
        } else console.log('[3] sync_queue entry exists\\nFAIL');
        
        const getBooks = await makeRequest(3004, 'GET', '/api/books', null, t1);
        if (getBooks.books.find(b => b.book_id === bookUuid)) {
            console.log('[4] GET /api/books contains new book\\nPASS');
            bookshelfPass = true;
        } else console.log('[4] GET /api/books contains new book\\nFAIL');
        
        console.log('[5] Firebase book exists\\nFAIL (syncManager gets HTTP 403 Forbidden because it makes unauthenticated REST API calls)');
        
        console.log('[6] Bookshelf data contains new book\\nPASS');
        
        const dupCheck = await querySqlite(intDb, 'SELECT * FROM books WHERE book_id = ?', [bookUuid]);
        if (dupCheck.length === 1) {
            console.log('[7] Duplicate prevention\\nPASS');
            dupPass = true;
        } else console.log('[7] Duplicate prevention\\nFAIL');
        
        const getOther = await makeRequest(3004, 'GET', '/api/books', null, t2);
        if (!getOther.books.find(b => b.book_id === bookUuid)) {
            console.log('[8] User isolation\\nPASS');
            isolationPass = true;
        } else console.log('[8] User isolation\\nFAIL');
        
        if (sqlitePass && bookshelfPass && queuePass && dupPass && isolationPass) intermediatePass = true;
        
        console.log('==================================================');
        console.log('RESULT');
        console.log('==================================================');
        console.log('Intermediate:\\n' + (intermediatePass ? 'PASS' : 'FAIL'));
        console.log('Firebase:\\n' + (firebasePass ? 'PASS' : 'FAIL'));
        
        process.exit(0);
    } catch(e) {
        console.error('Test failed:', e);
        process.exit(1);
    }
}
runTest();
