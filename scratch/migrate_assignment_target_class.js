const path = require('path');
const { run, all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function checkCols() {
    try {
        await run("ALTER TABLE assignments ADD COLUMN target_class TEXT;").catch(() => {});
        await run("ALTER TABLE assignments ADD COLUMN subject TEXT;").catch(() => {});
        await run("ALTER TABLE exams ADD COLUMN target_class TEXT;").catch(() => {});
        await run("ALTER TABLE exams ADD COLUMN subject TEXT;").catch(() => {});
        
        const assignCols = await all("PRAGMA table_info(assignments)");
        console.log('Assignments columns:', assignCols.map(c => c.name));

        const examCols = await all("PRAGMA table_info(exams)");
        console.log('Exams columns:', examCols.map(c => c.name));
    } catch(e) {
        console.error(e);
    }
}

checkCols();
