const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const { run, get, all } = require('../db/database');

function initSocket(io) {
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
        console.log(`Student Socket connected: ${user.name} (${user.role})`);

        socket.join(`user_${user.id}`);

        if (user.role === 'student') {
            get("SELECT class_id FROM students WHERE user_id = ?", [user.id])
                .then(s => { if (s?.class_id) socket.join(`class_${s.class_id}`); })
                .catch(e => console.error('Class room join error:', e));
        }

        socket.on('chat:join', (groupId) => {
            socket.join(`group_${groupId}`);
        });

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

        socket.on('disconnect', () => {
            console.log(`Student Socket disconnected: ${user.name}`);
        });
    });
}

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

module.exports = { initSocket, sendNotification };
