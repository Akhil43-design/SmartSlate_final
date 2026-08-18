const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'smartslate-elementary.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[SQLite Elementary] Error opening database:', err.message);
    } else {
        console.log('[SQLite Elementary] Database initialized:', dbPath);
        db.run('PRAGMA foreign_keys = ON;');
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA synchronous = NORMAL;');
        db.run('PRAGMA busy_timeout = 5000;');
        initTables();
    }
});

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

async function initTables() {
    try {
        await run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firebase_uid TEXT UNIQUE NOT NULL,
                email TEXT,
                role TEXT DEFAULT 'student',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS student_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firebase_uid TEXT UNIQUE NOT NULL,
                student_id TEXT,
                name TEXT,
                email TEXT,
                class TEXT DEFAULT '4',
                class_name TEXT DEFAULT 'Class 4',
                education_level TEXT DEFAULT 'primary',
                section TEXT DEFAULT 'A',
                parent_student_code TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firebase_uid TEXT NOT NULL,
                book_id TEXT NOT NULL,
                title TEXT NOT NULL,
                subject TEXT,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted INTEGER DEFAULT 0,
                UNIQUE(firebase_uid, book_id)
            );
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firebase_uid TEXT NOT NULL,
                note_id TEXT NOT NULL,
                book_id TEXT,
                title TEXT,
                content TEXT,
                drawing_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted INTEGER DEFAULT 0,
                sync_status TEXT DEFAULT 'synced',
                UNIQUE(firebase_uid, note_id)
            );
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firebase_uid TEXT NOT NULL,
                task_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                subject TEXT,
                due_date TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted INTEGER DEFAULT 0,
                sync_status TEXT DEFAULT 'synced',
                UNIQUE(firebase_uid, task_id)
            );
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS sync_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firebase_uid TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                operation TEXT NOT NULL,
                payload TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                retry_count INTEGER DEFAULT 0
            );
        `);

        console.log('[SQLite Elementary] Tables initialized successfully.');
    } catch (err) {
        console.error('[SQLite Elementary] Error initializing tables:', err.message);
    }
}

module.exports = {
    db,
    run,
    get,
    all,
    dbPath
};
