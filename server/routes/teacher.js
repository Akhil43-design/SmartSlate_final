const express = require('express');
const router = express.Router();
const { get, all } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// GET /api/teacher/classes - Get classes taught by teacher
router.get('/classes', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const classes = await all(
            `SELECT c.*, COUNT(s.id) as student_count
             FROM classes c
             LEFT JOIN students s ON c.id = s.class_id
             WHERE c.teacher_id = ?
             GROUP BY c.id`,
            [req.user.id]
        );

        res.json({ classes });
    } catch (err) {
        console.error('Fetch teacher classes error:', err);
        res.status(500).json({ error: 'Error fetching classes.' });
    }
});

// GET /api/teacher/students/:classId - Get students list with progress snapshot
router.get('/students/:classId', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const classId = req.params.classId;
        const students = await all(
            `SELECT s.id as student_id, s.student_code, u.name as student_name, u.email,
                    COUNT(DISTINCT sub.id) as submissions_count,
                    AVG((er.score / er.total_points) * 100) as avg_exam_score
             FROM students s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN submissions sub ON s.id = sub.student_id
             LEFT JOIN exam_results er ON s.id = er.student_id
             WHERE s.class_id = ?
             GROUP BY s.id
             ORDER BY u.name ASC`,
            [classId]
        );

        res.json({ students });
    } catch (err) {
        console.error('Fetch class students error:', err);
        res.status(500).json({ error: 'Error fetching class students.' });
    }
});

module.exports = router;
