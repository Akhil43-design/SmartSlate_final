/* SmartSlate Parent & Teacher API Client */

const API = {
    getToken() {
        return localStorage.getItem('smartslate_pt_token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('smartslate_pt_token', token);
        } else {
            localStorage.removeItem('smartslate_pt_token');
        }
    },

    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(endpoint, config);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/signup')) {
                    this.setToken(null);
                    window.location.reload();
                }
                throw new Error(data.error || `HTTP ${response.status} Request Failed`);
            }

            return data;
        } catch (err) {
            console.error(`API Error [${endpoint}]:`, err);
            throw err;
        }
    },

    // Auth
    login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    signup(name, role, email, password) {
        return this.request('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ name, role, email, password })
        });
    },

    getCurrentUser() {
        return this.request('/api/auth/me');
    },

    logout() {
        return this.request('/api/auth/logout', { method: 'POST' });
    },

    // Parent Portal
    linkChild(studentCode) {
        return this.request('/api/parent/link', {
            method: 'POST',
            body: JSON.stringify({ studentCode })
        });
    },

    getChildren() {
        return this.request('/api/parent/children');
    },

    getProgressCard(studentId) {
        return this.request(`/api/parent/progress-card/${studentId}`);
    },

    getWebActivity(studentId) {
        return this.request(`/api/parent/web-activity/${studentId}`);
    },

    // Teacher Portal
    getTeacherClasses() {
        return this.request('/api/teacher/classes');
    },

    getClassStudents(classId) {
        return this.request(`/api/teacher/students/${classId}`);
    },

    createAssignment(class_id, title, description, due_at) {
        return this.request('/api/assignments', {
            method: 'POST',
            body: JSON.stringify({ class_id, title, description, due_at })
        });
    },

    getAssignmentSubmissions(assignmentId) {
        return this.request(`/api/assignments/${assignmentId}/submissions`);
    },

    gradeSubmission(submissionId, grade, feedback) {
        return this.request(`/api/assignments/grade/${submissionId}`, {
            method: 'POST',
            body: JSON.stringify({ grade, feedback })
        });
    },

    createExam(class_id, title, questions, duration_minutes) {
        return this.request('/api/exams', {
            method: 'POST',
            body: JSON.stringify({ class_id, title, questions, duration_minutes })
        });
    },

    getExamResults(examId) {
        return this.request(`/api/exams/${examId}/results`);
    },

    getAttendance(classId, studentId, date) {
        let url = '/api/attendance?';
        if (classId) url += `classId=${classId}&`;
        if (studentId) url += `studentId=${studentId}&`;
        if (date) url += `date=${date}`;
        return this.request(url);
    },

    markAttendance(class_id, student_id, date, status) {
        return this.request('/api/attendance/mark', {
            method: 'POST',
            body: JSON.stringify({ class_id, student_id, date, status })
        });
    },

    // Shared APIs
    getAssignments(classId, studentId) {
        let url = '/api/assignments?';
        if (classId) url += `classId=${classId}&`;
        if (studentId) url += `studentId=${studentId}`;
        return this.request(url);
    },

    getExams(studentId) {
        let url = '/api/exams?';
        if (studentId) url += `studentId=${studentId}`;
        return this.request(url);
    },

    getChatMessages(receiverId) {
        return this.request(`/api/chat/messages?receiverId=${receiverId}`);
    },

    sendMessage(receiverId, content) {
        return this.request('/api/chat/send', {
            method: 'POST',
            body: JSON.stringify({ receiverId, content })
        });
    },

    getNotifications() {
        return this.request('/api/notifications');
    },

    markNotificationsRead() {
        return this.request('/api/notifications/read-all', { method: 'POST' });
    }
};
