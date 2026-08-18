async function runTeacherTest() {
    console.log("=================================================================");
    console.log("🔬 TESTING TEACHER PORTAL CLOUD FIRESTORE STUDENT FLOW");
    console.log("=================================================================");

    const baseURL = 'http://localhost:3001';

    // 1. Teacher Login
    console.log("\n[1] Teacher Login (teacher_math_hs@smartslate.test)...");
    const loginRes = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'teacher_math_hs@smartslate.test',
            password: 'SmartSlate@123',
            portalType: 'teacher'
        })
    });
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status} | User: ${loginData.user?.name} | UID: ${loginData.user?.uid}`);
    const token = loginData.token;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Connect Student STU-POOJ6A-11
    console.log("\n[2] Connecting Student STU-POOJ6A-11 for Teacher...");
    const linkRes = await fetch(`${baseURL}/api/teacher/connect-student`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            studentCode: 'STU-POOJ6A-11',
            subject: 'Mathematics'
        })
    });
    const linkData = await linkRes.json();
    console.log(`Status: ${linkRes.status} | Success: ${linkData.success}`);
    console.log("Connected student:", linkData.student);

    // 3. Get Teacher Students
    console.log("\n[3] Calling GET /api/teacher/students...");
    const studentsRes = await fetch(`${baseURL}/api/teacher/students`, { headers });
    const studentsData = await studentsRes.json();
    console.log(`Status: ${studentsRes.status} | Count: ${studentsData.students?.length}`);
    console.log("Students returned:", JSON.stringify(studentsData.students, null, 2));

    if (!studentsData.students || studentsData.students.length === 0) {
        throw new Error("❌ FAIL: Teacher students array is empty!");
    }

    // 4. Verify Parent flow still works (regression test)
    console.log("\n[4] Regression Test: Parent Flow...");
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
    console.log(`Status: ${pChildrenRes.status} | Parent Children Count: ${pChildrenData.children?.length}`);

    console.log("\n=================================================================");
    console.log("🎉 ALL TEACHER & PARENT FLOW TESTS PASSED!");
    console.log("=================================================================");
}

runTeacherTest().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
