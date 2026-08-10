const express = require('express');
const router = express.Router();
const { get, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { isSafeQuery, searchSafeWeb } = require('../services/searchFilter');

// GET /api/search - Safe web search for students
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.status(400).json({ error: 'Search query parameter "q" is required.' });
        }

        const queryStr = q.trim();
        const safe = isSafeQuery(queryStr);

        const student = await get("SELECT id FROM students WHERE user_id = ?", [req.user.id]);
        if (student) {
            await run(
                "INSERT INTO web_activity (student_id, query, is_flagged) VALUES (?, ?, ?)",
                [student.id, queryStr, safe ? 0 : 1]
            );
        }

        const results = await searchSafeWeb(queryStr);
        res.json(results);
    } catch (err) {
        console.error('Safe search error:', err);
        res.status(500).json({ error: 'Error processing safe web search.' });
    }
});

module.exports = router;
