const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const { initDb } = require('./db/database');
const { seed } = require('./db/seed');
const { initSocket } = require('./services/socketHandler');

// Import routes
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const notesRoutes = require('./routes/notes');
const assignmentsRoutes = require('./routes/assignments');
const chatRoutes = require('./routes/chat');
const examsRoutes = require('./routes/exams');
const attendanceRoutes = require('./routes/attendance');
const notificationsRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const parentRoutes = require('./routes/parent');
const teacherRoutes = require('./routes/teacher');

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

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/teacher', teacherRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'SmartSlate', version: '1.0.0', uptime: process.uptime() });
});

// Global error logging middleware
app.use(errorLogger);

// SPA Fallback Route (Serve index.html for all non-API requests)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Initialize DB, seed demo data, setup sockets, and start server
const PORT = process.env.PORT || 3003;

async function startServer() {
    try {
        await initDb();
        await seed(); // Seed default accounts & demo data
        initSocket(io);

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`=======================================================`);
            console.log(`🚀 SmartSlate Server running on http://localhost:${PORT}`);
            console.log(`📱 Tablet Kiosk Access: http://<raspberry-pi-ip>:${PORT}`);
            console.log(`=======================================================`);
        });
    } catch (err) {
        console.error('Fatal error starting SmartSlate server:', err);
        process.exit(1);
    }
}

startServer();
