const path = require('path');
const { run, all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function migrateSubmissions() {
    try { await run("ALTER TABLE submissions ADD COLUMN evaluated_at DATETIME"); } catch(e) {}
    try { await run("ALTER TABLE submissions ADD COLUMN evaluated_by TEXT"); } catch(e) {}
    try { await run("ALTER TABLE submissions ADD COLUMN student_uid TEXT"); } catch(e) {}
    
    // Exam submissions table check
    try {
        await run(`
            CREATE TABLE IF NOT EXISTS exam_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exam_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                student_uid TEXT,
                answers TEXT NOT NULL,
                score REAL,
                total_marks REAL,
                status TEXT DEFAULT 'submitted',
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                evaluated_at DATETIME,
                evaluated_by TEXT,
                feedback TEXT,
                violation_count INTEGER DEFAULT 0,
                UNIQUE(exam_id, student_id)
            )
        `);
    } catch(e) {}

    // Exam violations table
    try {
        await run(`
            CREATE TABLE IF NOT EXISTS exam_violations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exam_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                student_uid TEXT,
                type TEXT NOT NULL,
                details TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch(e) {}

    console.log('Submissions & Exam tables initialized successfully.');
}

migrateSubmissions();
