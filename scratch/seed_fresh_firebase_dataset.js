/**
 * SMARTSLATE — COMPLETE FRESH FIREBASE & SQLITE DATASET SEEDER
 * Generates 190 Students across 19 grades (Class 1 to B.Tech 4th Year), 25 Parents, 17 Teachers,
 * Notes, Tasks, Connections, and generates F:\smartSlate\DATASET.md
 */

const https = require('https');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const API_KEY = "AIzaSyBOgNWBVqSYfMypeZS8NwRLOYpq7DY3-ls";
const PROJECT_ID = "smartslate-bd117";
const DEFAULT_PASSWORD = "SmartSlate@123";

const ROOT_DIR = path.join(__dirname, '..');
const SHARED_DB_PATH = path.join(ROOT_DIR, 'shared', 'db', 'smartslate.db');
const HIGH_SCHOOL_DB = path.join(ROOT_DIR, '6to10th', 'student', 'data', 'smartslate-highschool.db');
const INTERMEDIATE_DB = path.join(ROOT_DIR, 'intermediate', 'data', 'smartslate-intermediate.db');
const BTECH_DB = path.join(ROOT_DIR, 'btech', 'data', 'smartslate-btech.db');
const PARENT_DB = path.join(ROOT_DIR, 'parent-teacher', 'data', 'smartslate-parent.db');
const TEACHER_DB = path.join(ROOT_DIR, 'parent-teacher', 'data', 'smartslate-teacher.db');
const ELEMENTARY_DB = path.join(ROOT_DIR, '5thbelow', 'data', 'smartslate-elementary.db');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestJson(url, method, data = null, token = null, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await new Promise((resolve, reject) => {
                const urlObj = new URL(url);
                const headers = { 'Content-Type': 'application/json' };
                let postData = '';
                if (data) {
                    postData = JSON.stringify(data);
                    headers['Content-Length'] = Buffer.byteLength(postData);
                }
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const req = https.request({
                    hostname: urlObj.hostname,
                    port: 443,
                    path: urlObj.pathname + urlObj.search,
                    method: method,
                    headers: headers
                }, (res) => {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(body);
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                resolve(parsed);
                            } else {
                                reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
                            }
                        } catch (e) {
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                resolve(body);
                            } else {
                                reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                            }
                        }
                    });
                });

                req.on('error', reject);
                if (postData) req.write(postData);
                req.end();
            });
        } catch (err) {
            const isNetworkErr = err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'EAI_AGAIN' || err.message.includes('socket hang up') || err.message.includes('ECONNRESET');
            if (isNetworkErr && attempt < retries) {
                console.log(`[Network Error: ${err.message}] Retrying ${method} ${url} in 2s (attempt ${attempt}/${retries})...`);
                await sleep(2000);
                continue;
            }
            throw err;
        }
    }
}

function toFirestoreFields(obj) {
    const fields = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            fields[key] = { nullValue: null };
        } else if (typeof value === 'boolean') {
            fields[key] = { booleanValue: value };
        } else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                fields[key] = { integerValue: String(value) };
            } else {
                fields[key] = { doubleValue: value };
            }
        } else if (typeof value === 'string') {
            fields[key] = { stringValue: value };
        } else if (Array.isArray(value)) {
            fields[key] = {
                arrayValue: {
                    values: value.map(v => {
                        if (typeof v === 'string') return { stringValue: v };
                        if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
                        if (typeof v === 'object') return { mapValue: { fields: toFirestoreFields(v) } };
                        return { stringValue: String(v) };
                    })
                }
            };
        } else if (typeof value === 'object') {
            fields[key] = { mapValue: { fields: toFirestoreFields(value) } };
        }
    }
    return fields;
}

const CACHE_FILE = path.join(__dirname, 'cached_users.json');
let userCache = {};
if (fs.existsSync(CACHE_FILE)) {
    try {
        userCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch (e) {
        userCache = {};
    }
}

function saveCache() {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(userCache, null, 2), 'utf8');
}

