/* SmartSlate Application Core Router & Event Coordinator */

const App = {
    currentUser: null,
    currentView: 'auth',
    notifications: [],

    showToast(message, type = 'info') {
        this.toast(message, type);
    },

    async init() {
        console.log('Initializing SmartSlate Digital OS...');
        
        // Alias SocketClient to SocketManager if needed
        window.SocketClient = window.SocketManager || SocketManager;

        // Connect WebSockets
        SocketManager.init();
        this.bindGlobalSocketEvents();
        this.bindNavbarEvents();

        // Check authentication state
        const token = API.getToken();
        const loadingScreen = document.getElementById('loading-screen');

        if (token) {
            try {
                const userRes = await API.getMe();
                this.currentUser = userRes.user;
                this.loadNotifications();
            } catch (err) {
                console.warn('Session expired or invalid token. Redirecting to login.');
                API.setToken(null);
            }
        }

        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 300);
        }

        if (this.currentUser) {
            this.navigateTo(this.currentUser.role);
        } else {
            this.navigateTo('auth');
        }
    },

    bindGlobalSocketEvents() {
        SocketManager.on('notification', (data) => {
            App.toast(`🔔 Notification: ${data.message || data.title}`, 'info');
            App.loadNotifications();
        });

        SocketManager.on('note_shared', (data) => {
            App.toast(`📘 Note shared: ${data.title}`, 'success');
            App.loadNotifications();
        });
    },

    bindNavbarEvents() {
        const bellBtn = document.getElementById('btn-notif-bell');
        const notifPanel = document.getElementById('notif-panel');
        const markAllReadBtn = document.getElementById('btn-mark-all-read');
        const openSettingsBtn = document.getElementById('btn-open-settings');

        if (bellBtn && notifPanel) {
            bellBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = notifPanel.style.display === 'block';
                notifPanel.style.display = isVisible ? 'none' : 'block';
            });

            document.addEventListener('click', (e) => {
                if (!notifPanel.contains(e.target) && !bellBtn.contains(e.target)) {
                    notifPanel.style.display = 'none';
                }
            });
        }

        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', async () => {
                try {
                    await API.markAllNotificationsRead();
                    this.loadNotifications();
                } catch (err) {
                    console.error('Error marking notifications read:', err);
                }
            });
        }

        if (openSettingsBtn) {
            openSettingsBtn.addEventListener('click', () => {
                this.navigateTo('settings');
            });
        }
    },

    async loadNotifications() {
        try {
            const data = await API.getNotifications();
            this.notifications = data.notifications || [];
            this.renderNotifications();
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    },

    renderNotifications() {
        const badge = document.getElementById('notif-badge-count');
        const container = document.getElementById('notif-list-container');
        if (!badge || !container) return;

        const unreadCount = this.notifications.filter(n => !n.read_at).length;

        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }

        if (!this.notifications.length) {
            container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">No notifications yet.</p>`;
            return;
        }

        container.innerHTML = this.notifications.map(n => `
            <div class="glass-card" style="padding: 10px 14px; margin-bottom: 8px; opacity: ${n.read_at ? 0.6 : 1};">
                <div style="font-size: 13px; color: var(--text-primary); font-weight: ${n.read_at ? '500' : '700'};">${n.message}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${new Date(n.created_at).toLocaleString()}</div>
            </div>
        `).join('');
    },

    navigateTo(viewName) {
        this.currentView = viewName;

        // Hide all view sections
        document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');

        const topNavbar = document.getElementById('top-navbar');

        if (viewName === 'auth') {
            if (topNavbar) topNavbar.style.display = 'none';
            const authContainer = document.getElementById('view-auth');
            authContainer.style.display = 'block';
            AuthView.render(authContainer);
            return;
        }

        // Display Navbar for authenticated users
        if (topNavbar) {
            topNavbar.style.display = 'flex';
            this.renderNavbarLinks();
        }

        const userDisplayName = document.getElementById('user-display-name');
        if (userDisplayName && this.currentUser) {
            userDisplayName.textContent = `${this.currentUser.name} (${this.currentUser.role})`;
        }

        switch (viewName) {
            case 'student':
                const studentContainer = document.getElementById('view-student');
                studentContainer.style.display = 'block';
                StudentView.render(studentContainer);
                break;
            case 'teacher':
                const teacherContainer = document.getElementById('view-teacher');
                teacherContainer.style.display = 'block';
                TeacherView.render(teacherContainer);
                break;
            case 'parent':
                const parentContainer = document.getElementById('view-parent');
                parentContainer.style.display = 'block';
                ParentView.render(parentContainer);
                break;
            case 'settings':
                const settingsContainer = document.getElementById('view-settings');
                settingsContainer.style.display = 'block';
                SettingsView.render(settingsContainer);
                break;
            default:
                console.error(`Unknown view: ${viewName}`);
        }
    },

    renderNavbarLinks() {
        const navContainer = document.getElementById('nav-dynamic-links');
        if (!navContainer || !this.currentUser) return;

        const role = this.currentUser.role;
        let links = [];

        if (role === 'student') {
            links = [
                { id: 'student', label: 'Student Hub', icon: 'book' }
            ];
        } else if (role === 'teacher') {
            links = [
                { id: 'teacher', label: 'Teacher Portal', icon: 'assignment' }
            ];
        } else if (role === 'parent') {
            links = [
                { id: 'parent', label: 'Parent Companion', icon: 'user' }
            ];
        }

        links.push({ id: 'settings', label: 'Settings', icon: 'settings' });

        navContainer.innerHTML = links.map(link => `
            <button class="nav-link-btn ${this.currentView === link.id ? 'active' : ''}" data-view="${link.id}">
                <svg class="icon-svg"><use href="#icon-${link.icon}"/></svg>
                <span>${link.label}</span>
            </button>
        `).join('');

        navContainer.querySelectorAll('.nav-link-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetView = e.currentTarget.dataset.view;
                this.navigateTo(targetView);
            });
        });
    },

    // Modal Helper
    showModal(htmlContent) {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="glass-modal-backdrop" id="modal-backdrop">
                ${htmlContent}
            </div>
        `;
        document.getElementById('modal-backdrop').addEventListener('click', (e) => {
            if (e.target.id === 'modal-backdrop') {
                this.closeModal();
            }
        });
    },

    closeModal() {
        const container = document.getElementById('modal-container');
        container.innerHTML = '';
    },

    // Toast Notification Helper
    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;
        toastEl.innerHTML = `
            <span>${message}</span>
        `;
        container.appendChild(toastEl);

        setTimeout(() => {
            toastEl.style.opacity = '0';
            setTimeout(() => toastEl.remove(), 300);
        }, 3500);
    }
};

// Initialize Application when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
