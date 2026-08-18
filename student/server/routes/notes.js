const express = require('express');
const router = express.Router();
const path = require('path');
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

let syncManager = null;
try {
    const fs = require('fs');
    const candidates = [
        path.resolve(__dirname, '../../../shared/services/syncManager.js'),
        path.resolve(__dirname, '../../../../shared/services/syncManager.js'),
        path.resolve(__dirname, '../../shared/services/syncManager.js')
    ];
    for (const c of candidates) {
        if (fs.existsSync(c)) {
            syncManager = require(c);
            break;
        }
    }
} catch (e) {
    console.warn('[NOTES] SyncManager import warning:', e.message);
}

async function getStudentId(userId) {
    const studentUser = await get("SELECT id FROM users WHERE id = ? OR email = ?", [userId, userId]).catch(() => null);
    const resolvedId = studentUser?.id || userId;
    const student = await get("SELECT id FROM students WHERE user_id = ? OR id = ?", [resolvedId, resolvedId]).catch(() => null);
    return student ? student.id : resolvedId;
}

// GET /api/notes - Get notes for a book OR search across all notes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { bookId, search, subject } = req.query;

        if (bookId) {
            const notes = await all(
                "SELECT * FROM notes WHERE book_id = ? AND (deleted = 0 OR deleted IS NULL) ORDER BY updated_at DESC",
                [bookId]
            ).catch(() => []);
            return res.json({ notes: notes || [] });
        }

        let studentId = await getStudentId(req.user.id);
        if (!studentId && req.query.studentId) {
            studentId = req.query.studentId;
        }

        if (!studentId) {
            return res.status(400).json({ error: 'Student profile required.' });
        }

        let sql = `
            SELECT n.*, b.title as book_title, b.subject as book_subject
            FROM notes n
            JOIN books b ON n.book_id = b.id
            WHERE (b.student_id = ? OR b.student_id = ?) AND (n.deleted = 0 OR n.deleted IS NULL)
        `;
        const params = [studentId, req.user.id];

        if (subject && subject !== 'all') {
            sql += ` AND b.subject = ?`;
            params.push(subject);
        }

        if (search && search.trim()) {
            sql += ` AND (n.title LIKE ? OR n.content LIKE ?)`;
            params.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }

        sql += ` ORDER BY n.updated_at DESC`;

        const notes = await all(sql, params).catch(() => []);
        res.json({ notes: notes || [] });
    } catch (err) {
        console.error('Fetch notes error:', err);
        res.status(500).json({ error: 'Error fetching notes.' });
    }
});

// GET /api/notes/history - Past notes view across all notebooks
router.get('/history', authenticateToken, async (req, res) => {
    try {
        let studentId = await getStudentId(req.user.id);
        if (!studentId && req.query.studentId) {
            studentId = req.query.studentId;
        }

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID required.' });
        }

        const notes = await all(
            `SELECT n.*, b.title as book_title, b.subject as book_subject
             FROM notes n
             JOIN books b ON n.book_id = b.id
             WHERE b.student_id = ? AND n.deleted = 0
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
             WHERE ns.shared_with_student_id = ? AND n.deleted = 0
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
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { bookId, title, rule_type, content, drawing_data } = req.body;
        const studentId = await getStudentId(req.user.id, req.user.email);
        let targetBookId = bookId;

        if (!targetBookId) {
            let defaultBook = await get("SELECT id FROM books WHERE student_id = ? OR student_id = ? LIMIT 1", [studentId, req.user.id]);
            if (!defaultBook) {
                const bookRes = await run("INSERT INTO books (student_id, title, subject) VALUES (?, ?, ?)", [studentId || 1, 'General Notes', req.body.subject || 'General']);
                targetBookId = bookRes.id;
            } else {
                targetBookId = defaultBook.id;
            }
        }

        let book = await get(
            "SELECT * FROM books WHERE id = ? AND (student_id = ? OR student_id = ? OR student_id = 1 OR student_id IS NULL)", 
            [targetBookId, studentId, req.user.id]
        ).catch(() => null);

        if (!book) {
            book = await get("SELECT * FROM books WHERE id = ?", [targetBookId]).catch(() => null);
            if (!book) {
                const bookRes = await run("INSERT INTO books (student_id, title, subject) VALUES (?, ?, ?)", [studentId || 1, 'My Notebook', req.body.subject || 'General']);
                targetBookId = bookRes.id;
            }
        }

        const firebaseUid = req.user.uid || req.user.id;
        const validRule = ['ruled', 'double_ruled', 'four_ruled', 'half_ruled', 'plain'].includes(rule_type) ? rule_type : 'ruled';
        const noteIdString = `note_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        console.log(`[6TO10 NOTES] Current Firebase UID: ${firebaseUid}`);
        console.log(`[6TO10 NOTES] Note ID: ${noteIdString}`);
        console.log(`[6TO10 NOTES] Target Book ID: ${targetBookId}`);

        const result = await run(
            "INSERT INTO notes (firebase_uid, note_id, book_id, title, rule_type, content, drawing_data, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')",
            [firebaseUid, noteIdString, targetBookId, title || 'Untitled Note', validRule, content || '', drawing_data || '']
        );
        console.log(`[6TO10 NOTES] SQLite write: SUCCESS`);

        const payload = {
            note_id: noteIdString,
            book_id: targetBookId,
            title: title || 'Untitled Note',
            rule_type: validRule,
            content: content || '',
            drawing_data: drawing_data || ''
        };

        await run(
            `INSERT INTO sync_queue (firebase_uid, entity_type, entity, entity_id, operation, payload, status)
             VALUES (?, 'note', 'note', ?, 'CREATE', ?, 'pending')`,
            [firebaseUid, noteIdString, JSON.stringify(payload)]
        );
        console.log(`[6TO10 NOTES] sync_queue entry: SUCCESS`);

        console.log(`[6TO10 NOTES] Firebase sync started: highschool`);
        console.log(`[6TO10 NOTES] Firestore target path: students/${firebaseUid}/notes/${noteIdString}`);

        let syncStatusStr = 'QUEUED';
        if (syncManager) {
            const syncRes = await syncManager.syncAppQueue('highschool');
            syncStatusStr = (syncRes && syncRes.synced > 0) ? 'SUCCESS' : 'QUEUED';
        }
        console.log(`[6TO10 NOTES] Firebase sync result: ${syncStatusStr}`);

        const newNote = await get("SELECT * FROM notes WHERE id = ?", [result.id]);
        res.status(201).json({ message: 'Note created successfully!', note: newNote });
    } catch (err) {
        console.error('[6TO10 NOTES] Create note error:', err);
        res.status(500).json({ error: 'Error creating note.' });
    }
});

