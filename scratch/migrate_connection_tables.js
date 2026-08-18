const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbs = [
    path.resolve('F:/smartSlate/shared/db/smartslate.db'),
    path.resolve('F:/smartSlate/6to10th/student/data/smartslate-highschool.db'),
    path.resolve('F:/smartSlate/intermediate/data/smartslate-intermediate.db'),
    path.resolve('F:/smartSlate/btech/data/smartslate-btech.db'),
    path.resolve('F:/smartSlate/parent-teacher/data/smartslate-parent.db'),
    path.resolve('F:/smartSlate/parent-teacher/data/smartslate-teacher.db'),
    path.resolve('F:/smartSlate/5thbelow/data/smartslate-elementary.db')
];

const schemaSql = `
CREATE TABLE IF NOT EXISTS student_parent_connections (
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
);

CREATE TABLE IF NOT EXISTS student_teacher_connections (
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
);
`;

async function migrateDb(dbPath) {
    if (!fs.existsSync(dbPath)) {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) return resolve({ dbPath, error: err.message });
            
            db.exec(schemaSql, (err) => {
                if (err) console.warn('Schema exec warning for', dbPath, err.message);
                
                db.run("ALTER TABLE users ADD COLUMN parent_code TEXT", () => {});
                db.run("ALTER TABLE users ADD COLUMN teacher_code TEXT", () => {});
                db.run("ALTER TABLE users ADD COLUMN subject TEXT", () => {});
                db.run("ALTER TABLE users ADD COLUMN student_code TEXT", () => {});
                db.run("ALTER TABLE students ADD COLUMN parent_ids TEXT", () => {});
                db.run("ALTER TABLE students ADD COLUMN teacher_ids TEXT", () => {});
                db.run("ALTER TABLE teachers ADD COLUMN teacher_code TEXT", () => {});
                db.run("ALTER TABLE teachers ADD COLUMN subject TEXT", () => {});
                db.run("ALTER TABLE sync_queue ADD COLUMN firebase_uid TEXT", () => {});
                db.run("ALTER TABLE sync_queue ADD COLUMN entity_type TEXT", () => {});
                db.run("ALTER TABLE sync_queue ADD COLUMN entity_id TEXT", () => {});
                
                db.close(() => {
                    console.log('Migrated DB successfully:', dbPath);
                    resolve({ dbPath, success: true });
                });
            });
        });
    });
}

async function run() {
    console.log('Running migrations on all SQLite databases...');
    for (const d of dbs) {
        await migrateDb(d);
    }
    console.log('All migrations completed!');
}

run();
