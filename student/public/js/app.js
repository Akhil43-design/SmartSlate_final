/* SmartSlate Student Application Controller & Router */

const App = {
    currentUser: null,
    currentView: 'auth',

    async init() {
        console.log('Initializing SmartSlate Student Application...');
        
        window.addEventListener('online', () => this.handleNetworkChange(true));
        window.addEventListener('offline', () => this.handleNetworkChange(false));

        this.setupNotifications();

        const token = API.getToken();
        if (token) {
            try {
                const res = await API.getCurrentUser();
                this.currentUser = res.user;
                SocketManager.init();
                this.navigateTo('student');
            } catch (err) {
                console.warn('Session check failed:', err);
                API.setToken(null);
                this.navigateTo('auth');
            }
        } else {
            this.navigateTo('auth');
        }

        this.hideLoadingScreen();
    },

    hideLoadingScreen() {
        const screen = document.getElementById('loading-screen');
        if (screen) {
            screen.classList.add('hidden');
        }
    },

    handleNetworkChange(isOnline) {
        const banner = document.getElementById('offline-banner');
        if (banner) {
            banner.style.display = isOnline ? 'none' : 'flex';
        }
        if (isOnline) {
            this.toast('Wi-Fi Reconnected! Syncing offline items...', 'info');
            API.flushOfflineQueue();
        } else {
            this.toast('Offline Mode Active', 'warning');
        }
    },

    navigateTo(viewName) {
        if (!this.currentUser && viewName !== 'auth') {
            viewName = 'auth';
        }

        this.currentView = viewName;
        const navbar = document.getElementById('top-navbar');

        if (viewName === 'auth') {
            if (navbar) navbar.style.display = 'none';
        } else {
            if (navbar) navbar.style.display = 'flex';
            this.updateHeaderProfile();
            this.updateNavLinks();
        }

        const sections = document.querySelectorAll('.view-section');
        sections.forEach(sec => sec.style.display = 'none');

        const targetSection = document.getElementById(`view-${viewName}`);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.renderViewContent(viewName, targetSection);
        }

        this.renderBottomNavBar();
    },

    renderViewContent(viewName, container) {
        switch (viewName) {
            case 'auth':
                AuthView.render(container);
                break;
            case 'student':
                StudentView.render(container);
                break;
            case 'settings':
                SettingsView.render(container);
                break;
        }
    },

    updateHeaderProfile() {
        if (!this.currentUser) return;
        const nameEl = document.getElementById('user-display-name');
        const roleEl = document.getElementById('user-display-role');
        if (nameEl) nameEl.textContent = this.currentUser.name;
        if (roleEl) roleEl.textContent = 'Student';
    },

    updateNavLinks() {
        const linksContainer = document.getElementById('nav-dynamic-links');
        if (!linksContainer) return;

        linksContainer.innerHTML = `
            <button class="nav-link-btn ${this.currentView === 'student' ? 'active' : ''}" onclick="App.navigateTo('student')">
                <img src="/assets/icons/icon-bookshelf.svg" class="nav-link-icon" alt="Notebook">
                <span>My Notebooks</span>
            </button>
            <button class="nav-link-btn ${this.currentView === 'settings' ? 'active' : ''}" onclick="App.navigateTo('settings')">
                <img src="/assets/icons/icon-settings.svg" class="nav-link-icon" alt="Settings">
                <span>Settings</span>
            </button>
        `;
    },

    renderBottomNavBar() {
        const nav = document.getElementById('bottom-nav-bar');
        if (!nav) return;

        if (this.currentView === 'auth') {
            nav.style.display = 'none';
            return;
        }

        nav.style.display = 'flex';
        nav.innerHTML = `
            <div class="bottom-nav-item ${this.currentView === 'student' ? 'active' : ''}" onclick="App.navigateTo('student')">
                <svg class="icon-svg"><use href="#icon-book"/></svg>
                <span>Notebooks</span>
            </div>
            <div class="bottom-nav-item ${this.currentView === 'settings' ? 'active' : ''}" onclick="App.navigateTo('settings')">
                <svg class="icon-svg"><use href="#icon-settings"/></svg>
                <span>Settings</span>
            </div>
        `;
    },

    setupNotifications() {
        const bellBtn = document.getElementById('btn-notif-bell');
        const notifPanel = document.getElementById('notif-panel');
        const markReadBtn = document.getElementById('btn-mark-all-read');

        if (bellBtn && notifPanel) {
            bellBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notifPanel.classList.toggle('active');
                if (notifPanel.classList.contains('active')) {
                    this.loadNotifications();
                }
            });

            document.addEventListener('click', (e) => {
                if (!notifPanel.contains(e.target) && e.target !== bellBtn) {
                    notifPanel.classList.remove('active');
                }
            });
        }

        if (markReadBtn) {
            markReadBtn.addEventListener('click', async () => {
                await API.markNotificationsRead();
                this.loadNotifications();
            });
        }
    },

    async loadNotifications() {
        try {
            const res = await API.getNotifications();
            const listContainer = document.getElementById('notif-list-container');
            const badgeCount = document.getElementById('notif-badge-count');

            const notifications = res.notifications || [];
            const unreadCount = notifications.filter(n => !n.is_read).length;

            if (badgeCount) {
                if (unreadCount > 0) {
                    badgeCount.textContent = unreadCount;
                    badgeCount.style.display = 'inline-flex';
                } else {
                    badgeCount.style.display = 'none';
                }
            }

            if (!listContainer) return;

            if (notifications.length === 0) {
                listContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">No notifications.</p>`;
                return;
            }

            listContainer.innerHTML = notifications.map(n => `
                <div class="notif-item ${!n.is_read ? 'unread' : ''}">
                    <div style="font-size: 13px; color: var(--text-primary);">${n.content}</div>
                    <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">${new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `).join('');
        } catch (e) {
            console.error('Error loading notifications:', e);
        }
    },

    onNotificationReceived(notif) {
        this.toast(notif.content, 'info');
        this.loadNotifications();
    },

    logout() {
        API.logout().then(() => {
            API.setToken(null);
            this.currentUser = null;
            this.navigateTo('auth');
            this.toast('Locked kiosk screen.', 'info');
        });
    },

    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 4000);
    },

    showModal(htmlContent) {
        const container = document.getElementById('modal-container');
        if (!container) return;

        container.innerHTML = `
            <div class="modal-overlay active" id="modal-overlay-bg">
                ${htmlContent}
            </div>
        `;
    },

    closeModal() {
        const container = document.getElementById('modal-container');
        if (container) container.innerHTML = '';
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
