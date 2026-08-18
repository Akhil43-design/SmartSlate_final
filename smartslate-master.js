/**
 * SmartSlate Universal Master Server & Portal Orchestrator
 * Supports Windows, macOS, Linux, and Raspberry Pi
 * 
 * Features:
 * - Dynamic Wi-Fi / Local Network IP Detection (adapts when changing Wi-Fi networks)
 * - Safe Idempotent SQLite Migrations before service booting
 * - Multi-tier Port Orchestration (3000–3005)
 * - Dynamic Mobile & Localhost link display
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { migrateAllDatabases } = require('./shared/db/migrate');

const rootDir = path.resolve(__dirname);

// 1. Dynamic IP Address Detection
function getLocalNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            // Match IPv4 addresses that are not loopback (127.0.0.1)
            if ((net.family === 'IPv4' || net.family === 4) && !net.internal) {
                addresses.push({ interface: name, ip: net.address });
            }
        }
    }
    return addresses;
}

// 2. Microservices Definition (Ports 3000–3005)
const SERVICES = [
    {
        name: 'Main Learning Gateway',
        port: 3000,
        script: path.join(rootDir, 'student/server/server.js'),
        cwd: rootDir,
        env: { PORT: 3000, NODE_ENV: 'production' }
    },
    {
        name: 'Parent & Teacher Portal',
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
        name: 'B.Tech / Higher Education',
        port: 3005,
        script: path.join(rootDir, 'btech/server.js'),
        cwd: rootDir,
        env: { PORT: 3005, NODE_ENV: 'production' }
    }
];

const runningProcesses = [];
let shuttingDown = false;

function startService(svc) {
    if (shuttingDown) return;

    const child = spawn(process.execPath, [svc.script], {
        cwd: svc.cwd,
        env: { ...process.env, ...svc.env },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (d) => {
        const text = d.toString().trim();
        if (text) {
            console.log(`[${svc.name}] ${text}`);
        }
    });

    child.stderr.on('data', (d) => {
        const text = d.toString().trim();
        if (text) {
            console.error(`[${svc.name} ERR] ${text}`);
        }
    });

    child.on('exit', (code) => {
        if (!shuttingDown) {
            console.warn(`⚠️ [${svc.name}] exited with code ${code}. Restarting in 2.5s...`);
            setTimeout(() => startService(svc), 2500);
        }
    });

    runningProcesses.push({ name: svc.name, child, port: svc.port });
}

function displayBanner(networkList) {
    console.log('\n' + '='.repeat(70));
    console.log('       🚀  SMARTSLATE UNIFIED LEARNING PLATFORM  🚀');
    console.log('='.repeat(70));

    if (networkList.length > 0) {
        console.log('📡 Detected Network & Wi-Fi IP(s):');
        networkList.forEach(net => {
            console.log(`   👉 [${net.interface}]: ${net.ip}`);
        });

        console.log('\n📱 MOBILE PHONE ACCESS (Open these links on your phone):');
        networkList.forEach(net => {
            console.log(`\n   --- Via [${net.interface}] (${net.ip}) ---`);
            SERVICES.forEach(s => {
                console.log(`   🔗 Port ${s.port} [${s.name}]: http://${net.ip}:${s.port}`);
            });
        });
    } else {
        console.log('⚠️ No active Wi-Fi or LAN detected. Running on localhost only.');
    }

    console.log('\n💻 LAPTOP (LOCALHOST) ACCESS:');
    SERVICES.forEach(s => {
        console.log(`   🔗 Port ${s.port} [${s.name}]: http://localhost:${s.port}`);
    });

    console.log('\n🔑 DEMO ACCOUNTS:');
    console.log('   👤 Student:        student_151@smartslate.test  / SmartSlate@123');
    console.log('   👨‍🏫 Teacher:        teacher_math_hs@smartslate.test / SmartSlate@123');
    console.log('   👨‍👩‍👧 Parent:         parent_ramesh@smartslate.test / SmartSlate@123');
    console.log('='.repeat(70) + '\n');
}

async function bootstrap() {
    const networkList = getLocalNetworkAddresses();
    displayBanner(networkList);

    // 1. Auto-build 5thbelow assets if not present
    const elementaryNitroBundle = path.join(rootDir, '5thbelow/.output/server/index.mjs');
    if (!fs.existsSync(elementaryNitroBundle) && fs.existsSync(path.join(rootDir, '5thbelow/package.json'))) {
        try {
            console.log('📦 [Pre-Flight] Building Elementary School (5thbelow) production bundle...');
            execSync('npm run build', { cwd: path.join(rootDir, '5thbelow'), stdio: 'inherit' });
            console.log('✅ [Pre-Flight] Elementary School bundle build complete.');
        } catch (e) {
            console.warn('⚠️ [Pre-Flight] Elementary build warning:', e.message);
        }
    }

    // 2. Run safe SQLite migrations once BEFORE child processes boot
    try {
        console.log('🔄 [Pre-Flight] Initializing and verifying SQLite databases...');
        await migrateAllDatabases(rootDir);
        console.log('✅ [Pre-Flight] Database migrations and WAL mode verified.\n');
    } catch (e) {
        console.warn('⚠️ [Pre-Flight] Database migration warning:', e.message);
    }

    // 3. Stagger launch of microservices
    for (let i = 0; i < SERVICES.length; i++) {
        startService(SERVICES[i]);
        await new Promise(r => setTimeout(r, 200));
    }

    // 4. Verify Health of all servers
    setTimeout(() => {
        const currentNets = getLocalNetworkAddresses();
        const activeIp = currentNets.length > 0 ? currentNets[0].ip : 'localhost';

        console.log('\n--- 🩺 Live Server Health Verification ---');
        SERVICES.forEach(s => {
            const req = http.get(`http://127.0.0.1:${s.port}/api/health`, (res) => {
                console.log(`  ✅ Port ${s.port} [${s.name}]: ONLINE (HTTP ${res.statusCode}) -> http://${activeIp}:${s.port}`);
            });
            req.on('error', () => {
                console.log(`  ⏳ Port ${s.port} [${s.name}]: Starting up... -> http://${activeIp}:${s.port}`);
            });
            req.setTimeout(2000, () => req.destroy());
        });
    }, 5000);
}

// Graceful shutdown handling
function shutdown() {
    shuttingDown = true;
    console.log('\n🛑 Stopping all SmartSlate services...');
    runningProcesses.forEach(p => {
        try { p.child.kill(); } catch (e) {}
    });
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

bootstrap();
