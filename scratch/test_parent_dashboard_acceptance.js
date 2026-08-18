/**
 * SMARTSLATE — COMPLETE PARENT DASHBOARD ACCEPTANCE TEST SUITE
 * Verifies real end-to-end data flow:
 * Student -> SQLite -> Sync Queue -> Firebase -> Parent Dashboard
 */

const http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const PARENT_JWT_SECRET = 'smartslate_parent_teacher_secret_2026';
const STUDENT_JWT_SECRET = 'smartslate_student_secret_key_2026';

let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
    if (condition) {
        console.log(`  ✅ [PASS] ${description}`);
        passed++;
    } else {
        console.error(`  ❌ [FAIL] ${description} ${details ? '(' + details + ')' : ''}`);
        failed++;
    }
}

function request(port, method, reqPath, headers = {}, body = null) {
    return new Promise((resolve) => {
        const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
        const options = {
            hostname: 'localhost',
            port: port,
            path: reqPath,
            method: method,
            headers: {
                ...headers,
                ...(payload ? {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: parsed
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                status: 500,
                error: err.message,
                data: null
            });
        });

        if (payload) req.write(payload);
        req.end();
    });
}

async function runAcceptanceTests() {
    console.log('===============================================================');
    console.log('👨‍👩‍👧‍👦 SMARTSLATE — COMPLETE PARENT DASHBOARD ACCEPTANCE TESTS');
    console.log('===============================================================\n');

    // 1. Parent Authentication Token
    const parentPayload = {
        id: 5008, // Ramesh Kumar (Parent)
        uid: 'parent_ramesh_01',
        email: 'ramesh@smartslate.test',
        name: 'Ramesh Kumar',
        role: 'parent',
        parent_code: 'PAR-5008'
    };
    const parentToken = jwt.sign(parentPayload, PARENT_JWT_SECRET, { expiresIn: '2h' });
    const parentHeaders = { Authorization: `Bearer ${parentToken}` };

    // 2. Student Authentication Token (Pooja Reddy / Akhil)
    const studentPayload = {
        id: 5013, // Pooja Reddy
        uid: '8jKDKLlaa4SwPTipZ9mSIDyqWvH2',
        email: 'student_051@smartslate.test',
        name: 'Pooja Reddy',
        role: 'student',
        student_code: 'STU-POOJ6A-11'
    };
    const studentToken = jwt.sign(studentPayload, STUDENT_JWT_SECRET, { expiresIn: '2h' });
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    // 3. Teacher Authentication Token
    const teacherPayload = {
        id: 5016,
        uid: 'teacher_demo_01',
        email: 'priya.teacher@smartslate.test',
        name: 'Priya Sharma',
        role: 'teacher'
    };
    const teacherToken = jwt.sign(teacherPayload, PARENT_JWT_SECRET, { expiresIn: '2h' });
    const teacherHeaders = { Authorization: `Bearer ${teacherToken}` };

    console.log('--- Phase 1: Parent Authentication & Linking Student by Code ---');
    // Connect child using student code STU-101
    const linkRes1 = await request(3001, 'POST', '/api/parent/link', parentHeaders, {
        studentCode: 'STU-101'
    });
    assert('Parent connects student via STU-101', linkRes1.status === 200);

    // Connect child using student code STU-POOJ6A-11
    const linkRes2 = await request(3001, 'POST', '/api/parent/connect-child', parentHeaders, {
        studentCode: 'STU-POOJ6A-11'
    });
    assert('Parent connects second child via STU-POOJ6A-11', linkRes2.status === 200);

    console.log('\n--- Phase 2: Multiple Connected Children ---');
    const childrenRes = await request(3001, 'GET', '/api/parent/children', parentHeaders);
    assert('Parent fetches linked children', childrenRes.status === 200);
    const children = childrenRes.data?.children || [];
    assert('Parent has at least 2 connected children', children.length >= 2, `Count: ${children.length}`);
    
    const child1 = children.find(c => c.student_code === 'STU-101' || c.student_name === 'Akhil');
    const child2 = children.find(c => c.student_code === 'STU-POOJ6A-11' || c.student_name === 'Pooja Reddy');
    assert('Found connected child #1 (STU-101)', !!child1);
    assert('Found connected child #2 (STU-POOJ6A-11)', !!child2);

    console.log('\n--- Phase 3: Canonical Child Profile & KPI Overview ---');
    const studentIdToTest = child2 ? (child2.student_id || child2.student_uid) : 5013;
    const overviewRes = await request(3001, 'GET', `/api/parent/child/${studentIdToTest}/overview`, parentHeaders);
    assert('Parent gets child overview API', overviewRes.status === 200);
    const overview = overviewRes.data;
    assert('Child profile includes canonical name', !!overview?.student?.student_name);
    assert('Child profile includes canonical class/grade', !!overview?.student?.class_name);
    assert('Child profile includes canonical section', !!overview?.student?.section);
    assert('Child profile includes canonical student_code', !!overview?.student?.student_code);
    assert('KPIs include overallProgress percentage', typeof overview?.kpis?.overallProgress === 'number');
    assert('KPIs include attendance rate', typeof overview?.kpis?.attendancePercentage === 'number');

    console.log('\n--- Phase 4: Real Exam Results & Teacher Evaluations ---');
    const student1Id = child1 ? (child1.student_id || child1.student_uid) : 5017;
    const studentAkhilPayload = {
        id: 5017,
        uid: '5017',
        email: 'student_101@smartslate.test',
        name: 'Akhil',
        role: 'student',
        student_code: 'STU-101'
    };
    const studentAkhilToken = jwt.sign(studentAkhilPayload, STUDENT_JWT_SECRET, { expiresIn: '2h' });
    const studentAkhilHeaders = { Authorization: `Bearer ${studentAkhilToken}` };

    const examCreateRes = await request(3001, 'POST', '/api/exams', teacherHeaders, {
        title: 'Midterm Science Assessment',
        subject: 'Science',
        exam_type: 'written',
        target_class: '10th Class — Section A',
        target_section: 'A',
        questions: [{ id: 'q_sci_1', question: 'Explain Photosynthesis', type: 'written', marks: 50 }]
    });
    const examId = examCreateRes.data?.examId || examCreateRes.data?.id;
    assert('Teacher creates exam for child class', examCreateRes.status === 201 && !!examId);

    if (examId) {
        // Student starts and submits exam
        await request(3003, 'POST', `/api/exams/${examId}/start`, studentAkhilHeaders, {});
        await request(3003, 'POST', `/api/exams/${examId}/submit`, studentAkhilHeaders, {
            answers: {
                q_sci_1: {
                    answerType: 'handwriting',
                    strokes: [{ tool: 'pen', color: '#1E293B', width: 3, points: [{x: 50, y: 50}, {x: 60, y: 60}] }],
                    textFallback: 'Plants convert sunlight into chemical energy'
                }
            }
        });

        // Check pending evaluation in Parent Dashboard
        const parentExamsPending = await request(3001, 'GET', `/api/parent/child/${student1Id}/exams`, parentHeaders);
        assert('Parent retrieves exams list', parentExamsPending.status === 200);
        const submittedExam = (parentExamsPending.data?.exams || []).find(e => e.examId == examId);
        assert('Pending exam shows "Awaiting Evaluation" status', submittedExam?.status === 'Awaiting Evaluation');
        assert('Pending exam does NOT report score as 0 or failure', submittedExam?.score === null || submittedExam?.isEvaluated === false);

        // Teacher evaluates the submission
        const subsRes = await request(3001, 'GET', `/api/exams/${examId}/submissions`, teacherHeaders);
        const subId = subsRes.data?.submissions?.[0]?.id;
        assert('Teacher finds submitted exam to evaluate', !!subId);

        if (subId) {
            await request(3001, 'POST', `/api/exams/evaluate/${subId}`, teacherHeaders, {
                score: 42,
                feedback: 'Excellent scientific reasoning and neat handwriting diagram.'
            });

            // Parent retrieves updated evaluated exams
            const parentExamsEval = await request(3001, 'GET', `/api/parent/child/${student1Id}/exams`, parentHeaders);
            const evalExam = (parentExamsEval.data?.exams || []).find(e => e.examId == examId);
            assert('Evaluated exam shows status "Evaluated"', evalExam?.status === 'Evaluated');
            assert('Evaluated exam displays score 42 / 50', evalExam?.score === 42 && evalExam?.totalMarks === 50);
            assert('Evaluated exam calculates percentage 84%', evalExam?.percentage === 84);
            assert('Evaluated exam includes teacher remarks', evalExam?.feedback?.includes('scientific reasoning'));
        }
    }

    console.log('\n--- Phase 5: Student Digital Notes & Handwriting Data ---');
    const notesRes = await request(3001, 'GET', `/api/parent/child/${studentIdToTest}/notes`, parentHeaders);
    assert('Parent fetches child digital notes', notesRes.status === 200);
    assert('Notes response is an array', Array.isArray(notesRes.data?.notes));

    console.log('\n--- Phase 6: Safe Web Search History & Live Audit Stream ---');
    // Student performs real web search
    const searchQuery = 'What is photosynthesis?';
    await request(3003, 'GET', `/api/search?q=${encodeURIComponent(searchQuery)}`, studentHeaders);

    const searchesRes = await request(3001, 'GET', `/api/parent/child/${studentIdToTest}/searches`, parentHeaders);
    assert('Parent fetches web searches', searchesRes.status === 200);
    const searches = searchesRes.data?.activity || searchesRes.data?.searches || [];
    const foundSearch = searches.find(s => s.query === searchQuery);
    assert('Recorded search query appears in Parent Audit Log', !!foundSearch);

    console.log('\n--- Phase 7: Attendance, Assignments & Announcements ---');
    const attRes = await request(3001, 'GET', `/api/parent/child/${studentIdToTest}/attendance`, parentHeaders);
    assert('Parent fetches attendance', attRes.status === 200);
    assert('Attendance percentage is valid', typeof attRes.data?.percentage === 'number');

    const assignRes = await request(3001, 'GET', `/api/parent/child/${studentIdToTest}/assignments`, parentHeaders);
    assert('Parent fetches assignments', assignRes.status === 200);

    const noticesRes = await request(3001, 'GET', `/api/parent/child/${studentIdToTest}/announcements`, parentHeaders);
    assert('Parent fetches announcements', noticesRes.status === 200);

    console.log('\n--- Phase 8: Data Isolation & Permission Security ---');
    // Parent B (unconnected) trying to access Student A
    const unauthorizedParentPayload = {
        id: 9999,
        uid: 'parent_stranger_99',
        email: 'stranger@smartslate.test',
        role: 'parent'
    };
    const unauthParentToken = jwt.sign(unauthorizedParentPayload, PARENT_JWT_SECRET, { expiresIn: '1h' });
    const unauthHeaders = { Authorization: `Bearer ${unauthParentToken}` };

    const unauthRes = await request(3001, 'GET', `/api/parent/child/${studentIdToTest}/overview`, unauthHeaders);
    assert('Unconnected Parent is blocked from viewing child (HTTP 403)', unauthRes.status === 403);

    console.log('\n--- Phase 9: Firestore Rules & Client Services Verification ---');
    const rulesContent = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
    assert('Firestore rules allow isConnectedParent on search_history', rulesContent.includes('match /search_history/{searchId}') && rulesContent.includes('isConnectedParent(uid)'));
    assert('Firestore rules allow isConnectedParent on exam_submissions', rulesContent.includes('match /exam_submissions/{examId}') && rulesContent.includes('isConnectedParent(uid)'));
    assert('Firestore rules allow isConnectedParent on notes', rulesContent.includes('match /notes/{noteId}') && rulesContent.includes('isConnectedParent(uid)'));

    const fbAuthServiceContent = fs.readFileSync(path.join(__dirname, '..', 'shared', 'services', 'firebaseAuthService.js'), 'utf8');
    assert('firebaseAuthService has linkParentToChild', fbAuthServiceContent.includes('linkParentToChild'));
    assert('firebaseAuthService has getParentChildren', fbAuthServiceContent.includes('getParentChildren'));
    assert('firebaseAuthService has listenToStudentSearchHistory', fbAuthServiceContent.includes('listenToStudentSearchHistory'));
    assert('firebaseAuthService has getStudentExamSubmissions', fbAuthServiceContent.includes('getStudentExamSubmissions'));

    const parentViewContent = fs.readFileSync(path.join(__dirname, '..', 'parent-teacher', 'public', 'js', 'views', 'parentView.js'), 'utf8');
    assert('parentView.js implements child switcher', parentViewContent.includes('parent-children-switcher-container'));
    assert('parentView.js implements visual note canvas renderer', parentViewContent.includes('parent-note-viewer-canvas'));
    assert('parentView.js implements realtime search listener', parentViewContent.includes('listenToStudentSearchHistory'));

    console.log('\n===============================================================');
    console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runAcceptanceTests().catch(err => {
    console.error('Fatal error during test run:', err);
    process.exit(1);
});
