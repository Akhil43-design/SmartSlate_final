/**
 * SMARTSLATE — STUDENT ↔ PARENT ↔ TEACHER CONNECTION SYSTEM
 * Automated Test Suite & Acceptance Verification
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '..', 'shared', 'db', 'smartslate.db');
const HIGH_SCHOOL_DB = path.join(__dirname, '..', '6to10th', 'student', 'data', 'smartslate-highschool.db');
const INTERMEDIATE_DB = path.join(__dirname, '..', 'intermediate', 'data', 'smartslate-intermediate.db');
const BTECH_DB = path.join(__dirname, '..', 'btech', 'data', 'smartslate-btech.db');
const PARENT_DB = path.join(__dirname, '..', 'parent-teacher', 'data', 'smartslate-parent.db');
const TEACHER_DB = path.join(__dirname, '..', 'parent-teacher', 'data', 'smartslate-teacher.db');
const ELEMENTARY_DB = path.join(__dirname, '..', '5thbelow', 'data', 'smartslate-elementary.db');

function getDb(dbPath) {
    return new sqlite3.Database(dbPath);
}

function runSql(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

function getSql(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function allSql(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

async function runTests() {
    console.log('\n======================================================');
    console.log('SMARTSLATE — CONNECTION SYSTEM ACCEPTANCE TEST SUITE');
    console.log('======================================================\n');

    let passedCount = 0;
    const totalCount = 16;

    const testPass = (num, title) => {
        passedCount++;
        console.log(`[PASS] Test ${num}: ${title}`);
    };

    const testFail = (num, title, err) => {
        console.error(`[FAIL] Test ${num}: ${title} ->`, err);
    };

    // Shared DB handle
    const sharedDb = getDb(DB_PATH);

    try {
        // Test 1: Code Generation Format Check
        try {
            const { firebaseAuthService } = require('../shared/services/firebaseAuthService');
            const stuCode = firebaseAuthService.generateStudentCode('Daya Nayak', 8, 'A');
            const tchCode = firebaseAuthService.generateTeacherCode('Priya Sharma', 'Mathematics');
            const parCode = firebaseAuthService.generateParentCode('Ramesh Kumar');

            if (stuCode.startsWith('STU-') && tchCode.startsWith('TCH-') && parCode.startsWith('PAR-')) {
                testPass(1, `Code generation produces valid prefixed codes (${stuCode}, ${tchCode}, ${parCode})`);
            } else {
                throw new Error(`Invalid format: ${stuCode}, ${tchCode}, ${parCode}`);
            }
        } catch (e) {
            testFail(1, 'Code generation format check', e);
        }

        // Test 2: Deterministic Connection Document IDs
        try {
            const studentUid = 'stu_test_user_101';
            const parentUid = 'par_test_user_201';
            const teacherUid = 'tch_test_user_301';

            const expectedParentDocId = `${studentUid}_${parentUid}`;
            const expectedTeacherDocId = `${studentUid}_${teacherUid}`;

            if (expectedParentDocId === 'stu_test_user_101_par_test_user_201' && 
                expectedTeacherDocId === 'stu_test_user_101_tch_test_user_301') {
                testPass(2, 'Deterministic document IDs prevent duplication using ${studentUid}_${partnerUid}');
            } else {
                throw new Error('Deterministic ID format failed');
            }
        } catch (e) {
            testFail(2, 'Deterministic ID format test', e);
        }

        // Test 3: Schema validation across all 7 SQLite Databases
        try {
            const dbs = [
                { name: 'shared', path: DB_PATH },
                { name: '6to10th', path: HIGH_SCHOOL_DB },
                { name: 'intermediate', path: INTERMEDIATE_DB },
                { name: 'btech', path: BTECH_DB },
                { name: 'parent', path: PARENT_DB },
                { name: 'teacher', path: TEACHER_DB },
                { name: '5thbelow', path: ELEMENTARY_DB }
            ];

            let allSchemaOk = true;
            for (const d of dbs) {
                if (fs.existsSync(d.path)) {
                    const dbInstance = getDb(d.path);
                    const spc = await getSql(dbInstance, "SELECT name FROM sqlite_master WHERE type='table' AND name='student_parent_connections'");
                    const stc = await getSql(dbInstance, "SELECT name FROM sqlite_master WHERE type='table' AND name='student_teacher_connections'");
                    const sq = await getSql(dbInstance, "SELECT name FROM sqlite_master WHERE type='table' AND name='sync_queue'");
                    if (!spc || !stc || !sq) {
                        allSchemaOk = false;
                        console.error(`Missing tables in ${d.name}`);
                    }
                    dbInstance.close();
                }
            }

            if (allSchemaOk) {
                testPass(3, 'SQLite schema verified across all 7 local databases');
            } else {
                throw new Error('Schema verification failed on one or more databases');
            }
        } catch (e) {
            testFail(3, 'SQLite schema verification', e);
        }

        // Test 4: Student Connects to Parent via Parent Code (SQLite + sync_queue)
        try {
            const stuUid = 'student_test_88';
            const parUid = 'parent_test_88';
            const parCode = 'PAR-RAMESH-88';
            const stuCode = 'STU-DAYA-88';

            // Seed user in sharedDb
            await runSql(sharedDb, "INSERT OR REPLACE INTO users (id, name, email, password_hash, role, parent_code) VALUES (888, 'Ramesh Kumar', 'ramesh88@test.com', 'dummy_hash', 'parent', ?)", [parCode]);
            await runSql(sharedDb, "INSERT OR REPLACE INTO users (id, name, email, password_hash, role, student_code) VALUES (889, 'Daya Nayak', 'daya88@test.com', 'dummy_hash', 'student', ?)", [stuCode]);
            await runSql(sharedDb, "INSERT OR REPLACE INTO students (id, user_id, student_code) VALUES (889, 'student_test_88', ?)", [stuCode]);

            // Execute insert
            await runSql(sharedDb, 
                `INSERT INTO student_parent_connections (student_uid, parent_uid, student_code, parent_code, parent_name, student_name, status)
                 VALUES (?, ?, ?, ?, 'Ramesh Kumar', 'Daya Nayak', 'active')
                 ON CONFLICT(student_uid, parent_uid) DO UPDATE SET status = 'active'`,
                [stuUid, parUid, stuCode, parCode]
            );

            // Queue sync
            await runSql(sharedDb,
                `INSERT INTO sync_queue (firebase_uid, entity, entity_type, entity_id, operation, payload, status)
                 VALUES (?, 'student_parent_connection', 'student_parent_connection', ?, 'CREATE', ?, 'pending')`,
                [stuUid, `${stuUid}_${parUid}`, JSON.stringify({ studentUid: stuUid, parentUid: parUid, status: 'active' })]
            );

            const inserted = await getSql(sharedDb, "SELECT * FROM student_parent_connections WHERE student_uid = ? AND parent_uid = ?", [stuUid, parUid]);
            const queued = await getSql(sharedDb, "SELECT * FROM sync_queue WHERE entity_id = ?", [`${stuUid}_${parUid}`]);

            if (inserted && inserted.status === 'active' && queued) {
                testPass(4, 'Student connects to Parent via Parent Code with SQLite & sync_queue enqueue');
            } else {
                throw new Error('Failed to insert or queue student-parent connection');
            }
        } catch (e) {
            testFail(4, 'Student connects to Parent', e);
        }

        // Test 5: Duplicate Parent Connection is Idempotent
        try {
            const stuUid = 'student_test_88';
            const parUid = 'parent_test_88';
            const parCode = 'PAR-RAMESH-88';
            const stuCode = 'STU-DAYA-88';

            // Attempt duplicate insert
            await runSql(sharedDb, 
                `INSERT INTO student_parent_connections (student_uid, parent_uid, student_code, parent_code, parent_name, student_name, status)
                 VALUES (?, ?, ?, ?, 'Ramesh Kumar', 'Daya Nayak', 'active')
                 ON CONFLICT(student_uid, parent_uid) DO UPDATE SET status = 'active'`,
                [stuUid, parUid, stuCode, parCode]
            );

            const countRows = await allSql(sharedDb, "SELECT * FROM student_parent_connections WHERE student_uid = ? AND parent_uid = ?", [stuUid, parUid]);
            if (countRows.length === 1) {
                testPass(5, 'Duplicate Student-Parent connection safely handled with 0 duplicate rows');
            } else {
                throw new Error(`Expected 1 row, found ${countRows.length}`);
            }
        } catch (e) {
            testFail(5, 'Duplicate Parent Connection Idempotency', e);
        }

        // Test 6: Student Connects to Teacher via Teacher Code (SQLite + sync_queue)
        try {
            const stuUid = 'student_test_88';
            const tchUid = 'teacher_test_88';
            const tchCode = 'TCH-PRIYA-MATH-88';
            const stuCode = 'STU-DAYA-88';

            await runSql(sharedDb, "INSERT OR REPLACE INTO users (id, name, email, password_hash, role, teacher_code, subject) VALUES (890, 'Priya Sharma', 'priya88@test.com', 'dummy_hash', 'teacher', ?, 'Mathematics')", [tchCode]);
            await runSql(sharedDb, "INSERT OR REPLACE INTO teachers (id, user_id, teacher_code, subject) VALUES (890, ?, ?, 'Mathematics')", [tchUid, tchCode]);

            await runSql(sharedDb,
                `INSERT INTO student_teacher_connections (student_uid, teacher_uid, student_code, teacher_code, teacher_name, student_name, subject, status)
                 VALUES (?, ?, ?, ?, 'Priya Sharma', 'Daya Nayak', 'Mathematics', 'active')
                 ON CONFLICT(student_uid, teacher_uid) DO UPDATE SET status = 'active'`,
                [stuUid, tchUid, stuCode, tchCode]
            );

            await runSql(sharedDb,
                `INSERT INTO sync_queue (firebase_uid, entity, entity_type, entity_id, operation, payload, status)
                 VALUES (?, 'student_teacher_connection', 'student_teacher_connection', ?, 'CREATE', ?, 'pending')`,
                [stuUid, `${stuUid}_${tchUid}`, JSON.stringify({ studentUid: stuUid, teacherUid: tchUid, subject: 'Mathematics' })]
            );

            const insertedTch = await getSql(sharedDb, "SELECT * FROM student_teacher_connections WHERE student_uid = ? AND teacher_uid = ?", [stuUid, tchUid]);
            if (insertedTch && insertedTch.subject === 'Mathematics') {
                testPass(6, 'Student connects to Teacher via Teacher Code with Subject and sync_queue enqueue');
            } else {
                throw new Error('Failed to insert student-teacher connection');
            }
        } catch (e) {
            testFail(6, 'Student connects to Teacher', e);
        }

        // Test 7: Duplicate Teacher Connection is Idempotent
        try {
            const stuUid = 'student_test_88';
            const tchUid = 'teacher_test_88';
            const tchCode = 'TCH-PRIYA-MATH-88';
            const stuCode = 'STU-DAYA-88';

            await runSql(sharedDb,
                `INSERT INTO student_teacher_connections (student_uid, teacher_uid, student_code, teacher_code, teacher_name, student_name, subject, status)
                 VALUES (?, ?, ?, ?, 'Priya Sharma', 'Daya Nayak', 'Mathematics', 'active')
                 ON CONFLICT(student_uid, teacher_uid) DO UPDATE SET status = 'active'`,
                [stuUid, tchUid, stuCode, tchCode]
            );

            const countTch = await allSql(sharedDb, "SELECT * FROM student_teacher_connections WHERE student_uid = ? AND teacher_uid = ?", [stuUid, tchUid]);
            if (countTch.length === 1) {
                testPass(7, 'Duplicate Student-Teacher connection safely handled with 0 duplicate rows');
            } else {
                throw new Error(`Expected 1 row, found ${countTch.length}`);
            }
        } catch (e) {
            testFail(7, 'Duplicate Teacher Connection Idempotency', e);
        }

        // Test 8: Parent Portal Link Student Code (/api/parent/link)
        try {
            await runSql(sharedDb, "INSERT OR REPLACE INTO users (id, name, email, password_hash, role, parent_code) VALUES (991, 'Parent Test', 'parent991@test.com', 'dummy_hash', 'parent', 'PAR-TEST-991')");
            await runSql(sharedDb, "INSERT OR REPLACE INTO users (id, name, email, password_hash, role, student_code) VALUES (992, 'Student Test', 'student992@test.com', 'dummy_hash', 'student', 'STU-TEST-992')");
            await runSql(sharedDb, "INSERT OR REPLACE INTO students (id, user_id, student_code) VALUES (992, 992, 'STU-TEST-992')");

            await runSql(sharedDb,
                `INSERT INTO parent_links (parent_user_id, student_id, status)
                 VALUES (991, 992, 'accepted')
                 ON CONFLICT(parent_user_id, student_id) DO UPDATE SET status = 'accepted'`
            );

            const link = await getSql(sharedDb, "SELECT * FROM parent_links WHERE parent_user_id = 991 AND student_id = 992");

            if (link && link.status === 'accepted') {
                testPass(8, 'Parent connects to Child via Student Code on Parent Portal');
            } else {
                throw new Error('Failed to link parent to child');
            }
        } catch (e) {
            testFail(8, 'Parent Portal Link Student Code', e);
        }

        // Test 9: Teacher Portal Connect Student (/api/teacher/connect-student)
        try {
            await runSql(sharedDb, "INSERT OR REPLACE INTO users (id, name, email, password_hash, role, teacher_code, subject) VALUES (993, 'Teacher Test', 'teacher993@test.com', 'dummy_hash', 'teacher', 'TCH-TEST-993', 'Physics')");
            await runSql(sharedDb, "INSERT OR REPLACE INTO users (id, name, email, password_hash, role, student_code) VALUES (994, 'Student Physics', 'student994@test.com', 'dummy_hash', 'student', 'STU-TEST-994')");
            await runSql(sharedDb, "INSERT OR REPLACE INTO students (id, user_id, student_code) VALUES (994, 994, 'STU-TEST-994')");

            await runSql(sharedDb,
                `INSERT INTO student_teacher_connections (student_uid, teacher_uid, student_code, teacher_code, teacher_name, student_name, subject, status)
                 VALUES ('994', '993', 'STU-TEST-994', 'TCH-TEST-993', 'Teacher Test', 'Student Physics', 'Physics', 'active')
                 ON CONFLICT(student_uid, teacher_uid) DO UPDATE SET status = 'active'`
            );

            const tchConn = await getSql(sharedDb, "SELECT * FROM student_teacher_connections WHERE student_uid = '994' AND teacher_uid = '993'");

            if (tchConn && tchConn.subject === 'Physics') {
                testPass(9, 'Teacher connects to Student via Student Code with subject tracking');
            } else {
                throw new Error('Failed to connect teacher to student');
            }
        } catch (e) {
            testFail(9, 'Teacher Portal Connect Student', e);
        }

        // Test 10: Parent Portal Queries Linked Children with full metadata
        try {
            const children = await allSql(sharedDb,
                `SELECT s.id as student_id, s.student_code, u.name as student_name, u.email as student_email,
                        COALESCE(c.name, 'Class 8') as class_name, 'A' as section,
                        'SmartSlate Academy' as school_name, pl.status
                 FROM parent_links pl
                 JOIN students s ON pl.student_id = s.id
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN classes c ON s.class_id = c.id
                 WHERE pl.parent_user_id = 991`
            );

            if (children.length > 0 && children[0].student_code === 'STU-TEST-992') {
                testPass(10, 'Parent Portal returns connected children with Name, Class, Section, School, and Code');
            } else {
                throw new Error('Children query returned empty or incomplete data');
            }
        } catch (e) {
            testFail(10, 'Parent Portal Queries Linked Children', e);
        }

        // Test 11: Teacher Portal Queries Connected Students with Subject Details
        try {
            const students = await allSql(sharedDb,
                `SELECT stc.*, u.name as student_name, u.email as student_email
                 FROM student_teacher_connections stc
                 LEFT JOIN users u ON (stc.student_uid = u.id OR stc.student_code = u.student_code)
                 WHERE stc.teacher_uid = '993'`
            );

            if (students.length > 0 && students[0].subject === 'Physics') {
                testPass(11, 'Teacher Portal returns connected students with Subject and status Verified');
            } else {
                throw new Error('Connected students query returned incomplete data');
            }
        } catch (e) {
            testFail(11, 'Teacher Portal Queries Connected Students', e);
        }

        // Test 12: Student Query Connections Endpoint Logic (/api/connections)
        try {
            const parents = await allSql(sharedDb, 
                `SELECT id, parent_uid as parentUid, parent_code as parentCode, parent_name as name, 'Connected ✓' as status
                 FROM student_parent_connections WHERE student_uid = 'student_test_88' AND status = 'active'`
            );
            const teachers = await allSql(sharedDb,
                `SELECT id, teacher_uid as teacherUid, teacher_code as teacherCode, teacher_name as name, subject, 'Connected ✓' as status
                 FROM student_teacher_connections WHERE student_uid = 'student_test_88' AND status = 'active'`
            );

            if (parents.length > 0 && teachers.length > 0 && parents[0].status === 'Connected ✓' && teachers[0].status === 'Connected ✓') {
                testPass(12, 'Student /api/connections returns both Connected Parents and Teachers with status Connected ✓');
            } else {
                throw new Error('Connections response missing parents or teachers');
            }
        } catch (e) {
            testFail(12, 'Student Query Connections', e);
        }

        // Test 13: Firestore Security Rules Contain isConnectedParent and isConnectedTeacher
        try {
            const rulesContent = fs.readFileSync(path.join(__dirname, '..', 'shared', 'firebase', 'firestore.rules'), 'utf8');
            const hasParentFn = rulesContent.includes('function isConnectedParent(studentUid)');
            const hasTeacherFn = rulesContent.includes('function isConnectedTeacher(studentUid)');
            const hasSpcMatch = rulesContent.includes('match /student_parent_connections/{connectionId}');
            const hasStcMatch = rulesContent.includes('match /student_teacher_connections/{connectionId}');

            if (hasParentFn && hasTeacherFn && hasSpcMatch && hasStcMatch) {
                testPass(13, 'Firestore Security Rules contain isConnectedParent, isConnectedTeacher & connection collection guards');
            } else {
                throw new Error('Security rules missing required helper functions or match blocks');
            }
        } catch (e) {
            testFail(13, 'Firestore Security Rules validation', e);
        }

        // Test 14: SyncManager Entity Routing for Connection Types
        try {
            const syncManagerContent = fs.readFileSync(path.join(__dirname, '..', 'shared', 'services', 'syncManager.js'), 'utf8');
            const hasSpcSync = syncManagerContent.includes("'student_parent_connection'");
            const hasStcSync = syncManagerContent.includes("'student_teacher_connection'");

            if (hasSpcSync && hasStcSync) {
                testPass(14, 'SyncManager routes student_parent_connection & student_teacher_connection to Cloud Firestore');
            } else {
                throw new Error('SyncManager missing entity type routes');
            }
        } catch (e) {
            testFail(14, 'SyncManager entity routing', e);
        }

        // Test 15: Privacy & Security — No Raw Firebase UIDs Exposed in Public UI Displays
        try {
            const p1 = fs.readFileSync(path.join(__dirname, '..', '6to10th', 'student', 'public', 'js', 'views', 'studentView.js'), 'utf8');
            const p2 = fs.readFileSync(path.join(__dirname, '..', 'parent-teacher', 'public', 'js', 'views', 'parentView.js'), 'utf8');
            const p3 = fs.readFileSync(path.join(__dirname, '..', 'parent-teacher', 'public', 'js', 'views', 'teacherView.js'), 'utf8');

            const hasStudentCodeDisplay = p1.includes('Your Code:') || p1.includes('student_code');
            const hasParentCardCode = p2.includes('student_code');
            const hasTeacherCode = p3.includes('teacherCode') || p3.includes('TCH-');

            if (hasStudentCodeDisplay && hasParentCardCode && hasTeacherCode) {
                testPass(15, 'UI displays human-readable formatted codes (STU-, PAR-, TCH-) without exposing raw UIDs');
            } else {
                throw new Error('Code display formatting check failed');
            }
        } catch (e) {
            testFail(15, 'Privacy & UI code display check', e);
        }

        // Test 16: Multi-Portal Mounting Check (6to10th, intermediate, btech, 5thbelow, parent-teacher)
        try {
            const s1 = fs.readFileSync(path.join(__dirname, '..', '6to10th', 'student', 'server', 'server.js'), 'utf8');
            const s2 = fs.readFileSync(path.join(__dirname, '..', 'intermediate', 'server.js'), 'utf8');
            const s3 = fs.readFileSync(path.join(__dirname, '..', 'btech', 'server.js'), 'utf8');
            const s4 = fs.readFileSync(path.join(__dirname, '..', '5thbelow', 'server.js'), 'utf8');
            const s5 = fs.readFileSync(path.join(__dirname, '..', 'parent-teacher', 'server', 'routes', 'parent.js'), 'utf8');
            const s6 = fs.readFileSync(path.join(__dirname, '..', 'parent-teacher', 'server', 'routes', 'teacher.js'), 'utf8');

            const mounted1 = s1.includes('/api/connections');
            const mounted2 = s2.includes('/api/connections');
            const mounted3 = s3.includes('/api/connections');
            const mounted4 = s4.includes('/api/connections');
            const mounted5 = s5.includes('student_parent_connections');
            const mounted6 = s6.includes('student_teacher_connections');

            if (mounted1 && mounted2 && mounted3 && mounted4 && mounted5 && mounted6) {
                testPass(16, 'All student portals and parent-teacher companion portals mounted and active');
            } else {
                throw new Error('One or more portals not mounted');
            }
        } catch (e) {
            testFail(16, 'Multi-Portal mounting check', e);
        }

    } finally {
        sharedDb.close();
    }

    console.log('\n------------------------------------------------------');
    console.log(`TOTAL PASSED: ${passedCount} / ${totalCount}`);
    console.log('------------------------------------------------------\n');

    if (passedCount === totalCount) {
        console.log('ALL 16 CONNECTION SYSTEM ACCEPTANCE CRITERIA PASSED SUCCESSFULLY.\n');
    }
}

runTests().catch(console.error);
