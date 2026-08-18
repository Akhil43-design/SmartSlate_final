/**
 * SYNC COMPLETE STUDENT DATASET (CLASS 1 -> B.TECH) TO SHARED SQLITE DATABASE
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const SHARED_DB_PATH = path.join(__dirname, '..', 'shared', 'db', 'smartslate.db');

async function syncDatasetToSqlite() {
    const passwordHash = await bcrypt.hash("SmartSlate@123", 10);
    const db = new sqlite3.Database(SHARED_DB_PATH);

    // Let's create all education levels
    const studentsToSeed = [
        // Class 1
        { name: 'Vamsi Krishna', code: 'STU-VAMS1A-11', class: 'Class 1', section: 'A', level: 'primary', email: 'student_001@smartslate.test' },
        { name: 'Daya Nayak', code: 'STU-DAYA1A-12', class: 'Class 1', section: 'A', level: 'primary', email: 'student_002@smartslate.test' },
        // Class 2
        { name: 'Ravi Teja', code: 'STU-RAVI2A-11', class: 'Class 2', section: 'A', level: 'primary', email: 'student_011@smartslate.test' },
        // Class 3
        { name: 'Kavya Sree', code: 'STU-KAVY3A-11', class: 'Class 3', section: 'A', level: 'primary', email: 'student_021@smartslate.test' },
        // Class 4
        { name: 'Siddharth Rao', code: 'STU-SIDD4A-11', class: 'Class 4', section: 'A', level: 'primary', email: 'student_031@smartslate.test' },
        // Class 5
        { name: 'Vamsi Teja', code: 'STU-VAMS5A-11', class: 'Class 5', section: 'A', level: 'primary', email: 'student_041@smartslate.test' },
        // Class 6
        { name: 'Pooja Reddy', code: 'STU-POOJ6A-11', class: 'Class 6', section: 'A', level: 'secondary', email: 'student_051@smartslate.test' },
        // Class 7
        { name: 'Aditya Kumar', code: 'STU-ADIT7A-11', class: 'Class 7', section: 'A', level: 'secondary', email: 'student_061@smartslate.test' },
        // Class 8
        { name: 'Ananya Sharma', code: 'STU-ANAN8A-11', class: 'Class 8', section: 'A', level: 'secondary', email: 'student_071@smartslate.test' },
        // Class 9
        { name: 'Karthik Varma', code: 'STU-KART9A-11', class: 'Class 9', section: 'A', level: 'secondary', email: 'student_081@smartslate.test' },
        // Class 10
        { name: 'Priya Dharshini', code: 'STU-PRIY10A-11', class: 'Class 10', section: 'A', level: 'secondary', email: 'student_091@smartslate.test' },
        // Intermediate 1st Year
        { name: 'Venkatesh Rao', code: 'STU-VENKMPC1A-11', class: 'Inter 1st Year (MPC)', section: 'A', level: 'higher_secondary', email: 'student_101@smartslate.test' },
        // Intermediate 2nd Year
        { name: 'Sai Kiran', code: 'STU-SAIKMPC2A-11', class: 'Inter 2nd Year (MPC)', section: 'A', level: 'higher_secondary', email: 'student_111@smartslate.test' },
        // Diploma 1st Year
        { name: 'Manoj Kumar', code: 'STU-MANOCME1A-11', class: 'Diploma 1st Year (CME)', section: 'A', level: 'diploma', email: 'student_121@smartslate.test' },
        // Diploma 2nd Year
        { name: 'Naveen Reddy', code: 'STU-NAVECME2A-11', class: 'Diploma 2nd Year (CME)', section: 'A', level: 'diploma', email: 'student_131@smartslate.test' },
        // Diploma 3rd Year
        { name: 'Harish Varma', code: 'STU-HARICME3A-11', class: 'Diploma 3rd Year (CME)', section: 'A', level: 'diploma', email: 'student_141@smartslate.test' },
        // B.Tech 1st Year
        { name: 'Meghana Vardhan', code: 'STU-MEGHB1A-11', class: 'B.Tech 1st Year (CSE)', section: 'A', level: 'btech', email: 'student_151@smartslate.test' },
        // B.Tech 2nd Year
        { name: 'Kiranmai Devi', code: 'STU-KIRAB2A-11', class: 'B.Tech 2nd Year (CSE)', section: 'A', level: 'btech', email: 'student_161@smartslate.test' },
        // B.Tech 3rd Year
        { name: 'Rohit Varma', code: 'STU-ROHIB3A-11', class: 'B.Tech 3rd Year (CSE)', section: 'A', level: 'btech', email: 'student_171@smartslate.test' },
        // B.Tech 4th Year
        { name: 'Anitha Rao', code: 'STU-ANITB4A-11', class: 'B.Tech 4th Year (CSE)', section: 'A', level: 'btech', email: 'student_181@smartslate.test' }
    ];

    await new Promise((resolve) => {
        db.serialize(() => {
            for (const s of studentsToSeed) {
                db.run(
                    `INSERT INTO users (name, email, password_hash, role, student_code)
                     VALUES (?, ?, ?, 'student', ?)
                     ON CONFLICT(email) DO UPDATE SET student_code = excluded.student_code, name = excluded.name`,
                    [s.name, s.email, passwordHash, s.code]
                );

                db.run(
                    `INSERT INTO students (user_id, student_code, section)
                     SELECT id, student_code, ? FROM users WHERE email = ?
                     ON CONFLICT(student_code) DO NOTHING`,
                    [s.section, s.email]
                );
            }
            resolve();
        });
    });

    db.close();
    console.log(`Successfully synced ${studentsToSeed.length} students across all education levels to SQLite!`);
}

syncDatasetToSqlite().catch(console.error);
