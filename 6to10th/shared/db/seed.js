const bcrypt = require('bcryptjs');
const { initDb, run, get, all } = require('./database');

async function seed() {
    console.log('Seeding Unified SmartSlate database with demo PINs & accounts...');
    await initDb();

    const pinStudent1 = await bcrypt.hash('1111', 10);
    const pinStudent2 = await bcrypt.hash('2222', 10);
    const pinTeacher = await bcrypt.hash('3333', 10);
    const pinParent = await bcrypt.hash('4444', 10);

    // 1. Create Teacher (Prof. Sarah Lin - PIN: 3333)
    const existingTeacher = await get("SELECT * FROM users WHERE email = 'teacher@smartslate.local'");
    let teacherUserId;
    if (!existingTeacher) {
        const res = await run(
            "INSERT INTO users (name, role, email, password_hash) VALUES (?, ?, ?, ?)",
            ['Prof. Sarah Lin', 'teacher', 'teacher@smartslate.local', pinTeacher]
        );
        teacherUserId = res.id;
        await run("INSERT INTO teachers (user_id) VALUES (?)", [teacherUserId]);
    } else {
        teacherUserId = existingTeacher.id;
        await run("UPDATE users SET password_hash = ? WHERE id = ?", [pinTeacher, teacherUserId]);
    }

    // 2. Create Class
    const existingClass = await get("SELECT * FROM classes WHERE class_code = 'CLASS-5A'");
    let classId;
    if (!existingClass) {
        const res = await run(
            "INSERT INTO classes (name, teacher_id, class_code) VALUES (?, ?, ?)",
            ['Grade 5 Alpha', teacherUserId, 'CLASS-5A']
        );
        classId = res.id;
    } else {
        classId = existingClass.id;
    }

    // 3. Create Student 1 (Alex Rivera - PIN: 1111)
    const existingStudent1 = await get("SELECT * FROM users WHERE email = 'student@smartslate.local'");
    let student1UserId, student1Id;
    if (!existingStudent1) {
        const res = await run(
            "INSERT INTO users (name, role, email, password_hash, student_code) VALUES (?, ?, ?, ?, ?)",
            ['Alex Rivera', 'student', 'student@smartslate.local', pinStudent1, 'STU-101']
        );
        student1UserId = res.id;
        const sRes = await run(
            "INSERT INTO students (user_id, class_id, student_code) VALUES (?, ?, ?)",
            [student1UserId, classId, 'STU-101']
        );
        student1Id = sRes.id;
    } else {
        student1UserId = existingStudent1.id;
        await run("UPDATE users SET password_hash = ? WHERE id = ?", [pinStudent1, student1UserId]);
        const s = await get("SELECT * FROM students WHERE user_id = ?", [student1UserId]);
        student1Id = s.id;
    }

    // 4. Create Student 2 (Maya Patel - PIN: 2222)
    const existingStudent2 = await get("SELECT * FROM users WHERE email = 'maya@smartslate.local'");
    let student2UserId, student2Id;
    if (!existingStudent2) {
        const res = await run(
            "INSERT INTO users (name, role, email, password_hash, student_code) VALUES (?, ?, ?, ?, ?)",
            ['Maya Patel', 'student', 'maya@smartslate.local', pinStudent2, 'STU-102']
        );
        student2UserId = res.id;
        const sRes = await run(
            "INSERT INTO students (user_id, class_id, student_code) VALUES (?, ?, ?)",
            [student2UserId, classId, 'STU-102']
        );
        student2Id = sRes.id;
    } else {
        student2UserId = existingStudent2.id;
        await run("UPDATE users SET password_hash = ? WHERE id = ?", [pinStudent2, student2UserId]);
        const s = await get("SELECT * FROM students WHERE user_id = ?", [student2UserId]);
        student2Id = s.id;
    }

    // 5. Create Parent (Robert Rivera - PIN: 4444) & Link to Alex Rivera
    const existingParent = await get("SELECT * FROM users WHERE email = 'parent@smartslate.local'");
    let parentUserId;
    if (!existingParent) {
        const res = await run(
            "INSERT INTO users (name, role, email, password_hash) VALUES (?, ?, ?, ?)",
            ['Robert Rivera', 'parent', 'parent@smartslate.local', pinParent]
        );
        parentUserId = res.id;
    } else {
        parentUserId = existingParent.id;
        await run("UPDATE users SET password_hash = ? WHERE id = ?", [pinParent, parentUserId]);
    }

    const existingLink = await get("SELECT * FROM parent_links WHERE parent_user_id = ? AND student_id = ?", [parentUserId, student1Id]);
    if (!existingLink) {
        await run("INSERT INTO parent_links (parent_user_id, student_id, status) VALUES (?, ?, ?)", [parentUserId, student1Id, 'accepted']);
    }

    // 6. Books for Alex Rivera
    const existingBooks = await get("SELECT COUNT(*) as count FROM books WHERE student_id = ?", [student1Id]);
    if (existingBooks.count === 0) {
        const b1 = await run("INSERT INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)", [student1Id, 'Science & Discovery', 'Science', 'blue_linen']);
        const b2 = await run("INSERT INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)", [student1Id, 'Mathematics & Logic', 'Math', 'sage_paper']);
        const b3 = await run("INSERT INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)", [student1Id, 'World History & Stories', 'History', 'terracotta_leather']);

        await run(
            "INSERT INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [b1.id, 'Photosynthesis & Plant Biology', 'ruled', 'Plants convert light into chemical energy through photosynthesis.\nKey reaction: 6CO2 + 6H2O + Light -> C6H12O6 + 6O2.']
        );
        await run(
            "INSERT INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [b1.id, 'Solar System & Planetary Orbits', 'half_ruled', 'Diagram of the inner terrestrial planets vs outer gas giants.']
        );
        await run(
            "INSERT INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [b2.id, 'Fractions & Ratios Practice', 'four_ruled', 'Handwriting Practice:\na / b = c / d\n2/4 = 1/2 = 50%']
        );
    }

    // 7. Assignments & Submissions
    const existingAssign = await get("SELECT COUNT(*) as count FROM assignments WHERE class_id = ?", [classId]);
    if (existingAssign.count === 0) {
        const dueTomorrow = new Date(Date.now() + 86400000 * 2).toISOString();
        const a1 = await run(
            "INSERT INTO assignments (class_id, title, description, due_at, created_by) VALUES (?, ?, ?, ?, ?)",
            [classId, 'Science Report: Plant Ecosystems', 'Write a short summary on how plants convert sunlight into food.', dueTomorrow, teacherUserId]
        );

        await run(
            "INSERT INTO submissions (assignment_id, student_id, content, status, grade) VALUES (?, ?, ?, ?, ?)",
            [a1.id, student1Id, 'Photosynthesis is the process by which green plants use sunlight to synthesize nutrients.', 'graded', 'A (95%)']
        );
    }

    // 8. Exams & Results
    const existingExam = await get("SELECT COUNT(*) as count FROM exams WHERE class_id = ?", [classId]);
    if (existingExam.count === 0) {
        const questions = [
            {
                id: 1,
                text: "What gas do plants absorb during photosynthesis?",
                type: "mcq",
                options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Helium"],
                correct: "Carbon Dioxide"
            },
            {
                id: 2,
                text: "What is the primary organelle involved in photosynthesis?",
                type: "mcq",
                options: ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"],
                correct: "Chloroplast"
            }
        ];

        const e1 = await run(
            "INSERT INTO exams (class_id, title, questions_json, duration_minutes, created_by) VALUES (?, ?, ?, ?, ?)",
            [classId, 'Midterm Science Assessment', JSON.stringify(questions), 20, teacherUserId]
        );

        await run(
            "INSERT INTO exam_results (exam_id, student_id, answers_json, score, total_points) VALUES (?, ?, ?, ?, ?)",
            [e1.id, student1Id, JSON.stringify({1: "Carbon Dioxide", 2: "Chloroplast"}), 95.0, 100.0]
        );
    }

    // 9. Attendance
    const existingAtt = await get("SELECT COUNT(*) as count FROM attendance WHERE class_id = ?", [classId]);
    if (existingAtt.count === 0) {
        const dates = [
            new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
            new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
            new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
        ];

        for (const date of dates) {
            await run("INSERT INTO attendance (class_id, student_id, date, status) VALUES (?, ?, ?, ?)", [classId, student1Id, date, 'present']);
            await run("INSERT INTO attendance (class_id, student_id, date, status) VALUES (?, ?, ?, ?)", [classId, student2Id, date, date.endsWith('2') ? 'late' : 'present']);
        }
    }

    console.log('Unified SmartSlate database seeding completed successfully!');
}

if (require.main === module) {
    seed().then(() => process.exit(0)).catch(err => {
        console.error('Seed error:', err);
        process.exit(1);
    });
}

module.exports = { seed };
