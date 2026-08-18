const bcrypt = require('bcryptjs');
const defaultDb = require('./database');

async function seed(customDb = null) {
    const dbInst = customDb || defaultDb;
    await dbInst.initDb();
    
    // Check if database already has users seeded
    const countRow = await dbInst.get("SELECT COUNT(*) as cnt FROM users").catch(() => ({ cnt: 0 }));
    if (countRow && countRow.cnt > 5) {
        console.log(`[SEED] SQLite database already populated with ${countRow.cnt} users. Preserving records.`);
        return;
    }

    const { run } = dbInst;

    console.log('Seeding Unified SmartSlate database with authentic Indian / Andhra Pradesh demo profiles...');

    const passHash = await bcrypt.hash('SmartSlate@123', 10);
    const pinStudent1 = await bcrypt.hash('1111', 10);
    const pinStudent2 = await bcrypt.hash('2222', 10);
    const pinTeacher = await bcrypt.hash('3333', 10);
    const pinParent = await bcrypt.hash('4444', 10);

    // 1. Create Class Teacher (Ravi Kumar - Sri Venkateswara High School)
    const teacherRes = await run(
        "INSERT OR IGNORE INTO users (name, role, email, password_hash, teacher_code, subject, firebase_uid) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ['Priya Sharma', 'teacher', 'teacher_math_hs@smartslate.test', passHash, 'TCH-PRIYA-MATH-05', 'Mathematics', 'uid_teacher_math_hs']
    );
    const teacherUser = await dbInst.get("SELECT id FROM users WHERE email = ?", ['teacher_math_hs@smartslate.test']);
    const teacherUserId = teacherUser ? teacherUser.id : (teacherRes ? teacherRes.id : 1);
    await run("INSERT OR IGNORE INTO teachers (user_id, teacher_code, subject, firebase_uid) VALUES (?, ?, ?, ?)", [teacherUserId, 'TCH-PRIYA-MATH-05', 'Mathematics', 'uid_teacher_math_hs']);

    // 2. Create Class (10th Class — Section A)
    await run(
        "INSERT OR IGNORE INTO classes (name, teacher_id, class_code) VALUES (?, ?, ?)",
        ['10th Class — Section A', teacherUserId, 'CLASS-10A']
    );
    const classRow = await dbInst.get("SELECT id FROM classes WHERE class_code = ?", ['CLASS-10A']);
    const classId = classRow ? classRow.id : 1;

    // 3. Create Student 1 (Meghana Vardhan - B.Tech)
    await run(
        "INSERT OR IGNORE INTO users (name, role, email, password_hash, student_code, firebase_uid) VALUES (?, ?, ?, ?, ?, ?)",
        ['Meghana Vardhan', 'student', 'student_151@smartslate.test', passHash, 'STU-MEGHB1A-11', 'uid_student_151']
    );
    const s1User = await dbInst.get("SELECT id FROM users WHERE email = ?", ['student_151@smartslate.test']);
    const student1UserId = s1User ? s1User.id : 2;
    await run(
        "INSERT OR IGNORE INTO students (user_id, class_id, student_code, firebase_uid) VALUES (?, ?, ?, ?)",
        [student1UserId, classId, 'STU-MEGHB1A-11', 'uid_student_151']
    );
    const s1Row = await dbInst.get("SELECT id FROM students WHERE student_code = ?", ['STU-MEGHB1A-11']);
    const student1Id = s1Row ? s1Row.id : 1;

    // 4. Create Student 2 (Daya Nayak)
    await run(
        "INSERT OR IGNORE INTO users (name, role, email, password_hash, student_code, firebase_uid) VALUES (?, ?, ?, ?, ?, ?)",
        ['Daya Nayak', 'student', 'student_001@smartslate.test', passHash, 'STU-VAMS1A-11', 'uid_student_001']
    );
    const s2User = await dbInst.get("SELECT id FROM users WHERE email = ?", ['student_001@smartslate.test']);
    const student2UserId = s2User ? s2User.id : 3;
    await run(
        "INSERT OR IGNORE INTO students (user_id, class_id, student_code, firebase_uid) VALUES (?, ?, ?, ?)",
        [student2UserId, classId, 'STU-VAMS1A-11', 'uid_student_001']
    );
    const s2Row = await dbInst.get("SELECT id FROM students WHERE student_code = ?", ['STU-VAMS1A-11']);
    const student2Id = s2Row ? s2Row.id : 2;

    // 5. Create Parent (Ramesh Kumar - SmartSlate@123) & Link to children
    await run(
        "INSERT OR IGNORE INTO users (name, role, email, password_hash, parent_code, firebase_uid) VALUES (?, ?, ?, ?, ?, ?)",
        ['Ramesh Kumar', 'parent', 'parent_ramesh@smartslate.test', passHash, 'PAR-RAMES-101', 'uid_parent_ramesh']
    );
    const parentUser = await dbInst.get("SELECT id FROM users WHERE email = ?", ['parent_ramesh@smartslate.test']);
    const parentUserId = parentUser ? parentUser.id : 4;

    await run("INSERT OR IGNORE INTO parent_links (parent_user_id, student_id, status) VALUES (?, ?, ?)", [parentUserId, student1Id, 'accepted']);
    await run("INSERT OR IGNORE INTO parent_links (parent_user_id, student_id, status) VALUES (?, ?, ?)", [parentUserId, student2Id, 'accepted']);

    await run(
        `INSERT INTO student_parent_connections (student_uid, parent_uid, student_code, parent_code, student_name, parent_name, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')
         ON CONFLICT(student_uid, parent_uid) DO UPDATE SET status = 'active'`,
        [String(student1UserId), String(parentUserId), 'STU-MEGHB1A-11', 'PAR-RAMES-101', 'Meghana Vardhan', 'Ramesh Kumar']
    );

    await run(
        `INSERT INTO student_teacher_connections (student_uid, teacher_uid, student_code, teacher_code, student_name, teacher_name, subject, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
         ON CONFLICT(student_uid, teacher_uid) DO UPDATE SET status = 'active'`,
        [String(student1UserId), String(teacherUserId), 'STU-MEGHB1A-11', 'TCH-PRIYA-MATH-05', 'Meghana Vardhan', 'Priya Sharma', 'Mathematics']
    );

    // 6. Books for Students
    const b1 = await run("INSERT OR IGNORE INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)", [student1Id, 'Physical Science', 'Science', 'blue_linen']);
    const b2 = await run("INSERT OR IGNORE INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)", [student1Id, 'Mathematics', 'Math', 'sage_paper']);
    
    if (b1 && b1.id) {
        await run(
            "INSERT OR IGNORE INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [b1.id, 'Photosynthesis & Plant Biology', 'ruled', 'Plants convert light into chemical energy through photosynthesis.\n6CO2 + 6H2O + Light -> C6H12O6 + 6O2.']
        );
    }
    if (b2 && b2.id) {
        await run(
            "INSERT OR IGNORE INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [b2.id, 'Fractions & Ratios Practice', 'four_ruled', 'Practice Problems:\n2/4 = 1/2 = 50%\n3/4 = 75%']
        );
    }

    const mb1 = await run("INSERT OR IGNORE INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)", [student2Id, 'General English', 'English', 'terracotta_leather']);
    if (mb1 && mb1.id) {
        await run(
            "INSERT OR IGNORE INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [mb1.id, 'Essay Writing Structure', 'ruled', 'Introduction, Supporting Paragraphs, Conclusion.']
        );
    }

    // 7. Fresh Assignments & Submissions
    const dueTomorrow = new Date(Date.now() + 86400000 * 2).toISOString();
    const dueNextWeek = new Date(Date.now() + 86400000 * 5).toISOString();

    const a1 = await run(
        "INSERT OR IGNORE INTO assignments (class_id, title, description, due_at, created_by) VALUES (?, ?, ?, ?, ?)",
        [classId, 'Physical Science: Plant Ecosystems', 'Write a summary on how plants convert sunlight into food.', dueTomorrow, teacherUserId]
    );

    const a2 = await run(
        "INSERT OR IGNORE INTO assignments (class_id, title, description, due_at, created_by) VALUES (?, ?, ?, ?, ?)",
        [classId, 'Mathematics: Fractions & Ratios', 'Solve exercises 1 to 10 on page 42.', dueNextWeek, teacherUserId]
    );

    if (a1 && a1.id) {
        await run(
            "INSERT OR IGNORE INTO submissions (assignment_id, student_id, content, status, grade, feedback) VALUES (?, ?, ?, ?, ?, ?)",
            [a1.id, student1Id, 'Photosynthesis is the process by which green plants use sunlight to synthesize nutrients.', 'graded', '85/100', 'Good work, Akhil! Keep practising.']
        );
        await run(
            "INSERT OR IGNORE INTO submissions (assignment_id, student_id, content, status, grade, feedback) VALUES (?, ?, ?, ?, ?, ?)",
            [a1.id, student2Id, 'Plants use solar energy, water, and CO2 to produce oxygen and glucose.', 'graded', '92/100', 'Excellent explanation, Sai Teja!']
        );
    }

    // 8. Attendance Logs
    const dates = [
        new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
    ];

    for (const date of dates) {
        await run("INSERT OR IGNORE INTO attendance (class_id, student_id, date, status) VALUES (?, ?, ?, ?)", [classId, student1Id, date, 'present']);
        await run("INSERT OR IGNORE INTO attendance (class_id, student_id, date, status) VALUES (?, ?, ?, ?)", [classId, student2Id, date, date.endsWith('2') ? 'late' : 'present']);
    }

    console.log('Unified SmartSlate database clean re-seeding completed successfully!');
}

if (require.main === module) {
    seed().then(() => process.exit(0)).catch(err => {
        console.error('Seed error:', err);
        process.exit(1);
    });
}

module.exports = { seed };
