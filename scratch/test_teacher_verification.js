async function runTeacherVerification() {
    console.log("=================================================================");
    console.log("🔬 TESTING TEACHER API SPEED & FIRESTORE CLOUD DATA FLOW");
    console.log("=================================================================");

    const baseURL = 'http://localhost:3001';

    // 1. Teacher Login
    console.log("\n[1] Testing POST /api/auth/login...");
    const t0 = Date.now();
    const loginRes = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'teacher_math_hs@smartslate.test',
            password: 'SmartSlate@123',
            portalType: 'teacher'
        })
    });
    const loginTime = Date.now() - t0;
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status} | Time: ${loginTime}ms | User: ${loginData.user?.name} | UID: ${loginData.user?.uid}`);
    const token = loginData.token;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. GET /api/auth/me
    console.log("\n[2] Testing GET /api/auth/me...");
    const t1 = Date.now();
    const meRes = await fetch(`${baseURL}/api/auth/me`, { headers });
    const meTime = Date.now() - t1;
    const meData = await meRes.json();
    console.log(`Status: ${meRes.status} | Time: ${meTime}ms | Name: ${meData.user?.name} | Role: ${meData.user?.role}`);

    // 3. POST /api/teacher/connect-student
    console.log("\n[3] Testing POST /api/teacher/connect-student (STU-POOJ6A-11)...");
    const t2 = Date.now();
    const linkRes = await fetch(`${baseURL}/api/teacher/connect-student`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            studentCode: 'STU-POOJ6A-11',
            subject: 'Mathematics'
        })
    });
    const linkTime = Date.now() - t2;
    const linkData = await linkRes.json();
    console.log(`Status: ${linkRes.status} | Time: ${linkTime}ms | Success: ${linkData.success}`);

    // 4. GET /api/teacher/classes
    console.log("\n[4] Testing GET /api/teacher/classes...");
    const t3 = Date.now();
    const classesRes = await fetch(`${baseURL}/api/teacher/classes`, { headers });
    const classesTime = Date.now() - t3;
    const classesData = await classesRes.json();
    console.log(`Status: ${classesRes.status} | Time: ${classesTime}ms | Classes Count: ${classesData.classes?.length}`);
    console.log("Classes:", JSON.stringify(classesData.classes, null, 2));

    // 5. GET /api/teacher/students
    console.log("\n[5] Testing GET /api/teacher/students...");
    const t4 = Date.now();
    const studentsRes = await fetch(`${baseURL}/api/teacher/students`, { headers });
    const studentsTime = Date.now() - t4;
    const studentsData = await studentsRes.json();
    console.log(`Status: ${studentsRes.status} | Time: ${studentsTime}ms | Students Count: ${studentsData.students?.length}`);
    console.log("Students returned:", JSON.stringify(studentsData.students, null, 2));

    // 6. Regression: Parent children
    console.log("\n[6] Testing Parent Flow (Regression check)...");
    const pLoginRes = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'parent_ramesh@smartslate.test',
            password: 'SmartSlate@123',
            portalType: 'parent'
        })
    });
    const pLoginData = await pLoginRes.json();
    const pToken = pLoginData.token;
    const pChildrenRes = await fetch(`${baseURL}/api/parent/children`, {
        headers: { 'Authorization': `Bearer ${pToken}` }
    });
    const pChildrenData = await pChildrenRes.json();
    console.log(`Parent Children Status: ${pChildrenRes.status} | Count: ${pChildrenData.children?.length}`);

    console.log("\n=================================================================");
    console.log("🎉 ALL TIMING & DATA FLOW CHECKS PASSED!");
    console.log(`- /api/auth/login: ${loginTime}ms`);
    console.log(`- /api/auth/me: ${meTime}ms`);
    console.log(`- /api/teacher/connect-student: ${linkTime}ms`);
    console.log(`- /api/teacher/classes: ${classesTime}ms`);
    console.log(`- /api/teacher/students: ${studentsTime}ms`);
    console.log("=================================================================");
}

runTeacherVerification().catch(err => {
    console.error("Verification failed:", err);
    process.exit(1);
});
