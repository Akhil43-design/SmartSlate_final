const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'smartslate-intermediate.db');
const schemaPath = path.join(__dirname, '../../../shared/db/schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[SQLite Intermediate] Error opening database:', err.message);
    } else {
        console.log('[SQLite Intermediate] Database connected:', dbPath);
        db.run('PRAGMA foreign_keys = ON;');
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA synchronous = NORMAL;');
        db.run('PRAGMA busy_timeout = 5000;');
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

function initDb() {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            db.exec(schemaSql, (err) => {
                if (err) {
                    console.error('[SQLite Intermediate] Failed to run schema.sql:', err);
                } else {
                    console.log('[SQLite Intermediate] schema.sql loaded.');
                }
                // Run migrations for columns & sync_queue
                db.run("ALTER TABLE notes ADD COLUMN firebase_uid TEXT", () => {});
                db.run("ALTER TABLE notes ADD COLUMN note_id TEXT", () => {});
                db.run("ALTER TABLE notes ADD COLUMN rule_type TEXT DEFAULT 'ruled'", () => {});
                db.run("ALTER TABLE notes ADD COLUMN drawing_data TEXT DEFAULT ''", () => {});
                db.run("ALTER TABLE notes ADD COLUMN sync_status TEXT DEFAULT 'pending'", () => {});
                db.run("ALTER TABLE notes ADD COLUMN deleted INTEGER DEFAULT 0", () => {});

                db.run("ALTER TABLE books ADD COLUMN firebase_uid TEXT", () => {});
                db.run("ALTER TABLE books ADD COLUMN student_id INTEGER", () => {});
                db.run("ALTER TABLE books ADD COLUMN book_id TEXT", () => {});
                db.run("ALTER TABLE books ADD COLUMN description TEXT", () => {});
                db.run("ALTER TABLE books ADD COLUMN cover_style TEXT DEFAULT 'blue_linen'", () => {});
                db.run("ALTER TABLE books ADD COLUMN deleted INTEGER DEFAULT 0", () => {});

                db.run("ALTER TABLE students ADD COLUMN student_code TEXT", () => {});
                db.run("ALTER TABLE users ADD COLUMN student_code TEXT", () => {});

                db.run(`CREATE TABLE IF NOT EXISTS sync_queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    firebase_uid TEXT NOT NULL,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    operation TEXT NOT NULL,
                    payload TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'pending',
                    retry_count INTEGER DEFAULT 0
                )`, () => resolve());
            });
        } else {
            resolve();
        }
    });
}

module.exports = {
    db,
    run,
    get,
    all,
    initDb,
    dbPath
};
