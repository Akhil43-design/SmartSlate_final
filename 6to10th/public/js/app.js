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
        this.bindNetworkEvents();

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

    bindNetworkEvents() {
        const offlineBanner = document.getElementById('offline-banner');
        
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                if (offlineBanner) offlineBanner.style.display = 'none';
                this.toast('🟢 Back online — Syncing offline data...', 'success');
                if (window.API && API.flushOfflineQueue) {
                    API.flushOfflineQueue();
                }
            } else {
                if (offlineBanner) offlineBanner.style.display = 'flex';
                this.toast('📡 Wi-Fi Disconnected — Working offline.', 'warning');
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        if (!navigator.onLine && offlineBanner) {
            offlineBanner.style.display = 'flex';
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
        const mobileMenuBtn = document.getElementById('btn-mobile-menu');
        const drawerOverlay = document.getElementById('mobile-drawer-overlay');
        const closeDrawerBtn = document.getElementById('btn-close-drawer');

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

        if (mobileMenuBtn && drawerOverlay) {
            mobileMenuBtn.addEventListener('click', () => {
                drawerOverlay.classList.add('active');
            });
        }

        if (closeDrawerBtn && drawerOverlay) {
            closeDrawerBtn.addEventListener('click', () => {
                drawerOverlay.classList.remove('active');
            });
        }

        if (drawerOverlay) {
            drawerOverlay.addEventListener('click', (e) => {
                if (e.target === drawerOverlay) {
                    drawerOverlay.classList.remove('active');
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

        // Close mobile drawer if open
        const drawerOverlay = document.getElementById('mobile-drawer-overlay');
        if (drawerOverlay) drawerOverlay.classList.remove('active');

        // Hide all view sections
        document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');

        const topNavbar = document.getElementById('top-navbar');
        const bottomNav = document.getElementById('bottom-nav-bar');

        if (viewName === 'auth') {
            if (topNavbar) topNavbar.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
            const authContainer = document.getElementById('view-auth');
            authContainer.style.display = 'block';
            AuthView.render(authContainer);
            return;
        }

        // Display Navbar & Bottom Nav for authenticated users
        if (topNavbar) {
            topNavbar.style.display = 'flex';
        }
        if (bottomNav) {
            bottomNav.style.display = 'flex';
        }

        if (this.currentUser) {
            const userDisplayName = document.getElementById('user-display-name');
            const userDisplayRole = document.getElementById('user-display-role');
            const userRoleAvatar = document.getElementById('user-role-avatar');
            const roleTagline = document.getElementById('nav-role-tagline');

            if (userDisplayName) userDisplayName.textContent = this.currentUser.name;
            if (userDisplayRole) userDisplayRole.textContent = this.currentUser.role;
            if (userRoleAvatar) {
                userRoleAvatar.textContent = this.currentUser.role === 'student' ? '👨‍🎓' : this.currentUser.role === 'teacher' ? '👩‍🏫' : '👨‍👩‍👦';
            }
            if (roleTagline) {
                roleTagline.textContent = this.currentUser.role === 'student' ? 'Child OS' : this.currentUser.role === 'teacher' ? 'Teacher Portal' : 'Parent Companion';
            }
        }

        this.renderNavbarLinks();

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
                this.render404View();
                break;
        }
    },

    render404View() {
        const studentContainer = document.getElementById('view-student');
        studentContainer.style.display = 'block';
        studentContainer.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 60px 20px; max-width: 500px; margin: 40px auto;">
                <img src="/assets/icons/icon-error-warning.svg" style="width: 48px; height: 48px; margin-bottom: 16px;" alt="404">
                <h2>Page Not Found</h2>
                <p style="color: var(--text-secondary); margin: 12px 0 24px 0;">The page or section you requested is not available.</p>
                <button class="glass-btn glass-btn-primary" onclick="App.navigateTo('${this.currentUser ? this.currentUser.role : 'auth'}')">Return to Dashboard</button>
            </div>
        `;
    },

    renderNavbarLinks() {
        const navContainer = document.getElementById('nav-dynamic-links');
        const drawerContainer = document.getElementById('drawer-links-container');
        const bottomNav = document.getElementById('bottom-nav-bar');
        if (!this.currentUser) return;

        const role = this.currentUser.role;
        let links = [];

        if (role === 'student') {
            links = [
                { view: 'student', tab: 'books', label: 'My Books', icon: '/assets/icons/icon-bookshelf.svg' },
                { view: 'student', tab: 'assignments', label: 'Tasks', icon: '/assets/icons/icon-assignment.svg' },
                { view: 'student', tab: 'teacher', label: 'My Teacher', icon: '/assets/icons/icon-chat-teacher.svg' },
                { view: 'student', tab: 'exams', label: 'Exams', icon: '/assets/icons/icon-exam.svg' },
                { view: 'student', tab: 'attendance', label: 'Attendance', icon: '/assets/icons/icon-attendance-chart.svg' }
            ];
        } else if (role === 'teacher') {
            links = [
                { view: 'teacher', tab: 'overview', label: 'Roster & Attendance', icon: '/assets/icons/icon-student-table.svg' },
                { view: 'teacher', tab: 'assignments', label: 'Assignments', icon: '/assets/icons/icon-assignment.svg' },
                { view: 'teacher', tab: 'exams', label: 'Exams', icon: '/assets/icons/icon-exam.svg' },
                { view: 'teacher', tab: 'announcements', label: 'Announcements', icon: '/assets/icons/icon-chat-group.svg' }
            ];
        } else if (role === 'parent') {
            links = [
                { view: 'parent', tab: 'overview', label: 'Report Card', icon: '/assets/icons/icon-progress-card.svg' },
                { view: 'parent', tab: 'attendance', label: 'Attendance', icon: '/assets/icons/icon-attendance-chart.svg' },
                { view: 'parent', tab: 'alerts', label: 'Alerts', icon: '/assets/icons/icon-notification-bell.svg' }
            ];
        }

        if (navContainer) {
            navContainer.innerHTML = links.map(link => {
                let isActive = false;
                if (role === 'student' && StudentView.activeTab === link.tab) isActive = true;
                if (role === 'teacher' && TeacherView.activeTab === link.tab) isActive = true;
                if (role === 'parent' && ParentView.activeTab === link.tab) isActive = true;

                return `
                    <button class="nav-link-btn bouncy-btn ${isActive ? 'active' : ''}" data-view="${link.view}" data-tab="${link.tab}">
                        <img src="${link.icon}" class="nav-link-icon" alt="${link.label}">
                        <span>${link.label}</span>
                    </button>
                `;
            }).join('');

            navContainer.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetView = e.currentTarget.dataset.view;
                    const targetTab = e.currentTarget.dataset.tab;

                    if (role === 'student') StudentView.activeTab = targetTab;
                    if (role === 'teacher') TeacherView.activeTab = targetTab;
                    if (role === 'parent') ParentView.activeTab = targetTab;

                    this.navigateTo(targetView);
                });
            });
        }

        if (drawerContainer) {
            drawerContainer.innerHTML = links.map(link => `
                <button class="glass-btn bouncy-btn" data-view="${link.view}" data-tab="${link.tab}" style="width: 100%; justify-content: flex-start; gap: 12px; margin-bottom: 8px;">
                    <img src="${link.icon}" style="width: 20px; height: 20px;" alt="${link.label}">
                    <span>${link.label}</span>
                </button>
            `).join('');

            drawerContainer.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetView = e.currentTarget.dataset.view;
                    const targetTab = e.currentTarget.dataset.tab;

                    if (role === 'student') StudentView.activeTab = targetTab;
                    if (role === 'teacher') TeacherView.activeTab = targetTab;
                    if (role === 'parent') ParentView.activeTab = targetTab;

                    this.navigateTo(targetView);
                });
            });
        }

        if (bottomNav) {
            const bottomItems = [
                { id: 'settings', label: 'Settings', icon: '/assets/icons/icon-settings.svg' },
                { id: 'share', label: 'Share', icon: '/assets/icons/icon-share-menu.svg' },
                { id: 'account', label: 'Account', icon: '/assets/icons/icon-account-menu.svg' }
            ];

            bottomNav.innerHTML = bottomItems.map(item => `
                <div class="bottom-nav-item ${this.currentView === item.id ? 'active' : ''}" data-action="${item.id}">
                    <img src="${item.icon}" style="width: 22px; height: 22px;" alt="${item.label}">
                    <span>${item.label}</span>
                </div>
            `).join('');

            bottomNav.querySelectorAll('.bottom-nav-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    if (action === 'settings') {
                        this.navigateTo('settings');
                    } else if (action === 'share') {
                        this.showGlobalShareModal();
                    } else if (action === 'account') {
                        this.showAccountOptionsModal();
                    }
                });
            });
        }
    },

    showGlobalShareModal() {
        this.showModal(`
            <div class="modal-card">
                <div class="modal-header">
                    <h3 class="modal-title">Share Center</h3>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px; padding: 10px 0;">
                    <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="App.closeModal(); if(App.currentUser && App.currentUser.role === 'student') StudentView.activeTab='chat'; App.navigateTo(App.currentUser.role);" style="justify-content: flex-start; padding: 14px;">
                        <img src="/assets/icons/icon-share-note.svg" style="width: 24px; height: 24px;" alt="Share Note">
                        <span>Share Notebook Page with Classmate</span>
                    </button>
                    <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="App.closeModal(); App.toast('Copied SmartSlate local kiosk link to clipboard! 📋', 'success');" style="justify-content: flex-start; padding: 14px;">
                        <img src="/assets/icons/icon-share-file.svg" style="width: 24px; height: 24px;" alt="Share Link">
                        <span>Copy Local Wi-Fi Tablet Link</span>
                    </button>
                </div>
            </div>
        `);
    },

    showAccountOptionsModal() {
        this.showModal(`
            <div class="modal-card" style="text-align: center;">
                <div class="modal-header">
                    <h3 class="modal-title">Account & Security</h3>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>
                <div style="margin: 16px 0;">
                    <div style="font-size: 48px; margin-bottom: 8px;">👤</div>
                    <h3 style="font-size: 20px; font-weight: 700;">${this.currentUser ? this.currentUser.name : 'User'}</h3>
                    <span class="glass-badge glass-badge-accent" style="text-transform: capitalize; margin-top: 4px;">${this.currentUser ? this.currentUser.role : ''}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                    <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="App.closeModal(); AuthView.selectedAccount=null; App.navigateTo('auth');">
                        <img src="/assets/icons/icon-account-select.svg" style="width: 20px; height: 20px;" alt="Switch">
                        <span>Switch Account / Lock Screen</span>
                    </button>
                    <button class="glass-btn bouncy-btn" style="color: var(--status-danger);" onclick="App.closeModal(); API.setToken(null); App.currentUser=null; App.navigateTo('auth');">
                        <img src="/assets/icons/icon-logout.svg" style="width: 20px; height: 20px;" alt="Logout">
                        <span>Log Out</span>
                    </button>
                </div>
            </div>
        `);
    },

    // Modal Helper
    showModal(htmlContent) {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="modal-overlay active" id="modal-backdrop">
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