// PUT /api/notes/:id - Auto-save / Update note content & rule_type
router.put('/:id', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const { title, rule_type, content, drawing_data } = req.body;

        const studentId = await getStudentId(req.user.id);
        const note = await get(
            "SELECT n.* FROM notes n JOIN books b ON n.book_id = b.id WHERE (n.id = ? OR n.note_id = ?) AND b.student_id = ?",
            [idParam, idParam, studentId]
        );

        if (!note) {
            return res.status(404).json({ error: 'Note not found or permission denied.' });
        }

        const firebaseUid = req.user.uid || req.user.id;
        const noteIdString = note.note_id || `note_${note.id}`;
        const newTitle = title !== undefined ? title : note.title;
        const newRule = rule_type !== undefined ? rule_type : note.rule_type;
        const newContent = content !== undefined ? content : note.content;
        const newDrawing = drawing_data !== undefined ? drawing_data : note.drawing_data;

        console.log(`[6TO10 NOTES] Current Firebase UID: ${firebaseUid}`);
        console.log(`[6TO10 NOTES] Note ID: ${noteIdString}`);

        await run(
            "UPDATE notes SET firebase_uid = ?, title = ?, rule_type = ?, content = ?, drawing_data = ?, sync_status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [firebaseUid, newTitle, newRule, newContent, newDrawing, note.id]
        );
        console.log(`[6TO10 NOTES] SQLite write: SUCCESS`);

        const payload = {
            note_id: noteIdString,
            book_id: note.book_id,
            title: newTitle,
            rule_type: newRule,
            content: newContent,
            drawing_data: newDrawing
        };

        await run(
            `INSERT INTO sync_queue (firebase_uid, entity_type, entity_id, operation, payload, status)
             VALUES (?, 'note', ?, 'upsert', ?, 'pending')`,
            [firebaseUid, noteIdString, JSON.stringify(payload)]
        );
        console.log(`[6TO10 NOTES] sync_queue entry: SUCCESS`);

        console.log(`[6TO10 NOTES] Firebase sync started: highschool`);
        console.log(`[6TO10 NOTES] Firestore target path: students/${firebaseUid}/notes/${noteIdString}`);

        let syncStatusStr = 'QUEUED';
        if (syncManager) {
            const syncRes = await syncManager.syncAppQueue('highschool');
            syncStatusStr = (syncRes && syncRes.synced > 0) ? 'SUCCESS' : 'QUEUED';
        }
        console.log(`[6TO10 NOTES] Firebase sync result: ${syncStatusStr}`);

        const updatedNote = await get("SELECT * FROM notes WHERE id = ?", [note.id]);
        res.json({ message: 'Note saved!', note: updatedNote });
    } catch (err) {
        console.error('[6TO10 NOTES] Update note error:', err);
        res.status(500).json({ error: 'Error saving note.' });
    }
});

// DELETE /api/notes/:id
router.delete('/:id', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const studentId = await getStudentId(req.user.id);

        const note = await get(
            "SELECT n.* FROM notes n JOIN books b ON n.book_id = b.id WHERE (n.id = ? OR n.note_id = ?) AND b.student_id = ?",
            [idParam, idParam, studentId]
        );

        if (!note) {
            return res.status(404).json({ error: 'Note not found or permission denied.' });
        }

        const firebaseUid = req.user.uid || req.user.id;
        const noteIdString = note.note_id || `note_${note.id}`;

        console.log(`[6TO10 NOTES] Current Firebase UID: ${firebaseUid}`);
        console.log(`[6TO10 NOTES] Note ID: ${noteIdString}`);

        await run("UPDATE notes SET deleted = 1, sync_status = 'pending' WHERE id = ?", [note.id]);
        console.log(`[6TO10 NOTES] SQLite write: SUCCESS (Soft delete)`);

        await run(
            `INSERT INTO sync_queue (firebase_uid, entity_type, entity_id, operation, payload, status)
             VALUES (?, 'note', ?, 'delete', ?, 'pending')`,
            [firebaseUid, noteIdString, JSON.stringify({ note_id: noteIdString })]
        );
        console.log(`[6TO10 NOTES] sync_queue entry: SUCCESS`);

        if (syncManager) {
            await syncManager.syncAppQueue('highschool');
        }

        res.json({ message: 'Note deleted successfully.' });
    } catch (err) {
        console.error('[6TO10 NOTES] Delete note error:', err);
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

        const note = await get(
            "SELECT n.* FROM notes n JOIN books b ON n.book_id = b.id WHERE n.id = ? AND b.student_id = ?",
            [noteId, studentId]
        );
        if (!note) {
            return res.status(403).json({ error: 'Note not found or permission denied.' });
        }

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
