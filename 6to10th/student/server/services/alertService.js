const { get, all, run } = require('../db/database');
const { sendNotification } = require('./socketHandler');

async function sendStudentAlert(app, studentId, alertType, message) {
    try {
        const io = app.get('io');

        const studentInfo = await get(
            `SELECT s.id as student_id, s.user_id as student_user_id, u.name as student_name, c.teacher_id
             FROM students s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN classes c ON s.class_id = c.id
             WHERE s.id = ?`,
            [studentId]
        );

        if (!studentInfo) return;

        const fullMessage = `Alert [${studentInfo.student_name}]: ${message}`;

        if (studentInfo.teacher_id) {
            await run(
                "INSERT INTO notifications (user_id, type, content) VALUES (?, ?, ?)",
                [studentInfo.teacher_id, alertType, fullMessage]
            );
            if (io) sendNotification(io, studentInfo.teacher_id, alertType, fullMessage);
        }

        const parentLinks = await all(
            "SELECT parent_user_id FROM parent_links WHERE student_id = ? AND status = 'accepted'",
            [studentId]
        );

        for (const link of parentLinks) {
            await run(
                "INSERT INTO notifications (user_id, type, content) VALUES (?, ?, ?)",
                [link.parent_user_id, alertType, fullMessage]
            );
            if (io) sendNotification(io, link.parent_user_id, alertType, fullMessage);
        }

        console.log(`[Alert Service] Alert (${alertType}) dispatched for student ${studentInfo.student_name}.`);
    } catch (err) {
        console.error('Error dispatching alert:', err);
    }
}

module.exports = { sendStudentAlert };
