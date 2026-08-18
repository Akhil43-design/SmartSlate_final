const path = require('path');
const { get, all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function checkAkhilClass() {
    const student = await get("SELECT id FROM students WHERE user_id = 5017");
    console.log('Student:', student);
    const studentRow = await get(
        `SELECT s.id, s.class_id, s.student_code, COALESCE(c.name, 'Class 8') as class_name
         FROM students s
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.user_id = 5017 OR s.id = ?`,
        [student?.id]
    );
    console.log('studentRow:', studentRow);
}

checkAkhilClass();
