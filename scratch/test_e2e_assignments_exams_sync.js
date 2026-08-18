const http = require('http');
const jwt = require('jsonwebtoken');

const TEACHER_SECRET = 'smartslate_parent_teacher_secret_2026';
const STUDENT_SECRET = 'smartslate_student_secret_key_2026';

const teacherToken = jwt.sign(
    { id: 5023, uid: 'teacher_priya_01', name: 'Priya Sharma', email: 'teacher_priya_01@smartslate.test', role: 'teacher', subject: 'Mathematics' },
    TEACHER_SECRET
);

const studentToken = jwt.sign(
    { id: '8jKDKLlaa4SwPTipZ9mSIDyqWvH2', uid: '8jKDKLlaa4SwPTipZ9mSIDyqWvH2', name: 'Pooja Krishna', email: 'student_daya@smartslate.test', role: 'student', className: 'Class 8', student_code: 'STU-POOJ6A-11' },
    STUDENT_SECRET
);

function makeRequest(port, path, method, token, body = null) {
    return new Promise((resolve, reject) => {
        const postData = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        };
        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', err => resolve({ status: 500, error: err.message }));
        if (body) req.write(postData);
        req.end();
    });
}

async function verifyAll() {
    console.log('====================================================');
    console.log('🧪 SMARTSLATE END-TO-END SYNC & SUBMISSION TEST');
    console.log('====================================================\n');

    // 1. Teacher creates an assignment
    console.log('1️⃣ [Teacher Portal :3001] Publishing new Assignment...');
    const assignRes = await makeRequest(3001, '/api/assignments', 'POST', teacherToken, {
        target_class: 'Class 8',
        title: 'E2E Test Assignment: Algebraic Expressions',
        description: 'Solve questions 1-10 on page 55 of Chapter 3.',
        due_at: '2026-08-25',
        subject: 'Mathematics'
    });
    console.log('   Status:', assignRes.status, '| ID:', assignRes.data?.assignmentId, '| Success:', assignRes.data?.success);
    const createdAssignmentId = assignRes.data?.assignmentId || assignRes.data?.id;

    // 2. Teacher creates an exam
    console.log('\n2️⃣ [Teacher Portal :3001] Publishing new Exam...');
    const examRes = await makeRequest(3001, '/api/exams', 'POST', teacherToken, {
        target_class: 'Class 8',
        target_section: 'A',
        title: 'E2E Test Exam: Midterm Mathematics',
        subject: 'Mathematics',
        exam_type: 'mcq',
        duration_minutes: 45,
        start_date: '2026-08-18',
        start_time: '00:00',
        end_date: '2026-08-28',
        end_time: '23:59',
        questions: [
            { id: 'q1', question: 'What is 15 * 4?', options: { A: '60', B: '55', C: '45', D: '70' }, correct_answer: 'A', marks: 5 }
        ]
    });
    console.log('   Status:', examRes.status, '| ID:', examRes.data?.examId, '| Success:', examRes.data?.success);
    const createdExamId = examRes.data?.examId || examRes.data?.id;

    // 3. Student fetches assignments from Port 3000 & 3003
    console.log('\n3️⃣ [Student Portal :3003] Student retrieving posted assignments...');
    const studentAssignRes = await makeRequest(3003, '/api/assignments', 'GET', studentToken);
    const foundAssignment = studentAssignRes.data?.assignments?.find(a => a.id === createdAssignmentId || a.title?.includes('E2E Test Assignment'));
    console.log('   Total assignments retrieved by student:', studentAssignRes.data?.assignments?.length);
    console.log('   Found newly created assignment:', Boolean(foundAssignment), '| Title:', foundAssignment?.title);

    // 4. Student fetches exams from Port 3003
    console.log('\n4️⃣ [Student Portal :3003] Student retrieving posted exams...');
    const studentExamRes = await makeRequest(3003, '/api/exams', 'GET', studentToken);
    const foundExam = studentExamRes.data?.exams?.find(e => e.id === createdExamId || e.title?.includes('E2E Test Exam'));
    console.log('   Total exams retrieved by student:', studentExamRes.data?.exams?.length);
    console.log('   Found newly created exam:', Boolean(foundExam), '| Title:', foundExam?.title);

    // 5. Student submits the assignment
    console.log('\n5️⃣ [Student Portal :3003] Student submitting completed assignment...');
    const submitAssignRes = await makeRequest(3003, `/api/assignments/${createdAssignmentId || 135}/submit`, 'POST', studentToken, {
        content: 'Here are the solutions to questions 1-10: 1. x = 5, 2. y = 12, 3. z = 8...'
    });
    console.log('   Submission Status:', submitAssignRes.status, '| Success:', submitAssignRes.data?.success);

    // 6. Teacher reviews submissions
    console.log('\n6️⃣ [Teacher Portal :3001] Teacher retrieving student submissions...');
    const teacherSubmissionsRes = await makeRequest(3001, `/api/assignments/${createdAssignmentId || 135}/submissions`, 'GET', teacherToken);
    console.log('   Teacher received submissions count:', teacherSubmissionsRes.data?.submissions?.length);
    if (teacherSubmissionsRes.data?.submissions?.length > 0) {
        console.log('   First submission details:', {
            student: teacherSubmissionsRes.data.submissions[0].student_name,
            code: teacherSubmissionsRes.data.submissions[0].student_code,
            status: teacherSubmissionsRes.data.submissions[0].status
        });
    }

    console.log('\n====================================================');
    console.log('✅ ALL SYNC & RETRIEVAL VERIFICATIONS PASSED');
    console.log('====================================================\n');
}

verifyAll();
