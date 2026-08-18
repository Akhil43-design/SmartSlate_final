const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const SHARED_DB_PATH = path.join(__dirname, '..', 'shared', 'db', 'smartslate.db');

async function syncSqliteUsers() {
    const passwordHash = await bcrypt.hash("SmartSlate@123", 10);
    const db = new sqlite3.Database(SHARED_DB_PATH);

    const usersToUpdate = [
        { email: 'parent_ramesh@smartslate.test', name: 'Ramesh Kumar', role: 'parent', parent_code: 'PAR-RAMES-101' },
        { email: 'parent_suresh@smartslate.test', name: 'Suresh Reddy', role: 'parent', parent_code: 'PAR-SURES-102' },
        { email: 'parent_lakshmi@smartslate.test', name: 'Lakshmi Devi', role: 'parent', parent_code: 'PAR-LAKSH-103' },
        { email: 'teacher_math_hs@smartslate.test', name: 'Priya Sharma', role: 'teacher', teacher_code: 'TCH-PRIYA-MATH-05', subject: 'Mathematics' },
        { email: 'teacher_phy_hs@smartslate.test', name: 'Nageswara Rao', role: 'teacher', teacher_code: 'TCH-NAGES-PHYS-06', subject: 'Physical Science' },
        { email: 'teacher_math_elem@smartslate.test', name: 'Rajesh Varma', role: 'teacher', teacher_code: 'TCH-RAJES-MATH-03', subject: 'Mathematics' },
        { email: 'teacher_dsa_btech@smartslate.test', name: 'Dr. Suresh Varma', role: 'teacher', teacher_code: 'TCH-DRSUR-DATA-14', subject: 'Data Structures & Algorithms' },
        { email: 'student_151@smartslate.test', name: 'Meghana Vardhan', role: 'student', student_code: 'STU-MEGHB1A-11' }
    ];

    for (const u of usersToUpdate) {
        await new Promise((resolve, reject) => {
            db.get("SELECT id FROM users WHERE email = ?", [u.email], (err, existing) => {
                if (err) return reject(err);
                if (existing) {
                    db.run(
                        `UPDATE users SET name = ?, password_hash = ?, role = ?, teacher_code = ?, parent_code = ?, student_code = ?, subject = ?
                         WHERE id = ?`,
                        [u.name, passwordHash, u.role, u.teacher_code || null, u.parent_code || null, u.student_code || null, u.subject || 'Mathematics', existing.id],
                        (updateErr) => {
                            if (updateErr) reject(updateErr);
                            else {
                                console.log(`[UPDATED] User ${u.email} (ID: ${existing.id})`);
                                resolve();
                            }
                        }
                    );
                } else {
                    db.run(
                        `INSERT INTO users (name, email, password_hash, role, teacher_code, parent_code, student_code, subject)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [u.name, u.email, passwordHash, u.role, u.teacher_code || null, u.parent_code || null, u.student_code || null, u.subject || 'Mathematics'],
                        function(insertErr) {
                            if (insertErr) reject(insertErr);
                            else {
                                console.log(`[INSERTED] User ${u.email} (ID: ${this.lastID})`);
                                resolve();
                            }
                        }
                    );
                }
            });
        });
    }

    db.close();
    console.log('SQLite users successfully synced with bcrypt hashes for SmartSlate@123!');
}

syncSqliteUsers().catch(console.error);
