const bcrypt = require('bcryptjs');
const { initDb, run, get, all } = require('./database');

async function seed() {
    console.log('Seeding Root SmartSlate database with authentic Indian / Andhra Pradesh demo profiles...');
    await initDb();

    // Clear old data for 100% clean sync testing
    await run("DELETE FROM submissions");
    await run("DELETE FROM assignments");
    await run("DELETE FROM attendance");
    await run("DELETE FROM parent_links");
    await run("DELETE FROM notes");
    await run("DELETE FROM books");
    await run("DELETE FROM students");
    await run("DELETE FROM teachers");
    await run("DELETE FROM classes");
    await run("DELETE FROM users");

    const pinStudent1 = await bcrypt.hash('1111', 10);
    const pinStudent2 = await bcrypt.hash('2222', 10);
    const pinTeacher = await bcrypt.hash('3333', 10);
    const pinParent = await bcrypt.hash('4444', 10);

    // 1. Create Class Teacher (Ravi Kumar)
    const teacherRes = await run(
        "INSERT INTO users (name, role, email, password_hash) VALUES (?, ?, ?, ?)",
        ['Ravi Kumar', 'teacher', 'teacher@smartslate.edu', pinTeacher]
    );
    const teacherUserId = teacherRes.id;
    await run("INSERT INTO teachers (user_id) VALUES (?)", [teacherUserId]);

    // 2. Create Class (10th Class — Section A)
    const classRes = await run(
        "INSERT INTO classes (name, teacher_id, class_code) VALUES (?, ?, ?)",
        ['10th Class — Section A', teacherUserId, 'CLASS-10A']
    );
    const classId = classRes.id;

    // 3. Create Student 1 (Akhil - PIN: 1111)
    const s1UserRes = await run(
        "INSERT INTO users (name, role, email, password_hash, student_code) VALUES (?, ?, ?, ?, ?)",
        ['Akhil', 'student', 'student@smartslate.edu', pinStudent1, 'STU-101']
    );
    const student1UserId = s1UserRes.id;
    const s1Res = await run(
        "INSERT INTO students (user_id, class_id, student_code) VALUES (?, ?, ?)",
        [student1UserId, classId, 'STU-101']
    );
    const student1Id = s1Res.id;

    // 4. Create Student 2 (Sai Teja - PIN: 2222)
    const s2UserRes = await run(
        "INSERT INTO users (name, role, email, password_hash, student_code) VALUES (?, ?, ?, ?, ?)",
        ['Sai Teja', 'student', 'maya@smartslate.edu', pinStudent2, 'STU-102']
    );
    const student2UserId = s2UserRes.id;
    const s2Res = await run(
        "INSERT INTO students (user_id, class_id, student_code) VALUES (?, ?, ?)",
        [student2UserId, classId, 'STU-102']
    );
    const student2Id = s2Res.id;

    // 5. Create Parent (Suresh Kumar - PIN: 4444)
    const parentRes = await run(
        "INSERT INTO users (name, role, email, password_hash) VALUES (?, ?, ?, ?)",
        ['Suresh Kumar', 'parent', 'parent@smartslate.edu', pinParent]
    );
    const parentUserId = parentRes.id;

    await run("INSERT INTO parent_links (parent_user_id, student_id, status) VALUES (?, ?, ?)", [parentUserId, student1Id, 'accepted']);
    await run("INSERT INTO parent_links (parent_user_id, student_id, status) VALUES (?, ?, ?)", [parentUserId, student2Id, 'accepted']);

    console.log('Root SmartSlate database clean re-seeding completed successfully!');
}

if (require.main === module) {
    seed().then(() => process.exit(0)).catch(err => {
        console.error('Seed error:', err);
        process.exit(1);
    });
}

module.exports = { seed };
