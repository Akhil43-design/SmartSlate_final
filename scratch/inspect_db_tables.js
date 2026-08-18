const sqlite3 = require('sqlite3').verbose();
const dbs = [
  { name: 'intermediate', path: 'f:/smartSlate/intermediate/data/smartslate-intermediate.db' },
  { name: 'btech', path: 'f:/smartSlate/btech/data/smartslate-btech.db' },
  { name: 'highschool', path: 'f:/smartSlate/6to10th/student/data/smartslate-highschool.db' },
  { name: 'shared', path: 'f:/smartSlate/shared/db/smartslate.db' }
];

async function checkDb(d) {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(d.path, (err) => {
      if (err) {
        console.log(d.name, 'ERR opening:', err.message);
        return resolve();
      }
      db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) {
          console.log(d.name, 'ERR querying:', err.message);
        } else {
          console.log('=== ' + d.name + ' ===');
          (rows || []).forEach(r => {
            console.log('  [' + r.name + ']: ' + (r.sql ? r.sql.replace(/\s+/g, ' ') : ''));
          });
        }
        db.close(resolve);
      });
    });
  });
}

(async () => {
  for (const d of dbs) {
    await checkDb(d);
  }
})();
