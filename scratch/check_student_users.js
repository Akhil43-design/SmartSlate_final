const path = require('path');
const { all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function checkUsers() {
    const users = await all("SELECT id, name, email, role, student_code FROM users WHERE role = 'student' LIMIT 5");
    console.log('Sample Students in DB:', users);
}

checkUsers();
