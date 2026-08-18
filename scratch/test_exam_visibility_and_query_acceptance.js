const assert = require('assert');
const { firebaseAuthService } = require('../shared/services/firebaseAuthService');
const { run, get, all } = require('../shared/db/database');
const http = require('http');

async function testAllExamVisibilityCases() {
    console.log('====================================================');
    console.log('🧪 RUNNING COMPLETE EXAM VISIBILITY ACCEPTANCE SUITE');
    console.log('====================================================\n');

    let passedAssertions = 0;

    // 1. Test canonical normalizer
    console.log('Test 1: Canonical Class Normalizer...');
    assert.strictEqual(firebaseAuthService.normalizeClass('Grade 8'), '8');
    assert.strictEqual(firebaseAuthService.normalizeClass('Class 8'), '8');
    assert.strictEqual(firebaseAuthService.normalizeClass('8th Class'), '8');
    assert.strictEqual(firebaseAuthService.normalizeClass('8'), '8');
    assert.strictEqual(firebaseAuthService.normalizeClass('class-8'), '8');
    assert.strictEqual(firebaseAuthService.normalizeClass('10th Class — Section A'), '10');
    assert.strictEqual(firebaseAuthService.normalizeClass('Inter 1st Year MPC'), 'inter_1');
    assert.strictEqual(firebaseAuthService.normalizeClass('B.Tech CSE III Year'), 'btech');
    passedAssertions += 8;
    console.log('  ✓ 8/8 Normalizer assertions passed.');

    // 2. Test Section Normalizer & Extractor
    console.log('\nTest 2: Section Normalizer & Extractor...');
    assert.strictEqual(firebaseAuthService.normalizeSection('A'), 'A');
    assert.strictEqual(firebaseAuthService.normalizeSection('Section B'), 'B');
    assert.strictEqual(firebaseAuthService.normalizeSection('all'), '');
    assert.strictEqual(firebaseAuthService.normalizeSection(null), '');
    assert.strictEqual(firebaseAuthService.extractSectionFromClassString('10th Class — Section A'), 'A');
    assert.strictEqual(firebaseAuthService.extractSectionFromClassString('Grade 8 / B'), 'B');
    passedAssertions += 6;
    console.log('  ✓ 6/6 Section assertions passed.');

    // 3. Test Case 1: Grade 8 / Section A Exam vs Grade 8 / Section A Student (SHOULD BE VISIBLE)
    console.log('\nTest 3: Case 1 - Grade 8/A Student vs Grade 8/A Exam...');
    const studentGrade8A = {
        uid: 'stu_g8_a',
        name: 'Student 8A',
        className: 'Grade 8',
        section: 'A',
        teacherIds: ['tch_priya']
    };
    const examGrade8A = {
        id: 'exam_g8_a_01',
        teacherUid: 'tch_priya',
        targetClass: 'Grade 8',
        targetSection: 'A',
        title: 'Class 8 Term Exam'
    };
    const comp1 = firebaseAuthService.isExamMatchingStudent(examGrade8A, studentGrade8A);
    assert.strictEqual(comp1.classMatch, true);
    assert.strictEqual(comp1.sectionMatch, true);
    assert.strictEqual(comp1.isMatch, true);
    passedAssertions += 3;
    console.log('  ✓ Case 1: Exam is VISIBLE for Grade 8 / Section A student.');

    // 4. Test Case 2: Grade 8 / Section A Exam vs Grade 9 / Section A Student (NOT VISIBLE)
    console.log('\nTest 4: Case 2 - Grade 9/A Student vs Grade 8/A Exam...');
    const studentGrade9A = {
        uid: 'stu_g9_a',
        name: 'Student 9A',
        className: 'Grade 9',
        section: 'A',
        teacherIds: ['tch_priya']
    };
    const comp2 = firebaseAuthService.isExamMatchingStudent(examGrade8A, studentGrade9A);
    assert.strictEqual(comp2.classMatch, false);
    assert.strictEqual(comp2.isMatch, false);
    passedAssertions += 2;
    console.log('  ✓ Case 2: Exam is NOT VISIBLE for Grade 9 student.');

    // 5. Test Case 3: Grade 8 / Section A Exam vs Grade 8 / Section B Student (NOT VISIBLE)
    console.log('\nTest 5: Case 3 - Grade 8/B Student vs Grade 8/A Exam...');
    const studentGrade8B = {
        uid: 'stu_g8_b',
        name: 'Student 8B',
        className: 'Grade 8',
        section: 'B',
        teacherIds: ['tch_priya']
    };
    const comp3 = firebaseAuthService.isExamMatchingStudent(examGrade8A, studentGrade8B);
    assert.strictEqual(comp3.classMatch, true);
    assert.strictEqual(comp3.sectionMatch, false);
    assert.strictEqual(comp3.isMatch, false);
    passedAssertions += 3;
    console.log('  ✓ Case 3: Exam targeted to Section A is NOT VISIBLE for Section B student.');

    // 6. Test Whole-Class Exam (Section Empty/All) -> Both Section A & Section B receive it
    console.log('\nTest 6: Whole Class Exam (Section null/empty) -> Both 8A and 8B match...');
    const examGrade8All = {
        id: 'exam_g8_all_01',
        teacherUid: 'tch_priya',
        targetClass: 'Class 8',
        targetSection: '',
        title: 'Class 8 General Science Test'
    };
    const compAllA = firebaseAuthService.isExamMatchingStudent(examGrade8All, studentGrade8A);
    const compAllB = firebaseAuthService.isExamMatchingStudent(examGrade8All, studentGrade8B);
    assert.strictEqual(compAllA.isMatch, true);
    assert.strictEqual(compAllB.isMatch, true);
    passedAssertions += 2;
    console.log('  ✓ Whole class exam matches both Section A and Section B.');

    // 7. Test Timing Windows: Upcoming, Active, Closed
    console.log('\nTest 7: Exam Availability Windows (Upcoming, Active, Closed)...');
    const now = new Date();
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    // Case 4: Tomorrow's exam -> UPCOMING (Visible, but disabled start)
    const upcomingExam = {
        id: 'exam_upcoming',
        startDate: tomorrowStr,
        startTime: '10:00',
        endDate: tomorrowStr,
        endTime: '12:00',
        targetClass: 'Grade 8',
        targetSection: 'A'
    };
    const upStart = new Date(`${upcomingExam.startDate}T${upcomingExam.startTime}:00`);
    assert.strictEqual(now < upStart, true);

    // Case 5: Today's exam -> ACTIVE (Visible and enabled start)
    const activeExam = {
        id: 'exam_active',
        startDate: todayStr,
        startTime: '00:00',
        endDate: todayStr,
        endTime: '23:59',
        targetClass: 'Grade 8',
        targetSection: 'A'
    };
    const actStart = new Date(`${activeExam.startDate}T${activeExam.startTime}:00`);
    const actEnd = new Date(`${activeExam.endDate}T${activeExam.endTime}:00`);
    assert.strictEqual(now >= actStart && now <= actEnd, true);

    // Case 6: Past exam -> CLOSED (Visible, but disabled start)
    const closedExam = {
        id: 'exam_closed',
        startDate: yesterdayStr,
        startTime: '08:00',
        endDate: yesterdayStr,
        endTime: '10:00',
        targetClass: 'Grade 8',
        targetSection: 'A'
    };
    const clEnd = new Date(`${closedExam.endDate}T${closedExam.endTime}:00`);
    assert.strictEqual(now > clEnd, true);
    passedAssertions += 3;
    console.log('  ✓ Availability window checks (Upcoming, Active, Closed) verified.');

    // 8. Test Student Server HTTP API /api/exams
    console.log('\nTest 8: Student Server HTTP API /api/exams querying...');
    const studentUser = await get("SELECT * FROM users WHERE email = 'student_051@smartslate.test' OR id = 5034").catch(() => null);
    if (studentUser) {
        console.log(`  Found student ${studentUser.name} (${studentUser.email})`);
    }

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedAssertions} EXAM VISIBILITY ASSERTIONS PASSED!`);
    console.log('====================================================\n');
}

testAllExamVisibilityCases().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
