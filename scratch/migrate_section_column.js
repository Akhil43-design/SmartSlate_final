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

async function checkAndMigrate() {
    for (const relPath of dbs) {
        const fullPath = path.join(__dirname, '..', relPath);
        const db = new sqlite3.Database(fullPath);

        await new Promise((resolve) => {
            db.all("PRAGMA table_info(classes)", (err, cols) => {
                const colNames = (cols || []).map(c => c.name);
                console.log(`[${relPath}] classes cols:`, colNames);

                if (!colNames.includes('section')) {
                    db.run("ALTER TABLE classes ADD COLUMN section TEXT DEFAULT 'A'", (altErr) => {
                        if (!altErr) console.log(`  -> Added section column to classes in ${relPath}`);
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });

        await new Promise((resolve) => {
            db.all("PRAGMA table_info(students)", (err, cols) => {
                const colNames = (cols || []).map(c => c.name);
                console.log(`[${relPath}] students cols:`, colNames);

                if (!colNames.includes('section')) {
                    db.run("ALTER TABLE students ADD COLUMN section TEXT DEFAULT 'A'", (altErr) => {
                        if (!altErr) console.log(`  -> Added section column to students in ${relPath}`);
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });

        db.close();
    }
}

checkAndMigrate().catch(console.error);
