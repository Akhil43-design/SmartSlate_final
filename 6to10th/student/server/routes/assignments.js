const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { sendNotification } = require('../services/socketHandler');
const SyncQueueManager = require('../../../shared/services/syncQueue');

function normalizeClass(classInput) {
    if (!classInput) return '8';
    const str = String(classInput).trim().toLowerCase();

    if (str.includes('elem') || str.includes('primary') || str.includes('1-5') || str.includes('5th below') || str.includes('5thbelow')) {
        return 'elementary';
    }
    if (str.includes('inter') || str.includes('diploma') || str.includes('11') || str.includes('12') || str.includes('plus two') || str.includes('+2')) {
        return 'inter';
    }
    if (str.includes('b.tech') || str.includes('btech') || str.includes('cse') || str.includes('ece') || str.includes('eee') || str.includes('mech') || str.includes('civil') || str.includes('it')) {
        return 'btech';
    }

    const numMatch = str.match(/\b(1[0-2]|[1-9])\b/) || str.match(/\d+/);
    if (numMatch) {
        return numMatch[0];
    }
    return str.replace(/[^a-z0-9]/g, '');
}

async function resolveStudent(reqUser) {
    const studentUser = await get(
        "SELECT * FROM users WHERE id = ? OR email = ?",
        [reqUser.id, reqUser.email || '']
    ).catch(() => null);

    const sqliteUserId = studentUser?.id || reqUser.id;
    const studentCode = studentUser?.student_code || reqUser.student_code || '';
    const studentName = studentUser?.name || reqUser.name || 'Student';

    const studentRow = await get(
        `SELECT s.id, s.class_id, s.student_code, s.section, COALESCE(s.class_name, s.grade, c.name, 'Grade 8') as class_name, s.grade, s.education_level
         FROM students s
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.user_id = ? OR s.id = ? OR (s.student_code IS NOT NULL AND s.student_code = ?)`,
        [sqliteUserId, sqliteUserId, studentCode]
    ).catch(() => null);

    const rawClassName = studentRow?.class_name || reqUser.className || reqUser.grade || 'Class 8';

    return {
        studentId: studentRow?.id || sqliteUserId,
        sqliteUserId,
        studentCode,
        studentName,
        className: rawClassName.trim(),
        normalizedClass: normalizeClass(rawClassName),
        classId: studentRow?.class_id || 64
    };
}

// GET /api/assignments - Get student's assignments
router.get('/', authenticateToken, async (req, res) => {
    try {
        const studentInfo = await resolveStudent(req.user);

        // 1. Fetch connected teachers for this student
        const connections = await all(
            `SELECT teacher_uid FROM student_teacher_connections 
             WHERE (
                 student_uid = ? OR student_uid = ? OR student_uid = ?
                 OR (student_code IS NOT NULL AND student_code = ?)
             ) AND status = 'active'`,
            [String(req.user.id), String(studentInfo.sqliteUserId), String(studentInfo.studentId), studentInfo.studentCode]
        ).catch(() => []);

        const connectedTeacherUids = new Set(connections.map(c => String(c.teacher_uid)));
        // Also add class teacher & standard teachers
        const classRow = await get("SELECT teacher_id FROM classes WHERE id = ?", [studentInfo.classId]).catch(() => null);
        if (classRow?.teacher_id) connectedTeacherUids.add(String(classRow.teacher_id));
        ['teacher_priya_01', 5016, 5023, 5024, 5025, 5026].forEach(t => connectedTeacherUids.add(String(t)));

        // 2. Fetch all assignments from SQLite
        const rawAssignments = await all(
            `SELECT DISTINCT a.*, COALESCE(a.target_class, c.name, 'Class 8') as class_name, COALESCE(u.name, 'Teacher') as teacher_name,
                    s.id as submission_id, s.submitted_at, s.status as submission_status, s.content as submission_content, s.grade, s.feedback
             FROM assignments a
             LEFT JOIN classes c ON a.class_id = c.id
             LEFT JOIN users u ON a.created_by = u.id
             LEFT JOIN submissions s ON a.id = s.assignment_id AND (s.student_id = ? OR s.student_id = ? OR s.student_id = ?)
             ORDER BY a.due_at DESC`,
            [studentInfo.studentId, studentInfo.sqliteUserId, req.user.id]
        ).catch(() => []);

        // 3. Filter using canonical grade and connected teacher matching
        const matchingAssignments = rawAssignments.filter(assign => {
            const isTeacherConnected = connectedTeacherUids.has(String(assign.created_by)) || connectedTeacherUids.size === 0;

            const targetClassStr = (assign.target_class || assign.class_name || '').trim();
            if (!targetClassStr || targetClassStr.toLowerCase() === 'all' || targetClassStr.toLowerCase() === 'all classes') {
                return true;
            }

            const targetClassNorm = normalizeClass(targetClassStr);
            const classMatch = targetClassNorm === studentInfo.normalizedClass ||
                               targetClassStr.toLowerCase().includes(studentInfo.className.toLowerCase()) ||
                               studentInfo.className.toLowerCase().includes(targetClassStr.toLowerCase()) ||
                               targetClassStr.toLowerCase().includes(studentInfo.normalizedClass) ||
                               studentInfo.normalizedClass.includes(targetClassNorm);

            return classMatch || isTeacherConnected;
        });

        const finalAssignments = (matchingAssignments.length > 0 ? matchingAssignments : rawAssignments).map(a => ({
            ...a,
            status: a.submission_status || 'pending',
            subject: a.subject || 'Mathematics',
            due_at: a.due_at || new Date(Date.now() + 86400000 * 2).toISOString()
        }));

        console.log(`[STUDENT ASSIGNMENTS] Student: ${studentInfo.studentName} (${studentInfo.studentCode}) | Class: ${studentInfo.className} | Found: ${finalAssignments.length}`);
        return res.json({ success: true, assignments: finalAssignments });
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

        const studentInfo = await resolveStudent(req.user);

        const assignment = await get("SELECT * FROM assignments WHERE id = ?", [assignmentId]);
        if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

        await run(
            `INSERT INTO submissions (assignment_id, student_id, content, status) 
             VALUES (?, ?, ?, 'submitted')
             ON CONFLICT(assignment_id, student_id) 
             DO UPDATE SET content = excluded.content, submitted_at = CURRENT_TIMESTAMP, status = 'submitted'`,
            [assignmentId, studentInfo.studentId, content.trim()]
        );

        // Enqueue to cloud sync queue
        await SyncQueueManager.enqueue('UPDATE', 'submission', assignmentId, {
            student_id: studentInfo.studentId,
            student_uid: req.user.id,
            student_name: studentInfo.studentName,
            student_code: studentInfo.studentCode,
            assignment_id: assignmentId,
            status: 'submitted',
            content: content.trim(),
            submitted_at: new Date().toISOString()
        }).catch(() => {});

        try {
            const io = req.app.get('io');
            if (io && assignment.created_by) {
                sendNotification(io, assignment.created_by, 'submission', `${studentInfo.studentName} submitted assignment "${assignment.title}"`);
            }
        } catch(e) {}

        console.log(`[SUBMISSION] Student ${studentInfo.studentName} (${studentInfo.studentCode}) submitted assignment #${assignmentId}: "${assignment.title}"`);
        res.json({ success: true, message: 'Assignment submitted successfully!' });
    } catch (err) {
        console.error('Submit assignment error:', err);
        res.status(500).json({ error: 'Error submitting assignment: ' + err.message });
    }
});

module.exports = router;
