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
        const studentUser = await get(
            "SELECT * FROM users WHERE id = ? OR email = ?",
            [req.user.id, req.user.email || '']
        ).catch(() => null);

        const sqliteUserId = studentUser?.id || req.user.id;
        const studentCode = studentUser?.student_code || req.user.student_code || '';

        const studentRow = await get(
            `SELECT s.id, s.class_id, s.student_code, COALESCE(c.name, 'Class 8') as class_name
             FROM students s
             LEFT JOIN classes c ON s.class_id = c.id
             WHERE s.user_id = ? OR s.id = ? OR (s.student_code IS NOT NULL AND s.student_code = ?)`,
            [sqliteUserId, sqliteUserId, studentCode]
        ).catch(() => null);

        const studentId = studentRow?.id || sqliteUserId;
        const studentClassName = (studentRow?.class_name || 'Class 8').trim();
        const studentClassId = studentRow?.class_id || 64;

        const assignments = await all(
            `SELECT DISTINCT a.*, COALESCE(a.target_class, c.name, 'Class 8') as class_name, COALESCE(u.name, 'Teacher') as teacher_name,
                    s.id as submission_id, s.submitted_at, s.status as submission_status, s.content as submission_content, s.grade, s.feedback
             FROM assignments a
             LEFT JOIN classes c ON a.class_id = c.id
             LEFT JOIN users u ON a.created_by = u.id
             LEFT JOIN submissions s ON a.id = s.assignment_id AND (s.student_id = ? OR s.student_id = ? OR s.student_id = ?)
             WHERE (
                 -- 1. Connected teacher
                 a.created_by IN (
                     SELECT teacher_uid FROM student_teacher_connections 
                     WHERE (
                         student_uid = ? OR student_uid = ? OR student_uid = ?
                         OR (student_code IS NOT NULL AND student_code = ?)
                     ) AND status = 'active'
                 )
                 OR a.created_by = (SELECT teacher_id FROM classes WHERE id = ?)
             )
             AND (
                 -- 2. Target class matching:
                 CASE 
                     WHEN a.target_class IS NOT NULL AND TRIM(a.target_class) != '' THEN
                         LOWER(TRIM(a.target_class)) = LOWER(TRIM(?))
                         OR LOWER(TRIM(?)) LIKE ('%' || LOWER(TRIM(a.target_class)) || '%')
                         OR LOWER(TRIM(a.target_class)) LIKE ('%' || LOWER(TRIM(?)) || '%')
                     ELSE 
                         a.class_id = ? OR LOWER(TRIM(COALESCE(c.name, ''))) = LOWER(TRIM(?))
                 END
             )
             ORDER BY a.due_at ASC`,
            [
                studentId, sqliteUserId, req.user.id,
                String(req.user.id), String(sqliteUserId), String(studentId), studentCode,
                studentClassId,
                studentClassName,
                studentClassName,
                studentClassName,
                studentClassId,
                studentClassName
            ]
        ).catch(() => []);

        console.log('[STUDENT ASSIGNMENTS]');
        console.log(`Student UID: ${req.user.id}`);
        console.log(`Student Class: ${studentClassName}`);
        console.log(`Assignments found: ${assignments.length}`);

        return res.json({ assignments: assignments || [] });
    } catch (err) {
        console.error('Fetch assignments error:', err);
        res.status(500).json({ error: 'Error fetching assignments.' });
    }
});

// POST /api/assignments/:id/submit - Submit assignment (Student)
router.post('/:id/submit', authenticateToken, async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Submission content cannot be empty.' });
        }

        const studentUser = await get(
            "SELECT * FROM users WHERE id = ? OR email = ?",
            [req.user.id, req.user.email || '']
        ).catch(() => null);

        const sqliteUserId = studentUser?.id || req.user.id;
        const studentCode = studentUser?.student_code || req.user.student_code || '';
        const studentName = studentUser?.name || req.user.name || 'Student';

        const studentRow = await get(
            `SELECT s.id, s.class_id, s.student_code
             FROM students s
             WHERE s.user_id = ? OR s.id = ? OR (s.student_code IS NOT NULL AND s.student_code = ?)`,
            [sqliteUserId, sqliteUserId, studentCode]
        ).catch(() => null);

        const studentId = studentRow?.id || sqliteUserId;

        const assignment = await get("SELECT * FROM assignments WHERE id = ?", [assignmentId]);
        if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

        await run(
            `INSERT INTO submissions (assignment_id, student_id, content, status) 
             VALUES (?, ?, ?, 'submitted')
             ON CONFLICT(assignment_id, student_id) 
             DO UPDATE SET content = excluded.content, submitted_at = CURRENT_TIMESTAMP, status = 'submitted'`,
            [assignmentId, studentId, content.trim()]
        );

        // Enqueue to cloud sync queue
        await SyncQueueManager.enqueue('UPDATE', 'submission', assignmentId, {
            student_id: studentId,
            student_uid: req.user.id,
            student_name: studentName,
            student_code: studentCode,
            assignment_id: assignmentId,
            status: 'submitted',
            content: content.trim(),
            submitted_at: new Date().toISOString()
        }).catch(() => {});

        try {
            const io = req.app.get('io');
            if (io && assignment.created_by) {
                sendNotification(io, assignment.created_by, 'submission', `${studentName} submitted assignment "${assignment.title}"`);
            }
        } catch(e) {}

        console.log(`[SUBMISSION] Student ${studentName} (${studentCode}) submitted assignment #${assignmentId}: "${assignment.title}"`);
        res.json({ success: true, message: 'Assignment submitted successfully!' });
    } catch (err) {
        console.error('Submit assignment error:', err);
        res.status(500).json({ error: 'Error submitting assignment: ' + err.message });
    }
});

module.exports = router;
