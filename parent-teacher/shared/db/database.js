const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const candidatePaths = [
    path.resolve(__dirname, '../../../shared/db/smartslate.db'),
    path.resolve(__dirname, '../../shared/db/smartslate.db'),
    path.join(__dirname, 'smartslate.db')
];
let dbPath = candidatePaths[candidatePaths.length - 1];
for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
        dbPath = p;
        break;
    }
}
const candidateMigratePaths = [
    path.resolve(__dirname, '../../../shared/db/migrate'),
    path.resolve(__dirname, '../../shared/db/migrate'),
    path.resolve(__dirname, '../db/migrate')
];
let runSafeMigrations = () => Promise.resolve();
for (const mp of candidateMigratePaths) {
    if (fs.existsSync(mp + '.js') || fs.existsSync(mp)) {
        runSafeMigrations = require(mp).runSafeMigrations;
        break;
    }
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening Unified SmartSlate SQLite database:', err);
    } else {
        console.log('Connected to Unified SmartSlate SQLite database at:', dbPath);
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
        console.log('Unified SmartSlate database schema initialized.');
    } catch (err) {
        console.error('Failed to initialize database schema safely:', err);
    }
}

module.exports = {
    db,
    run,
    get,
    all,
    initDb
};
