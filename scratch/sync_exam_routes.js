const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../6to10th/student/server/routes/exams.js');
const targets = [
    path.join(__dirname, '../intermediate/server/routes/exams.js'),
    path.join(__dirname, '../intermediate/student/server/routes/exams.js'),
    path.join(__dirname, '../btech/server/routes/exams.js'),
    path.join(__dirname, '../btech/student/server/routes/exams.js'),
    path.join(__dirname, '../student/server/routes/exams.js'),
    path.join(__dirname, '../server/routes/exams.js')
];

const content = fs.readFileSync(srcPath, 'utf8');

targets.forEach(target => {
    try {
        const dir = path.dirname(target);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(target, content, 'utf8');
        console.log('Synced exams route to:', target);
    } catch(e) {
        console.error('Failed to sync to:', target, e.message);
    }
});
