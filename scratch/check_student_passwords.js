const path = require('path');
const bcrypt = require('bcryptjs');
const { all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function checkStudentPasswords() {
    const students = await all("SELECT id, name, email, password_hash, student_code FROM users WHERE role = 'student' LIMIT 5");
    for (const s of students) {
        console.log(`Checking ${s.name} (${s.email})...`);
        const matches1234 = await bcrypt.compare('1234', s.password_hash);
        const matchesSmartSlate = await bcrypt.compare('SmartSlate@123', s.password_hash);
        const matchesStudent123 = await bcrypt.compare('Student@123', s.password_hash);
        console.log(`  1234: ${matches1234}, SmartSlate@123: ${matchesSmartSlate}, Student@123: ${matchesStudent123}`);
    }
}

checkStudentPasswords();
