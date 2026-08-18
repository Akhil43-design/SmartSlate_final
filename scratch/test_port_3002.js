const http = require('http');

function check(path) {
    return new Promise((resolve) => {
        http.get(`http://localhost:3002${path}`, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                console.log(`GET http://localhost:3002${path} -> Status: ${res.statusCode}, Length: ${body.length}`);
                if (body.includes('<title>') || body.includes('SmartSlate')) {
                    console.log(`  -> Content verified: Contains SmartSlate frontend`);
                }
                resolve(res.statusCode);
            });
        }).on('error', (e) => {
            console.error(`GET http://localhost:3002${path} -> Error:`, e.message);
            resolve(500);
        });
    });
}

async function testAll() {
    console.log('Testing Port 3002 Elementary Server:');
    await check('/');
    await check('/login');
    await check('/health');
    await check('/api/health');
}

testAll();
