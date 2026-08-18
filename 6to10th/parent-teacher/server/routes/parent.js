const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// POST /api/parent/link - Link parent to student via student_code
router.post('/link', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const { studentCode } = req.body;
        if (!studentCode || !studentCode.trim()) {
            return res.status(400).json({ error: 'Student code is required.' });
        }

        const student = await get(
            `SELECT s.id, s.user_id, s.student_code, u.name as student_name, c.name as class_name
             FROM students s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN classes c ON s.class_id = c.id
             WHERE s.student_code = ?`,
            [studentCode.trim().toUpperCase()]
        );

        if (!student) {
            return res.status(404).json({ error: `No student found matching code "${studentCode}".` });
        }

        await run(
            `INSERT INTO parent_links (parent_user_id, student_id, status)
             VALUES (?, ?, 'accepted')
             ON CONFLICT(parent_user_id, student_id) DO UPDATE SET status = 'accepted'`,
            [req.user.id, student.id]
        );

        res.json({
            message: `Successfully linked account to student ${student.student_name} (${student.student_code})!`,
            student
        });
    } catch (err) {
        console.error('Link student error:', err);
        res.status(500).json({ error: 'Error linking student account.' });
    }
});

// GET /api/parent/children - List all linked children for parent
router.get('/children', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const children = await all(
            `SELECT s.id as student_id, s.student_code, u.name as student_name, u.email as student_email, c.name as class_name, pl.status
             FROM parent_links pl
             JOIN students s ON pl.student_id = s.id
             JOIN users u ON s.user_id = u.id
             LEFT JOIN classes c ON s.class_id = c.id
             WHERE pl.parent_user_id = ?`,
            [req.user.id]
        );

        res.json({ children });
    } catch (err) {
        console.error('Fetch parent children error:', err);
        res.status(500).json({ error: 'Error fetching linked children.' });
    }
});

// GET /api/parent/web-activity/:studentId - Web search audit log for student
router.get('/web-activity/:studentId', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const studentId = req.params.studentId;

        const link = await get("SELECT * FROM parent_links WHERE parent_user_id = ? AND student_id = ?", [req.user.id, studentId]);
        if (!link) {
            return res.status(403).json({ error: 'Access denied. You are not linked to this student.' });
        }

        const activity = await all(
            "SELECT * FROM web_activity WHERE student_id = ? ORDER BY timestamp DESC LIMIT 100",
            [studentId]
        );

        res.json({ activity });
    } catch (err) {
        console.error('Fetch web activity error:', err);
        res.status(500).json({ error: 'Error fetching web activity.' });
    }
});

// GET /api/parent/progress-card/:studentId - Comprehensive Progress Card Report
router.get('/progress-card/:studentId', authenticateToken, requireRole('parent'), async (req, res) => {
    try {
        const studentId = req.params.studentId;

        const link = await get("SELECT * FROM parent_links WHERE parent_user_id = ? AND student_id = ?", [req.user.id, studentId]);
        if (!link) {
            return res.status(403).json({ error: 'Access denied. You are not linked to this student.' });
        }

        const student = await get(
            `SELECT s.id, s.student_code, u.name as student_name, c.name as class_name
             FROM students s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN classes c ON s.class_id = c.id
             WHERE s.id = ?`,
            [studentId]
        );

        const examStats = await get(
            `SELECT COUNT(id) as total_exams, AVG(score) as avg_score FROM exam_results WHERE student_id = ?`,
            [studentId]
        );

        const assignmentStats = await get(
            `SELECT COUNT(id) as submitted_assignments FROM submissions WHERE student_id = ?`,
            [studentId]
        );

        const attendanceStats = await all(
            `SELECT status, COUNT(id) as count FROM attendance WHERE student_id = ? GROUP BY status`,
            [studentId]
        );

        res.json({
            student,
            exams: {
                total: examStats.total_exams || 0,
                avgScore: Math.round(examStats.avg_score || 0)
            },
            assignments: {
                submitted: assignmentStats.submitted_assignments || 0
            },
            attendance: attendanceStats
        });
    } catch (err) {
        console.error('Fetch progress card error:', err);
        res.status(500).json({ error: 'Error fetching progress report.' });
    }
});

module.exports = router;
