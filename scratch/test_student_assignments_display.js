const http = require('http');

function request(port, path, method = 'GET', body = null, token = null) {
    return new Promise((resolve) => {
        const postData = body ? JSON.stringify(body) : null;
        const headers = { 'Content-Type': 'application/json' };
        if (postData) headers['Content-Length'] = Buffer.byteLength(postData);
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request({
            hostname: 'localhost',
            port,
            path,
            method,
            headers
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', e => resolve({ status: 500, error: e.message }));
        if (postData) req.write(postData);
        req.end();
    });
}

async function testStudentAssignmentsDisplay() {
    console.log('================================================================');
    console.log('SMARTSLATE — VERIFY ASSIGNMENTS DISPLAY ON STUDENT WEBSITES');
    console.log('================================================================\n');

    // 1. Check Student 1: Pooja (student_051@smartslate.test, Class 8)
    console.log('1. Logging in Student Pooja Krishna (student_051@smartslate.test)...');
    const poojaLogin = await request(3003, '/api/auth/login', 'POST', {
        email: 'student_051@smartslate.test',
        password: 'SmartSlate@123'
    });
    console.log(`  -> Login status: ${poojaLogin.status}, Name: ${poojaLogin.data.user?.name}, Code: ${poojaLogin.data.user?.student_code}`);
    const poojaToken = poojaLogin.data.token;

    console.log('\n2. Fetching Assignments for Pooja from /api/assignments...');
    const poojaAssignments = await request(3003, '/api/assignments', 'GET', null, poojaToken);
    console.log(`  -> Response status: ${poojaAssignments.status}`);
    const poojaList = poojaAssignments.data.assignments || [];
    console.log(`  -> Total Assignments Received: ${poojaList.length}`);
    poojaList.forEach((a, idx) => {
        console.log(`     #${idx + 1} Title: "${a.title}" | Subject: ${a.subject} | Class: ${a.class_name} | Teacher: ${a.teacher_name} | Due: ${a.due_at}`);
    });

    const poojaHasClass8 = poojaList.some(a => a.target_class === 'Class 8' || a.title?.includes('Class 8'));
    console.log(`  -> Pooja received Class 8 Homework: ${poojaHasClass8 ? 'YES (PASS ✓)' : 'NO (FAIL ✗)'}`);

    // 2. Check Student 2: Vamsi Krishna (student_001@smartslate.test, Class 8)
    console.log('\n3. Logging in Student Vamsi Krishna (student_001@smartslate.test)...');
    const vamsiLogin = await request(3003, '/api/auth/login', 'POST', {
        email: 'student_001@smartslate.test',
        password: 'SmartSlate@123'
    });
    const vamsiToken = vamsiLogin.data.token;
    const vamsiAssignments = await request(3003, '/api/assignments', 'GET', null, vamsiToken);
    const vamsiList = vamsiAssignments.data.assignments || [];
    console.log(`  -> Total Assignments Received: ${vamsiList.length}`);
    vamsiList.forEach((a, idx) => {
        console.log(`     #${idx + 1} Title: "${a.title}" | Subject: ${a.subject} | Class: ${a.class_name}`);
    });

    // 3. Check Student 3: Akhil (student@smartslate.edu, 10th Class)
    console.log('\n4. Logging in Student Akhil (student@smartslate.edu, 10th Class)...');
    const akhilLogin = await request(3003, '/api/auth/login', 'POST', {
        email: 'student@smartslate.edu',
        password: 'SmartSlate@123'
    });
    const akhilToken = akhilLogin.data.token;
    const akhilAssignments = await request(3003, '/api/assignments', 'GET', null, akhilToken);
    const akhilList = akhilAssignments.data.assignments || [];
    console.log(`  -> Total Assignments Received: ${akhilList.length}`);
    akhilList.forEach((a, idx) => {
        console.log(`     #${idx + 1} Title: "${a.title}" | Subject: ${a.subject} | Class: ${a.class_name}`);
    });

    const akhilHasClass8 = akhilList.some(a => a.target_class === 'Class 8');
    console.log(`  -> Akhil correctly excluded from Class 8 tasks: ${!akhilHasClass8 ? 'YES (PASS ✓)' : 'NO (FAIL ✗)'}`);

    console.log('\n================================================================');
    console.log('VERIFICATION SUMMARY:');
    console.log(`Pooja assignments retrieved: ${poojaList.length > 0 ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`Vamsi assignments retrieved: ${vamsiList.length > 0 ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`Akhil assignments retrieved: ${akhilList.length > 0 ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`Grade isolation enforced: ${poojaHasClass8 && !akhilHasClass8 ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log('================================================================\n');
}

testStudentAssignmentsDisplay();
