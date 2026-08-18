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

        // Verify link
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

        // Verify link
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

        if (!student) return res.status(404).json({ error: 'Student not found.' });

        // 1. Attendance stats
        const attStats = await get(
            `SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days
             FROM attendance WHERE student_id = ?`,
            [studentId]
        );

        const totalDays = attStats ? attStats.total_days : 0;
        const presentDays = attStats ? attStats.present_days : 0;
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

        // 2. Assignment completion rate
        const totalAssignments = await get("SELECT COUNT(*) as count FROM assignments WHERE class_id = (SELECT class_id FROM students WHERE id = ?)", [studentId]);
        const submittedAssignments = await get("SELECT COUNT(*) as count FROM submissions WHERE student_id = ?", [studentId]);

        const totalAssignCount = totalAssignments ? totalAssignments.count : 0;
        const subAssignCount = submittedAssignments ? submittedAssignments.count : 0;
        const assignmentCompletionRate = totalAssignCount > 0 ? Math.round((subAssignCount / totalAssignCount) * 100) : 100;

        // 3. Exam Average Score
        const examStats = await get(
            `SELECT AVG((score / total_points) * 100) as avg_score, COUNT(*) as exam_count
             FROM exam_results WHERE student_id = ?`,
            [studentId]
        );

        const averageExamScore = examStats && examStats.avg_score ? Math.round(examStats.avg_score) : 0;

        // 4. Notebook Activity
        const noteStats = await get(
            `SELECT COUNT(n.id) as total_notes 
             FROM notes n 
             JOIN books b ON n.book_id = b.id 
             WHERE b.student_id = ?`,
            [studentId]
        );

        res.json({
            progressCard: {
                student_name: student.student_name,
                student_code: student.student_code,
                class_name: student.class_name || 'Unassigned',
                attendance: {
                    percentage: attendancePercentage,
                    total_days: totalDays,
                    present_days: presentDays,
                    late_days: attStats ? attStats.late_days : 0,
                    absent_days: attStats ? attStats.absent_days : 0
                },
                assignments: {
                    completion_rate: assignmentCompletionRate,
                    total: totalAssignCount,
                    submitted: subAssignCount
                },
                exams: {
                    average_score: averageExamScore,
                    total_taken: examStats ? examStats.exam_count : 0
                },
                notebooks: {
                    total_notes_created: noteStats ? noteStats.total_notes : 0
                },
                generated_at: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Fetch progress card error:', err);
        res.status(500).json({ error: 'Error generating progress card report.' });
    }
});

module.exports = router;
