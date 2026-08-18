const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const SyncQueueManager = require('../../../shared/services/syncQueue');

function normalizeClass(classInput) {
    if (!classInput) return '';
    const str = String(classInput).trim().toLowerCase();
    
    if (str.includes('inter') || str.includes('11th') || str.includes('12th') || str.includes('mpc') || str.includes('bipc') || str.includes('cec') || str.includes('mec')) {
        if (str.includes('1st') || str.includes('1') || str.includes('xi') || str.includes('junior')) return 'inter_1';
        if (str.includes('2nd') || str.includes('2') || str.includes('xii') || str.includes('senior')) return 'inter_2';
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

function normalizeSection(sectionInput) {
    if (!sectionInput) return '';
    const s = String(sectionInput).trim().toUpperCase();
    if (s === 'ALL' || s === 'ANY' || s === '*' || s === 'NONE' || s === 'NULL' || s === 'UNDEFINED') return '';
    const cleaned = s.replace(/\bSECTION\b|\bSEC\b/gi, '').trim();
    const match = cleaned.match(/[A-Z]/);
    return match ? match[0] : s;
}

function extractSectionFromClassString(classStr) {
    if (!classStr) return '';
    const match = String(classStr).match(/section\s*([A-Z])/i) || String(classStr).match(/\b([A-Z])\s*$/i);
    return match ? match[1].toUpperCase() : '';
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
        `SELECT s.id, s.class_id, s.student_code, s.section, COALESCE(s.class_name, s.grade, c.name, 'Grade 8') as class_name, s.grade, s.education_level, c.section as class_section
         FROM students s
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.user_id = ? OR s.id = ? OR (s.student_code IS NOT NULL AND s.student_code = ?)`,
        [sqliteUserId, sqliteUserId, studentCode]
    ).catch(() => null);

    const rawClassName = studentRow?.class_name || reqUser.className || reqUser.grade || 'Class 8';
    const rawSection = studentRow?.section || studentRow?.class_section || reqUser.section || extractSectionFromClassString(rawClassName) || 'A';

    return {
        studentId: studentRow?.id || sqliteUserId,
        sqliteUserId,
        studentCode,
        studentName,
        className: rawClassName.trim(),
        section: normalizeSection(rawSection) || 'A',
        normalizedClass: normalizeClass(rawClassName),
        classId: studentRow?.class_id || 64
    };
}

function calculateExamWindow(exam, now = new Date()) {
    const startDateStr = exam.start_date || '2026-08-17';
    const startTimeStr = exam.start_time || '00:00';
    const endDateStr = exam.end_date || startDateStr;
    const endTimeStr = exam.end_time || '23:59';

    // Parse into Date objects
    const startDateTime = new Date(`${startDateStr}T${startTimeStr.length === 5 ? startTimeStr + ':00' : startTimeStr}`);
    const endDateTime = new Date(`${endDateStr}T${endTimeStr.length === 5 ? endTimeStr + ':00' : endTimeStr}`);

    let windowStatus = 'active';
    let isAvailable = true;
    let availabilityMessage = 'Exam is active.';

    if (now < startDateTime) {
        windowStatus = 'upcoming';
        isAvailable = false;
        availabilityMessage = 'Exam has not started yet.';
    } else if (now > endDateTime) {
        windowStatus = 'closed';
        isAvailable = false;
        availabilityMessage = 'Exam is closed.';
    }

    return {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        windowStatus,
        isAvailable,
        availabilityMessage
    };
}

// GET /api/exams - List student's exams with server-authoritative availability
router.get('/', authenticateToken, async (req, res) => {
    try {
        const studentInfo = await resolveStudent(req.user);
        const now = new Date();

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
        // Also add class teacher
        const classRow = await get("SELECT teacher_id FROM classes WHERE id = ?", [studentInfo.classId]).catch(() => null);
        if (classRow?.teacher_id) connectedTeacherUids.add(String(classRow.teacher_id));
        // Default demo teachers
        [5016, 5023, 5024, 5025, 5026].forEach(t => connectedTeacherUids.add(String(t)));

        // 2. Fetch all exams
        const rawExams = await all(
            `SELECT DISTINCT e.id, e.class_id, e.title, e.subject, e.exam_type, e.duration_minutes, 
                    e.start_date, e.start_time, e.end_date, e.end_time, e.created_at, e.created_by,
                    e.target_class, e.target_section,
                    COALESCE(e.target_class, c.name, 'Class 8') as class_name,
                    u.name as teacher_name,
                    es.id as submission_id, es.score, es.total_marks, es.status as submission_status, 
                    es.submitted_at, es.evaluated_at, es.feedback, es.violation_count
             FROM exams e
             LEFT JOIN classes c ON e.class_id = c.id
             LEFT JOIN users u ON e.created_by = u.id
             LEFT JOIN exam_submissions es ON e.id = es.exam_id AND (es.student_id = ? OR es.student_id = ? OR es.student_uid = ?)
             ORDER BY e.created_at DESC`,
            [studentInfo.studentId, studentInfo.sqliteUserId, req.user.id]
        ).catch(() => []);

        // 3. Filter using canonical class & section matching
        const matchingExams = rawExams.filter(exam => {
            const isTeacherConnected = connectedTeacherUids.has(String(exam.created_by)) || connectedTeacherUids.size === 0;
            if (!isTeacherConnected) return false;

            const examClassStr = exam.target_class || exam.class_name || '';
            const examClassNorm = normalizeClass(examClassStr);
            const classMatch = examClassNorm === studentInfo.normalizedClass ||
                               examClassStr.toLowerCase().includes(studentInfo.className.toLowerCase()) ||
                               studentInfo.className.toLowerCase().includes(examClassStr.toLowerCase());

            if (!classMatch) return false;

            // Section matching
            const examSection = normalizeSection(exam.target_section || extractSectionFromClassString(examClassStr));
            const sectionMatch = !examSection || (examSection === studentInfo.section);

            return sectionMatch;
        });

        const exams = matchingExams.map(exam => {
            const window = calculateExamWindow(exam, now);
            const hasSubmitted = exam.submission_status === 'submitted' || exam.submission_status === 'evaluated' || exam.submission_status === 'graded';
            
            return {
                ...exam,
                exam_type: exam.exam_type || 'written',
                serverTime: now.toISOString(),
                startDateTime: window.startDateTime,
                endDateTime: window.endDateTime,
                windowStatus: window.windowStatus,
                isAvailable: window.isAvailable && !hasSubmitted,
                availabilityMessage: hasSubmitted ? 'Exam already submitted.' : window.availabilityMessage,
                hasSubmitted
            };
        });

        res.json({ exams });
    } catch (err) {
        console.error('Fetch exams error:', err);
        res.status(500).json({ error: 'Error fetching exams: ' + err.message });
    }
});

// GET /api/exams/:id - Get exam details for taking (Sanitizes answer keys!)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const examId = req.params.id;
        const exam = await get("SELECT * FROM exams WHERE id = ?", [examId]);
        if (!exam) return res.status(404).json({ error: 'Exam not found.' });

        const studentInfo = await resolveStudent(req.user);
        const now = new Date();
        const window = calculateExamWindow(exam, now);

        let questions = [];
        try { questions = JSON.parse(exam.questions_json || '[]'); } catch(e) {}

        // SANITIZE: remove any correct answer keys from questions
        const sanitizedQuestions = questions.map(q => ({
            id: q.id,
            type: q.type || exam.exam_type || 'written',
            question: q.question,
            options: q.options || null,
            marks: q.marks || (exam.exam_type === 'mcq' ? 1 : 10)
        }));

        const submission = await get(
            "SELECT * FROM exam_submissions WHERE exam_id = ? AND (student_id = ? OR student_id = ? OR student_uid = ?)",
            [examId, studentInfo.studentId, studentInfo.sqliteUserId, req.user.id]
        ).catch(() => null);

        let userAnswers = {};
        if (submission?.answers) {
            try { userAnswers = JSON.parse(submission.answers); } catch(e) {}
        }

        res.json({
            exam: {
                id: exam.id,
                title: exam.title,
                subject: exam.subject,
                exam_type: exam.exam_type || 'written',
                class_id: exam.class_id,
                duration_minutes: exam.duration_minutes || 60,
                start_date: exam.start_date,
                start_time: exam.start_time,
                end_date: exam.end_date,
                end_time: exam.end_time,
                startDateTime: window.startDateTime,
                endDateTime: window.endDateTime,
                serverTime: now.toISOString(),
                windowStatus: window.windowStatus,
                isAvailable: window.isAvailable && submission?.status !== 'submitted' && submission?.status !== 'evaluated',
                availabilityMessage: window.availabilityMessage,
                questions: sanitizedQuestions
            },
            submission: submission ? {
                id: submission.id,
                status: submission.status,
                score: submission.score,
                total_marks: submission.total_marks,
                feedback: submission.feedback,
                answers: userAnswers,
                violation_count: submission.violation_count || 0,
                submitted_at: submission.submitted_at,
                evaluated_at: submission.evaluated_at
            } : null
        });
    } catch (err) {
        console.error('Fetch exam error:', err);
        res.status(500).json({ error: 'Error loading exam.' });
    }
});

