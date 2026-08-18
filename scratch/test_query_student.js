const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'shared', 'db', 'smartslate.db'));

db.all(`
    SELECT s.id, s.user_id, s.student_code, u.name as student_name, u.email as student_email, 
           COALESCE(c.name, 'Class 8') as class_name, 'A' as section, 'SmartSlate Academy' as school_name
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.student_code = 'STU-VAMS1A-11' OR u.student_code = 'STU-VAMS1A-11'
`, (err, rows) => {
    console.log('Query result for STU-VAMS1A-11:', rows);
    db.close();
});
