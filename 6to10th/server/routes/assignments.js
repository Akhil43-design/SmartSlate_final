const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { sendNotification } = require('../services/socketHandler');

async function getStudentId(userId) {
    const student = await get("SELECT id, class_id FROM students WHERE user_id = ?", [userId]);
    return student;
}

// GET /api/assignments
router.get('/', authenticateToken, async (req, res) => {
    try {
        let classId = req.query.classId;

        if (req.user.role === 'student') {
            const student = await getStudentId(req.user.id);
            if (!student || !student.class_id) {
                return res.json({ assignments: [] });
            }
            classId = student.class_id;

            const assignments = await all(
                `SELECT a.*, c.name as class_name, u.name as teacher_name,
                        s.id as submission_id, s.submitted_at, s.status as submission_status, s.content as submission_content, s.grade, s.feedback
                 FROM assignments a
                 JOIN classes c ON a.class_id = c.id
                 JOIN users u ON a.created_by = u.id
                 LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
                 WHERE a.class_id = ?
                 ORDER BY a.due_at ASC`,
                [student.id, classId]
            );

            return res.json({ assignments });
        }

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

        // Send notifications to all students in class
        const studentsInClass = await all("SELECT user_id FROM students WHERE class_id = ?", [class_id]);
        const io = req.app.get('io');
        for (const st of studentsInClass) {
            sendNotification(io, st.user_id, 'assignment', `New Assignment Published: "${title.trim()}"`);
        }

        res.status(201).json({ message: 'Assignment published successfully!', assignmentId: result.id });
    } catch (err) {
        console.error('Create assignment error:', err);
        res.status(500).json({ error: 'Error publishing assignment.' });
    }
});

// POST /api/assignments/:id/submit - Submit assignment (Student)
router.post('/:id/submit', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Submission content cannot be empty.' });
        }

        const student = await getStudentId(req.user.id);
        if (!student) return res.status(400).json({ error: 'Student profile not found.' });

        const assignment = await get("SELECT * FROM assignments WHERE id = ?", [assignmentId]);
        if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

        await run(
            `INSERT INTO submissions (assignment_id, student_id, content, status) 
             VALUES (?, ?, ?, 'submitted')
             ON CONFLICT(assignment_id, student_id) 
             DO UPDATE SET content = excluded.content, submitted_at = CURRENT_TIMESTAMP, status = 'submitted'`,
            [assignmentId, student.id, content.trim()]
        );

        // Notify teacher
        const io = req.app.get('io');
        sendNotification(io, assignment.created_by, 'submission', `${req.user.name} submitted assignment "${assignment.title}"`);

        res.json({ message: 'Assignment submitted successfully!' });
    } catch (err) {
        console.error('Submit assignment error:', err);
        res.status(500).json({ error: 'Error submitting assignment.' });
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

module.exports = router;
