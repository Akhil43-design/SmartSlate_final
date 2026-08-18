const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'intermediate', 'data', 'smartslate-intermediate.db');
const db = new sqlite3.Database(dbPath, (err) => {
    db.all('SELECT * FROM students LIMIT 2', [], (err, rows) => {
        console.log(rows);
        db.close();
    });
});
