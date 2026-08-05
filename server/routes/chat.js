const express = require('express');
const router = express.Router();
const { get, all } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/chat/groups - Get available chat groups for user
router.get('/groups', authenticateToken, async (req, res) => {
    try {
        let classId = null;
        if (req.user.role === 'student') {
            const student = await get("SELECT class_id FROM students WHERE user_id = ?", [req.user.id]);
            if (student) classId = student.class_id;
        } else if (req.user.role === 'teacher') {
            const teacherClass = await get("SELECT id FROM classes WHERE teacher_id = ?", [req.user.id]);
            if (teacherClass) classId = teacherClass.id;
        }

        let groups = [];
        if (classId) {
            groups = await all("SELECT * FROM class_groups WHERE class_id = ?", [classId]);
        } else {
            groups = await all("SELECT * FROM class_groups");
        }

        res.json({ groups });
    } catch (err) {
        console.error('Fetch chat groups error:', err);
        res.status(500).json({ error: 'Error fetching chat groups.' });
    }
});

// GET /api/chat/messages - Fetch history for a group or direct contact
router.get('/messages', authenticateToken, async (req, res) => {
    try {
        const { groupId, receiverId } = req.query;

        if (groupId) {
            const messages = await all(
                `SELECT m.*, u.name as sender_name, u.role as sender_role
                 FROM messages m
                 JOIN users u ON m.sender_id = u.id
                 WHERE m.group_id = ?
                 ORDER BY m.sent_at ASC LIMIT 100`,
                [groupId]
            );
            return res.json({ messages });
        }

        if (receiverId) {
            const messages = await all(
                `SELECT m.*, u.name as sender_name, u.role as sender_role
                 FROM messages m
                 JOIN users u ON m.sender_id = u.id
                 WHERE (m.sender_id = ? AND m.receiver_id = ?) 
                    OR (m.sender_id = ? AND m.receiver_id = ?)
                 ORDER BY m.sent_at ASC LIMIT 100`,
                [req.user.id, receiverId, receiverId, req.user.id]
            );
            return res.json({ messages });
        }

        res.status(400).json({ error: 'Either groupId or receiverId parameter is required.' });
    } catch (err) {
        console.error('Fetch chat messages error:', err);
        res.status(500).json({ error: 'Error fetching messages.' });
    }
});

// GET /api/chat/direct-contacts - List potential 1-on-1 chat contacts
router.get('/direct-contacts', authenticateToken, async (req, res) => {
    try {
        let contacts = [];
        if (req.user.role === 'student') {
            // Find class teacher
            contacts = await all(
                `SELECT u.id, u.name, u.role, u.email
                 FROM users u
                 JOIN teachers t ON u.id = t.user_id
                 JOIN classes c ON t.user_id = c.teacher_id
                 JOIN students s ON c.id = s.class_id
                 WHERE s.user_id = ?`,
                [req.user.id]
            );
        } else if (req.user.role === 'parent') {
            // Find teachers of linked children
            contacts = await all(
                `SELECT DISTINCT u.id, u.name, u.role, u.email
                 FROM parent_links pl
                 JOIN students s ON pl.student_id = s.id
                 JOIN classes c ON s.class_id = c.id
                 JOIN users u ON c.teacher_id = u.id
                 WHERE pl.parent_user_id = ? AND pl.status = 'accepted'`,
                [req.user.id]
            );
        } else if (req.user.role === 'teacher') {
            // Find students and parents in teacher's classes
            contacts = await all(
                `SELECT DISTINCT u.id, u.name, u.role, u.email
                 FROM classes c
                 JOIN students s ON c.id = s.class_id
                 JOIN users u ON s.user_id = u.id
                 WHERE c.teacher_id = ?
                 UNION
                 SELECT DISTINCT u.id, u.name, u.role, u.email
                 FROM classes c
                 JOIN students s ON c.id = s.class_id
                 JOIN parent_links pl ON s.id = pl.student_id
                 JOIN users u ON pl.parent_user_id = u.id
                 WHERE c.teacher_id = ?`,
                [req.user.id, req.user.id]
            );
        }

        res.json({ contacts });
    } catch (err) {
        console.error('Fetch direct contacts error:', err);
        res.status(500).json({ error: 'Error fetching chat contacts.' });
    }
});

module.exports = router;
