const path = require('path');
const { run, all, get } = require(path.join(__dirname, '../parent-teacher/server/db/database'));
const SyncQueueManager = require(path.join(__dirname, '../shared/services/syncQueue'));

async function debugCreate() {
    try {
        console.log('Testing create assignment...');
        const class_id = 1;
        const title = 'Test Assign';
        const description = 'Test Desc';
        const due_at = '2026-08-20';
        const user_id = 5023;

        console.log('1. Inserting into assignments...');
        const result = await run(
            "INSERT INTO assignments (class_id, title, description, due_at, created_by) VALUES (?, ?, ?, ?, ?)",
            [class_id, title, description, due_at, user_id]
        );
        console.log('Inserted assignment ID:', result.id);

        console.log('2. Inserting notification...');
        const studentsInClass = await all("SELECT user_id FROM students WHERE class_id = ?", [class_id]);
        console.log('Students in class:', studentsInClass);

        console.log('3. Enqueueing to sync...');
        await SyncQueueManager.enqueue('CREATE', 'assignment', result.id, {
            class_id,
            title,
            description,
            due_at,
            created_by: user_id
        });
        console.log('Enqueued successfully!');

    } catch (e) {
        console.error('DEBUG ERROR:', e);
    }
}

debugCreate();
