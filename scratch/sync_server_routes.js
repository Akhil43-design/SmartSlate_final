const fs = require('fs');
const path = require('path');

const srcAssign = path.join(__dirname, '../6to10th/student/server/routes/assignments.js');
const srcExam = path.join(__dirname, '../6to10th/student/server/routes/exams.js');

const assignTargets = [
    path.join(__dirname, '../intermediate/server/routes/assignments.js'),
    path.join(__dirname, '../intermediate/student/server/routes/assignments.js'),
    path.join(__dirname, '../btech/server/routes/assignments.js'),
    path.join(__dirname, '../btech/student/server/routes/assignments.js'),
    path.join(__dirname, '../student/server/routes/assignments.js'),
    path.join(__dirname, '../server/routes/assignments.js')
];

const examTargets = [
    path.join(__dirname, '../intermediate/server/routes/exams.js'),
    path.join(__dirname, '../intermediate/student/server/routes/exams.js'),
    path.join(__dirname, '../btech/server/routes/exams.js'),
    path.join(__dirname, '../btech/student/server/routes/exams.js'),
    path.join(__dirname, '../student/server/routes/exams.js'),
    path.join(__dirname, '../server/routes/exams.js')
];

const assignContent = fs.readFileSync(srcAssign, 'utf8');
const examContent = fs.readFileSync(srcExam, 'utf8');

assignTargets.forEach(t => {
    try {
        if (fs.existsSync(path.dirname(t))) {
            fs.writeFileSync(t, assignContent, 'utf8');
            console.log('Synced assign to:', t);
        }
    } catch(e) {}
});

examTargets.forEach(t => {
    try {
        if (fs.existsSync(path.dirname(t))) {
            fs.writeFileSync(t, examContent, 'utf8');
            console.log('Synced exam to:', t);
        }
    } catch(e) {}
});
