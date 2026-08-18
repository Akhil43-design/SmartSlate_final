const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

async function getStudentId(userId, email = '') {
    if (!userId) return 1;
    const studentUser = await get("SELECT id, email, student_code FROM users WHERE id = ? OR email = ?", [userId, email || userId]).catch(() => null);
    const resolvedUserId = studentUser?.id || userId;
    const studentCode = studentUser?.student_code || '';
    const student = await get(
        "SELECT id FROM students WHERE user_id = ? OR id = ? OR (student_code IS NOT NULL AND student_code = ?)", 
        [resolvedUserId, resolvedUserId, studentCode]
    ).catch(() => null);
    return student ? student.id : resolvedUserId;
}

// GET /api/books - Get student's books
router.get('/', authenticateToken, async (req, res) => {
    try {
        let studentId = await getStudentId(req.user.id, req.user.email);
        if (!studentId && req.query.studentId) {
            studentId = req.query.studentId;
        }

        const books = await all(
            `SELECT b.*, COUNT(n.id) as note_count 
             FROM books b 
             LEFT JOIN notes n ON b.id = n.book_id AND (n.deleted = 0 OR n.deleted IS NULL)
             WHERE (b.student_id = ? OR b.student_id = ? OR b.student_id = 1 OR b.student_id IS NULL)
             GROUP BY b.id 
             ORDER BY b.created_at DESC`,
            [studentId, req.user.id]
        ).catch(() => []);

        res.json({ books: books || [] });
    } catch (err) {
        console.error('Fetch books error:', err);
        res.status(500).json({ error: 'Error fetching books.' });
    }
});

// POST /api/books - Create new book
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, subject, cover_style } = req.body;
        if (!title || !subject) {
            return res.status(400).json({ error: 'Title and subject are required.' });
        }

        const studentId = await getStudentId(req.user.id, req.user.email);

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
