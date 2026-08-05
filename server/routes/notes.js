const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

async function getStudentId(userId) {
    const student = await get("SELECT id FROM students WHERE user_id = ?", [userId]);
    return student ? student.id : null;
}

// GET /api/notes - Get notes for a book OR search across all notes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { bookId, search, subject } = req.query;

        if (bookId) {
            const notes = await all(
                "SELECT * FROM notes WHERE book_id = ? ORDER BY updated_at DESC",
                [bookId]
            );
            return res.json({ notes });
        }

        // Search / history query across all notebooks for current student or linked student
        let studentId = null;
        if (req.user.role === 'student') {
            studentId = await getStudentId(req.user.id);
        } else if (req.query.studentId) {
            studentId = req.query.studentId;
        }

        if (!studentId) {
            return res.status(400).json({ error: 'Student profile required.' });
        }

        let sql = `
            SELECT n.*, b.title as book_title, b.subject as book_subject
            FROM notes n
            JOIN books b ON n.book_id = b.id
            WHERE b.student_id = ?
        `;
        const params = [studentId];

        if (subject && subject !== 'all') {
            sql += ` AND b.subject = ?`;
            params.push(subject);
        }

        if (search && search.trim()) {
            sql += ` AND (n.title LIKE ? OR n.content LIKE ?)`;
            params.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }

        sql += ` ORDER BY n.updated_at DESC`;

        const notes = await all(sql, params);
        res.json({ notes });
    } catch (err) {
        console.error('Fetch notes error:', err);
        res.status(500).json({ error: 'Error fetching notes.' });
    }
});

// GET /api/notes/history - Past notes view across all notebooks
router.get('/history', authenticateToken, async (req, res) => {
    try {
        let studentId = null;
        if (req.user.role === 'student') {
            studentId = await getStudentId(req.user.id);
        } else if (req.query.studentId) {
            studentId = req.query.studentId;
        }

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID required.' });
        }

        const notes = await all(
            `SELECT n.*, b.title as book_title, b.subject as book_subject
             FROM notes n
             JOIN books b ON n.book_id = b.id
             WHERE b.student_id = ?
             ORDER BY n.updated_at DESC`,
            [studentId]
        );
        res.json({ notes });
    } catch (err) {
        console.error('Notes history error:', err);
        res.status(500).json({ error: 'Error fetching note history.' });
    }
});

// GET /api/notes/shared-with-me - Notes shared with current student
router.get('/shared-with-me', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const studentId = await getStudentId(req.user.id);
        const sharedNotes = await all(
            `SELECT n.*, b.title as book_title, b.subject as book_subject, u.name as owner_name, ns.shared_at
             FROM note_shares ns
             JOIN notes n ON ns.note_id = n.id
             JOIN books b ON n.book_id = b.id
             JOIN students s ON b.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE ns.shared_with_student_id = ?
             ORDER BY ns.shared_at DESC`,
            [studentId]
        );
        res.json({ notes: sharedNotes });
    } catch (err) {
        console.error('Fetch shared notes error:', err);
        res.status(500).json({ error: 'Error fetching shared notes.' });
    }
});

// POST /api/notes - Create a new note inside a book
router.post('/', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const { bookId, title, rule_type, content } = req.body;
        if (!bookId) {
            return res.status(400).json({ error: 'bookId is required.' });
        }

        const studentId = await getStudentId(req.user.id);
        const book = await get("SELECT * FROM books WHERE id = ? AND student_id = ?", [bookId, studentId]);
        if (!book) {
            return res.status(403).json({ error: 'Book not found or access denied.' });
        }

        const validRule = ['ruled', 'double_ruled', 'four_ruled', 'half_ruled', 'plain'].includes(rule_type) ? rule_type : 'ruled';

        const result = await run(
            "INSERT INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [bookId, title || 'Untitled Note', validRule, content || '']
        );

        const newNote = await get("SELECT * FROM notes WHERE id = ?", [result.id]);
        res.status(201).json({ message: 'Note created successfully!', note: newNote });
    } catch (err) {
        console.error('Create note error:', err);
        res.status(500).json({ error: 'Error creating note.' });
    }
});

// PUT /api/notes/:id - Auto-save / Update note content & rule_type
router.put('/:id', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const noteId = req.params.id;
        const { title, rule_type, content } = req.body;

        const studentId = await getStudentId(req.user.id);
        const note = await get(
            "SELECT n.* FROM notes n JOIN books b ON n.book_id = b.id WHERE n.id = ? AND b.student_id = ?",
            [noteId, studentId]
        );

        if (!note) {
            return res.status(404).json({ error: 'Note not found or permission denied.' });
        }

        const newTitle = title !== undefined ? title : note.title;
        const newRule = rule_type !== undefined ? rule_type : note.rule_type;
        const newContent = content !== undefined ? content : note.content;

        await run(
            "UPDATE notes SET title = ?, rule_type = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [newTitle, newRule, newContent, noteId]
        );

        const updatedNote = await get("SELECT * FROM notes WHERE id = ?", [noteId]);
        res.json({ message: 'Note saved!', note: updatedNote });
    } catch (err) {
        console.error('Update note error:', err);
        res.status(500).json({ error: 'Error saving note.' });
    }
});

// DELETE /api/notes/:id
router.delete('/:id', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const noteId = req.params.id;
        const studentId = await getStudentId(req.user.id);

        const note = await get(
            "SELECT n.* FROM notes n JOIN books b ON n.book_id = b.id WHERE n.id = ? AND b.student_id = ?",
            [noteId, studentId]
        );

        if (!note) {
            return res.status(404).json({ error: 'Note not found or permission denied.' });
        }

        await run("DELETE FROM notes WHERE id = ?", [noteId]);
        res.json({ message: 'Note deleted successfully.' });
    } catch (err) {
        console.error('Delete note error:', err);
        res.status(500).json({ error: 'Error deleting note.' });
    }
});

// POST /api/notes/:id/share - Share note with classmate
router.post('/:id/share', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const noteId = req.params.id;
        const { targetStudentCode } = req.body;

        if (!targetStudentCode) {
            return res.status(400).json({ error: 'Target student code is required.' });
        }

        const studentId = await getStudentId(req.user.id);

        // Verify ownership of note
        const note = await get(
            "SELECT n.* FROM notes n JOIN books b ON n.book_id = b.id WHERE n.id = ? AND b.student_id = ?",
            [noteId, studentId]
        );
        if (!note) {
            return res.status(403).json({ error: 'Note not found or permission denied.' });
        }

        // Find target student
        const targetStudent = await get("SELECT id, user_id FROM students WHERE student_code = ?", [targetStudentCode.trim()]);
        if (!targetStudent) {
            return res.status(404).json({ error: `Student with code "${targetStudentCode}" not found.` });
        }

        if (targetStudent.id === studentId) {
            return res.status(400).json({ error: 'You cannot share a note with yourself.' });
        }

        await run(
            "INSERT OR IGNORE INTO note_shares (note_id, shared_with_student_id) VALUES (?, ?)",
            [noteId, targetStudent.id]
        );

        res.json({ message: `Note shared successfully with student ${targetStudentCode}!` });
    } catch (err) {
        console.error('Share note error:', err);
        res.status(500).json({ error: 'Error sharing note.' });
    }
});

module.exports = router;
