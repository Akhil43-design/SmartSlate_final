const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const localDb = require('./server/db/database');
const { initDb } = require('./server/db/database');
const { seed } = require('./server/db/seed');
const { initSocket } = require('./server/services/socketHandler');

const authRoutes = require('./server/routes/auth');
const booksRoutes = require('./server/routes/books');
const notesRoutes = require('./server/routes/notes');
const assignmentsRoutes = require('./server/routes/assignments');
const chatRoutes = require('./server/routes/chat');
const examsRoutes = require('./server/routes/exams');
const attendanceRoutes = require('./server/routes/attendance');
const notificationsRoutes = require('./server/routes/notifications');
const searchRoutes = require('./server/routes/search');

const { requestLogger, errorLogger } = require('./server/middleware/logger');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.set('io', io);

app.use(cors());
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const publicPath = path.resolve(__dirname, 'public');
const sharedPath = path.resolve(__dirname, '../shared');

app.use('/shared', express.static(sharedPath));
app.use(express.static(publicPath));

const localRoutes = require('./backend/routes/local');
app.use('/api/local', localRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
const connectionsRoutes = require('../shared/routes/connections');
app.use('/api/connections', connectionsRoutes);
app.use('/api/student/connections', connectionsRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', app: 'SmartSlate-BTech-HigherEd', version: '2.0.0', uptime: process.uptime() });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'SmartSlate-BTech-HigherEd', version: '2.0.0', uptime: process.uptime() });
});

app.use(errorLogger);

app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|map|woff2?|ttf|eot)$/i.test(req.path)) {
        return res.status(404).send('Asset not found');
    }
    res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 3005;

async function startServer() {
    try {
        if (typeof initDb === 'function') await initDb();
        if (typeof seed === 'function') await seed();
        if (typeof initSocket === 'function') initSocket(io);

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`=======================================================`);
            console.log(`🟢 SmartSlate B.Tech App running on http://localhost:${PORT}`);
            console.log(`=======================================================`);
        });
    } catch (err) {
        console.error('Failed to start B.Tech server:', err);
    }
}

startServer();
