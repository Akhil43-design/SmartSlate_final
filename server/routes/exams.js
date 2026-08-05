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

// GET /api/exams
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            const student = await getStudentId(req.user.id);
            if (!student || !student.class_id) return res.json({ exams: [] });

            const exams = await all(
                `SELECT e.id, e.class_id, e.title, e.duration_minutes, e.created_at,
                        er.id as result_id, er.score, er.total_points, er.submitted_at
                 FROM exams e
                 LEFT JOIN exam_results er ON e.id = er.exam_id AND er.student_id = ?
                 WHERE e.class_id = ?
                 ORDER BY e.created_at DESC`,
                [student.id, student.class_id]
            );

            return res.json({ exams });
        }

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
                `SELECT e.id, e.title, e.duration_minutes,
                        er.score, er.total_points, er.submitted_at
                 FROM exams e
                 LEFT JOIN exam_results er ON e.id = er.exam_id AND er.student_id = ?
                 WHERE e.class_id = ?
                 ORDER BY e.created_at DESC`,
                [studentId, student.class_id]
            );
            return res.json({ exams });
        }
    } catch (err) {
        console.error('Fetch exams error:', err);
        res.status(500).json({ error: 'Error fetching exams.' });
    }
});

// GET /api/exams/:id - Get exam detail with questions (for taking or reviewing)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const examId = req.params.id;
        const exam = await get("SELECT * FROM exams WHERE id = ?", [examId]);
        if (!exam) return res.status(404).json({ error: 'Exam not found.' });

        const questions = JSON.parse(exam.questions_json || '[]');

        // Sanitized version for student taking exam (omit correct answers if needed, or include for instant feedback)
        let studentResult = null;
        if (req.user.role === 'student') {
            const student = await getStudentId(req.user.id);
            if (student) {
                studentResult = await get("SELECT * FROM exam_results WHERE exam_id = ? AND student_id = ?", [examId, student.id]);
            }
        }

        res.json({
            exam: {
                id: exam.id,
                title: exam.title,
                class_id: exam.class_id,
                duration_minutes: exam.duration_minutes,
                questions
            },
            result: studentResult ? {
                ...studentResult,
                answers: JSON.parse(studentResult.answers_json || '{}')
            } : null
        });
    } catch (err) {
        console.error('Get exam detail error:', err);
        res.status(500).json({ error: 'Error getting exam details.' });
    }
});

// POST /api/exams - Create & Publish Exam (Teacher)
router.post('/', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const { class_id, title, questions, duration_minutes } = req.body;
        if (!class_id || !title || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ error: 'class_id, title, and valid questions array are required.' });
        }

        const result = await run(
            "INSERT INTO exams (class_id, title, questions_json, duration_minutes, created_by) VALUES (?, ?, ?, ?, ?)",
            [class_id, title.trim(), JSON.stringify(questions), duration_minutes || 30, req.user.id]
        );

        // Send push notification to students
        const studentsInClass = await all("SELECT user_id FROM students WHERE class_id = ?", [class_id]);
        const io = req.app.get('io');
        for (const st of studentsInClass) {
            sendNotification(io, st.user_id, 'exam', `New Exam Published: "${title.trim()}"`);
        }

        res.status(201).json({ message: 'Exam created & published!', examId: result.id });
    } catch (err) {
        console.error('Create exam error:', err);
        res.status(500).json({ error: 'Error creating exam.' });
    }
});

// POST /api/exams/:id/submit - Submit Exam & Auto-grade MCQs (Student)
router.post('/:id/submit', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const examId = req.params.id;
        const { answers } = req.body; // Object mapping question index/id to answer string

        const student = await getStudentId(req.user.id);
        if (!student) return res.status(400).json({ error: 'Student profile not found.' });

        const exam = await get("SELECT * FROM exams WHERE id = ?", [examId]);
        if (!exam) return res.status(404).json({ error: 'Exam not found.' });

        const questions = JSON.parse(exam.questions_json || '[]');
        let totalPoints = questions.length * 10;
        let score = 0;

        // Auto-grade calculation
        questions.forEach(q => {
            const studentAns = (answers[q.id] || answers[q.id - 1] || '').trim();
            if (q.type === 'mcq') {
                if (studentAns.toLowerCase() === (q.correct || '').trim().toLowerCase()) {
                    score += 10;
                }
            } else {
                // Short answer basic fuzzy keyword check
                if (studentAns.length > 5 && q.correct && studentAns.toLowerCase().includes(q.correct.toLowerCase().slice(0, 5))) {
                    score += 10;
                } else if (studentAns.length > 10) {
                    score += 8; // Partial credit for substantial short answer response
                }
            }
        });

        await run(
            `INSERT INTO exam_results (exam_id, student_id, answers_json, score, total_points)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(exam_id, student_id)
             DO UPDATE SET answers_json = excluded.answers_json, score = excluded.score, submitted_at = CURRENT_TIMESTAMP`,
            [examId, student.id, JSON.stringify(answers || {}), score, totalPoints]
        );

        // Notify parent & teacher
        const io = req.app.get('io');
        const percentage = Math.round((score / totalPoints) * 100);
        sendNotification(io, req.user.id, 'exam', `Exam submitted! Score: ${percentage}%`);

        // Find linked parents
        const parents = await all("SELECT parent_user_id FROM parent_links WHERE student_id = ? AND status = 'accepted'", [student.id]);
        for (const p of parents) {
            sendNotification(io, p.parent_user_id, 'exam', `${req.user.name} scored ${percentage}% on exam "${exam.title}"`);
        }

        res.json({
            message: 'Exam submitted successfully!',
            score,
            totalPoints,
            percentage
        });
    } catch (err) {
        console.error('Submit exam error:', err);
        res.status(500).json({ error: 'Error submitting exam.' });
    }
});

// GET /api/exams/:id/results - View all results for an exam (Teacher)
router.get('/:id/results', authenticateToken, requireRole('teacher'), async (req, res) => {
    try {
        const examId = req.params.id;
        const results = await all(
            `SELECT er.*, u.name as student_name, s.student_code
             FROM exam_results er
             JOIN students s ON er.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE er.exam_id = ?
             ORDER BY er.score DESC`,
            [examId]
        );

        res.json({ results });
    } catch (err) {
        console.error('Fetch exam results error:', err);
        res.status(500).json({ error: 'Error fetching exam results.' });
    }
});

module.exports = router;
