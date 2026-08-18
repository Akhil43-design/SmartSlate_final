const https = require('https');
const http = require('http');
const { get, all } = require('../shared/db/database');
const { firebaseConfig, firebaseAuthService } = require('../shared/services/firebaseAuthService');

const apiKey = firebaseConfig.apiKey;

function signIn(email, password = 'SmartSlate@123') {
    return new Promise((resolve) => {
        const payload = JSON.stringify({ email, password, returnSecureToken: true });
        const req = https.request({
            hostname: 'identitytoolkit.googleapis.com',
            path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch(e) { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', (err) => resolve({ status: 500, error: err.message }));
        req.write(payload);
        req.end();
    });
}

function httpGet(url, token) {
    return new Promise((resolve) => {
        const parsed = new URL(url);
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        http.get({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            headers
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        }).on('error', (err) => resolve({ status: 500, error: err.message }));
    });
}

function httpPost(url, payload, token) {
    return new Promise((resolve) => {
        const parsed = new URL(url);
        const dataStr = JSON.stringify(payload || {});
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(dataStr)
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            method: 'POST',
            headers
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', (err) => resolve({ status: 500, error: err.message }));
        req.write(dataStr);
        req.end();
    });
}

async function runAcceptanceTests() {
    console.log('===============================================================');
    console.log('SMARTSLATE — STUDENT DATA INTEGRITY ACCEPTANCE TEST SUITE');
    console.log('===============================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(desc, condition) {
        if (condition) {
            console.log(`  ✅ [PASS] ${desc}`);
            passed++;
        } else {
            console.error(`  ❌ [FAIL] ${desc}`);
            failed++;
        }
    }

    // TEST 1: Placement Normalizer Matrix
    console.log('--- TEST GROUP 1: Canonical Placement Normalizer Matrix ---');
    const elem = firebaseAuthService.normalizeStudentPlacement({ grade: '3', section: 'B', educationLevel: 'elementary' });
    assert('Elementary Class 3 resolves grade="Grade 3"', elem.grade === 'Grade 3');
    assert('Elementary Class 3 resolves classId="class-grade-3-b"', elem.classId === 'class-grade-3-b');
    assert('Elementary Class 3 resolves educationLevel="Elementary"', elem.educationLevel === 'Elementary');
    assert('Elementary Class 3 resolves section="B"', elem.section === 'B');

    const high = firebaseAuthService.normalizeStudentPlacement({ grade: 'Class 6', section: 'A' });
    assert('High School Class 6 resolves grade="Grade 6"', high.grade === 'Grade 6');
    assert('High School Class 6 resolves classId="class-grade-6-a"', high.classId === 'class-grade-6-a');
    assert('High School Class 6 resolves educationLevel="High School"', high.educationLevel === 'High School');
    assert('High School Class 6 resolves section="A"', high.section === 'A');

    const inter = firebaseAuthService.normalizeStudentPlacement({ grade: 'Intermediate 1st Year', section: 'A' });
    assert('Intermediate 1st Year resolves grade="1st Year Intermediate"', inter.grade === '1st Year Intermediate');
    assert('Intermediate 1st Year resolves classId="class-inter-year-1-a"', inter.classId === 'class-inter-year-1-a');
    assert('Intermediate 1st Year resolves educationLevel="Intermediate"', inter.educationLevel === 'Intermediate');

    const btech = firebaseAuthService.normalizeStudentPlacement({ grade: '3rd Year B.Tech', section: 'C' });
    assert('B.Tech 3rd Year resolves grade="3rd Year B.Tech"', btech.grade === '3rd Year B.Tech');
    assert('B.Tech 3rd Year resolves classId="class-btech-year-3-c"', btech.classId === 'class-btech-year-3-c');
    assert('B.Tech 3rd Year resolves educationLevel="B.Tech"', btech.educationLevel === 'B.Tech');
    assert('B.Tech 3rd Year resolves section="C"', btech.section === 'C');

    // TEST 2: Profile Validator
    console.log('\n--- TEST GROUP 2: Profile Validator ---');
    assert('Valid profile passes validation', firebaseAuthService.validateStudentProfile({
        uid: 'TEST_UID_1',
        name: 'Test Student',
        grade: 'Grade 8',
        section: 'A'
    }) === true);
    assert('Incomplete profile without section fails validation', firebaseAuthService.validateStudentProfile({
        uid: 'TEST_UID_1',
        name: 'Test Student',
        grade: 'Grade 8'
    }) === false);
    assert('Incomplete profile without grade fails validation', firebaseAuthService.validateStudentProfile({
        uid: 'TEST_UID_1',
        name: 'Test Student',
        section: 'A'
    }) === false);

    // TEST 3: Diagnostic Debug Endpoint (Port 3001 Parent/Teacher)
    console.log('\n--- TEST GROUP 3: Diagnostic Debug Endpoint (Port 3001) ---');
    const studentAuth = await signIn('student_051@smartslate.test', 'SmartSlate@123');
    const studentUid = studentAuth.data?.localId;
    const token = studentAuth.data?.idToken;

    assert('Student authenticated successfully with Firebase UID: ' + studentUid, Boolean(studentUid && token));

    const debug3001 = await httpGet(`http://localhost:3001/api/debug/student/${studentUid}`, token);
    assert('Debug endpoint 3001 returns HTTP 200', debug3001.status === 200);
    assert('Debug endpoint 3001 confirms consistent=true', debug3001.data?.consistent === true);
    assert('Debug endpoint 3001 shows firebaseProfile grade="Grade 6"', debug3001.data?.firebaseProfile?.grade === 'Grade 6');
    assert('Debug endpoint 3001 shows sqliteProfile grade="Grade 6"', debug3001.data?.sqliteProfile?.grade === 'Grade 6');
    assert('Debug endpoint 3001 shows teacherView grade="Grade 6"', debug3001.data?.teacherView?.grade === 'Grade 6');
    assert('Debug endpoint 3001 shows parentView grade="Grade 6"', debug3001.data?.parentView?.grade === 'Grade 6');

    // TEST 4: Diagnostic Debug Endpoint (Port 3003 Student Portal)
    console.log('\n--- TEST GROUP 4: Diagnostic Debug Endpoint (Port 3003) ---');
    const debug3003 = await httpGet(`http://localhost:3003/api/debug/student/${studentUid}`, token);
    assert('Debug endpoint 3003 returns HTTP 200', debug3003.status === 200);
    assert('Debug endpoint 3003 confirms consistent=true', debug3003.data?.consistent === true);
    assert('Debug endpoint 3003 shows firebaseProfile grade="Grade 6"', debug3003.data?.firebaseProfile?.grade === 'Grade 6');
    assert('Debug endpoint 3003 shows sqliteProfile grade="Grade 6"', debug3003.data?.sqliteProfile?.grade === 'Grade 6');
    assert('Debug endpoint 3003 shows teacherView grade="Grade 6"', debug3003.data?.teacherView?.grade === 'Grade 6');
    assert('Debug endpoint 3003 shows parentView grade="Grade 6"', debug3003.data?.parentView?.grade === 'Grade 6');

    // TEST 5: Teacher API & Parent API Query Validation
    console.log('\n--- TEST GROUP 5: Teacher & Parent Live API Validation ---');
    const teacherLogin = await httpPost('http://localhost:3001/api/auth/login', { email: 'teacher_math_hs@smartslate.test', password: 'SmartSlate@123' });
    const teacherToken = teacherLogin.data?.token;
    assert('Teacher Priya Sharma authenticated successfully via /api/auth/login', Boolean(teacherToken));

    // Check teacher connected students
    const teacherStudents = await httpGet('http://localhost:3001/api/teacher/students', teacherToken);
    assert('Teacher students API returns HTTP 200', teacherStudents.status === 200);
    const poojaTeacherEntry = (teacherStudents.data?.students || []).find(s => s.student_code === 'STU-POOJ6A-11' || s.student_uid === studentUid || s.name === 'Pooja Reddy' || s.name === 'Pooja Krishna');
    assert('Teacher views Pooja Reddy as Class 6 or Grade 6', Boolean(poojaTeacherEntry && (poojaTeacherEntry.class_name === 'Class 6' || poojaTeacherEntry.class_name === 'Grade 6' || poojaTeacherEntry.grade === 'Grade 6')));
    assert('Teacher views Pooja Reddy in Section A', Boolean(poojaTeacherEntry && poojaTeacherEntry.section === 'A'));

    const parentLogin = await httpPost('http://localhost:3001/api/auth/login', { email: 'parent_ramesh@smartslate.test', password: 'SmartSlate@123' });
    const parentToken = parentLogin.data?.token;
    assert('Parent Ramesh Kumar authenticated successfully via /api/auth/login', Boolean(parentToken));

    // Check parent children
    const parentChildren = await httpGet('http://localhost:3001/api/parent/children', parentToken);
    assert('Parent children API returns HTTP 200', parentChildren.status === 200);
    const poojaParentEntry = (parentChildren.data?.children || []).find(c => c.student_code === 'STU-POOJ6A-11' || c.student_uid === studentUid || c.name === 'Pooja Reddy' || c.name === 'Pooja Krishna');
    assert('Parent views child Pooja Reddy as Class 6 or Grade 6', Boolean(poojaParentEntry && (poojaParentEntry.class_name === 'Class 6' || poojaParentEntry.class_name === 'Grade 6' || poojaParentEntry.grade === 'Grade 6')));
    assert('Parent views child Pooja Reddy in Section A', Boolean(poojaParentEntry && poojaParentEntry.section === 'A'));

    // Also verify legacy teacher / parent for STU-101
    const legacyTeacherLogin = await httpPost('http://localhost:3001/api/auth/login', { email: 'teacher@smartslate.edu', password: 'SmartSlate@123' });
    const legacyTeacherStudents = await httpGet('http://localhost:3001/api/teacher/students', legacyTeacherLogin.data?.token);
    assert('Legacy teacher sees STU-101 with consistent Class 10/Grade 10', legacyTeacherStudents.data?.students?.some(s => s.student_code === 'STU-101' && (s.class_name?.includes('10') || s.grade?.includes('10'))));

    const legacyParentLogin = await httpPost('http://localhost:3001/api/auth/login', { email: 'parent@smartslate.edu', password: 'SmartSlate@123' });
    const legacyParentChildren = await httpGet('http://localhost:3001/api/parent/children', legacyParentLogin.data?.token);
    assert('Legacy parent sees child STU-101 with consistent Class 10/Grade 10', legacyParentChildren.data?.children?.some(c => c.student_code === 'STU-101' && (c.class_name?.includes('10') || c.grade?.includes('10'))));

    console.log('\n===============================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
    process.exit(0);
}

runAcceptanceTests().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
