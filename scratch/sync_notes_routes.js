const fs = require('fs');
const path = require('path');

const srcNotes = path.join(__dirname, '../6to10th/student/server/routes/notes.js');
const noteTargets = [
    path.join(__dirname, '../intermediate/server/routes/notes.js'),
    path.join(__dirname, '../intermediate/student/server/routes/notes.js'),
    path.join(__dirname, '../btech/server/routes/notes.js'),
    path.join(__dirname, '../btech/student/server/routes/notes.js'),
    path.join(__dirname, '../student/server/routes/notes.js'),
    path.join(__dirname, '../server/routes/notes.js')
];

const content = fs.readFileSync(srcNotes, 'utf8');

noteTargets.forEach(t => {
    try {
        if (fs.existsSync(path.dirname(t))) {
            fs.writeFileSync(t, content, 'utf8');
            console.log('Synced notes to:', t);
        }
    } catch(e) {}
});
