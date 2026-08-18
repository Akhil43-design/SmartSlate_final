/**
 * SmartSlate — Raspberry Pi 2 W Master Production Server
 * Optimized for Raspberry Pi OS (ARM, 512 MB RAM)
 * 
 * Manages all educational tiers and portals within strict memory constraints.
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname);

// Auto-build 5thbelow assets if not present
const elementaryNitroBundle = path.join(rootDir, '5thbelow/.output/server/index.mjs');
if (!fs.existsSync(elementaryNitroBundle) && fs.existsSync(path.join(rootDir, '5thbelow/package.json'))) {
    try {
        console.log('📦 [Pre-start] Building Elementary School (5thbelow) production bundle...');
        execSync('npm run build', { cwd: path.join(rootDir, '5thbelow'), stdio: 'inherit' });
        console.log('✅ [Pre-start] Elementary School production bundle ready.');
    } catch (e) {
        console.warn('⚠️ [Pre-start] Elementary build note:', e.message);
    }
}

// Tier configuration with strict memory allocation (max 64M - 96M per process)
const SERVICES = [
    {
        name: 'Main Learning Gateway',
        port: 3000,
        script: path.join(rootDir, 'student/server/server.js'),
        cwd: rootDir,
        env: { PORT: 3000, NODE_ENV: 'production' }
    },
    {
        name: 'Parent & Teacher Web Portal',
        port: 3001,
        script: path.join(rootDir, 'parent-teacher/server/server.js'),
        cwd: rootDir,
        env: { PORT: 3001, NODE_ENV: 'production' }
    },
    {
        name: 'Elementary School (Classes 1–5)',
        port: 3002,
        script: path.join(rootDir, '5thbelow/server.cjs'),
        cwd: path.join(rootDir, '5thbelow'),
        env: { PORT: 3002, NODE_ENV: 'production' }
    },
    {
        name: 'High School (Classes 6–10)',
        port: 3003,
        script: path.join(rootDir, '6to10th/student/server/server.js'),
        cwd: rootDir,
        env: { PORT: 3003, NODE_ENV: 'production' }
    },
    {
        name: 'Intermediate (Classes 11–12)',
        port: 3004,
        script: path.join(rootDir, 'intermediate/server.js'),
        cwd: rootDir,
        env: { PORT: 3004, NODE_ENV: 'production' }
    },
    {
        name: 'B.Tech / Higher Ed',
        port: 3005,
        script: path.join(rootDir, 'btech/server.js'),
        cwd: rootDir,
        env: { PORT: 3005, NODE_ENV: 'production' }
    }
];

console.log('===============================================================');
console.log('🍇 SmartSlate Production Master Server — Raspberry Pi 2 W');
console.log('   OS: Raspberry Pi OS | RAM Limit: 512 MB | Wi-Fi: 10.42.0.1');
console.log('===============================================================\n');

const runningProcesses = [];

function startService(service) {
    if (!fs.existsSync(service.script)) {
        console.warn(`⚠️ [SKIP] Script not found: ${service.script}`);
        return;
    }

    const nodeArgs = [
        '--max-old-space-size=96', // Strict 96MB limit for Pi 2 W 512MB RAM
        service.script
    ];

    const child = spawn(process.execPath, nodeArgs, {
        cwd: service.cwd,
        env: { ...process.env, ...service.env },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => {
        const line = data.toString().trim();
        if (line.includes('running on') || line.includes('initialized') || line.includes('ready')) {
            console.log(`[${service.name}] ${line}`);
        }
    });

    child.stderr.on('data', (data) => {
        console.error(`[${service.name} ERR] ${data.toString().trim()}`);
    });

    child.on('exit', (code, signal) => {
        console.warn(`⚠️ [${service.name}] Process exited (Code: ${code}, Signal: ${signal}). Auto-restarting in 3s...`);
        setTimeout(() => startService(service), 3000);
    });

    runningProcesses.push({ name: service.name, child, port: service.port });
}

// Start all services
SERVICES.forEach(startService);

// Health Checker after 6 seconds
setTimeout(() => {
    console.log('\n--- 🩺 SmartSlate Health Verification (10.42.0.1) ---');
    SERVICES.forEach(s => {
        const req = http.get(`http://127.0.0.1:${s.port}/api/health`, (res) => {
            console.log(`  ✅ Port ${s.port} [${s.name}]: UP (HTTP ${res.statusCode}) -> http://10.42.0.1:${s.port}`);
        });
        req.on('error', () => {
            console.log(`  ⏳ Port ${s.port} [${s.name}]: Initializing -> http://10.42.0.1:${s.port}`);
        });
    });
}, 6000);

// Graceful shutdown handling
function shutdown() {
    console.log('\nShutting down SmartSlate services...');
    runningProcesses.forEach(p => {
        try { p.child.kill('SIGTERM'); } catch(e) {}
    });
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
