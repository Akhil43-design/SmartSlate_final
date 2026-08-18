const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3002;

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Attach Socket.IO instance to app for access in routes
app.set('io', io);

// Initialize Socket.IO event handler
const { initSocket } = require('../student/server/services/socketHandler');
initSocket(io);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Standard non-blocking headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const fs = require('fs');
const { pathToFileURL } = require('url');

// Dynamic Nitro / TanStack Start Engine Loader
let nitroApp = null;
const nitroBundlePath = path.resolve(__dirname, './.output/server/index.mjs');
if (fs.existsSync(nitroBundlePath)) {
    import(pathToFileURL(nitroBundlePath).href).then(m => {
        nitroApp = m.default || m;
        console.log('✨ [Elementary SSR/SPA] Nitro TanStack Start engine loaded successfully.');
    }).catch(err => {
        console.warn('⚠️ [Elementary SSR/SPA] Could not load Nitro bundle:', err.message);
    });
}

// Paths
const sharedPath = path.resolve(__dirname, '../shared');
const outputPublicPath = path.resolve(__dirname, './.output/public');
const assetsPath = path.join(outputPublicPath, 'assets');
const localPublicPath = path.resolve(__dirname, './public');
const distPath = path.resolve(__dirname, './dist');

app.use('/shared', express.static(sharedPath));

if (fs.existsSync(assetsPath)) {
    app.use('/assets', express.static(assetsPath));
}
if (fs.existsSync(outputPublicPath)) {
    app.use(express.static(outputPublicPath));
}
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}
app.use(express.static(localPublicPath));

// Mount Student Routes
const authRoutes = require('../student/server/routes/auth');
const booksRoutes = require('../student/server/routes/books');
const notesRoutes = require('../student/server/routes/notes');
const assignmentsRoutes = require('../student/server/routes/assignments');
const chatRoutes = require('../student/server/routes/chat');
const examsRoutes = require('../student/server/routes/exams');
const attendanceRoutes = require('../student/server/routes/attendance');
const notificationsRoutes = require('../student/server/routes/notifications');
const searchRoutes = require('../student/server/routes/search');
const localRoutes = require('./backend/routes/local.cjs');
const connectionsRoutes = require('../shared/routes/connections');

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/local', localRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/student/connections', connectionsRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'smartslate-elementary', level: 'Classes 1–5' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'smartslate-elementary', level: 'Classes 1–5' });
});

async function handleElementaryWeb(req, res) {
    if (nitroApp && typeof nitroApp.fetch === 'function') {
        try {
            const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
            const host = req.headers.host || `127.0.0.1:${PORT}`;
            const fullUrl = `${proto}://${host}${req.originalUrl || req.url}`;
            
            const headers = new Headers();
            for (const [k, v] of Object.entries(req.headers)) {
                if (v !== undefined) {
                    if (Array.isArray(v)) {
                        v.forEach(val => headers.append(k, val));
                    } else {
                        headers.set(k, String(v));
                    }
                }
            }

            const fetchReq = new Request(fullUrl, {
                method: req.method,
                headers,
                body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body
            });

            const ssrRes = await nitroApp.fetch(fetchReq, {});
            res.status(ssrRes.status);
            for (const [k, v] of ssrRes.headers.entries()) {
                res.setHeader(k, v);
            }
            const arrayBuffer = await ssrRes.arrayBuffer();
            return res.send(Buffer.from(arrayBuffer));
        } catch (err) {
            console.error('[Elementary SSR] Render error:', err);
        }
    }

    const distIndex = path.join(distPath, 'index.html');
    if (fs.existsSync(distIndex)) return res.sendFile(distIndex);
    const localPublicIndex = path.join(localPublicPath, 'index.html');
    if (fs.existsSync(localPublicIndex)) return res.sendFile(localPublicIndex);
    return res.status(503).send('SmartSlate Elementary application starting up...');
}

// Elementary Web Routes
app.get('/', handleElementaryWeb);
app.get('/login', handleElementaryWeb);
app.get('/register', handleElementaryWeb);

// SPA Fallback Route
app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return res.status(404).json({ error: 'Endpoint not found' });
    }
    if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|map|woff2?|ttf|eot)$/i.test(req.path)) {
        return res.status(404).send('Asset not found');
    }
    return handleElementaryWeb(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🎒 SmartSlate Elementary (Classes 1–5) running on http://localhost:${PORT}`);
    console.log(`📱 Socket.IO Server active on ws://localhost:${PORT}`);
    console.log(`=======================================================`);
});
