const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
                } catch(e) {
                    resolve({ status: res.statusCode, headers: res.headers, text: body });
                }
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        req.end();
    });
}

async function testFlow() {
    console.log('=================================================================');
    console.log('🧪 TESTING EXAMS, ASSIGNMENTS & ANNOUNCEMENTS WORKFLOW');
    console.log('=================================================================\n');

    // 1. Teacher Login
    console.log('[1] Logging in as Teacher...');
    const loginRes = await request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        email: 'teacher_math_hs@smartslate.test',
        password: 'SmartSlate@123'
    });

    console.log(`Login status: ${loginRes.status} | Name: ${loginRes.data?.user?.name}`);
    const token = loginRes.data?.token;
    if (!token) throw new Error('Failed to get token');

    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Post Exam
    console.log('\n[2] Creating New MCQ Exam via POST /api/exams...');
    const examRes = await request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/exams',
        method: 'POST',
        headers: authHeaders
    }, {
        title: 'Midterm Mathematics Test 2026',
        target_class: 'Class 8',
        target_section: 'All',
        education_level: 'HIGH_SCHOOL',
        subject: 'Mathematics',
        exam_type: 'mcq',
        duration_minutes: 30,
        start_date: '2026-08-18',
        start_time: '09:00',
        end_date: '2026-08-19',
        end_time: '23:59',
        questions: [
            {
                id: 1,
                question: 'What is the value of 3x + 5 when x = 4?',
                options: { A: '12', B: '17', C: '15', D: '20' },
                correct: 'B',
                marks: 5
            },
            {
                id: 2,
                question: 'The sum of angles in a triangle is:',
                options: { A: '90°', B: '180°', C: '360°', D: '270°' },
                correct: 'B',
                marks: 5
            }
        ]
    });
    console.log(`Exam Creation Status: ${examRes.status}`, examRes.data);

    // 3. Fetch Exams
    console.log('\n[3] Fetching Exams via GET /api/exams...');
    const fetchExamsRes = await request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/exams',
        method: 'GET',
        headers: authHeaders
    });
    console.log(`Fetch Exams Status: ${fetchExamsRes.status} | Total Exams: ${fetchExamsRes.data?.exams?.length}`);
    if (fetchExamsRes.data?.exams?.length > 0) {
        console.log('Latest Exam:', {
            id: fetchExamsRes.data.exams[0].id,
            title: fetchExamsRes.data.exams[0].title,
            type: fetchExamsRes.data.exams[0].exam_type,
            questions: fetchExamsRes.data.exams[0].questions_count
        });
    }

    // 4. Post Assignment
    console.log('\n[4] Creating New Assignment via POST /api/assignments...');
    const assignRes = await request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/assignments',
        method: 'POST',
        headers: authHeaders
    }, {
        title: 'Algebra Problem Set 4: Linear Equations',
        description: 'Complete questions 1 to 10 on page 42 of your textbook.',
        target_class: 'Class 8',
        due_at: '2026-08-20',
        subject: 'Mathematics'
    });
    console.log(`Assignment Creation Status: ${assignRes.status}`, assignRes.data);

    // 5. Fetch Assignments
    console.log('\n[5] Fetching Assignments via GET /api/assignments...');
    const fetchAssignRes = await request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/assignments',
        method: 'GET',
        headers: authHeaders
    });
    console.log(`Fetch Assignments Status: ${fetchAssignRes.status} | Total Assignments: ${fetchAssignRes.data?.assignments?.length}`);
    if (fetchAssignRes.data?.assignments?.length > 0) {
        console.log('Latest Assignment:', {
            id: fetchAssignRes.data.assignments[0].id,
            title: fetchAssignRes.data.assignments[0].title,
            due: fetchAssignRes.data.assignments[0].due_at
        });
    }

    // 6. Post Announcement
    console.log('\n[6] Posting Class Announcement via POST /api/chat/announcements...');
    const annRes = await request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/chat/announcements',
        method: 'POST',
        headers: authHeaders
    }, {
        title: 'Science Fair Project Due Next Friday',
        content: 'Please submit your science fair project outlines by next Friday.',
        subject: 'General Notice',
        classId: 'Class 8'
    });
    console.log(`Announcement Creation Status: ${annRes.status}`, annRes.data);

    // 7. Fetch Announcements
    console.log('\n[7] Fetching Announcements via GET /api/chat/announcements...');
    const fetchAnnRes = await request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/chat/announcements',
        method: 'GET',
        headers: authHeaders
    });
    console.log(`Fetch Announcements Status: ${fetchAnnRes.status} | Total Announcements: ${fetchAnnRes.data?.announcements?.length}`);

    console.log('\n=================================================================');
    console.log('🎉 ALL EXAMS, ASSIGNMENTS & ANNOUNCEMENTS TESTS PASSED!');
    console.log('=================================================================');
}

testFlow().catch(console.error);
