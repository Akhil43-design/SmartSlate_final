/* Final Verification Test for Parent Dashboard Loading via Server API */
const http = require('http');

async function testFinal() {
    console.log("=================================================================");
    console.log("🚀 FINAL ACCEPTANCE: PARENT API & FIRESTORE CLOUD ARCHITECTURE");
    console.log("=================================================================");

    // Step 1: Login
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

    console.log(`[1] Auth Status: ${login.status} | User: ${login.data?.user?.name} | UID: ${login.data?.user?.uid}`);
    const token = login.data.token;

    // Step 2: Link Student STU-VAMS1A-11
    console.log("\n[2] Linking Student STU-VAMS1A-11 via POST /api/parent/link...");
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

    console.log(`Link Status: ${linkRes.status}`, linkRes.data?.child);

    // Step 3: GET /api/parent/children
    console.log("\n[3] Calling GET /api/parent/children...");
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

    console.log(`Children Status: ${kids.status} | Count: ${kids.data?.children?.length}`);
    console.log("Children returned:", kids.data?.children);

    if (kids.status === 200 && kids.data?.success && kids.data.children.length > 0) {
        console.log("\n✅ [PASS] Parent children loaded successfully from Firestore backend!");
    } else {
        console.error("\n❌ Failed to load children!");
        process.exit(1);
    }
}

testFinal().catch(err => {
    console.error("Fatal:", err);
    process.exit(1);
});