// POST /api/exams/:id/start - Student starts taking the exam
router.post('/:id/start', authenticateToken, async (req, res) => {
    try {
        const examId = req.params.id;
        const exam = await get("SELECT * FROM exams WHERE id = ?", [examId]);
        if (!exam) return res.status(404).json({ error: 'Exam not found.' });

        const studentInfo = await resolveStudent(req.user);
        const window = calculateExamWindow(exam);

        if (!window.isAvailable) {
            return res.status(403).json({ error: window.availabilityMessage });
        }

        await run(
            `INSERT INTO exam_submissions (exam_id, student_id, student_uid, answers, status)
             VALUES (?, ?, ?, '{}', 'in_progress')
             ON CONFLICT(exam_id, student_id)
             DO NOTHING`,
            [examId, studentInfo.studentId, req.user.id]
        );

        // Enqueue live event
        await SyncQueueManager.enqueue('CREATE', 'exam_live_status', `${examId}_${studentInfo.studentId}`, {
            exam_id: examId,
            student_id: studentInfo.studentId,
            student_uid: req.user.id,
            student_name: studentInfo.studentName,
            status: 'in_progress',
            started_at: new Date().toISOString()
        }).catch(() => {});

        res.json({ success: true, message: 'Exam started successfully.' });
    } catch (err) {
        console.error('Start exam error:', err);
        res.status(500).json({ error: 'Error starting exam: ' + err.message });
    }
});

