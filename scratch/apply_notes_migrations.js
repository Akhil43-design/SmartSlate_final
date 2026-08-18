const path = require('path');
const { run } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function applyMigrations() {
    try { await run("ALTER TABLE notes ADD COLUMN deleted INTEGER DEFAULT 0"); } catch(e) {}
    try { await run("ALTER TABLE books ADD COLUMN deleted INTEGER DEFAULT 0"); } catch(e) {}
    try { await run("ALTER TABLE notes ADD COLUMN sync_status TEXT DEFAULT 'synced'"); } catch(e) {}
    try { await run("ALTER TABLE books ADD COLUMN sync_status TEXT DEFAULT 'synced'"); } catch(e) {}
    console.log('Migrations applied to smartslate.db successfully.');
}

applyMigrations();
