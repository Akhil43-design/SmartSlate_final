const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const { initDb } = require('./db/database');
const { seed } = require('./db/seed');
const { initSocket } = require('./services/socketHandler');
const syncService = require('../../shared/services/syncService');

// Import Student-focused routes
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const notesRoutes = require('./routes/notes');
const assignmentsRoutes = require('./routes/assignments');
const chatRoutes = require('./routes/chat');
const examsRoutes = require('./routes/exams');
const attendanceRoutes = require('./routes/attendance');
const notificationsRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');

const { requestLogger, errorLogger } = require('./middleware/logger');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Attach Socket.IO instance to app for access in routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// API Route Mounts for Student Website
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'SmartSlate-Student', version: '2.0.0', uptime: process.uptime() });
});

// Global error logging middleware
app.use(errorLogger);

// SPA Fallback Route
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Initialize DB, seed demo data, setup sockets, start sync service and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await initDb();
        await seed();
        initSocket(io);

        // Start background cloud sync service
        syncService.start(15000);

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`=======================================================`);
            console.log(`🎓 SmartSlate Student App running on http://localhost:${PORT}`);
            console.log(`📱 Raspberry Pi 2 W Kiosk Access: http://10.42.0.1:${PORT}`);
            console.log(`=======================================================`);
        });
    } catch (err) {
        console.error('Fatal error starting SmartSlate Student server:', err);
        process.exit(1);
    }
}

startServer();
