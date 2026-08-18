const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const STUDENT_VIEW_SOURCE = path.join(ROOT_DIR, '6to10th', 'student', 'public', 'js', 'views', 'studentView.js');
const APP_JS_SOURCE = path.join(ROOT_DIR, '6to10th', 'student', 'public', 'js', 'app.js');

const TARGET_PORTALS = [
    path.join(ROOT_DIR, '6to10th', 'student', 'student', 'public', 'js'),
    path.join(ROOT_DIR, 'intermediate', 'public', 'js'),
    path.join(ROOT_DIR, 'intermediate', 'student', 'public', 'js'),
    path.join(ROOT_DIR, 'btech', 'public', 'js'),
    path.join(ROOT_DIR, 'btech', 'student', 'public', 'js'),
    path.join(ROOT_DIR, 'student', 'public', 'js')
];

console.log('Syncing studentView.js and app.js across all student portals...');

const studentViewContent = fs.readFileSync(STUDENT_VIEW_SOURCE, 'utf8');
const appJsContent = fs.readFileSync(APP_JS_SOURCE, 'utf8');

for (const targetDir of TARGET_PORTALS) {
    if (fs.existsSync(targetDir)) {
        const viewDir = path.join(targetDir, 'views');
        if (!fs.existsSync(viewDir)) fs.mkdirSync(viewDir, { recursive: true });
        
        fs.writeFileSync(path.join(viewDir, 'studentView.js'), studentViewContent, 'utf8');
        fs.writeFileSync(path.join(targetDir, 'app.js'), appJsContent, 'utf8');
        console.log(`✅ Synced to: ${targetDir}`);
    }
}

console.log('Sync complete!');
