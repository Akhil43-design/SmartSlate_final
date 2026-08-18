const path = require('path');
const { get, all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function inspectPooja() {
    const user = await get("SELECT * FROM users WHERE email = 'student_051@smartslate.test' OR name LIKE '%Pooja%'");
    console.log('User:', user);
    if (user) {
        const student = await get("SELECT * FROM students WHERE user_id = ?", [user.id]);
        console.log('Student row:', student);
        if (student) {
            const classRow = await get("SELECT * FROM classes WHERE id = ?", [student.class_id]);
            console.log('Class row:', classRow);
        }
        const connections = await all("SELECT * FROM student_teacher_connections WHERE student_uid = ? OR student_code = ?", [user.id, user.student_code]);
        console.log('Connections for Pooja:', connections);
    }

    const allStudents = await all("SELECT u.id, u.name, u.email, u.student_code, s.class_id, c.name as class_name FROM users u LEFT JOIN students s ON u.id = s.user_id LEFT JOIN classes c ON s.class_id = c.id WHERE u.role = 'student'");
    console.log('All students in SQLite:');
    allStudents.forEach(s => console.log(`  * UID: ${s.id} | Name: ${s.name} | Email: ${s.email} | Code: ${s.student_code} | Class: ${s.class_name}`));

    const allAssignments = await all("SELECT id, title, target_class, class_id, created_by, subject FROM assignments");
    console.log('\nAll assignments in SQLite:');
    allAssignments.forEach(a => console.log(`  * ID: ${a.id} | Title: ${a.title} | TargetClass: ${a.target_class} | ClassId: ${a.class_id} | CreatedBy: ${a.created_by}`));
}

inspectPooja();
