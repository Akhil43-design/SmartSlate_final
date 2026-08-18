/* SmartSlate Primary Student Dashboard Component (Class 1 - 5) — 5thbelow Integration */

const PrimaryStudentView = {
    activeTab: 'home', // 'home', 'books', 'homework', 'tasks', 'practice', 'teacher'
    openingBook: null,
    filterStatus: 'all', // 'all', 'pending', 'completed'

    async render(container) {
        const user = App.currentUser || { name: 'SmartSlate Kid', class: '5', studentId: 'STU-101', section: 'A' };
        const studentId = user.studentId || 'STU-101';

        container.innerHTML = `
            <!-- Kids Header Banner -->
            <div class="glass-card" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%); border-radius: 24px; padding: 28px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255, 255, 255, 0.4);">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="font-size: 48px; background: white; width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(0,0,0,0.06);">
                        🎨
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h1 style="font-size: 26px; font-weight: 800; color: var(--text-primary); margin: 0;">Welcome, ${user.name}! 👋</h1>
                            <span class="glass-badge glass-badge-accent" style="font-weight: 700; background: #8B5CF6; color: white;">Class ${user.class} (${user.section || 'Alpha'})</span>
                        </div>
                        <p style="color: var(--text-secondary); margin-top: 4px; font-size: 14px; font-weight: 600;">
                            SmartSlate Kids Zone — Learn, Draw, Solve & Play! 🌟 (ID: ${studentId})
                        </p>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="primary-btn-add-task" class="glass-btn glass-btn-primary" style="border-radius: 16px; padding: 12px 20px; font-weight: 700; background: #6366F1; color: white;">
                        ✨ + Add My Task
                    </button>
                    <button class="glass-btn" style="border-radius: 16px; padding: 12px 16px; font-weight: 700; background: rgba(239,68,68,0.1); color: #EF4444; border: 1px solid rgba(239,68,68,0.2);" onclick="App.logout()">
                        🚪 Sign Out
                    </button>
                </div>
            </div>

            <!-- Kids Child-Friendly Navigation Bar -->
            <div class="tab-bar" style="margin-bottom: 24px; gap: 10px; overflow-x: auto; padding-bottom: 6px;">
                <button class="tab-btn ${this.activeTab === 'home' ? 'active' : ''}" data-tab="home" style="border-radius: 16px; font-weight: 700; padding: 10px 18px;">🏠 Home</button>
                <button class="tab-btn ${this.activeTab === 'books' ? 'active' : ''}" data-tab="books" style="border-radius: 16px; font-weight: 700; padding: 10px 18px;">📖 My Storybooks & Notebooks</button>
                <button class="tab-btn ${this.activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks" style="border-radius: 16px; font-weight: 700; padding: 10px 18px;">✅ My Tasks</button>
                <button class="tab-btn ${this.activeTab === 'homework' ? 'active' : ''}" data-tab="homework" style="border-radius: 16px; font-weight: 700; padding: 10px 18px;">📝 Homework</button>
                <button class="tab-btn ${this.activeTab === 'practice' ? 'active' : ''}" data-tab="practice" style="border-radius: 16px; font-weight: 700; padding: 10px 18px;">🎯 Fun Quizzes</button>
                <button class="tab-btn ${this.activeTab === 'teacher' ? 'active' : ''}" data-tab="teacher" style="border-radius: 16px; font-weight: 700; padding: 10px 18px;">👩‍🏫 My Teacher</button>
            </div>

            <!-- Sub View Content Area -->
            <div id="primary-tab-content"></div>
        `;

        this.bindEvents(container);
        this.renderTabContent(container.querySelector('#primary-tab-content'));
    },

    bindEvents(container) {
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.activeTab = tab;
                container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.renderTabContent(container.querySelector('#primary-tab-content'));
            });
        });

        const addTaskBtn = container.querySelector('#primary-btn-add-task');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => this.showAddTaskModal());
        }
    },

    async renderTabContent(contentArea) {
        contentArea.innerHTML = `<div style="text-align: center; padding: 40px;"><div class="spinner" style="margin: 0 auto;"></div></div>`;

        try {
            switch (this.activeTab) {
                case 'home':
                    await this.renderHome(contentArea);
                    break;
                case 'books':
                    await this.renderBooks(contentArea);
                    break;
                case 'tasks':
                    await this.renderTasks(contentArea);
                    break;
                case 'homework':
                    await this.renderHomework(contentArea);
                    break;
                case 'practice':
                    await this.renderPractice(contentArea);
                    break;
                case 'teacher':
                    await this.renderTeacher(contentArea);
                    break;
                default:
                    await this.renderHome(contentArea);
            }
        } catch (err) {
            contentArea.innerHTML = `<div class="glass-card" style="color: var(--status-danger);">Error loading tab: ${err.message}</div>`;
        }
    },

    // 1. Primary Kids Home Hub
    async renderHome(container) {
        const user = App.currentUser || { name: 'SmartSlate Kid', studentId: 'STU-101' };
        const studentId = user.studentId || 'STU-101';
        const tasks = window.TaskService ? await window.TaskService.getTasks(studentId) : [];
        const pendingTasks = tasks.filter(t => t.status === 'pending');

        const subjects = [
            { id: 'maths', name: 'Mathematics', emoji: '🔢', color: '#3B82F6', desc: 'Numbers, Addition & Puzzles' },
            { id: 'science', name: 'Science & Nature', emoji: '🔬', color: '#10B981', desc: 'Plants, Animals & Solar System' },
            { id: 'english', name: 'English Stories', emoji: '📖', color: '#8B5CF6', desc: 'Alphabet, Tales & Writing' },
            { id: 'social', name: 'Social & EVS', emoji: '🌎', color: '#F59E0B', desc: 'Earth & Our Neighborhood' },
            { id: 'art', name: 'Art & Coloring', emoji: '🎨', color: '#EC4899', desc: 'Colors, Shapes & Crayons' }
        ];

        container.innerHTML = `
            <!-- Slatey Mascot Greeting Card -->
            <div class="glass-card" style="background: white; border-radius: 24px; padding: 24px; margin-bottom: 24px; border: 2px solid rgba(99, 102, 241, 0.2); box-shadow: 0 10px 25px rgba(99,102,241,0.08);">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="font-size: 64px; animation: bounce 2s infinite;">🦊</div>
                    <div>
                        <h3 style="font-size: 20px; font-weight: 800; color: #4338CA; margin-bottom: 4px;">Hi! I'm Slatey, your study buddy! 🎒</h3>
                        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 12px;">
                            You have <strong style="color: #6366F1;">${pendingTasks.length} pending task(s)</strong> to finish today. Let's make learning fun!
                        </p>
                        <button class="glass-btn glass-btn-primary" onclick="PrimaryStudentView.activeTab='tasks'; PrimaryStudentView.render(document.getElementById('view-student-5thbelow'))" style="border-radius: 12px; font-weight: 700; background: #4338CA;">
                            View My Pending Tasks →
                        </button>
                    </div>
                </div>
            </div>

            <!-- Subject Notebooks Grid -->
            <div style="margin-bottom: 24px;">
                <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 16px;">📚 My School Subject Books</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                    ${subjects.map(s => `
                        <div class="glass-card bouncy-btn" onclick="PrimaryStudentView.openBook('${s.name}', '${s.emoji}')" style="cursor: pointer; padding: 20px; border-radius: 20px; border-top: 6px solid ${s.color}; background: white; transition: all 0.2s;">
                            <div style="font-size: 40px; margin-bottom: 10px;">${s.emoji}</div>
                            <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">${s.name}</h3>
                            <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 12px;">${s.desc}</p>
                            <div style="font-size: 12px; font-weight: 700; color: ${s.color};">Open Notebook 📖 →</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // 2. Storybooks & Notebooks View
    async renderBooks(container) {
        const books = [
            { title: 'Mathematics Grade 5', emoji: '🔢', color: '#3B82F6', pages: 12 },
            { title: 'Science & Nature Discovery', emoji: '🔬', color: '#10B981', pages: 8 },
            { title: 'Panchatantra English Tales', emoji: '📖', color: '#8B5CF6', pages: 15 },
            { title: 'Art & National Bird Coloring', emoji: '🎨', color: '#EC4899', pages: 6 }
        ];

        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary);">📖 My Interactive Notebooks</h2>
                <p style="color: var(--text-secondary); font-size: 14px;">Click any notebook to trigger the 3D page flip animation</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                ${books.map(b => `
                    <div class="glass-card bouncy-btn" onclick="PrimaryStudentView.openBook('${b.title}', '${b.emoji}')" style="padding: 24px; border-radius: 24px; background: white; border: 2px solid rgba(0,0,0,0.06); cursor: pointer;">
                        <div style="font-size: 48px; margin-bottom: 12px; text-align: center;">${b.emoji}</div>
                        <h3 style="font-size: 18px; font-weight: 800; text-align: center; margin-bottom: 6px;">${b.title}</h3>
                        <p style="text-align: center; color: var(--text-muted); font-size: 13px;">${b.pages} Interactive Pages</p>
                        <div style="margin-top: 16px; text-align: center;">
                            <span class="glass-badge" style="background: ${b.color}; color: white; padding: 6px 14px; border-radius: 12px; font-weight: 700;">Open Book 📖</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // 3. My Tasks Management View (CRUD)
    async renderTasks(container) {
        const user = App.currentUser || { studentId: 'STU-101' };
        const studentId = user.studentId || 'STU-101';
        let tasks = window.TaskService ? await window.TaskService.getTasks(studentId) : [];

        if (this.filterStatus === 'pending') {
            tasks = tasks.filter(t => t.status === 'pending');
        } else if (this.filterStatus === 'completed') {
            tasks = tasks.filter(t => t.status === 'completed');
        }

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                <div>
                    <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary);">✅ My Tasks & To-Dos</h2>
                    <p style="color: var(--text-secondary); font-size: 14px;">Manage your daily homework tasks and study routines</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="glass-btn ${this.filterStatus === 'all' ? 'glass-btn-primary' : ''}" onclick="PrimaryStudentView.filterStatus='all'; PrimaryStudentView.renderTabContent(document.querySelector('#primary-tab-content'))" style="border-radius: 12px; font-weight: 700; font-size: 13px;">All Tasks</button>
                    <button class="glass-btn ${this.filterStatus === 'pending' ? 'glass-btn-primary' : ''}" onclick="PrimaryStudentView.filterStatus='pending'; PrimaryStudentView.renderTabContent(document.querySelector('#primary-tab-content'))" style="border-radius: 12px; font-weight: 700; font-size: 13px;">⏳ Pending</button>
                    <button class="glass-btn ${this.filterStatus === 'completed' ? 'glass-btn-primary' : ''}" onclick="PrimaryStudentView.filterStatus='completed'; PrimaryStudentView.renderTabContent(document.querySelector('#primary-tab-content'))" style="border-radius: 12px; font-weight: 700; font-size: 13px;">✅ Completed</button>
                </div>
            </div>

            ${tasks.length === 0 ? `
                <div class="glass-card" style="text-align: center; padding: 48px; background: white; border-radius: 24px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
                    <h3 style="font-size: 18px; font-weight: 800;">No ${this.filterStatus !== 'all' ? this.filterStatus : ''} tasks found!</h3>
                    <p style="color: var(--text-secondary); margin: 8px 0 16px;">Add a new task to stay organized with your schoolwork.</p>
                    <button class="glass-btn glass-btn-primary" onclick="PrimaryStudentView.showAddTaskModal()" style="border-radius: 14px; font-weight: 700; background: #6366F1; color: white;">+ Add First Task</button>
                </div>
            ` : `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${tasks.map(t => `
                        <div class="glass-card" style="padding: 20px; border-radius: 20px; background: white; border-left: 6px solid ${t.status === 'completed' ? '#10B981' : '#F59E0B'}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                                    <h3 style="font-size: 17px; font-weight: 800; color: var(--text-primary); ${t.status === 'completed' ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${t.title}</h3>
                                    <span class="glass-badge" style="background: ${t.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${t.status === 'completed' ? '#10B981' : '#D97706'}; font-weight: 700; font-size: 11px;">
                                        ${t.status === 'completed' ? 'COMPLETED' : 'PENDING'}
                                    </span>
                                </div>
                                ${t.description ? `<p style="color: var(--text-secondary); font-size: 13px; margin: 2px 0;">${t.description}</p>` : ''}
                                <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-top: 4px;">📅 Due: ${t.dueDate || 'Today'}</div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="glass-btn" onclick="PrimaryStudentView.toggleTaskComplete('${t.id}', ${t.status !== 'completed'})" style="border-radius: 12px; font-size: 13px; font-weight: 700; background: ${t.status === 'completed' ? 'rgba(107,114,128,0.1)' : 'rgba(16,185,129,0.15)'}; color: ${t.status === 'completed' ? '#4B5563' : '#10B981'}; border: none;">
                                    ${t.status === 'completed' ? '↩️ Mark Pending' : '✅ Complete'}
                                </button>
                                <button class="glass-btn" onclick="PrimaryStudentView.deleteTask('${t.id}')" style="border-radius: 12px; font-size: 13px; font-weight: 700; background: rgba(239,68,68,0.1); color: #EF4444; border: none;">
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        `;
    },

    // 4. Homework Tasks View
    async renderHomework(container) {
        const homework = [
            { title: 'Math Addition & Subtraction', subject: 'Mathematics', emoji: '🔢', due: 'Due Today', status: 'To Do' },
            { title: 'Draw and Label a Plant', subject: 'Science', emoji: '🔬', due: 'Due Tomorrow', status: 'In Progress' },
            { title: 'Read Chapter 2 & Write 3 Words', subject: 'English', emoji: '📖', due: 'Due Friday', status: 'To Do' }
        ];

        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary);">📝 Class Homework Assignments</h2>
                <p style="color: var(--text-secondary); font-size: 14px;">Assigned by your teacher for Class ${App.currentUser?.class || '5'}</p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${homework.map(h => `
                    <div class="glass-card" style="padding: 20px; border-radius: 20px; background: white; border: 1px solid rgba(0,0,0,0.06); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="font-size: 36px;">${h.emoji}</div>
                            <div>
                                <span class="glass-badge" style="font-size: 11px; font-weight: 700; background: rgba(99,102,241,0.1); color: #6366F1;">${h.subject}</span>
                                <h3 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">${h.title}</h3>
                                <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">📅 ${h.due}</div>
                            </div>
                        </div>
                        <button class="glass-btn glass-btn-primary" onclick="App.toast('Opening assignment notebook...', 'info')" style="border-radius: 12px; font-weight: 700;">Open Task →</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // 5. Fun Quizzes View
    async renderPractice(container) {
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary);">🎯 Fun Interactive Quizzes</h2>
                <p style="color: var(--text-secondary); font-size: 14px;">Test your knowledge and earn stars!</p>
            </div>

            <div class="glass-card" style="padding: 28px; background: white; border-radius: 24px; text-align: center;">
                <div style="font-size: 56px; margin-bottom: 12px;">🍎 🍎 🍎 🍎 🍎</div>
                <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 16px;">Quiz 1: How many apples are in the picture?</h3>
                <div style="display: flex; justify-content: center; gap: 16px;">
                    <button class="glass-btn" onclick="App.toast('Try again! Count carefully 😊', 'warning')" style="padding: 12px 24px; font-size: 18px; font-weight: 800; border-radius: 14px;">4</button>
                    <button class="glass-btn glass-btn-primary" onclick="App.toast('Correct! +10 Stars ⭐ 🎉', 'success')" style="padding: 12px 24px; font-size: 18px; font-weight: 800; border-radius: 14px; background: #10B981; color: white;">5</button>
                    <button class="glass-btn" onclick="App.toast('Try again! Count carefully 😊', 'warning')" style="padding: 12px 24px; font-size: 18px; font-weight: 800; border-radius: 14px;">6</button>
                </div>
            </div>
        `;
    },

    // 6. My Teacher View
    async renderTeacher(container) {
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary);">👩‍🏫 My Class Teacher</h2>
                <p style="color: var(--text-secondary); font-size: 14px;">Class 1-5 Primary Faculty</p>
            </div>

            <div class="glass-card" style="padding: 24px; background: white; border-radius: 24px; border: 2px solid rgba(99,102,241,0.15);">
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 16px;">
                    <div style="font-size: 48px; background: rgba(99,102,241,0.1); width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center;">👩‍🏫</div>
                    <div>
                        <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary);">Ms. Priya Sharma</h3>
                        <p style="color: var(--text-secondary); font-size: 13px;">Class Primary Teacher (Class 1-5)</p>
                        <p style="color: #6366F1; font-size: 13px; font-weight: 700;">📧 priya.sharma@smartslate.edu</p>
                    </div>
                </div>
                <div style="border-top: 1px solid rgba(0,0,0,0.08); padding-top: 16px;">
                    <h4 style="font-size: 15px; font-weight: 800; margin-bottom: 8px;">📢 Class Announcement:</h4>
                    <p style="color: var(--text-secondary); font-size: 14px; background: rgba(245,158,11,0.1); padding: 12px 16px; border-radius: 14px; color: #D97706; font-weight: 600;">
                        "Bring 2 fresh green leaves for tomorrow's Science class experiment!" 🔬
                    </p>
                </div>
            </div>
        `;
    },

    // Modal: Add New Task
    showAddTaskModal() {
        const modalContainer = document.querySelector('#modal-container');
        if (!modalContainer) return;

        modalContainer.innerHTML = `
            <div class="modal-overlay active">
                <div class="modal-card" style="border-radius: 24px; padding: 24px; max-width: 480px;">
                    <div class="modal-header" style="margin-bottom: 16px;">
                        <h3 class="modal-title" style="font-size: 20px; font-weight: 800;">✨ Add New Task</h3>
                        <button class="modal-close" onclick="document.querySelector('#modal-container').innerHTML=''">×</button>
                    </div>
                    <form id="form-primary-add-task" style="display: flex; flex-direction: column; gap: 14px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 4px;">Task Title</label>
                            <input type="text" id="primary-task-title" class="glass-input" placeholder="e.g. Complete Math Chapter 3" required style="border-radius: 12px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 4px;">Description (Optional)</label>
                            <textarea id="primary-task-desc" class="glass-input" rows="2" placeholder="e.g. Solve exercises 1 to 5" style="border-radius: 12px;"></textarea>
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 4px;">Due Date</label>
                            <input type="text" id="primary-task-due" class="glass-input" placeholder="e.g. Due Tomorrow" value="Due Tomorrow" style="border-radius: 12px;">
                        </div>
                        <button type="submit" class="glass-btn glass-btn-primary" style="border-radius: 14px; padding: 12px; font-weight: 700; background: #6366F1; color: white; margin-top: 8px;">
                            Save Task ✨
                        </button>
                    </form>
                </div>
            </div>
        `;

        modalContainer.querySelector('#form-primary-add-task').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = App.currentUser || { studentId: 'STU-101' };
            const studentId = user.studentId || 'STU-101';
            const title = modalContainer.querySelector('#primary-task-title').value;
            const description = modalContainer.querySelector('#primary-task-desc').value;
            const dueDate = modalContainer.querySelector('#primary-task-due').value;

            try {
                if (window.TaskService) {
                    await window.TaskService.createTask(studentId, { title, description, dueDate });
                }
                modalContainer.innerHTML = '';
                App.toast('Task added successfully! ✨', 'success');
                if (this.activeTab === 'tasks' || this.activeTab === 'home') {
                    this.renderTabContent(document.querySelector('#primary-tab-content'));
                }
            } catch (err) {
                App.toast(err.message, 'danger');
            }
        });
    },

    async toggleTaskComplete(taskId, isCompleted) {
        const user = App.currentUser || { studentId: 'STU-101' };
        const studentId = user.studentId || 'STU-101';
        if (window.TaskService) {
            await window.TaskService.completeTask(studentId, taskId, isCompleted);
        }
        App.toast(isCompleted ? 'Task completed! 🎉 Great job!' : 'Task marked as pending.', 'info');
        this.renderTabContent(document.querySelector('#primary-tab-content'));
    },

    async deleteTask(taskId) {
        const user = App.currentUser || { studentId: 'STU-101' };
        const studentId = user.studentId || 'STU-101';
        if (window.TaskService) {
            await window.TaskService.deleteTask(studentId, taskId);
        }
        App.toast('Task deleted.', 'info');
        this.renderTabContent(document.querySelector('#primary-tab-content'));
    },

    openBook(title, emoji) {
        App.toast(`Opening ${title} Notebook ${emoji}...`, 'info');
    }
};

if (typeof window !== 'undefined') {
    window.PrimaryStudentView = PrimaryStudentView;
}
