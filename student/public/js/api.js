/* SmartSlate Student API Client */

const API = {
    getToken() {
        return localStorage.getItem('smartslate_student_token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('smartslate_student_token', token);
        } else {
            localStorage.removeItem('smartslate_student_token');
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
            
            const method = (options.method || 'GET').toUpperCase();
            if ((!navigator.onLine || err.name === 'TypeError') && (method === 'POST' || method === 'PUT')) {
                this.queueOfflineRequest(endpoint, options);
                return { success: true, offline: true, message: 'Saved to offline queue' };
            }
            throw err;
        }
    },

    queueOfflineRequest(endpoint, options) {
        try {
            const queue = JSON.parse(localStorage.getItem('smartslate_offline_queue') || '[]');
            queue.push({ endpoint, options, timestamp: Date.now() });
            localStorage.setItem('smartslate_offline_queue', JSON.stringify(queue));
        } catch (e) {
            console.error('Failed to queue offline request:', e);
        }
    },

    async flushOfflineQueue() {
        try {
            const queue = JSON.parse(localStorage.getItem('smartslate_offline_queue') || '[]');
            if (!queue.length) return;

            localStorage.removeItem('smartslate_offline_queue');
            for (const item of queue) {
                try {
                    await this.request(item.endpoint, item.options);
                } catch (e) {
                    console.error(`Failed to flush queued request:`, e);
                }
            }
        } catch (e) {
            console.error('Failed to process offline queue:', e);
        }
    },

    // Auth
    login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    loginByPin(pin) {
        return this.request('/api/auth/login-by-pin', {
            method: 'POST',
            body: JSON.stringify({ pin })
        });
    },

    signup(data) {
        return this.request('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getProfiles() {
        return this.request('/api/auth/profiles');
    },

    getCurrentUser() {
        return this.request('/api/auth/me');
    },

    logout() {
        return this.request('/api/auth/logout', { method: 'POST' });
    },

    // Books
    getBooks() {
        return this.request('/api/books');
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

    // Notes
    getNotes(bookId) {
        return this.request(`/api/notes?bookId=${bookId}`);
    },

    getNoteHistory() {
        return this.request('/api/notes/history');
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

    saveNote(id, title, rule_type, content) {
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
    getAssignments() {
        return this.request('/api/assignments');
    },

    submitAssignment(id, content) {
        return this.request(`/api/assignments/${id}/submit`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    },

    // Exams
    getExams() {
        return this.request('/api/exams');
    },

    getExamDetail(id) {
        return this.request(`/api/exams/${id}`);
    },

    submitExam(id, answers) {
        return this.request(`/api/exams/${id}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers })
        });
    },

    // Chat
    getChatGroups() {
        return this.request('/api/chat/groups');
    },

    getChatMessages(groupId, receiverId) {
        let url = '/api/chat/messages?';
        if (groupId) url += `groupId=${groupId}`;
        if (receiverId) url += `receiverId=${receiverId}`;
        return this.request(url);
    },

    // Attendance
    getAttendance() {
        return this.request('/api/attendance');
    },

    // Notifications
    getNotifications() {
        return this.request('/api/notifications');
    },

    markNotificationsRead() {
        return this.request('/api/notifications/read-all', { method: 'POST' });
    },

    // Search
    searchWeb(query) {
        return this.request(`/api/search?q=${encodeURIComponent(query)}`);
    }
};
