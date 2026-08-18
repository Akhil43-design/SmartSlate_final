const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const SyncQueueManager = require('../../../shared/services/syncQueue');

// GET /api/assignments - Get assignments for teacher or parent view
router.get('/', authenticateToken, async (req, res) => {
    try {
        let classId = req.query.classId;

        if (req.user.role === 'teacher') {
            let sql = `SELECT a.*, c.name as class_name, COUNT(sub.id) as submission_count
                       FROM assignments a
                       JOIN classes c ON a.class_id = c.id
                       LEFT JOIN submissions sub ON a.id = sub.assignment_id
                       WHERE a.created_by = ?`;
            const params = [req.user.id];

            if (classId) {
                sql += ` AND a.class_id = ?`;
                params.push(classId);
            }

            sql += ` GROUP BY a.id ORDER BY a.created_at DESC`;
            const assignments = await all(sql, params);
            return res.json({ assignments });
        }

        if (req.user.role === 'parent') {
            const { studentId } = req.query;
            if (!studentId) {
                return res.status(400).json({ error: 'studentId required for parent view' });
            }
            const student = await get("SELECT class_id FROM students WHERE id = ?", [studentId]);
            if (!student) return res.json({ assignments: [] });

            const assignments = await all(
                `SELECT a.*, c.name as class_name,
                        s.id as submission_id, s.submitted_at, s.status as submission_status, s.grade
                 FROM assignments a
                 JOIN classes c ON a.class_id = c.id
                 LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
                 WHERE a.class_id = ?
                 ORDER BY a.due_at ASC`,
                [studentId, student.class_id]
            );
            return res.json({ assignments });
        }

        res.json({ assignments: [] });
    } catch (err) {
        console.error('Fetch assignments error:', err);
        res.status(500).json({ error: 'Error fetching assignments.' });
    }
});

// POST /api/assignments - Create new assignment (Teacher)
router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const { class_id, title, description, due_at } = req.body;
        if (!class_id || !title || !due_at) {
            return res.status(400).json({ error: 'class_id, title, and due_at are required.' });
        }

        const result = await run(
            "INSERT INTO assignments (class_id, title, description, due_at, created_by) VALUES (?, ?, ?, ?, ?)",
            [class_id, title.trim(), description || '', due_at, req.user.id]
        );

        // Notify all students in class
        const studentsInClass = await all("SELECT user_id FROM students WHERE class_id = ?", [class_id]);
        for (const st of studentsInClass) {
            await run(
                "INSERT INTO notifications (user_id, type, content) VALUES (?, 'assignment', ?)",
                [st.user_id, `New Assignment Published: "${title.trim()}"`]
            );
        }

        // Enqueue to cloud sync queue
        await SyncQueueManager.enqueue('CREATE', 'assignment', result.id, {
            class_id,
            title: title.trim(),
            description: description || '',
            due_at,
            created_by: req.user.id
        });

        res.status(201).json({ message: 'Assignment published successfully!', assignmentId: result.id });
    } catch (err) {
        console.error('Create assignment error:', err);
        res.status(500).json({ error: 'Error publishing assignment.' });
    }
});

// GET /api/assignments/:id/submissions - View all submissions for an assignment (Teacher)
router.get('/:id/submissions', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const submissions = await all(
            `SELECT sub.*, u.name as student_name, s.student_code
             FROM submissions sub
             JOIN students s ON sub.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE sub.assignment_id = ?
             ORDER BY sub.submitted_at DESC`,
            [assignmentId]
        );

        res.json({ submissions });
    } catch (err) {
        console.error('Fetch submissions error:', err);
        res.status(500).json({ error: 'Error fetching submissions.' });
    }
});

// POST /api/assignments/grade/:submissionId - Grade submission (Teacher)
router.post('/grade/:submissionId', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const submissionId = req.params.submissionId;
        const { grade, feedback } = req.body;

        await run(
            "UPDATE submissions SET grade = ?, feedback = ?, status = 'graded' WHERE id = ?",
            [grade || 'A', feedback || '', submissionId]
        );

        res.json({ message: 'Submission graded successfully!' });
    } catch (err) {
        console.error('Grade submission error:', err);
        res.status(500).json({ error: 'Error grading submission.' });
    }
});

module.exports = router;
