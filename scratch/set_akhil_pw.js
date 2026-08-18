const bcrypt = require('bcryptjs');
const path = require('path');
const { run } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function setPw() {
    const hash = await bcrypt.hash('SmartSlate@123', 10);
    await run("UPDATE users SET password_hash = ? WHERE email = 'student@smartslate.edu'", [hash]);
    console.log('Updated Akhil password to SmartSlate@123');
}

setPw();
