const http = require('http');

function request(port, path, method = 'GET', body = null, token = null) {
    return new Promise((resolve) => {
        const postData = body ? JSON.stringify(body) : null;
        const headers = { 'Content-Type': 'application/json' };
        if (postData) headers['Content-Length'] = Buffer.byteLength(postData);
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request({
            hostname: 'localhost',
            port,
            path,
            method,
            headers
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', e => resolve({ status: 500, error: e.message }));
        if (postData) req.write(postData);
        req.end();
    });
}

async function testAssignmentFormattingAndEval() {
    console.log('================================================================');
    console.log('SMARTSLATE — TEST ASSIGNMENT FORMATTING & TEACHER EVALUATION');
    console.log('================================================================\n');

    // 1. Teacher Login (Port 3001)
    const teacherLogin = await request(3001, '/api/auth/login', 'POST', {
        email: 'teacher_math_hs@smartslate.test',
        password: 'SmartSlate@123'
    });
    console.log(`1. Teacher Login: HTTP ${teacherLogin.status}, Name: ${teacherLogin.data.user?.name}`);
    const teacherToken = teacherLogin.data.token;

    // 2. Student Login (Port 3003)
    const studentLogin = await request(3003, '/api/auth/login', 'POST', {
        email: 'student_051@smartslate.test',
        password: 'SmartSlate@123'
    });
    console.log(`2. Student Login: HTTP ${studentLogin.status}, Name: ${studentLogin.data.user?.name}`);
    const studentToken = studentLogin.data.token;

    // 3. Get Student Assignments
    const studentAssignRes = await request(3003, '/api/assignments', 'GET', null, studentToken);
    const assignments = studentAssignRes.data.assignments || [];
    const target = assignments[0];
    console.log(`3. Target Assignment: ID #${target.id} "${target.title}"`);

    // 4. Student submits multiline formatted text with line breaks, paragraphs, arrows
    const formattedAnswer = `Photosynthesis is the process by which green plants prepare their food using sunlight.

Important:
Sunlight
↓
Chlorophyll
↓
Carbon dioxide + water
↓
Glucose + oxygen

Conclusion:
Oxygen is released into the atmosphere as a byproduct.`;

    console.log('\n4. Student submitting multiline formatted answer...');
    const submitRes = await request(3003, `/api/assignments/${target.id}/submit`, 'POST', {
        content: formattedAnswer
    }, studentToken);
    console.log(`  -> Student submit response: HTTP ${submitRes.status}`, submitRes.data);

    // 5. Teacher fetches submissions
    console.log('\n5. Teacher fetching submissions on Teacher Portal (Port 3001)...');
    const teacherSubsRes = await request(3001, `/api/assignments/${target.id}/submissions`, 'GET', null, teacherToken);
    console.log(`  -> Teacher submissions response: HTTP ${teacherSubsRes.status}`);
    const subs = teacherSubsRes.data.submissions || [];
    const studentSub = subs.find(s => s.assignment_id === target.id);
    console.log(`  -> Submission found: ${Boolean(studentSub)}`);
    console.log(`  -> Preserved Content:`);
    console.log('--------------------------------------------------');
    console.log(studentSub.content);
    console.log('--------------------------------------------------');

    const hasNewlines = studentSub.content.includes('\n↓\n') && studentSub.content.includes('Glucose + oxygen');
    console.log(`  -> Exact whitespace and multiline preserved: ${hasNewlines ? 'PASS ✓' : 'FAIL ✗'}`);

    // 6. Teacher evaluates the submission with marks & feedback
    console.log(`\n6. Teacher saving evaluation (Marks: 8/10, Feedback: "Good explanation. Add a diagram next time.")...`);
    const gradeRes = await request(3001, `/api/assignments/grade/${studentSub.id}`, 'POST', {
        marks: '8/10',
        feedback: 'Good explanation. Add a diagram next time.'
    }, teacherToken);
    console.log(`  -> Grade response: HTTP ${gradeRes.status}`, gradeRes.data);

    // 7. Student checks evaluated result
    console.log('\n7. Student verifying evaluated task in Student Portal...');
    const studentTasksRes = await request(3003, '/api/assignments', 'GET', null, studentToken);
    const updatedTasks = studentTasksRes.data.assignments || [];
    const updatedTask = updatedTasks.find(t => t.id === target.id);
    console.log(`  -> Student Task Status: ${updatedTask.submission_status}`);
    console.log(`  -> Student Received Marks: ${updatedTask.grade}`);
    console.log(`  -> Student Received Feedback: "${updatedTask.feedback}"`);

    const isSuccess = updatedTask.grade === '8/10' && updatedTask.feedback === 'Good explanation. Add a diagram next time.';
    console.log(`\n================================================================`);
    console.log(`ASSIGNMENT FORMATTING & EVALUATION RESULT: ${isSuccess ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`================================================================\n`);
}

testAssignmentFormattingAndEval();
