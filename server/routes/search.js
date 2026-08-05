const express = require('express');
const router = express.Router();
const { get, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { searchSafeWeb, isSafeQuery } = require('../services/searchFilter');
const { alertParentUnsafeSearch } = require('../services/socketHandler');

// GET /api/search?q=...
router.get('/', authenticateToken, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || !query.trim()) {
            return res.status(400).json({ error: 'Search query is required.' });
        }

        const cleanQuery = query.trim();
        const safe = isSafeQuery(cleanQuery);

        // Always log web activity if student
        if (req.user.role === 'student') {
            const student = await get("SELECT id FROM students WHERE user_id = ?", [req.user.id]);
            if (student) {
                await run(
                    "INSERT INTO web_activity (student_id, query, is_flagged) VALUES (?, ?, ?)",
                    [student.id, cleanQuery, safe ? 0 : 1]
                );
            }
        }

        // If unsafe: alert parent in real-time via Socket.IO
        if (!safe && req.user.role === 'student') {
            const io = global._io;
            if (io) {
                alertParentUnsafeSearch(io, req.user.id, cleanQuery);
            }
            return res.json({
                safe: false,
                query: cleanQuery,
                message: `🚨 BLOCKED: "${cleanQuery}" is not allowed on SmartSlate Safe Search. Your teacher and parents have been notified.`,
                results: []
            });
        }

        const searchResult = await searchSafeWeb(cleanQuery);
        res.json(searchResult);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Error processing safe web search.' });
    }
});

module.exports = router;
