const sqlite3 = require('sqlite3').verbose();

async function migrate(dbPath, name) {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error(name, 'DB open error:', err.message);
        return resolve();
      }

      const run = (sql) => new Promise((res) => {
        db.run(sql, (e) => {
          if (e && !e.message.includes('duplicate column')) {
            console.log(`[${name}] ${sql.substring(0, 45)}... => ${e.message}`);
          }
          res();
        });
      });

      await run("ALTER TABLE notes ADD COLUMN firebase_uid TEXT");
      await run("ALTER TABLE notes ADD COLUMN note_id TEXT");
      await run("ALTER TABLE notes ADD COLUMN rule_type TEXT DEFAULT 'ruled'");
      await run("ALTER TABLE notes ADD COLUMN drawing_data TEXT DEFAULT ''");
      await run("ALTER TABLE notes ADD COLUMN sync_status TEXT DEFAULT 'pending'");
      await run("ALTER TABLE notes ADD COLUMN deleted INTEGER DEFAULT 0");

      await run("ALTER TABLE books ADD COLUMN firebase_uid TEXT");
      await run("ALTER TABLE books ADD COLUMN student_id INTEGER");
      await run("ALTER TABLE books ADD COLUMN book_id TEXT");
      await run("ALTER TABLE books ADD COLUMN description TEXT");
      await run("ALTER TABLE books ADD COLUMN cover_style TEXT DEFAULT 'blue_linen'");
      await run("ALTER TABLE books ADD COLUMN deleted INTEGER DEFAULT 0");

      await run("ALTER TABLE students ADD COLUMN student_code TEXT");
      await run("ALTER TABLE users ADD COLUMN student_code TEXT");

      await run(`CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0
      )`);

      db.close(() => {
        console.log(`[${name}] Migration applied successfully.`);
        resolve();
      });
    });
  });
}

(async () => {
  await migrate('f:/smartSlate/intermediate/data/smartslate-intermediate.db', 'Intermediate DB');
  await migrate('f:/smartSlate/btech/data/smartslate-btech.db', 'B.Tech DB');
  await migrate('f:/smartSlate/6to10th/student/data/smartslate-highschool.db', 'HighSchool DB');
})();
