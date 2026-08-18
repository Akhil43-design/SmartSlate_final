const express = require('express');
const router = express.Router();
const { get, all } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

async function getStudentId(userId) {
    const student = await get("SELECT id, class_id FROM students WHERE user_id = ?", [userId]);
    return student;
}

// GET /api/attendance - Student attendance record
router.get('/', authenticateToken, async (req, res) => {
    try {
        const student = await getStudentId(req.user.id);
        if (!student) return res.json({ attendance: [] });

        const attendance = await all(
            `SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC`,
            [student.id]
        );

        res.json({ attendance });
    } catch (err) {
        console.error('Fetch student attendance error:', err);
        res.status(500).json({ error: 'Error fetching attendance.' });
    }
});

module.exports = router;