// POST /api/exams/:id/violation - Student records fullscreen exit violation
router.post('/:id/violation', authenticateToken, async (req, res) => {
    try {
        const examId = req.params.id;
        const { type, details } = req.body;
        const studentInfo = await resolveStudent(req.user);
        const violationType = type || 'FULLSCREEN_EXIT';

        await run(
            `INSERT INTO exam_violations (exam_id, student_id, student_uid, type, details)
             VALUES (?, ?, ?, ?, ?)`,
            [examId, studentInfo.studentId, req.user.id, violationType, details || 'Exited exam fullscreen view']
        );

        await run(
            `UPDATE exam_submissions 
             SET violation_count = COALESCE(violation_count, 0) + 1
             WHERE exam_id = ? AND (student_id = ? OR student_uid = ?)`,
            [examId, studentInfo.studentId, req.user.id]
        );

        const currentSub = await get(
            "SELECT violation_count FROM exam_submissions WHERE exam_id = ? AND (student_id = ? OR student_uid = ?)",
            [examId, studentInfo.studentId, req.user.id]
        );

        // Enqueue real-time alert for teacher
        await SyncQueueManager.enqueue('CREATE', 'exam_violation_alert', `${examId}_${studentInfo.studentId}_${Date.now()}`, {
            exam_id: examId,
            student_id: studentInfo.studentId,
            student_uid: req.user.id,
            student_name: studentInfo.studentName,
            type: violationType,
            violation_count: currentSub?.violation_count || 1,
            timestamp: new Date().toISOString()
        }).catch(() => {});

        console.log(`[EXAM VIOLATION] Student: ${studentInfo.studentName} | Exam #${examId} | Count: ${currentSub?.violation_count || 1}`);

        res.json({
            success: true,
            violationCount: currentSub?.violation_count || 1,
            message: 'Violation recorded and alerted to teacher.'
        });
    } catch (err) {
        console.error('Violation record error:', err);
        res.status(500).json({ error: 'Error recording violation: ' + err.message });
    }
});

