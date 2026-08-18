/**
 * SmartSlate Platform - Master Server Launcher
 * Launches all 6 educational tier servers and verifies their ports.
 * 
 * Ports:
 *  - 3000: Main Learning Gateway Hub
 *  - 3001: Parent & Teacher Web Portal
 *  - 3002: Elementary (Classes 1–5 Vite React App)
 *  - 3003: High School (Classes 6–10 Student OS)
 *  - 3004: Intermediate (Classes 11–12 Student OS)
 *  - 3005: B.Tech / Higher Ed (Student OS)
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const rootDir = path.resolve(__dirname);

const SERVICES = [
    {
        name: 'Main Learning Gateway',
        port: 3000,
        cmd: 'node',
        args: ['student/server/server.js'],
        cwd: rootDir
    },
    {
        name: 'Parent & Teacher Web Portal',
        port: 3001,
        cmd: 'node',
        args: ['parent-teacher/server/server.js'],
        cwd: rootDir
    },
    {
        name: 'Elementary School (Classes 1–5)',
        port: 3002,
        cmd: 'node',
        args: ['server.cjs'],
        cwd: path.join(rootDir, '5thbelow')
    },
    {
        name: 'High School (Classes 6–10)',
        port: 3003,
        cmd: 'node',
        args: ['6to10th/student/server/server.js'],
        cwd: rootDir
    },
    {
        name: 'Intermediate (Classes 11–12)',
        port: 3004,
        cmd: 'node',
        args: ['intermediate/server.js'],
        cwd: rootDir
    },
    {
        name: 'B.Tech / Higher Ed',
        port: 3005,
        cmd: 'node',
        args: ['btech/server.js'],
        cwd: rootDir
    }
];

function probePort(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
            resolve({ online: true, status: res.statusCode });
        });
        req.on('error', () => resolve({ online: false }));
        req.setTimeout(2000, () => {
            req.destroy();
            resolve({ online: false });
        });
    });
}

const { migrateAllDatabases } = require('./shared/db/migrate');

async function startAll() {
    console.log('=================================================================');
    console.log('🚀 SMARTSLATE MASTER SERVER LAUNCHER');
    console.log('=================================================================\n');

    try {
        await migrateAllDatabases(rootDir);
    } catch (e) {
        console.warn('⚠️ [Pre-start] Database migration note:', e.message);
    }

    for (const s of SERVICES) {
        const check = await probePort(s.port);
        if (check.online) {
            console.log(`🟢 [ALREADY ACTIVE] Port ${s.port}: ${s.name} (HTTP ${check.status})`);
        } else {
            console.log(`⚡ [LAUNCHING] Port ${s.port}: ${s.name}...`);
            const child = spawn(s.cmd, s.args, {
                cwd: s.cwd,
                stdio: 'ignore',
                shell: true,
                detached: true
            });
            child.unref();
        }
    }

    console.log('\n⏳ Waiting for all services to stabilize...\n');
    await new Promise(r => setTimeout(r, 4000));

    console.log('=================================================================');
    console.log('🌐 SMARTSLATE NETWORK PORT STATUS');
    console.log('=================================================================');

    for (const s of SERVICES) {
        const probe = await probePort(s.port);
        const icon = probe.online ? '🟢 [ONLINE]' : '🔴 [FAILED]';
        console.log(`${icon} Port ${s.port}: http://localhost:${s.port} (${s.name})`);
    }

    console.log('=================================================================\n');
}

startAll().catch(console.error);
