const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Serve static frontend files from public/
app.use(express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Local API routes
const localRoutes = require('./backend/routes/local');
app.use('/api/local', localRoutes);

// Server routes
try {
    const authRoutes = require('./server/routes/auth');
    const notesRoutes = require('./server/routes/notes');
    const booksRoutes = require('./server/routes/books');
    const assignmentsRoutes = require('./server/routes/assignments');
    const examsRoutes = require('./server/routes/exams');
    const attendanceRoutes = require('./server/routes/attendance');
    const chatRoutes = require('./server/routes/chat');

    app.use('/api/auth', authRoutes);
    app.use('/api/notes', notesRoutes);
    app.use('/api/books', booksRoutes);
    app.use('/api/assignments', assignmentsRoutes);
    app.use('/api/exams', examsRoutes);
    app.use('/api/attendance', attendanceRoutes);
    app.use('/api/chat', chatRoutes);
} catch (e) {
    console.warn('[B.Tech Server] Route import warning:', e.message);
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'smartslate-btech-backend', port: PORT });
});

app.listen(PORT, () => {
    console.log(`🟢 [SmartSlate B.Tech OS] Server running on http://localhost:${PORT}`);
});
