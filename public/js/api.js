/* SmartSlate API Client with Auto-Retry Queue for Note Auto-Saves */

const API = {
    getToken() {
        return localStorage.getItem('smartslate_token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('smartslate_token', token);
        } else {
            localStorage.removeItem('smartslate_token');
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

    getMe() {
        return this.request('/api/auth/me');
    },

    logout() {
        this.setToken(null);
        return Promise.resolve();
    },

    // Books & Notes
    getBooks(studentId) {
        const query = studentId ? `?studentId=${studentId}` : '';
        return this.request(`/api/books${query}`);
    },

    createBook(title, subject, cover_style) {
        return this.request('/api/books', {
            method: 'POST',
            body: JSON.stringify({ title, subject, cover_style })
        });
    },

    deleteBook(id) {
        return this.request(`/api/books/${id}`, { method: 'DELETE' });
    },

    getNotes(bookId, search, subject, studentId) {
        const params = new URLSearchParams();
        if (bookId) params.append('bookId', bookId);
        if (search) params.append('search', search);
        if (subject) params.append('subject', subject);
        if (studentId) params.append('studentId', studentId);
        return this.request(`/api/notes?${params.toString()}`);
    },

    getNotesHistory(studentId) {
        const query = studentId ? `?studentId=${studentId}` : '';
        return this.request(`/api/notes/history${query}`);
    },

    getSharedNotes() {
        return this.request('/api/notes/shared-with-me');
    },

    createNote(bookId, title, rule_type, content) {
        return this.request('/api/notes', {
            method: 'POST',
            body: JSON.stringify({ bookId, title, rule_type, content })
        });
    },

    updateNote(id, title, rule_type, content) {
        return this.request(`/api/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ title, rule_type, content })
        });
    },

    deleteNote(id) {
        return this.request(`/api/notes/${id}`, { method: 'DELETE' });
    },

    shareNote(id, targetStudentCode) {
        return this.request(`/api/notes/${id}/share`, {
            method: 'POST',
            body: JSON.stringify({ targetStudentCode })
        });
    },

    // Assignments
    getAssignments(classId, studentId) {
        const params = new URLSearchParams();
        if (classId) params.append('classId', classId);
        if (studentId) params.append('studentId', studentId);
        return this.request(`/api/assignments?${params.toString()}`);
    },

    createAssignment(class_id, title, description, due_at) {
        return this.request('/api/assignments', {
            method: 'POST',
            body: JSON.stringify({ class_id, title, description, due_at })
        });
    },

    submitAssignment(id, content) {
        return this.request(`/api/assignments/${id}/submit`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    },

    getAssignmentSubmissions(id) {
        return this.request(`/api/assignments/${id}/submissions`);
    },

    // Chat
    getChatGroups() {
        return this.request('/api/chat/groups');
    },

    getChatMessages(groupId, receiverId) {
        const params = new URLSearchParams();
        if (groupId) params.append('groupId', groupId);
        if (receiverId) params.append('receiverId', receiverId);
        return this.request(`/api/chat/messages?${params.toString()}`);
    },

    getDirectContacts() {
        return this.request('/api/chat/direct-contacts');
    },

    // Exams
    getExams(studentId) {
        const query = studentId ? `?studentId=${studentId}` : '';
        return this.request(`/api/exams${query}`);
    },

    getExamDetail(id) {
        return this.request(`/api/exams/${id}`);
    },

    createExam(class_id, title, questions, duration_minutes) {
        return this.request('/api/exams', {
            method: 'POST',
            body: JSON.stringify({ class_id, title, questions, duration_minutes })
        });
    },

    submitExam(id, answers) {
        return this.request(`/api/exams/${id}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers })
        });
    },

    getExamResults(id) {
        return this.request(`/api/exams/${id}/results`);
    },

    // Attendance
    getAttendance(classId, date, studentId) {
        const params = new URLSearchParams();
        if (classId) params.append('classId', classId);
        if (date) params.append('date', date);
        if (studentId) params.append('studentId', studentId);
        return this.request(`/api/attendance?${params.toString()}`);
    },

    markAttendance(class_id, date, records) {
        return this.request('/api/attendance', {
            method: 'POST',
            body: JSON.stringify({ class_id, date, records })
        });
    },

    // Notifications
    getNotifications() {
        return this.request('/api/notifications');
    },

    markNotificationRead(id) {
        return this.request(`/api/notifications/${id}/read`, { method: 'POST' });
    },

    markAllNotificationsRead() {
        return this.request('/api/notifications/read-all', { method: 'POST' });
    },

    // Safe Web Search
    searchWeb(query) {
        return this.request(`/api/search?q=${encodeURIComponent(query)}`);
    },

    // Parent
    linkChild(studentCode) {
        return this.request('/api/parent/link', {
            method: 'POST',
            body: JSON.stringify({ studentCode })
        });
    },

    getChildren() {
        return this.request('/api/parent/children');
    },

    getChildWebActivity(studentId) {
        return this.request(`/api/parent/web-activity/${studentId}`);
    },

    getProgressCard(studentId) {
        return this.request(`/api/parent/progress-card/${studentId}`);
    },

    // Teacher
    getTeacherClasses() {
        return this.request('/api/teacher/classes');
    },

    getClassStudents(classId) {
        return this.request(`/api/teacher/students/${classId}`);
    }
};
