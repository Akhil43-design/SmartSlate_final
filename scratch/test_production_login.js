const http = require('http');

function request(port, method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('\n===============================================================');
    console.log('🧪 VERIFYING CLOUD AUTHENTICATION & LOGIN FLOW (PORT 3001)');
    console.log('===============================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(name, condition) {
        if (condition) {
            console.log(`  ✅ [PASS] ${name}`);
            passed++;
        } else {
            console.error(`  ❌ [FAIL] ${name}`);
            failed++;
        }
    }

    // 1. Parent Ramesh Login
    console.log('--- Test 1: Parent Ramesh Login ---');
    const parentLogin = await request(3001, 'POST', '/api/auth/login', {}, {
        email: 'parent_ramesh@smartslate.test',
        password: 'SmartSlate@123'
    });
    assert('Parent Ramesh login returns HTTP 200', parentLogin.status === 200);
    assert('Parent Ramesh role is "parent"', parentLogin.data?.user?.role === 'parent');
    assert('Parent Ramesh token generated', !!parentLogin.data?.token);
    assert('Parent Ramesh name is Ramesh Kumar', parentLogin.data?.user?.name === 'Ramesh Kumar');

    // 2. Teacher Priya Login
    console.log('\n--- Test 2: Teacher Priya Login ---');
    const teacherLogin = await request(3001, 'POST', '/api/auth/login', {}, {
        email: 'teacher_math_hs@smartslate.test',
        password: 'SmartSlate@123'
    });
    assert('Teacher Priya login returns HTTP 200', teacherLogin.status === 200);
    assert('Teacher Priya role is "teacher"', teacherLogin.data?.user?.role === 'teacher');
    assert('Teacher Priya token generated', !!teacherLogin.data?.token);
    assert('Teacher Priya teacherCode is valid', !!teacherLogin.data?.user?.teacherCode);

    // 3. Demo Teacher Login
    console.log('\n--- Test 3: Demo Teacher Login ---');
    const demoTeacher = await request(3001, 'POST', '/api/auth/login', {}, {
        email: 'teacher@smartslate.edu',
        password: 'SmartSlate@123'
    });
    assert('Demo Teacher login returns HTTP 200', demoTeacher.status === 200);
    assert('Demo Teacher role is "teacher"', demoTeacher.data?.user?.role === 'teacher');

    // 4. Demo Parent Login
    console.log('\n--- Test 4: Demo Parent Login ---');
    const demoParent = await request(3001, 'POST', '/api/auth/login', {}, {
        email: 'parent@smartslate.edu',
        password: 'SmartSlate@123'
    });
    assert('Demo Parent login returns HTTP 200', demoParent.status === 200);
    assert('Demo Parent role is "parent"', demoParent.data?.user?.role === 'parent');

    // 5. Invalid Password Error Handling (Must NEVER return 500)
    console.log('\n--- Test 5: Invalid Password Security ---');
    const badLogin = await request(3001, 'POST', '/api/auth/login', {}, {
        email: 'unknown_account@test.com',
        password: 'wrong'
    });
    assert('Invalid credentials returns HTTP 401 (Not 500)', badLogin.status === 401);
    assert('Error message provided', !!badLogin.data?.error);

    // 6. Profile Verification (/api/auth/me)
    console.log('\n--- Test 6: Profile Retrieval (/api/auth/me) ---');
    const meRes = await request(3001, 'GET', '/api/auth/me', {
        Authorization: `Bearer ${parentLogin.data?.token}`
    });
    assert('/api/auth/me returns HTTP 200', meRes.status === 200);
    assert('/api/auth/me returns valid user role', meRes.data?.user?.role === 'parent');

    console.log(`\n===============================================================`);
    console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`===============================================================\n`);

    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