async function getOrCreateFirebaseAuthUser(email, password = DEFAULT_PASSWORD, retries = 10) {
    // 1. Check cache first
    if (userCache[email] && userCache[email].uid) {
        try {
            const res = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, 'POST', {
                email,
                password,
                returnSecureToken: true
            });
            return { uid: res.localId, idToken: res.idToken, isNew: false };
        } catch (e) {
            // If signIn failed due to rate limit, wait
            if (e.message.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
                console.log(`[Rate limit on signIn ${email}] Waiting 20s...`);
                await sleep(20000);
            }
        }
    }

    // 2. Try signInWithPassword
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, 'POST', {
                email,
                password,
                returnSecureToken: true
            });
            userCache[email] = { uid: res.localId, email };
            saveCache();
            return { uid: res.localId, idToken: res.idToken, isNew: false };
        } catch (err) {
            if (err.message.includes('EMAIL_NOT_FOUND') || err.message.includes('INVALID_PASSWORD') || err.message.includes('INVALID_LOGIN_CREDENTIALS')) {
                // Try signup
                try {
                    const res = await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, 'POST', {
                        email,
                        password,
                        returnSecureToken: true
                    });
                    userCache[email] = { uid: res.localId, email };
                    saveCache();
                    return { uid: res.localId, idToken: res.idToken, isNew: true };
                } catch (signUpErr) {
                    if (signUpErr.message.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
                        const backoff = 25000 + (attempt * 5000);
                        console.log(`[Rate Limit on ${email}] Waiting ${backoff / 1000}s (attempt ${attempt}/${retries})...`);
                        await sleep(backoff);
                        continue;
                    }
                    if (signUpErr.message.includes('EMAIL_EXISTS')) {
                        await sleep(2000);
                        continue;
                    }
                    throw signUpErr;
                }
            } else if (err.message.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
                const backoff = 25000 + (attempt * 5000);
                console.log(`[Rate Limit on ${email}] Waiting ${backoff / 1000}s (attempt ${attempt}/${retries})...`);
                await sleep(backoff);
                continue;
            } else {
                throw err;
            }
        }
    }
    throw new Error(`Failed to acquire Auth token for ${email} after ${retries} attempts.`);
}

async function writeFirestoreDoc(docPath, data, token) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
    const fields = toFirestoreFields(data);
    return await requestJson(url, 'PATCH', { fields }, token);
}

// 19 Grades Definitions
const GRADES = [
    { gradeName: 'Class 1', classCode: '1', level: 'primary', portal: '5thbelow', school: 'SmartSlate Primary School' },
    { gradeName: 'Class 2', classCode: '2', level: 'primary', portal: '5thbelow', school: 'SmartSlate Primary School' },
    { gradeName: 'Class 3', classCode: '3', level: 'primary', portal: '5thbelow', school: 'SmartSlate Primary School' },
    { gradeName: 'Class 4', classCode: '4', level: 'primary', portal: '5thbelow', school: 'SmartSlate Primary School' },
    { gradeName: 'Class 5', classCode: '5', level: 'primary', portal: '5thbelow', school: 'SmartSlate Primary School' },
    { gradeName: 'Class 6', classCode: '6', level: 'secondary', portal: '6to10th', school: 'SmartSlate High School' },
    { gradeName: 'Class 7', classCode: '7', level: 'secondary', portal: '6to10th', school: 'SmartSlate High School' },
    { gradeName: 'Class 8', classCode: '8', level: 'secondary', portal: '6to10th', school: 'SmartSlate High School' },
    { gradeName: 'Class 9', classCode: '9', level: 'secondary', portal: '6to10th', school: 'SmartSlate High School' },
    { gradeName: 'Class 10', classCode: '10', level: 'secondary', portal: '6to10th', school: 'SmartSlate High School' },
    { gradeName: 'Intermediate 1st Year', classCode: '11', level: 'intermediate', portal: 'intermediate', school: 'SmartSlate Junior College' },
    { gradeName: 'Intermediate 2nd Year', classCode: '12', level: 'intermediate', portal: 'intermediate', school: 'SmartSlate Junior College' },
    { gradeName: 'Diploma 1st Year', classCode: 'D1', level: 'diploma', portal: 'intermediate', school: 'SmartSlate Polytechnic Institute' },
    { gradeName: 'Diploma 2nd Year', classCode: 'D2', level: 'diploma', portal: 'intermediate', school: 'SmartSlate Polytechnic Institute' },
    { gradeName: 'Diploma 3rd Year', classCode: 'D3', level: 'diploma', portal: 'intermediate', school: 'SmartSlate Polytechnic Institute' },
    { gradeName: 'B.Tech 1st Year', classCode: 'B1', level: 'btech', portal: 'btech', school: 'SmartSlate Institute of Technology' },
    { gradeName: 'B.Tech 2nd Year', classCode: 'B2', level: 'btech', portal: 'btech', school: 'SmartSlate Institute of Technology' },
    { gradeName: 'B.Tech 3rd Year', classCode: 'B3', level: 'btech', portal: 'btech', school: 'SmartSlate Institute of Technology' },
    { gradeName: 'B.Tech 4th Year', classCode: 'B4', level: 'btech', portal: 'btech', school: 'SmartSlate Institute of Technology' }
];

