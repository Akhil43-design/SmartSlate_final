const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../6to10th/student/public/js/views/studentView.js');
const targets = [
    path.join(__dirname, '../intermediate/public/js/views/studentView.js'),
    path.join(__dirname, '../intermediate/student/public/js/views/studentView.js'),
    path.join(__dirname, '../btech/public/js/views/studentView.js'),
    path.join(__dirname, '../btech/student/public/js/views/studentView.js'),
    path.join(__dirname, '../student/public/js/views/studentView.js'),
    path.join(__dirname, '../public/js/views/studentView.js')
];

const content = fs.readFileSync(srcPath, 'utf8');

targets.forEach(target => {
    try {
        const dir = path.dirname(target);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(target, content, 'utf8');
        console.log('Synced studentView.js to:', target);
    } catch(e) {
        console.error('Failed to sync to:', target, e.message);
    }
});
