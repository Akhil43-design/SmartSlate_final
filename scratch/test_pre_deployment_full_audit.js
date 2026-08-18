const http = require('http');
const https = require('https');
const { get, all, run } = require('../shared/db/database');
const { firebaseConfig, firebaseAuthService } = require('../shared/services/firebaseAuthService');

function httpReq(method, url, payload = null, token = null) {
    return new Promise((resolve) => {
        const parsed = new URL(url);
        const dataStr = payload ? JSON.stringify(payload) : '';
        const headers = {};
        if (payload) {
            headers['Content-Type'] = 'application/json';
            headers['Content-Length'] = Buffer.byteLength(dataStr);
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            method,
            headers
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', (err) => resolve({ status: 500, error: err.message }));
        if (payload) req.write(dataStr);
        req.end();
    });
}

async function runFullPreDeploymentAudit() {
    console.log('==============================================================================');
    console.log('🍇 SMARTSLATE — MASTER PRE-DEPLOYMENT TEST & AUDIT SUITE');
    console.log('   Target: Raspberry Pi Zero 2 W / Raspberry Pi OS Lite / 512 MB RAM');
    console.log('==============================================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(desc, condition, extraInfo = '') {
        if (condition) {
            console.log(`  ✅ [PASS] ${desc}`);
            passed++;
        } else {
            console.error(`  ❌ [FAIL] ${desc} ${extraInfo}`);
            failed++;
        }
    }

    // -------------------------------------------------------------------------
    // TEST 1: All Health Endpoints (/health & /api/health)
    // -------------------------------------------------------------------------
    console.log('--- TEST GROUP 1: Health & Portal Endpoints (Ports 3000–3005) ---');
    for (const port of [3000, 3001, 3002, 3003, 3004, 3005]) {
        const resHealth = await httpReq('GET', `http://127.0.0.1:${port}/health`);
        const resApiHealth = await httpReq('GET', `http://127.0.0.1:${port}/api/health`);
        assert(`Port ${port} /health is 200 OK`, resHealth.status === 200);
        assert(`Port ${port} /api/health is 200 OK`, resApiHealth.status === 200);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Teacher & Parent Authentication
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Teacher & Parent Authentication ---');
    const teacherLogin = await httpReq('POST', 'http://127.0.0.1:3001/api/auth/login', {
        email: 'teacher@smartslate.edu',
        password: 'SmartSlate@123'
    });
    assert('Teacher login successful', teacherLogin.status === 200 && Boolean(teacherLogin.data?.token));
    const teacherToken = teacherLogin.data?.token;

    const parentLogin = await httpReq('POST', 'http://127.0.0.1:3001/api/auth/login', {
        email: 'parent@smartslate.edu',
        password: 'SmartSlate@123'
    });
    assert('Parent login successful', parentLogin.status === 200 && Boolean(parentLogin.data?.token));
    const parentToken = parentLogin.data?.token;

    // -------------------------------------------------------------------------
    // TEST 3: Dynamic Class Determination (No Hardcoding to "Class 8")
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Dynamic Class Determination ---');
    const teacherClasses = await httpReq('GET', 'http://127.0.0.1:3001/api/teacher/classes', null, teacherToken);
    assert('Teacher classes API returns 200 OK', teacherClasses.status === 200);
    const classesList = teacherClasses.data?.classes || [];
    assert('Dynamic classes returned from linked students', Array.isArray(classesList) && classesList.length > 0);
    console.log(`     Available teacher classes: ${classesList.map(c => c.name || c).join(', ')}`);

    // -------------------------------------------------------------------------
    // TEST 4: Student Offline Operations (Port 3003 High School)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Student Offline Operations & Local SQLite ---');
    const studentLogin = await httpReq('POST', 'http://127.0.0.1:3003/api/auth/login', {
        email: 'student_051@smartslate.test',
        password: 'SmartSlate@123'
    });
    assert('Student offline login via SQLite successful', studentLogin.status === 200 && Boolean(studentLogin.data?.token));
    const studentToken = studentLogin.data?.token;
    const studentUser = studentLogin.data?.user;

    // Create a local note
    const noteRes = await httpReq('POST', 'http://127.0.0.1:3003/api/notes', {
        title: 'Physics Wave Optics Notes',
        subject: 'Physics',
        content: 'Huygens Principle:\n1. Every point on a wavefront is a source of wavelets.\n2. Tangent to wavelets gives new wavefront.',
        category: 'Science',
        pageNumber: 1
    }, studentToken);
    assert('Student note created in local SQLite database', noteRes.status === 200 || noteRes.status === 201);

    // -------------------------------------------------------------------------
    // TEST 5: Formatted Assignment Submission
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Formatted Assignment Submission & Evaluation ---');
    // Get existing assignment or create one
    const assignmentsRes = await httpReq('GET', 'http://127.0.0.1:3003/api/assignments', null, studentToken);
    const sampleAssignment = assignmentsRes.data?.assignments?.[0] || { id: 1 };

    const formattedAnswer = "## Question 1: Explain Photosynthesis\n\n**Answer:**\nPhotosynthesis is the process by which green plants use *sunlight* to synthesize nutrients from **carbon dioxide** and **water**.\n\n* Chemical Equation:\n  `6CO2 + 6H2O -> C6H12O6 + 6O2`";
    const submitRes = await httpReq('POST', `http://127.0.0.1:3003/api/assignments/${sampleAssignment.id}/submit`, {
        content: formattedAnswer
    }, studentToken);
    assert('Assignment submitted with rich markdown formatting', submitRes.status === 200);

    // Teacher opens and evaluates submission
    const teacherSubmissions = await httpReq('GET', `http://127.0.0.1:3001/api/assignments/${sampleAssignment.id}/submissions`, null, teacherToken);
    assert('Teacher retrieves assignment submissions', teacherSubmissions.status === 200);

    // -------------------------------------------------------------------------
    // TEST 6: Dynamic Exam System (MCQ & Written)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Dynamic Exam Creation, Window & Kiosk Proctoring ---');
    const now = new Date();
    const startTime = new Date(now.getTime() - 5 * 60000).toISOString(); // Started 5 mins ago
    const endTime = new Date(now.getTime() + 60 * 60000).toISOString();  // Ends in 60 mins

    const newExamRes = await httpReq('POST', 'http://127.0.0.1:3001/api/exams', {
        title: 'Master Science Unit Assessment 2026',
        description: 'Comprehensive Term Exam',
        subject: 'Science',
        class_name: 'Class 6',
        exam_type: 'mcq',
        duration_minutes: 45,
        total_marks: 20,
        start_time: startTime,
        end_time: endTime,
        questions: [
            {
                question_text: 'What is the SI unit of force?',
                option_a: 'Joule',
                option_b: 'Newton',
                option_c: 'Watt',
                option_d: 'Pascal',
                correct_option: 'B',
                marks: 10
            },
            {
                question_text: 'Which gas do plants absorb during photosynthesis?',
                option_a: 'Oxygen',
                option_b: 'Nitrogen',
                option_c: 'Carbon Dioxide',
                option_d: 'Hydrogen',
                correct_option: 'C',
                marks: 10
            }
        ]
    }, teacherToken);

    assert('Teacher creates scheduled MCQ exam', newExamRes.status === 200 || newExamRes.status === 201);
    const createdExamId = newExamRes.data?.examId || newExamRes.data?.id || 1;

    // Student starts exam
    const startExamRes = await httpReq('POST', `http://127.0.0.1:3003/api/exams/${createdExamId}/start`, {}, studentToken);
    assert('Student starts exam during active window', startExamRes.status === 200);

    // Student triggers fullscreen exit / kiosk violation
    const violationRes = await httpReq('POST', `http://127.0.0.1:3003/api/exams/${createdExamId}/violation`, {
        violation_type: 'FULLSCREEN_EXIT',
        details: 'Student switched tabs during active exam session'
    }, studentToken);
    assert('Kiosk proctoring violation alert sent to teacher', violationRes.status === 200);

    // Student submits exam
    const submitExamRes = await httpReq('POST', `http://127.0.0.1:3003/api/exams/${createdExamId}/submit`, {
        answers: {
            "1": "B",
            "2": "C"
        }
    }, studentToken);
    assert('Student submits exam answers early', submitExamRes.status === 200);

    // Teacher grades / evaluates exam submission
    const evalRes = await httpReq('POST', `http://127.0.0.1:3001/api/exams/${createdExamId}/evaluate`, {
        student_id: studentUser.id || 5013,
        marks_obtained: 20,
        feedback: 'Outstanding work! Full marks on all conceptual questions.'
    }, teacherToken);
    assert('Teacher evaluates exam and records feedback', evalRes.status === 200);

    // -------------------------------------------------------------------------
    // TEST 7: Parent Portal Child & Attendance Inspection
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Parent Portal Child Progress & Attendance ---');
    const parentChildren = await httpReq('GET', 'http://127.0.0.1:3001/api/parent/children', null, parentToken);
    assert('Parent retrieves linked children list', parentChildren.status === 200);
    const firstChild = parentChildren.data?.children?.[0];
    assert('Parent can view child Class and Academic placement', Boolean(firstChild && (firstChild.class_name || firstChild.grade)));

    // -------------------------------------------------------------------------
    // TEST 8: Canonical Profile Consistency
    // -------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: Canonical Student Data Consistency ---');
    const debugRes = await httpReq('GET', `http://127.0.0.1:3001/api/debug/student/8jKDKLlaa4SwPTipZ9mSIDyqWvH2`, null, teacherToken);
    assert('Debug endpoint returns consistent=true across all portals', debugRes.status === 200 && debugRes.data?.consistent === true);

    console.log('\n==============================================================================');
    console.log(`AUDIT SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('==============================================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runFullPreDeploymentAudit().catch(err => {
    console.error('Audit execution error:', err);
    process.exit(1);
});