const FIRST_NAMES = [
    'Aarav', 'Sai', 'Daya', 'Harsha', 'Sravani', 'Lakshmi', 'Keerthana', 'Manoj',
    'Vamsi', 'Anjali', 'Kavya', 'Rohit', 'Siddharth', 'Naveen', 'Divya', 'Pavan',
    'Praneeth', 'Akhil', 'Meghana', 'Sneha', 'Charan', 'Tejaswini', 'Varun', 'Swathi',
    'Bhavana', 'Tarun', 'Ananya', 'Gautam', 'Deepika', 'Rahul', 'Niharika', 'Kiran',
    'Venkatesh', 'Deepak', 'Archana', 'Aditya', 'Rithika', 'Karthik', 'Pooja', 'Sunil'
];

const LAST_NAMES = [
    'Reddy', 'Nayak', 'Vardhan', 'Kumar', 'Krishna', 'Sharma', 'Rao', 'Varma',
    'Gupta', 'Prasad', 'Chowdary', 'Goud', 'Naidu', 'Murthy', 'Raju', 'Babu'
];

async function seedEverything() {
    console.log('\n=============================================================');
    console.log('SMARTSLATE — COMPLETE FRESH DATASET GENERATION');
    console.log('=============================================================\n');

    const createdStudents = [];
    const createdTeachers = [];
    const createdParents = [];
    const createdNotes = [];
    const createdTasks = [];
    const createdConnections = [];

    // --- STEP 1: CREATE 17 TEACHERS ---
    console.log('--- Step 1: Creating 17 Subject Teachers ---');
    const teacherDefs = [
        // Elementary
        { name: 'Srinivas Rao', email: 'teacher_telugu_elem@smartslate.test', subject: 'Telugu', gradeLevel: 'primary', classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'] },
        { name: 'Kavitha Sharma', email: 'teacher_english_elem@smartslate.test', subject: 'English', gradeLevel: 'primary', classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'] },
        { name: 'Rajesh Varma', email: 'teacher_math_elem@smartslate.test', subject: 'Mathematics', gradeLevel: 'primary', classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'] },
        { name: 'Sunitha Reddy', email: 'teacher_evs_elem@smartslate.test', subject: 'Environmental Studies', gradeLevel: 'primary', classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'] },
        // High School
        { name: 'Priya Sharma', email: 'teacher_math_hs@smartslate.test', subject: 'Mathematics', gradeLevel: 'secondary', classes: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'] },
        { name: 'Nageswara Rao', email: 'teacher_phy_hs@smartslate.test', subject: 'Physical Science', gradeLevel: 'secondary', classes: ['Class 8', 'Class 9', 'Class 10'] },
        { name: 'Radha Devi', email: 'teacher_bio_hs@smartslate.test', subject: 'Biological Science', gradeLevel: 'secondary', classes: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'] },
        { name: 'Venkatesh Babu', email: 'teacher_soc_hs@smartslate.test', subject: 'Social Studies', gradeLevel: 'secondary', classes: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'] },
        { name: 'Anuradha K', email: 'teacher_eng_hs@smartslate.test', subject: 'English', gradeLevel: 'secondary', classes: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'] },
        // Intermediate & Diploma
        { name: 'Dr. Ramana Murthy', email: 'teacher_math_inter@smartslate.test', subject: 'Mathematics (1A/1B/2A/2B)', gradeLevel: 'intermediate', classes: ['Intermediate 1st Year', 'Intermediate 2nd Year'] },
        { name: 'Dr. Sreedhar Reddy', email: 'teacher_phy_inter@smartslate.test', subject: 'Physics', gradeLevel: 'intermediate', classes: ['Intermediate 1st Year', 'Intermediate 2nd Year', 'Diploma 1st Year'] },
        { name: 'Padmavathi Rao', email: 'teacher_chem_inter@smartslate.test', subject: 'Chemistry', gradeLevel: 'intermediate', classes: ['Intermediate 1st Year', 'Intermediate 2nd Year'] },
        { name: 'Prof. Satyanarayana', email: 'teacher_circuits_dip@smartslate.test', subject: 'Circuit Theory & Electronics', gradeLevel: 'diploma', classes: ['Diploma 1st Year', 'Diploma 2nd Year', 'Diploma 3rd Year'] },
        // B.Tech
        { name: 'Dr. Suresh Varma', email: 'teacher_dsa_btech@smartslate.test', subject: 'Data Structures & Algorithms', gradeLevel: 'btech', classes: ['B.Tech 1st Year', 'B.Tech 2nd Year'] },
        { name: 'Prof. Deepa Nair', email: 'teacher_dbms_btech@smartslate.test', subject: 'Database Management Systems', gradeLevel: 'btech', classes: ['B.Tech 2nd Year', 'B.Tech 3rd Year'] },
        { name: 'Dr. Anand Kumar', email: 'teacher_os_btech@smartslate.test', subject: 'Operating Systems & Networks', gradeLevel: 'btech', classes: ['B.Tech 2nd Year', 'B.Tech 3rd Year'] },
        { name: 'Prof. Harish Chandra', email: 'teacher_ai_btech@smartslate.test', subject: 'AI & Web Architectures', gradeLevel: 'btech', classes: ['B.Tech 3rd Year', 'B.Tech 4th Year'] }
    ];

    for (let i = 0; i < teacherDefs.length; i++) {
        const def = teacherDefs[i];
        const auth = await getOrCreateFirebaseAuthUser(def.email, DEFAULT_PASSWORD);
        const cleanName = def.name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 5);
        const cleanSub = def.subject.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4);
        const teacherCode = `TCH-${cleanName}-${cleanSub}-${String(i + 1).padStart(2, '0')}`;

        const payload = {
            uid: auth.uid,
            name: def.name,
            email: def.email,
            teacherCode: teacherCode,
            subject: def.subject,
            classes: def.classes,
            educationLevel: def.gradeLevel,
            schoolName: 'SmartSlate Educational Institutions',
            createdAt: new Date().toISOString()
        };

        await writeFirestoreDoc(`teachers/${auth.uid}`, payload, auth.idToken);
        createdTeachers.push({ ...payload, password: DEFAULT_PASSWORD });
        console.log(`[Teacher Created] ${def.name} | ${teacherCode} | ${def.email}`);
        await sleep(60);
    }

    // --- STEP 2: CREATE 25 PARENTS (MULTI-CHILD CONFIG) ---
    console.log('\n--- Step 2: Creating 25 Parents ---');
    const parentDefs = [
        { name: 'Ramesh Kumar', email: 'parent_ramesh@smartslate.test', phone: '+91 98480 11001' },
        { name: 'Suresh Reddy', email: 'parent_suresh@smartslate.test', phone: '+91 98480 11002' },
        { name: 'Lakshmi Devi', email: 'parent_lakshmi@smartslate.test', phone: '+91 98480 11003' },
        { name: 'Venkat Rao', email: 'parent_venkat@smartslate.test', phone: '+91 98480 11004' },
        { name: 'Rajesh Varma', email: 'parent_rajesh@smartslate.test', phone: '+91 98480 11005' },
        { name: 'Radhika Krishna', email: 'parent_radhika@smartslate.test', phone: '+91 98480 11006' },
        { name: 'Srinivasa Murthy', email: 'parent_srinivas@smartslate.test', phone: '+91 98480 11007' },
        { name: 'Padma Goud', email: 'parent_padma@smartslate.test', phone: '+91 98480 11008' },
        { name: 'Chandra Sekhar', email: 'parent_chandra@smartslate.test', phone: '+91 98480 11009' },
        { name: 'Kalyani Naidu', email: 'parent_kalyani@smartslate.test', phone: '+91 98480 11010' },
        { name: 'Bhadraiah Nayak', email: 'parent_bhadraiah@smartslate.test', phone: '+91 98480 11011' },
        { name: 'Anuradha Chowdary', email: 'parent_anuradha@smartslate.test', phone: '+91 98480 11012' },
        { name: 'Ravi Teja Sharma', email: 'parent_raviteja@smartslate.test', phone: '+91 98480 11013' },
        { name: 'Sita Maha Lakshmi', email: 'parent_sitalakshmi@smartslate.test', phone: '+91 98480 11014' },
        { name: 'Govind Raju', email: 'parent_govind@smartslate.test', phone: '+91 98480 11015' },
        { name: 'Nirmala Devi', email: 'parent_nirmala@smartslate.test', phone: '+91 98480 11016' },
        { name: 'Mohan Babu', email: 'parent_mohan@smartslate.test', phone: '+91 98480 11017' },
        { name: 'Usha Rani', email: 'parent_usha@smartslate.test', phone: '+91 98480 11018' },
        { name: 'Vidyasagar Rao', email: 'parent_vidyasagar@smartslate.test', phone: '+91 98480 11019' },
        { name: 'Sarada Kumari', email: 'parent_sarada@smartslate.test', phone: '+91 98480 11020' },
        { name: 'Prasad Varma', email: 'parent_prasad@smartslate.test', phone: '+91 98480 11021' },
        { name: 'Lalitha Prasad', email: 'parent_lalitha@smartslate.test', phone: '+91 98480 11022' },
        { name: 'Satish Kumar', email: 'parent_satish@smartslate.test', phone: '+91 98480 11023' },
        { name: 'Gayatri Devi', email: 'parent_gayatri@smartslate.test', phone: '+91 98480 11024' },
        { name: 'Appa Rao', email: 'parent_apparao@smartslate.test', phone: '+91 98480 11025' }
    ];

    for (let i = 0; i < parentDefs.length; i++) {
        const def = parentDefs[i];
        const auth = await getOrCreateFirebaseAuthUser(def.email, DEFAULT_PASSWORD);
        const cleanName = def.name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 5);
        const parentCode = `PAR-${cleanName}-${String(i + 101).padStart(3, '0')}`;

        const payload = {
            uid: auth.uid,
            name: def.name,
            email: def.email,
            phone: def.phone,
            parentCode: parentCode,
            createdAt: new Date().toISOString()
        };

        await writeFirestoreDoc(`parents/${auth.uid}`, payload, auth.idToken);
        createdParents.push({ ...payload, password: DEFAULT_PASSWORD });
        console.log(`[Parent Created] ${def.name} | ${parentCode} | ${def.email}`);
        await sleep(60);
    }

    // --- STEP 3: CREATE 190 STUDENTS (10 PER GRADE ACROSS 19 GRADES) ---
    console.log('\n--- Step 3: Creating 190 Students across 19 Grades ---');
    let studentGlobalIndex = 1;

    for (let g = 0; g < GRADES.length; g++) {
        const grade = GRADES[g];
        console.log(`\n>> Seeding ${grade.gradeName} (${grade.level})`);

        for (let s = 1; s <= 10; s++) {
            const section = s <= 5 ? 'A' : 'B';
            const fName = FIRST_NAMES[(studentGlobalIndex * 7 + s) % FIRST_NAMES.length];
            const lName = LAST_NAMES[(studentGlobalIndex * 5 + g) % LAST_NAMES.length];
            const fullName = `${fName} ${lName}`;
            const email = `student_${String(studentGlobalIndex).padStart(3, '0')}@smartslate.test`;

            const auth = await getOrCreateFirebaseAuthUser(email, DEFAULT_PASSWORD);
            const cleanName = fName.toUpperCase().substring(0, 4);
            const classShort = grade.classCode.substring(0, 3);
            const studentCode = `STU-${cleanName}${classShort}${section}-${String(10 + s)}`;

            // Assign Parent (Multi-child round-robin across the 25 parents)
            const parent = createdParents[(studentGlobalIndex - 1) % createdParents.length];

            // Assigned Teachers for this Grade
            const matchedTeachers = createdTeachers.filter(t => t.classes.includes(grade.gradeName));
            const teacherIds = matchedTeachers.map(t => t.teacherCode);

            const studentPayload = {
                uid: auth.uid,
                studentId: studentCode,
                studentCode: studentCode,
                name: fullName,
                email: email,
                class: grade.classCode,
                className: grade.gradeName,
                section: section,
                educationLevel: grade.level,
                institution: grade.school,
                schoolName: grade.school,
                parentIds: [parent.uid],
                parentCode: parent.parentCode,
                parentName: parent.name,
                teacherIds: teacherIds,
                createdAt: new Date().toISOString()
            };

            // Write student document under students/{uid}
            await writeFirestoreDoc(`students/${auth.uid}`, studentPayload, auth.idToken);

            // Create Notes for subset of students (s=1,4,6,9 get 2-3 notes, s=2,7 get 1 note, others 0)
            const noteCount = (s === 1 || s === 6) ? 3 : ((s === 4 || s === 9) ? 2 : ((s === 2 || s === 7) ? 1 : 0));
            
            if (noteCount > 0) {
                for (let n = 1; n <= noteCount; n++) {
                    const noteId = `note_${n}`;
                    const subjects = matchedTeachers.length > 0 ? matchedTeachers.map(t => t.subject) : ['Core Subject'];
                    const subject = subjects[(n - 1) % subjects.length];

                    const notePayload = {
                        noteId: noteId,
                        studentUid: auth.uid,
                        title: `${subject} — Study Note ${n}`,
                        subject: subject,
                        content: `### ${subject} Key Concepts\n- Review of fundamental theories and lecture takeaways.\n- Practice problems and step-by-step solutions.\n- Important examination tips and revision formulas.`,
                        createdAt: new Date().toISOString()
                    };

                    await writeFirestoreDoc(`students/${auth.uid}/notes/${noteId}`, notePayload, auth.idToken);
                    createdNotes.push({ noteId, student: fullName, title: notePayload.title, subject });
                }
            }

            // Create Tasks for subset of students
            if (s % 2 === 1) {
                const taskId = `task_1`;
                const taskPayload = {
                    taskId: taskId,
                    title: `Assignment: ${matchedTeachers[0] ? matchedTeachers[0].subject : 'Chapter Revision'}`,
                    subject: matchedTeachers[0] ? matchedTeachers[0].subject : 'General',
                    dueDate: '2026-08-30',
                    status: s === 1 ? 'completed' : 'pending',
                    createdAt: new Date().toISOString()
                };
                await writeFirestoreDoc(`students/${auth.uid}/tasks/${taskId}`, taskPayload, auth.idToken);
                createdTasks.push({ taskId, student: fullName });
            }

            createdConnections.push({ studentCode, parentCode: parent.parentCode, parentName: parent.name, studentName: fullName });

            createdStudents.push({
                ...studentPayload,
                password: DEFAULT_PASSWORD,
                parentAssigned: parent.name,
                notesCount: noteCount
            });

            console.log(`  [Student ${studentGlobalIndex}/190] ${fullName} | ${studentCode} | Sec ${section} | ${email} | Notes: ${noteCount}`);
            studentGlobalIndex++;
            await sleep(50);
        }
    }

    // --- STEP 4: SYNC TO LOCAL SQLITE DATABASES ---
    console.log('\n--- Step 4: Synchronizing Local SQLite Databases ---');
    const dbsToSeed = [
        SHARED_DB_PATH,
        HIGH_SCHOOL_DB,
        INTERMEDIATE_DB,
        BTECH_DB,
        PARENT_DB,
        TEACHER_DB,
        ELEMENTARY_DB
    ];

    for (const dbPath of dbsToSeed) {
        if (!fs.existsSync(dbPath)) continue;
        const db = new sqlite3.Database(dbPath);

        await new Promise((resolve) => {
            db.serialize(() => {
                for (const t of createdTeachers) {
                    db.run(
                        `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, teacher_code, subject)
                         VALUES (?, ?, ?, 'password123', 'teacher', ?, ?)`,
                        [t.uid, t.name, t.email, t.teacherCode, t.subject]
                    );
                }

                for (const p of createdParents) {
                    db.run(
                        `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, parent_code)
                         VALUES (?, ?, ?, 'password123', 'parent', ?)`,
                        [p.uid, p.name, p.email, p.parentCode]
                    );
                }

                for (let i = 0; i < createdStudents.length; i++) {
                    const st = createdStudents[i];
                    db.run(
                        `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, student_code)
                         VALUES (?, ?, ?, 'password123', 'student', ?)`,
                        [st.uid, st.name, st.email, st.studentCode]
                    );
                    db.run(
                        `INSERT OR REPLACE INTO students (id, user_id, student_code)
                         VALUES (?, ?, ?)`,
                        [i + 1, st.uid, st.studentCode]
                    );
                }

                for (const c of createdConnections) {
                    db.run(
                        `INSERT OR REPLACE INTO student_parent_connections (student_uid, parent_uid, student_code, parent_code, student_name, parent_name, status)
                         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
                        [c.studentCode, c.parentCode, c.studentCode, c.parentCode, c.studentName, c.parentName]
                    );
                }
                resolve();
            });
        });
        db.close();
    }
    console.log('All local SQLite databases updated.');

    // --- STEP 5: GENERATE F:\smartSlate\DATASET.md ---
    console.log('\n--- Step 5: Generating F:\\smartSlate\\DATASET.md ---');
    let md = `# SMARTSLATE COMPREHENSIVE TEST DATASET
Generated on: ${new Date().toISOString()}
Default Password for all Accounts: \`${DEFAULT_PASSWORD}\`

================================================================================
### SUMMARY OVERVIEW
================================================================================
- **Total Students**: ${createdStudents.length} (10 students per class across 19 educational tiers)
- **Total Teachers**: ${createdTeachers.length} (Subject specialists across Primary, Secondary, Intermediate, Diploma, B.Tech)
- **Total Parents**: ${createdParents.length} (Multi-child linked families)
- **Total Notes Seeded**: ${createdNotes.length}
- **Total Tasks Seeded**: ${createdTasks.length}

================================================================================
`;

    // Group students by Class
    for (const grade of GRADES) {
        md += `\n--------------------------------------------------------------------------------\n`;
        md += `### ${grade.gradeName.toUpperCase()} (${grade.level.toUpperCase()} • ${grade.portal.toUpperCase()})\n`;
        md += `--------------------------------------------------------------------------------\n\n`;

        const gradeStudents = createdStudents.filter(s => s.className === grade.gradeName);
        for (let i = 0; i < gradeStudents.length; i++) {
            const st = gradeStudents[i];
            md += `#### Student ${String(i + 1).padStart(2, '0')}: ${st.name}\n`;
            md += `- **Email**: \`${st.email}\`\n`;
            md += `- **Password**: \`${st.password}\`\n`;
            md += `- **Student Code**: \`${st.studentCode}\`\n`;
            md += `- **Section**: ${st.section}\n`;
            md += `- **Firebase UID**: \`${st.uid}\`\n`;
            md += `- **Linked Parent**: ${st.parentAssigned} (\`${st.parentCode}\`)\n`;
            md += `- **Notes Seeded**: ${st.notesCount}\n\n`;
        }
    }

    md += `\n================================================================================\n`;
    md += `### TEACHERS DIRECTORY\n`;
    md += `================================================================================\n\n`;

    for (let i = 0; i < createdTeachers.length; i++) {
        const tch = createdTeachers[i];
        md += `#### Teacher ${String(i + 1).padStart(2, '0')}: ${tch.name}\n`;
        md += `- **Email**: \`${tch.email}\`\n`;
        md += `- **Password**: \`${tch.password}\`\n`;
        md += `- **Teacher Code**: \`${tch.teacherCode}\`\n`;
        md += `- **Subject**: ${tch.subject}\n`;
        md += `- **Grade Level**: ${tch.educationLevel}\n`;
        md += `- **Assigned Classes**: ${tch.classes.join(', ')}\n`;
        md += `- **Firebase UID**: \`${tch.uid}\`\n\n`;
    }

    md += `\n================================================================================\n`;
    md += `### PARENTS DIRECTORY (MULTI-CHILD RELATIONSHIPS)\n`;
    md += `================================================================================\n\n`;

    for (let i = 0; i < createdParents.length; i++) {
        const p = createdParents[i];
        const linkedStudents = createdStudents.filter(s => s.parentCode === p.parentCode);
        md += `#### Parent ${String(i + 1).padStart(2, '0')}: ${p.name}\n`;
        md += `- **Email**: \`${p.email}\`\n`;
        md += `- **Password**: \`${p.password}\`\n`;
        md += `- **Parent Code**: \`${p.parentCode}\`\n`;
        md += `- **Phone**: ${p.phone}\n`;
        md += `- **Firebase UID**: \`${p.uid}\`\n`;
        md += `- **Linked Children (${linkedStudents.length})**:\n`;
        linkedStudents.forEach(ch => {
            md += `  - **${ch.name}** (${ch.className} - Sec ${ch.section}) • Code: \`${ch.studentCode}\` • Email: \`${ch.email}\`\n`;
        });
        md += `\n`;
    }

    fs.writeFileSync(path.join(ROOT_DIR, 'DATASET.md'), md, 'utf8');
    console.log('DATASET.md written successfully at F:\\smartSlate\\DATASET.md.');

    return {
        totalStudents: createdStudents.length,
        totalTeachers: createdTeachers.length,
        totalParents: createdParents.length,
        totalNotes: createdNotes.length,
        totalTasks: createdTasks.length,
        gradesCount: GRADES.length
    };
}

seedEverything().then(res => {
    console.log('\n=============================================================');
    console.log('SEEDING SUMMARY:');
    console.log(JSON.stringify(res, null, 2));
    console.log('=============================================================\n');
}).catch(err => {
    console.error('Fatal error during seeding:', err);
    process.exit(1);
});
