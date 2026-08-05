const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { sendNotification } = require('../services/socketHandler');

// GET /api/attendance
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { date, classId, studentId } = req.query;

        if (req.user.role === 'student') {
            const student = await get("SELECT id FROM students WHERE user_id = ?", [req.user.id]);
            if (!student) return res.json({ attendance: [] });

            const attendance = await all(
                `SELECT a.*, c.name as class_name
                 FROM attendance a
                 JOIN classes c ON a.class_id = c.id
                 WHERE a.student_id = ?
                 ORDER BY a.date DESC LIMIT 60`,
                [student.id]
            );
            return res.json({ attendance });
        }

        if (req.user.role === 'parent') {
            const targetStudentId = studentId || req.query.studentId;
            if (!targetStudentId) return res.status(400).json({ error: 'studentId parameter required' });

            const attendance = await all(
                `SELECT a.*, c.name as class_name
                 FROM attendance a
                 JOIN classes c ON a.class_id = c.id
                 WHERE a.student_id = ?
                 ORDER BY a.date DESC LIMIT 60`,
                [targetStudentId]
            );
            return res.json({ attendance });
        }

        if (req.user.role === 'teacher') {
            if (!classId || !date) {
                return res.status(400).json({ error: 'classId and date parameters are required for teacher view.' });
            }

            const attendance = await all(
                `SELECT s.id as student_id, u.name as student_name, s.student_code,
                        a.status, a.date
                 FROM students s
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN attendance a ON s.id = a.student_id AND a.class_id = ? AND a.date = ?
                 WHERE s.class_id = ?
                 ORDER BY u.name ASC`,
                [classId, date, classId]
            );
            return res.json({ attendance });
        }
    } catch (err) {
        console.error('Fetch attendance error:', err);
        res.status(500).json({ error: 'Error fetching attendance.' });
    }
});

// POST /api/attendance - Mark attendance (Teacher)
router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const { class_id, date, records } = req.body; // records: [{ student_id, status: 'present'|'absent'|'late' }]
        if (!class_id || !date || !records || !Array.isArray(records)) {
            return res.status(400).json({ error: 'class_id, date, and records array are required.' });
        }

        const io = req.app.get('io');

        for (const record of records) {
            await run(
                `INSERT INTO attendance (class_id, student_id, date, status)
                 VALUES (?, ?, ?, ?)
                 ON CONFLICT(class_id, student_id, date)
                 DO UPDATE SET status = excluded.status`,
                [class_id, record.student_id, date, record.status]
            );

            // Notify student & parent if absent or late
            if (record.status !== 'present') {
                const st = await get("SELECT user_id, student_code FROM students WHERE id = ?", [record.student_id]);
                if (st) {
                    sendNotification(io, st.user_id, 'attendance', `Attendance update for ${date}: Marked ${record.status.toUpperCase()}`);
                    const parents = await all("SELECT parent_user_id FROM parent_links WHERE student_id = ? AND status = 'accepted'", [record.student_id]);
                    for (const p of parents) {
                        sendNotification(io, p.parent_user_id, 'attendance', `Child attendance alert: Marked ${record.status.toUpperCase()} on ${date}`);
                    }
                }
            }
        }

        res.json({ message: `Attendance marked successfully for ${records.length} students on ${date}!` });
    } catch (err) {
        console.error('Mark attendance error:', err);
        res.status(500).json({ error: 'Error marking attendance.' });
    }
});

module.exports = router;
