const express = require('express');
const router = express.Router();
const db = require('../database/sqlite');

// GET /api/local/health
router.get('/health', async (req, res) => {
    try {
        res.json({
            database: 'sqlite',
            application: 'smartslate-highschool',
            status: 'ok',
            offlineReady: true,
            dbFile: db.dbPath
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/local/profile?uid=<firebase_uid>
router.get('/profile', async (req, res) => {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'firebase_uid is required' });
    try {
        const profile = await db.get('SELECT * FROM student_profiles WHERE firebase_uid = ?', [uid]);
        res.json({ profile: profile || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/local/profile
router.post('/profile', async (req, res) => {
    const { firebase_uid, student_id, name, email, class: studentClass, section } = req.body;
    if (!firebase_uid) return res.status(400).json({ error: 'firebase_uid is required' });

    try {
        await db.run(
            `INSERT INTO users (firebase_uid, email, role) VALUES (?, ?, 'student')
             ON CONFLICT(firebase_uid) DO UPDATE SET email = excluded.email, updated_at = CURRENT_TIMESTAMP`,
            [firebase_uid, email || '']
        );

        await db.run(
            `INSERT INTO student_profiles (firebase_uid, student_id, name, email, class, class_name, section)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(firebase_uid) DO UPDATE SET
             student_id = excluded.student_id,
             name = excluded.name,
             email = excluded.email,
             class = excluded.class,
             class_name = excluded.class_name,
             section = excluded.section,
             updated_at = CURRENT_TIMESTAMP`,
            [firebase_uid, student_id || '', name || 'Student', email || '', studentClass || '8', `Class ${studentClass || '8'}`, section || 'A']
        );

        console.log(`[SQLite HighSchool] Profile saved for UID: ${firebase_uid}`);
        res.json({ success: true, firebase_uid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/local/notes?uid=<firebase_uid>
router.get('/notes', async (req, res) => {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'firebase_uid is required' });
    try {
        const notes = await db.all('SELECT * FROM notes WHERE firebase_uid = ? AND deleted = 0 ORDER BY updated_at DESC', [uid]);
        res.json({ notes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/local/notes
router.post('/notes', async (req, res) => {
    const { firebase_uid, note_id, book_id, title, content, drawing_data } = req.body;
    if (!firebase_uid || !note_id) return res.status(400).json({ error: 'firebase_uid and note_id are required' });

    try {
        await db.run(
            `INSERT INTO notes (firebase_uid, note_id, book_id, title, content, drawing_data, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')
             ON CONFLICT(firebase_uid, note_id) DO UPDATE SET
             title = excluded.title,
             content = excluded.content,
             drawing_data = excluded.drawing_data,
             updated_at = CURRENT_TIMESTAMP,
             sync_status = 'pending'`,
            [firebase_uid, note_id, book_id || '', title || 'Untitled Note', content || '', drawing_data || '']
        );

        await db.run(
            `INSERT INTO sync_queue (firebase_uid, entity_type, entity_id, operation, payload)
             VALUES (?, 'note', ?, 'upsert', ?)`,
            [firebase_uid, note_id, JSON.stringify({ note_id, title, content })]
        );

        console.log(`[SQLite HighSchool] Note saved locally for UID: ${firebase_uid} (ID: ${note_id})`);
        res.json({ success: true, note_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
