const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { sendNotification } = require('../services/socketHandler');
const SyncQueueManager = require('../../../shared/services/syncQueue');

async function getStudentId(userId) {
    const student = await get("SELECT id, class_id FROM students WHERE user_id = ?", [userId]);
    return student;
}

// GET /api/assignments - Get student's assignments
router.get('/', authenticateToken, async (req, res) => {
    try {
        const student = await getStudentId(req.user.id);
        if (!student || !student.class_id) {
            return res.json({ assignments: [] });
        }

        const assignments = await all(
            `SELECT a.*, c.name as class_name, u.name as teacher_name,
                    s.id as submission_id, s.submitted_at, s.status as submission_status, s.content as submission_content, s.grade, s.feedback
             FROM assignments a
             JOIN classes c ON a.class_id = c.id
             JOIN users u ON a.created_by = u.id
             LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
             WHERE a.class_id = ?
             ORDER BY a.due_at ASC`,
            [student.id, student.class_id]
        );

        return res.json({ assignments });
    } catch (err) {
        console.error('Fetch assignments error:', err);
        res.status(500).json({ error: 'Error fetching assignments.' });
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

        const result = await run(
            `INSERT INTO submissions (assignment_id, student_id, content, status) 
             VALUES (?, ?, ?, 'submitted')
             ON CONFLICT(assignment_id, student_id) 
             DO UPDATE SET content = excluded.content, submitted_at = CURRENT_TIMESTAMP, status = 'submitted'`,
            [assignmentId, student.id, content.trim()]
        );

        // Enqueue to cloud sync queue
        await SyncQueueManager.enqueue('UPDATE', 'submission', assignmentId, {
            student_id: student.id,
            assignment_id: assignmentId,
            status: 'submitted',
            submitted_at: new Date().toISOString()
        });

        const io = req.app.get('io');
        sendNotification(io, assignment.created_by, 'submission', `${req.user.name} submitted assignment "${assignment.title}"`);

        res.json({ message: 'Assignment submitted successfully!' });
    } catch (err) {
        console.error('Submit assignment error:', err);
        res.status(500).json({ error: 'Error submitting assignment.' });
    }
});

module.exports = router;
