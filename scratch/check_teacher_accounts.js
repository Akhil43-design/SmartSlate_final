const path = require('path');
const { all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function checkTeachers() {
    const users = await all("SELECT id, name, email, role FROM users WHERE role = 'teacher' OR name LIKE '%Priya%' OR name LIKE '%Teacher%'");
    console.log('Teacher users in DB:', users);
}

checkTeachers();
