const path = require('path');
const syncManager = require(path.resolve(__dirname, '../shared/services/syncManager.js'));
async function test() {
    const res = await syncManager.uploadEntityToCloud('book', 'test_book_123', 'upsert', { title: 'Test Book', subject: 'Math', cover_style: 'slate' }, 'test_student_123');
    console.log('Result:', res);
}
test();
