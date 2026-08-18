const path = require('path');
const { all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function checkClasses() {
    const classes = await all("SELECT * FROM classes");
    console.log('Classes:', classes);
    const students = await all("SELECT id, user_id, class_id, student_code FROM students");
    console.log('Students:', students);
}

checkClasses();
