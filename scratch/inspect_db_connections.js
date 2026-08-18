const { all } = require('../shared/db/database');

async function inspect() {
    console.log('users:');
    console.log(await all("SELECT id, name, email, parent_code, teacher_code, firebase_uid FROM users WHERE role = 'parent'"));
    console.log('student_parent_connections:');
    console.log(await all("SELECT * FROM student_parent_connections"));
    console.log('parent_links:');
    console.log(await all("SELECT * FROM parent_links"));
    process.exit(0);
}

inspect().catch(err => {
    console.error(err);
    process.exit(1);
});
