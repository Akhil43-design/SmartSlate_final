const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'smartslate.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening SQLite database:', err);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
        db.run('PRAGMA foreign_keys = ON;');
    }
});

// Helper functions wrapping sqlite3 callbacks in Promises
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
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schemaSql, (err) => {
            if (err) {
                console.error('Failed to initialize database schema:', err);
                return reject(err);
            }
            console.log('Database schema initialized successfully.');
            resolve();
        });
    });
}

module.exports = {
    db,
    run,
    get,
    all,
    initDb
};
