/**
 * LIVE AUTHENTICATION TEST ACROSS B.TECH (3005) AND PARENT/TEACHER (3001)
 */

const http = require('http');

function postJson(hostname, port, path, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const req = http.request({
            hostname: hostname,
            port: port,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function getJson(hostname, port, path, token) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: hostname,
            port: port,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function testLiveAuth() {
    console.log('\n======================================================');
    console.log('TESTING LIVE REAL AUTHENTICATION ON RUNNING SERVERS');
    console.log('======================================================\n');

    // 1. Test Parent Login on Port 3001
    console.log('1. Testing Parent Login (parent_ramesh@smartslate.test)...');
    try {
        const parentRes = await postJson('127.0.0.1', 3001, '/api/auth/login', {
            email: 'parent_ramesh@smartslate.test',
            password: 'SmartSlate@123'
        });

        console.log(`- Status: ${parentRes.status}`);
        console.log(`- Response:`, parentRes.data);

        if (parentRes.status === 200 && parentRes.data.token) {
            console.log(`[PASS] Parent logged in successfully! User: ${parentRes.data.user.name}, Code: ${parentRes.data.user.parentCode}`);
            
            // Check connected children
            const childrenRes = await getJson('127.0.0.1', 3001, '/api/parent/children', parentRes.data.token);
            console.log(`- Parent Children Status: ${childrenRes.status}, Count: ${childrenRes.data.children ? childrenRes.data.children.length : 0}`);
        } else {
            console.error(`[FAIL] Parent login failed.`);
        }
    } catch (e) {
        console.error(`[FAIL] Parent server error:`, e.message);
    }

    // 2. Test Teacher Login on Port 3001
    console.log('\n2. Testing Teacher Login (teacher_math_hs@smartslate.test)...');
    try {
        const teacherRes = await postJson('127.0.0.1', 3001, '/api/auth/login', {
            email: 'teacher_math_hs@smartslate.test',
            password: 'SmartSlate@123'
        });

        console.log(`- Status: ${teacherRes.status}`);
        console.log(`- Response:`, teacherRes.data);

        if (teacherRes.status === 200 && teacherRes.data.token) {
            console.log(`[PASS] Teacher logged in successfully! User: ${teacherRes.data.user.name}, Subject: ${teacherRes.data.user.subject}, Code: ${teacherRes.data.user.teacherCode}`);
            
            // Check connected students
            const studentsRes = await getJson('127.0.0.1', 3001, '/api/teacher/students', teacherRes.data.token);
            console.log(`- Teacher Students Status: ${studentsRes.status}, Count: ${studentsRes.data.students ? studentsRes.data.students.length : 0}`);
        } else {
            console.error(`[FAIL] Teacher login failed.`);
        }
    } catch (e) {
        console.error(`[FAIL] Teacher server error:`, e.message);
    }

    // 3. Test B.Tech Portal Local Endpoints on Port 3005
    console.log('\n3. Testing B.Tech Server on Port 3005...');
    try {
        const btechBooks = await getJson('127.0.0.1', 3005, '/api/books', '');
        console.log(`- B.Tech Books endpoint status: ${btechBooks.status}`);
        console.log(`[PASS] B.Tech server is live on http://localhost:3005!`);
    } catch (e) {
        console.error(`[FAIL] B.Tech server error:`, e.message);
    }
}

testLiveAuth().catch(console.error);
