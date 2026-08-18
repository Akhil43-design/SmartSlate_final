const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const src = path.join(ROOT, '6to10th', 'student', 'server', 'routes', 'exams.js');
const content = fs.readFileSync(src, 'utf8');

const targets = [
    path.join(ROOT, 'student', 'server', 'routes', 'exams.js'),
    path.join(ROOT, 'intermediate', 'server', 'routes', 'exams.js'),
    path.join(ROOT, 'intermediate', 'student', 'server', 'routes', 'exams.js'),
    path.join(ROOT, 'btech', 'server', 'routes', 'exams.js'),
    path.join(ROOT, 'btech', 'student', 'server', 'routes', 'exams.js'),
    path.join(ROOT, 'server', 'routes', 'exams.js')
];

for (const t of targets) {
    if (fs.existsSync(path.dirname(t))) {
        fs.writeFileSync(t, content, 'utf8');
        console.log('Synced to:', t);
    }
}
console.log('Done syncing exam routes');
