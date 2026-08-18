const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

async function ensureBooksColumns() {
    try {
        await run("ALTER TABLE books ADD COLUMN firebase_uid TEXT");
    } catch(e) {}
    try {
        await run("ALTER TABLE books ADD COLUMN student_id INTEGER");
    } catch(e) {}
    try {
        await run("ALTER TABLE books ADD COLUMN book_id TEXT");
    } catch(e) {}
    try {
        await run("ALTER TABLE books ADD COLUMN description TEXT");
    } catch(e) {}
    try {
        await run("ALTER TABLE books ADD COLUMN cover_style TEXT");
    } catch(e) {}
}

async function getStudentId(userId) {
    if (!userId) return 1;
    try {
        let student = await get("SELECT id FROM students WHERE user_id = ? OR student_code = ?", [userId, String(userId)]);
        if (student) return student.id;

        let userRow = await get("SELECT id FROM users WHERE student_code = ? OR email = ?", [String(userId), `${userId}@smartslate.edu`]);
        if (!userRow) {
            const insUser = await run(
                "INSERT INTO users (name, role, email, password_hash, student_code) VALUES (?, 'student', ?, 'firebase_managed', ?)",
                [`Student ${userId}`, `${userId}@smartslate.edu`, String(userId)]
            );
            userRow = { id: insUser.id };
        }

        let studentRow = await get("SELECT id FROM students WHERE user_id = ?", [userRow.id]);
        if (!studentRow) {
            const insStudent = await run(
                "INSERT INTO students (user_id, student_code) VALUES (?, ?)",
                [userRow.id, String(userId)]
            );
            studentRow = { id: insStudent.id };
        }

        return studentRow.id;
    } catch (e) {
        console.warn('[getStudentId] Fallback student ID allocation:', e.message);
        const first = await get("SELECT id FROM students LIMIT 1");
        return first ? first.id : 1;
    }
}

// GET /api/books - Get student's books
router.get('/', authenticateToken, async (req, res) => {
    try {
        await ensureBooksColumns();
        const uid = req.user?.uid || req.user?.id || 'guest';
        const studentId = await getStudentId(uid);

        const books = await all(
            `SELECT b.*, COUNT(n.id) as note_count 
             FROM books b 
             LEFT JOIN notes n ON (b.id = n.book_id OR b.book_id = n.book_id)
             WHERE b.firebase_uid = ? OR b.student_id = ? OR b.student_id = ?
             GROUP BY b.id 
             ORDER BY b.created_at DESC`,
            [uid, studentId, String(studentId)]
        );

        res.status(200).json({ books: books || [] });
    } catch (err) {
        console.error('Fetch books error:', err);
        res.status(200).json({ books: [] });
    }
});

// POST /api/books - Create new book
router.post('/', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        await ensureBooksColumns();
        const { title, subject, cover_style, description } = req.body;
        if (!title || !subject) {
            return res.status(400).json({ error: 'Title and subject are required.' });
        }

        const uid = req.user?.uid || req.user?.id || 'guest';
        const studentId = await getStudentId(uid);
        const bookUuid = `book_${Date.now()}_${Math.floor(Math.random()*1000)}`;

        const result = await run(
            "INSERT INTO books (firebase_uid, student_id, book_id, title, subject, description, cover_style, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
            [uid, studentId, bookUuid, title.trim(), subject.trim(), description || '', cover_style || 'blue_linen']
        );

        // Queue for sync to Firebase
        const payload = {
            book_id: bookUuid,
            title: title.trim(),
            subject: subject.trim(),
            description: description || '',
            cover_style: cover_style || 'blue_linen',
            created_at: new Date().toISOString()
        };
        
        await run(
            `INSERT INTO sync_queue (firebase_uid, entity_type, entity_id, operation, payload, status)
             VALUES (?, 'book', ?, 'upsert', ?, 'pending')`,
            [uid, bookUuid, JSON.stringify(payload)]
        );

        // Try syncing immediately
        const syncManager = require('../../../shared/services/syncManager');
        if (syncManager && syncManager.syncAppQueue) {
            syncManager.syncAppQueue('btech').catch(err => console.error('Immediate sync failed:', err.message));
        }

        const newBook = await get("SELECT * FROM books WHERE id = ?", [result.id]);
        res.status(201).json({ message: 'Notebook created!', book: { ...newBook, id: newBook.id || bookUuid, note_count: 0 } });
    } catch (err) {
        console.error('Create book error:', err);
        res.status(500).json({ error: 'Error creating notebook.' });
    }
});

// DELETE /api/books/:id
router.delete('/:id', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        await ensureBooksColumns();
        const bookId = req.params.id;
        const uid = req.user?.uid || req.user?.id || 'guest';
        const studentId = await getStudentId(uid);

        const book = await get("SELECT * FROM books WHERE (id = ? OR book_id = ?) AND (firebase_uid = ? OR student_id = ?)", [bookId, bookId, uid, studentId]);
        if (!book) {
            return res.status(404).json({ error: 'Notebook not found or permission denied.' });
        }

        await run("DELETE FROM books WHERE id = ? OR book_id = ?", [bookId, bookId]);
        res.json({ message: 'Notebook deleted.' });
    } catch (err) {
        console.error('Delete book error:', err);
        res.status(500).json({ error: 'Error deleting notebook.' });
    }
});

module.exports = router;
