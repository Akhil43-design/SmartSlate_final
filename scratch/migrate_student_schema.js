const { db, run } = require('../shared/db/database');

async function migrate() {
    console.log('Migrating SQLite tables to support Canonical Student Profiles...');

    const columnsToAdd = [
        { table: 'users', col: 'firebase_uid', type: 'TEXT' },
        { table: 'students', col: 'firebase_uid', type: 'TEXT' },
        { table: 'students', col: 'grade', type: 'TEXT' },
        { table: 'students', col: 'class_name', type: 'TEXT' },
        { table: 'students', col: 'class_id_str', type: 'TEXT' },
        { table: 'students', col: 'education_level', type: 'TEXT' },
        { table: 'students', col: 'school_name', type: 'TEXT' }
    ];

    for (const item of columnsToAdd) {
        try {
            await run(`ALTER TABLE ${item.table} ADD COLUMN ${item.col} ${item.type}`);
            console.log(`✅ Added ${item.table}.${item.col}`);
        } catch (e) {
            // Already exists or ignore
            console.log(`ℹ️ Column ${item.table}.${item.col} already exists.`);
        }
    }

    console.log('Schema migration complete!');
}

migrate().catch(console.error);
