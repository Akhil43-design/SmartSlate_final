const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

async function getStudentId(userId) {
    if (!userId) return 1;
    const student = await get("SELECT id FROM students WHERE user_id = ? OR user_id = ?", [userId, String(userId)]);
    if (student) return student.id;
    const first = await get("SELECT id FROM students LIMIT 1");
    return first ? first.id : 1;
}

// GET /api/books - Get student's books
router.get('/', authenticateToken, async (req, res) => {
    try {
        let studentId = await getStudentId(req.user.id);
        if (!studentId && req.query.studentId) {
            studentId = req.query.studentId;
        }

        if (!studentId) {
            return res.status(400).json({ error: 'Student profile not found.' });
        }

        const books = await all(
            `SELECT b.*, COUNT(n.id) as note_count 
             FROM books b 
             LEFT JOIN notes n ON b.id = n.book_id 
             WHERE b.student_id = ? 
             GROUP BY b.id 
             ORDER BY b.created_at DESC`,
            [studentId]
        );

        res.json({ books });
    } catch (err) {
        console.error('Fetch books error:', err);
        res.status(500).json({ error: 'Error fetching books.' });
    }
});

// POST /api/books - Create new book
router.post('/', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const { title, subject, cover_style } = req.body;
        if (!title || !subject) {
            return res.status(400).json({ error: 'Title and subject are required.' });
        }

        const studentId = await getStudentId(req.user.id);
        if (!studentId) {
            return res.status(400).json({ error: 'Student account not found.' });
        }

        const result = await run(
            "INSERT INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)",
            [studentId, title.trim(), subject.trim(), cover_style || 'blue_linen']
        );

        const newBook = await get("SELECT * FROM books WHERE id = ?", [result.id]);
        res.status(201).json({ message: 'Notebook created!', book: { ...newBook, note_count: 0 } });
    } catch (err) {
        console.error('Create book error:', err);
        res.status(500).json({ error: 'Error creating notebook.' });
    }
});

// DELETE /api/books/:id
router.delete('/:id', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const bookId = req.params.id;
        const studentId = await getStudentId(req.user.id);

        const book = await get("SELECT * FROM books WHERE id = ? AND student_id = ?", [bookId, studentId]);
        if (!book) {
            return res.status(404).json({ error: 'Notebook not found or permission denied.' });
        }

        await run("DELETE FROM books WHERE id = ?", [bookId]);
        res.json({ message: 'Notebook deleted.' });
    } catch (err) {
        console.error('Delete book error:', err);
        res.status(500).json({ error: 'Error deleting notebook.' });
    }
});

module.exports = router;
