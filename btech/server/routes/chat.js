const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

async function getStudentId(userId) {
    const student = await get("SELECT id, class_id FROM students WHERE user_id = ?", [userId]);
    return student;
}

// GET /api/chat/groups - Get student's class chat groups
router.get('/groups', authenticateToken, async (req, res) => {
    try {
        const student = await getStudentId(req.user.id);
        if (!student || !student.class_id) return res.json({ groups: [] });

        const groups = await all("SELECT * FROM class_groups WHERE class_id = ?", [student.class_id]);
        res.json({ groups });
    } catch (err) {
        console.error('Fetch chat groups error:', err);
        res.status(500).json({ error: 'Error fetching chat groups.' });
    }
});

// GET /api/chat/messages - Get messages for a group or classmate
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
                 WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
                 ORDER BY m.sent_at ASC LIMIT 100`,
                [req.user.id, receiverId, receiverId, req.user.id]
            );
            return res.json({ messages });
        }

        res.json({ messages: [] });
    } catch (err) {
        console.error('Fetch messages error:', err);
        res.status(500).json({ error: 'Error fetching messages.' });
    }
});

module.exports = router;
