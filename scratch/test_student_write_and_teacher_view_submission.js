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

async function testFullSubmissionCycle() {
    console.log('================================================================');
    console.log('SMARTSLATE — END-TO-END ASSIGNMENT SUBMISSION & GRADING TEST');
    console.log('================================================================\n');

    // 1. Teacher Login (Port 3001)
    console.log('1. Logging in Teacher Priya Sharma (teacher_math_hs@smartslate.test)...');
    const teacherLogin = await request(3001, '/api/auth/login', 'POST', {
        email: 'teacher_math_hs@smartslate.test',
        password: 'SmartSlate@123'
    });
    console.log(`  -> Teacher Login: HTTP ${teacherLogin.status}, Name: ${teacherLogin.data.user?.name}, Role: ${teacherLogin.data.user?.role}`);
    const teacherToken = teacherLogin.data.token;

    // 2. Fetch Teacher Assignments (Port 3001)
    console.log('\n2. Fetching Teacher Assignments from Teacher Portal...');
    const teacherAssignRes = await request(3001, '/api/assignments', 'GET', null, teacherToken);
    const teacherAssignments = teacherAssignRes.data.assignments || [];
    console.log(`  -> Found ${teacherAssignments.length} Teacher Assignments`);

    const targetAssignment = teacherAssignments.find(a => a.target_class === 'Class 8' || a.title?.includes('Class 8') || a.title?.includes('Linear')) || teacherAssignments[0];
    if (!targetAssignment) {
        console.error('  -> No target assignment found!');
        return;
    }
    console.log(`  -> Selected Assignment: ID #${targetAssignment.id} "${targetAssignment.title}" for ${targetAssignment.target_class || targetAssignment.class_name}`);

    // 3. Student Login (Port 3003)
    console.log('\n3. Logging in Student Pooja Krishna (student_051@smartslate.test)...');
    const studentLogin = await request(3003, '/api/auth/login', 'POST', {
        email: 'student_051@smartslate.test',
        password: 'SmartSlate@123'
    });
    console.log(`  -> Student Login: HTTP ${studentLogin.status}, Name: ${studentLogin.data.user?.name}, Code: ${studentLogin.data.user?.student_code}`);
    const studentToken = studentLogin.data.token;

    // 4. Student Submits Assignment via Digital Notebook (Port 3003)
    console.log(`\n4. Student submitting written solution for Assignment #${targetAssignment.id}...`);
    const writtenSolution = `=== MATHEMATICS HOMEWORK SOLUTION ===\nTask: ${targetAssignment.title}\n\n1. Solving equation 3x + 12 = 27:\n   3x = 27 - 12\n   3x = 15\n   x = 5 (Answer)\n\n2. Graph slope calculation:\n   m = (y2 - y1) / (x2 - x1) = (8 - 2) / (4 - 1) = 6 / 3 = 2.\n\nWork verified and completed in SmartSlate Digital Notebook.`;

    const submitRes = await request(3003, `/api/assignments/${targetAssignment.id}/submit`, 'POST', {
        content: writtenSolution
    }, studentToken);
    console.log(`  -> Submission Response: HTTP ${submitRes.status}`, submitRes.data);

    // 5. Teacher checks Submissions on Teacher Dashboard (Port 3001)
    console.log(`\n5. Teacher viewing submissions for Assignment #${targetAssignment.id} on Teacher Dashboard...`);
    const submissionsRes = await request(3001, `/api/assignments/${targetAssignment.id}/submissions`, 'GET', null, teacherToken);
    console.log(`  -> Submissions Response: HTTP ${submissionsRes.status}`);
    const submissionsList = submissionsRes.data.submissions || [];
    console.log(`  -> Total Submissions Received: ${submissionsList.length}`);
    
    submissionsList.forEach((sub, idx) => {
        console.log(`     #${idx + 1} Student: "${sub.student_name}" (${sub.student_code}) | Status: ${sub.status} | Submitted: ${sub.submitted_at}`);
        console.log(`        Content Preview: "${sub.content.substring(0, 75)}..."`);
    });

    const submittedItem = submissionsList.find(s => s.assignment_id === targetAssignment.id);
    const hasSubmission = Boolean(submittedItem);
    console.log(`  -> Submission found on Teacher Dashboard: ${hasSubmission ? 'YES (PASS ✓)' : 'NO (FAIL ✗)'}`);

    if (submittedItem) {
        // 6. Teacher grades the submission
        console.log(`\n6. Teacher grading submission #${submittedItem.id}...`);
        const gradeRes = await request(3001, `/api/assignments/grade/${submittedItem.id}`, 'POST', {
            grade: '19/20',
            feedback: 'Excellent step-by-step algebra solution! Very neat work.'
        }, teacherToken);
        console.log(`  -> Grading Response: HTTP ${gradeRes.status}`, gradeRes.data);

        // 7. Student checks updated status
        console.log('\n7. Student verifying evaluation & marks in Student Portal...');
        const studentTasksRes = await request(3003, '/api/assignments', 'GET', null, studentToken);
        const studentTasks = studentTasksRes.data.assignments || [];
        const evaluatedTask = studentTasks.find(t => t.id === targetAssignment.id);
        console.log(`  -> Student Task Status: ${evaluatedTask?.submission_status}`);
        console.log(`  -> Student Received Grade: ${evaluatedTask?.grade}`);
        console.log(`  -> Student Received Feedback: "${evaluatedTask?.feedback}"`);
        
        const isGraded = evaluatedTask?.submission_status === 'graded' || evaluatedTask?.grade === '19/20';
        console.log(`  -> End-to-End Cycle Completed: ${isGraded ? 'PASS ✓' : 'FAIL ✗'}`);
    }

    console.log('\n================================================================');
    console.log('FINAL VERIFICATION SUMMARY:');
    console.log(`Student submission accepted: ${submitRes.status === 200 ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`Teacher visible submissions: ${hasSubmission ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log('================================================================\n');
}

testFullSubmissionCycle();
