/* SmartSlate Student Application Controller & Router */

const App = {
    currentUser: null,
    currentView: 'auth',

    async init() {
        console.log('Initializing SmartSlate Student Application...');
        
        window.addEventListener('online', () => this.handleNetworkChange(true));
        window.addEventListener('offline', () => this.handleNetworkChange(false));

        this.setupNotifications();
        this.startTabletClock();

        if (window.firebaseAuthService) {
            window.firebaseAuthService.onAuthStateChanged(async (fbUser) => {
                if (fbUser) {
                    console.log(`[IDENTITY] Auth UID: ${fbUser.uid}`);
                    console.log(`[IDENTITY] Auth email: ${fbUser.email}`);
                    console.log(`[IDENTITY] Reading profile: students/${fbUser.uid}`);
                    try {
                        const profile = await window.firebaseAuthService.getStudentProfileByUid(fbUser.uid);
                        const isMatch = profile && (profile.uid === fbUser.uid);
                        console.log(`[IDENTITY] Profile UID: ${profile ? profile.uid : 'NONE'}`);
                        console.log(`[IDENTITY] Profile name: ${profile ? profile.name : 'NONE'}`);
                        console.log(`[IDENTITY] UID MATCH: ${isMatch}`);

                        if (isMatch) {
                            this.currentUser = profile;
                            if (typeof AcademicData !== 'undefined') {
                                AcademicData.studentProfile = profile;
                            }
                            console.log(`[PROFILE] 6to10th loaded student profile: ${this.currentUser.name}`);
                            if (typeof SocketManager !== 'undefined') SocketManager.init();
                            this.navigateTo('student');
                        } else {
                            console.error('[PROFILE ERROR] Profile UID match failed or document missing. Access denied.');
                            this.currentUser = null;
                            if (typeof AcademicData !== 'undefined') AcademicData.studentProfile = null;
                            this.toast('Student profile not found or identity mismatch.', 'danger');
                            this.navigateTo('auth');
                        }
                    } catch (err) {
                        console.warn('[6to10th] Could not load Firestore profile:', err.message);
                        this.currentUser = null;
                        if (typeof AcademicData !== 'undefined') AcademicData.studentProfile = null;
                        this.navigateTo('auth');
                    }
                } else {
                    console.log('[AUTH] 6to10th: No authenticated user');
                    this.currentUser = null;
                    if (typeof AcademicData !== 'undefined') AcademicData.studentProfile = null;
                    this.navigateTo('auth');
                }
                this.hideLoadingScreen();
            });
        } else {
            const token = API.getToken();
            if (token) {
                try {
                    const res = await API.getCurrentUser();
                    this.currentUser = res.user;
                    if (typeof SocketManager !== 'undefined') SocketManager.init();
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
        }
    },

    startTabletClock() {
        const updateClock = () => {
            const timeEl = document.getElementById('tablet-clock-time');
            const dateEl = document.getElementById('tablet-clock-date');
            if (!timeEl || !dateEl) return;
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            dateEl.textContent = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
        };
        updateClock();
        setInterval(updateClock, 10000);
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

    routeStudentToDashboard() {
        this.navigateTo('student');
    },

    navigateTo(viewName, tabName = null, tabParam = null) {
        if (!this.currentUser && viewName !== 'auth') {
            viewName = 'auth';
        }

        this.currentView = viewName;
        const navbar = document.getElementById('top-navbar');
        const sidebar = document.getElementById('app-sidebar');

        if (viewName === 'auth') {
            if (navbar) navbar.style.display = 'none';
            if (sidebar) sidebar.style.display = 'none';
            if (typeof StudentView !== 'undefined' && typeof StudentView.updateWebSearchWidgetVisibility === 'function') {
                StudentView.updateWebSearchWidgetVisibility(1);
            }
        } else {
            if (navbar) navbar.style.display = 'flex';
            if (sidebar) sidebar.style.display = 'flex';
            this.updateHeaderProfile();
            this.updateNavLinks();
        }

        const sections = document.querySelectorAll('.view-section');
        sections.forEach(sec => sec.style.display = 'none');

        const targetSection = document.getElementById(`view-${viewName}`);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.renderViewContent(viewName, targetSection, tabName, tabParam);
        }

        this.renderBottomNavBar();
        this.toggleSidebar(false);
    },

    toggleSidebar(forceState = null) {
        const sidebar = document.getElementById('app-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (!sidebar) return;

        const isCurrentlyOpen = sidebar.classList.contains('mobile-open');
        const shouldOpen = forceState !== null ? forceState : !isCurrentlyOpen;

        if (shouldOpen) {
            sidebar.classList.add('mobile-open');
            if (overlay) overlay.classList.add('active');
        } else {
            sidebar.classList.remove('mobile-open');
            if (overlay) overlay.classList.remove('active');
        }
    },

    goToStudentTab(tabName, tabParam = null) {
        if (this.currentView !== 'student') {
            this.navigateTo('student', tabName, tabParam);
        } else {
            StudentView.switchTab(tabName, tabParam);
            this.updateNavLinks();
            this.renderBottomNavBar();
        }
        this.toggleSidebar(false);
    },

    renderViewContent(viewName, container, tabName = null, tabParam = null) {
        switch (viewName) {
            case 'auth':
                AuthView.render(container);
                break;
            case 'student':
                if (tabName) {
                    StudentView.activeTab = tabName;
                    if (tabParam) StudentView.activeSubjectId = tabParam;
                }
                StudentView.render(container);
                break;
            case 'settings':
                SettingsView.render(container);
                break;
        }
    },

    updateHeaderProfile() {
        const profile = this.currentUser || AcademicData.studentProfile || {};
        const studentName = profile.name || 'Student';
        const activeClass = profile.class || AcademicData.selectedClass || 8;
        const section = profile.section ? (String(profile.section).includes('Section') ? profile.section : `Section ${profile.section}`) : 'Section A';
        const academicYear = profile.academicYear || '2026–27';

        const headerName = document.getElementById('header-student-name');
        if (headerName) headerName.textContent = studentName.split(' ')[0] || 'Student';

        const nameEl = document.getElementById('user-display-name');
        const roleEl = document.getElementById('user-display-role');
        const sidebarUser = document.getElementById('sidebar-user-name');
        const sidebarRole = document.getElementById('sidebar-user-role');
        const sidebarClass = document.getElementById('sidebar-current-class');

        if (nameEl) nameEl.textContent = studentName;
        if (roleEl) roleEl.textContent = `Class ${activeClass} • ${section}`;
        if (sidebarUser) sidebarUser.textContent = studentName;
        if (sidebarRole) sidebarRole.textContent = `Academic Year ${academicYear}`;
        if (sidebarClass) sidebarClass.textContent = `Class ${activeClass} • ${section}`;

        // Update Web Search Widget visibility based on login state and Class
        if (typeof StudentView !== 'undefined' && typeof StudentView.updateWebSearchWidgetVisibility === 'function') {
            StudentView.updateWebSearchWidgetVisibility(activeClass);
        }
    },

    showTeacherAdminModal() {
        const p = AcademicData.studentProfile;
        const html = `
            <div class="modal-card" style="max-width: 480px; text-align: left;">
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title" style="font-size: 18px; font-weight: 800; color: #151A2D; display: flex; align-items: center; gap: 8px;">
                            <span>🏫</span>
                            <span>Teacher / School Admin</span>
                        </h3>
                        <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">Manage student academic enrollment & class promotion</div>
                    </div>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px;">
                    <div>
                        <label style="font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Student Full Name</label>
                        <input type="text" id="admin-student-name" class="form-input" value="${p.name}" style="width: 100%; padding: 10px 14px; font-size: 14px; border: 1.5px solid #E5E7EB; border-radius: 8px;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Roll Number</label>
                            <input type="text" id="admin-student-roll" class="form-input" value="${p.rollNo}" style="width: 100%; padding: 10px 14px; font-size: 14px; border: 1.5px solid #E5E7EB; border-radius: 8px;">
                        </div>
                        <div>
                            <label style="font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Student ID</label>
                            <input type="text" id="admin-student-id" class="form-input" value="${p.studentId}" style="width: 100%; padding: 10px 14px; font-size: 14px; border: 1.5px solid #E5E7EB; border-radius: 8px;" readonly>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Academic Class (6–10)</label>
                            <select id="admin-student-class" class="form-input" style="width: 100%; padding: 10px 14px; font-size: 14px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-weight: 700; color: #8864F3;">
                                ${[6, 7, 8, 9, 10].map(c => `
                                    <option value="${c}" ${p.classNum == c ? 'selected' : ''}>Class ${c} (Middle/Secondary)</option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Assigned Section</label>
                            <select id="admin-student-section" class="form-input" style="width: 100%; padding: 10px 14px; font-size: 14px; border: 1.5px solid #E5E7EB; border-radius: 8px;">
                                ${['Section A', 'Section B', 'Section C', 'Section D'].map(sec => `
                                    <option value="${sec}" ${p.section === sec ? 'selected' : ''}>${sec}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style="font-size: 12px; font-weight: 700; color: #374151; display: block; margin-bottom: 4px;">Current Academic Year</label>
                        <select id="admin-student-year" class="form-input" style="width: 100%; padding: 10px 14px; font-size: 14px; border: 1.5px solid #E5E7EB; border-radius: 8px;">
                            <option value="2026–27" ${p.academicYear === '2026–27' ? 'selected' : ''}>2026–27 (Current Session)</option>
                            <option value="2027–28" ${p.academicYear === '2027–28' ? 'selected' : ''}>2027–28 (Next Session)</option>
                        </select>
                    </div>

                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; font-size: 11.5px; color: #64748B;">
                        🔒 <strong>School Managed Record:</strong> Updating the student's class dynamically updates their textbooks, notebooks, syllabus, timetable, homework, and academic progress across SmartSlate.
                    </div>

                    <button class="glass-btn glass-btn-primary bouncy-btn" onclick="App.saveTeacherAdminChanges()" style="padding: 12px; justify-content: center; font-weight: 800; font-size: 14px; border-radius: 8px; margin-top: 4px;">
                        <span>Update Academic Information</span>
                    </button>
                </div>
            </div>
        `;
        this.showModal(html);
    },

    saveTeacherAdminChanges() {
        const name = document.getElementById('admin-student-name')?.value || 'Aarav Sharma';
        const rollNo = document.getElementById('admin-student-roll')?.value || '24';
        const classNum = parseInt(document.getElementById('admin-student-class')?.value || '8');
        const section = document.getElementById('admin-student-section')?.value || 'Section B';
        const academicYear = document.getElementById('admin-student-year')?.value || '2026–27';

        AcademicData.updateAcademicInfo({
            name,
            rollNo,
            classNum,
            section,
            academicYear
        });

        this.closeModal();
        this.updateHeaderProfile();
        this.toast(`Academic record updated: Class ${classNum} • ${section} ✓`, 'success');

        if (this.currentView === 'student') {
            StudentView.render(document.getElementById('view-student'));
        } else if (this.currentView === 'settings') {
            SettingsView.render(document.getElementById('view-settings'));
        }
    },

    updateNavLinks() {
        const sidebarNav = document.getElementById('sidebar-nav-links');
        const promoText = document.getElementById('sidebar-promo-text');
        if (!sidebarNav) return;

        const activeStudentTab = this.currentView === 'student' ? StudentView.activeTab : '';
        const isSettings = this.currentView === 'settings';

        // Primary Student Navigation Options for Class 6–10
        const navItems = [
            { id: 'home', label: 'Home', icon: '🏠', isTab: true, matchTabs: ['home', 'schedule', 'timetable', 'calendar-view'], title: 'Welcome to SmartSlate', subtitle: 'Access your subjects, notes and schedule.', art: '📚🎓' },
            { id: 'books', label: 'Textbooks', icon: '📚', isTab: true, matchTabs: ['books', 'study', 'book-syllabus', 'lesson-content'], title: 'Digital Textbooks', subtitle: 'Curriculum-aligned NCERT textbooks & chapters.', art: '📖🔖' },
            { id: 'homework', label: 'Homework', icon: '✓', isTab: true, matchTabs: ['homework', 'assignments', 'notes', 'bookshelf', 'notebook-detail'], title: 'Daily Homework & Tasks', subtitle: 'Track pending work and completed tasks.', art: '📋✓' },
            { id: 'exams', label: 'Exams', icon: '📋', isTab: true, matchTabs: ['exams', 'tests', 'practice'], title: 'Examinations & Tests', subtitle: 'Class assessments, unit tests & exams.', art: '📋📝' },
            { id: 'announcements', label: 'Announcements', icon: '📢', isTab: true, matchTabs: ['announcements', 'notices'], title: 'School & Teacher Notices', subtitle: 'Stay updated with important class notices.', art: '📢🔔' },
            { id: 'settings', label: 'Profile', icon: '👤', isTab: false, isView: true, title: 'Academic Profile', subtitle: 'Student information, attendance & report cards.', art: '👤📊' }
        ];

        let activeItem = navItems[0];

        sidebarNav.innerHTML = navItems.map(item => {
            let isActive = false;
            if (item.isView && isSettings) {
                isActive = true;
            } else if (item.isTab && this.currentView === 'student') {
                if (item.matchTabs) {
                    isActive = item.matchTabs.includes(activeStudentTab);
                } else {
                    isActive = activeStudentTab === item.id;
                }
            }

            if (isActive) {
                activeItem = item;
            }

            const clickHandler = item.isView ? `App.navigateTo('${item.id}')` : `App.goToStudentTab('${item.id}')`;

            return `
                <button class="sidebar-nav-item ${isActive ? 'active' : ''}" onclick="${clickHandler}">
                    <span class="sidebar-nav-icon">${item.icon}</span>
                    <span class="sidebar-nav-label">${item.label}</span>
                </button>
            `;
        }).join('');

        const promoContainer = document.getElementById('sidebar-promo-container');
        if (promoContainer && activeItem) {
            promoContainer.innerHTML = `
                <h4 style="font-size: 13px; font-weight: 800; color: #151A2D; margin: 0 0 4px 0; line-height: 1.3;">${activeItem.title}</h4>
                ${activeItem.subtitle ? `<p style="font-size: 11px; color: #6B7280; margin: 0 0 10px 0; line-height: 1.4; max-width: 140px;">${activeItem.subtitle}</p>` : ''}
                <div style="display: flex; justify-content: flex-end; font-size: 32px; line-height: 1; margin-top: 6px;">
                    ${activeItem.art}
                </div>
            `;
        }

        this.renderBottomNavBar();
    },

    renderBottomNavBar() {
        const nav = document.getElementById('bottom-nav-bar');
        if (!nav) return;

        if (this.currentView === 'auth') {
            nav.style.display = 'none';
            return;
        }

        nav.style.display = 'flex';

        // Check if buttons are already in DOM to preserve sliding pill animation state
        if (!nav.querySelector('.bottom-nav-item') || !nav.querySelector('[data-nav="exams"]')) {
            nav.innerHTML = `
                <div class="sliding-nav-indicator" id="sliding-nav-indicator"></div>
                <button class="bottom-nav-item" data-nav="home" onclick="App.goToStudentTab('home')">
                    <span class="bottom-nav-icon">🏠</span>
                    <span class="bottom-nav-label">Home</span>
                </button>
                <button class="bottom-nav-item" data-nav="books" onclick="App.goToStudentTab('books')">
                    <span class="bottom-nav-icon">📚</span>
                    <span class="bottom-nav-label">Textbooks</span>
                </button>
                <button class="bottom-nav-item" data-nav="homework" onclick="App.goToStudentTab('homework')">
                    <span class="bottom-nav-icon">✓</span>
                    <span class="bottom-nav-label">Homework</span>
                </button>
                <button class="bottom-nav-item" data-nav="exams" onclick="App.goToStudentTab('exams')">
                    <span class="bottom-nav-icon">📋</span>
                    <span class="bottom-nav-label">Exams</span>
                </button>
                <button class="bottom-nav-item" data-nav="announcements" onclick="App.goToStudentTab('announcements')">
                    <span class="bottom-nav-icon">📢</span>
                    <span class="bottom-nav-label">Notices</span>
                </button>
                <button class="bottom-nav-item" data-nav="profile" onclick="App.navigateTo('settings')">
                    <span class="bottom-nav-icon">👤</span>
                    <span class="bottom-nav-label">Profile</span>
                </button>
            `;
        }

        const activeStudentTab = this.currentView === 'student' ? StudentView.activeTab : '';
        const isSettings = this.currentView === 'settings';

        let targetNavId = 'home';
        if (isSettings) {
            targetNavId = 'profile';
        } else if (activeStudentTab === 'books' || activeStudentTab === 'book-syllabus' || activeStudentTab === 'lesson-content' || activeStudentTab === 'study') {
            targetNavId = 'books';
        } else if (activeStudentTab === 'homework' || activeStudentTab === 'assignments') {
            targetNavId = 'homework';
        } else if (activeStudentTab === 'exams' || activeStudentTab === 'tests' || activeStudentTab === 'practice') {
            targetNavId = 'exams';
        } else if (activeStudentTab === 'announcements') {
            targetNavId = 'announcements';
        } else {
            targetNavId = 'home';
        }

        nav.querySelectorAll('.bottom-nav-item').forEach(btn => {
            if (btn.dataset.nav === targetNavId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        requestAnimationFrame(() => this.updateSlidingNavIndicator());
    },

    updateSlidingNavIndicator() {
        const nav = document.getElementById('bottom-nav-bar');
        const indicator = document.getElementById('sliding-nav-indicator');
        if (!nav || !indicator) return;

        const activeItem = nav.querySelector('.bottom-nav-item.active');
        if (activeItem) {
            const left = activeItem.offsetLeft;
            const width = activeItem.offsetWidth;
            indicator.style.opacity = '1';
            indicator.style.transform = `translateX(${left}px)`;
            indicator.style.width = `${width}px`;
        } else {
            indicator.style.opacity = '0';
        }
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

    async logout() {
        console.log('[AUTH] 6to10th: Logging out user...');
        if (window.firebaseAuthService) {
            await window.firebaseAuthService.signOutUser().catch(() => {});
        }
        await API.logout().catch(() => {});
        API.setToken(null);
        this.currentUser = null;
        const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
        const proto = (typeof window !== 'undefined' && window.location && window.location.protocol) ? window.location.protocol : 'http:';
        const gatewayUrl = (typeof MAIN_APP_URL !== 'undefined' ? MAIN_APP_URL : `${proto}//${host}:3000`);
        window.location.replace(gatewayUrl);
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
