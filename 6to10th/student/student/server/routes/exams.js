const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

async function getStudentId(userId) {
    const student = await get("SELECT id, class_id FROM students WHERE user_id = ?", [userId]);
    return student;
}

// GET /api/exams - List student's exams
router.get('/', authenticateToken, async (req, res) => {
    try {
        const student = await getStudentId(req.user.id);
        if (!student || !student.class_id) return res.json({ exams: [] });

        const exams = await all(
            `SELECT e.id, e.class_id, e.title, e.duration_minutes, e.start_time, e.end_time, e.created_at,
                    er.id as result_id, er.score, er.total_points, er.submitted_at
             FROM exams e
             LEFT JOIN exam_results er ON e.id = er.exam_id AND er.student_id = ?
             WHERE e.class_id = ?
             ORDER BY e.created_at DESC`,
            [student.id, student.class_id]
        );

        return res.json({ exams });
    } catch (err) {
        console.error('Fetch exams error:', err);
        res.status(500).json({ error: 'Error fetching exams.' });
    }
});

// GET /api/exams/:id - Get exam details for taking
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const examId = req.params.id;
        const exam = await get("SELECT * FROM exams WHERE id = ?", [examId]);
        if (!exam) return res.status(404).json({ error: 'Exam not found.' });

        const questions = JSON.parse(exam.questions_json || '[]');

        const student = await getStudentId(req.user.id);
        let studentResult = null;
        if (student) {
            studentResult = await get("SELECT * FROM exam_results WHERE exam_id = ? AND student_id = ?", [examId, student.id]);
        }

        res.json({
            exam: {
                id: exam.id,
                title: exam.title,
                class_id: exam.class_id,
                duration_minutes: exam.duration_minutes,
                start_time: exam.start_time,
                end_time: exam.end_time,
                questions
            },
            result: studentResult ? {
                score: studentResult.score,
                total_points: studentResult.total_points,
                answers: JSON.parse(studentResult.answers_json || '{}'),
                submitted_at: studentResult.submitted_at
            } : null
        });
    } catch (err) {
        console.error('Fetch exam error:', err);
        res.status(500).json({ error: 'Error loading exam.' });
    }
});

// POST /api/exams/:id/submit - Submit exam answers & calculate score (Student)
router.post('/:id/submit', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const examId = req.params.id;
        const { answers } = req.body;

        if (!answers) return res.status(400).json({ error: 'Exam answers are required.' });

        const student = await getStudentId(req.user.id);
        if (!student) return res.status(400).json({ error: 'Student account not found.' });

        const exam = await get("SELECT * FROM exams WHERE id = ?", [examId]);
        if (!exam) return res.status(404).json({ error: 'Exam not found.' });

        const questions = JSON.parse(exam.questions_json || '[]');
        let correctCount = 0;
        const totalQuestions = questions.length;

        questions.forEach(q => {
            const studentAns = answers[q.id];
            if (studentAns && q.correct) {
                if (q.type === 'mcq') {
                    if (String(studentAns).trim().toLowerCase() === String(q.correct).trim().toLowerCase()) {
                        correctCount++;
                    }
                } else {
                    if (String(studentAns).trim().toLowerCase().includes(String(q.correct).trim().toLowerCase())) {
                        correctCount++;
                    }
                }
            }
        });

        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 100;

        await run(
            `INSERT INTO exam_results (exam_id, student_id, answers_json, score, total_points)
             VALUES (?, ?, ?, ?, 100)
             ON CONFLICT(exam_id, student_id)
             DO UPDATE SET answers_json = excluded.answers_json, score = excluded.score, submitted_at = CURRENT_TIMESTAMP`,
            [examId, student.id, JSON.stringify(answers), score]
        );

        res.json({
            message: 'Exam submitted successfully!',
            score,
            total_points: 100,
            correctCount,
            totalQuestions
        });
    } catch (err) {
        console.error('Submit exam error:', err);
        res.status(500).json({ error: 'Error submitting exam.' });
    }
});

module.exports = router;
