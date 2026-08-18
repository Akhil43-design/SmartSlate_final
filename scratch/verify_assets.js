const fs = require('fs');
const path = require('path');

const publicDir = 'f:/smartSlate/parent-teacher/public';
const filesToCheck = [
    'css/variables.css',
    'css/components.css',
    'css/styles.css',
    'shared/services/firebaseAuthService.js',
    'js/api.js',
    'js/views/authView.js',
    'js/views/parentView.js',
    'js/views/teacherView.js',
    'js/views/settingsView.js',
    'js/app.js',
    'assets/icons/icon-child-profile.svg',
    'assets/icons/icon-settings.svg',
    'assets/icons/icon-logout.svg',
    'assets/icons/icon-teacher-dashboard.svg',
    'assets/icons/icon-assignment.svg',
    'assets/icons/icon-exam.svg',
    'assets/icons/icon-student-table.svg',
    'assets/icons/icon-attendance-mark.svg',
    'assets/icons/icon-chat-group.svg',
    'assets/icons/icon-teacher.svg',
    'assets/icons/icon-notes.svg',
    'assets/icons/icon-book.svg',
    'assets/icons/icon-search-safe.svg'
];

let missing = 0;
for (const rel of filesToCheck) {
    const full = path.join(publicDir, rel);
    const exists = fs.existsSync(full);
    console.log((exists ? '✅' : '❌') + ' /' + rel);
    if (!exists) missing++;
}

console.log('\nVerification result:', missing === 0 ? 'ALL ASSETS EXIST (0 MISSING)' : `${missing} MISSING`);
