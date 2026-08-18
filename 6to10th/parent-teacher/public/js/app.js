/* SmartSlate Parent & Teacher Application Controller & Router */

const App = {
    currentUser: null,
    currentView: 'auth',

    async init() {
        console.log('Initializing SmartSlate Parent & Teacher Web Portal...');

        const token = API.getToken();
        if (token) {
            try {
                const res = await API.getCurrentUser();
                this.currentUser = res.user;
                this.navigateTo(res.user.role);
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
            case 'parent':
                ParentView.render(container);
                break;
            case 'teacher':
                TeacherView.render(container);
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
        const avatarEl = document.getElementById('user-role-avatar');
        if (nameEl) nameEl.textContent = this.currentUser.name;
        if (roleEl) roleEl.textContent = this.currentUser.role;
        if (avatarEl) avatarEl.textContent = this.currentUser.role === 'teacher' ? '👩‍🏫' : '👨‍👩‍👦';
    },

    updateNavLinks() {
        const linksContainer = document.getElementById('nav-dynamic-links');
        if (!linksContainer || !this.currentUser) return;

        if (this.currentUser.role === 'parent') {
            linksContainer.innerHTML = `
                <button class="nav-link-btn ${this.currentView === 'parent' ? 'active' : ''}" onclick="App.navigateTo('parent')">
                    <img src="/assets/icons/icon-child-profile.svg" class="nav-link-icon" alt="Parent">
                    <span>Parent Dashboard</span>
                </button>
                <button class="nav-link-btn ${this.currentView === 'settings' ? 'active' : ''}" onclick="App.navigateTo('settings')">
                    <img src="/assets/icons/icon-settings.svg" class="nav-link-icon" alt="Settings">
                    <span>Settings</span>
                </button>
            `;
        } else if (this.currentUser.role === 'teacher') {
            linksContainer.innerHTML = `
                <button class="nav-link-btn ${this.currentView === 'teacher' ? 'active' : ''}" onclick="App.navigateTo('teacher')">
                    <img src="/assets/icons/icon-teacher-dashboard.svg" class="nav-link-icon" alt="Teacher">
                    <span>Teacher Dashboard</span>
                </button>
                <button class="nav-link-btn ${this.currentView === 'settings' ? 'active' : ''}" onclick="App.navigateTo('settings')">
                    <img src="/assets/icons/icon-settings.svg" class="nav-link-icon" alt="Settings">
                    <span>Settings</span>
                </button>
            `;
        }
    },

    renderBottomNavBar() {
        const nav = document.getElementById('bottom-nav-bar');
        if (!nav) return;

        if (this.currentView === 'auth') {
            nav.style.display = 'none';
            return;
        }

        nav.style.display = 'flex';
        const role = this.currentUser ? this.currentUser.role : 'auth';

        if (role === 'parent') {
            nav.innerHTML = `
                <div class="bottom-nav-item ${this.currentView === 'parent' ? 'active' : ''}" onclick="App.navigateTo('parent')">
                    <svg class="icon-svg"><use href="#icon-user"/></svg>
                    <span>Parent Portal</span>
                </div>
                <div class="bottom-nav-item ${this.currentView === 'settings' ? 'active' : ''}" onclick="App.navigateTo('settings')">
                    <svg class="icon-svg"><use href="#icon-settings"/></svg>
                    <span>Settings</span>
                </div>
            `;
        } else if (role === 'teacher') {
            nav.innerHTML = `
                <div class="bottom-nav-item ${this.currentView === 'teacher' ? 'active' : ''}" onclick="App.navigateTo('teacher')">
                    <svg class="icon-svg"><use href="#icon-assignment"/></svg>
                    <span>Teacher Portal</span>
                </div>
                <div class="bottom-nav-item ${this.currentView === 'settings' ? 'active' : ''}" onclick="App.navigateTo('settings')">
                    <svg class="icon-svg"><use href="#icon-settings"/></svg>
                    <span>Settings</span>
                </div>
            `;
        }
    },

    logout() {
        API.logout().then(() => {
            API.setToken(null);
            this.currentUser = null;
            this.navigateTo('auth');
            this.toast('Signed out.', 'info');
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

    showToast(message, type = 'info') {
        return this.toast(message, type);
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
