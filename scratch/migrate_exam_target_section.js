const { initDb, run, all } = require('../shared/db/database');

async function migrate() {
    await initDb();
    await run("ALTER TABLE exams ADD COLUMN target_section TEXT DEFAULT 'All'").catch(() => {});
    await run("ALTER TABLE exams ADD COLUMN education_level TEXT").catch(() => {});
    await run("ALTER TABLE assignments ADD COLUMN target_section TEXT DEFAULT 'All'").catch(() => {});
    await run("ALTER TABLE assignments ADD COLUMN education_level TEXT").catch(() => {});
    
    console.log('Columns in exams:');
    console.log(await all('PRAGMA table_info(exams)'));
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
