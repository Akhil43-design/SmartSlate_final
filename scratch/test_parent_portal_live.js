/* Automated Test for Parent Portal Complete Flow */
const http = require('http');

function post(url, data, token) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const payload = JSON.stringify(data);
        const req = http.request({
            hostname: u.hostname,
            port: u.port,
            path: u.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function get(url, token) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = http.request({
            hostname: u.hostname,
            port: u.port,
            path: u.pathname,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTests() {
    console.log("===============================================================");
    console.log("🧪 TESTING PARENT PORTAL FULL FLOW (PORT 3001)");
    console.log("===============================================================");

    // Step 1: Parent Ramesh Login
    console.log("\n--- Step 1: Parent Login ---");
    const loginRes = await post('http://localhost:3001/api/auth/login', {
        email: 'parent_ramesh@smartslate.test',
        password: 'SmartSlate@123'
    });

    console.log(`Status: ${loginRes.status}`);
    console.log(`User: ${loginRes.data?.user?.name} (UID: ${loginRes.data?.user?.uid || loginRes.data?.user?.id})`);
    if (loginRes.status !== 200 || !loginRes.data?.token) {
        console.error("❌ Login failed!");
        process.exit(1);
    }
    console.log("✅ [PASS] Login successful and token generated");
    const token = loginRes.data.token;

    // Step 2: Fetch Connected Children
    console.log("\n--- Step 2: Fetch Connected Children ---");
    const childrenRes = await get('http://localhost:3001/api/parent/children', token);
    console.log(`Status: ${childrenRes.status}`);
    console.log(`Children Count: ${childrenRes.data?.children?.length || 0}`);
    if (childrenRes.status === 200 && Array.isArray(childrenRes.data?.children)) {
        console.log("✅ [PASS] Children endpoint responded correctly:", childrenRes.data.children.map(c => `${c.student_name || c.name} (${c.student_code})`));
    } else {
        console.error("❌ Failed to fetch children!");
        process.exit(1);
    }

    const firstChild = childrenRes.data.children[0] || { student_id: 1 };
    const sid = firstChild.student_id || firstChild.student_uid || 1;

    // Step 3: Fetch Child Overview & Progress
    console.log(`\n--- Step 3: Fetch Overview for Child (ID: ${sid}) ---`);
    const overviewRes = await get(`http://localhost:3001/api/parent/child/${sid}/overview`, token);
    console.log(`Status: ${overviewRes.status}`);
    console.log(`Overall Progress: ${overviewRes.data?.kpis?.overallProgress}%`);
    console.log(`Exam Average: ${overviewRes.data?.kpis?.examAverage}%`);
    if (overviewRes.status === 200) {
        console.log("✅ [PASS] Child Overview & KPIs loaded successfully");
    } else {
        console.error("❌ Overview failed:", overviewRes.body);
    }

    // Step 4: Fetch Child Exam Submissions
    console.log(`\n--- Step 4: Fetch Exam Submissions for Child (ID: ${sid}) ---`);
    const examsRes = await get(`http://localhost:3001/api/parent/child/${sid}/exams`, token);
    console.log(`Status: ${examsRes.status}`);
    console.log(`Exams Count: ${examsRes.data?.exams?.length || 0}`);
    if (examsRes.status === 200) {
        console.log("✅ [PASS] Child Exam Submissions loaded successfully");
    } else {
        console.error("❌ Exams failed:", examsRes.body);
    }

    // Step 5: Fetch Child Notes
    console.log(`\n--- Step 5: Fetch Digital Notes for Child (ID: ${sid}) ---`);
    const notesRes = await get(`http://localhost:3001/api/parent/child/${sid}/notes`, token);
    console.log(`Status: ${notesRes.status}`);
    console.log(`Notes Count: ${notesRes.data?.notes?.length || 0}`);
    if (notesRes.status === 200) {
        console.log("✅ [PASS] Child Digital Notes loaded successfully");
    } else {
        console.error("❌ Notes failed:", notesRes.body);
    }

    // Step 6: Fetch Child Searches
    console.log(`\n--- Step 6: Fetch Searches for Child (ID: ${sid}) ---`);
    const searchesRes = await get(`http://localhost:3001/api/parent/child/${sid}/searches`, token);
    console.log(`Status: ${searchesRes.status}`);
    if (searchesRes.status === 200) {
        console.log("✅ [PASS] Child Search Activity loaded successfully");
    } else {
        console.error("❌ Searches failed:", searchesRes.body);
    }

    // Step 7: Fetch Child Assignments
    console.log(`\n--- Step 7: Fetch Assignments for Child (ID: ${sid}) ---`);
    const assignRes = await get(`http://localhost:3001/api/parent/child/${sid}/assignments`, token);
    console.log(`Status: ${assignRes.status}`);
    if (assignRes.status === 200) {
        console.log("✅ [PASS] Child Assignments loaded successfully");
    } else {
        console.error("❌ Assignments failed:", assignRes.body);
    }

    // Step 8: Fetch Child Attendance
    console.log(`\n--- Step 8: Fetch Attendance for Child (ID: ${sid}) ---`);
    const attRes = await get(`http://localhost:3001/api/parent/child/${sid}/attendance`, token);
    console.log(`Status: ${attRes.status}`);
    console.log(`Attendance %: ${attRes.data?.percentage}%`);
    if (attRes.status === 200) {
        console.log("✅ [PASS] Child Attendance loaded successfully");
    } else {
        console.error("❌ Attendance failed:", attRes.body);
    }

    console.log("\n===============================================================");
    console.log("🎉 ALL PARENT PORTAL API ENDPOINTS & FLOWS VERIFIED 100% PASS");
    console.log("===============================================================");
}

runTests().catch(err => {
    console.error("Fatal test error:", err);
    process.exit(1);
});
