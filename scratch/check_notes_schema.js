const path = require('path');
const { all, get } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function checkNotesSchema() {
    const tableInfo = await all("PRAGMA table_info(notes)");
    console.log('Notes table columns:', tableInfo);
    try {
        const testNotes = await all("SELECT * FROM notes WHERE book_id = 185");
        console.log('testNotes with book_id:', testNotes);
    } catch(e) {
        console.error('Query error:', e.message);
    }
}

checkNotesSchema();
