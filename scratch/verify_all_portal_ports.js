const http = require('http');

const ports = [
    { port: 3000, name: 'Main Gateway / Kiosk' },
    { port: 3001, name: 'Parent & Teacher Portal' },
    { port: 3002, name: 'Elementary (Classes 1–5)' },
    { port: 3003, name: 'High School (Classes 6–10)' },
    { port: 3004, name: 'Intermediate & Diploma' },
    { port: 3005, name: 'B.Tech / Higher Education' }
];

async function checkPort(p) {
    return new Promise((resolve) => {
        http.get(`http://localhost:${p.port}/`, (res) => {
            console.log(`[PASS] ${p.name.padEnd(32)} -> http://localhost:${p.port}/ Status: ${res.statusCode}`);
            resolve(res.statusCode === 200 || res.statusCode === 304);
        }).on('error', (e) => {
            console.error(`[FAIL] ${p.name.padEnd(32)} -> http://localhost:${p.port}/ Error: ${e.message}`);
            resolve(false);
        });
    });
}

async function verifyAll() {
    console.log('\n======================================================');
    console.log('SMARTSLATE — MULTI-PORT PLATFORM HEALTH AUDIT');
    console.log('======================================================\n');
    for (const p of ports) {
        await checkPort(p);
    }
    console.log('\n======================================================\n');
}

verifyAll();
