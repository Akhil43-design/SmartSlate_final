const path = require('path');
const { get, all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function checkAkhil() {
    const user = await get("SELECT * FROM users WHERE email = 'student@smartslate.edu'");
    console.log('User:', user);
    if (user) {
        const student = await get("SELECT * FROM students WHERE user_id = ?", [user.id]);
        console.log('Student row:', student);
        if (student) {
            const classRow = await get("SELECT * FROM classes WHERE id = ?", [student.class_id]);
            console.log('Class row:', classRow);
        }
        const connections = await all("SELECT * FROM student_teacher_connections WHERE student_uid = ? OR student_code = ?", [user.id, user.student_code]);
        console.log('Connections for Akhil:', connections);
    }
}

checkAkhil();
