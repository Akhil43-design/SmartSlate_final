const http = require('http');

function post(path, body, token) {
    return new Promise((resolve) => {
        const postData = JSON.stringify(body);
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request({
            hostname: 'localhost',
            port: 3001,
            path,
            method: 'POST',
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
        req.write(postData);
        req.end();
    });
}

async function testParentLink() {
    console.log('1. Logging in as Parent...');
    const login = await post('/api/auth/login', {
        email: 'parent_ramesh@smartslate.test',
        password: 'SmartSlate@123'
    });
    console.log('Login result:', login.status, login.data.user?.name);

    const token = login.data.token;
    console.log('2. Linking Child (STU-VAMS1A-11)...');
    const linkRes = await post('/api/parent/link', {
        studentCode: 'STU-VAMS1A-11'
    }, token);
    console.log('Link result:', linkRes.status, linkRes.data);
}

testParentLink();
