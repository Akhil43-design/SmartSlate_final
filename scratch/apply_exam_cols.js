const path = require('path');
const { run } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function applyDbCols() {
    try { await run("ALTER TABLE exams ADD COLUMN exam_type TEXT DEFAULT 'written'"); } catch(e) {}
    try { await run("ALTER TABLE exams ADD COLUMN duration_minutes INTEGER DEFAULT 60"); } catch(e) {}
    try { await run("ALTER TABLE exams ADD COLUMN start_date TEXT"); } catch(e) {}
    try { await run("ALTER TABLE exams ADD COLUMN end_date TEXT"); } catch(e) {}
    try { await run("ALTER TABLE exams ADD COLUMN answer_key TEXT"); } catch(e) {}
    console.log('Applied exam columns successfully.');
}

applyDbCols();
