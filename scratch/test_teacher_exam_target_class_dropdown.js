const path = require('path');
const { run, get, all, initDb } = require('../shared/db/database');
const { FirebaseAuthService } = require('../shared/services/firebaseAuthService');

async function runTeacherExamTargetClassAcceptanceTest() {
    console.log('========================================================================');
    console.log('🧪 ACCEPTANCE TEST: Dynamic Teacher Exam Target Class & Section System');
    console.log('========================================================================\n');

    await initDb();

    // 1. Setup Test Teacher
    const teacherId = 9876;
    const teacherUid = 'teacher_multigrade_uid_9876';
    const teacherCode = 'TCH-9876';

    await run("DELETE FROM users WHERE id = ?", [teacherId]);
    await run("DELETE FROM student_teacher_connections WHERE teacher_uid = ? OR teacher_code = ?", [teacherUid, teacherCode]);
    await run("DELETE FROM exams WHERE created_by = ?", [teacherId]);

    await run(
        "INSERT INTO users (id, name, email, role, password_hash, teacher_code, subject) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [teacherId, 'Prof. Multigrade Teacher', 'teacher_multi@smartslate.test', 'teacher', 'testhash', teacherCode, 'Mathematics']
    );

    // 2. Setup 4 Connected Students across Grade 6 A, Grade 7 A, Grade 8 A, Grade 8 B
    const studentsData = [
        { id: 9801, uid: 'stu_g6_a_9801', code: 'STU-9801', name: 'Student A (Grade 6)', grade: 'Grade 6', section: 'A', edu: '6th to 10th' },
        { id: 9802, uid: 'stu_g7_a_9802', code: 'STU-9802', name: 'Student B (Grade 7)', grade: 'Grade 7', section: 'A', edu: '6th to 10th' },
        { id: 9803, uid: 'stu_g8_a_9803', code: 'STU-9803', name: 'Student C (Grade 8 A)', grade: 'Grade 8', section: 'A', edu: '6th to 10th' },
        { id: 9804, uid: 'stu_g8_b_9804', code: 'STU-9804', name: 'Student D (Grade 8 B)', grade: 'Grade 8', section: 'B', edu: '6th to 10th' },
    ];

    for (const s of studentsData) {
        await run("DELETE FROM students WHERE id = ? OR user_id = ?", [s.id, s.id]);
        await run("DELETE FROM users WHERE id = ?", [s.id]);

        await run("INSERT INTO users (id, name, email, role, password_hash, student_code) VALUES (?, ?, ?, 'student', 'testhash', ?)",
            [s.id, s.name, `${s.code.toLowerCase()}@smartslate.test`, s.code]);
        
        await run(
            `INSERT INTO students (id, user_id, student_code, firebase_uid, grade, class_name, section, education_level, class_id_str)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [s.id, s.id, s.code, s.uid, s.grade, s.grade, s.section, s.edu, `class-${s.grade.toLowerCase().replace(/\s+/g, '-')}-${s.section.toLowerCase()}`]
        );

        // Connect each student to teacher
        await run(
            `INSERT INTO student_teacher_connections (teacher_uid, teacher_code, student_uid, student_code, status)
             VALUES (?, ?, ?, ?, 'active')`,
            [teacherUid, teacherCode, s.uid, s.code]
        );
    }

    console.log('✅ Test teacher and 4 multi-grade connected students created.\n');

    // 3. Test Dynamic Class Fetching
    const teacherRoutes = require('../parent-teacher/server/routes/teacher');
    
    // We simulate fetchTeacherConnectedClasses directly or via endpoint logic
    const safeTeacherUid = String(teacherUid);
    const safeTeacherCode = teacherCode;

    const directConns = await all(
        `SELECT stc.*, s.id as s_id, s.user_id as s_user_id, s.firebase_uid as s_firebase_uid,
                s.grade as s_grade, s.class_name as s_class_name, s.section as s_section, s.education_level as s_education_level,
                s.class_id_str,
                u.name as u_name, u.email as u_email,
                COALESCE(s.grade, s.class_name, c.name, 'Grade 8') as resolved_grade,
                COALESCE(s.section, c.section, 'A') as resolved_section,
                COALESCE(s.education_level, 'High School') as resolved_education_level
         FROM student_teacher_connections stc
         LEFT JOIN students s ON (stc.student_uid = s.user_id OR stc.student_code = s.student_code OR stc.student_uid = s.firebase_uid)
         LEFT JOIN users u ON (s.user_id = u.id OR stc.student_code = u.student_code)
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE (stc.teacher_uid = ? OR stc.teacher_uid = ? OR stc.teacher_code = ?) AND stc.status = 'active'`,
        [safeTeacherUid, String(teacherId), safeTeacherCode]
    );

    const studentMap = new Map();
    directConns.forEach(st => {
        const key = String(st.s_firebase_uid || st.s_user_id || st.student_uid || st.s_id);
        const name = st.student_name || st.u_name || 'Student';
        const rawGrade = (st.s_grade || st.resolved_grade || st.s_class_name || 'Grade 8').trim();
        const rawSection = (st.s_section || st.resolved_section || 'A').trim().toUpperCase();
        const rawEducationLevel = (st.s_education_level || st.resolved_education_level || 'High School').trim();

        if (!studentMap.has(key)) {
            studentMap.set(key, {
                uid: st.s_firebase_uid || st.s_user_id || st.student_uid || String(st.s_id),
                id: st.s_id,
                name: name,
                studentCode: st.student_code || `STU-${key.slice(0, 4)}`,
                grade: rawGrade,
                section: rawSection,
                educationLevel: rawEducationLevel,
                classId: st.class_id_str || `class-${rawGrade.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${rawSection.toLowerCase()}`
            });
        }
    });

    const students = Array.from(studentMap.values());
    const classGroups = new Map();
    students.forEach(s => {
        const groupKey = `${s.educationLevel}___${s.grade}`;
        if (!classGroups.has(groupKey)) {
            classGroups.set(groupKey, {
                grade: s.grade,
                name: s.grade,
                className: s.grade,
                displayName: s.grade,
                classId: s.classId,
                educationLevel: s.educationLevel,
                sections: new Set([s.section]),
                students: [s],
                studentUids: [s.uid]
            });
        } else {
            const group = classGroups.get(groupKey);
            group.sections.add(s.section);
            group.students.push(s);
            if (!group.studentUids.includes(s.uid)) {
                group.studentUids.push(s.uid);
            }
        }
    });

    const classes = Array.from(classGroups.values()).map(g => ({
        grade: g.grade,
        name: g.grade,
        className: g.grade,
        displayName: g.displayName,
        classId: g.classId,
        educationLevel: g.educationLevel,
        sections: Array.from(g.sections).sort(),
        studentCount: g.students.length,
        students: g.students,
        studentUids: g.studentUids
    }));

    console.log('[TEST ASSERTION 1] Total Connected Classes Found:', classes.length);
    if (classes.length !== 3) {
        throw new Error(`Expected 3 dynamic classes (Grade 6, 7, 8), found ${classes.length}`);
    }

    const g6 = classes.find(c => c.grade === 'Grade 6');
    const g7 = classes.find(c => c.grade === 'Grade 7');
    const g8 = classes.find(c => c.grade === 'Grade 8');

    if (!g6 || !g7 || !g8) throw new Error('Missing one or more expected grades in classes');
    console.log('✅ Grade 6, Grade 7, Grade 8 all dynamically discovered from connected students!');

    console.log('\n[TEST ASSERTION 2] Sections Verification:');
    console.log('- Grade 6 sections:', g6.sections, '(Expected: ["A"])');
    console.log('- Grade 7 sections:', g7.sections, '(Expected: ["A"])');
    console.log('- Grade 8 sections:', g8.sections, '(Expected: ["A", "B"])');

    if (JSON.stringify(g6.sections) !== JSON.stringify(['A'])) throw new Error('Grade 6 sections mismatch');
    if (JSON.stringify(g7.sections) !== JSON.stringify(['A'])) throw new Error('Grade 7 sections mismatch');
    if (JSON.stringify(g8.sections) !== JSON.stringify(['A', 'B'])) throw new Error('Grade 8 sections mismatch');
    console.log('✅ Sections accurately dynamically aggregated!');

    // 4. Test Target Filtering
    const authService = new FirebaseAuthService();

    // Test Exam A: Target Class: Grade 8, Target Section: All
    const examGrade8All = {
        id: 'exam_g8_all',
        title: 'Grade 8 Mathematics Midterm (All Sections)',
        targetClass: 'Grade 8',
        targetSection: 'All',
        educationLevel: '6th to 10th',
        teacherUid: teacherUid
    };

    // Test Exam B: Target Class: Grade 8, Target Section: Section A
    const examGrade8SecA = {
        id: 'exam_g8_sec_a',
        title: 'Grade 8 Mathematics Quiz (Section A Only)',
        targetClass: 'Grade 8',
        targetSection: 'A',
        educationLevel: '6th to 10th',
        teacherUid: teacherUid
    };

    // Test Exam C: Target Class: Grade 8, Target Section: Section B
    const examGrade8SecB = {
        id: 'exam_g8_sec_b',
        title: 'Grade 8 Mathematics Quiz (Section B Only)',
        targetClass: 'Grade 8',
        targetSection: 'B',
        educationLevel: '6th to 10th',
        teacherUid: teacherUid
    };

    console.log('\n[TEST ASSERTION 3] Exam Visibility Matrix via isExamMatchingStudent:');

    // Student A (Grade 6 A): Should see NONE of Grade 8 exams
    const matchA_all = authService.isExamMatchingStudent(examGrade8All, { uid: studentsData[0].uid, grade: 'Grade 6', section: 'A', educationLevel: '6th to 10th', connectedTeachers: [teacherUid] });
    console.log('Student A (Grade 6 A) vs Exam Grade 8 All:', matchA_all.isMatch, '(Expected: false)');
    if (matchA_all.isMatch !== false) throw new Error('Grade 6 student matched Grade 8 exam');

    // Student C (Grade 8 A): Should see Exam Grade 8 All AND Exam Grade 8 Sec A, but NOT Sec B
    const matchC_all = authService.isExamMatchingStudent(examGrade8All, { uid: studentsData[2].uid, grade: 'Grade 8', section: 'A', educationLevel: '6th to 10th', connectedTeachers: [teacherUid] });
    const matchC_secA = authService.isExamMatchingStudent(examGrade8SecA, { uid: studentsData[2].uid, grade: 'Grade 8', section: 'A', educationLevel: '6th to 10th', connectedTeachers: [teacherUid] });
    const matchC_secB = authService.isExamMatchingStudent(examGrade8SecB, { uid: studentsData[2].uid, grade: 'Grade 8', section: 'A', educationLevel: '6th to 10th', connectedTeachers: [teacherUid] });

    console.log('Student C (Grade 8 A) vs Exam Grade 8 All:', matchC_all.isMatch, '(Expected: true)');
    console.log('Student C (Grade 8 A) vs Exam Grade 8 Sec A:', matchC_secA.isMatch, '(Expected: true)');
    console.log('Student C (Grade 8 A) vs Exam Grade 8 Sec B:', matchC_secB.isMatch, '(Expected: false)');

    if (!matchC_all.isMatch) throw new Error('Grade 8 A student did not match Grade 8 All exam');
    if (!matchC_secA.isMatch) throw new Error('Grade 8 A student did not match Grade 8 Section A exam');
    if (matchC_secB.isMatch) throw new Error('Grade 8 A student unexpectedly matched Grade 8 Section B exam');

    // Student D (Grade 8 B): Should see Exam Grade 8 All AND Exam Grade 8 Sec B, but NOT Sec A
    const matchD_all = authService.isExamMatchingStudent(examGrade8All, { uid: studentsData[3].uid, grade: 'Grade 8', section: 'B', educationLevel: '6th to 10th', connectedTeachers: [teacherUid] });
    const matchD_secA = authService.isExamMatchingStudent(examGrade8SecA, { uid: studentsData[3].uid, grade: 'Grade 8', section: 'B', educationLevel: '6th to 10th', connectedTeachers: [teacherUid] });
    const matchD_secB = authService.isExamMatchingStudent(examGrade8SecB, { uid: studentsData[3].uid, grade: 'Grade 8', section: 'B', educationLevel: '6th to 10th', connectedTeachers: [teacherUid] });

    console.log('Student D (Grade 8 B) vs Exam Grade 8 All:', matchD_all.isMatch, '(Expected: true)');
    console.log('Student D (Grade 8 B) vs Exam Grade 8 Sec A:', matchD_secA.isMatch, '(Expected: false)');
    console.log('Student D (Grade 8 B) vs Exam Grade 8 Sec B:', matchD_secB.isMatch, '(Expected: true)');

    if (!matchD_all.isMatch) throw new Error('Grade 8 B student did not match Grade 8 All exam');
    if (matchD_secA.isMatch) throw new Error('Grade 8 B student unexpectedly matched Grade 8 Section A exam');
    if (!matchD_secB.isMatch) throw new Error('Grade 8 B student did not match Grade 8 Section B exam');

    console.log('\n========================================================================');
    console.log('🎉 ALL ACCEPTANCE TESTS PASSED! (Target Class & Section Dynamic System)');
    console.log('========================================================================');
}

runTeacherExamTargetClassAcceptanceTest().catch(err => {
    console.error('❌ Acceptance test error:', err);
    process.exit(1);
});
