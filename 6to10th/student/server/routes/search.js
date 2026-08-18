const express = require('express');
const router = express.Router();
const path = require('path');
const { get, run } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { isSafeQuery, searchSafeWeb } = require('../services/searchFilter');

let syncManager = null;
try {
    syncManager = require(path.resolve(__dirname, '../../../../shared/services/syncManager.js'));
} catch (e) {
    console.warn('[SEARCH] SyncManager import warning:', e.message);
}

// GET /api/search - Safe web search for students
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.status(400).json({ error: 'Search query parameter "q" is required.' });
        }

        const queryStr = q.trim();
        const safe = isSafeQuery(queryStr);
        const firebaseUid = req.user.uid || req.user.id;
        const searchId = `search_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const student = await get("SELECT id FROM students WHERE user_id = ? OR student_code = ? OR firebase_uid = ?", [req.user.id, req.user.studentCode || req.user.student_code || '', req.user.uid || '']);
        if (student) {
            await run(
                "INSERT INTO web_activity (student_id, query, is_flagged) VALUES (?, ?, ?)",
                [student.id, queryStr, safe ? 0 : 1]
            );
        }

        // Enqueue search activity into sync_queue for Firestore sync (students/{uid}/search_history/{searchId})
        if (firebaseUid) {
            const payload = {
                searchId,
                query: queryStr,
                is_flagged: safe ? 0 : 1,
                timestamp: new Date().toISOString(),
                category: '6to10th'
            };
            await run(
                `INSERT INTO sync_queue (firebase_uid, entity_type, entity_id, operation, payload, status)
                 VALUES (?, 'search_history', ?, 'upsert', ?, 'pending')`,
                [firebaseUid, searchId, JSON.stringify(payload)]
            );
            if (syncManager) {
                syncManager.syncAppQueue('highschool').catch(() => {});
            }
        }

        const results = await searchSafeWeb(queryStr);
        res.json(results);
    } catch (err) {
        console.error('Safe search error:', err);
        res.status(500).json({ error: 'Error processing safe web search.' });
    }
});

module.exports = router;
