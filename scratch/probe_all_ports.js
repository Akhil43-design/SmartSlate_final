const http = require('http');

const servers = [
    { port: 3000, name: 'Main Student Hub / Gateway', path: '/api/health' },
    { port: 3001, name: 'Parent & Teacher Web Portal', path: '/api/health' },
    { port: 3002, name: 'Elementary (Classes 1–5)', path: '/api/health' },
    { port: 3003, name: 'High School (Classes 6–10)', path: '/api/health' },
    { port: 3004, name: 'Intermediate (Classes 11–12)', path: '/api/health' },
    { port: 3005, name: 'B.Tech / Higher Engineering', path: '/api/health' }
];

function checkServer(srv) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${srv.port}${srv.path}`, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                resolve({
                    port: srv.port,
                    name: srv.name,
                    status: res.statusCode,
                    body: body.slice(0, 120),
                    ok: res.statusCode === 200
                });
            });
        });
        req.on('error', (err) => {
            resolve({
                port: srv.port,
                name: srv.name,
                status: 'OFFLINE',
                error: err.message,
                ok: false
            });
        });
        req.setTimeout(2500, () => {
            req.destroy();
            resolve({
                port: srv.port,
                name: srv.name,
                status: 'TIMEOUT',
                ok: false
            });
        });
    });
}

async function probeAll() {
    console.log('=================================================================');
    console.log('🔍 PROBING ALL SMARTSLATE SYSTEM PORTS (3000 - 3005)');
    console.log('=================================================================\n');

    const results = await Promise.all(servers.map(checkServer));

    results.forEach(r => {
        const icon = r.ok ? '🟢 [ONLINE]' : '🔴 [OFFLINE]';
        console.log(`${icon} Port ${r.port}: ${r.name}`);
        console.log(`   Status: ${r.status} | Response: ${r.body || r.error || 'N/A'}`);
    });

    console.log('\n=================================================================');
    const allOnline = results.every(r => r.ok);
    console.log(allOnline ? '🎉 ALL 6 SMARTSLATE SERVERS ARE ONLINE & RESPONDING!' : '⚠️ SOME SERVERS ARE OFFLINE');
    console.log('=================================================================');
}

probeAll().catch(console.error);