// POST /api/exams/:id/submit - Submit exam (Auto-grades MCQ / Stores Written answers)
router.post('/:id/submit', authenticateToken, async (req, res) => {
    try {
        const examId = req.params.id;
        const { answers } = req.body;

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ error: 'Exam answers are required.' });
        }

        const studentInfo = await resolveStudent(req.user);
        const exam = await get("SELECT * FROM exams WHERE id = ?", [examId]);
        if (!exam) return res.status(404).json({ error: 'Exam not found.' });

        const examType = exam.exam_type || 'written';
        let questions = [];
        try { questions = JSON.parse(exam.questions_json || '[]'); } catch(e) {}
        let answerKey = {};
        try { answerKey = JSON.parse(exam.answer_key || '{}'); } catch(e) {}

        let score = 0;
        let totalMarks = 0;
        let finalStatus = 'submitted';
        let feedback = null;
        let evaluatedBy = null;
        let evaluatedAt = null;

        if (examType === 'mcq') {
            // AUTOMATIC MCQ EVALUATION
            let correctCount = 0;
            questions.forEach(q => {
                const qMarks = parseFloat(q.marks) || 1;
                totalMarks += qMarks;
                const studentAns = String(answers[q.id] || '').trim().toUpperCase();
                const correctAns = String(answerKey[q.id] || '').trim().toUpperCase();

                if (studentAns && correctAns && studentAns === correctAns) {
                    score += qMarks;
                    correctCount++;
                }
            });

            finalStatus = 'evaluated';
            feedback = `Auto-evaluated: ${correctCount} of ${questions.length} questions correct.`;
            evaluatedBy = 'Auto-Grader';
            evaluatedAt = new Date().toISOString();
        } else {
            // WRITTEN EXAM: Total marks calculation, awaiting teacher evaluation
            totalMarks = questions.reduce((sum, q) => sum + (parseFloat(q.marks) || 10), 0);
            finalStatus = 'submitted';
        }

        await run(
            `INSERT INTO exam_submissions (
                exam_id, student_id, student_uid, answers, score, total_marks, status, 
                submitted_at, evaluated_at, evaluated_by, feedback
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
            ON CONFLICT(exam_id, student_id)
            DO UPDATE SET 
                answers = excluded.answers,
                score = excluded.score,
                total_marks = excluded.total_marks,
                status = excluded.status,
                submitted_at = CURRENT_TIMESTAMP,
                evaluated_at = excluded.evaluated_at,
                evaluated_by = excluded.evaluated_by,
                feedback = excluded.feedback`,
            [
                examId,
                studentInfo.studentId,
                req.user.id,
                JSON.stringify(answers),
                examType === 'mcq' ? score : null,
                totalMarks,
                finalStatus,
                evaluatedAt,
                evaluatedBy,
                feedback
            ]
        );

        // Also update legacy exam_results table for backwards compatibility
        await run(
            `INSERT INTO exam_results (exam_id, student_id, answers_json, score, total_points)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(exam_id, student_id)
             DO UPDATE SET answers_json = excluded.answers_json, score = excluded.score, submitted_at = CURRENT_TIMESTAMP`,
            [examId, studentInfo.studentId, JSON.stringify(answers), score, totalMarks || 100]
        ).catch(() => {});

        // Enqueue submission to cloud sync queue
        await SyncQueueManager.enqueue('CREATE', 'exam_submission', `${examId}_${studentInfo.studentId}`, {
            exam_id: examId,
            student_id: studentInfo.studentId,
            student_uid: req.user.id,
            student_name: studentInfo.studentName,
            student_code: studentInfo.studentCode,
            exam_type: examType,
            answers,
            score: examType === 'mcq' ? score : null,
            total_marks: totalMarks,
            status: finalStatus,
            feedback,
            submitted_at: new Date().toISOString()
        }).catch(() => {});

        console.log(`[EXAM SUBMITTED] Student: ${studentInfo.studentName} | Exam: #${examId} (${examType}) | Score: ${score}/${totalMarks} | Status: ${finalStatus}`);

        res.json({
            success: true,
            message: examType === 'mcq' 
                ? `Exam submitted and graded! Your score: ${score}/${totalMarks}` 
                : 'Written exam submitted successfully to teacher for evaluation.',
            examType,
            score: examType === 'mcq' ? score : null,
            totalMarks,
            status: finalStatus
        });
    } catch (err) {
        console.error('Submit exam error:', err);
        res.status(500).json({ error: 'Error submitting exam: ' + err.message });
    }
});

module.exports = router;
