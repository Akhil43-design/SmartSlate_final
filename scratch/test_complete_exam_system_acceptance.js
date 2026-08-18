const http = require('http');
const jwt = require('jsonwebtoken');

const TEACHER_JWT_SECRET = 'smartslate_parent_teacher_secret_2026';
const STUDENT_JWT_SECRET = 'smartslate_student_secret_key_2026';

// Using actual seeded database IDs
const teacherToken = jwt.sign({
    id: 5016,
    uid: 'teacher_5016_uid',
    name: 'Ravi Kumar',
    role: 'teacher',
    email: 'ravi.kumar@smartslate.test',
    teacher_code: 'TCH-5016'
}, TEACHER_JWT_SECRET, { expiresIn: '1d' });

const studentToken = jwt.sign({
    id: 5017,
    uid: 'student_5017_uid',
    name: 'Akhil',
    role: 'student',
    email: 'akhil@smartslate.test',
    student_code: 'STU-5017'
}, STUDENT_JWT_SECRET, { expiresIn: '1d' });

function makeRequest(port, path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const reqHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };
        if (payload) {
            reqHeaders['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = http.request({
            hostname: 'localhost',
            port,
            path,
            method,
            headers: reqHeaders
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch(e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runAcceptanceTests() {
    console.log('====================================================');
    console.log('🚀 STARTING COMPREHENSIVE EXAM SYSTEM ACCEPTANCE TEST');
    console.log('====================================================\n');

    let passedTests = 0;
    let totalTests = 0;

    function assert(condition, message) {
        totalTests++;
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passedTests++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // TEST 1: Teacher creates Active MCQ Exam
    console.log('--- 1. TEACHER CREATING MCQ EXAM ---');
    const mcqRes = await makeRequest(3001, '/api/exams', 'POST', {
        class_id: '10th Class — Section A',
        title: 'Mathematics Term 1 MCQ Quiz',
        subject: 'Mathematics',
        exam_type: 'mcq',
        duration_minutes: 45,
        start_date: todayStr,
        start_time: '00:00',
        end_date: todayStr,
        end_time: '23:59',
        questions: [
            {
                id: 'q_1',
                question: 'What is the value of x in: 2x + 6 = 14?',
                options: { A: '2', B: '4', C: '6', D: '8' },
                correct: 'B',
                marks: 2
            },
            {
                id: 'q_2',
                question: 'Which of the following is a prime number?',
                options: { A: '9', B: '15', C: '17', D: '21' },
                correct: 'C',
                marks: 3
            },
            {
                id: 'q_3',
                question: 'What is the sum of angles in a triangle?',
                options: { A: '180°', B: '90°', C: '360°', D: '270°' },
                correct: 'A',
                marks: 5
            }
        ]
    }, { Authorization: `Bearer ${teacherToken}` });

    assert(mcqRes.status === 201 && mcqRes.body.examId, 'Teacher successfully created MCQ Exam with answer keys');
    const mcqExamId = mcqRes.body.examId;

    // TEST 2: Verify Student Exam Security (Answer keys NEVER exposed)
    console.log('\n--- 2. STUDENT EXAM SECURITY & SANITIZATION ---');
    const studentMcqRes = await makeRequest(3003, `/api/exams/${mcqExamId}`, 'GET', null, { Authorization: `Bearer ${studentToken}` });
    assert(studentMcqRes.status === 200, 'Student can fetch exam details');
    const studentExam = studentMcqRes.body.exam;
    assert(studentExam.isAvailable === true, 'Exam window is currently active');
    assert(studentExam.questions.length === 3, 'Received 3 sanitized questions');
    assert(studentExam.answer_key === undefined, 'Answer key is NOT exposed on root exam object');
    assert(studentExam.questions.every(q => q.correct === undefined), 'Individual questions do NOT contain correct answer keys');

    // TEST 3: Teacher creates Active Written Exam
    console.log('\n--- 3. TEACHER CREATING WRITTEN / SUBJECTIVE EXAM ---');
    const writtenRes = await makeRequest(3001, '/api/exams', 'POST', {
        class_id: '10th Class — Section A',
        title: 'Science Biology Midterm Written Exam',
        subject: 'Science',
        exam_type: 'written',
        duration_minutes: 60,
        start_date: todayStr,
        start_time: '00:00',
        end_date: todayStr,
        end_time: '23:59',
        questions: [
            {
                id: 'q_1',
                question: 'Explain the detailed process of Photosynthesis with chemical equations and diagrams.',
                marks: 10
            },
            {
                id: 'q_2',
                question: 'Differentiate between Mitosis and Meiosis cell divisions with 4 distinct points.',
                marks: 15
            }
        ]
    }, { Authorization: `Bearer ${teacherToken}` });

    assert(writtenRes.status === 201 && writtenRes.body.examId, 'Teacher successfully created Written Exam');
    const writtenExamId = writtenRes.body.examId;

    // TEST 4: Window Enforcement for Upcoming & Closed Exams
    console.log('\n--- 4. SERVER AVAILABILITY WINDOW ENFORCEMENT ---');
    const upcomingRes = await makeRequest(3001, '/api/exams', 'POST', {
        class_id: '10th Class — Section A',
        title: 'Future Chemistry Test',
        subject: 'Chemistry',
        exam_type: 'written',
        duration_minutes: 30,
        start_date: '2026-12-01',
        start_time: '10:00',
        end_date: '2026-12-01',
        end_time: '11:00',
        questions: [{ id: 'q_1', question: 'Test question', marks: 10 }]
    }, { Authorization: `Bearer ${teacherToken}` });
    const upcomingExamId = upcomingRes.body.examId;
    const studentUpcomingRes = await makeRequest(3003, `/api/exams/${upcomingExamId}`, 'GET', null, { Authorization: `Bearer ${studentToken}` });
    assert(studentUpcomingRes.body.exam.windowStatus === 'upcoming', 'Future exam correctly identified as upcoming');
    assert(studentUpcomingRes.body.exam.isAvailable === false, 'Future exam is not available for starting');

    const closedRes = await makeRequest(3001, '/api/exams', 'POST', {
        class_id: '10th Class — Section A',
        title: 'Past Physics Test',
        subject: 'Physics',
        exam_type: 'written',
        duration_minutes: 30,
        start_date: '2026-01-01',
        start_time: '10:00',
        end_date: '2026-01-01',
        end_time: '11:00',
        questions: [{ id: 'q_1', question: 'Test question', marks: 10 }]
    }, { Authorization: `Bearer ${teacherToken}` });
    const closedExamId = closedRes.body.examId;
    const studentClosedRes = await makeRequest(3003, `/api/exams/${closedExamId}`, 'GET', null, { Authorization: `Bearer ${studentToken}` });
    assert(studentClosedRes.body.exam.windowStatus === 'closed', 'Past exam correctly identified as closed');
    assert(studentClosedRes.body.exam.isAvailable === false, 'Past exam is not available for starting');

    // TEST 5: Student Starts MCQ Exam & Records Violation
    console.log('\n--- 5. STUDENT EXAM TAKING & FULLSCREEN VIOLATION TRACKING ---');
    const startRes = await makeRequest(3003, `/api/exams/${mcqExamId}/start`, 'POST', {}, { Authorization: `Bearer ${studentToken}` });
    assert(startRes.status === 200, 'Student started exam (in_progress)');

    const violationRes = await makeRequest(3003, `/api/exams/${mcqExamId}/violation`, 'POST', {
        type: 'FULLSCREEN_EXIT',
        details: 'User exited fullscreen at 10:35 AM'
    }, { Authorization: `Bearer ${studentToken}` });
    assert(violationRes.status === 200 && violationRes.body.violationCount >= 1, 'Fullscreen exit violation logged');

    // TEST 6: Teacher Live Monitor reflects active student & violation in real-time
    console.log('\n--- 6. TEACHER LIVE EXAM MONITOR ---');
    const liveStatusRes = await makeRequest(3001, `/api/exams/${mcqExamId}/live-status`, 'GET', null, { Authorization: `Bearer ${teacherToken}` });
    assert(liveStatusRes.status === 200, 'Teacher retrieved live monitor status');
    assert(liveStatusRes.body.students.some(s => s.status === 'in_progress'), 'Teacher sees student in_progress');
    assert(liveStatusRes.body.violations.length >= 1, 'Teacher receives live fullscreen violation alert');

    // TEST 7: Student Submits MCQ Exam & Auto-Grading is computed
    console.log('\n--- 7. STUDENT MCQ EXAM AUTO-GRADING ---');
    // Q1 correct (B: +2), Q2 correct (C: +3), Q3 wrong (selected D, correct A: +0) => Score: 5 / 10
    const mcqSubmitRes = await makeRequest(3003, `/api/exams/${mcqExamId}/submit`, 'POST', {
        answers: {
            q_1: 'B',
            q_2: 'C',
            q_3: 'D'
        }
    }, { Authorization: `Bearer ${studentToken}` });
    assert(mcqSubmitRes.status === 200, 'Student successfully submitted MCQ exam');
    assert(mcqSubmitRes.body.score === 5, 'MCQ score accurately auto-graded: 5 marks');
    assert(mcqSubmitRes.body.totalMarks === 10, 'MCQ total marks: 10');

    // TEST 8: Student Submits Written Exam
    console.log('\n--- 8. STUDENT WRITTEN EXAM SUBMISSION WITH FORMATTING ---');
    const writtenParagraph = `Photosynthesis is the process by which green plants use sunlight to synthesize nutrients from CO2 and H2O.\n\nChemical Equation:\n6CO2 + 6H2O + light -> C6H12O6 + 6O2\n\nKey Stages:\n1. Light-dependent reactions in thylakoid membranes\n2. Light-independent Calvin Cycle in stroma`;
    
    await makeRequest(3003, `/api/exams/${writtenExamId}/start`, 'POST', {}, { Authorization: `Bearer ${studentToken}` });
    const writtenSubmitRes = await makeRequest(3003, `/api/exams/${writtenExamId}/submit`, 'POST', {
        answers: {
            q_1: writtenParagraph,
            q_2: '1. Mitosis produces 2 diploid cells; Meiosis produces 4 haploid gametes.\n2. Mitosis occurs in somatic cells; Meiosis in germ cells.'
        }
    }, { Authorization: `Bearer ${studentToken}` });
    assert(writtenSubmitRes.status === 200, 'Student submitted written exam');
    assert(writtenSubmitRes.body.status === 'submitted', 'Written exam marked as submitted (pending teacher grading)');

    // TEST 9: Teacher Evaluates Written Exam
    console.log('\n--- 9. TEACHER WRITTEN EXAM EVALUATION ---');
    const subsRes = await makeRequest(3001, `/api/exams/${writtenExamId}/submissions`, 'GET', null, { Authorization: `Bearer ${teacherToken}` });
    assert(subsRes.status === 200 && subsRes.body.submissions.length > 0, 'Teacher fetched written submissions');
    const studentSub = subsRes.body.submissions[0];
    assert(studentSub.answers.q_1 === writtenParagraph, 'Student answer preserves full newlines and equation formatting');

    const evalRes = await makeRequest(3001, `/api/exams/evaluate/${studentSub.id}`, 'POST', {
        score: 23,
        total_marks: 25,
        feedback: 'Excellent work! Detailed chemical equation and accurate comparison points.'
    }, { Authorization: `Bearer ${teacherToken}` });
    assert(evalRes.status === 200, 'Teacher successfully saved written evaluation');

    // TEST 10: Student Views Final Evaluated Scorecard & Feedback
    console.log('\n--- 10. STUDENT RESULT SCORECARD & FEEDBACK ---');
    const finalStudentRes = await makeRequest(3003, `/api/exams/${writtenExamId}`, 'GET', null, { Authorization: `Bearer ${studentToken}` });
    assert(finalStudentRes.status === 200, 'Student loaded evaluated exam');
    const finalSub = finalStudentRes.body.submission;
    assert(finalSub.score === 23, 'Evaluated score matches: 23/25');
    assert(finalSub.status === 'evaluated', 'Status is evaluated');
    assert(finalSub.feedback === 'Excellent work! Detailed chemical equation and accurate comparison points.', 'Exact teacher feedback displayed');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} ACCEPTANCE TESTS PASSED SUCCESSFULLY! ✓`);
    console.log('====================================================\n');
}

runAcceptanceTests().catch(err => {
    console.error('Acceptance test execution error:', err);
    process.exit(1);
});
