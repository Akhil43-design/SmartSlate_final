/* Student Dashboard View Component */

const StudentView = {
    activeTab: 'home', // 'home', 'subjects', 'subject-detail', 'study', 'practice', 'progress', 'bookshelf', 'notebook-detail', 'assignments', 'teacher', 'chat', 'exams', 'history', 'search', 'attendance'
    activeSubjectId: null,
    activeSubjectSubTab: 'textbook', // 'textbook', 'videos', 'notes', 'solutions', 'practice', 'progress'
    activeStudySubjectId: null,
    activeStudyChapterId: null,
    activePracticeSubjectId: null,
    activePracticeChapterId: null,
    currentBook: null,
    currentNote: null,
    currentAssignmentContext: null,
    autoSaveTimer: null,
    quizState: {},

    switchTab(tabName, param = null) {
        this.activeTab = tabName;
        if (tabName === 'subject-detail' && param) {
            this.activeSubjectId = param;
        } else if (tabName === 'study' && param) {
            this.activeStudySubjectId = param;
        } else if (tabName === 'practice' && param) {
            this.activePracticeSubjectId = param;
        }
        const content = document.getElementById('student-tab-content');
        if (content) {
            this.renderTabContent(content);
        } else {
            const container = document.getElementById('view-student');
            if (container) this.render(container);
        }
        App.updateNavLinks();
        App.renderBottomNavBar();
    },

    async render(container) {
        container.innerHTML = `<div id="student-tab-content" style="width: 100%;"></div>`;
        this.renderTabContent(container.querySelector('#student-tab-content'));
    },

    async renderTabContent(contentArea) {
        contentArea.innerHTML = `<div style="text-align: center; padding: 40px;"><div class="spinner" style="margin: 0 auto;"></div></div>`;

        try {
            switch (this.activeTab) {
                case 'home':
                    await this.renderHome(contentArea);
                    break;
                case 'books':
                case 'study':
                    await this.renderBooksView(contentArea);
                    break;
                case 'book-syllabus':
                    await this.renderBookSyllabus(contentArea);
                    break;
                case 'lesson-content':
                    await this.renderLessonContent(contentArea);
                    break;
                case 'homework':
                case 'assignments':
                case 'notes':
                case 'bookshelf':
                    await this.renderHomeworkView(contentArea);
                    break;
                case 'diary':
                    await this.renderDiaryView(contentArea);
                    break;
                case 'announcements':
                case 'notices':
                    await this.renderAnnouncementsView(contentArea);
                    break;
                case 'schedule':
                case 'timetable':
                    await this.renderTimetableView(contentArea);
                    break;
                case 'calendar':
                case 'calendar-view':
                case 'attendance':
                    await this.renderCalendarView(contentArea);
                    break;
                case 'notebook-detail':
                    await this.renderNotebookDetail(contentArea);
                    break;
                case 'web-search':
                    await this.renderWebSearchView(contentArea);
                    break;
                case 'web-browser':
                    await this.renderWebBrowserView(contentArea);
                    break;
                case 'tests':
                case 'practice':
                case 'exams':
                    await this.renderTestsView(contentArea);
                    break;
                case 'downloads':
                    await this.renderDownloadsView(contentArea);
                    break;
                default:
                    await this.renderHome(contentArea);
            }
        } catch (err) {
            contentArea.innerHTML = `<div class="glass-card" style="color: var(--status-danger);">Error loading tab: ${err.message}</div>`;
        }
    },

    // ─────────────────────────────────────────────────────────
    // 1. HOME DASHBOARD (Class 6–10 Minimalist Notebook Shelf)
    // ─────────────────────────────────────────────────────────
    async renderHome(container) {
        const profile = App.currentUser || AcademicData.studentProfile;
        if (!profile) {
            container.innerHTML = `
                <div class="glass-card" style="padding: 40px; text-align: center; color: var(--status-danger);">
                    <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">⚠️ Student Profile Not Found</h2>
                    <p style="font-size: 14px; color: var(--text-secondary);">Unable to resolve student profile from Cloud Firestore for the authenticated user.</p>
                    <button class="glass-btn glass-btn-primary bouncy-btn" style="margin-top: 16px; padding: 10px 20px;" onclick="App.logout()">Return to Login</button>
                </div>
            `;
            return;
        }
        const studentName = profile.name || 'Student';
        const activeClass = profile.class || AcademicData.selectedClass || 8;
        const section = profile.section ? (String(profile.section).includes('Section') ? profile.section : `Section ${profile.section}`) : 'Section A';
        const subjects = AcademicData.getSubjects(activeClass);

        let userBooks = [];
        try {
            const booksRes = await API.getBooks();
            userBooks = booksRes.books || [];
        } catch(e) {}

        const todayDateStr = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Subject theme presets for realistic physical closed notebooks (Sophisticated Class 6-10 palette)
        const notebookPresets = {
            'math': {
                gradient: 'linear-gradient(145deg, #4C1D95 0%, #311068 100%)',
                spineColor: '#1E0A45',
                accentColor: '#C4B5FD',
                icon: '📐',
                label: 'MATHEMATICS',
                tag: 'CORE CURRICULUM'
            },
            'science': {
                gradient: 'linear-gradient(145deg, #065F46 0%, #022C22 100%)',
                spineColor: '#011A14',
                accentColor: '#6EE7B7',
                icon: '🧪',
                label: 'SCIENCE',
                tag: 'SCIENCE LAB'
            },
            'physics': {
                gradient: 'linear-gradient(145deg, #1E40AF 0%, #172554 100%)',
                spineColor: '#0F172A',
                accentColor: '#93C5FD',
                icon: '⚡',
                label: 'PHYSICS',
                tag: 'SCIENCE LAB'
            },
            'chemistry': {
                gradient: 'linear-gradient(145deg, #047857 0%, #064E3B 100%)',
                spineColor: '#022C22',
                accentColor: '#6EE7B7',
                icon: '🧪',
                label: 'CHEMISTRY',
                tag: 'SCIENCE LAB'
            },
            'biology': {
                gradient: 'linear-gradient(145deg, #991B1B 0%, #450A0A 100%)',
                spineColor: '#2D0606',
                accentColor: '#FCA5A5',
                icon: '🌿',
                label: 'BIOLOGY',
                tag: 'LIFE SCIENCES'
            },
            'english': {
                gradient: 'linear-gradient(145deg, #3730A3 0%, #1E1B4B 100%)',
                spineColor: '#131131',
                accentColor: '#A5B4FC',
                icon: '📖',
                label: 'ENGLISH',
                tag: 'LANGUAGE ARTS'
            },
            'computer': {
                gradient: 'linear-gradient(145deg, #4338CA 0%, #312E81 100%)',
                spineColor: '#1E1B4B',
                accentColor: '#A5B4FC',
                icon: '💻',
                label: 'COMPUTER SCIENCE',
                tag: 'TECH & CODE'
            },
            'social': {
                gradient: 'linear-gradient(145deg, #C2410C 0%, #7C2D12 100%)',
                spineColor: '#451A03',
                accentColor: '#FDBA74',
                icon: '📜',
                label: 'SOCIAL SCIENCE',
                tag: 'HUMANITIES'
            },
            'hindi': {
                gradient: 'linear-gradient(145deg, #B45309 0%, #78350F 100%)',
                spineColor: '#451A03',
                accentColor: '#FCD34D',
                icon: '🇮🇳',
                label: 'HINDI',
                tag: 'साहित्य एवं व्याकरण'
            }
        };

        const notebooksList = subjects.map(s => {
            const key = Object.keys(notebookPresets).find(k => s.id.toLowerCase().includes(k) || s.name.toLowerCase().includes(k)) || 'math';
            const preset = notebookPresets[key];
            const existingBook = userBooks.find(b => (b.subject || '').toLowerCase() === s.name.toLowerCase());

            return {
                subjectId: s.id,
                subjectName: s.name,
                gradient: preset.gradient,
                spineColor: preset.spineColor,
                accentColor: preset.accentColor,
                icon: s.icon || preset.icon,
                label: preset.label,
                tag: preset.tag,
                existingBookId: existingBook ? existingBook.id : null
            };
        });

        container.innerHTML = `
            <div class="home-page-clean-wrapper">
                
                <!-- 1. ACADEMIC STUDY-DESK WELCOME CARD -->
                <div class="academic-welcome-banner">
                    <!-- Subtle Floating Study Desk Illustrations -->
                    <div class="desk-decor-plant" title="Study Plant">🌿</div>
                    <div class="desk-decor-stationery" title="Academic Stationery">
                        <span style="font-size: 26px;">📚</span>
                        <span style="font-size: 22px; margin-left: -4px;">✏️</span>
                    </div>

                    <div class="academic-welcome-content">
                        <div class="academic-badge-pill">
                            <span style="font-size: 13px;">🎓</span>
                            <span>Class ${activeClass} • ${section}</span>
                        </div>
                        
                        <h2 class="academic-welcome-title">Welcome back, ${studentName.split(' ')[0]}</h2>
                        <p class="academic-welcome-subtitle">Ready to continue learning?</p>
                    </div>
                </div>

                <!-- 2. MY NOTEBOOKS SHELF -->
                <div style="margin-top: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h2 style="font-size: 22px; font-weight: 800; color: #151A2D; margin: 0; display: flex; align-items: center; gap: 10px;">
                                <span>My Notebooks</span>
                                <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-size: 11px; font-weight: 800;">
                                    ${notebooksList.length} Subjects
                                </span>
                            </h2>
                            <p style="font-size: 13px; color: #6B7280; margin-top: 3px;">
                                Select any subject notebook to view notes, formulas and solved exercises
                            </p>
                        </div>

                        <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.showNewBookModal()">
                            <span>+ New Notebook</span>
                        </button>
                    </div>

                    <!-- Realistic 3D Physical Notebooks Grid (220x300 desktop, 180x250 tablet, 150x210 mobile) -->
                    <div class="notebooks-bookshelf-grid">
                        ${notebooksList.map(n => `
                            <div class="closed-notebook-card bouncy-btn" data-subject-name="${n.subjectName}" data-book-id="${n.existingBookId || ''}" style="background: ${n.gradient};">
                                
                                <!-- Realistic Left Spine with Ribbon Stitching -->
                                <div class="closed-notebook-spine" style="background: ${n.spineColor};">
                                    <div class="closed-notebook-spine-ribbon"></div>
                                </div>

                                <!-- Front Cover Face -->
                                <div class="closed-notebook-cover">
                                    
                                    <!-- Top Class Header -->
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 800; letter-spacing: 0.8px; color: rgba(255, 255, 255, 0.8);">
                                        <span>CLASS ${activeClass}</span>
                                        <span>NOTES</span>
                                    </div>

                                    <!-- Center Elegant Embossed Title Plate -->
                                    <div class="closed-notebook-label-plate">
                                        <div class="closed-notebook-icon">${n.icon}</div>
                                        <div style="min-width: 0; width: 100%;">
                                            <h3 class="closed-notebook-title">${n.label}</h3>
                                            <div class="closed-notebook-sub">${n.tag}</div>
                                        </div>
                                    </div>

                                    <!-- Bottom Minimal Academic Indicator -->
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 700; color: rgba(255, 255, 255, 0.85); padding: 0 4px;">
                                        <span>STUDENT NOTEBOOK</span>
                                        <span>📖</span>
                                    </div>

                                </div>

                                <!-- Subtle Realistic Page Edges on Right -->
                                <div class="closed-notebook-page-edge"></div>

                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 3. SMALL QUICK ACCESS OPTIONS (Clean & Focused) -->
                <div style="margin-top: 28px;">
                    <h3 style="font-size: 16px; font-weight: 800; color: #151A2D; margin-bottom: 14px;">Quick Academic Access</h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; width: 100%; box-sizing: border-box;">
                        
                        <!-- Option 1: Examinations & Tests -->
                        <div class="home-section-card bouncy-btn" onclick="StudentView.switchTab('exams')" style="padding: 18px 20px; cursor: pointer; position: relative; overflow: hidden; min-height: 74px; display: flex; align-items: center; box-sizing: border-box; width: 100%; background: linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 100%); border: 1.5px solid #DDD6FE;">
                            <div style="display: flex; align-items: center; gap: 12px; padding-right: 40px; min-width: 0; flex: 1; width: 100%; box-sizing: border-box;">
                                <div class="class-exact-icon-box" style="width: 38px; height: 38px; background: #EDE9FE; color: #7C3AED; font-size: 17px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 10px;">
                                    <span style="font-size: 20px;">📋</span>
                                </div>
                                <div style="min-width: 0; flex: 1;">
                                    <h4 style="font-size: 14.5px; font-weight: 800; color: #151A2D; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">My Examinations & Tests</h4>
                                    <div style="font-size: 12px; color: #6B7280; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">Unit assessments, MCQ quizzes & written exams</div>
                                </div>
                            </div>
                            <!-- Floating absolute positioned action icon -->
                            <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(124, 58, 237, 0.12); color: #7C3AED; border-radius: 50%; flex-shrink: 0; pointer-events: none;">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </div>
                        </div>

                        <!-- Option 2: Today's Schedule -->
                        <div class="home-section-card bouncy-btn" onclick="StudentView.switchTab('schedule')" style="padding: 18px 20px; cursor: pointer; position: relative; overflow: hidden; min-height: 74px; display: flex; align-items: center; box-sizing: border-box; width: 100%;">
                            <div style="display: flex; align-items: center; gap: 12px; padding-right: 40px; min-width: 0; flex: 1; width: 100%; box-sizing: border-box;">
                                <div class="class-exact-icon-box" style="width: 38px; height: 38px; background: #EFF6FF; color: #2563EB; font-size: 17px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 10px;">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 14h6"/></svg>
                                </div>
                                <div style="min-width: 0; flex: 1;">
                                    <h4 style="font-size: 14.5px; font-weight: 800; color: #151A2D; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">Today's Schedule</h4>
                                    <div style="font-size: 12px; color: #6B7280; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">3 classes remaining • Next: Science at 11:30 AM</div>
                                </div>
                            </div>
                            <!-- Floating absolute positioned action icon -->
                            <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(25, 99, 235, 0.08); color: #2563EB; border-radius: 50%; flex-shrink: 0; pointer-events: none;">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </div>
                        </div>

                        <!-- Option 3: Calendar -->
                        <div class="home-section-card bouncy-btn" onclick="StudentView.switchTab('calendar')" style="padding: 18px 20px; cursor: pointer; position: relative; overflow: hidden; min-height: 74px; display: flex; align-items: center; box-sizing: border-box; width: 100%;">
                            <div style="display: flex; align-items: center; gap: 12px; padding-right: 40px; min-width: 0; flex: 1; width: 100%; box-sizing: border-box;">
                                <div class="class-exact-icon-box" style="width: 38px; height: 38px; background: #F3E8FF; color: #8864F3; font-size: 17px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 10px;">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                                </div>
                                <div style="min-width: 0; flex: 1;">
                                    <h4 style="font-size: 14.5px; font-weight: 800; color: #151A2D; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">Academic Calendar</h4>
                                    <div style="font-size: 12px; color: #6B7280; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">View upcoming classes, exams and school events</div>
                                </div>
                            </div>
                            <!-- Floating absolute positioned action icon -->
                            <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(136, 100, 243, 0.08); color: #8864F3; border-radius: 50%; flex-shrink: 0; pointer-events: none;">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </div>
                        </div>

                        <!-- Option 4: Upcoming Exam Notice -->
                        <div class="home-section-card bouncy-btn" onclick="StudentView.switchTab('announcements')" style="padding: 18px 20px; cursor: pointer; position: relative; overflow: hidden; min-height: 74px; display: flex; align-items: center; box-sizing: border-box; width: 100%;">
                            <div style="display: flex; align-items: center; gap: 12px; padding-right: 40px; min-width: 0; flex: 1; width: 100%; box-sizing: border-box;">
                                <div class="class-exact-icon-box" style="width: 38px; height: 38px; background: #FEF3C7; color: #D97706; font-size: 17px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 10px;">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                </div>
                                <div style="min-width: 0; flex: 1;">
                                    <h4 style="font-size: 14.5px; font-weight: 800; color: #151A2D; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">Class Notices</h4>
                                    <div style="font-size: 12px; color: #6B7280; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">Teacher announcements, exam syllabus & timetables</div>
                                </div>
                            </div>
                            <!-- Floating absolute positioned action icon -->
                            <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(217, 119, 6, 0.08); color: #D97706; border-radius: 50%; flex-shrink: 0; pointer-events: none;">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- 4. CONNECTIONS SECTION (Parent & Teacher Connections) -->
                <div style="margin-top: 28px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h3 style="font-size: 16px; font-weight: 800; color: #151A2D; margin: 0; display: flex; align-items: center; gap: 8px;">
                                <span>Academic Connections</span>
                                <span class="glass-badge" style="background: #E0E7FF; color: #4338CA; font-size: 11px; font-weight: 800;">
                                    Your Code: ${profile.student_code || profile.studentId || 'STU-101'}
                                </span>
                            </h3>
                            <p style="font-size: 12px; color: #6B7280; margin-top: 2px;">
                                Linked parents & teachers who can view your academic progress and notes
                            </p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.showConnectParentModal()" style="padding: 8px 14px; font-size: 12.5px;">
                                <span>+ Connect Parent</span>
                            </button>
                            <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="StudentView.showConnectTeacherModal()" style="padding: 8px 14px; font-size: 12.5px;">
                                <span>+ Connect Teacher</span>
                            </button>
                        </div>
                    </div>

                    <div id="student-connections-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
                        <div style="padding: 16px; text-align: center; color: #6B7280; font-size: 13px;" class="glass-card">
                            Loading connections...
                        </div>
                    </div>
                </div>

            </div>
        `;

        // Asynchronously load and populate connections list
        this.loadAndRenderConnections(container);

        // Handle clicking closed notebooks
        container.querySelectorAll('.closed-notebook-card').forEach(card => {
            card.addEventListener('click', async () => {
                const subjectName = card.dataset.subjectName;
                const bookId = card.dataset.bookId;

                if (bookId && userBooks.length > 0) {
                    const bookObj = userBooks.find(b => b.id == bookId);
                    if (bookObj) {
                        this.currentBook = bookObj;
                        this.activeTab = 'notebook-detail';
                        this.renderTabContent(document.querySelector('#student-tab-content'));
                        return;
                    }
                }

                // If not created yet or clicked by subject, open note creation canvas for that subject
                StudentView.openSubjectNoteCreation(subjectName);
            });
        });
    },

    async loadAndRenderConnections(container) {
        const target = container.querySelector('#student-connections-container');
        if (!target) return;

        try {
            const data = await API.getConnections();
            const parents = data.parents || [];
            const teachers = data.teachers || [];

            if (!parents.length && !teachers.length) {
                target.innerHTML = `
                    <div class="glass-card" style="grid-column: 1 / -1; padding: 24px; text-align: center; color: #6B7280;">
                        <p style="margin: 0; font-size: 13.5px; font-weight: 600;">No active connections yet</p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #9CA3AF;">
                            Share your Student Code (<strong>${data.studentCode || 'STU-101'}</strong>) or click "+ Connect" to link with parents & teachers.
                        </p>
                    </div>
                `;
                return;
            }

            let html = '';

            // Parents
            parents.forEach(p => {
                html += `
                    <div class="glass-card" style="padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; border-left: 4px solid #10B981; background: #FFFFFF;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800;">
                                👨‍👩‍👧
                            </div>
                            <div>
                                <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #151A2D;">${p.name || 'Parent'}</h4>
                                <div style="font-size: 11.5px; color: #6B7280; margin-top: 1px;">Parent • Code: ${p.parentCode || 'PAR-001'}</div>
                            </div>
                        </div>
                        <span class="glass-badge" style="background: #ECFDF5; color: #059669; font-size: 11px; font-weight: 700;">
                            Connected ✓
                        </span>
                    </div>
                `;
            });

            // Teachers
            teachers.forEach(t => {
                html += `
                    <div class="glass-card" style="padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; border-left: 4px solid #6366F1; background: #FFFFFF;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: #EEF2FF; color: #4F46E5; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800;">
                                👩‍🏫
                            </div>
                            <div>
                                <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #151A2D;">${t.name || 'Teacher'}</h4>
                                <div style="font-size: 11.5px; color: #6B7280; margin-top: 1px;">${t.subject || 'General'} • Code: ${t.teacherCode || 'TCH-001'}</div>
                            </div>
                        </div>
                        <span class="glass-badge" style="background: #EEF2FF; color: #4F46E5; font-size: 11px; font-weight: 700;">
                            Connected ✓
                        </span>
                    </div>
                `;
            });

            target.innerHTML = html;
        } catch (err) {
            target.innerHTML = `<div class="glass-card" style="color: var(--status-danger); font-size: 12px; padding: 12px;">Unable to load connections: ${err.message}</div>`;
        }
    },

    showConnectParentModal() {
        const modalHtml = `
            <div class="glass-card" style="width: 100%; max-width: 420px; padding: 26px;">
                <h3 style="font-size: 19px; font-weight: 800; margin-bottom: 6px; color: #151A2D;">Connect Parent</h3>
                <p style="font-size: 13px; color: #6B7280; margin-bottom: 18px;">
                    Enter the Parent Code (e.g. PAR-RAMESH-001) provided by your parent.
                </p>
                <form id="form-connect-parent" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="display: block; font-size: 12.5px; font-weight: 700; color: #374151; margin-bottom: 6px;">Parent Code</label>
                        <input type="text" id="input-parent-code" class="glass-input" placeholder="e.g. PAR-RAMESH-001" style="text-transform: uppercase;" required autofocus>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
                        <button type="button" class="glass-btn" onclick="App.closeModal()">Cancel</button>
                        <button type="submit" class="glass-btn glass-btn-primary bouncy-btn">Connect Parent</button>
                    </div>
                </form>
            </div>
        `;
        App.showModal(modalHtml);

        document.getElementById('form-connect-parent')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const parentCode = document.getElementById('input-parent-code').value.trim().toUpperCase();
            try {
                // If firebase auth is active
                if (window.firebaseAuthService && App.currentUser) {
                    try {
                        await window.firebaseAuthService.connectStudentToParent(App.currentUser.uid, parentCode);
                    } catch(fbErr) {
                        console.warn('[StudentView] Firebase cloud connect warning:', fbErr.message);
                    }
                }

                const res = await API.connectParent(parentCode);
                App.toast(res.message || 'Parent Connected ✓', 'success');
                App.closeModal();
                const container = document.getElementById('student-tab-content');
                if (container) this.loadAndRenderConnections(container);
            } catch (err) {
                App.toast(err.message || 'Failed to connect parent', 'danger');
            }
        });
    },

    showConnectTeacherModal() {
        const modalHtml = `
            <div class="glass-card" style="width: 100%; max-width: 440px; padding: 26px;">
                <h3 style="font-size: 19px; font-weight: 800; margin-bottom: 6px; color: #151A2D;">Connect Subject Teacher</h3>
                <p style="font-size: 13px; color: #6B7280; margin-bottom: 18px;">
                    Enter your Teacher's Code (e.g. TCH-PRIYA-MATH-01) to allow them to review your homework and notes.
                </p>
                <form id="form-connect-teacher" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="display: block; font-size: 12.5px; font-weight: 700; color: #374151; margin-bottom: 6px;">Teacher Code</label>
                        <input type="text" id="input-teacher-code" class="glass-input" placeholder="e.g. TCH-PRIYA-MATH-01" style="text-transform: uppercase;" required autofocus>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
                        <button type="button" class="glass-btn" onclick="App.closeModal()">Cancel</button>
                        <button type="submit" class="glass-btn glass-btn-secondary bouncy-btn">Connect Teacher</button>
                    </div>
                </form>
            </div>
        `;
        App.showModal(modalHtml);

        document.getElementById('form-connect-teacher')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const teacherCode = document.getElementById('input-teacher-code').value.trim().toUpperCase();
            try {
                if (window.firebaseAuthService && App.currentUser) {
                    try {
                        await window.firebaseAuthService.connectStudentToTeacher(App.currentUser.uid, teacherCode);
                    } catch(fbErr) {
                        console.warn('[StudentView] Firebase cloud connect warning:', fbErr.message);
                    }
                }

                const res = await API.connectTeacher(teacherCode);
                App.toast(res.message || 'Teacher Connected ✓', 'success');
                App.closeModal();
                const container = document.getElementById('student-tab-content');
                if (container) this.loadAndRenderConnections(container);
            } catch (err) {
                App.toast(err.message || 'Failed to connect teacher', 'danger');
            }
        });
    },

    toggleOtherInfo() {
        const container = document.getElementById('other-info-container');
        if (container) {
            container.classList.toggle('open');
        }
    },

    openSubjectHub(subjectId) {
        this.activeSubjectId = subjectId;
        this.activeTab = 'subject-detail';
        this.activeSubjectSubTab = 'textbook';
        this.renderTabContent(document.querySelector('#student-tab-content'));
    },

    openSubjectChapterReader(subjectId, chapterId) {
        this.activeStudySubjectId = subjectId;
        this.activeStudyChapterId = chapterId;
        this.activeTab = 'study';
        this.renderTabContent(document.querySelector('#student-tab-content'));
    },

    async openBookById(bookId) {
        try {
            const res = await API.getBooks();
            const allBooks = res.books || [];
            const bookObj = allBooks.find(b => b.id == bookId);
            if (bookObj) {
                this.currentBook = bookObj;
                this.activeTab = 'notebook-detail';
                this.renderTabContent(document.querySelector('#student-tab-content'));
            }
        } catch (e) {
            this.switchTab('bookshelf');
        }
    },

    // ─────────────────────────────────────────────────────────
    // 2. MY CLASSES SCREEN (Pixel-perfect matching reference image)
    // ─────────────────────────────────────────────────────────
    async renderClasses(container) {
        const activeTab = this.classesSubTab || 'all';

        const classesList = [
            {
                id: 'physics',
                name: 'Physics',
                teacher: 'Mr. Ravi Kumar',
                chapters: 12,
                lessons: 45,
                progress: 73,
                iconSvg: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#8864F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-30 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(90 12 12)"/></svg>`,
                bgColor: '#F3E8FF',
                subjectId: 'science'
            },
            {
                id: 'math',
                name: 'Mathematics',
                teacher: 'Ms. Neha Sharma',
                chapters: 16,
                lessons: 60,
                progress: 60,
                iconSvg: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#0284C7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14l3 4 5-14h8"/><path d="M14 12l5 6"/><path d="M19 12l-5 6"/></svg>`,
                bgColor: '#E0F2FE',
                subjectId: 'math'
            },
            {
                id: 'chemistry',
                name: 'Chemistry',
                teacher: 'Mr. Arjun Verma',
                chapters: 14,
                lessons: 50,
                progress: 40,
                iconSvg: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#0D9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V2h-4z"/><line x1="8.5" y1="2" x2="15.5" y2="2"/><line x1="7" y1="16" x2="17" y2="16"/></svg>`,
                bgColor: '#CCFBF1',
                subjectId: 'science'
            },
            {
                id: 'biology',
                name: 'Biology',
                teacher: 'Ms. Pooja Singh',
                chapters: 10,
                lessons: 35,
                progress: 30,
                iconSvg: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/><path d="M12 18a4 4 0 0 0 4-4c0-2-4-6-4-6s-4 4-4 6a4 4 0 0 0 4 4z" fill="#EA580C"/></svg>`,
                bgColor: '#FFEDD5',
                subjectId: 'science'
            },
            {
                id: 'english',
                name: 'English',
                teacher: 'Ms. Sneha Iyer',
                chapters: 8,
                lessons: 20,
                progress: 80,
                iconSvg: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 12M11 8L5 20M3 16h10M14 4h7M17.5 4v16"/></svg>`,
                bgColor: '#FFE4E6',
                subjectId: 'english'
            }
        ];

        container.innerHTML = `
            <div class="my-classes-page-wrapper">
                <!-- Top Header Row -->
                <div class="classes-top-header">
                    <div class="classes-header-left">
                        <button class="btn-back-chevron bouncy-btn" onclick="App.goToStudentTab('home')">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <h1 class="classes-header-title">My Classes</h1>
                    </div>
                    <button class="btn-join-class-pill bouncy-btn" onclick="StudentView.showJoinClassModal()">
                        <span style="font-size: 16px; font-weight: 700;">+</span>
                        <span>Join Class</span>
                    </button>
                </div>

                <!-- Horizontal Tabs Bar (All Classes / Joined) -->
                <div class="classes-tabs-container">
                    <div class="classes-tabs-row">
                        <button class="classes-tab-item ${activeTab === 'all' ? 'active' : ''}" data-tab="all">
                            All Classes
                        </button>
                        <button class="classes-tab-item ${activeTab === 'joined' ? 'active' : ''}" data-tab="joined">
                            Joined
                        </button>
                    </div>
                </div>

                <!-- Classes Rectangular Cards List -->
                <div class="classes-cards-vertical-list">
                    ${classesList.map(c => `
                        <div class="class-exact-card bouncy-btn" data-subject-id="${c.subjectId}">
                            <!-- Left Group: Icon + Titles -->
                            <div class="class-exact-left">
                                <div class="class-exact-icon-box" style="background: ${c.bgColor};">
                                    ${c.iconSvg}
                                </div>
                                <div class="class-exact-text-group">
                                    <h3 class="class-exact-name">${c.name}</h3>
                                    <div class="class-exact-teacher">Teacher: ${c.teacher}</div>
                                    <div class="class-exact-meta">
                                        <span class="meta-item">
                                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                                            <span>${c.chapters} Chapters</span>
                                        </span>
                                        <span class="meta-dot">•</span>
                                        <span class="meta-item">
                                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                                            <span>${c.lessons} Lessons</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Right Group: Percentage, Progress Bar & Chevron -->
                            <div class="class-exact-right">
                                <div class="class-exact-progress-group">
                                    <div class="class-exact-percentage">${c.progress}%</div>
                                    <div class="class-exact-progress-track">
                                        <div class="class-exact-progress-fill" style="width: ${c.progress}%;"></div>
                                    </div>
                                </div>
                                <div class="class-exact-chevron">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('.classes-tab-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.classesSubTab = e.currentTarget.dataset.tab;
                this.renderClasses(container);
            });
        });

        container.querySelectorAll('.class-exact-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const subjectId = e.currentTarget.dataset.subjectId;
                this.activeSubjectId = subjectId;
                this.activeTab = 'subject-detail';
                this.renderTabContent(document.querySelector('#student-tab-content'));
            });
        });
    },

    showJoinClassModal() {
        App.showModal(`
            <div class="modal-card" style="max-width: 480px;">
                <div class="modal-header">
                    <h3 class="modal-title">📚 Join a New Class</h3>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>
                <p style="color: var(--text-secondary); font-size: 14px; margin: 8px 0 16px;">
                    Enter your teacher's 6-character class invite code to enroll in additional academic modules:
                </p>
                <form id="form-join-class" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">Class Enrollment Code</label>
                        <input type="text" id="input-class-code" class="glass-input" placeholder="e.g. CLS-802" required style="font-size: 16px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; margin-top: 4px;">
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted); background: var(--paper-bg-secondary); padding: 10px; border-radius: var(--radius-sm);">
                        💡 Demo codes available: <strong>MATH-8</strong>, <strong>SCI-8</strong>, <strong>ROBOTICS-8</strong>
                    </div>
                    <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; font-weight: 700;">
                        Join Class & Sync Curriculum
                    </button>
                </form>
            </div>
        `);

        const form = document.getElementById('form-join-class');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const code = document.getElementById('input-class-code').value.trim();
                App.closeModal();
                App.toast(`Successfully enrolled in class ${code}! 🎉`, 'info');
                this.renderClasses(document.querySelector('#student-tab-content'));
            });
        }
    },

    async renderSubjects(container) {
        return this.renderClasses(container);
    },

    // ─────────────────────────────────────────────────────────
    // 3. INDIVIDUAL SUBJECT DETAILS SCREEN (Clean, Structured)
    // ─────────────────────────────────────────────────────────
    async renderSubjectDetail(container) {
        const activeClass = AcademicData.selectedClass || (App.currentUser ? App.currentUser.class_grade : 8);
        const subject = AcademicData.getSubjectById(this.activeSubjectId, activeClass);
        const allTenLessons = AcademicData.getSubjectTenLessons(subject.name, activeClass);

        const completedCount = allTenLessons.filter(l => l.status === 'completed').length;
        const totalLessons = allTenLessons.length;
        const progressPercent = Math.round((completedCount / totalLessons) * 100);
        const activeLesson = allTenLessons.find(l => l.status === 'in-progress') || allTenLessons[0];
        const remainingCount = totalLessons - completedCount;

        container.innerHTML = `
            <div class="subject-page-clean-wrapper">
                
                <!-- 1. SUBJECT HEADER -->
                <div class="subject-clean-header-card">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="class-exact-icon-box" style="background: ${subject.color ? subject.color + '18' : '#F1EDFF'}; color: ${subject.color || '#8864F3'}; font-size: 28px; width: 56px; height: 56px;">
                            ${subject.icon || '📚'}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h2 style="font-size: 24px; font-weight: 800; color: #151A2D; margin: 0;">${subject.name}</h2>
                                <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-weight: 800; font-size: 11px;">
                                    Class ${activeClass}
                                </span>
                            </div>
                            <p style="font-size: 13px; color: #6B7280; margin-top: 3px;">
                                Academic Year 2026 • Teacher: <strong>${subject.teacher || 'Ms. Neha Sharma'}</strong> • Last Studied: <strong>Today</strong>
                            </p>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button id="btn-back-classes" class="glass-btn glass-btn-secondary bouncy-btn">
                            <span>← Back to My Classes</span>
                        </button>
                        <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.openSubjectNoteCreation('${subject.name}')">
                            <span>✍️ Open Notes</span>
                        </button>
                    </div>
                </div>

                <!-- 2. CONTINUE LEARNING CALLOUT -->
                <div class="continue-learning-highlight-card">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="width: 42px; height: 42px; background: #8864F3; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800;">
                            ▶
                        </div>
                        <div>
                            <div style="font-size: 11px; font-weight: 800; color: #8864F3; text-transform: uppercase; letter-spacing: 0.5px;">
                                Currently Studying • Lesson ${activeLesson.number} of ${totalLessons}
                            </div>
                            <h3 style="font-size: 16px; font-weight: 800; color: #151A2D; margin: 2px 0 0;">${activeLesson.title}</h3>
                            <div style="font-size: 12px; color: #6B7280;">${activeLesson.summary}</div>
                        </div>
                    </div>

                    <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.openLessonReader('${subject.id}', ${activeLesson.number})">
                        <span>Continue Learning →</span>
                    </button>
                </div>

                <!-- 3. SYLLABUS PROGRESS SECTION -->
                <div class="syllabus-progress-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div>
                            <h3 style="font-size: 16px; font-weight: 800; color: #151A2D; margin: 0;">${subject.name} Syllabus Progress</h3>
                            <span style="font-size: 12px; color: #6B7280; font-weight: 600;">${completedCount} of ${totalLessons} Lessons Completed</span>
                        </div>
                        <span style="font-size: 16px; font-weight: 900; color: #8864F3;">${progressPercent}% Completed</span>
                    </div>

                    <div class="progress-track" style="height: 8px; background: #ECEAF2; margin-top: 8px;">
                        <div class="progress-fill" style="width: ${progressPercent}%; background: #8864F3;"></div>
                    </div>
                </div>

                <!-- 4. COMPLETE LESSON LIST (Clean Timeline / Vertical List) -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="font-size: 16px; font-weight: 800; color: #151A2D; margin: 0;">Complete Syllabus Lessons (${totalLessons})</h3>
                        <span style="font-size: 11.5px; color: #6B7280;">Click any lesson to read textbook & practice</span>
                    </div>

                    <div class="lesson-timeline-list">
                        ${allTenLessons.map(lesson => {
                            let statusHtml = '';
                            let rowClass = '';

                            if (lesson.status === 'completed') {
                                statusHtml = `<span class="lesson-status-pill completed">✓ Completed</span>`;
                            } else if (lesson.status === 'in-progress') {
                                statusHtml = `<span class="lesson-status-pill in-progress">● Currently Learning</span>`;
                                rowClass = 'active-learning';
                            } else {
                                statusHtml = `<span class="lesson-status-pill not-started">○ Not Started</span>`;
                            }

                            const numFormatted = lesson.number < 10 ? `0${lesson.number}` : `${lesson.number}`;

                            return `
                                <div class="lesson-timeline-row ${rowClass}" onclick="StudentView.openLessonReader('${subject.id}', ${lesson.number})">
                                    <div style="display: flex; align-items: center; gap: 16px; min-width: 0;">
                                        <span class="lesson-num-badge">${numFormatted}</span>
                                        <div>
                                            <div style="font-size: 14px; font-weight: 800; color: #151A2D;">${lesson.title}</div>
                                            <div style="font-size: 11.5px; color: #6B7280; margin-top: 1px;">${lesson.summary}</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 14px; flex-shrink: 0;">
                                        ${statusHtml}
                                        <span style="font-size: 12px; font-weight: 700; color: #8864F3;">Read →</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 5. SUBJECT QUICK INFORMATION SUMMARY -->
                <div class="subject-clean-header-card">
                    <div style="width: 100%;">
                        <h4 style="font-size: 13.5px; font-weight: 800; color: #6B7280; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
                            Subject Overview Stats
                        </h4>
                        <div class="subject-quick-stats-grid">
                            <div class="progress-quick-item">
                                <span class="progress-quick-label">Total Lessons</span>
                                <div class="progress-quick-value">${totalLessons}</div>
                            </div>
                            <div class="progress-quick-item">
                                <span class="progress-quick-label">Completed</span>
                                <div class="progress-quick-value" style="color: #059669;">${completedCount}</div>
                            </div>
                            <div class="progress-quick-item">
                                <span class="progress-quick-label">Remaining</span>
                                <div class="progress-quick-value" style="color: #D97706;">${remainingCount}</div>
                            </div>
                            <div class="progress-quick-item">
                                <span class="progress-quick-label">Progress</span>
                                <div class="progress-quick-value" style="color: #8864F3;">${progressPercent}%</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;

        container.querySelector('#btn-back-classes').addEventListener('click', () => {
            this.activeTab = 'classes';
            this.renderTabContent(document.querySelector('#student-tab-content'));
        });
    },

    openLessonReader(subjectId, lessonNumber) {
        this.activeStudySubjectId = subjectId;
        this.activeStudyLessonNumber = lessonNumber;
        this.activeTab = 'study';
        this.renderTabContent(document.querySelector('#student-tab-content'));
    },

    async renderSubjectSubTabContent(subArea, subject, subTab) {
        const chapters = subject.chapters || [];
        const firstChapter = chapters[0] || {};

        if (subTab === 'textbook') {
            subArea.innerHTML = `
                <div style="display: grid; grid-template-columns: 280px 1fr; gap: 24px;">
                    <!-- Chapter List -->
                    <div class="glass-card" style="padding: 18px; height: max-content;">
                        <h4 style="font-size: 15px; font-weight: 800; margin-bottom: 12px; color: var(--text-muted); text-transform: uppercase;">Chapters (${chapters.length})</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${chapters.map((ch, idx) => `
                                <button class="glass-btn glass-btn-sm ${idx === 0 ? 'glass-btn-primary' : 'glass-btn-secondary'}" style="justify-content: flex-start; text-align: left; padding: 12px; font-weight: 700; border-radius: var(--radius-sm);">
                                    <span>Ch ${ch.number}: ${ch.title}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Textbook Reading Surface -->
                    <div class="study-reader-box">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                            <div>
                                <span class="glass-badge glass-badge-accent">Chapter ${firstChapter.number || 1} • Read time: ${firstChapter.readTime || '15 min'}</span>
                                <h3 style="margin-top: 6px; font-size: 22px;">${firstChapter.title || 'Chapter Reading'}</h3>
                            </div>
                            <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.openSubjectNoteCreation('${subject.name}')">
                                <span>✍️ Take Notes on this Chapter</span>
                            </button>
                        </div>
                        ${firstChapter.textbookContent || '<p>No textbook content available.</p>'}
                    </div>
                </div>
            `;
        } else if (subTab === 'videos') {
            const videos = firstChapter.videos || [];
            subArea.innerHTML = `
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 16px;">🎥 Concept Video Lessons for ${subject.name}</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                        ${videos.map(v => `
                            <div class="glass-card interactive" style="padding: 18px; border-radius: var(--radius-md);" onclick="App.toast('Playing concept video: ${v.title}', 'info')">
                                <div style="height: 140px; background: linear-gradient(135deg, #1E293B, #334155); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: white; margin-bottom: 12px; position: relative;">
                                    <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px;">▶</div>
                                    <span style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); font-size: 11px; padding: 2px 6px; border-radius: 4px;">${v.duration}</span>
                                </div>
                                <h4 style="font-size: 16px; font-weight: 800; margin-bottom: 4px;">${v.title}</h4>
                                <p style="font-size: 13px; color: var(--text-secondary);">Instructor: ${v.instructor || 'SmartSlate Teacher'}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (subTab === 'notes') {
            // INTEGRATE WITH EXISTING NOTE SYSTEM FILTERED BY SUBJECT!
            const res = await API.getBooks();
            const allBooks = res.books || [];
            const matchingBooks = allBooks.filter(b => (b.subject || '').toLowerCase().includes((subject.name || '').toLowerCase()) || (b.title || '').toLowerCase().includes((subject.name || '').toLowerCase()));

            subArea.innerHTML = `
                <div class="glass-card" style="padding: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <h3 style="font-size: 20px; font-weight: 800;">✍️ My Notes for ${subject.name}</h3>
                            <p style="font-size: 13px; color: var(--text-secondary);">Handwritten canvas notes & pages linked with ${subject.name}</p>
                        </div>
                        <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.openSubjectNoteCreation('${subject.name}')">
                            <span>+ Create ${subject.name} Notebook</span>
                        </button>
                    </div>

                    ${matchingBooks.length === 0 ? `
                        <div class="glass-card" style="text-align: center; padding: 48px; background: rgba(255,255,255,0.4);">
                            <div style="font-size: 48px; margin-bottom: 12px;">📝</div>
                            <h3>No notes created for ${subject.name} yet</h3>
                            <p style="color: var(--text-secondary); margin: 8px 0 16px;">Create a notebook to draw diagrams, formulas, and write notes with the stylus.</p>
                            <button class="glass-btn glass-btn-primary" onclick="StudentView.openSubjectNoteCreation('${subject.name}')">Create ${subject.name} Notebook</button>
                        </div>
                    ` : `
                        <div class="bookshelf-grid">
                            ${matchingBooks.map(b => `
                                <div class="book-container bouncy-btn" data-id="${b.id}">
                                    <div class="book-cover ${b.cover_style || 'blue_linen'}">
                                        <div class="book-spine"></div>
                                        <div class="book-content">
                                            <span class="glass-badge" style="background: rgba(255,255,255,0.25); color: white; border: none;">${b.subject || subject.name}</span>
                                            <h3 class="book-title">${b.title}</h3>
                                            <div class="book-footer">
                                                <span>${b.note_count || 0} Pages</span>
                                                <span>Open Canvas →</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;

            subArea.querySelectorAll('.book-container').forEach(card => {
                card.addEventListener('click', (e) => {
                    const bookId = e.currentTarget.dataset.id;
                    const bookObj = allBooks.find(b => b.id == bookId);
                    e.currentTarget.classList.add('opening');
                    setTimeout(() => {
                        this.currentBook = bookObj;
                        this.activeTab = 'notebook-detail';
                        this.renderTabContent(document.querySelector('#student-tab-content'));
                    }, 280);
                });
            });
        } else if (subTab === 'solutions') {
            const solutions = firstChapter.solutions || [];
            subArea.innerHTML = `
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 16px;">💡 Step-by-Step Textbook Solutions</h3>
                    ${solutions.length === 0 ? '<p style="color: var(--text-muted);">Solutions will be available shortly.</p>' : ''}
                    ${solutions.map(sol => `
                        <div class="solution-card">
                            <h4 style="font-size: 16px; font-weight: 800; color: #1E293B; margin-bottom: 12px;">${sol.q}</h4>
                            <div style="background: rgba(0,0,0,0.02); padding: 14px 18px; border-radius: var(--radius-sm); border-left: 3px solid var(--status-success);">
                                <strong style="font-size: 13px; color: var(--status-success); text-transform: uppercase; margin-bottom: 6px; display: block;">Step-by-Step Working:</strong>
                                ${sol.steps.map((step, sIdx) => `
                                    <div class="solution-step">
                                        <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary); min-width: 24px;">Step ${sIdx + 1}:</span>
                                        <span style="font-size: 14px; color: var(--text-primary);">${step}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (subTab === 'practice') {
            const questions = firstChapter.practice || [];
            this.renderPracticeQuizUI(subArea, subject, firstChapter, questions);
        } else if (subTab === 'progress') {
            subArea.innerHTML = `
                <div class="glass-card" style="padding: 24px;">
                    <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 16px;">📊 Performance & Progress in ${subject.name}</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                        <div class="hero-stat-card" style="background: white; border: 1px solid var(--border-color);">
                            <span class="hero-stat-val" style="color: var(--accent-primary);">${subject.progress || 75}%</span>
                            <span class="hero-stat-lbl" style="color: var(--text-secondary);">Subject Mastery</span>
                        </div>
                        <div class="hero-stat-card" style="background: white; border: 1px solid var(--border-color);">
                            <span class="hero-stat-val" style="color: var(--status-success);">${chapters.length} / ${chapters.length}</span>
                            <span class="hero-stat-lbl" style="color: var(--text-secondary);">Chapters Completed</span>
                        </div>
                        <div class="hero-stat-card" style="background: white; border: 1px solid var(--border-color);">
                            <span class="hero-stat-val" style="color: #F59E0B;">92%</span>
                            <span class="hero-stat-lbl" style="color: var(--text-secondary);">Quiz Accuracy</span>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    openSubjectNoteCreation(subjectName) {
        this.showNewBookModalWithSubject(subjectName);
    },

    showNewBookModalWithSubject(subjectName) {
        const modalContainer = document.querySelector('#modal-container');
        modalContainer.innerHTML = `
            <div class="modal-overlay active">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 class="modal-title">Create ${subjectName} Notebook</h3>
                        <button class="modal-close" onclick="document.querySelector('#modal-container').innerHTML=''">×</button>
                    </div>
                    <form id="form-create-subject-book" style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Notebook Title</label>
                            <input type="text" id="new-book-title" class="glass-input" value="${subjectName} Notes" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Subject Category</label>
                            <input type="text" id="new-book-subject" class="glass-input" value="${subjectName}" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Cover Theme</label>
                            <select id="new-book-style" class="glass-select">
                                <option value="blue_linen">📘 Blue Linen</option>
                                <option value="sage_paper">📗 Sage Paper</option>
                                <option value="terracotta_leather">📙 Terracotta</option>
                                <option value="plum_velvet">📓 Plum Velvet</option>
                                <option value="amber_gold">📒 Amber Gold</option>
                            </select>
                        </div>
                        <button type="submit" class="glass-btn glass-btn-primary" style="margin-top: 12px;">Create & Open Notebook</button>
                    </form>
                </div>
            </div>
        `;

        modalContainer.querySelector('#form-create-subject-book').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = modalContainer.querySelector('#new-book-title').value;
            const subject = modalContainer.querySelector('#new-book-subject').value;
            const cover_style = modalContainer.querySelector('#new-book-style').value;

            try {
                const res = await API.createBook(title, subject, cover_style);
                modalContainer.innerHTML = '';
                App.toast('Notebook created successfully! Opening canvas...', 'info');
                this.currentBook = res.book;
                this.activeTab = 'notebook-detail';
                this.renderTabContent(document.querySelector('#student-tab-content'));
            } catch (err) {
                App.toast(err.message, 'danger');
            }
        });
    },

    // ─────────────────────────────────────────────────────────
    // 4. BOOKS / TEXTBOOK VIEW (Digital Bookshelf -> Syllabus -> Lesson Content)
    // ─────────────────────────────────────────────────────────
    async renderBooksView(container) {
        const activeClass = AcademicData.selectedClass || (App.currentUser ? App.currentUser.class_grade : 8);
        const activeFilter = this.booksFilter || 'all';

        const textbooksCatalog = [
            {
                id: 'math',
                subjectName: 'Mathematics',
                subtitle: 'NCERT Mathematics Class ' + activeClass,
                tag: 'math',
                chaptersCount: 10,
                progress: 60,
                completed: 6,
                gradient: 'linear-gradient(145deg, #1E40AF, #172554)',
                icon: '📐',
                coverArtSvg: `
                    <svg viewBox="0 0 160 120" width="130" height="90" fill="none">
                        <polygon points="35,25 95,20 125,75 65,80" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" fill="rgba(255,255,255,0.08)"/>
                        <polygon points="30,70 80,45 130,95 80,115" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="rgba(96,165,250,0.2)"/>
                        <circle cx="80" cy="65" r="28" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-dasharray="3 3"/>
                        <text x="35" y="45" fill="#93C5FD" font-size="11" font-family="monospace">f(x)=ax²+b</text>
                    </svg>
                `
            },
            {
                id: 'physics',
                subjectName: 'Physics',
                subtitle: 'Concepts & Applications',
                tag: 'physics',
                chaptersCount: 10,
                progress: 60,
                completed: 6,
                gradient: 'linear-gradient(145deg, #372A66, #211645)',
                icon: '⚡',
                coverArtSvg: `
                    <svg viewBox="0 0 160 120" width="130" height="90" fill="none">
                        <polygon points="65,25 20,95 110,95" stroke="rgba(255,255,255,0.7)" stroke-width="2" fill="rgba(255,255,255,0.06)"/>
                        <line x1="0" y1="75" x2="45" y2="60" stroke="#FFFFFF" stroke-width="2.5"/>
                        <line x1="45" y1="60" x2="75" y2="65" stroke="#FDE047" stroke-width="2" opacity="0.8"/>
                        <polygon points="75,65 160,35 160,85" fill="url(#prism-grad-books)" opacity="0.85"/>
                        <defs>
                            <linearGradient id="prism-grad-books" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#EF4444"/>
                                <stop offset="25%" stop-color="#F97316"/>
                                <stop offset="50%" stop-color="#EAB308"/>
                                <stop offset="75%" stop-color="#22C55E"/>
                                <stop offset="100%" stop-color="#3B82F6"/>
                            </linearGradient>
                        </defs>
                    </svg>
                `
            },
            {
                id: 'chemistry',
                subjectName: 'Chemistry',
                subtitle: 'Reactions & Periodic Trends',
                tag: 'chemistry',
                chaptersCount: 10,
                progress: 50,
                completed: 5,
                gradient: 'linear-gradient(145deg, #065F46, #022C22)',
                icon: '🧪',
                coverArtSvg: `
                    <svg viewBox="0 0 160 120" width="130" height="90" fill="none">
                        <circle cx="35" cy="40" r="6" fill="#34D399"/>
                        <circle cx="70" cy="25" r="6" fill="#34D399"/>
                        <circle cx="70" cy="65" r="6" fill="#34D399"/>
                        <circle cx="35" cy="75" r="6" fill="#34D399"/>
                        <line x1="35" y1="40" x2="70" y2="25" stroke="#34D399" stroke-width="2"/>
                        <line x1="70" y1="25" x2="70" y2="65" stroke="#34D399" stroke-width="2"/>
                        <line x1="70" y1="65" x2="35" y2="75" stroke="#34D399" stroke-width="2"/>
                        <line x1="35" y1="75" x2="35" y2="40" stroke="#34D399" stroke-width="2"/>
                        <path d="M115,35 L125,35 L125,50 L140,85 A4,4 0 0,1 136,90 L104,90 A4,4 0 0,1 100,85 L115,50 Z" stroke="#A7F3D0" stroke-width="2" fill="rgba(16,185,129,0.3)"/>
                        <path d="M104,80 L136,80 L140,85 L100,85 Z" fill="#34D399"/>
                    </svg>
                `
            },
            {
                id: 'biology',
                subjectName: 'Biology',
                subtitle: 'Living Organisms & Life Processes',
                tag: 'biology',
                chaptersCount: 10,
                progress: 60,
                completed: 6,
                gradient: 'linear-gradient(145deg, #C2410C, #7C2D12)',
                icon: '🌿',
                coverArtSvg: `
                    <svg viewBox="0 0 160 120" width="130" height="90" fill="none">
                        <path d="M80,15 C115,30 125,75 80,105 C35,75 45,30 80,15 Z" fill="#65A30D" stroke="#BEF264" stroke-width="2"/>
                        <line x1="80" y1="15" x2="80" y2="105" stroke="#BEF264" stroke-width="2"/>
                        <path d="M80,40 Q95,35 105,45 M80,55 Q98,52 108,62 M80,70 Q95,68 102,78" stroke="#BEF264" stroke-width="1.5"/>
                    </svg>
                `
            },
            {
                id: 'english',
                subjectName: 'English',
                subtitle: 'Language & Literature',
                tag: 'english',
                chaptersCount: 10,
                progress: 60,
                completed: 6,
                gradient: 'linear-gradient(145deg, #DB2777, #9D174D)',
                icon: '📖',
                coverArtSvg: `
                    <svg viewBox="0 0 160 120" width="130" height="90" fill="none">
                        <path d="M110,15 C95,25 70,55 55,95 C62,85 75,75 88,70 C100,65 115,40 110,15 Z" fill="#FCE7F3" stroke="#FFFFFF" stroke-width="1.5"/>
                        <line x1="110" y1="15" x2="50" y2="105" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="50" cy="105" r="2.5" fill="#FFFFFF"/>
                    </svg>
                `
            },
            {
                id: 'computer',
                subjectName: 'Computer Science',
                subtitle: 'Python, Algorithms & Data',
                tag: 'computer',
                chaptersCount: 10,
                progress: 60,
                completed: 6,
                gradient: 'linear-gradient(145deg, #5B21B6, #2E1065)',
                icon: '💻',
                coverArtSvg: `
                    <svg viewBox="0 0 160 120" width="130" height="90" fill="none">
                        <rect x="25" y="25" width="110" height="70" rx="8" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="rgba(0,0,0,0.3)"/>
                        <text x="36" y="52" fill="#A78BFA" font-size="12" font-family="monospace">&gt; python main.py</text>
                        <text x="36" y="72" fill="#34D399" font-size="11" font-family="monospace">class SmartSlate:</text>
                    </svg>
                `
            },
            {
                id: 'social',
                subjectName: 'Social Science',
                subtitle: 'History, Civics & Geography',
                tag: 'social',
                chaptersCount: 10,
                progress: 50,
                completed: 5,
                gradient: 'linear-gradient(145deg, #334155, #0F172A)',
                icon: '📜',
                coverArtSvg: `
                    <svg viewBox="0 0 160 120" width="130" height="90" fill="none">
                        <circle cx="80" cy="60" r="35" stroke="rgba(255,255,255,0.6)" stroke-width="1.8"/>
                        <ellipse cx="80" cy="60" rx="35" ry="14" stroke="rgba(255,255,255,0.4)" stroke-width="1.2"/>
                        <line x1="80" y1="25" x2="80" y2="95" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
                    </svg>
                `
            },
            {
                id: 'hindi',
                subjectName: 'Hindi',
                subtitle: 'स्पर्श एवं संचयन भाग-2',
                tag: 'hindi',
                chaptersCount: 10,
                progress: 60,
                completed: 6,
                gradient: 'linear-gradient(145deg, #991B1B, #450A0A)',
                icon: '🇮🇳',
                coverArtSvg: `
                    <svg viewBox="0 0 160 120" width="130" height="90" fill="none">
                        <rect x="35" y="25" width="90" height="70" rx="4" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" fill="rgba(255,255,255,0.06)"/>
                        <text x="50" y="65" fill="#FCA5A5" font-size="28" font-family="serif">साहित्य</text>
                    </svg>
                `
            }
        ];

        const filtered = activeFilter === 'all'
            ? textbooksCatalog
            : textbooksCatalog.filter(b => b.tag === activeFilter || b.id === activeFilter);

        container.innerHTML = `
            <div class="books-page-wrapper">
                
                <!-- Books Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <h1 style="font-size: 26px; font-weight: 800; color: #151A2D; margin: 0; display: flex; align-items: center; gap: 10px;">
                            <span>Textbooks</span>
                            <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-weight: 800; font-size: 11px;">
                                Class ${activeClass} Library
                            </span>
                        </h1>
                        <p style="font-size: 13.5px; color: #6B7280; margin-top: 4px;">
                            Select a textbook to view its syllabus and study chapters
                        </p>
                    </div>

                    <!-- Search Bar -->
                    <div class="books-search-bar-box" style="max-width: 380px;">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" placeholder="Search textbooks..." id="books-catalog-search">
                    </div>
                </div>

                <!-- Subject Filter Pills -->
                <div style="display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin-bottom: 22px; padding-bottom: 2px;">
                    <button class="subject-pill-btn ${activeFilter === 'all' ? 'active' : ''} bouncy-btn" data-filter="all">
                        <span>All Textbooks</span>
                    </button>
                    ${textbooksCatalog.map(b => `
                        <button class="subject-pill-btn ${activeFilter === b.tag ? 'active' : ''} bouncy-btn" data-filter="${b.tag}">
                            <span>${b.icon}</span>
                            <span>${b.subjectName}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- Digital Bookshelf — Square Textbook Cards Grid -->
                <div class="books-square-grid">
                    ${filtered.map(b => `
                        <div class="book-square-card bouncy-btn" data-subject-id="${b.id}" data-subject-name="${b.subjectName}">
                            <!-- Top Square Book Cover -->
                            <div class="book-square-cover" style="background: ${b.gradient};">
                                <div class="book-square-cover-header">
                                    <div class="book-square-cover-title">${b.subjectName}</div>
                                    <div class="book-square-cover-sub">CLASS ${activeClass} • TEXTBOOK</div>
                                </div>
                                <div class="book-square-cover-art">
                                    ${b.coverArtSvg}
                                </div>
                            </div>

                            <!-- Bottom Book Info -->
                            <div class="book-square-details">
                                <h3 class="book-square-title">
                                    <span>${b.subjectName}</span>
                                    <span style="font-size: 11px; font-weight: 700; color: #8864F3; background: #F1EDFF; padding: 2px 8px; border-radius: 6px;">
                                        ${b.progress}%
                                    </span>
                                </h3>
                                <div class="book-square-sub">${b.subtitle}</div>
                                <div class="book-square-meta">
                                    <span>${b.chaptersCount} Chapters</span>
                                    <span>Open Book →</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

            </div>
        `;

        container.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.booksFilter = e.currentTarget.dataset.filter;
                this.renderBooksView(container);
            });
        });

        container.querySelectorAll('.book-square-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const subjectId = e.currentTarget.dataset.subjectId;
                const subjectName = e.currentTarget.dataset.subjectName;
                this.openBookSyllabus(subjectId, subjectName);
            });
        });
    },

    openBookSyllabus(subjectId, subjectName) {
        this.activeSelectedBookId = subjectId;
        this.activeSelectedBookName = subjectName;
        this.switchTab('book-syllabus');
    },

    // ─────────────────────────────────────────────────────────
    // 4B. SELECTED BOOK PAGE — Displays ONLY that book's syllabus
    // ─────────────────────────────────────────────────────────
    async renderBookSyllabus(container) {
        const activeClass = AcademicData.selectedClass || (App.currentUser ? App.currentUser.class_grade : 8);
        const bookId = this.activeSelectedBookId || 'math';
        const bookName = this.activeSelectedBookName || 'Mathematics';

        const allTenLessons = AcademicData.getSubjectTenLessons(bookName, activeClass);
        const completedCount = allTenLessons.filter(l => l.status === 'completed').length;
        const totalLessons = allTenLessons.length;
        const progressPercent = Math.round((completedCount / totalLessons) * 100);

        container.innerHTML = `
            <div class="subject-page-clean-wrapper">
                
                <!-- Navigation & Selected Book Header -->
                <div class="subject-clean-header-card">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button id="btn-back-to-books" class="glass-btn glass-btn-secondary bouncy-btn">
                            <span>← Back to Books</span>
                        </button>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h2 style="font-size: 24px; font-weight: 800; color: #151A2D; margin: 0;">${bookName} Textbook</h2>
                                <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-weight: 800; font-size: 11px;">
                                    Class ${activeClass}
                                </span>
                            </div>
                            <p style="font-size: 13px; color: #6B7280; margin-top: 3px;">
                                <strong>${totalLessons} Chapters</strong> • ${completedCount} / ${totalLessons} Completed (${progressPercent}%)
                            </p>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.openSubjectNoteCreation('${bookName}')">
                            <span>✍️ Open Note Canvas</span>
                        </button>
                    </div>
                </div>

                <!-- Textbook Progress Card -->
                <div class="syllabus-progress-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div>
                            <h3 style="font-size: 16px; font-weight: 800; color: #151A2D; margin: 0;">${bookName} Syllabus Progress</h3>
                            <span style="font-size: 12px; color: #6B7280; font-weight: 600;">${completedCount} of ${totalLessons} Chapters Completed</span>
                        </div>
                        <span style="font-size: 16px; font-weight: 900; color: #8864F3;">${progressPercent}% Completed</span>
                    </div>

                    <div class="progress-track" style="height: 8px; background: #ECEAF2; margin-top: 8px;">
                        <div class="progress-fill" style="width: ${progressPercent}%; background: #8864F3;"></div>
                    </div>
                </div>

                <!-- Complete Syllabus for ONLY this book -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="font-size: 16px; font-weight: 800; color: #151A2D; margin: 0;">Syllabus (${totalLessons} Chapters)</h3>
                        <span style="font-size: 11.5px; color: #6B7280;">Select any chapter to read textbook content</span>
                    </div>

                    <div class="lesson-timeline-list">
                        ${allTenLessons.map(lesson => {
                            let statusHtml = '';
                            let rowClass = '';

                            if (lesson.status === 'completed') {
                                statusHtml = `<span class="lesson-status-pill completed">✓ Completed</span>`;
                            } else if (lesson.status === 'in-progress') {
                                statusHtml = `<span class="lesson-status-pill in-progress">● Currently Learning</span>`;
                                rowClass = 'active-learning';
                            } else {
                                statusHtml = `<span class="lesson-status-pill not-started">○ Not Started</span>`;
                            }

                            const numFormatted = lesson.number < 10 ? `0${lesson.number}` : `${lesson.number}`;

                            return `
                                <div class="lesson-timeline-row ${rowClass}" onclick="StudentView.openLessonContent('${bookId}', '${bookName}', ${lesson.number})">
                                    <div style="display: flex; align-items: center; gap: 16px; min-width: 0;">
                                        <span class="lesson-num-badge">${numFormatted}</span>
                                        <div>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <span style="font-size: 14px; font-weight: 800; color: #151A2D;">${lesson.title}</span>
                                                <span style="font-size: 11px; color: #9CA3AF; font-weight: 600;">Chapter ${lesson.number} • ${lesson.readTime}</span>
                                            </div>
                                            <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">${lesson.summary}</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 14px; flex-shrink: 0;">
                                        ${statusHtml}
                                        <span style="font-size: 12.5px; font-weight: 800; color: #8864F3;">Read →</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

            </div>
        `;

        const backBtn = container.querySelector('#btn-back-to-books');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.switchTab('books');
            });
        }
    },

    openLessonContent(bookId, bookName, lessonNumber) {
        this.activeSelectedBookId = bookId;
        this.activeSelectedBookName = bookName;
        this.activeSelectedLessonNumber = lessonNumber;
        this.switchTab('lesson-content');
    },

    // ─────────────────────────────────────────────────────────
    // 4C. LESSON CONTENT PAGE — Real Digital Textbook Reader
    // ─────────────────────────────────────────────────────────
    async renderLessonContent(container) {
        const activeClass = AcademicData.selectedClass || (App.currentUser ? App.currentUser.class_grade : 8);
        const bookId = this.activeSelectedBookId || 'math';
        const bookName = this.activeSelectedBookName || 'Mathematics';
        const lessonNumber = this.activeSelectedLessonNumber || 1;

        const allTenLessons = AcademicData.getSubjectTenLessons(bookName, activeClass);
        const currentLesson = allTenLessons.find(l => l.number === lessonNumber) || allTenLessons[0];

        container.innerHTML = `
            <div class="subject-page-clean-wrapper">
                
                <!-- Top Navigation & Controls -->
                <div class="subject-clean-header-card">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <button id="btn-back-to-syllabus" class="glass-btn glass-btn-secondary bouncy-btn">
                            <span>← Back to Syllabus</span>
                        </button>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h2 style="font-size: 20px; font-weight: 800; color: #151A2D; margin: 0;">
                                    ${bookName} Textbook
                                </h2>
                                <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-weight: 800; font-size: 11px;">
                                    Chapter ${currentLesson.number} of 10
                                </span>
                            </div>
                            <p style="font-size: 12.5px; color: #6B7280; margin-top: 2px;">
                                ${currentLesson.title} • Estimated Read Time: ${currentLesson.readTime}
                            </p>
                    </div>

                    <!-- Digital Textbook Annotation Tools Bar -->
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <button class="glass-btn glass-btn-secondary bouncy-btn" id="btn-tb-highlight" onclick="StudentView.toggleTextbookHighlight()" style="padding: 7px 12px; font-size: 12px;">
                            <span>🖍️ Highlight</span>
                        </button>
                        <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="StudentView.showAddTextbookNoteModal('${bookName}', '${currentLesson.title}')" style="padding: 7px 12px; font-size: 12px;">
                            <span>📝 Attach Note</span>
                        </button>
                        <button class="glass-btn glass-btn-secondary bouncy-btn" id="btn-tb-bookmark" onclick="StudentView.toggleTextbookBookmark(this)" style="padding: 7px 12px; font-size: 12px;">
                            <span>🔖 Bookmark</span>
                        </button>
                        <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.openSubjectNoteCreation('${bookName}')" style="padding: 7px 14px; font-size: 12px;">
                            <span>✍️ Canvas Notes</span>
                        </button>
                    </div>
                </div>

                <!-- Responsive 2-Column / Stacked Reader Layout -->
                <div class="textbook-reader-layout-grid">
                    
                    <!-- Left Column: Chapter Navigator -->
                    <div class="glass-card" style="padding: 16px; background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
                        <h4 style="font-size: 13px; font-weight: 800; margin-bottom: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
                            ${bookName} Chapters
                        </h4>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            ${allTenLessons.map(ch => `
                                <button class="glass-btn glass-btn-sm ${ch.number === currentLesson.number ? 'glass-btn-primary' : 'glass-btn-secondary'} study-chapter-item-btn" data-lesson-num="${ch.number}" style="justify-content: flex-start; text-align: left; padding: 10px 12px; border-radius: 8px;">
                                    <span style="font-weight: 800; opacity: 0.8; font-size: 11.5px; width: 22px;">0${ch.number}</span>
                                    <span style="font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ch.title}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Right Column: Interactive Reading Surface -->
                    <div class="study-reader-box" style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 28px 32px; box-shadow: 0 2px 10px rgba(21,26,45,0.02);">
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #ECEAF2; padding-bottom: 16px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <span class="glass-badge" style="background: #ECFDF5; color: #059669; font-weight: 800; font-size: 11px;">
                                    Chapter ${currentLesson.number} • Class ${activeClass} NCERT Curriculum
                                </span>
                                <h2 style="margin-top: 8px; font-size: 24px; font-weight: 900; color: #151A2D;">
                                    ${currentLesson.title}
                                </h2>
                                <p style="font-size: 14px; color: #6B7280; line-height: 1.6; margin-top: 6px;">
                                    ${currentLesson.summary}
                                </p>
                            </div>
                            <span style="font-size: 12px; font-weight: 700; color: #8864F3; background: #F1EDFF; padding: 4px 10px; border-radius: 6px;">
                                Page ${currentLesson.number * 14 + 1}
                            </span>
                        </div>

                        <!-- Core Textbook Concepts Content -->
                        <div class="chapter-rich-body" id="textbook-readable-content" style="font-size: 15px; line-height: 1.8; color: #374151;">
                            <div class="study-box info" style="background: #F9F7FF; border: 1.5px solid #DCD7F5; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
                                <h4 style="color: #8864F3; font-weight: 800; font-size: 15px; margin: 0 0 6px;">💡 Key Learning Objectives</h4>
                                <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #4B5563;">
                                    <li>Understand foundational definitions, standard derivations, and analytical methods.</li>
                                    <li>Apply key formulas to solve intermediate and advanced practice problems.</li>
                                    <li>Prepare rigorously for unit assessments and board examinations.</li>
                                </ul>
                            </div>

                            <h3 style="font-size: 18px; font-weight: 800; color: #151A2D; margin: 24px 0 10px;">1. Conceptual Overview & Core Theory</h3>
                            <p class="highlightable-para">
                                In this chapter, we explore how <strong>${currentLesson.title}</strong> forms a central part of the <strong>${bookName}</strong> curriculum. Every natural or physical system obeys fundamental governing relationships that can be expressed analytically.
                            </p>

                            <div class="study-box formula" style="background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
                                <strong style="color: #B45309; font-size: 14px;">📐 Key Formulas & Mathematical Relations:</strong>
                                <div style="font-family: 'Courier New', monospace; font-size: 14px; font-weight: 700; color: #92400E; margin-top: 6px;">
                                    • General Form: F(x, y) = 0 with verified continuity constraints.<br>
                                    • Rate of Change: Δy / Δx = k (Constant proportionality factor).<br>
                                    • Standard Invariant: A² + 2AB + B² = (A + B)².
                                </div>
                            </div>

                            <h3 style="font-size: 18px; font-weight: 800; color: #151A2D; margin: 24px 0 10px;">2. Guided Practice Problem & Step-by-Step Solution</h3>
                            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                                <strong style="color: #1E293B; font-size: 14px;">Example Problem 1:</strong>
                                <p style="font-size: 13.5px; color: #475569; margin: 6px 0 10px;" class="highlightable-para">
                                    Evaluate the standard parameter bounds for ${currentLesson.title} given initial conditions x₀ = 4 and boundary constraint k = 2.5.
                                </p>
                                <div style="border-top: 1px dashed #CBD5E1; padding-top: 10px; font-size: 13px; color: #059669; font-weight: 600;">
                                    ✓ Step 1: Identify given parameters (x₀ = 4, k = 2.5).<br>
                                    ✓ Step 2: Apply the governing relation: y = k · x₀ = 2.5 × 4 = 10.<br>
                                    ✓ Result: The boundary value is verified as 10.0 units.
                                </div>
                            </div>

                            <!-- Attached Sticky Notes List (If Any) -->
                            <div id="attached-textbook-notes-container" style="display: none; background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 10px; padding: 12px 16px; margin: 20px 0;">
                                <div style="font-size: 12px; font-weight: 800; color: #B45309; margin-bottom: 4px;">📝 Attached Study Note:</div>
                                <div id="attached-note-text" style="font-size: 13px; color: #78350F; font-style: italic;"></div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #ECEAF2; padding-top: 20px; margin-top: 24px;">
                                ${currentLesson.number > 1 ? `
                                    <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="StudentView.openLessonContent('${bookId}', '${bookName}', ${currentLesson.number - 1})">
                                        <span>← Previous Chapter</span>
                                    </button>
                                ` : '<div></div>'}

                                <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.openSubjectNoteCreation('${bookName}')">
                                    <span>✍️ Open Subject Canvas</span>
                                </button>

                                ${currentLesson.number < 10 ? `
                                    <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.openLessonContent('${bookId}', '${bookName}', ${currentLesson.number + 1})">
                                        <span>Next Chapter →</span>
                                    </button>
                                ` : '<div></div>'}
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        `;

        const backBtn = container.querySelector('#btn-back-to-syllabus');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.openBookSyllabus(bookId, bookName);
            });
        }

        container.querySelectorAll('.study-chapter-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lessonNum = parseInt(e.currentTarget.dataset.lessonNum);
                this.openLessonContent(bookId, bookName, lessonNum);
            });
        });
    },

    toggleTextbookHighlight() {
        const paras = document.querySelectorAll('.highlightable-para');
        paras.forEach(p => {
            p.classList.toggle('textbook-highlighted');
        });
        const isHl = paras[0] && paras[0].classList.contains('textbook-highlighted');
        App.toast(isHl ? 'Key concepts highlighted! 🖍️' : 'Highlights cleared.', 'info');
    },

    toggleTextbookBookmark(btn) {
        if (!btn) return;
        const isMarked = btn.classList.toggle('active-bookmark');
        btn.style.background = isMarked ? '#F1EDFF' : '';
        btn.style.color = isMarked ? '#8864F3' : '';
        App.toast(isMarked ? 'Page bookmarked! 🔖' : 'Bookmark removed.', 'info');
    },

    showAddTextbookNoteModal(bookName, chapterTitle) {
        const html = `
            <div class="modal-card" style="max-width: 460px; text-align: left;">
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title" style="font-size: 17px; font-weight: 800; color: #151A2D;">📝 Attach Personal Note</h3>
                        <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">${bookName} • ${chapterTitle}</div>
                    </div>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>

                <div style="margin-top: 14px;">
                    <textarea id="tb-personal-note-input" placeholder="e.g. Remember to review example 1 step-by-step for the Friday test..." style="width: 100%; height: 100px; padding: 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-family: inherit; font-size: 13.5px; resize: none;"></textarea>
                    
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
                        <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="App.closeModal()">
                            <span>Cancel</span>
                        </button>
                        <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.saveTextbookNote()">
                            <span>Save Note</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        App.showModal(html);
    },

    saveTextbookNote() {
        const text = document.getElementById('tb-personal-note-input')?.value || '';
        if (!text.trim()) {
            App.toast('Please write a note first.', 'warning');
            return;
        }
        App.closeModal();
        const noteContainer = document.getElementById('attached-textbook-notes-container');
        const noteTextEl = document.getElementById('attached-note-text');
        if (noteContainer && noteTextEl) {
            noteTextEl.textContent = `"${text}"`;
            noteContainer.style.display = 'block';
        }
        App.toast('Personal note attached to chapter! 📝', 'success');
    },

    // ─────────────────────────────────────────────────────────
    // 5. HOMEWORK VIEW (Class 6–10: Real Teacher-Assigned Tasks)
    // ─────────────────────────────────────────────────────────
    async renderHomeworkView(container) {
        const studentInfo = App.currentUser || AcademicData.studentProfile || { classNum: 8, section: 'Section A' };
        const activeClass = AcademicData.selectedClass || studentInfo.classNum || studentInfo.class || 8;
        const studentUid = studentInfo.uid || studentInfo.id;
        const studentClass = studentInfo.class_name || studentInfo.class || `Class ${activeClass}`;

        container.innerHTML = `<div style="text-align: center; padding: 50px;"><div class="spinner" style="margin: 0 auto;"></div><p style="color: #6B7280; font-size: 13px; margin-top: 10px;">Loading your teacher assignments...</p></div>`;

        // 1. Fetch from Local/Server API
        let apiAssignments = [];
        try {
            const res = await API.getAssignments();
            apiAssignments = res.assignments || [];
        } catch (e) {
            console.warn('[StudentView] API.getAssignments error:', e.message);
        }

        // 2. Fetch from Cloud Firestore
        let cloudAssignments = [];
        if (window.firebaseAuthService) {
            try {
                cloudAssignments = await window.firebaseAuthService.getStudentAssignments(studentUid, studentClass);
            } catch (e) {
                console.warn('[StudentView] getStudentAssignments cloud error:', e.message);
            }
        }

        // 3. Merge & Deduplicate
        const assignmentMap = new Map();
        [...apiAssignments, ...cloudAssignments].forEach(item => {
            const key = String(item.id || item.title);
            if (!assignmentMap.has(key)) {
                assignmentMap.set(key, {
                    id: item.id || `assign-${Date.now()}`,
                    subject: item.subject || 'Mathematics',
                    title: item.title || 'Homework Assignment',
                    description: item.description || 'Complete exercises assigned by your teacher.',
                    dueDate: item.due_at || item.dueDate || item.due_date || 'Due soon',
                    teacherName: item.teacher_name || item.teacherName || 'Teacher',
                    submissionStatus: item.submission_status || item.submissionStatus || 'pending',
                    grade: item.grade || null,
                    feedback: item.feedback || null,
                    submittedContent: item.submission_content || item.submissionContent || null
                });
            }
        });

        const allTasks = Array.from(assignmentMap.values());
        const pendingTasks = allTasks.filter(t => t.submissionStatus !== 'submitted' && t.submissionStatus !== 'graded');
        const completedTasks = allTasks.filter(t => t.submissionStatus === 'submitted' || t.submissionStatus === 'graded');

        const getSubjectStyle = (sub) => {
            const s = (sub || '').toLowerCase();
            if (s.includes('math')) return { color: '#6D28D9', bg: '#F3E8FF', icon: '📐' };
            if (s.includes('sci') || s.includes('phy') || s.includes('chem')) return { color: '#065F46', bg: '#D1FAE5', icon: '⚡' };
            if (s.includes('eng')) return { color: '#3730A3', bg: '#E0E7FF', icon: '📖' };
            if (s.includes('soc') || s.includes('hist')) return { color: '#C2410C', bg: '#FFEDD5', icon: '📜' };
            return { color: '#4F46E5', bg: '#EEF2FF', icon: '📝' };
        };

        container.innerHTML = `
            <div class="home-page-clean-wrapper">
                
                <!-- Homework Page Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <h1 style="font-size: 26px; font-weight: 800; color: #151A2D; margin: 0; display: flex; align-items: center; gap: 10px;">
                            <span>Homework & Assignments</span>
                            <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-weight: 800; font-size: 11px;">
                                ${studentClass} • ${studentInfo.section || 'Section A'}
                            </span>
                        </h1>
                        <p style="font-size: 13.5px; color: #6B7280; margin-top: 4px;">
                            Review teacher tasks, solve problems in your digital notebook, and submit work
                        </p>
                    </div>

                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="streak-badge" style="background: #FFFBEB; color: #B45309; border-color: #FDE68A;">
                            ⚡ ${pendingTasks.length} Pending Task${pendingTasks.length === 1 ? '' : 's'}
                        </span>
                    </div>
                </div>

                <!-- SECTION 1: PENDING WORK -->
                <div class="home-section-card" style="margin-bottom: 24px;">
                    <div class="home-section-header">
                        <div class="home-section-title-group">
                            <span style="font-size: 18px;">⏳</span>
                            <h3 class="home-section-title">Pending Homework Tasks</h3>
                        </div>
                        <span style="font-size: 12px; color: #D97706; font-weight: 700;">${pendingTasks.length} Active</span>
                    </div>

                    <div class="hw-compact-list">
                        ${pendingTasks.length === 0 ? `
                            <div style="text-align: center; padding: 40px 20px; color: #059669;">
                                <div style="font-size: 32px; margin-bottom: 8px;">🎉</div>
                                <div style="font-weight: 700; font-size: 15px;">All pending homework completed!</div>
                                <div style="font-size: 12.5px; color: #6B7280; margin-top: 4px;">No unsubmitted tasks from your connected teachers.</div>
                            </div>
                        ` : pendingTasks.map(task => {
                            const style = getSubjectStyle(task.subject);
                            return `
                                <div class="hw-compact-row" style="padding: 16px 20px;">
                                    <div style="display: flex; align-items: flex-start; gap: 14px; min-width: 0; flex: 1;">
                                        <div class="class-exact-icon-box" style="width: 42px; height: 42px; background: ${style.bg}; color: ${style.color}; flex-shrink: 0; font-size: 18px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                            ${style.icon}
                                        </div>
                                        <div style="min-width: 0; flex: 1;">
                                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                                <span class="hw-subject-badge" style="color: ${style.color}; font-weight: 800;">${task.subject}</span>
                                                <span class="hw-status-tag" style="background: #FEF3C7; color: #B45309; font-weight: 800;">
                                                    📅 Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Upcoming'}
                                                </span>
                                                <span style="font-size: 11.5px; color: #6B7280;">• Teacher: ${task.teacherName}</span>
                                            </div>
                                            <div class="hw-title-text" style="font-size: 15px; font-weight: 800; color: #151A2D; margin-top: 5px;">${task.title}</div>
                                            <div style="font-size: 13px; color: #4B5563; margin-top: 4px; line-height: 1.45;">${task.description}</div>
                                        </div>
                                    </div>

                                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-top: 6px; flex-wrap: wrap;">
                                        <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.openAssignmentWriting('${task.id}', '${encodeURIComponent(task.title)}', '${task.subject}', '${encodeURIComponent(task.description)}')" style="padding: 9px 16px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #4F46E5, #7C3AED);">
                                            <span>✍️ Write Assignment</span>
                                        </button>
                                        <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="StudentView.showDirectSubmitModal('${task.id}', '${encodeURIComponent(task.title)}', '${task.subject}', '${encodeURIComponent(task.description)}')" style="padding: 9px 14px; font-size: 13px; font-weight: 700;">
                                            <span>📤 Quick Submit</span>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- SECTION 2: COMPLETED & SUBMITTED WORK -->
                ${completedTasks.length > 0 ? `
                    <div class="home-section-card">
                        <div class="home-section-header">
                            <div class="home-section-title-group">
                                <span style="font-size: 18px;">✓</span>
                                <h3 class="home-section-title">Submitted & Evaluated Tasks</h3>
                            </div>
                            <span style="font-size: 12px; color: #059669; font-weight: 700;">✓ ${completedTasks.length} Completed</span>
                        </div>

                        <div class="hw-compact-list">
                            ${completedTasks.map(task => {
                                const style = getSubjectStyle(task.subject);
                                const isEvaluated = task.submissionStatus === 'evaluated' || task.submissionStatus === 'graded' || Boolean(task.grade);
                                return `
                                    <div class="hw-compact-row" style="padding: 16px 20px; background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                                        <div style="display: flex; align-items: flex-start; gap: 14px; min-width: 0; flex: 1;">
                                            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${isEvaluated ? '#ECFDF5' : '#FEF3C7'}; color: ${isEvaluated ? '#059669' : '#D97706'}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; flex-shrink: 0; margin-top: 2px;">
                                                ${isEvaluated ? '✓' : '⏳'}
                                            </div>
                                            <div style="min-width: 0; flex: 1;">
                                                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                                    <span class="hw-subject-badge" style="color: ${style.color}; font-weight: 800;">${task.subject}</span>
                                                    <span class="hw-status-tag" style="background: ${isEvaluated ? '#ECFDF5' : '#FEF3C7'}; color: ${isEvaluated ? '#059669' : '#B45309'}; font-weight: 800;">
                                                        ${isEvaluated ? 'Evaluated ✓' : 'Submitted (Awaiting Evaluation)'}
                                                    </span>
                                                </div>
                                                <div class="hw-title-text" style="font-size: 15px; font-weight: 800; color: #151A2D; margin-top: 4px;">${task.title}</div>
                                                
                                                ${isEvaluated ? `
                                                    <!-- Evaluated Marks & Teacher Feedback Card -->
                                                    <div style="margin-top: 10px; padding: 12px 14px; background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 8px;">
                                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                                            <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #166534;">Teacher Evaluation</span>
                                                            ${task.grade ? `<span class="glass-badge" style="background: #15803D; color: #FFF; font-weight: 900; font-size: 12px; padding: 2px 10px;">Marks: ${task.grade}</span>` : ''}
                                                        </div>
                                                        ${task.feedback ? `
                                                            <div style="font-size: 13px; color: #14532D; font-style: italic; margin-top: 4px; line-height: 1.45;">
                                                                💬 "${task.feedback}"
                                                            </div>
                                                        ` : ''}
                                                    </div>
                                                ` : `
                                                    <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
                                                        Submitted on ${task.submittedAt ? new Date(task.submittedAt).toLocaleString() : 'Recently'} • Awaiting teacher evaluation.
                                                    </div>
                                                `}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

            </div>
        `;
    },

    markTaskDone(taskId) {
        if (!this.pendingTasksList) return;
        this.pendingTasksList = this.pendingTasksList.filter(t => t.id !== taskId);
        App.toast('Task completed & moved to verified record! ✓', 'success');
        const container = document.querySelector('#student-tab-content');
        if (container) this.renderHomeworkView(container);
    },

    // ─────────────────────────────────────────────────────────
    // 6. TODAY'S SCHEDULE & TIMETABLE VIEW
    // ─────────────────────────────────────────────────────────
    async renderTimetableView(container) {
        const studentInfo = App.currentUser || AcademicData.studentProfile || { classNum: 8, section: 'Section A' };
        const activeClass = AcademicData.selectedClass || studentInfo.classNum || 8;

        const todayPeriods = [
            { period: 'Period 1', time: '08:30 – 09:20', subject: 'Mathematics', teacher: 'Mr. R. Sharma', room: 'Room 204', status: 'completed', icon: '📐', bg: '#F3E8FF', color: '#6D28D9' },
            { period: 'Period 2', time: '09:25 – 10:15', subject: 'Science', teacher: 'Dr. K. Rao', room: 'Lab 102', status: 'completed', icon: '🧪', bg: '#D1FAE5', color: '#065F46' },
            { period: 'Break', time: '10:15 – 10:35', subject: 'Morning Recess & Snack', teacher: 'Campus Grounds', room: 'Courtyard', status: 'break', icon: '☕', bg: '#FEF3C7', color: '#B45309' },
            { period: 'Period 3', time: '10:35 – 11:25', subject: 'English Language', teacher: 'Ms. A. Kapoor', room: 'Room 301', status: 'live', icon: '📖', bg: '#E0E7FF', color: '#3730A3' },
            { period: 'Period 4', time: '11:30 – 12:20', subject: 'Social Science', teacher: 'Mr. V. Verma', room: 'Room 208', status: 'upcoming', icon: '📜', bg: '#FFEDD5', color: '#C2410C' },
            { period: 'Period 5', time: '01:00 – 01:50', subject: 'Computer Science', teacher: 'Ms. S. Iyer', room: 'Lab B', status: 'upcoming', icon: '💻', bg: '#F3E8FF', color: '#4338CA' }
        ];

        container.innerHTML = `
            <div class="home-page-clean-wrapper">
                
                <!-- Timetable Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="StudentView.switchTab('home')" style="padding: 6px 12px; font-size: 12px;">
                                <span>← Back to Home</span>
                            </button>
                            <h1 style="font-size: 24px; font-weight: 800; color: #151A2D; margin: 0;">
                                Today's Schedule
                            </h1>
                        </div>
                        <p style="font-size: 13px; color: #6B7280; margin-top: 4px; margin-left: 2px;">
                            Class ${activeClass} • ${studentInfo.section} • Daily Period Timings & Faculty
                        </p>
                    </div>

                    <button class="glass-btn glass-btn-primary bouncy-btn" onclick="App.toast('Full 5-Day Weekly Timetable Loaded', 'info')">
                        <span>View Full Timetable (Mon–Fri) →</span>
                    </button>
                </div>

                <!-- Period Breakdown List -->
                <div class="home-section-card" style="padding: 20px 24px;">
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${todayPeriods.map(p => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 12px; background: ${p.status === 'live' ? '#F7F4FF' : '#FAFAFC'}; border: 1.5px solid ${p.status === 'live' ? '#8864F3' : '#ECEAF2'}; flex-wrap: wrap; gap: 10px;">
                                
                                <div style="display: flex; align-items: center; gap: 14px;">
                                    <div class="class-exact-icon-box" style="width: 42px; height: 42px; background: ${p.bg}; color: ${p.color}; font-size: 18px;">
                                        ${p.icon}
                                    </div>
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-size: 14.5px; font-weight: 800; color: #151A2D;">${p.subject}</span>
                                            ${p.status === 'live' ? `<span class="glass-badge" style="background: #ECFDF5; color: #059669; font-size: 10px; font-weight: 800;">● Ongoing Now</span>` : ''}
                                            ${p.status === 'completed' ? `<span class="glass-badge" style="background: #F3F4F6; color: #6B7280; font-size: 10px; font-weight: 700;">Completed</span>` : ''}
                                        </div>
                                        <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">
                                            ${p.teacher} • ${p.room}
                                        </div>
                                    </div>
                                </div>

                                <div style="text-align: right;">
                                    <div style="font-size: 13.5px; font-weight: 800; color: #151A2D; font-family: monospace;">${p.time}</div>
                                    <div style="font-size: 11px; color: #8864F3; font-weight: 700;">${p.period}</div>
                                </div>

                            </div>
                        `).join('')}
                    </div>
                </div>

            </div>
        `;
    },

    // ─────────────────────────────────────────────────────────
    // 7. ACADEMIC CALENDAR VIEW
    // ─────────────────────────────────────────────────────────
    async renderCalendarView(container) {
        const studentInfo = App.currentUser || AcademicData.studentProfile || { classNum: 8, section: 'Section A' };
        const activeClass = AcademicData.selectedClass || studentInfo.classNum || 8;

        // Clean academic calendar grid for August 2026
        const days = [
            { date: 1, day: 'Sat', isWeekend: true },
            { date: 2, day: 'Sun', isWeekend: true },
            { date: 3, day: 'Mon' },
            { date: 4, day: 'Tue', event: 'Unit Test', eventType: 'exam' },
            { date: 5, day: 'Wed' },
            { date: 6, day: 'Thu' },
            { date: 7, day: 'Fri', event: 'Science Lab Exam', eventType: 'exam' },
            { date: 8, day: 'Sat', isWeekend: true },
            { date: 9, day: 'Sun', isWeekend: true },
            { date: 10, day: 'Mon' },
            { date: 11, day: 'Tue' },
            { date: 12, day: 'Wed', event: 'Math AP Due', eventType: 'hw' },
            { date: 13, day: 'Thu' },
            { date: 14, day: 'Fri' },
            { date: 15, day: 'Sat', event: 'Independence Day', eventType: 'holiday', isWeekend: true },
            { date: 16, day: 'Sun', isWeekend: true },
            { date: 17, day: 'Mon' },
            { date: 18, day: 'Tue' },
            { date: 19, day: 'Wed' },
            { date: 20, day: 'Thu', event: 'Lab Submission', eventType: 'hw' },
            { date: 21, day: 'Fri' },
            { date: 22, day: 'Sat', isWeekend: true },
            { date: 23, day: 'Sun', isWeekend: true },
            { date: 24, day: 'Mon' },
            { date: 25, day: 'Tue', event: 'Term 2 Tests', eventType: 'exam' },
            { date: 26, day: 'Wed' },
            { date: 27, day: 'Thu' },
            { date: 28, day: 'Fri' },
            { date: 29, day: 'Sat', isWeekend: true },
            { date: 30, day: 'Sun', isWeekend: true },
            { date: 31, day: 'Mon' }
        ];

        container.innerHTML = `
            <div class="home-page-clean-wrapper">
                
                <!-- Calendar Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="StudentView.switchTab('home')" style="padding: 6px 12px; font-size: 12px;">
                                <span>← Back to Home</span>
                            </button>
                            <h1 style="font-size: 24px; font-weight: 800; color: #151A2D; margin: 0;">
                                Academic Calendar
                            </h1>
                        </div>
                        <p style="font-size: 13px; color: #6B7280; margin-top: 4px;">
                            Class ${activeClass} • ${studentInfo.section} • Important Dates, Tests, Events & Holidays
                        </p>
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="App.toast('Viewing July 2026', 'info')">‹ Prev</button>
                        <span style="font-weight: 800; font-size: 15px; color: #151A2D; padding: 0 8px;">August 2026</span>
                        <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="App.toast('Viewing September 2026', 'info')">Next ›</button>
                    </div>
                </div>

                <!-- Calendar Grid Container -->
                <div class="home-section-card" style="padding: 20px;">
                    
                    <!-- Weekday Header Row -->
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; text-align: center; font-size: 12px; font-weight: 800; color: #6B7280; margin-bottom: 10px;">
                        <span>MON</span>
                        <span>TUE</span>
                        <span>WED</span>
                        <span>THU</span>
                        <span>FRI</span>
                        <span style="color: #9CA3AF;">SAT</span>
                        <span style="color: #9CA3AF;">SUN</span>
                    </div>

                    <!-- Date Cells Grid -->
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
                        
                        <!-- Empty leading cells for August 2026 (Aug 1 is Sat, so 5 empty cells) -->
                        <div style="height: 72px; background: #FAFAFC; border-radius: 8px; opacity: 0.3;"></div>
                        <div style="height: 72px; background: #FAFAFC; border-radius: 8px; opacity: 0.3;"></div>
                        <div style="height: 72px; background: #FAFAFC; border-radius: 8px; opacity: 0.3;"></div>
                        <div style="height: 72px; background: #FAFAFC; border-radius: 8px; opacity: 0.3;"></div>
                        <div style="height: 72px; background: #FAFAFC; border-radius: 8px; opacity: 0.3;"></div>

                        ${days.map(d => `
                            <div style="min-height: 72px; background: ${d.isWeekend ? '#F9FAFB' : '#FFFFFF'}; border: 1px solid #ECEAF2; border-radius: 8px; padding: 6px 8px; display: flex; flex-direction: column; justify-content: space-between;">
                                <span style="font-size: 13px; font-weight: 800; color: ${d.date === 12 ? '#8864F3' : '#151A2D'};">
                                    ${d.date}
                                </span>
                                ${d.event ? `
                                    <span style="font-size: 10px; font-weight: 700; border-radius: 4px; padding: 2px 4px; line-height: 1.2; ${d.eventType === 'exam' ? 'background: #FEE2E2; color: #DC2626;' : d.eventType === 'holiday' ? 'background: #FEF3C7; color: #B45309;' : 'background: #F1EDFF; color: #8864F3;'}">
                                        ${d.event}
                                    </span>
                                ` : '<div></div>'}
                            </div>
                        `).join('')}
                    </div>

                </div>

            </div>
        `;
    },

    // ─────────────────────────────────────────────────────────
    // 8. ANNOUNCEMENTS & NOTICES VIEW
    // ─────────────────────────────────────────────────────────
    async renderAnnouncementsView(container) {
        const studentInfo = App.currentUser || AcademicData.studentProfile || { classNum: 8, section: 'Section A' };
        const activeClass = AcademicData.selectedClass || studentInfo.classNum || 8;

        const notices = [
            {
                id: 'notif-1',
                timeframe: 'Today',
                category: 'Assignment Notice',
                categoryColor: '#8864F3',
                categoryBg: '#F1EDFF',
                title: 'Mathematics Chapter 5 Assignment Posted',
                author: 'Mr. R. Sharma (Head of Mathematics)',
                message: 'All students in Class 8 Section B are required to complete workbook exercise 5.2 before tomorrow 5:00 PM.',
                badge: 'New',
                actionLabel: 'View Homework →',
                action: 'StudentView.switchTab("homework")'
            },
            {
                id: 'notif-2',
                timeframe: 'Yesterday',
                category: 'Unit Examination',
                categoryColor: '#DC2626',
                categoryBg: '#FEE2E2',
                title: 'Science Chapter 4 Lab Test on Friday',
                author: 'Dr. K. Rao (Senior Science Faculty)',
                message: 'Unit test covering Laws of Motion, Free Body Diagrams, and Ohm\'s Law verification will be held in Lab 102 during period 2.',
                badge: 'Important',
                actionLabel: 'View Schedule →',
                action: 'StudentView.switchTab("schedule")'
            },
            {
                id: 'notif-3',
                timeframe: 'Earlier this Week',
                category: 'School Event',
                categoryColor: '#059669',
                categoryBg: '#ECFDF5',
                title: 'Annual Science & Coding Exhibition 2026',
                author: 'Principal\'s Academic Office',
                message: 'Registrations are now open for secondary student prototype presentations. Contact your respective class teachers for guidelines.',
                badge: 'Notice',
                actionLabel: 'Read Details',
                action: 'App.toast("Exhibition guidelines sent to student email", "info")'
            }
        ];

        container.innerHTML = `
            <div class="home-page-clean-wrapper">
                
                <!-- Announcements Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <h1 style="font-size: 26px; font-weight: 800; color: #151A2D; margin: 0; display: flex; align-items: center; gap: 10px;">
                            <span>Announcements</span>
                            <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-weight: 800; font-size: 11px;">
                                Class ${activeClass} • ${studentInfo.section}
                            </span>
                        </h1>
                        <p style="font-size: 13.5px; color: #6B7280; margin-top: 4px;">
                            Official academic notifications, exam schedules and school circulars
                        </p>
                    </div>

                    <span class="glass-badge" style="background: #ECFDF5; color: #059669; font-weight: 800; font-size: 11.5px;">
                        ● 2 Unread Notices
                    </span>
                </div>

                <!-- Chronological Notices List -->
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${notices.map(n => `
                        <div class="home-section-card" style="padding: 20px 24px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span class="glass-badge" style="background: ${n.categoryBg}; color: ${n.categoryColor}; font-weight: 800; font-size: 11px;">
                                        ${n.category}
                                    </span>
                                    <span style="font-size: 11.5px; color: #6B7280; font-weight: 600;">${n.timeframe}</span>
                                </div>
                                <span class="glass-badge" style="background: #F3F4F6; color: #374151; font-weight: 700; font-size: 10.5px;">
                                    ${n.badge}
                                </span>
                            </div>

                            <h3 style="font-size: 16px; font-weight: 800; color: #151A2D; margin: 0 0 6px;">${n.title}</h3>
                            <div style="font-size: 12px; color: #8864F3; font-weight: 700; margin-bottom: 8px;">By ${n.author}</div>
                            <p style="font-size: 13.5px; color: #4B5563; line-height: 1.5; margin: 0 0 14px;">
                                ${n.message}
                            </p>

                            <button class="glass-btn glass-btn-primary bouncy-btn" onclick="${n.action}" style="padding: 8px 16px; font-size: 12px;">
                                <span>${n.actionLabel}</span>
                            </button>
                        </div>
                    `).join('')}
                </div>

            </div>
        `;
    },

    confirmWebSearchUnlock() {
        localStorage.setItem('smartslate_web_search_intro_seen', 'true');
        App.closeModal();
        
        // Hide badge on the floating search widget trigger if present
        const badge = document.getElementById('web-search-widget-badge');
        if (badge) badge.style.display = 'none';

        // Toggle the widget panel open
        this.toggleWebSearchWidget(true);
    },

    async renderWebSearchView(container, initialQuery = null) {
        const studentInfo = App.currentUser || AcademicData.studentProfile || { classNum: 8, section: 'Section A' };
        const activeClass = AcademicData.selectedClass || studentInfo.classNum || 8;

        this.currentWebQuery = initialQuery || this.currentWebQuery || '';

        const educationalSuggestions = [
            { query: 'Photosynthesis process and light reactions', tag: '🌱 Biology' },
            { query: 'Newton\'s three laws of motion and formula', tag: '⚡ Physics' },
            { query: 'Pythagorean theorem real life applications', tag: '📐 Mathematics' },
            { query: 'Indian Constitution preamble and fundamental rights', tag: '📜 Civics' },
            { query: 'Python variables data types and loops', tag: '💻 Computer Science' },
            { query: 'Structure of Atom Bohr model and electrons', tag: '🧪 Chemistry' }
        ];

        // Academic safe web database
        const webKnowledgeBase = [
            {
                id: 'res-photo-1',
                queryKeywords: ['photo', 'plant', 'chlorophyll', 'biology', 'light', 'leaf'],
                title: 'Photosynthesis — Biochemical Stages & Light-Independent Reactions',
                url: 'https://science.smartslate.org/biology/photosynthesis-stages',
                domain: 'science.smartslate.org',
                category: 'Biology • NCERT Class 8 Reference',
                snippet: 'Photosynthesis is the biological process by which green plants, algae, and cyanobacteria convert light energy into chemical energy stored in glucose. The process occurs inside chloroplasts containing chlorophyll pigments.',
                content: `
                    <h2>Understanding Photosynthesis</h2>
                    <p>Photosynthesis is the fundamental life-supporting chemical process that converts carbon dioxide and water into oxygen and glucose using sunlight energy.</p>
                    <h3>The Chemical Equation</h3>
                    <div style="background: #F8FAFC; padding: 14px; border-radius: 8px; border-left: 4px solid #8864F3; font-family: monospace; font-size: 14px; margin: 14px 0;">
                        6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ + 6O₂
                    </div>
                    <h3>Key Stages</h3>
                    <ul>
                        <li><strong>Light Reactions:</strong> Occur in the thylakoid membrane where solar photons split water molecules (photolysis), releasing O₂ and synthesizing ATP and NADPH.</li>
                        <li><strong>Calvin Cycle (Dark Reactions):</strong> Occurs in the stroma where ATP and NADPH fix atmospheric CO₂ into 3-carbon sugars (G3P) to produce glucose.</li>
                    </ul>
                    <h3>Significance for Ecosystems</h3>
                    <p>Without photosynthesis, atmospheric oxygen levels would deplete rapidly, collapsing the global carbon cycle and primary producer trophic levels.</p>
                `
            },
            {
                id: 'res-motion-1',
                queryKeywords: ['motion', 'newton', 'force', 'gravity', 'physics', 'inertia', 'acceleration'],
                title: 'Newton\'s Laws of Motion — Principles & Experimental Demonstrations',
                url: 'https://physics.smartslate.org/mechanics/newtons-three-laws',
                domain: 'physics.smartslate.org',
                category: 'Physics • Mechanics Standard',
                snippet: 'Sir Isaac Newton formulated three physical laws that established classical mechanics. They describe the fundamental relationship between a body and the forces acting upon it.',
                content: `
                    <h2>Newton's Three Laws of Motion</h2>
                    <p>Sir Isaac Newton published his three laws of motion in the <em>Philosophiae Naturalis Principia Mathematica</em> in 1687, which became the cornerstone of classical physics.</p>
                    <h3>1. First Law (Law of Inertia)</h3>
                    <p>An object remains at rest or in uniform motion in a straight line unless acted upon by an external net force: <code>ΣF = 0 ⟹ a = 0</code>.</p>
                    <h3>2. Second Law (Force and Acceleration)</h3>
                    <p>The rate of change of momentum of a body is directly proportional to the applied force and occurs in the direction of the force: <code>F = m × a</code>.</p>
                    <h3>3. Third Law (Action and Reaction)</h3>
                    <p>For every action, there is an equal and opposite reaction: <code>F_AB = -F_BA</code>.</p>
                `
            },
            {
                id: 'res-pythag-1',
                queryKeywords: ['pythagor', 'triangle', 'math', 'geometry', 'hypotenuse', 'square'],
                title: 'Pythagorean Theorem — Geometric Proofs & Coordinate Distance',
                url: 'https://math.smartslate.org/geometry/pythagorean-theorem',
                domain: 'math.smartslate.org',
                category: 'Mathematics • Euclidean Geometry',
                snippet: 'In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides: a² + b² = c². Essential for trigonometry, GPS navigation, and architecture.',
                content: `
                    <h2>The Pythagorean Theorem in Geometry</h2>
                    <p>The Pythagorean Theorem is one of the most celebrated theorems in mathematics, linking algebra with geometric space.</p>
                    <div style="background: #F8FAFC; padding: 14px; border-radius: 8px; border-left: 4px solid #8864F3; font-size: 16px; font-weight: bold; margin: 14px 0;">
                        a² + b² = c² (where c is the hypotenuse)
                    </div>
                    <h3>Common Pythagorean Triples</h3>
                    <p>Integer sets satisfying the relationship include: <strong>(3, 4, 5)</strong>, <strong>(5, 12, 13)</strong>, <strong>(8, 15, 17)</strong>, and <strong>(7, 24, 25)</strong>.</p>
                    <h3>Applications</h3>
                    <p>Used across surveying, computer graphics rendering, navigation systems (trilateration), and structural construction engineering.</p>
                `
            },
            {
                id: 'res-civics-1',
                queryKeywords: ['constitut', 'india', 'right', 'civic', 'democracy', 'law', 'preamble'],
                title: 'Constitution of India — Preamble, Fundamental Rights & Duties',
                url: 'https://civics.smartslate.org/polity/indian-constitution',
                domain: 'civics.smartslate.org',
                category: 'Social Science • Indian Polity',
                snippet: 'The Constitution of India is the supreme law of the democratic republic. Adopted on 26 November 1949, it guarantees Fundamental Rights including Right to Equality, Freedom of Speech, and Constitutional Remedies.',
                content: `
                    <h2>The Constitution of India</h2>
                    <p>Drafted under the chairmanship of Dr. B. R. Ambedkar, the Constitution is the longest written constitution of any sovereign country in the world.</p>
                    <h3>The Preamble</h3>
                    <p>Declares India to be a <strong>SOVEREIGN, SOCIALIST, SECULAR, DEMOCRATIC REPUBLIC</strong> securing Justice, Liberty, Equality, and Fraternity for all its citizens.</p>
                    <h3>Six Fundamental Rights (Part III)</h3>
                    <ul>
                        <li>Right to Equality (Articles 14–18)</li>
                        <li>Right to Freedom (Articles 19–22)</li>
                        <li>Right against Exploitation (Articles 23–24)</li>
                        <li>Right to Freedom of Religion (Articles 25–28)</li>
                        <li>Cultural and Educational Rights (Articles 29–30)</li>
                        <li>Right to Constitutional Remedies (Article 32)</li>
                    </ul>
                `
            },
            {
                id: 'res-python-1',
                queryKeywords: ['python', 'code', 'program', 'computer', 'variable', 'loop', 'function'],
                title: 'Python for Students — Syntax, Variables, Data Types & Control Flow',
                url: 'https://code.smartslate.org/python/student-fundamentals',
                domain: 'code.smartslate.org',
                category: 'Computer Science • Coding Standard',
                snippet: 'Python is a high-level, interpreted programming language known for clean readability. Perfect for beginners to understand algorithms, data structures, and computational thinking.',
                content: `
                    <h2>Introduction to Python Programming</h2>
                    <p>Python is an intuitive programming language widely utilized in artificial intelligence, web development, data analysis, and scientific computing.</p>
                    <h3>Basic Syntax & Variables</h3>
                    <pre style="background: #1E1B4B; color: #A5B4FC; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 13.5px;">
# Variable declaration
student_name = "Student"
grade_level = 8
is_enrolled = True

# Conditional logic
if grade_level >= 6:
    print(f"{student_name} unlocked Web Search!")
                    </pre>
                    <h3>Core Data Structures</h3>
                    <p>Lists <code>[1, 2, 3]</code>, Tuples <code>(10, 20)</code>, Dictionaries <code>{"subject": "Math"}</code>, and Sets <code>{1, 2}</code>.</p>
                `
            },
            {
                id: 'res-chem-1',
                queryKeywords: ['atom', 'chem', 'electron', 'bohr', 'proton', 'matter', 'periodic'],
                title: 'Structure of the Atom — Subatomic Particles & Electronic Configuration',
                url: 'https://chemistry.smartslate.org/atomic-structure/bohr-model',
                domain: 'chemistry.smartslate.org',
                category: 'Chemistry • Atomic Theory',
                snippet: 'Atoms are the fundamental building blocks of all matter. They consist of a dense positively charged nucleus (protons and neutrons) surrounded by negatively charged electrons in discrete energy shells.',
                content: `
                    <h2>Atomic Structure and Electron Shells</h2>
                    <p>From Dalton's atomic theory to J.J. Thomson, Rutherford, and Niels Bohr, our understanding of atomic architecture has evolved through experimental physics.</p>
                    <h3>Subatomic Particles</h3>
                    <ul>
                        <li><strong>Protons:</strong> Positively charged (+1), mass ≈ 1 amu, located in nucleus.</li>
                        <li><strong>Neutrons:</strong> Neutral charge (0), mass ≈ 1 amu, located in nucleus.</li>
                        <li><strong>Electrons:</strong> Negatively charged (-1), negligible mass, orbit in discrete quantum shells (K, L, M, N).</li>
                    </ul>
                    <h3>Bohr-Bury Scheme</h3>
                    <p>The maximum number of electrons in shell <em>n</em> is given by the formula <code>2n²</code> (K=2, L=8, M=18, N=32).</p>
                `
            }
        ];

        let matchedResults = [];
        if (this.currentWebQuery.trim()) {
            const q = this.currentWebQuery.toLowerCase();
            matchedResults = webKnowledgeBase.filter(item => {
                return item.title.toLowerCase().includes(q) ||
                       item.snippet.toLowerCase().includes(q) ||
                       item.category.toLowerCase().includes(q) ||
                       item.queryKeywords.some(k => q.includes(k));
            });
            if (matchedResults.length === 0) {
                matchedResults = webKnowledgeBase.slice(0, 3);
            }
        }

        const isSearchingState = Boolean(this.currentWebQuery.trim());
        const isWidget = container.id === 'web-search-widget-body';

        container.innerHTML = `
            <div class="web-search-page-wrapper">
                
                <!-- Search Page Top Header -->
                ${!isWidget ? `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="StudentView.switchTab('home')">
                        <span>← Back to Desk</span>
                    </button>

                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="glass-badge" style="background: #ECFDF5; color: #059669; font-weight: 800; font-size: 11px;">
                            🔒 SafeSearch Active
                        </span>
                        <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-weight: 800; font-size: 11px;">
                            Class ${activeClass} Web Access
                        </span>
                    </div>
                </div>
                ` : isSearchingState ? `
                <!-- Compact Widget Search Results Back Button -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px;">
                    <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="StudentView.executeWebSearch('')" style="padding: 6px 12px; font-size: 11.5px; border-radius: 8px;">
                        <span>← Search Again</span>
                    </button>
                    <span class="glass-badge" style="background: #ECFDF5; color: #059669; font-weight: 800; font-size: 10px; border: none; padding: 2px 8px; border-radius: 6px;">🔒 Safe Search</span>
                </div>
                ` : ''}

                ${!isSearchingState ? `
                    <!-- 1. Centered Search Engine Landing Page -->
                    <div class="web-search-hero-container">
                        
                        <div class="web-search-globe-icon">
                            🌐
                        </div>

                        <h1 style="font-size: 24px; font-weight: 900; color: #151A2D; margin: 0 0 6px 0; letter-spacing: -0.5px;">
                            Smart<span style="color: #8864F3;">Slate</span> Web Search
                        </h1>
                        <p style="font-size: 13px; color: #6B7280; margin: 0; max-width: 520px; line-height: 1.4;">
                            Explore safe academic resources, scientific encyclopedias, and educational references
                        </p>

                        <!-- Large Centered Search Bar -->
                        <div class="web-search-bar-centered-box">
                            <form id="main-web-search-form" onsubmit="event.preventDefault(); StudentView.executeWebSearch();">
                                <div class="web-search-main-input-wrapper">
                                    <span style="font-size: 16px; color: #9CA3AF;">🔍</span>
                                    <input type="text" id="web-search-input" class="web-search-main-input" placeholder="Search topics, formulas, science concepts..." autocomplete="off">
                                    <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 8px 18px; font-size: 13.5px; border-radius: 9999px;">
                                        <span>Search</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Educational Suggested Searches -->
                        <div style="margin-top: 24px;">
                            <span style="font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">
                                Suggested Academic Topics
                            </span>
                            <div class="web-search-suggestions-row">
                                ${educationalSuggestions.map(s => `
                                    <div class="web-search-suggestion-pill" onclick="StudentView.executeWebSearch('${s.query}')">
                                        <span>${s.tag}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                    </div>
                ` : `
                    <!-- 2. Search Results View with Compact Top Search Bar -->
                    <div>
                        <!-- Compact Top Search Bar -->
                        <div style="margin-bottom: 16px;">
                            <form id="results-web-search-form" onsubmit="event.preventDefault(); StudentView.executeWebSearch();">
                                <div class="web-search-main-input-wrapper" style="max-width: 720px; padding: 4px 6px 4px 14px;">
                                    <span style="font-size: 14px; color: #9CA3AF;">🔍</span>
                                    <input type="text" id="web-search-input" class="web-search-main-input" value="${this.currentWebQuery}" placeholder="Search the web..." autocomplete="off" style="padding: 6px 8px;">
                                    <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 6px 14px; font-size: 12.5px; border-radius: 9999px;">
                                        <span>Search</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Result Statistics -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #ECEAF2; padding-bottom: 8px;">
                            <span style="font-size: 12px; color: #6B7280; font-weight: 600;">
                                Found <strong>${matchedResults.length} safe resources</strong> for "${this.currentWebQuery}"
                            </span>
                            <button class="glass-btn glass-btn-secondary" onclick="StudentView.executeWebSearch('')" style="padding: 4px 10px; font-size: 11.5px;">
                                <span>Clear Search</span>
                            </button>
                        </div>

                        <!-- Results List -->
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${matchedResults.map(r => `
                                <div class="web-result-card bouncy-btn" onclick='StudentView.openWebBrowser(${JSON.stringify(r).replace(/'/g, "&#39;")})' style="cursor: pointer;">
                                    <div class="web-result-breadcrumb">
                                        ${r.domain}
                                    </div>
                                    <h3 class="web-result-title">
                                        ${r.title}
                                    </h3>
                                    <p class="web-result-snippet">
                                        ${r.snippet}
                                    </p>
                                    <div class="web-result-metadata">
                                        <span style="color: #059669; font-weight: 700;">✓ Verified School Safe</span>
                                        <span>•</span>
                                        <span>${r.category}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                    </div>
                `}

            </div>
        `;

        // Auto-focus the search bar
        requestAnimationFrame(() => {
            const input = container.querySelector('#web-search-input');
            if (input) input.focus();
        });
    },

    executeWebSearch(customQuery = null) {
        const input = document.getElementById('web-search-input');
        const query = customQuery !== null ? customQuery : (input ? input.value : '');
        this.currentWebQuery = query;

        const widgetBody = document.getElementById('web-search-widget-body');
        const panel = document.getElementById('web-search-widget-panel');
        if (panel && panel.classList.contains('active') && widgetBody) {
            this.renderWebSearchView(widgetBody, query);
        } else {
            const container = document.getElementById('student-tab-content');
            if (container) {
                this.renderWebSearchView(container, query);
            }
        }
    },

    openWebBrowser(article) {
        this.activeBrowserArticle = article;
        const widgetBody = document.getElementById('web-search-widget-body');
        const panel = document.getElementById('web-search-widget-panel');
        if (panel && panel.classList.contains('active') && widgetBody) {
            this.renderWebBrowserView(widgetBody);
        } else {
            this.switchTab('web-browser');
        }
    },

    renderWebBrowserView(container) {
        const article = this.activeBrowserArticle || {
            title: 'Photosynthesis — Educational Overview',
            url: 'https://science.smartslate.org/biology/photosynthesis',
            category: 'Biology Reference',
            content: '<h2>Educational Reference</h2><p>Please search for a topic to view online research articles.</p>'
        };

        const isWidget = container.id === 'web-search-widget-body';
        const backHandler = isWidget 
            ? "StudentView.renderWebSearchView(document.getElementById('web-search-widget-body'), StudentView.currentWebQuery || '')" 
            : "StudentView.switchTab('web-search')";

        container.innerHTML = `
            <div class="home-page-clean-wrapper" style="max-width: 960px;">
                
                <!-- Browser Controls & Address Bar -->
                <div class="home-section-card" style="padding: 10px 14px; margin-bottom: 12px; border-radius: 12px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                        <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="${backHandler}" style="padding: 6px 12px; font-size: 11.5px; border-radius: 8px;">
                            <span>← Back</span>
                        </button>

                <!-- Address Bar -->
                        <div style="flex: 1; max-width: ${isWidget ? '180px' : '540px'}; background: #FAFAFC; border: 1px solid #ECEAF2; border-radius: 9999px; padding: 6px 12px; display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #4B5563; font-family: monospace;">
                            <span style="color: #059669;">🔒</span>
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${article.url}</span>
                        </div>

                        <div style="display: flex; gap: 8px;">
                            <button class="glass-btn glass-btn-primary bouncy-btn" onclick="App.toast('Article saved to Notebook notes! ✍️', 'success')" style="padding: 6px 12px; font-size: 11.5px; border-radius: 8px;">
                                <span>${isWidget ? '✍️ Save' : '✍️ Save to Notes'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Web Page Article Reader Box -->
                <div class="home-section-card" style="padding: ${isWidget ? '18px 16px' : '32px 36px'}; line-height: 1.55; font-size: ${isWidget ? '13.5px' : '15px'}; color: #1F2937; border-radius: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-weight: 800; font-size: 9.5px; border: none; padding: 2px 7px;">
                            ${article.category || 'Educational Web Resource'}
                        </span>
                        <span style="font-size: 11px; color: #059669; font-weight: 700;">● School Safe</span>
                    </div>

                    <h1 style="font-size: ${isWidget ? '18px' : '26px'}; font-weight: 900; color: #111827; margin: 0 0 12px 0; line-height: 1.3;">
                        ${article.title}
                    </h1>

                    <div style="border-top: 1px solid #ECEAF2; padding-top: 14px; margin-top: 10px;">
                        ${article.content}
                    </div>

                    <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #ECEAF2; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <span style="font-size: 11px; color: #6B7280;">SmartSlate Academic Web Filter</span>
                        <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="${isWidget ? `StudentView.renderWebSearchView(document.getElementById('web-search-widget-body'), '')` : `StudentView.switchTab('web-search')`}" style="padding: 6px 12px; font-size: 11.5px; border-radius: 8px;">
                            <span>Search New Topic →</span>
                        </button>
                    </div>
                </div>

            </div>
        `;
    },

    async renderDiaryView(container) {
        const studentName = App.currentUser ? App.currentUser.name : 'Student';
        const studentClass = App.currentUser ? App.currentUser.class : '8';
        const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        let diaryEntries = [
            {
                id: 'd-1',
                date: todayStr,
                teacher: 'Ms. Priya Sharma (Mathematics)',
                subject: 'Mathematics',
                instruction: 'Complete Exercise 4.2 Problems 1 to 10 in Class Notebook. Bring Geometry Box tomorrow.',
                type: 'Homework & Instructions'
            },
            {
                id: 'd-2',
                date: todayStr,
                teacher: 'Mr. Rajesh Kumar (Physical Science)',
                subject: 'Physical Science',
                instruction: 'Read Chapter 3 on Force and Pressure. Science Unit Test scheduled for Friday.',
                type: 'Test & Reading Announcement'
            }
        ];

        if (window.firebaseAuthService && window.firebaseAuthService.db && App.currentUser && App.currentUser.uid) {
            try {
                const snap = await window.firebaseAuthService.db
                    .collection('students')
                    .doc(App.currentUser.uid)
                    .collection('diary')
                    .orderBy('createdAt', 'desc')
                    .get();
                if (!snap.empty) {
                    diaryEntries = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }
            } catch (err) {
                console.warn('[Diary] Firestore read warning:', err.message);
            }
        }

        container.innerHTML = `
            <div style="padding: 24px; max-width: 1000px; margin: 0 auto;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <div>
                        <h1 style="font-size: 28px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
                            <span>📖</span>
                            <span>Student Diary</span>
                        </h1>
                        <p style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">Class ${studentClass} Academic Diary · ${todayStr}</p>
                    </div>
                    <div style="background: rgba(136,100,243,0.12); color: var(--primary); padding: 8px 16px; border-radius: 20px; font-weight: 800; font-size: 13px;">
                        ${studentName}
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${diaryEntries.map(entry => `
                        <div class="glass-card" style="padding: 20px; border-left: 5px solid var(--primary); border-radius: 16px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                                <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--primary);">${entry.subject || 'General Instruction'}</span>
                                <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">${entry.date || todayStr}</span>
                            </div>
                            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">${entry.teacher || 'Class Teacher'}</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">${entry.instruction}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    async renderTestsView(container) {
        const activeSubTab = this.testsSubTab || 'all';
        const activeSubjectFilter = this.testsSubjectFilter || 'all';

        let sqliteExams = [];
        try {
            const res = await API.getExams();
            sqliteExams = res.exams || [];
        } catch(e) {
            console.warn('[StudentView] Local exams fetch warning:', e.message);
        }

        let firestoreExams = [];
        if (window.firebaseAuthService) {
            try {
                const studentUid = window.firebaseAuthService.auth?.currentUser?.uid || App.currentUser?.uid || App.currentUser?.id;
                const studentProfile = window.firebaseAuthService._studentProfileCache?.data || window.firebaseAuthService._studentProfileCache || App.currentUser || {};
                firestoreExams = await window.firebaseAuthService.getStudentExams(studentUid, studentProfile);
            } catch(e) {
                console.warn('[StudentView] Firestore exams fetch warning:', e.message);
            }
        }

        // Merge & deduplicate exams
        const examMap = new Map();
        [...sqliteExams, ...firestoreExams].forEach(e => {
            const key = String(e.id || `${e.title}_${e.subject}`);
            if (!examMap.has(key)) {
                examMap.set(key, e);
            } else {
                // Merge properties
                const existing = examMap.get(key);
                examMap.set(key, { ...existing, ...e });
            }
        });
        const exams = Array.from(examMap.values());

        // Setup real-time listener if not already attached
        if (window.firebaseAuthService && !this._examListenerAttached) {
            const studentUid = window.firebaseAuthService.auth?.currentUser?.uid || App.currentUser?.uid || App.currentUser?.id;
            const studentProfile = window.firebaseAuthService._studentProfileCache?.data || window.firebaseAuthService._studentProfileCache || App.currentUser || {};
            this._examListenerAttached = true;
            window.firebaseAuthService.onStudentExamsChanged(studentUid, studentProfile, (updatedCloudExams) => {
                console.log(`⚡ [Real-time] Firestore Exams updated: ${updatedCloudExams.length} matching exams.`);
                const currentContainer = document.getElementById('view-student');
                if (currentContainer && (this.activeTab === 'tests' || this.activeTab === 'exams' || this.activeTab === 'practice')) {
                    this.renderTestsView(currentContainer);
                }
            });
        }

        const now = new Date();

        // Categorize exams
        const activeAndUpcoming = exams.filter(e => !e.hasSubmitted);
        const completedExams = exams.filter(e => e.hasSubmitted);

        let filteredExams = exams;
        if (activeSubTab === 'upcoming') {
            filteredExams = activeAndUpcoming;
        } else if (activeSubTab === 'completed') {
            filteredExams = completedExams;
        }

        if (activeSubjectFilter !== 'all') {
            filteredExams = filteredExams.filter(e => (e.subject || '').toLowerCase().includes(activeSubjectFilter.toLowerCase()));
        }

        container.innerHTML = `
            <div class="tests-page-wrapper">
                
                <!-- Top Header Row -->
                <div class="tests-header-row" style="margin-bottom: 20px;">
                    <div>
                        <h1 class="tests-header-title" style="font-size: 24px; font-weight: 900; color: #151A2D; margin: 0 0 4px 0;">
                            Examinations & Tests
                        </h1>
                        <p style="font-size: 13.5px; color: #6B7280; margin: 0;">
                            Class assessments, multiple choice unit tests, and written subjective exams.
                        </p>
                    </div>
                </div>

                <!-- Tabs (All Exams / Active & Upcoming / Completed & Results) -->
                <div class="classes-tabs-container" style="margin-bottom: 18px;">
                    <div class="classes-tabs-row" style="display: flex; gap: 8px;">
                        <button class="classes-tab-item ${activeSubTab === 'all' ? 'active' : ''}" data-test-tab="all">
                            All Exams (${exams.length})
                        </button>
                        <button class="classes-tab-item ${activeSubTab === 'upcoming' ? 'active' : ''}" data-test-tab="upcoming">
                            Active & Upcoming (${activeAndUpcoming.length})
                        </button>
                        <button class="classes-tab-item ${activeSubTab === 'completed' ? 'active' : ''}" data-test-tab="completed">
                            Completed & Results (${completedExams.length})
                        </button>
                    </div>
                </div>

                <!-- Exams List -->
                ${filteredExams.length === 0 ? `
                    <div class="glass-card" style="text-align: center; padding: 60px 20px; color: var(--text-muted); background: #FFF; border-radius: 16px;">
                        <div style="font-size: 40px; margin-bottom: 12px;">📋</div>
                        <h3 style="font-size: 17px; font-weight: 800; color: #151A2D; margin: 0 0 6px 0;">No exams available yet.</h3>
                        <p style="font-size: 13px; margin: 0;">Your teacher hasn't posted any exams for you.</p>
                    </div>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        ${filteredExams.map(e => {
                            const isMcq = e.exam_type === 'mcq';
                            const isAvailable = e.isAvailable;
                            const hasSubmitted = e.hasSubmitted;
                            const isEvaluated = e.submission_status === 'evaluated' || e.submission_status === 'graded' || Boolean(e.score !== null && e.score !== undefined);

                            let statusBadge = `<span class="glass-badge" style="background: #EEF2FF; color: #4F46E5; font-weight: 800;">${isMcq ? '🔘 Multiple Choice (MCQ)' : '✍️ Written Exam'}</span>`;
                            let actionBtn = '';

                            if (hasSubmitted) {
                                statusBadge = `<span class="glass-badge ${isEvaluated ? 'glass-badge-success' : 'glass-badge-warning'}" style="font-weight: 800;">${isEvaluated ? `Evaluated: ${e.score}/${e.total_marks || 100}` : 'Submitted ✓ (Awaiting Evaluation)'}</span>`;
                                actionBtn = `
                                    <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="StudentView.showExamResultModal('${e.id}')" style="font-weight: 800; padding: 10px 18px;">
                                        <span>📊 View Result & Feedback</span>
                                    </button>
                                `;
                            } else if (e.windowStatus === 'upcoming') {
                                statusBadge = `<span class="glass-badge" style="background: #FEF3C7; color: #B45309; font-weight: 800;">⏳ Upcoming</span>`;
                                actionBtn = `
                                    <button class="glass-btn glass-btn-secondary" disabled style="opacity: 0.6; cursor: not-allowed; padding: 10px 18px; font-weight: 700;">
                                        <span>Exam starts at ${e.start_time || '09:00'}</span>
                                    </button>
                                `;
                            } else if (e.windowStatus === 'closed') {
                                statusBadge = `<span class="glass-badge" style="background: #FEE2E2; color: #DC2626; font-weight: 800;">🔒 Closed</span>`;
                                actionBtn = `
                                    <button class="glass-btn glass-btn-secondary" disabled style="opacity: 0.6; cursor: not-allowed; padding: 10px 18px; font-weight: 700;">
                                        <span>Exam is closed</span>
                                    </button>
                                `;
                            } else {
                                // Active window
                                statusBadge = `<span class="glass-badge glass-badge-success" style="background: #ECFDF5; color: #059669; font-weight: 800;">🟢 Active Now</span>`;
                                actionBtn = `
                                    <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.openExamFullscreen('${e.id}')" style="background: linear-gradient(135deg, #4F46E5, #3730A3); font-weight: 800; padding: 10px 22px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
                                        <span>🚀 START EXAM →</span>
                                    </button>
                                `;
                            }

                            return `
                                <div class="glass-card" style="padding: 22px; background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px;">
                                        <div style="flex: 1; min-width: 260px;">
                                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
                                                <span class="glass-badge" style="background: #F3F4F6; color: #374151; font-weight: 800; font-size: 11px;">${e.subject || 'General'}</span>
                                                <span class="glass-badge" style="background: #EEF2FF; color: #4338CA; font-weight: 800; font-size: 11px;">Class: ${e.target_class || e.class_name || 'Class 8'}</span>
                                                ${e.target_section ? `<span class="glass-badge" style="background: #F0FDF4; color: #15803D; font-weight: 800; font-size: 11px;">Sec: ${e.target_section}</span>` : ''}
                                                ${statusBadge}
                                            </div>
                                            <h3 style="font-size: 18px; font-weight: 900; color: #151A2D; margin: 0 0 6px 0;">${e.title}</h3>
                                            <div style="font-size: 13px; color: #6B7280; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                                                ${e.teacher_name ? `<span>👨‍🏫 Teacher: <strong>${e.teacher_name}</strong></span>` : ''}
                                                <span>📅 Start: <strong>${e.start_date || 'Today'} ${e.start_time || '09:00'}</strong></span>
                                                <span>📅 End: <strong>${e.end_date || 'Today'} ${e.end_time || '23:59'}</strong></span>
                                                <span>⏱️ Duration: <strong>${e.duration_minutes || 60} mins</strong></span>
                                            </div>
                                        </div>

                                        <div style="display: flex; align-items: center;">
                                            ${actionBtn}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;

        container.querySelectorAll('[data-test-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.testsSubTab = e.currentTarget.dataset.testTab;
                this.renderTestsView(container);
            });
        });
    },

    // Open Fullscreen Secure Exam Taking Mode
    async openExamFullscreen(examId) {
        try {
            App.showToast('Preparing exam environment...', 'info');
            const res = await API.getExam(examId);
            const exam = res.exam;
            if (!exam) throw new Error('Exam details not found.');

            if (!exam.isAvailable) {
                App.showToast(exam.availabilityMessage || 'This exam is currently not available.', 'danger');
                return;
            }

            // Enter Fullscreen mode
            if (document.documentElement.requestFullscreen) {
                try {
                    await document.documentElement.requestFullscreen();
                } catch(err) {
                    console.warn('Fullscreen request bypassed or denied:', err);
                }
            }

            // Start taking exam in backend
            await API.startExam(examId).catch(() => {});

            this.activeExam = exam;
            this.examAnswers = (res.submission && res.submission.answers && typeof res.submission.answers === 'object') ? res.submission.answers : {};
            this.examViolations = (res.submission && res.submission.violation_count) ? res.submission.violation_count : 0;

            // Compute server authoritative remaining time
            const now = new Date().getTime();
            const end = new Date(exam.endDateTime).getTime();
            const durationMs = (exam.duration_minutes || 60) * 60 * 1000;
            const remainingFromEnd = Math.max(0, Math.floor((end - now) / 1000));
            const remainingFromDuration = (exam.duration_minutes || 60) * 60;
            this.examSecondsRemaining = Math.min(remainingFromEnd, remainingFromDuration);

            this.renderFullscreenExamSurface();
        } catch(err) {
            App.showToast('Failed to start exam: ' + err.message, 'danger');
        }
    },

    // Render Fullscreen Exam Interface
    renderFullscreenExamSurface() {
        const exam = this.activeExam;
        if (!exam) return;
        const questions = exam.questions || [];

        // Fullscreen overlay container
        let overlay = document.getElementById('active-fullscreen-exam-surface');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'active-fullscreen-exam-surface';
            overlay.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: #F8FAFC;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                font-family: 'Inter', sans-serif;
            `;
            document.body.appendChild(overlay);
        }

        const formatTimer = (secs) => {
            const h = Math.floor(secs / 3600);
            const m = Math.floor((secs % 3600) / 60);
            const s = secs % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        overlay.innerHTML = `
            <!-- Top Exam Header Bar -->
            <div style="background: #1E1B4B; color: #FFF; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.15); flex-shrink: 0;">
                <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="glass-badge" style="background: #4F46E5; color: #FFF; font-weight: 800; font-size: 11px;">
                            ${exam.exam_type === 'mcq' ? '🔘 MCQ EXAM' : '✍️ WRITTEN EXAM'}
                        </span>
                        <span style="font-size: 12px; color: #C7D2FE;">Subject: <strong>${exam.subject}</strong></span>
                    </div>
                    <h2 style="font-size: 18px; font-weight: 900; margin: 4px 0 0 0; color: #FFF;">${exam.title}</h2>
                </div>

                <!-- Timer & Violation Counter & Submit -->
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div id="exam-timer-display" style="background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; font-family: monospace; font-size: 18px; font-weight: 900; color: #34D399; letter-spacing: 1px;">
                        ⏱️ ${formatTimer(this.examSecondsRemaining)}
                    </div>
                    <div id="exam-violations-badge" style="background: #EF4444; color: #FFF; font-weight: 800; font-size: 12px; padding: 6px 12px; border-radius: 6px; display: ${this.examViolations > 0 ? 'block' : 'none'};">
                        ⚠️ Violations: ${this.examViolations}
                    </div>
                    <button id="btn-submit-exam-fullscreen" class="glass-btn bouncy-btn" style="background: linear-gradient(135deg, #10B981, #059669); color: #FFF; font-weight: 900; padding: 10px 22px; font-size: 14px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                        <span>📤 Submit Exam</span>
                    </button>
                </div>
            </div>

            <!-- Scrollable Questions Content Area -->
            <div style="flex: 1; overflow-y: auto; padding: 24px 15%; background: #F8FAFC;" id="exam-questions-scroll-area">
                <div style="display: flex; flex-direction: column; gap: 28px;">
                    ${questions.map((q, idx) => {
                        const isWritten = (q.type === 'written' || (!q.type && exam.exam_type === 'written'));
                        return `
                        <div class="glass-card exam-question-block" data-q-id="${q.id}" style="padding: 24px; background: #FFFFFF; border: 2px solid #E2E8F0; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1.5px solid #F1F5F9; padding-bottom: 10px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <strong style="font-size: 16px; color: #4F46E5;">Question ${idx + 1} of ${questions.length}</strong>
                                    <span class="glass-badge" style="background: ${isWritten ? '#FEF3C7' : '#EEF2FF'}; color: ${isWritten ? '#B45309' : '#4F46E5'}; font-size: 11px; font-weight: 800;">
                                        ${isWritten ? '✍️ WRITTEN / STYLUS' : '🔘 MCQ'}
                                    </span>
                                </div>
                                <span class="glass-badge" style="background: #F1F5F9; color: #475569; font-weight: 800;">${q.marks || (isWritten ? 10 : 1)} Marks</span>
                            </div>
                            
                            <h4 style="font-size: 16.5px; font-weight: 800; color: #1E293B; line-height: 1.5; margin: 0 0 16px 0;">${q.question}</h4>

                            <!-- Answer Area depending on MCQ or Written -->
                            ${!isWritten ? `
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    ${['A', 'B', 'C', 'D'].map(opt => {
                                        const optText = q.options?.[opt] || '';
                                        return `
                                            <label style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 2px solid #E2E8F0; border-radius: 10px; background: #FAFBFD; cursor: pointer; transition: all 0.2s;" class="mcq-option-label" data-q-id="${q.id}" data-opt="${opt}">
                                                <input type="radio" name="student_ans_${q.id}" value="${opt}" class="student-mcq-radio" data-q-id="${q.id}" style="width: 18px; height: 18px; accent-color: #4F46E5;">
                                                <strong style="font-size: 15px; color: #334155;">${opt}.</strong>
                                                <span style="font-size: 14.5px; color: #1E293B;">${optText}</span>
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            ` : `
                                <!-- ✍️ Stylus Handwriting Digital Answer Sheet -->
                                <div class="written-question-card" data-q-id="${q.id}" style="display: flex; flex-direction: column;">
                                    
                                    <!-- Sheet Header with Autosave Status -->
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                                        <div style="display: flex; align-items: center; gap: 6px;">
                                            <span style="font-size: 12.5px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">✍️ Digital Stylus Answer Sheet</span>
                                            <span style="font-size: 10.5px; background: #EEF2FF; color: #4F46E5; padding: 2px 8px; border-radius: 4px; font-weight: 800;">Stylus & Touch Active</span>
                                        </div>
                                        <div id="canvas-save-status-${q.id}" style="font-size: 11.5px; color: #059669; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                                            <span>✓ Ready</span>
                                        </div>
                                    </div>

                                    <!-- Compact Stylus Toolbar -->
                                    <div class="exam-stylus-toolbar" data-q-id="${q.id}" style="display: flex; align-items: center; gap: 8px; background: #F1F5F9; border: 2px solid #CBD5E1; border-bottom: none; border-radius: 12px 12px 0 0; padding: 8px 12px; flex-wrap: wrap;">
                                        
                                        <!-- Tool Select (Pen / Eraser) -->
                                        <div style="display: flex; align-items: center; gap: 4px; background: #FFF; padding: 4px 6px; border-radius: 8px; border: 1px solid #E2E8F0;">
                                            <button type="button" class="btn-stylus-tool btn-tool-pen active" data-q-id="${q.id}" data-tool="pen" style="background: #4F46E5; color: #FFF; border: none; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 800; cursor: pointer;">
                                                ✏️ Pen
                                            </button>
                                            <button type="button" class="btn-stylus-tool btn-tool-eraser" data-q-id="${q.id}" data-tool="eraser" style="background: transparent; color: #475569; border: none; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 800; cursor: pointer;">
                                                🧹 Eraser
                                            </button>
                                        </div>

                                        <!-- Pen Sizes -->
                                        <div style="display: flex; align-items: center; gap: 6px; background: #FFF; padding: 4px 8px; border-radius: 8px; border: 1px solid #E2E8F0;">
                                            <button type="button" class="btn-pen-size" data-q-id="${q.id}" data-size="2" style="width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid #CBD5E1; background: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Fine (2px)">
                                                <span style="width: 3px; height: 3px; background: #1E293B; border-radius: 50%;"></span>
                                            </button>
                                            <button type="button" class="btn-pen-size active" data-q-id="${q.id}" data-size="4" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #4F46E5; background: #EEF2FF; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Medium (4px)">
                                                <span style="width: 6px; height: 6px; background: #1E293B; border-radius: 50%;"></span>
                                            </button>
                                            <button type="button" class="btn-pen-size" data-q-id="${q.id}" data-size="8" style="width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid #CBD5E1; background: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Bold (8px)">
                                                <span style="width: 10px; height: 10px; background: #1E293B; border-radius: 50%;"></span>
                                            </button>
                                        </div>

                                        <!-- Ink Colors -->
                                        <div style="display: flex; align-items: center; gap: 6px; background: #FFF; padding: 4px 8px; border-radius: 8px; border: 1px solid #E2E8F0;">
                                            <button type="button" class="btn-ink-color active" data-q-id="${q.id}" data-color="#1E293B" style="width: 20px; height: 20px; border-radius: 50%; background: #1E293B; border: 2px solid #4F46E5; cursor: pointer;" title="Navy Ink"></button>
                                            <button type="button" class="btn-ink-color" data-q-id="${q.id}" data-color="#2563EB" style="width: 20px; height: 20px; border-radius: 50%; background: #2563EB; border: 2px solid transparent; cursor: pointer;" title="Royal Blue"></button>
                                            <button type="button" class="btn-ink-color" data-q-id="${q.id}" data-color="#059669" style="width: 20px; height: 20px; border-radius: 50%; background: #059669; border: 2px solid transparent; cursor: pointer;" title="Emerald Green"></button>
                                            <button type="button" class="btn-ink-color" data-q-id="${q.id}" data-color="#DC2626" style="width: 20px; height: 20px; border-radius: 50%; background: #DC2626; border: 2px solid transparent; cursor: pointer;" title="Red Ink"></button>
                                        </div>

                                        <!-- Paper Ruling Pattern -->
                                        <div style="display: flex; align-items: center; gap: 4px; background: #FFF; padding: 4px 8px; border-radius: 8px; border: 1px solid #E2E8F0;">
                                            <select class="select-paper-bg glass-input" data-q-id="${q.id}" style="padding: 2px 4px; font-size: 11px; font-weight: 700; border: none; background: transparent; cursor: pointer;">
                                                <option value="ruled" selected>📜 Ruled Lines</option>
                                                <option value="grid">📐 Math Grid</option>
                                                <option value="blank">📄 Blank Sheet</option>
                                            </select>
                                        </div>

                                        <!-- History Actions: Undo, Redo, Clear -->
                                        <div style="display: flex; align-items: center; gap: 4px; margin-left: auto;">
                                            <button type="button" class="btn-canvas-undo glass-btn glass-btn-sm" data-q-id="${q.id}" style="padding: 4px 8px; font-size: 12px;" title="Undo">↩️</button>
                                            <button type="button" class="btn-canvas-redo glass-btn glass-btn-sm" data-q-id="${q.id}" style="padding: 4px 8px; font-size: 12px;" title="Redo">↪️</button>
                                            <button type="button" class="btn-canvas-clear glass-btn glass-btn-sm" data-q-id="${q.id}" style="padding: 4px 8px; font-size: 11px; color: #DC2626; font-weight: 700;" title="Clear Sheet">🗑️ Clear</button>
                                        </div>
                                    </div>

                                    <!-- Canvas Writing Area -->
                                    <div class="exam-canvas-container paper-ruled" id="exam-canvas-container-${q.id}" data-q-id="${q.id}" style="position: relative; width: 100%; height: 380px; border: 2px solid #CBD5E1; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden; background-color: #FFFFFF; background-image: linear-gradient(#E2E8F0 1px, transparent 1px); background-size: 100% 32px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.02);">
                                        <canvas class="exam-answer-canvas" id="exam-canvas-${q.id}" data-q-id="${q.id}" width="900" height="380" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; touch-action: none; user-select: none; -webkit-user-select: none; cursor: crosshair; z-index: 2;"></canvas>
                                    </div>

                                    <!-- Optional Collapsible Keyboard Note Fallback -->
                                    <details style="margin-top: 8px;">
                                        <summary style="font-size: 11.5px; color: #94A3B8; cursor: pointer; user-select: none;">⌨️ Optional text notes / typed supplement (Optional)</summary>
                                        <textarea class="student-written-textarea-fallback glass-input" data-q-id="${q.id}" placeholder="Type any supplementary typed notes if needed..." rows="2" style="width: 100%; margin-top: 6px; padding: 8px 12px; font-size: 13px; background: #FAFBFD; border: 1px solid #CBD5E1; border-radius: 8px;"></textarea>
                                    </details>

                                </div>
                            `}
                        </div>
                    `;
                    }).join('')}
                </div>
            </div>
        `;

        // Initialize Stylus Handlers for all Written Questions
        this.initExamHandwritingCanvases(overlay, questions, exam.id);

        // Bind radio selection
        overlay.querySelectorAll('.student-mcq-radio').forEach(r => {
            r.addEventListener('change', (e) => {
                const qId = e.target.dataset.qId;
                this.examAnswers[qId] = e.target.value;
                this.autosaveExamDraft(exam.id);
            });
        });

        // Bind Submit button
        overlay.querySelector('#btn-submit-exam-fullscreen').addEventListener('click', () => {
            if (confirm('Are you sure you want to submit your examination?\n\nYou will not be able to edit your handwriting or answers after submission.')) {
                this.submitActiveExam(false);
            }
        });

        // Bind Fullscreen Violation Listeners
        this.bindFullscreenViolationMonitor();

        // Start Live Timer Interval
        if (this.examTimer) clearInterval(this.examTimer);
        this.examTimer = setInterval(() => {
            this.examSecondsRemaining--;
            const timerEl = document.getElementById('exam-timer-display');
            if (timerEl) {
                timerEl.innerHTML = `⏱️ ${formatTimer(Math.max(0, this.examSecondsRemaining))}`;
                if (this.examSecondsRemaining <= 300) {
                    timerEl.style.color = '#EF4444'; // Red warning under 5 mins
                }
            }

            if (this.examSecondsRemaining <= 0) {
                clearInterval(this.examTimer);
                App.showToast('⏰ Time is up! Submitting your exam automatically...', 'info');
                this.submitActiveExam(true);
            }
        }, 1000);
    },

    // Initialize Multi-Question Stylus Handwriting Canvases & Toolbars
    initExamHandwritingCanvases(container, questions, examId) {
        if (!container || !questions || !questions.length) return;

        // Try restoring cached draft answers from localStorage
        const draftKey = `smartslate_exam_draft_${examId}`;
        let draftAnswers = {};
        try {
            const rawDraft = localStorage.getItem(draftKey);
            if (rawDraft) draftAnswers = JSON.parse(rawDraft);
        } catch (e) {}

        this.examAnswers = this.examAnswers || {};
        if (draftAnswers && typeof draftAnswers === 'object') {
            Object.assign(this.examAnswers, draftAnswers);
        }

        questions.forEach((q, idx) => {
            const isWritten = (q.type === 'written' || (!q.type && this.activeExam?.exam_type === 'written'));
            if (!isWritten) {
                // Restore radio selection if present
                if (this.examAnswers[q.id]) {
                    const radio = container.querySelector(`input[name="student_ans_${q.id}"][value="${this.examAnswers[q.id]}"]`);
                    if (radio) radio.checked = true;
                }
                return;
            }

            const canvas = container.querySelector(`#exam-canvas-${q.id}`);
            const canvasContainer = container.querySelector(`#exam-canvas-container-${q.id}`);
            const toolbar = container.querySelector(`.exam-stylus-toolbar[data-q-id="${q.id}"]`);
            const statusEl = container.querySelector(`#canvas-save-status-${q.id}`);
            const textFallbackEl = container.querySelector(`.student-written-textarea-fallback[data-q-id="${q.id}"]`);
            if (!canvas || !toolbar) return;

            const ctx = canvas.getContext('2d');
            let currentTool = 'pen';
            let currentColor = '#1E293B';
            let currentSize = 4;
            let isDrawing = false;
            let strokes = [];
            let undoStack = [];
            let redoStack = [];
            let currentStroke = null;

            // Resize canvas buffer matching display aspect ratio
            const resizeCanvas = () => {
                const rect = canvas.getBoundingClientRect();
                const targetWidth = Math.max(rect.width, 800);
                const targetHeight = Math.max(rect.height, 380);
                if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    StudentView.redrawStrokesOnCanvas(canvas, strokes);
                }
            };
            setTimeout(resizeCanvas, 50);

            // Restore from existing draft
            if (this.examAnswers[q.id]) {
                const existingAns = this.examAnswers[q.id];
                if (existingAns && existingAns.strokes && Array.isArray(existingAns.strokes)) {
                    strokes = existingAns.strokes;
                    undoStack = [JSON.parse(JSON.stringify(strokes))];
                    setTimeout(() => {
                        StudentView.redrawStrokesOnCanvas(canvas, strokes);
                        if (statusEl) statusEl.innerHTML = '<span>✓ Restored from Draft</span>';
                    }, 100);
                }
                if (existingAns.textFallback && textFallbackEl) {
                    textFallbackEl.value = existingAns.textFallback;
                }
            }

            const getCanvasPos = (e) => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const pressure = (e.pressure !== undefined && e.pressure > 0) ? e.pressure : 0.5;
                return {
                    x: (e.clientX - rect.left) * scaleX,
                    y: (e.clientY - rect.top) * scaleY,
                    pressure: pressure
                };
            };

            const triggerQuestionAutosave = () => {
                const previewUrl = canvas.toDataURL('image/png');
                this.examAnswers[q.id] = {
                    questionId: q.id,
                    answerType: 'handwriting',
                    strokes: strokes,
                    previewDataUrl: previewUrl,
                    textFallback: textFallbackEl?.value || '',
                    updatedAt: new Date().toISOString()
                };
                if (statusEl) {
                    statusEl.innerHTML = '<span>⏳ Saving...</span>';
                    statusEl.style.color = '#4F46E5';
                }
                this.autosaveExamDraft(examId, q.id);
            };

            // Pointer Event Handlers
            canvas.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                canvas.setPointerCapture(e.pointerId);
                isDrawing = true;
                const pos = getCanvasPos(e);
                currentStroke = {
                    tool: currentTool,
                    color: currentColor,
                    width: currentSize,
                    points: [pos]
                };

                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalCompositeOperation = (currentTool === 'eraser' ? 'destination-out' : 'source-over');
                ctx.strokeStyle = currentColor;
                const w = currentTool === 'eraser' ? currentSize * 5 : (pos.pressure ? currentSize * pos.pressure * 1.5 : currentSize);
                ctx.lineWidth = Math.max(1, w);
            });

            canvas.addEventListener('pointermove', (e) => {
                if (!isDrawing || !currentStroke) return;
                e.preventDefault();
                const pos = getCanvasPos(e);
                currentStroke.points.push(pos);

                ctx.beginPath();
                const lastPoint = currentStroke.points[currentStroke.points.length - 2] || pos;
                ctx.moveTo(lastPoint.x, lastPoint.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalCompositeOperation = (currentTool === 'eraser' ? 'destination-out' : 'source-over');
                ctx.strokeStyle = currentColor;
                const w = currentTool === 'eraser' ? currentSize * 5 : (pos.pressure ? currentSize * pos.pressure * 1.5 : currentSize);
                ctx.lineWidth = Math.max(1, w);
                ctx.stroke();
            });

            const finishStroke = (e) => {
                if (!isDrawing) return;
                isDrawing = false;
                try { canvas.releasePointerCapture(e.pointerId); } catch(err) {}

                if (currentStroke && currentStroke.points.length > 0) {
                    strokes.push(currentStroke);
                    undoStack.push(JSON.parse(JSON.stringify(strokes)));
                    redoStack = [];
                    currentStroke = null;
                    triggerQuestionAutosave();
                }
            };

            canvas.addEventListener('pointerup', finishStroke);
            canvas.addEventListener('pointercancel', finishStroke);

            // Toolbar Events
            toolbar.querySelectorAll('.btn-stylus-tool').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    toolbar.querySelectorAll('.btn-stylus-tool').forEach(b => {
                        b.classList.remove('active');
                        b.style.background = 'transparent';
                        b.style.color = '#475569';
                    });
                    const target = e.currentTarget;
                    target.classList.add('active');
                    target.style.background = '#4F46E5';
                    target.style.color = '#FFF';
                    currentTool = target.dataset.tool || 'pen';
                });
            });

            toolbar.querySelectorAll('.btn-pen-size').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    toolbar.querySelectorAll('.btn-pen-size').forEach(b => {
                        b.classList.remove('active');
                        b.style.background = '#FFF';
                        b.style.borderColor = '#CBD5E1';
                    });
                    const target = e.currentTarget;
                    target.classList.add('active');
                    target.style.background = '#EEF2FF';
                    target.style.borderColor = '#4F46E5';
                    currentSize = parseInt(target.dataset.size, 10) || 4;
                });
            });

            toolbar.querySelectorAll('.btn-ink-color').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    toolbar.querySelectorAll('.btn-ink-color').forEach(b => {
                        b.classList.remove('active');
                        b.style.borderColor = 'transparent';
                    });
                    const target = e.currentTarget;
                    target.classList.add('active');
                    target.style.borderColor = '#4F46E5';
                    currentColor = target.dataset.color || '#1E293B';
                    if (currentTool === 'eraser') {
                        toolbar.querySelector('.btn-tool-pen')?.click();
                    }
                });
            });

            const paperSelect = toolbar.querySelector('.select-paper-bg');
            if (paperSelect && canvasContainer) {
                paperSelect.addEventListener('change', (e) => {
                    const style = e.target.value;
                    if (style === 'ruled') {
                        canvasContainer.style.backgroundImage = 'linear-gradient(#E2E8F0 1px, transparent 1px)';
                        canvasContainer.style.backgroundSize = '100% 32px';
                    } else if (style === 'grid') {
                        canvasContainer.style.backgroundImage = 'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)';
                        canvasContainer.style.backgroundSize = '24px 24px';
                    } else {
                        canvasContainer.style.backgroundImage = 'none';
                    }
                });
            }

            toolbar.querySelector('.btn-canvas-undo')?.addEventListener('click', () => {
                if (undoStack.length > 1) {
                    const curr = undoStack.pop();
                    redoStack.push(curr);
                    strokes = JSON.parse(JSON.stringify(undoStack[undoStack.length - 1]));
                } else if (undoStack.length === 1) {
                    const curr = undoStack.pop();
                    redoStack.push(curr);
                    strokes = [];
                }
                StudentView.redrawStrokesOnCanvas(canvas, strokes);
                triggerQuestionAutosave();
            });

            toolbar.querySelector('.btn-canvas-redo')?.addEventListener('click', () => {
                if (redoStack.length > 0) {
                    const restored = redoStack.pop();
                    undoStack.push(restored);
                    strokes = JSON.parse(JSON.stringify(restored));
                    StudentView.redrawStrokesOnCanvas(canvas, strokes);
                    triggerQuestionAutosave();
                }
            });

            toolbar.querySelector('.btn-canvas-clear')?.addEventListener('click', () => {
                if (strokes.length === 0) return;
                if (confirm('Clear your handwriting on this question?')) {
                    strokes = [];
                    undoStack.push([]);
                    redoStack = [];
                    StudentView.redrawStrokesOnCanvas(canvas, strokes);
                    triggerQuestionAutosave();
                }
            });

            if (textFallbackEl) {
                textFallbackEl.addEventListener('input', () => {
                    triggerQuestionAutosave();
                });
            }
        });
    },

    // Redraw Strokes on any HTML5 Canvas Element
    redrawStrokesOnCanvas(canvas, strokes) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!strokes || !Array.isArray(strokes) || strokes.length === 0) return;

        strokes.forEach(stroke => {
            if (!stroke || !stroke.points || stroke.points.length === 0) return;
            const tool = stroke.tool || 'pen';
            const color = stroke.color || '#1E293B';
            const baseWidth = stroke.width || 4;

            ctx.beginPath();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = (tool === 'eraser' ? 'destination-out' : 'source-over');
            ctx.strokeStyle = color;

            const firstPoint = stroke.points[0];
            ctx.moveTo(firstPoint.x, firstPoint.y);

            if (stroke.points.length === 1) {
                const w = tool === 'eraser' ? baseWidth * 5 : (firstPoint.pressure ? baseWidth * firstPoint.pressure * 1.5 : baseWidth);
                ctx.lineWidth = Math.max(1, w);
                ctx.lineTo(firstPoint.x + 0.1, firstPoint.y + 0.1);
                ctx.stroke();
                return;
            }

            for (let i = 1; i < stroke.points.length; i++) {
                const pt = stroke.points[i];
                const w = tool === 'eraser' ? baseWidth * 5 : (pt.pressure ? baseWidth * pt.pressure * 1.5 : baseWidth);
                ctx.lineWidth = Math.max(1, w);
                ctx.lineTo(pt.x, pt.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(pt.x, pt.y);
            }
        });
    },

    // Debounced Local & Server Autosave of Exam Draft
    autosaveExamDraft(examId, qId = null) {
        if (this._draftSaveTimer) clearTimeout(this._draftSaveTimer);
        this._draftSaveTimer = setTimeout(async () => {
            const draftKey = `smartslate_exam_draft_${examId}`;
            try {
                localStorage.setItem(draftKey, JSON.stringify(this.examAnswers));
                if (qId) {
                    const statusEl = document.getElementById(`canvas-save-status-${qId}`);
                    if (statusEl) {
                        statusEl.innerHTML = '<span>✓ Saved locally</span>';
                        statusEl.style.color = '#059669';
                    }
                }
            } catch (e) {}

            // Background async save to backend SQLite draft / sync queue
            try {
                if (typeof API !== 'undefined' && API.saveExamDraft) {
                    await API.saveExamDraft(examId, this.examAnswers).catch(() => {});
                }
            } catch (e) {}
        }, 500);
    },

    // Bind Fullscreen Violation Event Handlers
    bindFullscreenViolationMonitor() {
        if (this.fullscreenHandler) {
            document.removeEventListener('fullscreenchange', this.fullscreenHandler);
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }

        this.fullscreenHandler = async () => {
            if (!this.activeExam) return;
            if (!document.fullscreenElement) {
                this.examViolations++;
                const badge = document.getElementById('exam-violations-badge');
                if (badge) {
                    badge.style.display = 'block';
                    badge.textContent = `⚠️ Violations: ${this.examViolations}`;
                }
                App.showToast('⚠️ WARNING: You exited exam fullscreen mode! This violation has been reported.', 'danger');
                try {
                    await API.recordExamViolation(this.activeExam.id, 'FULLSCREEN_EXIT', `Exited fullscreen at ${new Date().toLocaleTimeString()}`);
                } catch(e) {}
            }
        };

        this.visibilityHandler = async () => {
            if (!this.activeExam) return;
            if (document.hidden) {
                this.examViolations++;
                const badge = document.getElementById('exam-violations-badge');
                if (badge) {
                    badge.style.display = 'block';
                    badge.textContent = `⚠️ Violations: ${this.examViolations}`;
                }
                App.showToast('⚠️ WARNING: Tab switch / Window blur detected during exam!', 'danger');
                try {
                    await API.recordExamViolation(this.activeExam.id, 'WINDOW_BLUR', `Switched tab at ${new Date().toLocaleTimeString()}`);
                } catch(e) {}
            }
        };

        document.addEventListener('fullscreenchange', this.fullscreenHandler);
        document.addEventListener('visibilitychange', this.visibilityHandler);
    },

    // Submit Active Exam
    async submitActiveExam(isAutoExpiry = false) {
        if (!this.activeExam) return;
        const examId = this.activeExam.id;
        const examTitle = this.activeExam.title;

        try {
            if (this.examTimer) {
                clearInterval(this.examTimer);
                this.examTimer = null;
            }

            const res = await API.submitExam(examId, this.examAnswers);

            // Clean up Fullscreen & Overlay
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }

            const overlay = document.getElementById('active-fullscreen-exam-surface');
            if (overlay) overlay.remove();

            if (this.fullscreenHandler) {
                document.removeEventListener('fullscreenchange', this.fullscreenHandler);
                document.removeEventListener('visibilitychange', this.visibilityHandler);
            }

            this.activeExam = null;
            this.examAnswers = {};

            if (res.examType === 'mcq') {
                App.showToast(`🎉 Exam submitted & evaluated! Score: ${res.score}/${res.totalMarks}`, 'success');
            } else {
                App.showToast('🎉 Written exam submitted successfully to teacher!', 'success');
            }

            // Refresh Tests view
            this.activeTab = 'exams';
            const container = document.getElementById('student-tab-content');
            if (container) this.renderTabContent(container);

            // Automatically open Result Modal
            setTimeout(() => {
                this.showExamResultModal(examId);
            }, 600);

        } catch(err) {
            App.showToast('Failed to submit exam: ' + err.message, 'danger');
        }
    },

    // View Exam Result Modal
    async showExamResultModal(examId) {
        App.showModal(`
            <div class="modal-card" style="max-width: 600px; padding: 28px; text-align: center;">
                <div style="text-align: center; padding: 30px;"><div class="spinner" style="margin: 0 auto;"></div></div>
            </div>
        `);

        try {
            const res = await API.getExam(examId);
            const exam = res.exam || {};
            const sub = res.submission || {};
            const isEvaluated = sub.status === 'evaluated' || sub.status === 'graded';
            const score = sub.score !== null && sub.score !== undefined ? sub.score : '--';
            const totalMarks = sub.total_marks || 100;
            const percent = isEvaluated && sub.score !== null ? Math.round((sub.score / totalMarks) * 100) + '%' : '--';

            App.showModal(`
                <div class="modal-card" style="max-width: 620px; padding: 28px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 18px;">
                        <h3 style="font-size: 18px; font-weight: 900; margin: 0; color: #151A2D;">📊 Exam Evaluation & Results</h3>
                        <button class="modal-close" onclick="App.closeModal()">✕</button>
                    </div>

                    <div style="text-align: center; margin-bottom: 20px;">
                        <span class="glass-badge" style="background: #EEF2FF; color: #4F46E5; font-weight: 800; font-size: 12px;">${exam.subject}</span>
                        <h2 style="font-size: 20px; font-weight: 900; color: #151A2D; margin: 6px 0 2px 0;">${exam.title}</h2>
                        <div style="font-size: 12px; color: #6B7280;">Submitted: ${sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'Recently'}</div>
                    </div>

                    <!-- Score Card -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
                        <div class="glass-card" style="padding: 18px; text-align: center; background: #F0FDF4; border: 1.5px solid #BBF7D0;">
                            <div style="font-size: 28px; font-weight: 900; color: #15803D;">${score} / ${totalMarks}</div>
                            <div style="font-size: 12px; font-weight: 800; color: #166534; text-transform: uppercase;">Score / Total Marks</div>
                        </div>
                        <div class="glass-card" style="padding: 18px; text-align: center; background: #EEF2FF; border: 1.5px solid #C7D2FE;">
                            <div style="font-size: 28px; font-weight: 900; color: #4338CA;">${percent}</div>
                            <div style="font-size: 12px; font-weight: 800; color: #3730A3; text-transform: uppercase;">Percentage</div>
                        </div>
                    </div>

                    <!-- Teacher Feedback Section -->
                    <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 6px;">
                            💬 Teacher Feedback & Remarks:
                        </div>
                        <div style="font-size: 14px; color: #1E293B; line-height: 1.5; font-style: italic;">
                            ${sub.feedback ? `"${sub.feedback}"` : (isEvaluated ? 'Evaluation completed.' : 'Awaiting teacher evaluation.')}
                        </div>
                    </div>

                    <div style="display: flex; justify-content: center;">
                        <button class="glass-btn glass-btn-primary bouncy-btn" onclick="App.closeModal()" style="padding: 10px 28px; font-weight: 800;">
                            <span>Done ✓</span>
                        </button>
                    </div>
                </div>
            `);
        } catch(err) {
            App.showToast('Error loading exam result: ' + err.message, 'danger');
        }
    },

    // Notebook Detail & Notes Editor with 5 Paper Rule Types & Page Choice Prompt
    async renderNotebookDetail(container) {
        if (!this.currentBook) {
            this.activeTab = 'bookshelf';
            return this.renderTabContent(container);
        }

        // Reset stylus history for the new note
        this.stylusHistory = [];
        this.stylusHistoryIndex = -1;

        const res = await API.getNotes(this.currentBook.id);
        const notes = res.notes || [];

        // Default to first note if not set
        if (!this.currentNote && notes.length > 0) {
            this.currentNote = notes[0];
        }

        const activePageIndex = notes.findIndex(n => n.id == (this.currentNote ? this.currentNote.id : 0)) + 1 || (notes.length > 0 ? 1 : 0);

        container.innerHTML = `
            <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div>
                    <button id="btn-back-bookshelf" class="glass-btn glass-btn-sm" style="margin-bottom: 8px;">← Back to My Books</button>
                    <h2 style="font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <span>${this.currentBook.title}</span>
                        <span class="glass-badge glass-badge-accent">${this.currentBook.subject}</span>
                        <span id="note-page-number-badge" class="glass-badge glass-badge-success" style="font-size: 13px; font-weight: 700; border-color: rgba(46, 204, 113, 0.3);">Page ${activePageIndex} of ${notes.length || 1}</span>
                    </h2>
                </div>
                <button id="btn-create-note-top" class="glass-btn glass-btn-primary bouncy-btn">
                    <svg class="icon-svg"><use href="#icon-plus"/></svg>
                    <span>+ Add New Page</span>
                </button>
            </div>

            ${this.currentAssignmentContext ? `
                <!-- ACTIVE ASSIGNMENT SUBMISSION BANNER -->
                <div class="glass-card" style="margin-bottom: 20px; padding: 18px 24px; background: linear-gradient(135deg, #EEF2FF, #FAF5FF); border: 2px solid #C7D2FE; border-left: 6px solid #4F46E5; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; border-radius: 14px; box-shadow: 0 4px 20px rgba(79, 70, 229, 0.08);">
                    <div style="min-width: 0; flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="glass-badge" style="background: #4F46E5; color: #FFF; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">📝 Assignment Mode</span>
                            <span style="font-size: 12px; color: #6B7280;">Subject: <strong>${this.currentAssignmentContext.subject}</strong></span>
                        </div>
                        <h3 style="font-size: 18px; font-weight: 800; color: #151A2D; margin: 5px 0 2px 0;">${this.currentAssignmentContext.title}</h3>
                        <p style="font-size: 13px; color: #4B5563; margin: 0; line-height: 1.45;">${this.currentAssignmentContext.description || ''}</p>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button id="btn-submit-notebook-assignment" class="glass-btn glass-btn-primary bouncy-btn" style="background: linear-gradient(135deg, #10B981, #059669); font-weight: 800; padding: 12px 24px; font-size: 14px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
                            <span>📤 Submit Assignment to Teacher</span>
                        </button>
                        <button id="btn-dismiss-assignment-ctx" class="glass-btn glass-btn-secondary glass-btn-sm" title="Exit assignment mode" style="padding: 10px 14px;">
                            <span>Cancel</span>
                        </button>
                    </div>
                </div>
            ` : ''}

            <!-- TOP PAGES NAVIGATION BAR -->
            <div class="glass-panel" style="padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; overflow-x: auto; scrollbar-width: none;">
                <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; white-space: nowrap;">PAGES (${notes.length}):</span>
                <div id="top-pages-tab-strip" style="display: flex; align-items: center; gap: 8px; flex: 1;">
                    ${notes.length === 0 ? '<p style="font-size: 13px; color: var(--text-muted);">No pages created yet. Click "+ Add New Page".</p>' : ''}
                    ${notes.map((n, idx) => `
                        <button class="glass-btn glass-btn-sm note-top-tab-item ${this.currentNote && this.currentNote.id == n.id ? 'glass-btn-primary' : 'glass-btn-secondary'}" data-id="${n.id}" style="white-space: nowrap; gap: 6px; touch-action: manipulation;">
                            <span>📄 Page ${idx + 1}: ${n.title || 'Untitled'}</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Full-Width Note Editor Surface -->
            <div id="note-editor-container" style="width: 100%;">
                ${this.currentNote ? this.renderNoteEditorHTML(this.currentNote) : '<div class="glass-card" style="text-align: center; padding: 60px;"><p style="color: var(--text-secondary);">Select a page from the top menu or click "Add New Page".</p></div>'}
            </div>
        `;

        container.querySelector('#btn-back-bookshelf').addEventListener('click', () => {
            this.activeTab = 'bookshelf';
            this.renderTabContent(document.querySelector('#student-tab-content'));
        });

        const showNewPageChoiceModal = () => {
            App.showModal(`
                <div class="modal-card" style="max-width: 480px; text-align: center;">
                    <div class="modal-header">
                        <h3 class="modal-title">Create New Page</h3>
                        <button class="modal-close" onclick="App.closeModal()">✕</button>
                    </div>
                    <p style="color: var(--text-secondary); margin: 12px 0 20px;">Choose how you want your new page to start:</p>
                    <div style="display: flex; flex-direction: column; gap: 14px;">
                        <button id="btn-choice-blank" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 16px; font-weight: 700;">
                            📄 Start a New Blank Page
                        </button>
                        <button id="btn-choice-preserve" class="glass-btn glass-btn-secondary bouncy-btn" style="padding: 16px; font-weight: 700;">
                            📋 Continue / Preserve Previous Page's Content
                        </button>
                    </div>
                </div>
            `);

            const modal = document.getElementById('modal-container');
            modal.querySelector('#btn-choice-blank').addEventListener('click', async () => {
                App.closeModal();
                const newRes = await API.createNote(this.currentBook.id, `Page ${notes.length + 1}`, 'ruled', '');
                this.currentNote = newRes.note;
                this.renderNotebookDetail(container);
            });

            modal.querySelector('#btn-choice-preserve').addEventListener('click', async () => {
                App.closeModal();
                const prevContent = this.currentNote ? this.currentNote.content : '';
                const newRes = await API.createNote(this.currentBook.id, `Page ${notes.length + 1}`, this.currentNote ? this.currentNote.rule_type : 'ruled', prevContent);
                this.currentNote = newRes.note;
                this.renderNotebookDetail(container);
            });
        };

        const createNoteBtn = container.querySelector('#btn-create-note-top');
        if (createNoteBtn) {
            createNoteBtn.addEventListener('click', showNewPageChoiceModal);
        }

        container.querySelectorAll('.note-top-tab-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const noteId = e.currentTarget.dataset.id;
                this.currentNote = notes.find(n => n.id == noteId);
                this.renderNotebookDetail(container);
            });
        });

        if (this.currentNote) {
            this.bindEditorEvents(container);
        }
    },

    renderNoteEditorHTML(note) {
        let textContent = note.content || '';
        let canvasData = null;

        try {
            if (note.content && note.content.startsWith('{')) {
                const parsed = JSON.parse(note.content);
                if (parsed.type === 'smartslate_note_v2') {
                    textContent = parsed.text || '';
                    canvasData = parsed.canvasData || null;
                }
            }
        } catch (e) {}

        return `
            <div class="glass-card" style="padding: 20px; width: 100%;">
                <!-- Header Toolbar -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 12px;">
                    <input type="text" id="note-title-input" class="glass-input" value="${note.title}" style="max-width: 280px; font-weight: 700; font-size: 18px;" placeholder="Page Title...">

                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <!-- Full Screen Writing Mode Toggle -->
                        <button id="btn-fullscreen-note" class="glass-btn glass-btn-secondary glass-btn-sm" title="Toggle Full Screen Writing Mode">
                            <svg class="icon-svg"><use href="#icon-menu"/></svg>
                            <span id="fullscreen-btn-label">Full Screen</span>
                        </button>

                        <!-- 5 Rule Types Selector -->
                        <select id="note-ruletype-select" class="glass-select" style="width: auto;">
                            <option value="ruled" ${note.rule_type === 'ruled' ? 'selected' : ''}>📏 Single Ruled</option>
                            <option value="double_ruled" ${note.rule_type === 'double_ruled' ? 'selected' : ''}>📏 Double Ruled</option>
                            <option value="four_ruled" ${note.rule_type === 'four_ruled' ? 'selected' : ''}>✍️ Four Ruled (Handwriting)</option>
                            <option value="half_ruled" ${note.rule_type === 'half_ruled' ? 'selected' : ''}>🖼️ Half Ruled (Diagram)</option>
                            <option value="plain" ${note.rule_type === 'plain' ? 'selected' : ''}>📄 Plain White</option>
                        </select>

                        <!-- Share Note Button -->
                        <button id="btn-share-note" class="glass-btn glass-btn-secondary glass-btn-sm" title="Share with Classmate">
                            <svg class="icon-svg"><use href="#icon-share"/></svg>
                            <span>Share</span>
                        </button>

                        <button id="btn-delete-note" class="glass-btn glass-btn-sm" style="color: var(--status-danger);" title="Delete Page">Delete</button>

                        <!-- Auto Save Status Indicator -->
                        <span id="auto-save-status" class="glass-badge glass-badge-success" style="font-size: 12px;">Saved ✓</span>
                    </div>
                </div>

                <!-- STYLUS / PAINT TOOLBAR -->
                <div class="stylus-toolbar" style="flex-direction: column; gap: 8px; width: 100%;">
                    <!-- Row 1: Drawing Tools -->
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; width: 100%;">
                        <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; min-width: 40px;">TOOLS</span>
                        <div class="stylus-tool-group">
                            <button class="stylus-tool-btn active" data-tool="select" title="Select & Edit Text/Components">👆 Select Text</button>
                            <button class="stylus-tool-btn" data-tool="pen" title="Pen">✏️ Pen</button>
                            <button class="stylus-tool-btn" data-tool="highlighter" title="Highlighter">🖊️ Highlight</button>
                            <button class="stylus-tool-btn" data-tool="eraser" title="Eraser">🧹 Eraser</button>
                            <button class="stylus-tool-btn" data-tool="fill" title="Fill / Bucket">🪣 Fill</button>
                            <button class="stylus-tool-btn" data-tool="text_canvas" title="Text on Canvas">🔤 Canvas Text</button>
                            <button class="stylus-tool-btn" data-tool="line" title="Straight Line">╱ Line</button>
                            <button class="stylus-tool-btn" data-tool="rect" title="Rectangle">▭ Rect</button>
                            <button class="stylus-tool-btn" data-tool="circle" title="Circle/Ellipse">◯ Circle</button>
                            <button class="stylus-tool-btn" data-tool="arrow" title="Arrow">↗ Arrow</button>
                        </div>
                    </div>
                    <!-- Row 2: Colors, Sizes, Actions -->
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; width: 100%;">
                        <div class="stylus-tool-group">
                            <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">INK</span>
                            <div class="color-swatch active" data-color="#1A365D" style="background: #1A365D;" title="Navy Ink"></div>
                            <div class="color-swatch" data-color="#1A202C" style="background: #1A202C;" title="Pencil Black"></div>
                            <div class="color-swatch" data-color="#E53E3E" style="background: #E53E3E;" title="Red Pen"></div>
                            <div class="color-swatch" data-color="#2F855A" style="background: #2F855A;" title="Green Pen"></div>
                            <div class="color-swatch" data-color="#3182CE" style="background: #3182CE;" title="Blue Pen"></div>
                            <div class="color-swatch" data-color="#805AD5" style="background: #805AD5;" title="Purple"></div>
                            <div class="color-swatch" data-color="#DD6B20" style="background: #DD6B20;" title="Orange"></div>
                            <div class="color-swatch" data-color="#FFFFFF" style="background: #FFFFFF; border: 1px solid #ccc;" title="White (Eraser-paint)"></div>
                            <div class="color-swatch" data-color="rgba(255,235,59,0.5)" style="background: #ECC94B;" title="Yellow Highlight"></div>
                        </div>
                        <div class="stylus-tool-group">
                            <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">SIZE</span>
                            <button class="stroke-size-btn" data-size="1.5" title="Fine">1</button>
                            <button class="stroke-size-btn active" data-size="3" title="Medium">2</button>
                            <button class="stroke-size-btn" data-size="6" title="Bold">3</button>
                            <button class="stroke-size-btn" data-size="14" title="Broad">4</button>
                        </div>
                        <div class="stylus-tool-group">
                            <button class="stylus-tool-btn" id="btn-undo-stroke" title="Undo">↩️ Undo</button>
                            <button class="stylus-tool-btn" id="btn-redo-stroke" title="Redo">↪️ Redo</button>
                            <button class="stylus-tool-btn" id="btn-clear-canvas" style="color: var(--status-danger);" title="Clear All Ink">🧼 Clear</button>
                        </div>
                    </div>
                </div>

                <!-- Paper Sheet Container matching chosen Rule Type -->
                <div id="paper-sheet-element" class="paper-sheet ${note.rule_type}" style="position: relative; width: 100%;">
                    <textarea id="note-content-textarea" class="note-editor-textarea" placeholder="Start writing with your stylus or type notes...">${textContent}</textarea>
                    <canvas id="stylus-canvas" class="stylus-canvas pointer-events-none"></canvas>
                </div>

                <!-- Add Page Button - Fixed at bottom center, expands canvas -->
                <div style="display: flex; justify-content: center; padding: 18px 0 6px 0;">
                    <button id="btn-add-page" class="glass-btn glass-btn-secondary" style="gap: 8px; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 50px; box-shadow: 0 4px 16px rgba(107,143,216,0.18);">
                        <span style="font-size: 20px; line-height:1;">+</span>
                        <span>Add Page</span>
                    </button>
                </div>
            </div>
        `;
    },

    bindEditorEvents(container) {
        const titleInput = container.querySelector('#note-title-input');
        const ruleSelect = container.querySelector('#note-ruletype-select');
        const contentTextarea = container.querySelector('#note-content-textarea');
        const paperSheet = container.querySelector('#paper-sheet-element');

        // Full Screen Writing Mode Toggle
        const fullscreenBtn = container.querySelector('#btn-fullscreen-note');
        const editorContainer = container.querySelector('#note-editor-container');
        if (fullscreenBtn && editorContainer) {
            fullscreenBtn.addEventListener('click', () => {
                const isFullscreen = editorContainer.classList.toggle('fullscreen-note-mode');
                fullscreenBtn.classList.toggle('glass-btn-primary', isFullscreen);
                const label = fullscreenBtn.querySelector('#fullscreen-btn-label');
                if (label) label.textContent = isFullscreen ? 'Exit Full Screen' : 'Full Screen';
                App.toast(isFullscreen ? 'Entered Full Screen Writing Mode 📺' : 'Exited Full Screen Mode');

                setTimeout(() => {
                    if (this.initCanvasSizeRef) {
                        this.initCanvasSizeRef();
                    }
                }, 100);
            });
        }

        // Rule Type change updates CSS background instantly
        ruleSelect.addEventListener('change', (e) => {
            const newRule = e.target.value;
            paperSheet.className = `paper-sheet ${newRule}`;
            this.triggerAutoSave(container);
        });

        titleInput.addEventListener('input', () => this.triggerAutoSave(container));
        contentTextarea.addEventListener('input', () => this.triggerAutoSave(container));

        // Initialize Canvas Stylus Engine
        this.initStylusEngine(container);

        // Share note button
        container.querySelector('#btn-share-note').addEventListener('click', () => {
            this.showShareNoteModal(this.currentNote.id);
        });

        // Delete note button
        container.querySelector('#btn-delete-note').addEventListener('click', async () => {
            if (confirm('Delete this page permanently?')) {
                await API.deleteNote(this.currentNote.id);
                this.currentNote = null;
                App.showToast('Note deleted.');
                this.renderNotebookDetail(container);
            }
        });

        // Add Page (expand canvas) button
        const addPageBtn = container.querySelector('#btn-add-page');
        if (addPageBtn) {
            addPageBtn.addEventListener('click', () => {
                const canvas = container.querySelector('#stylus-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const oldHeight = canvas.height;
                const expandBy = 1122; // A4-equivalent height

                // Snapshot existing content
                const snapshot = ctx.getImageData(0, 0, canvas.width, oldHeight);

                // Expand canvas (this wipes it)
                canvas.height = oldHeight + expandBy;

                // Restore content at top
                ctx.putImageData(snapshot, 0, 0);

                // Also expand the textarea so both scroll together
                const textarea = container.querySelector('#note-content-textarea');
                if (textarea) {
                    const currentPx = parseInt(window.getComputedStyle(textarea).height) || oldHeight;
                    textarea.style.minHeight = (currentPx + expandBy) + 'px';
                }

                // Also expand the paper sheet container
                paperSheet.style.minHeight = canvas.height + 'px';

                // Sync history with the new larger canvas
                this.saveCanvasHistory(canvas);
                this.triggerAutoSave(container);

                // Smooth-scroll to the new blank area
                canvas.scrollIntoView({ behavior: 'smooth', block: 'end' });

                App.toast('New page added! ✨', 'success');
            });
        }
    },

    initStylusEngine(container) {
        const canvas = container.querySelector('#stylus-canvas');
        const textarea = container.querySelector('#note-content-textarea');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Canvas must be sized AFTER the DOM paints so getBoundingClientRect is accurate
        const initCanvasSize = () => {
            const paperSheet = canvas.parentElement;
            if (!paperSheet) return;
            const rect = paperSheet.getBoundingClientRect();
            const textarea = container.querySelector('#note-content-textarea');

            if (rect.width > 0) {
                let savedHeight = 520;

                // Load saved drawing & height after sizing
                if (this.currentNote && this.currentNote.content && this.currentNote.content.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(this.currentNote.content);
                        if (parsed.canvasHeight && parsed.canvasHeight > savedHeight) {
                            savedHeight = parsed.canvasHeight;
                        }

                        if (parsed.canvasData) {
                            const img = new Image();
                            img.onload = () => {
                                const finalHeight = Math.max(rect.height, savedHeight, img.naturalHeight || 520);
                                canvas.width = rect.width;
                                canvas.height = finalHeight;
                                paperSheet.style.minHeight = finalHeight + 'px';
                                if (textarea) textarea.style.minHeight = finalHeight + 'px';

                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0); // 1:1 ratio painting prevents compression and overlapping
                                this.saveCanvasHistory(canvas);
                            };
                            img.src = parsed.canvasData;
                            return; // don't call saveHistory twice
                        }
                    } catch (e) {}
                }

                const finalHeight = Math.max(rect.height, savedHeight);
                canvas.width = rect.width;
                canvas.height = finalHeight;
                paperSheet.style.minHeight = finalHeight + 'px';
                if (textarea) textarea.style.minHeight = finalHeight + 'px';
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.saveCanvasHistory(canvas);
            }
        };

        this.initCanvasSizeRef = initCanvasSize;

        // Use requestAnimationFrame to ensure layout is complete before measuring
        requestAnimationFrame(() => setTimeout(initCanvasSize, 0));

        // State variables — Default to select tool so text can be selected fast
        let isDrawing = false;
        let tool = 'select';
        let color = '#1A365D';
        let width = 3;
        let lastX = 0, lastY = 0;
        let startX = 0, startY = 0;
        let snapshotBeforeShape = null; // for shape preview

        // Tool button click
        container.querySelectorAll('.stylus-tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.stylus-tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                tool = btn.dataset.tool;

                if (tool === 'select' || tool === 'text') {
                    // Select Text & Keyboard mode: enable textarea text selection and editing
                    canvas.classList.add('pointer-events-none');
                    if (textarea) {
                        textarea.style.pointerEvents = 'auto';
                        textarea.focus();
                    }
                } else {
                    canvas.classList.remove('pointer-events-none');
                    if (textarea) {
                        textarea.style.pointerEvents = 'none';
                    }
                }

                if (tool === 'highlighter') { color = 'rgba(255,235,59,0.5)'; width = 14; }
                else if (tool === 'eraser') { /* keep color */ }
                else if (['fill', 'line', 'rect', 'circle', 'arrow'].includes(tool)) { canvas.style.cursor = 'crosshair'; }
                else { canvas.style.cursor = 'default'; }
            });
        });

        // Color swatches
        container.querySelectorAll('.color-swatch').forEach(sw => {
            sw.addEventListener('click', () => {
                container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                sw.classList.add('active');
                color = sw.dataset.color;
                if (tool === 'text' || tool === 'eraser') {
                    tool = 'pen';
                    container.querySelectorAll('.stylus-tool-btn[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === 'pen'));
                    canvas.classList.remove('pointer-events-none');
                }
            });
        });

        // Stroke size buttons
        container.querySelectorAll('.stroke-size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.stroke-size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                width = parseFloat(btn.dataset.size);
            });
        });

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure > 0 ? e.pressure : 0.5 };
        };

        // ─── Fill tool (flood fill) ────────────────────────────────────────────
        const hexToRgb = (c) => {
            if (c.startsWith('rgba')) {
                const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                return m ? [+m[1],+m[2],+m[3],255] : [0,0,0,255];
            }
            const hex = c.replace('#','');
            const num = parseInt(hex, 16);
            return [(num>>16)&255,(num>>8)&255,num&255,255];
        };
        const floodFill = (x, y, fillColor) => {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const fillRgb = hexToRgb(fillColor);
            const idx = (Math.round(y) * canvas.width + Math.round(x)) * 4;
            const target = [data[idx], data[idx+1], data[idx+2], data[idx+3]];
            if (target.every((v,i) => v === fillRgb[i])) return;
            const stack = [[Math.round(x), Math.round(y)]];
            const match = (i) => data[i]===target[0] && data[i+1]===target[1] && data[i+2]===target[2] && data[i+3]===target[3];
            const set = (i) => { data[i]=fillRgb[0]; data[i+1]=fillRgb[1]; data[i+2]=fillRgb[2]; data[i+3]=fillRgb[3]; };
            while (stack.length) {
                const [fx, fy] = stack.pop();
                if (fx<0||fy<0||fx>=canvas.width||fy>=canvas.height) continue;
                const i = (fy*canvas.width+fx)*4;
                if (!match(i)) continue;
                set(i);
                stack.push([fx+1,fy],[fx-1,fy],[fx,fy+1],[fx,fy-1]);
            }
            ctx.putImageData(imgData, 0, 0);
        };

        // ─── Draw shape preview ─────────────────────────────────────────────────
        const drawShapePreview = (pos) => {
            ctx.putImageData(snapshotBeforeShape, 0, 0);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.globalCompositeOperation = 'source-over';

            if (tool === 'line') {
                ctx.moveTo(startX, startY); ctx.lineTo(pos.x, pos.y); ctx.stroke();
            } else if (tool === 'rect') {
                ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
            } else if (tool === 'circle') {
                const rx = Math.abs(pos.x - startX) / 2, ry = Math.abs(pos.y - startY) / 2;
                ctx.ellipse(startX + (pos.x-startX)/2, startY + (pos.y-startY)/2, rx, ry, 0, 0, Math.PI*2);
                ctx.stroke();
            } else if (tool === 'arrow') {
                const dx = pos.x - startX, dy = pos.y - startY;
                const angle = Math.atan2(dy, dx);
                const headLen = Math.max(12, width * 4);
                ctx.moveTo(startX, startY); ctx.lineTo(pos.x, pos.y); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headLen*Math.cos(angle-Math.PI/6), pos.y - headLen*Math.sin(angle-Math.PI/6));
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headLen*Math.cos(angle+Math.PI/6), pos.y - headLen*Math.sin(angle+Math.PI/6));
                ctx.stroke();
            } else if (tool === 'select') {
                ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
                ctx.setLineDash([]);
            }
        };

        // ─── Text on canvas tool ────────────────────────────────────────────────
        const placeTextInput = (x, y) => {
            if (textInput) textInput.remove();
            textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.placeholder = 'Type text, press Enter';
            textInput.style.cssText = `
                position: absolute;
                left: ${x}px; top: ${y - 20}px;
                font-size: ${Math.max(14, width * 3)}px;
                color: ${color};
                background: rgba(255,255,255,0.85);
                border: 2px dashed ${color};
                border-radius: 4px;
                padding: 4px 8px;
                min-width: 120px;
                z-index: 100;
                outline: none;
            `;
            const canvasParent = canvas.parentElement;
            canvasParent.style.position = 'relative';
            canvasParent.appendChild(textInput);
            textInput.focus();

            textInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const text = textInput.value.trim();
                    if (text) {
                        ctx.font = `${Math.max(16, width * 3)}px "Inter", sans-serif`;
                        ctx.fillStyle = color;
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.fillText(text, x, y);
                    }
                    textInput.remove(); textInput = null;
                    this.saveCanvasHistory(canvas);
                    this.triggerAutoSave(container);
                } else if (e.key === 'Escape') {
                    textInput.remove(); textInput = null;
                }
            });
        };

        // ─── Pointer Events ─────────────────────────────────────────────────────
        canvas.addEventListener('pointerdown', (e) => {
            if (tool === 'text') return;
            const pos = getPos(e);

            if (tool === 'fill') {
                floodFill(pos.x, pos.y, color);
                this.saveCanvasHistory(canvas);
                this.triggerAutoSave(container);
                return;
            }

            if (tool === 'text_canvas') {
                placeTextInput(pos.x, pos.y);
                return;
            }

            if (tool === 'select') {
                if (floatingSelection) {
                    const { x, y, w, h } = floatingSelection;
                    if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
                        // Clicked inside active selection -> start dragging it
                        isDraggingSelection = true;
                        dragOffsetX = pos.x - x;
                        dragOffsetY = pos.y - y;
                        return;
                    } else {
                        // Clicked outside -> commit current selection
                        ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                        floatingSelection = null;
                        this.saveCanvasHistory(canvas);
                        this.triggerAutoSave(container);
                    }
                }
            }

            isDrawing = true;
            startX = pos.x; startY = pos.y;
            lastX = pos.x; lastY = pos.y;

            if (['line','rect','circle','arrow','select'].includes(tool)) {
                snapshotBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
            } else {
                ctx.beginPath(); ctx.moveTo(lastX, lastY);
            }
        });

        canvas.addEventListener('pointermove', (e) => {
            if (tool === 'text' || tool === 'fill' || tool === 'text_canvas') return;
            e.preventDefault();
            const pos = getPos(e);

            if (tool === 'select' && isDraggingSelection && floatingSelection) {
                // Restore snapshot (hole where selection was cut)
                ctx.putImageData(snapshotBeforeShape, 0, 0);
                floatingSelection.x = pos.x - dragOffsetX;
                floatingSelection.y = pos.y - dragOffsetY;
                
                // Draw selection image
                ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                
                // Draw dashed border
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)';
                ctx.setLineDash([5, 5]);
                ctx.lineWidth = 1;
                ctx.strokeRect(floatingSelection.x, floatingSelection.y, floatingSelection.w, floatingSelection.h);
                ctx.setLineDash([]);
                return;
            }

            if (!isDrawing) return;

            if (['line','rect','circle','arrow','select'].includes(tool)) {
                drawShapePreview(pos);
                return;
            }

            // Freehand draw
            ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(pos.x, pos.y);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth = tool === 'eraser' ? width * 4 : (pos.pressure ? width * pos.pressure * 1.6 : width);
            ctx.stroke();
            lastX = pos.x; lastY = pos.y;
        });

        canvas.addEventListener('pointerup', (e) => {
            if (tool === 'select' && isDraggingSelection) {
                isDraggingSelection = false;
                this.triggerAutoSave(container);
                return; // Keep it floating
            }

            if (!isDrawing) return;

            if (['line','rect','circle','arrow'].includes(tool)) {
                drawShapePreview(getPos(e));
            } else if (tool === 'select') {
                const pos = getPos(e);
                const rx = Math.min(startX, pos.x);
                const ry = Math.min(startY, pos.y);
                const rw = Math.abs(pos.x - startX);
                const rh = Math.abs(pos.y - startY);

                if (rw > 5 && rh > 5) { // Minimum selection size
                    // Restore snapshot to remove the dashed preview lines
                    ctx.putImageData(snapshotBeforeShape, 0, 0);
                    
                    // Capture image data
                    const imgData = ctx.getImageData(rx, ry, rw, rh);
                    
                    // Clear the selected area (punch hole)
                    ctx.clearRect(rx, ry, rw, rh);
                    
                    // Save new baseline with hole
                    snapshotBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    floatingSelection = { x: rx, y: ry, w: rw, h: rh, imgData };
                    
                    // Draw dashed border around the new floating selection
                    ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)';
                    ctx.setLineDash([5, 5]);
                    ctx.lineWidth = 1;
                    ctx.strokeRect(floatingSelection.x, floatingSelection.y, floatingSelection.w, floatingSelection.h);
                    ctx.setLineDash([]);
                }
            }

            isDrawing = false;
            
            // Only save history if we are not actively holding a floating selection 
            // (we save history when it's committed)
            if (tool !== 'select') {
                this.saveCanvasHistory(canvas);
                this.triggerAutoSave(container);
            }
        });

        canvas.addEventListener('pointerleave', () => {
            if (isDrawing) {
                isDrawing = false;
                this.saveCanvasHistory(canvas);
                this.triggerAutoSave(container);
            }
        });

        // Action buttons
        const undoBtn = container.querySelector('#btn-undo-stroke');
        const redoBtn = container.querySelector('#btn-redo-stroke');
        const clearBtn = container.querySelector('#btn-clear-canvas');
        if (undoBtn) undoBtn.addEventListener('click', () => this.undoCanvas(canvas, container));
        if (redoBtn) redoBtn.addEventListener('click', () => this.redoCanvas(canvas, container));
        if (clearBtn) clearBtn.addEventListener('click', () => {
            if (confirm('Clear all drawings on this page?')) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.saveCanvasHistory(canvas);
                this.triggerAutoSave(container);
            }
        });

        // Active Assignment Submission Button inside Notebook
        const submitAssignBtn = container.querySelector('#btn-submit-notebook-assignment');
        if (submitAssignBtn && this.currentAssignmentContext) {
            submitAssignBtn.addEventListener('click', async () => {
                const assignCtx = this.currentAssignmentContext;
                const textarea = container.querySelector('#note-content-textarea');
                const textContent = textarea ? textarea.value : (this.currentNote?.content || 'Completed in notebook.');

                try {
                    submitAssignBtn.disabled = true;
                    submitAssignBtn.textContent = 'Submitting...';

                    // 1. Force flush current note save
                    await this.flushPendingAutoSave(container);

                    // 2. Submit assignment to server
                    await API.submitAssignment(assignCtx.id, textContent);

                    this.currentAssignmentContext = null;
                    App.showToast(`🎉 Assignment "${assignCtx.title}" submitted to Teacher!`, 'success');
                    this.activeTab = 'homework';
                    this.renderTabContent(document.querySelector('#student-tab-content'));
                } catch (err) {
                    App.showToast('Failed to submit assignment: ' + err.message, 'danger');
                    submitAssignBtn.disabled = false;
                    submitAssignBtn.textContent = '📤 Submit Assignment to Teacher';
                }
            });
        }
    },

    saveCanvasHistory(canvas) {
        if (!this.stylusHistory) this.stylusHistory = [];
        if (this.stylusHistoryIndex === undefined) this.stylusHistoryIndex = -1;

        if (this.stylusHistoryIndex < this.stylusHistory.length - 1) {
            this.stylusHistory = this.stylusHistory.slice(0, this.stylusHistoryIndex + 1);
        }

        const ctx = canvas.getContext('2d');
        if (canvas.width > 0 && canvas.height > 0) {
            this.stylusHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            this.stylusHistoryIndex = this.stylusHistory.length - 1;
        }
    },

    undoCanvas(canvas, container) {
        if (this.stylusHistory && this.stylusHistoryIndex > 0) {
            this.stylusHistoryIndex--;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(this.stylusHistory[this.stylusHistoryIndex], 0, 0);
            this.triggerAutoSave(container);
        }
    },

    redoCanvas(canvas, container) {
        if (this.stylusHistory && this.stylusHistoryIndex < this.stylusHistory.length - 1) {
            this.stylusHistoryIndex++;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(this.stylusHistory[this.stylusHistoryIndex], 0, 0);
            this.triggerAutoSave(container);
        }
    },

    async flushPendingAutoSave(container) {
        if (this.autoSaveTimer && this.currentNote) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
            try {
                const titleInput = container.querySelector('#note-title-input');
                const ruleSelect = container.querySelector('#note-ruletype-select');
                const textInput = container.querySelector('#note-content-textarea');
                const canvas = container.querySelector('#stylus-canvas');

                if (titleInput && textInput && this.currentNote) {
                    const title = titleInput.value;
                    const rule_type = ruleSelect ? ruleSelect.value : 'ruled';
                    const textContent = textInput.value;
                    let canvasData = null;
                    if (canvas && canvas.width > 0 && canvas.height > 0) {
                        canvasData = canvas.toDataURL('image/png');
                    }
                    const contentData = JSON.stringify({
                        type: 'smartslate_note_v2',
                        canvasWidth: canvas ? canvas.width : null,
                        canvasHeight: canvas ? canvas.height : null,
                        canvasData,
                        text: textContent
                    });
                    await API.updateNote(this.currentNote.id, title, rule_type, contentData);
                    this.currentNote.content = contentData;
                }
            } catch (e) {}
        }
    },

    triggerAutoSave(container) {
        if (!this.currentNote) return;
        const noteIdToSave = this.currentNote.id;

        const saveStatus = container.querySelector('#auto-save-status');
        if (saveStatus) {
            saveStatus.textContent = 'Saving...';
            saveStatus.className = 'glass-badge glass-badge-warning';
        }

        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(async () => {
            try {
                const titleInput = container.querySelector('#note-title-input');
                const ruleSelect = container.querySelector('#note-ruletype-select');
                const textInput = container.querySelector('#note-content-textarea');
                const canvas = container.querySelector('#stylus-canvas');

                if (!titleInput || !textInput) return;

                const title = titleInput.value;
                const rule_type = ruleSelect ? ruleSelect.value : 'ruled';
                const textContent = textInput.value;

                let canvasData = null;
                if (canvas && canvas.width > 0 && canvas.height > 0) {
                    canvasData = canvas.toDataURL('image/png');
                }

                const contentData = JSON.stringify({
                    type: 'smartslate_note_v2',
                    canvasWidth: canvas ? canvas.width : null,
                    canvasHeight: canvas ? canvas.height : null,
                    canvasData,
                    text: textContent
                });

                await API.updateNote(noteIdToSave, title, rule_type, contentData);
                if (this.currentNote && this.currentNote.id === noteIdToSave) {
                    this.currentNote.title = title;
                    this.currentNote.rule_type = rule_type;
                    this.currentNote.content = contentData;
                }

                if (saveStatus) {
                    saveStatus.textContent = 'Saved ✓';
                    saveStatus.className = 'glass-badge glass-badge-success';
                }
            } catch (err) {
                if (saveStatus) {
                    saveStatus.textContent = 'Offline - Retrying';
                    saveStatus.className = 'glass-badge glass-badge-danger';
                }
            }
        }, 600);
    },

    // 8.2 Assignments Section (Status tabs: All, Upcoming, Submitted, Graded)
    async renderAssignments(container) {
        const activeClass = AcademicData.selectedClass || (App.currentUser ? App.currentUser.class_grade : 8);
        const res = await API.getAssignments();
        const assignments = res.assignments || [];
        const activeFilter = this.assignmentStatusFilter || 'all';

        const filteredAssignments = assignments.filter(a => {
            const isSub = a.submission_status === 'submitted' || a.submission_status === 'graded';
            if (activeFilter === 'upcoming') return !isSub;
            if (activeFilter === 'submitted') return a.submission_status === 'submitted';
            if (activeFilter === 'graded') return a.submission_status === 'graded';
            return true;
        });

        container.innerHTML = `
            <div class="my-classes-page-wrapper">
                <!-- Top Header Row -->
                <div class="classes-top-header">
                    <div class="classes-header-left">
                        <h1 class="classes-header-title">Assignments</h1>
                    </div>
                    <button class="btn-join-class-pill bouncy-btn" onclick="App.showQuickActionModal()">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>Submit Task</span>
                    </button>
                </div>

                <!-- Tabs (All / Upcoming / Submitted / Graded) -->
                <div class="classes-tabs-container">
                    <div class="classes-tabs-row">
                        <button class="classes-tab-item ${activeFilter === 'all' ? 'active' : ''}" data-status="all">
                            All (${assignments.length})
                        </button>
                        <button class="classes-tab-item ${activeFilter === 'upcoming' ? 'active' : ''}" data-status="upcoming">
                            Upcoming
                        </button>
                        <button class="classes-tab-item ${activeFilter === 'submitted' ? 'active' : ''}" data-status="submitted">
                            Submitted
                        </button>
                        <button class="classes-tab-item ${activeFilter === 'graded' ? 'active' : ''}" data-status="graded">
                            Graded
                        </button>
                    </div>
                </div>

                <!-- Assignments List -->
                <div class="classes-cards-vertical-list">
                    ${filteredAssignments.length === 0 ? `
                        <div class="glass-card" style="text-align: center; padding: 48px; color: var(--text-muted);">
                            No tasks found for this filter.
                        </div>
                    ` : ''}

                    ${filteredAssignments.map(a => {
                        const isSubmitted = a.submission_status === 'submitted' || a.submission_status === 'graded';
                        let submittedText = '';
                        try {
                            const parsed = JSON.parse(a.submission_content || '{}');
                            submittedText = parsed.text || a.submission_content || '';
                        } catch (e) {
                            submittedText = a.submission_content || '';
                        }

                        return `
                            <div class="class-exact-card" style="align-items: flex-start; cursor: default;">
                                <div class="class-exact-left" style="align-items: flex-start;">
                                    <div class="class-exact-icon-box" style="background: #FFEDD5; color: #EA580C;">
                                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                                    </div>
                                    <div class="class-exact-text-group">
                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                                            <h4 class="class-exact-name" style="font-size: 18px;">${a.title}</h4>
                                            <span class="glass-badge ${isSubmitted ? 'glass-badge-success' : 'glass-badge-warning'}" style="font-size: 11px; font-weight: 700; padding: 3px 8px;">
                                                ${a.submission_status === 'graded' ? 'Graded (18/20) ✓' : isSubmitted ? 'Submitted ✓' : '⏳ Pending'}
                                            </span>
                                        </div>
                                        <div class="class-exact-teacher">Teacher: ${a.teacher_name || 'Prof. Vikram Rao'}  •  Class ${activeClass}</div>
                                        <div class="class-exact-meta" style="margin-top: 4px;">
                                            <span>📅 Due: ${new Date(a.due_at).toLocaleDateString()}</span>
                                            <span class="meta-dot">•</span>
                                            <span>${a.description || 'Complete all exercises in chapter workbook.'}</span>
                                        </div>

                                        ${a.grade ? `<div style="padding: 8px 12px; background: #ECFDF5; border-radius: 8px; color: #059669; font-weight: 700; font-size: 12px; margin-top: 8px; display: inline-block;">Grade & Remarks: ${a.grade}</div>` : ''}

                                        ${isSubmitted && submittedText ? `
                                            <details style="margin-top: 10px; background: #F9FAFB; padding: 10px 14px; border-radius: 8px; border: 1px solid #ECEAF2;">
                                                <summary style="font-size: 12px; font-weight: 700; cursor: pointer; color: #8864F3;">👁️ View Submitted Response</summary>
                                                <p style="margin-top: 8px; font-size: 13px; color: #151A2D; white-space: pre-wrap;">${submittedText}</p>
                                            </details>
                                        ` : ''}
                                    </div>
                                </div>

                                <div class="class-exact-right" style="align-self: center;">
                                    <button class="btn-start-test bouncy-btn btn-open-hw-workspace" data-id="${a.id}" style="padding: 9px 18px; font-size: 13px;">
                                        ${isSubmitted ? 'View Response' : 'Open & Submit'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('.filter-tab-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.assignmentStatusFilter = e.currentTarget.dataset.status;
                this.renderAssignments(container);
            });
        });

        container.querySelectorAll('.btn-open-hw-workspace').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assignId = e.currentTarget.dataset.id;
                const assignObj = assignments.find(a => a.id == assignId);
                this.showHomeworkWorkspaceModal(container, assignObj);
            });
        });
    },

    // ─────────────────────────────────────────────────────────
    // 8.3 CALENDAR & TIMETABLE (Matching Image 4 Reference Screenshot)
    // ─────────────────────────────────────────────────────────
    async renderCalendarView(container) {
        const currentMode = this.calendarMode || 'month';

        const upcomingEvents = [
            {
                title: 'Physics Test',
                subtitle: 'Chapter 4: Laws of Motion',
                date: '15 May 2026',
                time: '11:00 AM',
                bgColor: '#F3E8FF',
                iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#8864F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-30 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(90 12 12)"/></svg>`
            },
            {
                title: 'Chemistry Assignment',
                subtitle: 'Organic Compounds',
                date: '5 May 2026',
                time: '11:59 PM',
                bgColor: '#FFEDD5',
                iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`
            },
            {
                title: 'Maths Test',
                subtitle: 'Quadratic Equations',
                date: '18 May 2026',
                time: '10:00 AM',
                bgColor: '#F3E8FF',
                iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#8864F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>`
            },
            {
                title: 'Chemistry Test',
                subtitle: 'Periodic Table',
                date: '18 May 2026',
                time: '02:00 PM',
                bgColor: '#CCFBF1',
                iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0D9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V2h-4z"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg>`
            },
            {
                title: 'Maths Assignment',
                subtitle: 'Extra Questions',
                date: '14 May 2026',
                time: '11:59 PM',
                bgColor: '#FFE4E6',
                iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
            }
        ];

        container.innerHTML = `
            <div class="calendar-page-wrapper">
                <!-- Top Header Row -->
                <div class="tests-header-row">
                    <h1 class="tests-header-title">Calendar</h1>
                    <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.showAddEventModal()" style="font-weight: 700;">
                        + Add Event
                    </button>
                </div>

                <!-- Sub-Header Controls Row -->
                <div class="calendar-top-controls-row">
                    <div class="segmented-control-pill" style="padding: 4px;">
                        <button class="segmented-btn ${currentMode === 'month' ? 'active' : ''}" style="padding: 6px 16px;" onclick="StudentView.setCalendarMode('month')">Month</button>
                        <button class="segmented-btn ${currentMode === 'week' ? 'active' : ''}" style="padding: 6px 16px;" onclick="StudentView.setCalendarMode('week')">Week</button>
                        <button class="segmented-btn ${currentMode === 'day' ? 'active' : ''}" style="padding: 6px 16px;" onclick="StudentView.setCalendarMode('day')">Day</button>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="display: flex; background: #FFFFFF; border: 1px solid #ECEAF2; border-radius: 8px; overflow: hidden;">
                            <button class="segmented-btn" style="padding: 6px 10px;">‹</button>
                            <button class="segmented-btn" style="padding: 6px 10px;">›</button>
                        </div>
                        <button class="segmented-btn active" style="padding: 6px 14px; border: 1px solid #ECEAF2;">Today</button>
                    </div>
                </div>

                <!-- Main May 2026 Calendar Card (Top Full Width) -->
                <div class="calendar-main-grid-card" style="margin-bottom: 24px;">
                    <div class="calendar-month-title">May 2026</div>

                    <div class="calendar-date-matrix">
                        <div class="calendar-header-day">Sun</div>
                        <div class="calendar-header-day">Mon</div>
                        <div class="calendar-header-day">Tue</div>
                        <div class="calendar-header-day">Wed</div>
                        <div class="calendar-header-day">Thu</div>
                        <div class="calendar-header-day">Fri</div>
                        <div class="calendar-header-day">Sat</div>

                        <!-- Row 1: 26 to 2 -->
                        <div class="calendar-matrix-cell"><span class="calendar-date-num" style="color: #9CA3AF;">26</span></div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num" style="color: #9CA3AF;">27</span></div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num" style="color: #9CA3AF;">28</span></div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num" style="color: #9CA3AF;">29</span></div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num" style="color: #9CA3AF;">30</span></div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num">1</span>
                            <span class="calendar-pill-tag" style="background: #ECFDF5; color: #059669;">Physics Test</span>
                            <span style="font-size: 8px; color: #9CA3AF;">+2 more</span>
                        </div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">2</span></div>

                        <!-- Row 2: 3 to 9 -->
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">3</span></div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num">4</span>
                            <span class="calendar-pill-tag" style="background: #F1EDFF; color: #8864F3;">Maths Test</span>
                        </div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num">5</span>
                            <span style="font-size: 9px; color: #EA580C; font-weight: 700;">● Chemistry Assignment</span>
                        </div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">6</span></div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num">7</span>
                            <span class="calendar-pill-tag" style="background: #FFEDD5; color: #EA580C;">English Essay Due</span>
                        </div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">8</span></div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num">9</span>
                            <span class="calendar-pill-tag" style="background: #F1EDFF; color: #8864F3;">Biology Quiz</span>
                        </div>

                        <!-- Row 3: 10 to 16 -->
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">10</span></div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num">11</span>
                            <span style="font-size: 9px; color: #8864F3; font-weight: 700;">● Physics Assignment</span>
                        </div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num active-day-circle">12</span>
                        </div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">13</span></div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num">14</span>
                            <span class="calendar-pill-tag" style="background: #FFE4E6; color: #E11D48;">Maths Assignment</span>
                            <span style="font-size: 8px; color: #9CA3AF;">+1 more</span>
                        </div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">15</span></div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">16</span></div>

                        <!-- Row 4: 17 to 23 -->
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">17</span></div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num">18</span>
                            <span class="calendar-pill-tag" style="background: #ECFDF5; color: #059669;">Chemistry Test</span>
                        </div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">19</span></div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num">20</span>
                            <span class="calendar-pill-tag" style="background: #F1EDFF; color: #8864F3;">Computer Lab Test</span>
                        </div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">21</span></div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">22</span></div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">23</span></div>

                        <!-- Row 5: 24 to 30 -->
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">24</span></div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num">25</span>
                            <span style="font-size: 9px; color: #EA580C; font-weight: 700;">● English Test</span>
                        </div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">26</span></div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">27</span></div>
                        <div class="calendar-matrix-cell">
                            <span class="calendar-date-num">28</span>
                            <span style="font-size: 9px; color: #0284C7; font-weight: 700;">● Project Submission</span>
                        </div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">29</span></div>
                        <div class="calendar-matrix-cell"><span class="calendar-date-num">30</span></div>
                    </div>

                    <!-- Legend Bar -->
                    <div style="display: flex; gap: 20px; font-size: 11px; font-weight: 700; margin-top: 18px; flex-wrap: wrap;">
                        <span style="color: #8864F3;">● Test</span>
                        <span style="color: #EA580C;">● Assignment</span>
                        <span style="color: #059669;">● Submission</span>
                        <span style="color: #E11D48;">● Event</span>
                    </div>
                </div>

                <!-- Bottom Widgets Row: Upcoming List + Mini Calendar (Below Main Calendar) -->
                <div class="calendar-bottom-widgets-grid">
                    
                    <!-- Upcoming Card -->
                    <div class="calendar-upcoming-card-box">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="font-size: 15px; font-weight: 800; color: #151A2D; margin: 0;">Upcoming Events & Deadlines</h4>
                            <span style="font-size: 12px; font-weight: 700; color: #8864F3; cursor: pointer;">View All</span>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
                            ${upcomingEvents.map(e => `
                                <div class="calendar-upcoming-item" style="border: 1px solid #ECEAF2; border-radius: 12px; padding: 10px 12px; margin-bottom: 0;">
                                    <div class="class-exact-icon-box" style="width: 40px; height: 40px; background: ${e.bgColor}; flex-shrink: 0;">
                                        ${e.iconSvg}
                                    </div>
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-size: 13px; font-weight: 800; color: #151A2D;">${e.title}</div>
                                        <div style="font-size: 11px; color: #6B7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e.subtitle}</div>
                                        <div style="font-size: 10px; color: #9CA3AF; margin-top: 2px;">📅 ${e.date} • ${e.time}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Mini Calendar Card -->
                    <div class="mini-calendar-box">
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 800; color: #151A2D; margin-bottom: 10px;">
                            <span>‹</span>
                            <span>May 2026</span>
                            <span>›</span>
                        </div>
                        <div class="mini-cal-grid">
                            <span style="color: #9CA3AF;">S</span><span style="color: #9CA3AF;">M</span><span style="color: #9CA3AF;">T</span><span style="color: #9CA3AF;">W</span><span style="color: #9CA3AF;">T</span><span style="color: #9CA3AF;">F</span><span style="color: #9CA3AF;">S</span>
                            <span style="color: #D1D5DB;">26</span><span style="color: #D1D5DB;">27</span><span style="color: #D1D5DB;">28</span><span style="color: #D1D5DB;">29</span><span style="color: #D1D5DB;">30</span><span>1</span><span>2</span>
                            <span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
                            <span>10</span><span>11</span><span class="mini-cal-cell active-mini">12</span><span>13</span><span>14</span><span>15</span><span>16</span>
                            <span>17</span><span>18</span><span>19</span><span>20</span><span>21</span><span>22</span><span>23</span>
                            <span>24</span><span>25</span><span>26</span><span>27</span><span>28</span><span>29</span><span>30</span>
                        </div>
                    </div>

                </div>
            </div>
        `;
    },

    setCalendarMode(mode) {
        this.calendarMode = mode;
        this.renderCalendarView(document.querySelector('#student-tab-content'));
    },

    showAddEventModal() {
        App.showModal(`
            <div class="modal-card" style="max-width: 480px;">
                <div class="modal-header">
                    <h3 class="modal-title">📅 Add Calendar Event</h3>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>
                <form id="form-add-event" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">Event Title</label>
                        <input type="text" id="event-title" class="glass-input" placeholder="e.g. Physics Revision Test" required>
                    </div>
                    <div>
                        <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">Event Category</label>
                        <select id="event-type" class="glass-select">
                            <option value="test">🎯 Test / Examination (Purple)</option>
                            <option value="assignment">📝 Homework / Task (Orange)</option>
                            <option value="submission">📤 Submission Deadline (Green)</option>
                            <option value="event">🎉 School Event (Pink)</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">Date & Time</label>
                        <input type="datetime-local" id="event-datetime" class="glass-input" required>
                    </div>
                    <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; font-weight: 700;">
                        Save Event to Calendar
                    </button>
                </form>
            </div>
        `);

        const form = document.getElementById('form-add-event');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                App.closeModal();
                App.toast('Event added to calendar successfully! 📅', 'info');
                this.renderCalendarView(document.querySelector('#student-tab-content'));
            });
        }
    },

    async renderAttendance(container) {
        return this.renderCalendarView(container);
    },

    // ─────────────────────────────────────────────────────────
    // 8.4 DOWNLOADS VIEW (Matching Image 3 & 5 Reference Screenshots)
    // ─────────────────────────────────────────────────────────
    async renderDownloadsView(container) {
        const currentCategory = this.downloadsCategory || 'all';

        const todayFiles = [
            {
                title: 'Laws of Motion - Notes',
                meta: 'Physics  •  Chapter 4',
                type: 'PDF',
                size: '2.4 MB',
                date: 'Downloaded on 12 May 2026',
                bgColor: '#F3E8FF',
                iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#8864F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
            },
            {
                title: 'Organic Compounds - Class Notes',
                meta: 'Chemistry  •  Chapter 3',
                type: 'PDF',
                size: '3.1 MB',
                date: 'Downloaded on 12 May 2026',
                bgColor: '#CCFBF1',
                iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#0D9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V2h-4z"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg>`
            },
            {
                title: 'Quadratic Equations - Textbook',
                meta: 'Mathematics  •  Class 9',
                type: 'PDF',
                size: '18.6 MB',
                date: 'Downloaded on 12 May 2026',
                bgColor: '#E0F2FE',
                iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#0284C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
            },
            {
                title: 'Maths Assignment 2',
                meta: 'Mathematics',
                type: 'PDF',
                size: '1.2 MB',
                date: 'Downloaded on 12 May 2026',
                bgColor: '#FFEDD5',
                iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`
            }
        ];

        const yesterdayFiles = [
            {
                title: 'Physics Test - Chapter 3',
                meta: 'Physics  •  Chapter 3',
                type: 'PDF',
                size: '1.8 MB',
                date: 'Downloaded on 11 May 2026',
                bgColor: '#FFE4E6',
                iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
            },
            {
                title: 'Chemistry Quiz',
                meta: 'Chemistry',
                type: 'PDF',
                size: '1.1 MB',
                date: 'Downloaded on 11 May 2026',
                bgColor: '#F3E8FF',
                iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#8864F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg>`
            }
        ];

        container.innerHTML = `
            <div class="downloads-page-wrapper">
                <!-- Top Header Row -->
                <div class="tests-header-row">
                    <h1 class="tests-header-title">Downloads</h1>
                    <div class="tests-actions-group">
                        <button class="btn-icon-square bouncy-btn" onclick="App.toast('Search downloads...', 'info')">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </button>
                        <button class="btn-icon-square bouncy-btn" onclick="App.toast('Toggle view format', 'info')">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Category Filter Pills Row -->
                <div class="subject-pills-scroll-row" style="margin-bottom: 18px;">
                    <button class="subject-pill-btn ${currentCategory === 'all' ? 'active' : ''}" data-download-cat="all">
                        <span>All</span>
                    </button>
                    <button class="subject-pill-btn ${currentCategory === 'notes' ? 'active' : ''}" data-download-cat="notes">
                        <span>Notes</span>
                    </button>
                    <button class="subject-pill-btn ${currentCategory === 'books' ? 'active' : ''}" data-download-cat="books">
                        <span>Books</span>
                    </button>
                    <button class="subject-pill-btn ${currentCategory === 'assignments' ? 'active' : ''}" data-download-cat="assignments">
                        <span>Assignments</span>
                    </button>
                    <button class="subject-pill-btn ${currentCategory === 'tests' ? 'active' : ''}" data-download-cat="tests">
                        <span>Tests</span>
                    </button>
                    <button class="subject-pill-btn ${currentCategory === 'others' ? 'active' : ''}" data-download-cat="others">
                        <span>Others</span>
                    </button>
                </div>

                <!-- Info Banner -->
                <div class="settings-info-banner" style="margin-bottom: 20px;">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8864F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span>Access your downloaded files anytime, anywhere — even without internet.</span>
                </div>

                <!-- Group: Today -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 13px; font-weight: 800; color: #151A2D; margin-bottom: 12px;">Today</div>
                    ${todayFiles.map(f => `
                        <div class="download-exact-row bouncy-btn" onclick="App.toast('Opening ${f.title}', 'info')">
                            <div class="download-row-left">
                                <div class="download-icon-box" style="background: ${f.bgColor};">
                                    ${f.iconSvg}
                                </div>
                                <div>
                                    <div class="download-file-title">${f.title}</div>
                                    <div class="download-file-meta">${f.meta}</div>
                                    <span style="font-size: 10px; font-weight: 700; color: #9CA3AF;">${f.type}</span>
                                </div>
                            </div>
                            <div class="download-row-right">
                                <div class="download-meta-right">
                                    <div class="download-size-bold">${f.size}</div>
                                    <div style="font-size: 11px; color: #9CA3AF;">${f.date}</div>
                                </div>
                                <button class="download-kebab-btn" onclick="event.stopPropagation(); App.toast('File options', 'info')">⋮</button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Group: Yesterday -->
                <div style="margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: 800; color: #151A2D; margin-bottom: 12px;">Yesterday</div>
                    ${yesterdayFiles.map(f => `
                        <div class="download-exact-row bouncy-btn" onclick="App.toast('Opening ${f.title}', 'info')">
                            <div class="download-row-left">
                                <div class="download-icon-box" style="background: ${f.bgColor};">
                                    ${f.iconSvg}
                                </div>
                                <div>
                                    <div class="download-file-title">${f.title}</div>
                                    <div class="download-file-meta">${f.meta}</div>
                                    <span style="font-size: 10px; font-weight: 700; color: #9CA3AF;">${f.type}</span>
                                </div>
                            </div>
                            <div class="download-row-right">
                                <div class="download-meta-right">
                                    <div class="download-size-bold">${f.size}</div>
                                    <div style="font-size: 11px; color: #9CA3AF;">${f.date}</div>
                                </div>
                                <button class="download-kebab-btn" onclick="event.stopPropagation(); App.toast('File options', 'info')">⋮</button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Bottom Storage Bar -->
                <div class="storage-bottom-bar-card">
                    <div class="storage-bar-group">
                        <span style="font-size: 13px; font-weight: 700; color: #151A2D; white-space: nowrap;">Storage Used</span>
                        <div class="class-exact-progress-track" style="height: 6px; flex: 1; background: #F1EDFF;">
                            <div class="class-exact-progress-fill" style="width: 25%; background: #8864F3;"></div>
                        </div>
                        <span style="font-size: 12px; font-weight: 600; color: #6B7280; white-space: nowrap;">1.25 GB / 5 GB</span>
                    </div>

                    <button class="btn-manage-storage bouncy-btn" onclick="App.toast('Storage cleaner: 0.3 GB cached temp files cleared.', 'info')">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        <span>Manage Storage</span>
                    </button>
                </div>
            </div>
        `;

        container.querySelectorAll('[data-download-cat]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.downloadsCategory = e.currentTarget.dataset.downloadCat;
                this.renderDownloadsView(container);
            });
        });
    },

    showHomeworkWorkspaceModal(container, assignment) {
        let existingText = '';
        if (assignment.submission_content) {
            try {
                const parsed = JSON.parse(assignment.submission_content);
                existingText = parsed.text || '';
            } catch (e) {
                existingText = assignment.submission_content;
            }
        }

        App.showModal(`
            <div class="modal-card" id="hw-workspace-modal-card" style="max-width: 900px; width: 95vw; max-height: 90vh; overflow-y: auto; transition: all 250ms ease;">
                <div class="modal-header">
                    <h3 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
                        <img src="/assets/icons/icon-assignment.svg" style="width: 24px; height: 24px;" alt="HW">
                        <span>Notebook Workspace: ${assignment.title}</span>
                    </h3>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button id="btn-toggle-hw-fullscreen" class="glass-btn glass-btn-sm bouncy-btn" title="Toggle Full Screen Mode">
                            <span>🖥️ Full Screen</span>
                        </button>
                        <button class="modal-close" onclick="App.closeModal()">✕</button>
                    </div>
                </div>

                <div style="margin: 12px 0 20px; padding: 14px; background: var(--accent-light); border-radius: var(--radius-sm); border-left: 4px solid var(--accent-blue);">
                    <div style="font-size: 12px; font-weight: 800; color: var(--accent-blue); text-transform: uppercase; margin-bottom: 4px;">Teacher Instructions:</div>
                    <div style="font-size: 15px; color: var(--text-primary);">${assignment.description || 'Complete the assignment notes below.'}</div>
                </div>

                <!-- Full Stylus & Text Notebook Editor Surface -->
                <div style="width: 100%; flex: 1; display: flex; flex-direction: column;">
                    <div class="stylus-toolbar" style="flex-direction: column; gap: 8px; margin-bottom: 12px;">
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; width: 100%;">
                            <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">TOOLS:</span>
                            <div class="stylus-tool-group">
                                <button class="stylus-tool-btn active assign-tool-btn" data-tool="pen" data-for="${assignment.id}" title="Pen">✏️ Pen</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="highlighter" data-for="${assignment.id}" title="Highlighter">🖊️ Highlight</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="eraser" data-for="${assignment.id}" title="Eraser">🧹 Eraser</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="select" data-for="${assignment.id}" title="Select">⬚ Select</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="fill" data-for="${assignment.id}" title="Fill">🪣 Fill</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="text_canvas" data-for="${assignment.id}" title="Text">🔤 Text</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="line" data-for="${assignment.id}" title="Line">╱ Line</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="rect" data-for="${assignment.id}" title="Rect">▭ Rect</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="circle" data-for="${assignment.id}" title="Circle">◯ Circle</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="arrow" data-for="${assignment.id}" title="Arrow">↗ Arrow</button>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; width: 100%;">
                            <div class="stylus-tool-group">
                                <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">INK:</span>
                                <div class="color-swatch active assign-color" data-color="#1A365D" data-for="${assignment.id}" style="background: #1A365D;"></div>
                                <div class="color-swatch assign-color" data-color="#1A202C" data-for="${assignment.id}" style="background: #1A202C;"></div>
                                <div class="color-swatch assign-color" data-color="#E53E3E" data-for="${assignment.id}" style="background: #E53E3E;"></div>
                                <div class="color-swatch assign-color" data-color="#2F855A" data-for="${assignment.id}" style="background: #2F855A;"></div>
                                <div class="color-swatch assign-color" data-color="#3182CE" data-for="${assignment.id}" style="background: #3182CE;"></div>
                                <div class="color-swatch assign-color" data-color="rgba(255,235,59,0.5)" data-for="${assignment.id}" style="background: #ECC94B;"></div>
                            </div>
                            <div class="stylus-tool-group">
                                <button class="stylus-tool-btn assign-undo-btn" data-for="${assignment.id}">↩️ Undo</button>
                                <button class="stylus-tool-btn assign-redo-btn" data-for="${assignment.id}">↪️ Redo</button>
                                <button class="stylus-tool-btn assign-clear-btn" data-for="${assignment.id}" style="color: var(--status-danger);">🧼 Clear</button>
                            </div>
                        </div>
                    </div>

                    <div class="paper-sheet ruled" style="position: relative; min-height: 380px; flex: 1; margin-bottom: 20px;">
                        <textarea id="assign-text-${assignment.id}" class="note-editor-textarea" placeholder="Type your homework response..." style="min-height: 360px;">${existingText}</textarea>
                        <canvas id="assign-canvas-${assignment.id}" class="stylus-canvas"></canvas>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="glass-btn glass-btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button id="btn-submit-hw-modal" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px 28px; font-weight: 800;">
                        🚀 Submit Homework to Teacher
                    </button>
                </div>
            </div>
        `);

        const modal = document.getElementById('modal-container');
        this.initAssignmentCanvas(modal, assignment.id, assignment.submission_content);

        // Full Screen Mode Toggle Button Listener
        const fullscreenBtn = modal.querySelector('#btn-toggle-hw-fullscreen');
        const modalCard = modal.querySelector('#hw-workspace-modal-card');
        if (fullscreenBtn && modalCard) {
            fullscreenBtn.addEventListener('click', () => {
                const isFS = modalCard.classList.toggle('fullscreen-hw-mode');
                if (isFS) {
                    modalCard.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh; border-radius: 0; z-index: 99999; margin: 0; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; background: var(--paper-bg-primary);';
                    fullscreenBtn.innerHTML = '<span>🗗 Exit Full Screen</span>';
                    fullscreenBtn.classList.add('glass-btn-primary');
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen().catch(() => {});
                    }
                } else {
                    modalCard.style.cssText = 'max-width: 900px; width: 95vw; max-height: 90vh; overflow-y: auto; transition: all 250ms ease;';
                    fullscreenBtn.innerHTML = '<span>🖥️ Full Screen</span>';
                    fullscreenBtn.classList.remove('glass-btn-primary');
                    if (document.exitFullscreen && document.fullscreenElement) {
                        document.exitFullscreen().catch(() => {});
                    }
                }
            });
        }

        modal.querySelector('#btn-submit-hw-modal').addEventListener('click', async () => {
            const textContent = modal.querySelector(`#assign-text-${assignment.id}`)?.value || '';
            const canvas = modal.querySelector(`#assign-canvas-${assignment.id}`);
            let canvasData = null;
            if (canvas && canvas.width > 0 && canvas.height > 0) {
                canvasData = canvas.toDataURL('image/png');
            }
            const contentData = JSON.stringify({
                type: 'smartslate_note_v2',
                canvasHeight: canvas ? canvas.height : 380,
                canvasData,
                text: textContent
            });

            try {
                await API.submitAssignment(assignment.id, contentData);
                App.closeModal();
                App.toast('Homework submitted successfully to your teacher! 🎉', 'success');
                this.renderAssignments(container);
            } catch (err) {
                App.toast(err.message || 'Error submitting homework', 'danger');
            }
        });
    },

    initAssignmentCanvas(container, assignId, savedContent) {
        const canvas = container.querySelector(`#assign-canvas-${assignId}`);
        const textarea = container.querySelector(`#assign-text-${assignId}`);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // We need local history for assignments
        let history = [];
        let historyIndex = -1;

        const saveHistory = () => {
            if (historyIndex < history.length - 1) {
                history = history.slice(0, historyIndex + 1);
            }
            if (canvas.width > 0 && canvas.height > 0) {
                history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                historyIndex = history.length - 1;
            }
        };

        const initCanvasSize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (savedContent) {
                try {
                    const p = JSON.parse(savedContent);
                    if (p.canvasData) {
                        const img = new Image();
                        img.onload = () => { ctx.drawImage(img, 0, 0); saveHistory(); };
                        img.src = p.canvasData;
                        return; // return early so we don't save blank history immediately
                    }
                } catch (e) {}
            }
            saveHistory();
        };

        requestAnimationFrame(() => setTimeout(initCanvasSize, 0));

        let isDrawing = false, tool = 'pen', color = '#1A365D', width = 3;
        let lastX = 0, lastY = 0, startX = 0, startY = 0;
        let snapshotBeforeShape = null;
        let floatingSelection = null;
        let isDraggingSelection = false;
        let dragOffsetX = 0, dragOffsetY = 0;
        let textInput = null;

        // Bind tool buttons scoped to this assignment
        container.querySelectorAll(`.assign-tool-btn[data-for="${assignId}"]`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (floatingSelection) {
                    ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                    floatingSelection = null;
                    saveHistory();
                }

                container.querySelectorAll(`.assign-tool-btn[data-for="${assignId}"]`).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                tool = btn.dataset.tool;
                if (tool === 'text') { canvas.classList.add('pointer-events-none'); textarea.focus(); }
                else { canvas.classList.remove('pointer-events-none'); }

                if (tool === 'highlighter') { color = 'rgba(255,235,59,0.5)'; width = 14; }
                else if (tool === 'eraser') { }
                else if (tool === 'fill' || ['line','rect','circle','arrow'].includes(tool)) { canvas.style.cursor = 'crosshair'; }
                else { canvas.style.cursor = 'default'; }
            });
        });

        container.querySelectorAll(`.assign-color[data-for="${assignId}"]`).forEach(sw => {
            sw.addEventListener('click', (e) => {
                container.querySelectorAll(`.assign-color[data-for="${assignId}"]`).forEach(s => s.classList.remove('active'));
                sw.classList.add('active');
                color = sw.dataset.color;
                if (tool === 'text' || tool === 'eraser') {
                    tool = 'pen';
                    container.querySelectorAll(`.assign-tool-btn[data-for="${assignId}"]`).forEach(b => b.classList.toggle('active', b.dataset.tool === 'pen'));
                    canvas.classList.remove('pointer-events-none');
                }
            });
        });

        container.querySelectorAll(`.stroke-size-btn[data-for="${assignId}"]`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll(`.stroke-size-btn[data-for="${assignId}"]`).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                width = parseFloat(btn.dataset.size);
            });
        });

        const undoBtn = container.querySelector(`.assign-undo-btn[data-for="${assignId}"]`);
        const redoBtn = container.querySelector(`.assign-redo-btn[data-for="${assignId}"]`);
        const clearBtn = container.querySelector(`.assign-clear-btn[data-for="${assignId}"]`);

        if (undoBtn) undoBtn.addEventListener('click', () => {
            if (historyIndex > 0) {
                historyIndex--;
                ctx.putImageData(history[historyIndex], 0, 0);
            }
        });
        if (redoBtn) redoBtn.addEventListener('click', () => {
            if (historyIndex < history.length - 1) {
                historyIndex++;
                ctx.putImageData(history[historyIndex], 0, 0);
            }
        });
        if (clearBtn) clearBtn.addEventListener('click', () => { 
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
            saveHistory(); 
        });

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure > 0 ? e.pressure : 0.5 };
        };

        const hexToRgb = (c) => {
            if (c.startsWith('rgba')) {
                const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                return m ? [+m[1],+m[2],+m[3],255] : [0,0,0,255];
            }
            const hex = c.replace('#','');
            const num = parseInt(hex, 16);
            return [(num>>16)&255,(num>>8)&255,num&255,255];
        };

        const floodFill = (x, y, fillColor) => {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const fillRgb = hexToRgb(fillColor);
            const idx = (Math.round(y) * canvas.width + Math.round(x)) * 4;
            const target = [data[idx], data[idx+1], data[idx+2], data[idx+3]];
            if (target.every((v,i) => v === fillRgb[i])) return;
            const stack = [[Math.round(x), Math.round(y)]];
            const match = (i) => data[i]===target[0] && data[i+1]===target[1] && data[i+2]===target[2] && data[i+3]===target[3];
            const set = (i) => { data[i]=fillRgb[0]; data[i+1]=fillRgb[1]; data[i+2]=fillRgb[2]; data[i+3]=fillRgb[3]; };
            while (stack.length) {
                const [fx, fy] = stack.pop();
                if (fx<0||fy<0||fx>=canvas.width||fy>=canvas.height) continue;
                const i = (fy*canvas.width+fx)*4;
                if (!match(i)) continue;
                set(i);
                stack.push([fx+1,fy],[fx-1,fy],[fx,fy+1],[fx,fy-1]);
            }
            ctx.putImageData(imgData, 0, 0);
        };

        const drawShapePreview = (pos) => {
            ctx.putImageData(snapshotBeforeShape, 0, 0);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.globalCompositeOperation = 'source-over';

            if (tool === 'line') {
                ctx.moveTo(startX, startY); ctx.lineTo(pos.x, pos.y); ctx.stroke();
            } else if (tool === 'rect') {
                ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
            } else if (tool === 'circle') {
                const rx = Math.abs(pos.x - startX) / 2, ry = Math.abs(pos.y - startY) / 2;
                ctx.ellipse(startX + (pos.x-startX)/2, startY + (pos.y-startY)/2, rx, ry, 0, 0, Math.PI*2);
                ctx.stroke();
            } else if (tool === 'arrow') {
                const dx = pos.x - startX, dy = pos.y - startY;
                const angle = Math.atan2(dy, dx);
                const headLen = Math.max(12, width * 4);
                ctx.moveTo(startX, startY); ctx.lineTo(pos.x, pos.y); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headLen*Math.cos(angle-Math.PI/6), pos.y - headLen*Math.sin(angle-Math.PI/6));
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headLen*Math.cos(angle+Math.PI/6), pos.y - headLen*Math.sin(angle+Math.PI/6));
                ctx.stroke();
            } else if (tool === 'select') {
                ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
                ctx.setLineDash([]);
            }
        };

        const placeTextInput = (x, y) => {
            if (textInput) textInput.remove();
            textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.placeholder = 'Type text, press Enter';
            textInput.style.cssText = `
                position: absolute; left: ${x}px; top: ${y - 20}px;
                font-size: ${Math.max(14, width * 3)}px; color: ${color};
                background: rgba(255,255,255,0.85); border: 2px dashed ${color};
                border-radius: 4px; padding: 4px 8px; min-width: 120px; z-index: 100; outline: none;
            `;
            const canvasParent = canvas.parentElement;
            canvasParent.style.position = 'relative';
            canvasParent.appendChild(textInput);
            textInput.focus();

            textInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const text = textInput.value.trim();
                    if (text) {
                        ctx.font = `${Math.max(16, width * 3)}px "Inter", sans-serif`;
                        ctx.fillStyle = color;
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.fillText(text, x, y);
                    }
                    textInput.remove(); textInput = null;
                    saveHistory();
                } else if (e.key === 'Escape') {
                    textInput.remove(); textInput = null;
                }
            });
        };

        canvas.addEventListener('pointerdown', (e) => {
            if (tool === 'text') return;
            const pos = getPos(e);
            
            if (tool === 'fill') { floodFill(pos.x, pos.y, color); saveHistory(); return; }
            if (tool === 'text_canvas') { placeTextInput(pos.x, pos.y); return; }

            if (tool === 'select') {
                if (floatingSelection) {
                    const { x, y, w, h } = floatingSelection;
                    if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
                        isDraggingSelection = true; dragOffsetX = pos.x - x; dragOffsetY = pos.y - y;
                        return;
                    } else {
                        ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                        floatingSelection = null;
                        saveHistory();
                    }
                }
            }

            isDrawing = true; startX = pos.x; startY = pos.y; lastX = pos.x; lastY = pos.y;
            if (['line','rect','circle','arrow','select'].includes(tool)) {
                snapshotBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
            } else {
                ctx.beginPath(); ctx.moveTo(lastX, lastY);
            }
        });

        canvas.addEventListener('pointermove', (e) => {
            if (tool === 'text' || tool === 'fill' || tool === 'text_canvas') return;
            e.preventDefault();
            const pos = getPos(e);

            if (tool === 'select' && isDraggingSelection && floatingSelection) {
                ctx.putImageData(snapshotBeforeShape, 0, 0);
                floatingSelection.x = pos.x - dragOffsetX;
                floatingSelection.y = pos.y - dragOffsetY;
                ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)';
                ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
                ctx.strokeRect(floatingSelection.x, floatingSelection.y, floatingSelection.w, floatingSelection.h);
                ctx.setLineDash([]);
                return;
            }

            if (!isDrawing) return;
            if (['line','rect','circle','arrow','select'].includes(tool)) { drawShapePreview(pos); return; }

            ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(pos.x, pos.y);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth = tool === 'eraser' ? width * 4 : (pos.pressure ? width * pos.pressure * 1.6 : width);
            ctx.stroke();
            lastX = pos.x; lastY = pos.y;
        });

        canvas.addEventListener('pointerup', (e) => {
            if (tool === 'select' && isDraggingSelection) { isDraggingSelection = false; return; }
            if (!isDrawing) return;

            if (['line','rect','circle','arrow'].includes(tool)) {
                drawShapePreview(getPos(e));
            } else if (tool === 'select') {
                const pos = getPos(e);
                const rx = Math.min(startX, pos.x), ry = Math.min(startY, pos.y);
                const rw = Math.abs(pos.x - startX), rh = Math.abs(pos.y - startY);
                if (rw > 5 && rh > 5) {
                    ctx.putImageData(snapshotBeforeShape, 0, 0);
                    const imgData = ctx.getImageData(rx, ry, rw, rh);
                    ctx.clearRect(rx, ry, rw, rh);
                    snapshotBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    floatingSelection = { x: rx, y: ry, w: rw, h: rh, imgData };
                    ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                    ctx.beginPath(); ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
                    ctx.strokeRect(floatingSelection.x, floatingSelection.y, floatingSelection.w, floatingSelection.h);
                    ctx.setLineDash([]);
                }
            }
            isDrawing = false;
            if (tool !== 'select') saveHistory();
        });

        canvas.addEventListener('pointerleave', () => {
            if (isDrawing) { isDrawing = false; if (tool !== 'select') saveHistory(); }
        });
    },

    // 8.3 Class Real-time Socket.IO Chat
    async renderChat(container) {
        const groupsRes = await API.getChatGroups();
        const groups = groupsRes.groups || [];
        const activeGroup = groups[0] || { id: 1, name: 'Grade 5 Alpha General' };

        const msgRes = await API.getChatMessages(activeGroup.id);
        const messages = msgRes.messages || [];

        container.innerHTML = `
            <div class="chat-container">
                <div class="chat-sidebar">
                    <div style="font-weight: 700; margin-bottom: 12px; color: var(--text-secondary); font-size: 13px;">GROUPS & CHATS</div>
                    ${groups.map(g => `
                        <div class="chat-contact-item active" style="font-weight: 600;">
                            💬 ${g.name}
                        </div>
                    `).join('')}
                </div>

                <div class="chat-main">
                    <div class="chat-header">💬 ${activeGroup.name}</div>
                    <div id="chat-messages-container" class="chat-messages-list">
                        ${messages.map(m => `
                            <div class="chat-bubble ${m.sender_id == App.currentUser.id ? 'mine' : 'other'}">
                                <div style="font-size: 11px; font-weight: 700; opacity: 0.8; margin-bottom: 2px;">${m.sender_name} (${m.sender_role})</div>
                                <div>${m.content}</div>
                            </div>
                        `).join('')}
                    </div>
                    <form id="chat-send-form" class="chat-input-bar">
                        <input type="text" id="chat-input-text" class="glass-input" placeholder="Type a message to your class..." required autocomplete="off">
                        <button type="submit" class="glass-btn glass-btn-primary">Send</button>
                    </form>
                </div>
            </div>
        `;

        const msgContainer = container.querySelector('#chat-messages-container');
        msgContainer.scrollTop = msgContainer.scrollHeight;

        // Join Socket Room
        SocketManager.joinGroup(activeGroup.id);
        SocketManager.on('message', (msg) => {
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${msg.sender_id == App.currentUser.id ? 'mine' : 'other'}`;
            bubble.innerHTML = `
                <div style="font-size: 11px; font-weight: 700; opacity: 0.8; margin-bottom: 2px;">${msg.sender_name} (${msg.sender_role})</div>
                <div>${msg.content}</div>
            `;
            msgContainer.appendChild(bubble);
            msgContainer.scrollTop = msgContainer.scrollHeight;
        });

        container.querySelector('#chat-send-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = container.querySelector('#chat-input-text');
            const text = input.value;
            if (!text.trim()) return;

            try {
                await SocketManager.sendGroupMessage(activeGroup.id, text.trim());
                input.value = '';
            } catch (err) {
                App.showToast('Failed to send message: ' + err.message, 'danger');
            }
        });
    },

    // 8.4 Time-Boxed Exam Taking UI
    async renderExams(container) {
        const res = await API.getExams();
        const exams = res.exams || [];
        const now = new Date();

        container.innerHTML = `
            <div class="glass-card" style="margin-bottom: 24px;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Exams & Strict Assessments</h3>
                <p style="color: var(--text-secondary); font-size: 14px;">Time-limited strict exams with live countdown timer, start/end access windows, and full-screen anti-cheat protection</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                ${exams.length === 0 ? '<div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 40px;">No exams scheduled.</div>' : ''}
                ${exams.map(e => {
                    const isStarted = !e.start_time || now >= new Date(e.start_time);
                    const isEnded = e.end_time && now > new Date(e.end_time);
                    let statusBadge = '';
                    let canStart = false;

                    if (e.result_id) {
                        statusBadge = `<div style="padding: 10px; background: rgba(82, 154, 114, 0.12); border-radius: var(--radius-sm); color: var(--status-success); font-weight: 700; text-align: center;">Completed: ${e.score} / ${e.total_points} (${Math.round((e.score/e.total_points)*100)}%)</div>`;
                    } else if (isEnded) {
                        statusBadge = `<div style="padding: 10px; background: rgba(231, 76, 60, 0.12); border-radius: var(--radius-sm); color: var(--status-danger); font-weight: 700; text-align: center;">Exam Closed (Ended at ${new Date(e.end_time).toLocaleTimeString()})</div>`;
                    } else if (!isStarted) {
                        statusBadge = `<div style="padding: 10px; background: rgba(243, 156, 18, 0.12); border-radius: var(--radius-sm); color: var(--status-warning); font-weight: 700; text-align: center;">Upcoming (Opens at ${new Date(e.start_time).toLocaleString()})</div>`;
                    } else {
                        canStart = true;
                    }

                    return `
                        <div class="glass-card bouncy-btn" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid var(--accent-coral);">
                            <div>
                                <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                                    <span class="glass-badge glass-badge-accent" style="display: inline-flex; align-items: center; gap: 4px;">
                                        <img src="/assets/icons/icon-timer.svg" style="width: 14px; height: 14px;" alt="Timer"> ${e.duration_minutes} Mins
                                    </span>
                                    <span class="glass-badge glass-badge-warning" style="display: inline-flex; align-items: center; gap: 4px;">
                                        <img src="/assets/icons/icon-strict-mode.svg" style="width: 14px; height: 14px;" alt="Strict"> Strict Fullscreen
                                    </span>
                                </div>
                                <h4 style="font-size: 18px; font-weight: 700; margin-top: 4px;">${e.title}</h4>
                                ${e.start_time ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Window: ${new Date(e.start_time).toLocaleDateString()} ${new Date(e.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – ${new Date(e.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>` : ''}
                            </div>
                            <div style="margin-top: 20px;">
                                ${canStart ? `
                                    <button class="glass-btn glass-btn-primary btn-take-exam bouncy-btn" data-id="${e.id}" style="width: 100%;">Start Exam Now</button>
                                ` : statusBadge}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.querySelectorAll('.btn-take-exam').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                // Request browser full screen
                try {
                    if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                    }
                } catch (err) {}
                this.startExamSession(container, id);
            });
        });
    },

    async startExamSession(container, examId) {
        const res = await API.getExamDetail(examId);
        const exam = res.exam;
        const questions = exam.questions || [];

        let currentQ = 0;
        const answers = {};

        // Timer calculation
        let secondsLeft = (exam.duration_minutes || 20) * 60;
        let timerInterval = null;

        // Strict lockdown violation handler
        const handleLockdownViolation = async (reason) => {
            App.toast(`🚨 Strict Mode Alert: ${reason}`, 'danger');
            try {
                await API.post(`/api/exams/${examId}/fraud-alert`, { reason });
            } catch (err) {}
        };

        const onBlur = () => handleLockdownViolation('Window lost focus during strict exam mode!');
        const onVisibilityChange = () => {
            if (document.hidden) handleLockdownViolation('Switched tabs during strict exam mode!');
        };

        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibilityChange);

        const stopLockdown = () => {
            if (timerInterval) clearInterval(timerInterval);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            try {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
            } catch (e) {}
        };

        const renderQuestion = () => {
            const q = questions[currentQ];
            const mins = Math.floor(secondsLeft / 60);
            const secs = secondsLeft % 60;
            const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

            container.innerHTML = `
                <div class="fullscreen-exam-overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 99999; background: var(--paper-bg-primary); padding: 32px; overflow-y: auto;">
                    <div class="glass-card" style="max-width: 720px; margin: 0 auto; padding: 32px; border: 2px solid var(--accent-coral);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                            <div>
                                <span style="font-weight: 800; font-size: 20px;">${exam.title}</span>
                                <div style="font-size: 12px; color: var(--status-danger); font-weight: 700; margin-top: 2px;">🔒 FULL-TAB STRICT LOCKDOWN MODE ACTIVE</div>
                            </div>
                            <div class="glass-badge glass-badge-danger" style="font-size: 18px; padding: 8px 16px; font-weight: 800;">
                                ⏳ ${timeStr}
                            </div>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <span class="glass-badge glass-badge-warning">Question ${currentQ + 1} of ${questions.length}</span>
                        </div>

                        <h3 style="font-size: 22px; font-weight: 700; margin-bottom: 24px; color: var(--text-primary);">${q.text}</h3>

                        ${q.type === 'mcq' ? `
                            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px;">
                                ${(q.options || []).map(opt => `
                                    <label class="glass-card interactive" style="padding: 16px 20px; display: flex; align-items: center; gap: 12px; cursor: pointer;">
                                        <input type="radio" name="mcq-option" value="${opt}" ${answers[q.id] === opt ? 'checked' : ''}>
                                        <span style="font-size: 16px; font-weight: 600;">${opt}</span>
                                    </label>
                                `).join('')}
                            </div>
                        ` : `
                            <textarea id="short-answer-input" class="glass-textarea" style="min-height: 120px; margin-bottom: 28px;" placeholder="Type your answer here...">${answers[q.id] || ''}</textarea>
                        `}

                        <div style="display: flex; justify-content: space-between;">
                            <button id="btn-prev-q" class="glass-btn" ${currentQ === 0 ? 'disabled' : ''}>Previous</button>
                            ${currentQ === questions.length - 1 ? `
                                <button id="btn-submit-exam" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 12px 28px; font-weight: 700;">Submit Exam</button>
                            ` : `
                                <button id="btn-next-q" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 12px 28px; font-weight: 700;">Next Question →</button>
                            `}
                        </div>
                    </div>
                </div>
            `;

            // Bind option choices
            if (q.type === 'mcq') {
                container.querySelectorAll('input[name="mcq-option"]').forEach(r => {
                    r.addEventListener('change', (e) => answers[q.id] = e.target.value);
                });
            } else {
                const ta = container.querySelector('#short-answer-input');
                if (ta) ta.addEventListener('input', (e) => answers[q.id] = e.target.value);
            }

            const prevBtn = container.querySelector('#btn-prev-q');
            if (prevBtn) prevBtn.addEventListener('click', () => { currentQ--; renderQuestion(); });

            const nextBtn = container.querySelector('#btn-next-q');
            if (nextBtn) nextBtn.addEventListener('click', () => { currentQ++; renderQuestion(); });

            const submitBtn = container.querySelector('#btn-submit-exam');
            if (submitBtn) submitBtn.addEventListener('click', async () => {
                stopLockdown();
                try {
                    const result = await API.submitExam(examId, answers);
                    App.showToast(`Exam completed! Score: ${result.percentage}% 🎉`, 'success');
                    this.renderExams(container);
                } catch (err) {
                    App.showToast(err.message, 'danger');
                }
            });
        };

        // Start Live Timer Interval
        timerInterval = setInterval(() => {
            secondsLeft--;
            const timerBadge = container.querySelector('.glass-badge-danger');
            if (timerBadge) {
                const mins = Math.floor(secondsLeft / 60);
                const secs = secondsLeft % 60;
                timerBadge.textContent = `⏳ ${mins}:${secs < 10 ? '0' : ''}${secs}`;
            }
            if (secondsLeft <= 0) {
                stopLockdown();
                App.toast('Time is up! Submitting exam automatically.', 'warning');
                API.submitExam(examId, answers).then(() => this.renderExams(container));
            }
        }, 1000);

        renderQuestion();
    },

    // 8.5 Past Notes Search & History
    async renderNotesHistory(container) {
        const res = await API.getNotesHistory();
        const sharedRes = await API.getSharedNotes();
        const notes = res.notes || [];
        const sharedNotes = sharedRes.notes || [];

        container.innerHTML = `
            <div class="glass-card" style="margin-bottom: 24px;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Past Notes & Search</h3>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <input type="text" id="notes-search-input" class="glass-input" placeholder="Search across all notebooks..." style="flex: 1;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                ${notes.map(n => {
                    let preview = n.content || '';
                    let hasCanvas = false;
                    try {
                        const p = JSON.parse(n.content);
                        if (p.type === 'smartslate_note_v2') {
                            preview = p.text || '(handwritten note)';
                            hasCanvas = !!p.canvasData;
                        }
                    } catch(e) {}
                    return `
                    <div class="glass-card interactive past-note-card" data-book-id="${n.book_id}" data-note-id="${n.id}" data-note-title="${n.title}" data-note-rule="${n.rule_type}" style="padding: 20px; cursor: pointer;">
                        <span class="glass-badge glass-badge-accent">${n.book_subject}</span>
                        ${hasCanvas ? '<span class="glass-badge" style="margin-left:6px; background: rgba(107,143,216,0.15); color: var(--accent-primary);">✏️ Stylus</span>' : ''}
                        <h4 style="font-size: 18px; font-weight: 700; margin: 8px 0 4px;">${n.title}</h4>
                        <p style="color: var(--text-secondary); font-size: 14px; max-height: 60px; overflow: hidden; margin-bottom: 12px;">${preview || 'Empty page'}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 12px; color: var(--text-muted);">From: ${n.book_title}</div>
                            <span class="glass-badge" style="background: rgba(107,143,216,0.1); color: var(--accent-primary); font-size: 11px;">Click to open →</span>
                        </div>
                    </div>`;
                }).join('')}

                ${sharedNotes.map(sn => {
                    let preview = sn.content || '';
                    let hasCanvas = false;
                    try {
                        const p = JSON.parse(sn.content);
                        if (p.type === 'smartslate_note_v2') { preview = p.text || '(handwritten note)'; hasCanvas = !!p.canvasData; }
                    } catch(e) {}
                    return `
                    <div class="glass-card past-note-card" data-book-id="${sn.book_id}" data-note-id="${sn.id}" data-note-title="${sn.title}" data-note-rule="${sn.rule_type || 'ruled'}" style="padding: 20px; cursor: pointer; border-color: rgba(107, 143, 216, 0.5);">
                        <span class="glass-badge glass-badge-success">Shared by ${sn.owner_name}</span>
                        ${hasCanvas ? '<span class="glass-badge" style="margin-left:6px; background: rgba(107,143,216,0.15); color: var(--accent-primary);">✏️ Stylus</span>' : ''}
                        <h4 style="font-size: 18px; font-weight: 700; margin: 8px 0 4px;">${sn.title}</h4>
                        <p style="color: var(--text-secondary); font-size: 14px;">${preview || 'Empty note'}</p>
                        <div style="margin-top: 8px; text-align: right;">
                            <span class="glass-badge" style="background: rgba(107,143,216,0.1); color: var(--accent-primary); font-size: 11px;">Click to open →</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;

        // Add click handlers to open notes
        container.querySelectorAll('.past-note-card').forEach(card => {
            card.addEventListener('click', async () => {
                const bookId = parseInt(card.dataset.bookId);
                const noteId = parseInt(card.dataset.noteId);
                const noteTitle = card.dataset.noteTitle;
                const noteRule = card.dataset.noteRule;

                // Fetch the note content from API
                try {
                    const notesRes = await API.getNotes(bookId);
                    const allNotes = notesRes.notes || [];
                    const targetNote = allNotes.find(n => n.id == noteId);

                    this.currentBook = { id: bookId };
                    this.currentNote = targetNote || { id: noteId, title: noteTitle, rule_type: noteRule, content: '' };
                    this.activeTab = 'bookshelf';

                    // Re-render the tab bar to show bookshelf active
                    const tabBtns = document.querySelectorAll('.tab-btn');
                    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'bookshelf'));

                    const tabContent = document.querySelector('#student-tab-content');
                    if (tabContent) {
                        this.renderNotebookDetail(tabContent);
                    }
                } catch(err) {
                    App.toast('Could not open note: ' + err.message, 'danger');
                }
            });
        });
    },

    // 8.7 Safe Web Search
    async renderSearch(container) {
        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <div class="glass-card" style="padding: 32px; margin-bottom: 24px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🌐</div>
                        <h2 style="font-size: 26px; font-weight: 800;">SmartSlate Safe Web Search</h2>
                        <p style="color: var(--text-secondary); font-size: 15px; margin-top: 4px;">Educational search filtered for students — no inappropriate content</p>
                    </div>

                    <form id="safe-search-form" style="display: flex; gap: 12px; margin-bottom: 0;">
                        <input type="text" id="safe-search-query" class="glass-input" 
                            placeholder="Search: photosynthesis, silk road, solar system, fractions..." 
                            style="flex: 1; font-size: 16px;" required autocomplete="off">
                        <button type="submit" class="glass-btn glass-btn-primary" style="padding: 12px 24px;">
                            🔍 Search
                        </button>
                    </form>
                </div>

                <!-- Search Results -->
                <div id="search-results-list" style="display: flex; flex-direction: column; gap: 16px;"></div>
            </div>
        `;

        const form = container.querySelector('#safe-search-form');
        const resultsList = container.querySelector('#search-results-list');
        const queryInput = container.querySelector('#safe-search-query');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const q = queryInput.value.trim();
            if (!q) return;

            resultsList.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 40px;">
                    <div class="spinner" style="margin: 0 auto 16px;"></div>
                    <p style="color: var(--text-secondary);">Searching educational resources...</p>
                </div>`;

            try {
                const res = await API.searchWeb(q);

                // UNSAFE CONTENT — show danger modal
                if (!res.safe) {
                    queryInput.value = '';
                    resultsList.innerHTML = '';
                    this.showUnsafeSearchAlert(q, res.message);
                    return;
                }

                // Safe results — render inline (no new tab)
                if (!res.results || res.results.length === 0) {
                    resultsList.innerHTML = `<div class="glass-card" style="text-align: center; padding: 40px; color: var(--text-muted);">No results found for "${q}". Try a different topic.</div>`;
                    return;
                }

                resultsList.innerHTML = `
                    <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">
                        Found ${res.results.length} educational resources for "<strong>${q}</strong>"
                    </div>
                    ${res.results.map((r, idx) => `
                        <div class="glass-card" style="padding: 24px; transition: transform 0.2s;" 
                             onmouseenter="this.style.transform='translateY(-2px)'" 
                             onmouseleave="this.style.transform=''">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                <span class="glass-badge glass-badge-accent">${r.category || 'Educational'}</span>
                                <span style="font-size: 12px; color: var(--text-muted);">Result ${idx + 1}</span>
                            </div>
                            <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">${r.title}</h4>
                            <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin-bottom: 16px;">${r.snippet}</p>
                            
                            <!-- Inline preview section (no new tab!) -->
                            <div id="preview-${idx}" style="display: none; background: rgba(0,0,0,0.03); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 12px; border-left: 3px solid var(--accent-primary);">
                                <div id="preview-content-${idx}" style="font-size: 14px; line-height: 1.7; color: var(--text-primary);"></div>
                            </div>

                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="glass-btn glass-btn-sm btn-preview-result" 
                                    data-url="${r.url}" data-idx="${idx}" 
                                    style="font-size: 13px;">
                                    📄 Read Summary
                                </button>
                                <span style="font-size: 12px; color: var(--text-muted); align-self: center;">Source: ${new URL(r.url).hostname}</span>
                            </div>
                        </div>
                    `).join('')}
                `;

                // Bind preview buttons — show content inline
                container.querySelectorAll('.btn-preview-result').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const idx = btn.dataset.idx;
                        const url = btn.dataset.url;
                        const previewBox = container.querySelector(`#preview-${idx}`);
                        const previewContent = container.querySelector(`#preview-content-${idx}`);

                        if (previewBox.style.display !== 'none') {
                            previewBox.style.display = 'none';
                            btn.textContent = '📄 Read Summary';
                            return;
                        }

                        btn.textContent = '⏳ Loading...';
                        btn.disabled = true;

                        // Find the matching result
                        const matchResult = res.results[idx];
                        
                        // Show the pre-built snippet as inline preview (no external fetch needed)
                        previewContent.innerHTML = `
                            <div style="font-weight: 700; margin-bottom: 8px; color: var(--accent-primary);">📖 Summary</div>
                            <p style="margin: 0 0 12px;">${matchResult.snippet}</p>
                            <div style="font-weight: 700; margin-bottom: 6px;">💡 Study Tips</div>
                            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                                <li>Take notes while reading this topic</li>
                                <li>Look for key vocabulary and definitions</li>
                                <li>Try to summarize in your own words</li>
                                <li>Create a diagram or mind map</li>
                            </ul>
                            <div style="margin-top: 12px; padding: 8px 12px; background: var(--accent-light); border-radius: var(--radius-sm); font-size: 13px; color: var(--accent-primary);">
                                🔗 <strong>Full source:</strong> ${url}
                                <em style="color: var(--text-muted); margin-left: 8px;">(Ask your teacher to view the full page)</em>
                            </div>
                        `;

                        previewBox.style.display = 'block';
                        btn.textContent = '🔽 Hide Summary';
                        btn.disabled = false;
                    });
                });

            } catch (err) {
                resultsList.innerHTML = `
                    <div class="glass-card" style="padding: 24px; color: var(--status-danger); text-align: center;">
                        ⚠️ Error connecting to search service. Please try again.
                    </div>`;
            }
        });
    },

    showUnsafeSearchAlert(query, message) {
        // Create full-screen danger overlay
        const overlay = document.createElement('div');
        overlay.id = 'unsafe-search-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(220, 38, 38, 0.95);
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        overlay.innerHTML = `
            <div style="
                background: #1a0000;
                border: 2px solid rgba(255,100,100,0.5);
                border-radius: 20px;
                padding: 48px;
                max-width: 500px;
                text-align: center;
                color: white;
                box-shadow: 0 0 60px rgba(220,38,38,0.6);
                animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            ">
                <div style="font-size: 80px; margin-bottom: 16px; animation: shake 0.5s ease;">🚨</div>
                <h2 style="font-size: 28px; font-weight: 900; margin-bottom: 12px; color: #FF6B6B;">
                    ACCESS BLOCKED
                </h2>
                <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.85); margin-bottom: 20px;">
                    Your search for <strong style="color: #FF6B6B;">"${query}"</strong> has been blocked by SmartSlate's safety filter.
                </p>
                <div style="
                    background: rgba(255,100,100,0.15);
                    border: 1px solid rgba(255,100,100,0.3);
                    border-radius: 10px;
                    padding: 14px 18px;
                    margin-bottom: 24px;
                    font-size: 14px;
                    color: rgba(255,255,255,0.7);
                    text-align: left;
                ">
                    ⚠️ Your parents and teacher have been automatically notified about this search attempt.
                </div>
                <p style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 28px;">
                    SmartSlate is an educational platform. Please only search for topics related to your studies.
                </p>
                <button id="unsafe-dismiss-btn" style="
                    background: white;
                    color: #DC2626;
                    border: none;
                    border-radius: 10px;
                    padding: 14px 32px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.2s;
                ">I Understand — Go Back</button>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('#unsafe-dismiss-btn').addEventListener('click', () => {
            overlay.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => overlay.remove(), 300);
        });

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (document.getElementById('unsafe-search-overlay')) {
                overlay.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => overlay.remove(), 300);
            }
        }, 10000);
    },

    // 8.9 My Teacher Section
    async renderMyTeacher(container) {
        let teacherInfo = { name: 'Prof. Sarah Lin', email: 'teacher@smartslate.local', className: 'Grade 5 Alpha', code: 'CLASS-101' };
        try {
            const meRes = await API.get('/api/auth/me');
            if (meRes.user && meRes.user.class_name) {
                teacherInfo.className = meRes.user.class_name;
            }
        } catch(e) {}

        container.innerHTML = `
            <div class="glass-card" style="padding: 28px; margin-bottom: 24px; border-top: 4px solid var(--accent-blue);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <div style="font-size: 64px;">👩‍🏫</div>
                        <div>
                            <span class="glass-badge glass-badge-accent" style="margin-bottom: 6px;">CLASS TEACHER</span>
                            <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); margin-top: 2px;">${teacherInfo.name}</h2>
                            <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">Class: <strong>${teacherInfo.className}</strong> | Email: ${teacherInfo.email}</p>
                        </div>
                    </div>
                    <button id="btn-chat-with-teacher" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 12px 24px;">
                        <img src="/assets/icons/icon-chat-teacher.svg" style="width: 20px; height: 20px;" alt="Chat">
                        <span>Send Direct Message</span>
                    </button>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                <div class="glass-card" style="padding: 20px;">
                    <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 8px; color: var(--accent-primary);">📢 Class Announcements</h4>
                    <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">"Welcome students! Please make sure to complete your Science assignment on Plant Ecosystems by Friday."</p>
                </div>

                <div class="glass-card" style="padding: 20px;">
                    <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 8px; color: var(--status-success);">⏰ Teacher Office Hours</h4>
                    <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">Monday & Wednesday: 3:00 PM – 4:30 PM<br>Ask questions via Direct Chat or during class.</p>
                </div>
            </div>
        `;

        container.querySelector('#btn-chat-with-teacher').addEventListener('click', () => {
            this.activeTab = 'chat';
            document.querySelectorAll('.tab-bar .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'chat'));
            this.renderTabContent(document.querySelector('#student-tab-content'));
        });
    },

    // 8.8 Attendance View
    async renderAttendance(container) {
        const res = await API.getAttendance();
        const records = res.attendance || [];

        container.innerHTML = `
            <div class="glass-card" style="margin-bottom: 24px;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">My Attendance History</h3>
                <p style="color: var(--text-secondary); font-size: 14px;">Record of present, absent, and late marks by date</p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${records.length === 0 ? '<div class="glass-card" style="padding: 20px;">No attendance records found.</div>' : ''}
                ${records.map(r => `
                    <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px;">
                        <div>
                            <span style="font-weight: 700; font-size: 16px;">${r.date}</span>
                            <div style="font-size: 13px; color: var(--text-secondary);">${r.class_name || 'Grade 5 Alpha'}</div>
                        </div>
                        <span class="glass-badge ${r.status === 'present' ? 'glass-badge-success' : r.status === 'late' ? 'glass-badge-warning' : 'glass-badge-danger'}">
                            ${r.status.toUpperCase()}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Helper to open or create a subject notebook and navigate to notebook canvas
    async openSubjectNoteCreation(subjectName) {
        try {
            const res = await API.getBooks();
            const allBooks = res.books || [];
            let targetBook = allBooks.find(b => (b.subject || '').toLowerCase() === (subjectName || '').toLowerCase());
            
            if (!targetBook) {
                const newRes = await API.createBook(`${subjectName} Notebook`, subjectName, 'plum_velvet');
                if (newRes && newRes.book) {
                    targetBook = newRes.book;
                }
            }

            if (targetBook) {
                this.currentBook = targetBook;
                this.activeTab = 'notebook-detail';
                this.renderTabContent(document.querySelector('#student-tab-content'));
                App.showToast(`Opened ${subjectName} Notebook`, 'success');
            } else {
                this.showNewBookModal();
            }
        } catch(e) {
            this.showNewBookModal();
        }
    },

    // Dedicated assignment writing mode opening digital notebook with direct teacher submit banner
    async openAssignmentWriting(assignmentId, encodedTitle, subject, encodedDesc) {
        const title = decodeURIComponent(encodedTitle || 'Assignment');
        const desc = decodeURIComponent(encodedDesc || '');
        const subjectName = subject || 'General';

        this.currentAssignmentContext = {
            id: assignmentId,
            title: title,
            subject: subjectName,
            description: desc
        };

        try {
            const res = await API.getBooks();
            const allBooks = res.books || [];
            let targetBook = allBooks.find(b => (b.subject || '').toLowerCase() === (subjectName || '').toLowerCase());

            if (!targetBook) {
                const newRes = await API.createBook(`${subjectName} Notebook`, subjectName, 'plum_velvet');
                if (newRes && newRes.book) {
                    targetBook = newRes.book;
                }
            }

            if (targetBook) {
                this.currentBook = targetBook;
                // Create a note dedicated to this assignment prompt
                const newNoteRes = await API.createNote(
                    targetBook.id,
                    `Assignment: ${title}`,
                    'ruled',
                    `📝 Assignment Task: ${title}\nInstructions: ${desc}\n\n[Write your completed answer / work below:]\n\n`
                ).catch(() => null);

                if (newNoteRes && newNoteRes.note) {
                    this.currentNote = newNoteRes.note;
                }

                this.activeTab = 'notebook-detail';
                this.renderTabContent(document.querySelector('#student-tab-content'));
                App.showToast(`Opened ${subjectName} Notebook for Assignment: "${title}"`, 'success');
            } else {
                this.showDirectSubmitModal(assignmentId, encodedTitle, subject, encodedDesc);
            }
        } catch(e) {
            console.error('Error opening assignment writing:', e);
            this.showDirectSubmitModal(assignmentId, encodedTitle, subject, encodedDesc);
        }
    },

    // Quick direct submit modal for writing or pasting assignment response
    showDirectSubmitModal(assignmentId, encodedTitle, subject, encodedDesc) {
        const title = decodeURIComponent(encodedTitle || 'Assignment');
        const desc = decodeURIComponent(encodedDesc || '');
        const subjectName = subject || 'General';

        // Remove any prior modal
        const oldModal = document.getElementById('modal-submit-assignment');
        if (oldModal) oldModal.remove();

        const modalHtml = `
            <div class="modal-overlay active" id="modal-submit-assignment" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;">
                <div class="glass-card" style="width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 26px; background: #FFFFFF; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div>
                            <span class="glass-badge" style="background: #EEF2FF; color: #4F46E5; font-weight: 800; font-size: 11px; text-transform: uppercase;">${subjectName} Assignment</span>
                            <h3 style="font-size: 20px; font-weight: 800; color: #151A2D; margin-top: 6px;">${title}</h3>
                        </div>
                        <button type="button" class="glass-btn glass-btn-sm" onclick="document.getElementById('modal-submit-assignment').remove()" style="font-size: 16px; padding: 4px 10px;">✕</button>
                    </div>

                    ${desc ? `
                        <div style="font-size: 13.5px; color: #4B5563; background: #F9FAFB; padding: 14px; border-radius: 10px; border-left: 4px solid #4F46E5; margin-bottom: 18px; line-height: 1.5;">
                            <strong>Instructions:</strong> ${desc}
                        </div>
                    ` : ''}

                    <form id="form-direct-submit-assignment" style="display: flex; flex-direction: column; gap: 14px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 6px;">Your Written Solution / Response</label>
                            <textarea id="direct-submit-content" class="glass-textarea" style="width: 100%; min-height: 180px; padding: 12px; font-size: 14px; border-radius: 10px; border: 1.5px solid #D1D5DB; box-sizing: border-box; line-height: 1.5;" placeholder="Write or paste your completed assignment solution here..." required autofocus></textarea>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
                            <button type="button" class="glass-btn" onclick="document.getElementById('modal-submit-assignment').remove()">Cancel</button>
                            <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="background: linear-gradient(135deg, #10B981, #059669); padding: 10px 22px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 14px rgba(16,185,129,0.3);">
                                <span>📤 Submit Assignment to Teacher</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div.firstElementChild);

        document.getElementById('form-direct-submit-assignment')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = document.getElementById('direct-submit-content').value;
            if (!content || !content.trim()) return;

            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';
            }

            try {
                await API.submitAssignment(assignmentId, content.trim());
                document.getElementById('modal-submit-assignment')?.remove();
                App.showToast('🎉 Assignment submitted to Teacher successfully!', 'success');
                this.activeTab = 'homework';
                this.renderTabContent(document.querySelector('#student-tab-content'));
            } catch(err) {
                App.showToast('Failed to submit assignment: ' + err.message, 'danger');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '📤 Submit Assignment to Teacher';
                }
            }
        });
    },

    // Modals
    showNewBookModal() {
        const modalContainer = document.querySelector('#modal-container');
        modalContainer.innerHTML = `
            <div class="modal-overlay active">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 class="modal-title">Create New Notebook</h3>
                        <button class="modal-close" onclick="document.querySelector('#modal-container').innerHTML=''">×</button>
                    </div>
                    <form id="form-create-book" style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Notebook Title</label>
                            <input type="text" id="new-book-title" class="glass-input" placeholder="e.g. Science & Discovery" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Subject Category</label>
                            <input type="text" id="new-book-subject" class="glass-input" placeholder="e.g. Science" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Cover Theme</label>
                            <select id="new-book-style" class="glass-select">
                                <option value="blue_linen">📘 Blue Linen</option>
                                <option value="sage_paper">📗 Sage Paper</option>
                                <option value="terracotta_leather">📙 Terracotta</option>
                                <option value="plum_velvet">📓 Plum Velvet</option>
                                <option value="amber_gold">📒 Amber Gold</option>
                            </select>
                        </div>
                        <button type="submit" class="glass-btn glass-btn-primary" style="margin-top: 12px;">Create Notebook</button>
                    </form>
                </div>
            </div>
        `;

        modalContainer.querySelector('#form-create-book').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = modalContainer.querySelector('#new-book-title').value;
            const subject = modalContainer.querySelector('#new-book-subject').value;
            const cover_style = modalContainer.querySelector('#new-book-style').value;

            try {
                await API.createBook(title, subject, cover_style);
                modalContainer.innerHTML = '';
                App.showToast('Notebook created successfully!');
                this.activeTab = 'bookshelf';
                this.renderTabContent(document.querySelector('#student-tab-content'));
            } catch (err) {
                App.showToast(err.message, 'danger');
            }
        });
    },

    showShareNoteModal(noteId) {
        const modalContainer = document.querySelector('#modal-container');
        modalContainer.innerHTML = `
            <div class="modal-overlay active">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 class="modal-title">Share Note Page</h3>
                        <button class="modal-close" onclick="document.querySelector('#modal-container').innerHTML=''">×</button>
                    </div>
                    <form id="form-share-note" style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Enter Classmate Student Code</label>
                            <input type="text" id="share-target-code" class="glass-input" placeholder="e.g. STU-102" required>
                        </div>
                        <button type="submit" class="glass-btn glass-btn-primary">Share Note</button>
                    </form>
                </div>
            </div>
        `;

        modalContainer.querySelector('#form-share-note').addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = modalContainer.querySelector('#share-target-code').value;
            try {
                await API.shareNote(noteId, code);
                modalContainer.innerHTML = '';
                App.showToast(`Note shared with ${code}!`);
            } catch (err) {
                App.showToast(err.message, 'danger');
            }
        });
    },

    updateWebSearchWidgetVisibility(activeClass) {
        const container = document.getElementById('web-search-widget-container');
        if (!container) return;

        if (App.currentView !== 'student' && App.currentView !== 'settings') {
            container.style.display = 'none';
            this.toggleWebSearchWidget(false);
            return;
        }

        if (activeClass >= 6) {
            container.style.display = 'block';
            this.ensureWidgetHTMLRendered();
        } else {
            container.style.display = 'none';
            this.toggleWebSearchWidget(false);
        }
    },

    ensureWidgetHTMLRendered() {
        const container = document.getElementById('web-search-widget-container');
        if (!container || container.querySelector('.web-search-trigger-btn')) return;

        const hasSeenIntro = localStorage.getItem('smartslate_web_search_intro_seen') === 'true';

        container.innerHTML = `
            <!-- Trigger Button -->
            <button id="web-search-widget-trigger" class="web-search-trigger-btn bouncy-btn" onclick="StudentView.handleWebSearchWidgetClick()">
                <span class="web-search-trigger-icon">🌐</span>
                <span class="web-search-trigger-label">Web Search</span>
                <span class="web-search-trigger-badge" id="web-search-widget-badge" style="${hasSeenIntro ? 'display: none;' : ''}">NEW</span>
            </button>

            <!-- Floating Search Panel -->
            <div id="web-search-widget-panel" class="web-search-panel-overlay">
                <!-- Header -->
                <div class="web-search-panel-header">
                    <div class="web-search-panel-header-title">
                        <span style="font-size: 18px;">🌐</span>
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <span style="font-weight: 800; font-size: 13.5px; color: #151A2D; line-height: 1.2;">Web Search</span>
                            <span style="font-size: 10.5px; color: #6B7280; font-weight: 600;">School-Safe Portal</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="glass-badge" style="background: #ECFDF5; color: #059669; font-weight: 800; font-size: 10px; padding: 2px 8px; border-radius: 6px; border: none;">🔒 Safe</span>
                        <button class="web-search-panel-close-btn" onclick="StudentView.toggleWebSearchWidget(false)">✕</button>
                    </div>
                </div>

                <!-- Body Content (Dynamic views: search main, results, or browser) -->
                <div id="web-search-widget-body" class="web-search-panel-body"></div>
            </div>
        `;
    },

    handleWebSearchWidgetClick() {
        const studentInfo = App.currentUser || AcademicData.studentProfile || { classNum: 8, section: 'Section A' };
        const activeClass = AcademicData.selectedClass || studentInfo.classNum || 8;

        const hasSeenIntro = localStorage.getItem('smartslate_web_search_intro_seen') === 'true';
        if (!hasSeenIntro) {
            this.showWebSearchUnlockModal(activeClass);
        } else {
            this.toggleWebSearchWidget();
        }
    },

    toggleWebSearchWidget(forceState = null) {
        const panel = document.getElementById('web-search-widget-panel');
        if (!panel) return;

        const isCurrentlyOpen = panel.classList.contains('active');
        const shouldOpen = forceState !== null ? forceState : !isCurrentlyOpen;

        if (shouldOpen) {
            panel.classList.add('active');
            
            // Mark new badge as hidden
            const badge = document.getElementById('web-search-widget-badge');
            if (badge) badge.style.display = 'none';

            // Render current view inside widget panel
            const body = document.getElementById('web-search-widget-body');
            if (body) {
                this.renderWebSearchView(body, this.currentWebQuery || '');
            }
        } else {
            panel.classList.remove('active');
        }
    },

    showWebSearchUnlockModal(activeClass) {
        const isClass6 = activeClass === 6;
        const html = `
            <div class="modal-card" style="max-width: 480px; text-align: center; padding: 32px 28px;">
                
                <!-- Glowing Pulsing Icon -->
                <div class="unlock-feature-glow">
                    <span>🌐</span>
                </div>

                <div style="display: inline-flex; align-items: center; gap: 6px; background: #F1EDFF; color: #8864F3; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; margin-bottom: 12px; text-transform: uppercase;">
                    ✨ NEW FEATURE UNLOCKED
                </div>

                <h2 style="font-size: 24px; font-weight: 900; color: #151A2D; margin: 0 0 8px 0; letter-spacing: -0.4px;">
                    Web Search
                </h2>

                <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 0 0 18px 0;">
                    ${isClass6 
                        ? '<strong>A New Way to Learn.</strong> Web Search is now available to you in Class 6. Explore beyond your textbooks and discover educational information from around the world.'
                        : '<strong>Web Search is now available.</strong> Explore the wider web, research academic topics, and learn beyond your classroom textbooks.'}
                </p>

                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 10px 14px; margin-bottom: 22px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; color: #059669; font-weight: 700;">
                    <span>🔒 School-Safe Educational Filters Active</span>
                </div>

                <div style="display: flex; justify-content: center; gap: 12px;">
                    <button class="glass-btn glass-btn-primary bouncy-btn" onclick="StudentView.confirmWebSearchUnlock()" style="padding: 12px 28px; font-size: 14px; font-weight: 800; border-radius: 12px;">
                        <span>START SEARCHING →</span>
                    </button>
                </div>

            </div>
        `;
        App.showModal(html);
    }
};
