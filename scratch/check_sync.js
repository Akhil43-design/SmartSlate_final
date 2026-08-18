const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const intDb = path.join(__dirname, '..', 'intermediate', 'data', 'smartslate-intermediate.db');
const db = new sqlite3.Database(intDb, (err) => {
    db.all('SELECT * FROM sync_queue', [], (err, rows) => {
        console.log(rows);
        db.close();
    });
});
