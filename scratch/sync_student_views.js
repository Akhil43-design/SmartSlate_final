const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../6to10th/student/public/js/views/studentView.js');
const targets = [
    path.join(__dirname, '../6to10th/student/student/public/js/views/studentView.js'),
    path.join(__dirname, '../intermediate/public/js/views/studentView.js'),
    path.join(__dirname, '../intermediate/student/public/js/views/studentView.js'),
    path.join(__dirname, '../btech/public/js/views/studentView.js'),
    path.join(__dirname, '../btech/student/public/js/views/studentView.js'),
    path.join(__dirname, '../student/public/js/views/studentView.js')
];

const content = fs.readFileSync(src, 'utf8');

targets.forEach(t => {
    try {
        if (fs.existsSync(path.dirname(t))) {
            fs.writeFileSync(t, content, 'utf8');
            console.log('Synced to:', t);
        }
    } catch(e) {
        console.warn('Could not sync to:', t, e.message);
    }
});
