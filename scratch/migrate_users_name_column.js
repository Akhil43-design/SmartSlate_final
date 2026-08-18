const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbs = [
    'shared/db/smartslate.db',
    '6to10th/student/data/smartslate-highschool.db',
    'intermediate/data/smartslate-intermediate.db',
    'btech/data/smartslate-btech.db',
    'parent-teacher/data/smartslate-parent.db',
    'parent-teacher/data/smartslate-teacher.db',
    '5thbelow/data/smartslate-elementary.db'
];

async function migrateUsersName() {
    for (const relPath of dbs) {
        const fullPath = path.join(__dirname, '..', relPath);
        const db = new sqlite3.Database(fullPath);

        await new Promise((resolve) => {
            db.all("PRAGMA table_info(users)", (err, cols) => {
                const colNames = (cols || []).map(c => c.name);
                console.log(`[${relPath}] users cols:`, colNames);

                const toAdd = [];
                if (!colNames.includes('name')) toAdd.push("ALTER TABLE users ADD COLUMN name TEXT DEFAULT 'Student'");
                if (!colNames.includes('student_code')) toAdd.push("ALTER TABLE users ADD COLUMN student_code TEXT");
                if (!colNames.includes('teacher_code')) toAdd.push("ALTER TABLE users ADD COLUMN teacher_code TEXT");
                if (!colNames.includes('parent_code')) toAdd.push("ALTER TABLE users ADD COLUMN parent_code TEXT");
                if (!colNames.includes('subject')) toAdd.push("ALTER TABLE users ADD COLUMN subject TEXT DEFAULT 'Mathematics'");
                if (!colNames.includes('password_hash')) toAdd.push("ALTER TABLE users ADD COLUMN password_hash TEXT");

                let idx = 0;
                function runNext() {
                    if (idx >= toAdd.length) return resolve();
                    db.run(toAdd[idx], (addErr) => {
                        if (!addErr) console.log(`  -> Executed: ${toAdd[idx]} in ${relPath}`);
                        idx++;
                        runNext();
                    });
                }
                runNext();
            });
        });

        db.close();
    }
}

migrateUsersName().catch(console.error);
