const bcrypt = require('bcryptjs');
const { initDb, run, get } = require('./database');

async function seed() {
    console.log('Seeding SmartSlate database...');
    await initDb();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Teacher
    const existingTeacher = await get("SELECT * FROM users WHERE email = 'teacher@smartslate.local'");
    let teacherUserId;
    if (!existingTeacher) {
        const res = await run(
            "INSERT INTO users (name, role, email, password_hash) VALUES (?, ?, ?, ?)",
            ['Prof. Sarah Lin', 'teacher', 'teacher@smartslate.local', hashedPassword]
        );
        teacherUserId = res.id;
        await run("INSERT INTO teachers (user_id) VALUES (?)", [teacherUserId]);
    } else {
        teacherUserId = existingTeacher.id;
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

    // 3. Create Student 1 (Alex Rivera)
    const existingStudent1 = await get("SELECT * FROM users WHERE email = 'student@smartslate.local'");
    let student1UserId, student1Id;
    if (!existingStudent1) {
        const res = await run(
            "INSERT INTO users (name, role, email, password_hash, student_code) VALUES (?, ?, ?, ?, ?)",
            ['Alex Rivera', 'student', 'student@smartslate.local', hashedPassword, 'STU-101']
        );
        student1UserId = res.id;
        const sRes = await run(
            "INSERT INTO students (user_id, class_id, student_code) VALUES (?, ?, ?)",
            [student1UserId, classId, 'STU-101']
        );
        student1Id = sRes.id;
    } else {
        student1UserId = existingStudent1.id;
        const s = await get("SELECT * FROM students WHERE user_id = ?", [student1UserId]);
        student1Id = s.id;
    }

    // 4. Create Student 2 (Maya Patel)
    const existingStudent2 = await get("SELECT * FROM users WHERE email = 'maya@smartslate.local'");
    let student2UserId, student2Id;
    if (!existingStudent2) {
        const res = await run(
            "INSERT INTO users (name, role, email, password_hash, student_code) VALUES (?, ?, ?, ?, ?)",
            ['Maya Patel', 'student', 'maya@smartslate.local', hashedPassword, 'STU-102']
        );
        student2UserId = res.id;
        const sRes = await run(
            "INSERT INTO students (user_id, class_id, student_code) VALUES (?, ?, ?)",
            [student2UserId, classId, 'STU-102']
        );
        student2Id = sRes.id;
    } else {
        student2UserId = existingStudent2.id;
        const s = await get("SELECT * FROM students WHERE user_id = ?", [student2UserId]);
        student2Id = s.id;
    }

    // 5. Create Parent (Robert Rivera) & Link to Alex Rivera
    const existingParent = await get("SELECT * FROM users WHERE email = 'parent@smartslate.local'");
    let parentUserId;
    if (!existingParent) {
        const res = await run(
            "INSERT INTO users (name, role, email, password_hash) VALUES (?, ?, ?, ?)",
            ['Robert Rivera', 'parent', 'parent@smartslate.local', hashedPassword]
        );
        parentUserId = res.id;
    } else {
        parentUserId = existingParent.id;
    }

    const existingLink = await get("SELECT * FROM parent_links WHERE parent_user_id = ? AND student_id = ?", [parentUserId, student1Id]);
    if (!existingLink) {
        await run("INSERT INTO parent_links (parent_user_id, student_id, status) VALUES (?, ?, ?)", [parentUserId, student1Id, 'accepted']);
    }

    // 6. Create Books for Alex Rivera
    const existingBooks = await get("SELECT COUNT(*) as count FROM books WHERE student_id = ?", [student1Id]);
    if (existingBooks.count === 0) {
        const b1 = await run("INSERT INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)", [student1Id, 'Science & Discovery', 'Science', 'blue_linen']);
        const b2 = await run("INSERT INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)", [student1Id, 'Mathematics & Logic', 'Math', 'sage_paper']);
        const b3 = await run("INSERT INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)", [student1Id, 'World History & Stories', 'History', 'terracotta_leather']);

        // Insert Notes with different rule types
        await run(
            "INSERT INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [b1.id, 'Photosynthesis & Plant Biology', 'ruled', 'Plants convert light into chemical energy through photosynthesis.\nKey reaction: 6CO2 + 6H2O + Light -> C6H12O6 + 6O2.\nChloroplasts absorb red and blue wavelengths while reflecting green light.']
        );
        await run(
            "INSERT INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [b1.id, 'Solar System & Planetary Orbits', 'half_ruled', 'Diagram of the inner terrestrial planets vs outer gas giants.\nMercury, Venus, Earth, Mars (rocky).\nJupiter, Saturn, Uranus, Neptune (gas/ice giants).']
        );

        await run(
            "INSERT INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [b2.id, 'Fractions & Ratios Practice', 'four_ruled', 'Handwriting Practice:\na / b = c / d\n2/4 = 1/2 = 50%\nCross-multiplication rule: a * d = b * c']
        );
        await run(
            "INSERT INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [b2.id, 'Geometry Formulas & Diagrams', 'double_ruled', 'Area of Circle = π * r²\nPerimeter of Rectangle = 2 * (length + width)\nPythagorean Theorem: a² + b² = c²']
        );

        await run(
            "INSERT INTO notes (book_id, title, rule_type, content) VALUES (?, ?, ?, ?)",
            [b3.id, 'Ancient Silk Road Trade Routes', 'plain', 'The Silk Road connected East Asia with the Mediterranean.\nTraded goods: Silk, spices, porcelain, glass, and cultural knowledge.\nKey cities: Xi\'an, Samarkand, Constantinople.']
        );
    }

    // 7. Create Class Group & Sample Messages
    const existingGroup = await get("SELECT * FROM class_groups WHERE class_id = ?", [classId]);
    let groupId;
    if (!existingGroup) {
        const gRes = await run("INSERT INTO class_groups (class_id, name) VALUES (?, ?)", [classId, 'Grade 5 Alpha General']);
        groupId = gRes.id;

        await run("INSERT INTO messages (group_id, sender_id, content) VALUES (?, ?, ?)", [groupId, teacherUserId, 'Welcome everyone to Grade 5 Alpha! Don\'t forget to review tomorrow\'s Science assignment.']);
        await run("INSERT INTO messages (group_id, sender_id, content) VALUES (?, ?, ?)", [groupId, student1UserId, 'Thanks Prof. Lin! I finished reading Chapter 4 on Photosynthesis.']);
        await run("INSERT INTO messages (group_id, sender_id, content) VALUES (?, ?, ?)", [groupId, student2UserId, 'I have a quick question about problem #3 on the math worksheet.']);
    }

    // 8. Assignments & Submissions
    const existingAssign = await get("SELECT COUNT(*) as count FROM assignments WHERE class_id = ?", [classId]);
    if (existingAssign.count === 0) {
        const dueTomorrow = new Date(Date.now() + 86400000 * 2).toISOString();
        const a1 = await run(
            "INSERT INTO assignments (class_id, title, description, due_at, created_by) VALUES (?, ?, ?, ?, ?)",
            [classId, 'Science Report: Plant Ecosystems', 'Write a short summary on how plants convert sunlight into food.', dueTomorrow, teacherUserId]
        );
        const a2 = await run(
            "INSERT INTO assignments (class_id, title, description, due_at, created_by) VALUES (?, ?, ?, ?, ?)",
            [classId, 'Math Worksheet: Equivalent Ratios', 'Solve problems 1-10 on page 42.', dueTomorrow, teacherUserId]
        );

        await run(
            "INSERT INTO submissions (assignment_id, student_id, content, status, grade) VALUES (?, ?, ?, ?, ?)",
            [a1.id, student1Id, 'Photosynthesis is the process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water.', 'graded', 'A (95%)']
        );
    }

    // 9. Exams & Results
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
            },
            {
                id: 3,
                text: "Explain why leaves appear green to the human eye.",
                type: "short_answer",
                correct: "Chlorophyll reflects green light wavelength while absorbing red and blue."
            }
        ];

        const e1 = await run(
            "INSERT INTO exams (class_id, title, questions_json, duration_minutes, created_by) VALUES (?, ?, ?, ?, ?)",
            [classId, 'Midterm Science Assessment', JSON.stringify(questions), 20, teacherUserId]
        );

        const answers = {
            1: "Carbon Dioxide",
            2: "Chloroplast",
            3: "Because chlorophyll absorbs red and blue light and reflects green light back."
        };

        await run(
            "INSERT INTO exam_results (exam_id, student_id, answers_json, score, total_points) VALUES (?, ?, ?, ?, ?)",
            [e1.id, student1Id, JSON.stringify(answers), 95.0, 100.0]
        );
    }

    // 10. Attendance Records
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

    // 11. Notifications & Web Activity
    const existingNotif = await get("SELECT COUNT(*) as count FROM notifications WHERE user_id = ?", [student1UserId]);
    if (existingNotif.count === 0) {
        await run("INSERT INTO notifications (user_id, type, content) VALUES (?, ?, ?)", [student1UserId, 'assignment', 'New assignment published: Science Report']);
        await run("INSERT INTO notifications (user_id, type, content) VALUES (?, ?, ?)", [student1UserId, 'exam', 'Exam score released: Midterm Science (95%)']);
        await run("INSERT INTO notifications (user_id, type, content) VALUES (?, ?, ?)", [parentUserId, 'attendance', 'Alex Rivera was marked Present for today\'s class.']);
    }

    const existingWeb = await get("SELECT COUNT(*) as count FROM web_activity WHERE student_id = ?", [student1Id]);
    if (existingWeb.count === 0) {
        await run("INSERT INTO web_activity (student_id, query) VALUES (?, ?)", [student1Id, 'how does photosynthesis work in plants']);
        await run("INSERT INTO web_activity (student_id, query) VALUES (?, ?)", [student1Id, 'ancient silk road map and history']);
    }

    console.log('Database seeding complete successfully!');
}

if (require.main === module) {
    seed().then(() => process.exit(0)).catch(err => {
        console.error('Seed error:', err);
        process.exit(1);
    });
}

module.exports = { seed };
