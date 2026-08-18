const http = require('http');

function req(path, method = 'GET', body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`http://localhost:3001${path}`);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const postData = body ? JSON.stringify(body) : null;
        if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

        const r = http.request(url, { method, headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = {};
                try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        r.on('error', reject);
        if (postData) r.write(postData);
        r.end();
    });
}

async function runTests() {
    console.log("=================================================================");
    console.log("🔬 RUNNING FULL END-TO-END SUITE (PARENT & TEACHER VERCEL FLOW)");
    console.log("=================================================================");

    // 1. Health Check
    console.log("\n[1] Testing GET /api/health...");
    const health = await req('/api/health');
    console.log(`Status: ${health.status} | Body:`, health.data);
    if (health.status !== 200) throw new Error("Health check failed");

    // 2. Parent Login
    console.log("\n[2] Testing Parent Login (parent_ramesh@smartslate.test)...");
    const parentLogin = await req('/api/auth/login', 'POST', {
        email: 'parent_ramesh@smartslate.test',
        password: 'SmartSlate@123'
    });
    console.log(`Status: ${parentLogin.status} | User: ${parentLogin.data?.user?.name} | UID: ${parentLogin.data?.user?.uid}`);
    if (parentLogin.status !== 200) throw new Error("Parent login failed");
    const parentToken = parentLogin.data.token;

    // 3. Parent Auth Me
    console.log("\n[3] Testing GET /api/auth/me for Parent...");
    const parentMe = await req('/api/auth/me', 'GET', null, parentToken);
    console.log(`Status: ${parentMe.status} | Name: ${parentMe.data?.user?.name} | Role: ${parentMe.data?.user?.role}`);
    if (parentMe.status !== 200) throw new Error("Auth me failed");

    // 4. Link Student STU-DAYA8A-89
    console.log("\n[4] Testing POST /api/parent/link with STU-DAYA8A-89...");
    const linkRes = await req('/api/parent/link', 'POST', { studentCode: 'STU-DAYA8A-89' }, parentToken);
    console.log(`Status: ${linkRes.status} | Success: ${linkRes.data?.success}`);
    console.log("Child object returned:", linkRes.data?.child);
    if (linkRes.status !== 200 || !linkRes.data?.success) throw new Error("Link child failed");

    // 5. Parent Get Children
    console.log("\n[5] Testing GET /api/parent/children...");
    const childrenRes = await req('/api/parent/children', 'GET', null, parentToken);
    console.log(`Status: ${childrenRes.status} | Count: ${childrenRes.data?.children?.length}`);
    console.log("Children returned:", childrenRes.data?.children);
    if (childrenRes.status !== 200 || childrenRes.data?.children?.length === 0) {
        throw new Error("Children list empty or failed");
    }

    // 6. Teacher Login
    console.log("\n[6] Testing Teacher Login (teacher_math_hs@smartslate.test)...");
    const teacherLogin = await req('/api/auth/login', 'POST', {
        email: 'teacher_math_hs@smartslate.test',
        password: 'SmartSlate@123'
    });
    console.log(`Status: ${teacherLogin.status} | User: ${teacherLogin.data?.user?.name} | UID: ${teacherLogin.data?.user?.uid}`);
    if (teacherLogin.status !== 200) throw new Error("Teacher login failed");
    const teacherToken = teacherLogin.data.token;

    // 7. Teacher Connect Student STU-DAYA8A-89
    console.log("\n[7] Testing POST /api/teacher/connect-student with STU-DAYA8A-89...");
    const tConnect = await req('/api/teacher/connect-student', 'POST', { studentCode: 'STU-DAYA8A-89' }, teacherToken);
    console.log(`Status: ${tConnect.status} | Success: ${tConnect.data?.success}`);
    console.log("Student object returned:", tConnect.data?.student);
    if (tConnect.status !== 200 || !tConnect.data?.success) throw new Error("Teacher connect failed");

    // 8. Teacher Get Classes & Connected Students
    console.log("\n[8] Testing GET /api/teacher/classes...");
    const tClasses = await req('/api/teacher/classes', 'GET', null, teacherToken);
    console.log(`Status: ${tClasses.status} | Classes Count: ${tClasses.data?.classes?.length} | Students Count: ${tClasses.data?.students?.length}`);
    if (tClasses.status !== 200) throw new Error("Teacher classes failed");

    console.log("\n=================================================================");
    console.log("🎉 ALL TESTS PASSED! FULL VERCEL ARCHITECTURE VERIFIED!");
    console.log("=================================================================");
}

runTests().catch(err => {
    console.error("\n❌ Test Suite Failed:", err.message);
    process.exit(1);
});
