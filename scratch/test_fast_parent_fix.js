/* Test Fast Direct Firebase Children Loading Fix */
const http = require('http');

async function testFastFix() {
    console.log("=================================================================");
    console.log("⚡ TESTING FAST DIRECT FIREBASE PARENT CHILDREN FIX");
    console.log("=================================================================");

    // Step 1: Parent Login
    const login = await new Promise(resolve => {
        const req = http.request('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, res => {
            let b = '';
            res.on('data', c => b += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(b) }));
        });
        req.write(JSON.stringify({ email: 'parent_ramesh@smartslate.test', password: 'SmartSlate@123' }));
        req.end();
    });

    console.log(`[Parent] Logged in: ${login.data?.user?.name} (Status: ${login.status})`);
    const token = login.data.token;

    // Step 2: Connect Student STU-VAMS1A-11 (Vamsi Sharma)
    console.log("\n[Parent] Connecting Student STU-VAMS1A-11...");
    const linkRes = await new Promise(resolve => {
        const req = http.request('http://localhost:3001/api/parent/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        }, res => {
            let b = '';
            res.on('data', c => b += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(b) }));
        });
        req.write(JSON.stringify({ studentCode: 'STU-VAMS1A-11' }));
        req.end();
    });
    console.log(`[Parent] Link status: ${linkRes.status}`, linkRes.data?.child?.name, `(${linkRes.data?.child?.studentCode})`);

    // Step 3: Fetch Children
    console.log("\n[Parent] Fetching connected children list...");
    const kids = await new Promise(resolve => {
        const req = http.request('http://localhost:3001/api/parent/children', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }, res => {
            let b = '';
            res.on('data', c => b += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(b) }));
        });
        req.end();
    });

    console.log(`[Parent] Children count: ${kids.data?.children?.length || 0}`);
    console.log("Children details:", kids.data?.children?.map(c => ({
        name: c.name || c.student_name,
        code: c.studentCode || c.student_code,
        class: c.class || c.class_name,
        section: c.section,
        school: c.schoolName || c.school_name,
        educationLevel: c.educationLevel || c.education_level,
        status: c.status
    })));

    if (kids.data?.children?.length > 0 && kids.data.children.some(c => c.studentCode === 'STU-VAMS1A-11' || c.student_code === 'STU-VAMS1A-11')) {
        console.log("\n✅ [PASS] Connected child Vamsi Sharma (STU-VAMS1A-11) is retrieved and displayed!");
    } else {
        console.error("\n❌ Connected child not retrieved!");
        process.exit(1);
    }

    console.log("\n=================================================================");
    console.log("🎉 FAST FIX VERIFIED 100% WORKING END-TO-END");
    console.log("=================================================================");
}

testFastFix().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
