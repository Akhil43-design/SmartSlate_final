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
        let token = null;

        // Fetch current Firebase Auth ID Token dynamically if user is signed in
        if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
            const user = window.firebase.auth().currentUser;
            if (user) {
                try {
                    token = await user.getIdToken();
                } catch (e) {
                    console.warn('[API] Could not fetch Firebase ID token:', e.message);
                }
            }
        }

        if (!token) {
            token = this.getToken();
        }

        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log(`[API] Firebase token attached to request: ${endpoint}`);
        }

        const config = {
            ...options,
            headers
        };

        try {
            let response = await fetch(endpoint, config);

            // If 401 Unauthorized occurs, attempt token refresh ONCE before throwing error
            if (response.status === 401 && typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
                const user = window.firebase.auth().currentUser;
                if (user) {
                    try {
                        console.log('[API] 401 received. Refreshing Firebase Auth token...');
                        const newToken = await user.getIdToken(true);
                        config.headers['Authorization'] = `Bearer ${newToken}`;
                        response = await fetch(endpoint, config);
                    } catch (refreshErr) {
                        console.warn('[API] Token refresh retry failed:', refreshErr.message);
                    }
                }
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/signup')) {
                    this.setToken(null);
                    if (window.App && typeof window.App.navigateTo === 'function') {
                        window.App.navigateTo('auth');
                    }
                }
                throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
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

    // Exams & Assessments
    getExams() {
        return this.request('/api/exams');
    },

    getExam(id) {
        return this.request(`/api/exams/${id}`);
    },

    getExamDetail(id) {
        return this.request(`/api/exams/${id}`);
    },

    startExam(id) {
        return this.request(`/api/exams/${id}/start`, { method: 'POST' });
    },

    recordExamViolation(id, type = 'FULLSCREEN_EXIT', details = '') {
        return this.request(`/api/exams/${id}/violation`, {
            method: 'POST',
            body: JSON.stringify({ type, details })
        });
    },

    submitExam(id, answers) {
        return this.request(`/api/exams/${id}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers })
        });
    },

    saveExamDraft(id, answers) {
        return this.request(`/api/exams/${id}/draft`, {
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
    },

    // Connections (Student <-> Parent & Teacher)
    getConnections() {
        return this.request('/api/connections');
    },

    connectParent(parentCode) {
        return this.request('/api/connections/parent', {
            method: 'POST',
            body: JSON.stringify({ parentCode })
        });
    },

    connectTeacher(teacherCode) {
        return this.request('/api/connections/teacher', {
            method: 'POST',
            body: JSON.stringify({ teacherCode })
        });
    },

    getTeachers() {
        return this.request('/api/connections/teachers');
    }
};

