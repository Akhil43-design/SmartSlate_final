const http = require('http');

const endpoints = [
    { port: 3000, name: 'Main Learning Gateway', path: '/' },
    { port: 3001, name: 'Parent & Teacher Portal', path: '/' },
    { port: 3002, name: 'Elementary (5th Below React/Vite)', path: '/' },
    { port: 3003, name: 'High School (6to10th Student OS)', path: '/' },
    { port: 3004, name: 'Intermediate (Classes 11-12)', path: '/' },
    { port: 3005, name: 'B.Tech / Higher Ed', path: '/' }
];

function testEndpoint(ep) {
    return new Promise((resolve) => {
        http.get(`http://localhost:${ep.port}${ep.path}`, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                const titleMatch = body.match(/<title>([^<]+)<\/title>/i);
                const title = titleMatch ? titleMatch[1] : 'No title found';
                resolve({
                    port: ep.port,
                    name: ep.name,
                    status: res.statusCode,
                    title: title.trim(),
                    bytes: body.length
                });
            });
        }).on('error', (err) => {
            resolve({
                port: ep.port,
                name: ep.name,
                status: 'ERR',
                error: err.message
            });
        });
    });
}

async function run() {
    console.log('=================================================================');
    console.log('🌐 VERIFYING UPDATED WEBSITES ACROSS ALL PORTS (3000 - 3005)');
    console.log('=================================================================\n');

    const results = await Promise.all(endpoints.map(testEndpoint));
    results.forEach(r => {
        console.log(`Port ${r.port} [${r.name}]:`);
        console.log(`  HTTP Status: ${r.status}`);
        console.log(`  Document Title: "${r.title || r.error}"`);
        console.log(`  Page Size: ${r.bytes || 0} bytes\n`);
    });
}

run().catch(console.error);
