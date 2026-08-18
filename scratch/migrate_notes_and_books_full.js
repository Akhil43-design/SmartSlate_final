const path = require('path');
const { run, all } = require(path.join(__dirname, '../parent-teacher/server/db/database'));

async function addNoteAndBookColumns() {
    const noteCols = [
        "ALTER TABLE notes ADD COLUMN firebase_uid TEXT",
        "ALTER TABLE notes ADD COLUMN note_id TEXT",
        "ALTER TABLE notes ADD COLUMN drawing_data TEXT",
        "ALTER TABLE notes ADD COLUMN sync_status TEXT DEFAULT 'synced'",
        "ALTER TABLE notes ADD COLUMN deleted INTEGER DEFAULT 0",
        "ALTER TABLE books ADD COLUMN firebase_uid TEXT",
        "ALTER TABLE books ADD COLUMN book_id TEXT",
        "ALTER TABLE books ADD COLUMN description TEXT",
        "ALTER TABLE books ADD COLUMN deleted INTEGER DEFAULT 0",
        "ALTER TABLE books ADD COLUMN sync_status TEXT DEFAULT 'synced'"
    ];

    for (const sql of noteCols) {
        try {
            await run(sql);
            console.log('Applied:', sql);
        } catch(e) {
            // column already exists
        }
    }

    const notesInfo = await all("PRAGMA table_info(notes)");
    console.log('Updated notes columns:', notesInfo.map(c => c.name));
    const booksInfo = await all("PRAGMA table_info(books)");
    console.log('Updated books columns:', booksInfo.map(c => c.name));
}

addNoteAndBookColumns();
