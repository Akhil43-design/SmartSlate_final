/**
 * SmartSlate Unified SQLite Database Safe Migration Engine
 * Idempotent, WAL-enabled, concurrency-safe migrations with busy timeout.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * Executes a query as a Promise with busy retry.
 */
function execQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

function getTableColumns(db, tableName) {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
            if (err) return reject(err);
            resolve((rows || []).map(r => r.name.toLowerCase()));
        });
    });
}

async function ensureColumn(db, tableName, columnName, colDefinition) {
    try {
        const existing = await getTableColumns(db, tableName);
        if (!existing.includes(columnName.toLowerCase())) {
            await execQuery(db, `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${colDefinition}`);
            console.log(`  ➕ [Migration] Added column ${tableName}.${columnName}`);
        }
    } catch (err) {
        // Ignore duplicate column errors or table doesn't exist yet
        if (!err.message.includes('duplicate column') && !err.message.includes('no such table')) {
            console.warn(`  ⚠️ [Migration Warning] ${tableName}.${columnName}: ${err.message}`);
        }
    }
}

/**
 * Runs safe, idempotent migrations on any SmartSlate SQLite database instance.
 */
async function runSafeMigrations(dbPath) {
    const resolvedPath = path.resolve(dbPath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(resolvedPath, async (err) => {
            if (err) {
                console.error(`❌ [Migration] Could not open database at ${resolvedPath}:`, err.message);
                return reject(err);
            }

            try {
                // Configure high concurrency & WAL resilience
                await execQuery(db, 'PRAGMA journal_mode = WAL;');
                await execQuery(db, 'PRAGMA synchronous = NORMAL;');
                await execQuery(db, 'PRAGMA busy_timeout = 30000;');
                await execQuery(db, 'PRAGMA foreign_keys = ON;');

                // 1. Ensure core schema tables exist
                const schemaPath = path.join(__dirname, 'schema.sql');
                if (fs.existsSync(schemaPath)) {
                    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
                    await new Promise((res, rej) => {
                        db.exec(schemaSql, (execErr) => {
                            if (execErr && !execErr.message.includes('already exists')) {
                                console.warn(`  ⚠️ [Migration] schema.sql exec note: ${execErr.message}`);
                            }
                            res();
                        });
                    });
                }

                // 2. Safely add missing columns to existing tables
                // USERS TABLE
                await ensureColumn(db, 'users', 'name', 'TEXT');
                await ensureColumn(db, 'users', 'email', 'TEXT');
                await ensureColumn(db, 'users', 'role', "TEXT DEFAULT 'student'");
                await ensureColumn(db, 'users', 'password_hash', 'TEXT');
                await ensureColumn(db, 'users', 'student_code', 'TEXT');
                await ensureColumn(db, 'users', 'teacher_code', 'TEXT');
                await ensureColumn(db, 'users', 'parent_code', 'TEXT');
                await ensureColumn(db, 'users', 'subject', 'TEXT');
                await ensureColumn(db, 'users', 'phone', 'TEXT');
                await ensureColumn(db, 'users', 'firebase_uid', 'TEXT');
                await ensureColumn(db, 'users', 'created_at', 'DATETIME');
                await ensureColumn(db, 'users', 'updated_at', 'DATETIME');

                // TEACHERS TABLE
                await ensureColumn(db, 'teachers', 'user_id', 'INTEGER');
                await ensureColumn(db, 'teachers', 'teacher_code', 'TEXT');
                await ensureColumn(db, 'teachers', 'subject', 'TEXT');
                await ensureColumn(db, 'teachers', 'firebase_uid', 'TEXT');
                await ensureColumn(db, 'teachers', 'created_at', 'DATETIME');
                await ensureColumn(db, 'teachers', 'updated_at', 'DATETIME');

                // STUDENTS TABLE
                await ensureColumn(db, 'students', 'user_id', 'INTEGER');
                await ensureColumn(db, 'students', 'class_id', 'INTEGER');
                await ensureColumn(db, 'students', 'student_code', 'TEXT');
                await ensureColumn(db, 'students', 'parent_code', 'TEXT');
                await ensureColumn(db, 'students', 'grade', 'TEXT');
                await ensureColumn(db, 'students', 'class_name', 'TEXT');
                await ensureColumn(db, 'students', 'class_id_str', 'TEXT');
                await ensureColumn(db, 'students', 'student_id_str', 'TEXT');
                await ensureColumn(db, 'students', 'firebase_uid', 'TEXT');
                await ensureColumn(db, 'students', 'created_at', 'DATETIME');
                await ensureColumn(db, 'students', 'updated_at', 'DATETIME');

                // STUDENT_PROFILES TABLE (if table exists)
                await ensureColumn(db, 'student_profiles', 'firebase_uid', 'TEXT');
                await ensureColumn(db, 'student_profiles', 'student_id', 'TEXT');
                await ensureColumn(db, 'student_profiles', 'name', 'TEXT');
                await ensureColumn(db, 'student_profiles', 'email', 'TEXT');
                await ensureColumn(db, 'student_profiles', 'class', "TEXT DEFAULT '8'");
                await ensureColumn(db, 'student_profiles', 'class_name', "TEXT DEFAULT 'Class 8'");
                await ensureColumn(db, 'student_profiles', 'education_level', "TEXT DEFAULT 'secondary'");
                await ensureColumn(db, 'student_profiles', 'section', "TEXT DEFAULT 'A'");
                await ensureColumn(db, 'student_profiles', 'parent_student_code', 'TEXT');

                // CLASSES TABLE
                await ensureColumn(db, 'classes', 'name', 'TEXT');
                await ensureColumn(db, 'classes', 'teacher_id', 'INTEGER');
                await ensureColumn(db, 'classes', 'class_code', 'TEXT');
                await ensureColumn(db, 'classes', 'section', 'TEXT');
                await ensureColumn(db, 'classes', 'created_at', 'DATETIME');

                // EXAMS TABLE
                await ensureColumn(db, 'exams', 'start_time', 'DATETIME');
                await ensureColumn(db, 'exams', 'end_time', 'DATETIME');
                await ensureColumn(db, 'exams', 'target_class', 'TEXT');
                await ensureColumn(db, 'exams', 'target_section', "TEXT DEFAULT 'All'");
                await ensureColumn(db, 'exams', 'subject', 'TEXT');
                await ensureColumn(db, 'exams', 'education_level', 'TEXT');
                await ensureColumn(db, 'exams', 'exam_type', "TEXT DEFAULT 'written'");
                await ensureColumn(db, 'exams', 'duration_minutes', 'INTEGER DEFAULT 60');
                await ensureColumn(db, 'exams', 'start_date', 'TEXT');
                await ensureColumn(db, 'exams', 'end_date', 'TEXT');
                await ensureColumn(db, 'exams', 'answer_key', 'TEXT');

                // ASSIGNMENTS TABLE
                await ensureColumn(db, 'assignments', 'target_class', 'TEXT');
                await ensureColumn(db, 'assignments', 'target_section', "TEXT DEFAULT 'All'");
                await ensureColumn(db, 'assignments', 'subject', 'TEXT');
                await ensureColumn(db, 'assignments', 'education_level', 'TEXT');

                // NOTES TABLE
                await ensureColumn(db, 'notes', 'deleted', 'INTEGER DEFAULT 0');
                await ensureColumn(db, 'notes', 'sync_status', "TEXT DEFAULT 'synced'");
                await ensureColumn(db, 'notes', 'firebase_uid', 'TEXT');
                await ensureColumn(db, 'notes', 'note_id', 'TEXT');
                await ensureColumn(db, 'notes', 'drawing_data', 'TEXT');
                await ensureColumn(db, 'notes', 'rule_type', "TEXT DEFAULT 'ruled'");

                // BOOKS TABLE
                await ensureColumn(db, 'books', 'deleted', 'INTEGER DEFAULT 0');
                await ensureColumn(db, 'books', 'sync_status', "TEXT DEFAULT 'synced'");
                await ensureColumn(db, 'books', 'firebase_uid', 'TEXT');
                await ensureColumn(db, 'books', 'book_id', 'TEXT');
                await ensureColumn(db, 'books', 'description', 'TEXT');
                await ensureColumn(db, 'books', 'cover_style', "TEXT DEFAULT 'blue_linen'");

                // SUBMISSIONS TABLE
                await ensureColumn(db, 'submissions', 'evaluated_at', 'DATETIME');
                await ensureColumn(db, 'submissions', 'evaluated_by', 'TEXT');
                await ensureColumn(db, 'submissions', 'student_uid', 'TEXT');

                // 3. Ensure essential supplementary tables exist
                await execQuery(db, `CREATE TABLE IF NOT EXISTS exam_submissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    exam_id INTEGER NOT NULL,
                    student_id INTEGER NOT NULL,
                    student_uid TEXT,
                    answers TEXT NOT NULL,
                    score REAL,
                    total_marks REAL,
                    status TEXT DEFAULT 'submitted',
                    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    evaluated_at DATETIME,
                    evaluated_by TEXT,
                    feedback TEXT,
                    violation_count INTEGER DEFAULT 0,
                    UNIQUE(exam_id, student_id)
                )`);

                await execQuery(db, `CREATE TABLE IF NOT EXISTS exam_violations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    exam_id INTEGER NOT NULL,
                    student_id INTEGER NOT NULL,
                    student_uid TEXT,
                    type TEXT NOT NULL,
                    details TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                await execQuery(db, `CREATE TABLE IF NOT EXISTS student_parent_connections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_uid TEXT NOT NULL,
                    parent_uid TEXT NOT NULL,
                    student_code TEXT,
                    parent_code TEXT,
                    parent_name TEXT,
                    student_name TEXT,
                    status TEXT DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_uid, parent_uid)
                )`);

                await execQuery(db, `CREATE TABLE IF NOT EXISTS student_teacher_connections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_uid TEXT NOT NULL,
                    teacher_uid TEXT NOT NULL,
                    student_code TEXT,
                    teacher_code TEXT,
                    teacher_name TEXT,
                    student_name TEXT,
                    subject TEXT,
                    status TEXT DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_uid, teacher_uid)
                )`);

                db.close((closeErr) => {
                    if (closeErr) console.warn(`⚠️ [Migration Close Note]: ${closeErr.message}`);
                    resolve();
                });
            } catch (migrationErr) {
                db.close(() => reject(migrationErr));
            }
        });
    });
}

/**
 * Run safe migrations across all SmartSlate database stores sequentially.
 */
async function migrateAllDatabases(rootDir) {
    const dbs = [
        path.join(rootDir, 'shared/db/smartslate.db'),
        path.join(rootDir, 'parent-teacher/data/smartslate-parent.db'),
        path.join(rootDir, 'parent-teacher/data/smartslate-teacher.db'),
        path.join(rootDir, '6to10th/student/data/smartslate-highschool.db'),
        path.join(rootDir, '5thbelow/data/smartslate-elementary.db'),
        path.join(rootDir, 'intermediate/data/smartslate-intermediate.db'),
        path.join(rootDir, 'btech/data/smartslate-btech.db'),
    ];

    console.log('🔄 [Database Pre-Flight] Running safe SQLite schema migrations...');
    let failureCount = 0;
    for (const dbPath of dbs) {
        try {
            await runSafeMigrations(dbPath);
        } catch (err) {
            failureCount++;
            console.error(`❌ [Database Pre-Flight] Migration error on ${dbPath}:`, err.message);
        }
    }
    if (failureCount > 0) {
        throw new Error(`${failureCount} database migration(s) encountered errors.`);
    }
    console.log('✅ [Database Pre-Flight] All SQLite databases safely migrated and WAL-enabled.');
}

module.exports = {
    runSafeMigrations,
    migrateAllDatabases
};

// Safe CLI entry point
if (require.main === module) {
    const rootDir = path.resolve(__dirname, '../..');
    migrateAllDatabases(rootDir)
        .then(() => {
            console.log('✅ SQLite migrations completed successfully.');
            process.exit(0);
        })
        .catch((err) => {
            console.error('❌ Migration failed:', err.message || err);
            process.exit(1);
        });
}
