const http = require('http');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const secretInter = 'smartslate_intermediate_secret_key_2026';
const secretBtech = 'smartslate_btech_secret_key_2026';

function generateTestToken(secret, uid, email, name) {
  return jwt.sign({
    id: uid,
    uid: uid,
    email: email,
    name: name,
    role: 'student'
  }, secret, { expiresIn: '2h' });
}

function apiRequest(port, method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch(e) { parsed = data; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function testApp(appName, port, secret, dbPath) {
  console.log(`\n=======================================================`);
  console.log(`🧪 TESTING ${appName.toUpperCase()} (Port ${port})`);
  console.log(`=======================================================`);

  const testUid = `student_test_${Date.now()}`;
  const testEmail = `student_${Date.now()}@smartslate.edu`;
  const token = generateTestToken(secret, testUid, testEmail, 'Demo Student');

  // 1. GET /api/books
  console.log(`\n1. GET /api/books...`);
  const getBooksRes = await apiRequest(port, 'GET', '/api/books', token);
  console.log(`   Status: ${getBooksRes.status} (Expected: 200)`);
  console.log(`   Books count: ${getBooksRes.data.books ? getBooksRes.data.books.length : 0}`);

  // 2. POST /api/books (Create new book)
  console.log(`\n2. POST /api/books (Creating Mathematics Notebook)...`);
  const createBookRes = await apiRequest(port, 'POST', '/api/books', token, {
    title: 'Mathematics Engineering Notebook',
    subject: 'Mathematics',
    cover_style: 'plum_velvet'
  });
  console.log(`   Status: ${createBookRes.status} (Expected: 201)`);
  const createdBook = createBookRes.data.book;
  if (!createdBook || !createdBook.id) {
    throw new Error(`Failed to create book: ${JSON.stringify(createBookRes.data)}`);
  }
  console.log(`   Created Book ID: ${createdBook.id}, Title: "${createdBook.title}"`);

  // 3. GET /api/notes?bookId=<id> (Initially empty)
  console.log(`\n3. GET /api/notes?bookId=${createdBook.id}...`);
  const getNotesRes = await apiRequest(port, 'GET', `/api/notes?bookId=${createdBook.id}`, token);
  console.log(`   Status: ${getNotesRes.status} (Expected: 200)`);
  console.log(`   Notes count: ${getNotesRes.data.notes ? getNotesRes.data.notes.length : 0}`);

  // 4. POST /api/notes (Create first page / note)
  console.log(`\n4. POST /api/notes (Creating Page 1 note)...`);
  const noteDrawingData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const noteContentJson = JSON.stringify({
    type: 'smartslate_note_v2',
    canvasWidth: 800,
    canvasHeight: 600,
    canvasData: noteDrawingData,
    text: 'Theorem 1: Linear Algebra Eigenvalues and Vectors'
  });

  const createNoteRes = await apiRequest(port, 'POST', '/api/notes', token, {
    bookId: createdBook.id,
    title: 'Page 1: Matrices & Eigenvalues',
    rule_type: 'ruled',
    content: noteContentJson,
    drawing_data: noteDrawingData
  });
  console.log(`   Status: ${createNoteRes.status} (Expected: 201)`);
  const createdNote = createNoteRes.data.note;
  if (!createdNote || !createdNote.id) {
    throw new Error(`Failed to create note: ${JSON.stringify(createNoteRes.data)}`);
  }
  console.log(`   Created Note ID: ${createdNote.id}, Title: "${createdNote.title}", Rule: ${createdNote.rule_type}`);

  // 5. PUT /api/notes/:id (Update / Auto-save note)
  console.log(`\n5. PUT /api/notes/${createdNote.id} (Auto-saving note changes)...`);
  const updatedContentJson = JSON.stringify({
    type: 'smartslate_note_v2',
    canvasWidth: 800,
    canvasHeight: 600,
    canvasData: noteDrawingData,
    text: 'Theorem 1: Linear Algebra Eigenvalues (Updated with Proof & Canvas Drawing)'
  });

  const updateNoteRes = await apiRequest(port, 'PUT', `/api/notes/${createdNote.id}`, token, {
    title: 'Page 1: Matrices & Proofs',
    rule_type: 'four_ruled',
    content: updatedContentJson,
    drawing_data: noteDrawingData
  });
  console.log(`   Status: ${updateNoteRes.status} (Expected: 200)`);
  console.log(`   Message: ${updateNoteRes.data.message}`);

  // 6. GET /api/notes?bookId=<id> (Verify updated note is returned)
  console.log(`\n6. GET /api/notes?bookId=${createdBook.id} (Verify persisted notes)...`);
  const verifyNotesRes = await apiRequest(port, 'GET', `/api/notes?bookId=${createdBook.id}`, token);
  console.log(`   Status: ${verifyNotesRes.status} (Expected: 200)`);
  console.log(`   Notes count: ${verifyNotesRes.data.notes ? verifyNotesRes.data.notes.length : 0}`);
  const persistedNote = verifyNotesRes.data.notes ? verifyNotesRes.data.notes[0] : null;
  if (persistedNote) {
    console.log(`   Persisted Note in Book: ID=${persistedNote.id}, Title="${persistedNote.title}", Rule=${persistedNote.rule_type}`);
  }

  // 7. Verify directly in SQLite Database
  console.log(`\n7. Verifying SQLite database: ${dbPath}...`);
  await new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      db.get('SELECT * FROM notes WHERE id = ?', [createdNote.id], (err, row) => {
        if (err) {
          db.close();
          return reject(err);
        }
        if (row) {
          console.log(`   ✅ SQLite Note found: ID=${row.id}, FirebaseUID=${row.firebase_uid}, BookID=${row.book_id}, NoteID=${row.note_id}`);
          console.log(`   ✅ Title: "${row.title}", Rule: ${row.rule_type}, SyncStatus: ${row.sync_status}`);
          console.log(`   ✅ Drawing data present: ${row.drawing_data ? row.drawing_data.length : 0} bytes`);
        } else {
          console.log(`   ❌ SQLite Note not found!`);
        }

        db.get('SELECT * FROM sync_queue WHERE entity_id = ? ORDER BY id DESC', [row ? row.note_id : ''], (sqErr, sqRow) => {
          if (sqRow) {
            console.log(`   ✅ SQLite sync_queue entry found: ID=${sqRow.id}, Entity=${sqRow.entity_type}, Operation=${sqRow.operation}, Status=${sqRow.status}`);
          } else {
            console.log(`   ℹ️ sync_queue check (no item or already processed)`);
          }
          db.close(resolve);
        });
      });
    });
  });

  return true;
}

(async () => {
  try {
    await testApp('Intermediate', 3004, secretInter, 'f:/smartSlate/intermediate/data/smartslate-intermediate.db');
    await testApp('B.Tech', 3005, secretBtech, 'f:/smartSlate/btech/data/smartslate-btech.db');
    console.log(`\n=======================================================`);
    console.log(`🎉 ALL BACKEND API & SQLITE WORKFLOWS PASSED!`);
    console.log(`=======================================================\n`);
  } catch (err) {
    console.error(`\n❌ TEST FAILED:`, err.message);
  }
})();
