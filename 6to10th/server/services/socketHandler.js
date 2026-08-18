const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const { run, get, all } = require('../db/database');

function initSocket(io) {
    // Store io globally so routes can emit events
    global._io = io;

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) return next(new Error('Socket auth error: Token missing'));
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error('Socket auth error: Invalid token'));
            socket.user = decoded;
            next();
        });
    });

    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`Socket connected: ${user.name} (${user.role})`);

        // Join personal room for direct notifications
        socket.join(`user_${user.id}`);

        // Auto-join class room for students & teachers
        if (user.role === 'student' || user.role === 'teacher') {
            get("SELECT class_id FROM students WHERE user_id = ?", [user.id])
                .then(s => { if (s?.class_id) socket.join(`class_${s.class_id}`); })
                .catch(e => console.error('Class room join error:', e));
        }

        // Join parents' monitoring room
        if (user.role === 'parent') {
            socket.join(`parent_user_${user.id}`);
        }

        // Chat: join group room
        socket.on('chat:join', (groupId) => {
            socket.join(`group_${groupId}`);
            console.log(`${user.name} joined group_${groupId}`);
        });

        // Chat: send group message
        socket.on('message:send_group', async (data, callback) => {
            try {
                const { groupId, content } = data;
                if (!groupId || !content?.trim()) return;

                const res = await run(
                    "INSERT INTO messages (group_id, sender_id, content) VALUES (?, ?, ?)",
                    [groupId, user.id, content.trim()]
                );

                const msgObj = {
                    id: res.id,
                    group_id: groupId,
                    sender_id: user.id,
                    sender_name: user.name,
                    sender_role: user.role,
                    content: content.trim(),
                    sent_at: new Date().toISOString()
                };

                io.to(`group_${groupId}`).emit('message:received', msgObj);
                if (callback) callback({ success: true, message: msgObj });
            } catch (err) {
                console.error('Group message error:', err);
                if (callback) callback({ success: false, error: err.message });
            }
        });

        // Chat: send direct message
        socket.on('message:send_direct', async (data, callback) => {
            try {
                const { receiverId, content } = data;
                if (!receiverId || !content?.trim()) return;

                const res = await run(
                    "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
                    [user.id, receiverId, content.trim()]
                );

                const msgObj = {
                    id: res.id,
                    sender_id: user.id,
                    sender_name: user.name,
                    sender_role: user.role,
                    receiver_id: receiverId,
                    content: content.trim(),
                    sent_at: new Date().toISOString()
                };

                io.to(`user_${receiverId}`).emit('message:received', msgObj);
                io.to(`user_${user.id}`).emit('message:received', msgObj);
                if (callback) callback({ success: true, message: msgObj });
            } catch (err) {
                console.error('Direct message error:', err);
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${user.name}`);
        });
    });
}

// Send a push notification to a specific user
async function sendNotification(io, userId, type, content) {
    try {
        const res = await run(
            "INSERT INTO notifications (user_id, type, content) VALUES (?, ?, ?)",
            [userId, type, content]
        );
        const notifObj = {
            id: res.id,
            user_id: userId,
            type,
            content,
            is_read: 0,
            created_at: new Date().toISOString()
        };
        if (io) io.to(`user_${userId}`).emit('notification:push', notifObj);
    } catch (err) {
        console.error('Notification dispatch error:', err);
    }
}

// Alert parent when student performs an unsafe search
async function alertParentUnsafeSearch(io, studentUserId, blockedQuery) {
    try {
        // Find student record
        const student = await get(
            "SELECT s.id, u.name as student_name FROM students s JOIN users u ON u.id = s.user_id WHERE s.user_id = ?",
            [studentUserId]
        );
        if (!student) return;

        // Find linked parents
        const parents = await all(
            "SELECT parent_user_id FROM parent_student_links WHERE student_id = ?",
            [student.id]
        );

        for (const p of parents) {
            const alertData = {
                type: 'unsafe_search',
                student_name: student.student_name,
                student_user_id: studentUserId,
                blocked_query: blockedQuery,
                timestamp: new Date().toISOString()
            };

            // Emit real-time event to parent
            if (io) {
                io.to(`user_${p.parent_user_id}`).emit('parent:unsafe_search', alertData);
            }

            // Also persist as notification
            await sendNotification(
                io,
                p.parent_user_id,
                'unsafe_search',
                `⚠️ ${student.student_name} attempted to search for blocked content: "${blockedQuery}"`
            );
        }
    } catch (err) {
        console.error('Alert parent error:', err);
    }
}

module.exports = { initSocket, sendNotification, alertParentUnsafeSearch };
