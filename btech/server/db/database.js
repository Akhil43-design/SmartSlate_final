const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'smartslate-btech.db');
const schemaPath = path.join(__dirname, '../../../shared/db/schema.sql');

const { runSafeMigrations } = require('../../../shared/db/migrate');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[SQLite B.Tech] Error opening database:', err.message);
    } else {
        console.log('[SQLite B.Tech] Database connected:', dbPath);
        db.run('PRAGMA foreign_keys = ON;');
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA synchronous = NORMAL;');
        db.run('PRAGMA busy_timeout = 30000;');
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

async function initDb() {
    try {
        await runSafeMigrations(dbPath);
        console.log('[SQLite B.Tech] schema initialized safely.');
    } catch (err) {
        console.error('[SQLite B.Tech] Failed to initialize schema safely:', err);
    }
}

module.exports = {
    db,
    run,
    get,
    all,
    initDb,
    dbPath
};
