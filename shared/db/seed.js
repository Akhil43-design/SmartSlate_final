const bcrypt = require('bcryptjs');
const defaultDb = require('./database');

async function upsertUser(dbInst, user) {
    const existing = await dbInst.get(
        "SELECT id, password_hash FROM users WHERE email = ? OR (firebase_uid IS NOT NULL AND firebase_uid = ?)",
        [user.email, user.firebase_uid]
    ).catch(() => null);

    if (existing) {
        await dbInst.run(
            `UPDATE users SET
                name = COALESCE(?, name),
                role = COALESCE(?, role),
                password_hash = COALESCE(password_hash, ?),
                teacher_code = COALESCE(?, teacher_code),
                student_code = COALESCE(?, student_code),
                parent_code = COALESCE(?, parent_code),
                subject = COALESCE(?, subject),
                firebase_uid = COALESCE(?, firebase_uid)
            WHERE id = ?`,
            [
                user.name,
                user.role,
                user.password_hash,
                user.teacher_code || null,
                user.student_code || null,
                user.parent_code || null,
                user.subject || null,
                user.firebase_uid || null,
                existing.id
            ]
        );
        return existing.id;
    } else {
        const res = await dbInst.run(
            `INSERT INTO users (name, role, email, password_hash, teacher_code, student_code, parent_code, subject, firebase_uid)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user.name,
                user.role,
                user.email,
                user.password_hash,
                user.teacher_code || null,
                user.student_code || null,
                user.parent_code || null,
                user.subject || null,
                user.firebase_uid || null
            ]
        );
        return res.id;
    }
}

async function upsertTeacher(dbInst, teacher) {
    const existing = await dbInst.get(
        "SELECT id FROM teachers WHERE user_id = ? OR teacher_code = ?",
        [teacher.user_id, teacher.teacher_code]
    ).catch(() => null);

    if (existing) {
        await dbInst.run(
            "UPDATE teachers SET teacher_code = COALESCE(?, teacher_code), subject = COALESCE(?, subject), firebase_uid = COALESCE(?, firebase_uid) WHERE id = ?",
            [teacher.teacher_code, teacher.subject, teacher.firebase_uid, existing.id]
        );
        return existing.id;
    } else {
        const res = await dbInst.run(
            "INSERT INTO teachers (user_id, teacher_code, subject, firebase_uid) VALUES (?, ?, ?, ?)",
            [teacher.user_id, teacher.teacher_code, teacher.subject, teacher.firebase_uid]
        );
        return res.id;
    }
}

async function upsertClass(dbInst, cls) {
    const existing = await dbInst.get("SELECT id FROM classes WHERE class_code = ?", [cls.class_code]).catch(() => null);
    if (existing) {
        await dbInst.run(
            "UPDATE classes SET name = COALESCE(?, name), teacher_id = COALESCE(?, teacher_id) WHERE id = ?",
            [cls.name, cls.teacher_id, existing.id]
        );
        return existing.id;
    } else {
        const res = await dbInst.run(
            "INSERT INTO classes (name, teacher_id, class_code) VALUES (?, ?, ?)",
            [cls.name, cls.teacher_id, cls.class_code]
        );
        return res.id;
    }
}

async function upsertStudent(dbInst, student) {
    const existing = await dbInst.get(
        "SELECT id FROM students WHERE user_id = ? OR student_code = ?",
        [student.user_id, student.student_code]
    ).catch(() => null);

    if (existing) {
        await dbInst.run(
            "UPDATE students SET class_id = COALESCE(?, class_id), student_code = COALESCE(?, student_code), firebase_uid = COALESCE(?, firebase_uid) WHERE id = ?",
            [student.class_id, student.student_code, student.firebase_uid, existing.id]
        );
        return existing.id;
    } else {
        const res = await dbInst.run(
            "INSERT INTO students (user_id, class_id, student_code, firebase_uid) VALUES (?, ?, ?, ?)",
            [student.user_id, student.class_id, student.student_code, student.firebase_uid]
        );
        return res.id;
    }
}

async function seed(customDb = null) {
    const dbInst = customDb || defaultDb;
    await dbInst.initDb();
    
    // Check if database already has sufficient users
    const countRow = await dbInst.get("SELECT COUNT(*) as cnt FROM users").catch(() => ({ cnt: 0 }));
    if (countRow && countRow.cnt > 5) {
        console.log(`[SEED] SQLite database already populated with ${countRow.cnt} users. Preserving records.`);
        return;
    }

    const { run } = dbInst;

    console.log('Seeding Unified SmartSlate database with authentic Indian / Andhra Pradesh demo profiles...');

    const passHash = await bcrypt.hash('SmartSlate@123', 10);

    // 1. Class Teacher (Priya Sharma)
    const teacherUserId = await upsertUser(dbInst, {
        name: 'Priya Sharma',
        role: 'teacher',
        email: 'teacher_math_hs@smartslate.test',
        password_hash: passHash,
        teacher_code: 'TCH-PRIYA-MATH-05',
        subject: 'Mathematics',
        firebase_uid: 'uid_teacher_math_hs'
    });

    await upsertTeacher(dbInst, {
        user_id: teacherUserId,
        teacher_code: 'TCH-PRIYA-MATH-05',
        subject: 'Mathematics',
        firebase_uid: 'uid_teacher_math_hs'
    });

    // 2. Class (10th Class — Section A)
    const classId = await upsertClass(dbInst, {
        name: '10th Class — Section A',
        teacher_id: teacherUserId,
        class_code: 'CLASS-10A'
    });

    // 3. Student 1 (Meghana Vardhan)
    const student1UserId = await upsertUser(dbInst, {
        name: 'Meghana Vardhan',
        role: 'student',
        email: 'student_151@smartslate.test',
        password_hash: passHash,
        student_code: 'STU-MEGHB1A-11',
        firebase_uid: 'uid_student_151'
    });

    const student1Id = await upsertStudent(dbInst, {
        user_id: student1UserId,
        class_id: classId,
        student_code: 'STU-MEGHB1A-11',
        firebase_uid: 'uid_student_151'
    });

    // 4. Student 2 (Daya Nayak)
    const student2UserId = await upsertUser(dbInst, {
        name: 'Daya Nayak',
        role: 'student',
        email: 'student_001@smartslate.test',
        password_hash: passHash,
        student_code: 'STU-VAMS1A-11',
        firebase_uid: 'uid_student_001'
    });

    const student2Id = await upsertStudent(dbInst, {
        user_id: student2UserId,
        class_id: classId,
        student_code: 'STU-VAMS1A-11',
        firebase_uid: 'uid_student_001'
    });

    // 5. Parent (Ramesh Kumar) & Link to children
    const parentUserId = await upsertUser(dbInst, {
        name: 'Ramesh Kumar',
        role: 'parent',
        email: 'parent_ramesh@smartslate.test',
        password_hash: passHash,
        parent_code: 'PAR-RAMES-101',
        firebase_uid: 'uid_parent_ramesh'
    });

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

    // 6. Books & Notes
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

    // 7. Assignments & Submissions
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

    // 8. Attendance
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
