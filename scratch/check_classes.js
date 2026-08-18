const path = require('path');
const { all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function checkClasses() {
    const classes = await all("SELECT * FROM classes");
    console.log('Classes in DB:', classes);
}

checkClasses();
