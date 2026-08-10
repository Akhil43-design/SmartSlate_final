const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// GET /api/exams
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'teacher') {
            const exams = await all(
                `SELECT e.*, c.name as class_name, COUNT(er.id) as submissions_count
                 FROM exams e
                 JOIN classes c ON e.class_id = c.id
                 LEFT JOIN exam_results er ON e.id = er.exam_id
                 WHERE e.created_by = ?
                 GROUP BY e.id
                 ORDER BY e.created_at DESC`,
                [req.user.id]
            );
            return res.json({ exams });
        }

        if (req.user.role === 'parent') {
            const { studentId } = req.query;
            if (!studentId) return res.status(400).json({ error: 'studentId is required' });

            const student = await get("SELECT class_id FROM students WHERE id = ?", [studentId]);
            if (!student) return res.json({ exams: [] });

            const exams = await all(
                `SELECT e.id, e.title, e.duration_minutes, e.start_time, e.end_time,
                        er.score, er.total_points, er.submitted_at
                 FROM exams e
                 LEFT JOIN exam_results er ON e.id = er.exam_id AND er.student_id = ?
                 WHERE e.class_id = ?
                 ORDER BY e.created_at DESC`,
                [studentId, student.class_id]
            );
            return res.json({ exams });
        }

        res.json({ exams: [] });
    } catch (err) {
        console.error('Fetch exams error:', err);
        res.status(500).json({ error: 'Error fetching exams.' });
    }
});

// POST /api/exams - Create new exam (Teacher)
router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const { class_id, title, questions, duration_minutes } = req.body;
        if (!class_id || !title || !questions) {
            return res.status(400).json({ error: 'class_id, title, and questions are required.' });
        }

        const result = await run(
            "INSERT INTO exams (class_id, title, questions_json, duration_minutes, created_by) VALUES (?, ?, ?, ?, ?)",
            [class_id, title.trim(), JSON.stringify(questions), duration_minutes || 30, req.user.id]
        );

        res.status(201).json({ message: 'Exam created successfully!', examId: result.id });
    } catch (err) {
        console.error('Create exam error:', err);
        res.status(500).json({ error: 'Error creating exam.' });
    }
});

// GET /api/exams/:id/results - Teacher view of all student scores for an exam
router.get('/:id/results', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const examId = req.params.id;
        const results = await all(
            `SELECT er.*, u.name as student_name, s.student_code
             FROM exam_results er
             JOIN students s ON er.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE er.exam_id = ?
             ORDER BY er.submitted_at DESC`,
            [examId]
        );

        res.json({ results });
    } catch (err) {
        console.error('Fetch exam results error:', err);
        res.status(500).json({ error: 'Error fetching exam results.' });
    }
});

module.exports = router;
