const path = require('path');
const { all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function checkSubmissionsSchema() {
    const tableInfo = await all("PRAGMA table_info(submissions)");
    console.log('Submissions table columns:', tableInfo);
}

checkSubmissionsSchema();
