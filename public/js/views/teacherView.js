/* Teacher Dashboard View Component */

const TeacherView = {
    activeTab: 'overview', // 'overview', 'student-detail', 'attendance', 'assignments', 'exams', 'chat'
    currentClassId: null,
    selectedStudentId: null,
    classes: [],
    students: [],

    async render(container) {
        container.innerHTML = `
            <div class="dashboard-header">
                <div>
                    <h1 class="dashboard-title" style="display: flex; align-items: center; gap: 10px;">
                        <img src="/assets/icons/icon-teacher-dashboard.svg" style="width: 32px; height: 32px;" alt="Teacher">
                        <span>Teacher Portal</span>
                    </h1>
                    <p class="dashboard-subtitle">Manage student rosters, create assignments & exams, track progress & alerts</p>
                </div>
                <div style="display: flex; gap: 10px;" id="teacher-header-actions">
                    <button id="teacher-btn-new-assign" class="glass-btn glass-btn-primary bouncy-btn">
                        <img src="/assets/icons/icon-assignment.svg" style="width: 18px; height: 18px;" alt="New Assignment">
                        <span>New Assignment</span>
                    </button>
                    <button id="teacher-btn-new-exam" class="glass-btn glass-btn-secondary bouncy-btn">
                        <img src="/assets/icons/icon-exam.svg" style="width: 18px; height: 18px;" alt="Create Exam">
                        <span>Create Exam</span>
                    </button>
                </div>
            </div>

            <!-- Class Selector -->
            <div class="glass-card" style="margin-bottom: 20px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: 700; color: var(--text-secondary); font-size: 14px; text-transform: uppercase;">Selected Class:</span>
                    <select id="teacher-class-select" class="glass-select" style="min-width: 220px; padding: 8px 14px;">
                        <option value="">Loading classes...</option>
                    </select>
                </div>
                <div id="class-stats-chip" style="font-weight: 600; font-size: 14px; color: var(--accent-primary);"></div>
            </div>

            <!-- Tab Bar -->
            <div class="tab-bar">
                <button class="tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
                    <img src="/assets/icons/icon-student-table.svg" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px;" alt="Roster">Student Roster
                </button>
                <button class="tab-btn ${this.activeTab === 'attendance' ? 'active' : ''}" data-tab="attendance">
                    <img src="/assets/icons/icon-attendance-mark.svg" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px;" alt="Attendance">Attendance Marker
                </button>
                <button class="tab-btn ${this.activeTab === 'assignments' ? 'active' : ''}" data-tab="assignments">
                    <img src="/assets/icons/icon-assignment.svg" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px;" alt="Assignments">Assignments
                </button>
                <button class="tab-btn ${this.activeTab === 'exams' ? 'active' : ''}" data-tab="exams">
                    <img src="/assets/icons/icon-exam.svg" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px;" alt="Exams">Exams & Quizzes
                </button>
                <button class="tab-btn ${this.activeTab === 'chat' ? 'active' : ''}" data-tab="chat">
                    <img src="/assets/icons/icon-chat-group.svg" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px;" alt="Chat">Class Chat & Announcements
                </button>
            </div>

            <!-- Sub View Container -->
            <div id="teacher-tab-content"></div>
        `;

        await this.loadClasses(container);
        this.bindEvents(container);
    },

    async loadClasses(container) {
        try {
            const data = await API.getTeacherClasses();
            this.classes = data.classes || [];

            const select = container.querySelector('#teacher-class-select');
            if (!this.classes.length) {
                select.innerHTML = `<option value="">No classes assigned</option>`;
                container.querySelector('#teacher-tab-content').innerHTML = `
                    <div class="glass-card" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <h3>No Active Classes</h3>
                        <p style="margin-top: 8px;">You have not been assigned to any class yet.</p>
                    </div>
                `;
                return;
            }

            select.innerHTML = this.classes.map(c => `
                <option value="${c.id}" ${this.currentClassId == c.id ? 'selected' : ''}>
                    ${c.name} (${c.class_code}) — ${c.student_count} Students
                </option>
            `).join('');

            if (!this.currentClassId && this.classes.length > 0) {
                this.currentClassId = this.classes[0].id;
            }

            select.value = this.currentClassId;
            this.updateClassStatsChip(container);
            await this.renderTabContent(container.querySelector('#teacher-tab-content'));
        } catch (err) {
            App.toast('Failed to load teacher classes: ' + err.message, 'danger');
        }
    },

    updateClassStatsChip(container) {
        const cls = this.classes.find(c => c.id == this.currentClassId);
        const chip = container.querySelector('#class-stats-chip');
        if (cls && chip) {
            chip.textContent = `Active Class: ${cls.name} (${cls.student_count} Enrolled)`;
        }
    },

    bindEvents(container) {
        const select = container.querySelector('#teacher-class-select');
        if (select) {
            select.addEventListener('change', async (e) => {
                this.currentClassId = e.target.value;
                this.updateClassStatsChip(container);
                await this.renderTabContent(container.querySelector('#teacher-tab-content'));
            });
        }

        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.activeTab = tab;
                container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.renderTabContent(container.querySelector('#teacher-tab-content'));
            });
        });

        const newAssignBtn = container.querySelector('#teacher-btn-new-assign');
        if (newAssignBtn) {
            newAssignBtn.addEventListener('click', () => this.showNewAssignmentFormModal());
        }

        const newExamBtn = container.querySelector('#teacher-btn-new-exam');
        if (newExamBtn) {
            newExamBtn.addEventListener('click', () => this.showNewExamFormModal());
        }
    },

    async renderTabContent(contentArea) {
        contentArea.innerHTML = `<div style="text-align: center; padding: 40px;"><div class="spinner" style="margin: 0 auto;"></div></div>`;

        try {
            switch (this.activeTab) {
                case 'overview':
                    await this.renderColorCodedStudentTable(contentArea);
                    break;
                case 'student-detail':
                    await this.renderStudentDetail(contentArea);
                    break;
                case 'attendance':
                    await this.renderAttendance(contentArea);
                    break;
                case 'assignments':
                    await this.renderAssignments(contentArea);
                    break;
                case 'exams':
                    await this.renderExams(contentArea);
                    break;
                case 'chat':
                    await this.renderChat(contentArea);
                    break;
                default:
                    await this.renderColorCodedStudentTable(contentArea);
            }
        } catch (err) {
            contentArea.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 40px; color: var(--status-danger);">
                    <p>Error loading tab content: ${err.message}</p>
                </div>
            `;
        }
    },

    // 1. Color-Coded Student Table View
    async renderColorCodedStudentTable(container) {
        if (!this.currentClassId) return;
        const res = await API.getClassStudents(this.currentClassId);
        this.students = res.students || [];

        if (!this.students.length) {
            container.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <p>No students currently enrolled in this class.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="glass-card" style="padding: 20px; overflow-x: auto;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <h3 style="font-size: 18px; font-weight: 700;">Enrolled Student Roster</h3>
                    <div style="display: flex; gap: 12px; font-size: 12px; font-weight: 600;">
                        <span style="color: var(--status-success);">🟢 Good (≥85%)</span>
                        <span style="color: var(--status-warning);">🟡 Warning (70–84%)</span>
                        <span style="color: var(--status-danger);">🔴 Needs Help (<70%)</span>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary); text-transform: uppercase; font-size: 12px;">
                            <th style="padding: 12px;">Student Name</th>
                            <th style="padding: 12px;">Code</th>
                            <th style="padding: 12px;">Submissions</th>
                            <th style="padding: 12px;">Exam Average</th>
                            <th style="padding: 12px;">Performance State</th>
                            <th style="padding: 12px; text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.students.map(s => {
                            const avgScoreNum = s.avg_exam_score !== null ? Math.round(s.avg_exam_score) : 90;
                            let rowBg = 'rgba(46, 204, 113, 0.1)';
                            let badgeClass = 'glass-badge-success';
                            let stateLabel = 'Good Standing';

                            if (avgScoreNum < 70) {
                                rowBg = 'rgba(231, 76, 60, 0.12)';
                                badgeClass = 'glass-badge-danger';
                                stateLabel = 'Needs Attention';
                            } else if (avgScoreNum < 85) {
                                rowBg = 'rgba(243, 156, 18, 0.12)';
                                badgeClass = 'glass-badge-warning';
                                stateLabel = 'Borderline';
                            }

                            return `
                                <tr style="border-bottom: 1px solid var(--border-color); background: ${rowBg}; transition: background 150ms ease;">
                                    <td style="padding: 14px 12px; font-weight: 700; color: var(--text-primary);">${s.student_name}</td>
                                    <td style="padding: 14px 12px; color: var(--accent-primary); font-weight: 600;">${s.student_code}</td>
                                    <td style="padding: 14px 12px;">${s.submissions_count} Completed</td>
                                    <td style="padding: 14px 12px; font-weight: 700;">${avgScoreNum}%</td>
                                    <td style="padding: 14px 12px;"><span class="glass-badge ${badgeClass}">${stateLabel}</span></td>
                                    <td style="padding: 14px 12px; text-align: right;">
                                        <button class="glass-btn glass-btn-sm btn-view-student bouncy-btn" data-id="${s.student_id}">
                                            <span>View Details →</span>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.querySelectorAll('.btn-view-student').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedStudentId = e.currentTarget.dataset.id;
                this.activeTab = 'student-detail';
                this.renderTabContent(container);
            });
        });
    },

    // 2. Full Student Detail Page
    async renderStudentDetail(container) {
        if (!this.selectedStudentId) {
            this.activeTab = 'overview';
            return this.renderTabContent(container);
        }

        const student = this.students.find(s => s.student_id == this.selectedStudentId);

        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <button id="btn-back-roster" class="glass-btn glass-btn-sm bouncy-btn" style="margin-bottom: 12px;">
                    <img src="/assets/icons/icon-back.svg" style="width: 16px; height: 16px;" alt="Back">
                    <span>Back to Student Roster</span>
                </button>
                <div class="glass-card" style="padding: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">${student ? student.student_name : 'Student Profile'}</h2>
                            <p style="color: var(--text-secondary); font-size: 14px; margin-top: 2px;">Code: <strong style="color: var(--accent-primary);">${student ? student.student_code : ''}</strong> | Email: ${student ? student.email : ''}</p>
                        </div>
                        <span class="glass-badge glass-badge-accent" style="padding: 8px 16px; font-size: 14px;">Active Enrolled Student</span>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 24px;">
                        <div class="stat-box" style="background: rgba(255,255,255,0.7);">
                            <div style="color: var(--text-muted); font-size: 12px; text-transform: uppercase;">Assignment Submissions</div>
                            <div class="stat-value" style="color: var(--accent-blue);">${student ? student.submissions_count : 0}</div>
                        </div>
                        <div class="stat-box" style="background: rgba(255,255,255,0.7);">
                            <div style="color: var(--text-muted); font-size: 12px; text-transform: uppercase;">Exam Average</div>
                            <div class="stat-value" style="color: var(--accent-green);">${student && student.avg_exam_score ? Math.round(student.avg_exam_score) : 90}%</div>
                        </div>
                        <div class="stat-box" style="background: rgba(255,255,255,0.7);">
                            <div style="color: var(--text-muted); font-size: 12px; text-transform: uppercase;">Security Alerts Logged</div>
                            <div class="stat-value" style="color: var(--status-warning);">0</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.querySelector('#btn-back-roster').addEventListener('click', () => {
            this.activeTab = 'overview';
            this.renderTabContent(container);
        });
    },

    // 3. Assignment Creation Form Modal (Mode-First Prompt)
    showNewAssignmentFormModal() {
        App.showModal(`
            <div class="modal-card" style="max-width: 520px; text-align: center;">
                <div class="modal-header">
                    <h3 class="modal-title">Select Assignment Mode</h3>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>
                <p style="color: var(--text-secondary); margin-top: 8px; margin-bottom: 20px;">Choose assignment format for students:</p>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <button class="glass-card interactive bouncy-btn btn-assign-mode" data-mode="written" style="padding: 20px; text-align: left; border-left: 6px solid var(--accent-blue);">
                        <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">✏️ Written / Essay Task</div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Free-form text instructions and digital notebook submission.</div>
                    </button>
                    <button class="glass-card interactive bouncy-btn btn-assign-mode" data-mode="mcq" style="padding: 20px; text-align: left; border-left: 6px solid var(--accent-coral);">
                        <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">🔘 Multiple Choice Quiz</div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Structured multiple-choice questions with answer choices.</div>
                    </button>
                </div>
            </div>
        `);

        const modal = document.getElementById('modal-container');
        modal.querySelectorAll('.btn-assign-mode').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.renderAssignmentFormBuilder(mode);
            });
        });
    },

    renderAssignmentFormBuilder(mode) {
        App.showModal(`
            <div class="modal-card" style="max-width: 600px;">
                <div class="modal-header">
                    <h3 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
                        <img src="/assets/icons/icon-assignment.svg" style="width: 24px; height: 24px;" alt="Assignment">
                        <span>New ${mode === 'mcq' ? 'Multiple Choice' : 'Written'} Assignment</span>
                    </h3>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>

                <form id="form-create-assignment" style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Assignment Title</label>
                        <input type="text" id="assign-title" class="glass-input" placeholder="e.g. Science Report: Plant Ecosystems" required>
                    </div>

                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Target Class</label>
                        <select id="assign-class-id" class="glass-select">
                            ${this.classes.map(c => `<option value="${c.id}" ${c.id == this.currentClassId ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Deadline / Due Date</label>
                        <input type="date" id="assign-due-date" class="glass-input" value="${new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]}" required>
                    </div>

                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Instructions & Problem Description</label>
                        <textarea id="assign-description" class="glass-textarea" style="min-height: 100px;" placeholder="Write student instructions here..." required></textarea>
                    </div>

                    <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; margin-top: 8px;">Publish Assignment</button>
                </form>
            </div>
        `);

        const modal = document.getElementById('modal-container');
        const form = modal.querySelector('#form-create-assignment');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const class_id = modal.querySelector('#assign-class-id').value;
            const title = modal.querySelector('#assign-title').value;
            const due_at = modal.querySelector('#assign-due-date').value;
            const description = modal.querySelector('#assign-description').value;

            try {
                await API.createAssignment(class_id, title, description, due_at);
                App.closeModal();
                App.toast('Assignment published to students successfully! 📝', 'success');
                this.activeTab = 'assignments';
                this.render(document.querySelector('#view-teacher'));
            } catch (err) {
                App.toast('Failed to publish assignment: ' + err.message, 'danger');
            }
        });
    },

    // 4. Structured Exam Creation Form Modal (Mode-First Step)
    showNewExamFormModal() {
        App.showModal(`
            <div class="modal-card" style="max-width: 520px; text-align: center;">
                <div class="modal-header">
                    <h3 class="modal-title">Select Exam Question Mode</h3>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>
                <p style="color: var(--text-secondary); margin-top: 8px; margin-bottom: 20px;">Choose question response format for this exam:</p>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <button class="glass-card interactive bouncy-btn btn-exam-mode" data-mode="mcq" style="padding: 20px; text-align: left; border-left: 6px solid var(--accent-coral);">
                        <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">🔘 Multiple Choice Mode</div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Each question has A/B/C/D option fields and auto-grading selector.</div>
                    </button>
                    <button class="glass-card interactive bouncy-btn btn-exam-mode" data-mode="written" style="padding: 20px; text-align: left; border-left: 6px solid var(--accent-blue);">
                        <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">✏️ Written / Descriptive Mode</div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Free-text short answer / essay questions on lined notebook paper.</div>
                    </button>
                </div>
            </div>
        `);

        const modal = document.getElementById('modal-container');
        modal.querySelectorAll('.btn-exam-mode').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.renderExamFormBuilder(mode);
            });
        });
    },

    renderExamFormBuilder(mode) {
        let questionRows = [
            { id: 1, text: '', type: mode, optionA: '', optionB: '', optionC: '', optionD: '', correct: '' }
        ];

        const renderQuestionsHTML = () => {
            return questionRows.map((q, idx) => `
                <div class="glass-card" style="padding: 14px; margin-bottom: 12px; background: rgba(255,255,255,0.6);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 14px;">Question #${idx + 1} (${mode === 'mcq' ? 'Multiple Choice' : 'Written Essay'})</strong>
                        ${questionRows.length > 1 ? `<button type="button" class="btn-remove-q glass-btn glass-btn-sm" data-idx="${idx}" style="color: var(--status-danger); padding: 2px 8px;">Remove</button>` : ''}
                    </div>
                    <input type="text" class="glass-input q-text" data-idx="${idx}" value="${q.text}" placeholder="Enter question prompt..." style="margin-bottom: 8px;" required>
                    
                    ${mode === 'mcq' ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <input type="text" class="glass-input q-opt-a" data-idx="${idx}" value="${q.optionA}" placeholder="Option A">
                            <input type="text" class="glass-input q-opt-b" data-idx="${idx}" value="${q.optionB}" placeholder="Option B">
                            <input type="text" class="glass-input q-opt-c" data-idx="${idx}" value="${q.optionC}" placeholder="Option C">
                            <input type="text" class="glass-input q-opt-d" data-idx="${idx}" value="${q.optionD}" placeholder="Option D">
                        </div>
                        <input type="text" class="glass-input q-correct" data-idx="${idx}" value="${q.correct}" placeholder="Exact Correct Answer string..." required>
                    ` : `
                        <div style="font-size: 12px; color: var(--text-muted); font-style: italic;">Student will answer this question using the child-friendly notebook writing canvas.</div>
                    `}
                </div>
            `).join('');
        };

        App.showModal(`
            <div class="modal-card" style="max-width: 680px; max-height: 85vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
                        <img src="/assets/icons/icon-exam.svg" style="width: 24px; height: 24px;" alt="Exam">
                        <span>Create & Publish Exam (${mode === 'mcq' ? 'Multiple Choice' : 'Written Mode'})</span>
                    </h3>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>

                <form id="form-create-exam" style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Exam Title</label>
                        <input type="text" id="exam-title" class="glass-input" placeholder="e.g. Midterm Assessment" required>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Target Class</label>
                            <select id="exam-class-id" class="glass-select">
                                ${this.classes.map(c => `<option value="${c.id}" ${c.id == this.currentClassId ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Time Limit (Minutes)</label>
                            <input type="number" id="exam-duration" class="glass-input" value="20" min="5" max="180" required>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Start Time (Access Window Opens)</label>
                            <input type="datetime-local" id="exam-start-time" class="glass-input" value="${new Date().toISOString().slice(0,16)}" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">End Time (Access Window Closes)</label>
                            <input type="datetime-local" id="exam-end-time" class="glass-input" value="${new Date(Date.now() + 86400000).toISOString().slice(0,16)}" required>
                        </div>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <label style="font-size: 14px; font-weight: 600;">Exam Questions</label>
                            <button type="button" id="btn-add-q-row" class="glass-btn glass-btn-sm glass-btn-secondary">+ Add Question</button>
                        </div>
                        <div id="questions-builder-list">${renderQuestionsHTML()}</div>
                    </div>

                    <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; margin-top: 8px;">Publish Exam to Class</button>
                </form>
            </div>
        `);

        const modal = document.getElementById('modal-container');
        const qList = modal.querySelector('#questions-builder-list');

        const bindQEvents = () => {
            qList.querySelectorAll('.q-text').forEach(el => el.addEventListener('input', e => questionRows[e.target.dataset.idx].text = e.target.value));
            if (mode === 'mcq') {
                qList.querySelectorAll('.q-opt-a').forEach(el => el.addEventListener('input', e => questionRows[e.target.dataset.idx].optionA = e.target.value));
                qList.querySelectorAll('.q-opt-b').forEach(el => el.addEventListener('input', e => questionRows[e.target.dataset.idx].optionB = e.target.value));
                qList.querySelectorAll('.q-opt-c').forEach(el => el.addEventListener('input', e => questionRows[e.target.dataset.idx].optionC = e.target.value));
                qList.querySelectorAll('.q-opt-d').forEach(el => el.addEventListener('input', e => questionRows[e.target.dataset.idx].optionD = e.target.value));
                qList.querySelectorAll('.q-correct').forEach(el => el.addEventListener('input', e => questionRows[e.target.dataset.idx].correct = e.target.value));
            }

            qList.querySelectorAll('.btn-remove-q').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.dataset.idx);
                    questionRows.splice(idx, 1);
                    qList.innerHTML = renderQuestionsHTML();
                    bindQEvents();
                });
            });
        };

        bindQEvents();

        modal.querySelector('#btn-add-q-row').addEventListener('click', () => {
            questionRows.push({ id: questionRows.length + 1, text: '', type: mode, optionA: '', optionB: '', optionC: '', optionD: '', correct: '' });
            qList.innerHTML = renderQuestionsHTML();
            bindQEvents();
        });

        const form = modal.querySelector('#form-create-exam');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const class_id = modal.querySelector('#exam-class-id').value;
            const title = modal.querySelector('#exam-title').value;
            const duration_minutes = parseInt(modal.querySelector('#exam-duration').value) || 20;
            const start_time = modal.querySelector('#exam-start-time').value;
            const end_time = modal.querySelector('#exam-end-time').value;

            const formattedQuestions = questionRows.map((q, idx) => ({
                id: idx + 1,
                text: q.text,
                type: mode,
                options: mode === 'mcq' ? [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean) : [],
                correct: q.correct || ''
            }));

            try {
                await API.createExam(class_id, title, formattedQuestions, duration_minutes, start_time, end_time);
                App.closeModal();
                App.toast('Exam published to class! 🎯', 'success');
                this.activeTab = 'exams';
                this.render(document.querySelector('#view-teacher'));
            } catch (err) {
                App.toast('Failed to create exam: ' + err.message, 'danger');
            }
        });
    },

    // 5. Attendance Marker
    async renderAttendance(container) {
        if (!this.currentClassId) return;
        const todayStr = new Date().toISOString().split('T')[0];

        if (!this.students.length) {
            const res = await API.getClassStudents(this.currentClassId);
            this.students = res.students || [];
        }

        const existingAtt = await API.getAttendance(this.currentClassId, todayStr);
        const attMap = {};
        if (existingAtt.attendance) {
            existingAtt.attendance.forEach(a => attMap[a.student_id] = a.status);
        }

        container.innerHTML = `
            <div class="glass-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h3 style="font-size: 18px; font-weight: 700;">Daily Attendance Marker</h3>
                        <p style="font-size: 13px; color: var(--text-secondary);">Select date and mark status for each student</p>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <input type="date" id="att-date-picker" class="glass-input" value="${todayStr}" style="padding: 8px 12px; width: auto;">
                        <button id="btn-save-attendance" class="glass-btn glass-btn-primary bouncy-btn">
                            <span>Save Attendance</span>
                        </button>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px;" id="attendance-list">
                    ${this.students.map(s => {
                        const curStatus = attMap[s.student_id] || 'present';
                        return `
                            <div class="glass-card" style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <strong style="font-size: 15px;">${s.student_name}</strong>
                                    <span style="font-size: 12px; color: var(--text-muted); margin-left: 8px;">(${s.student_code})</span>
                                </div>
                                <div style="display: flex; gap: 8px;" class="att-status-buttons" data-student-id="${s.student_id}">
                                    <button type="button" class="glass-btn glass-btn-sm att-btn ${curStatus === 'present' ? 'glass-btn-primary' : ''}" data-status="present">Present</button>
                                    <button type="button" class="glass-btn glass-btn-sm att-btn ${curStatus === 'late' ? 'glass-btn-secondary' : ''}" data-status="late">Late</button>
                                    <button type="button" class="glass-btn glass-btn-sm att-btn ${curStatus === 'absent' ? 'glass-badge-danger' : ''}" data-status="absent">Absent</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('.att-status-buttons').forEach(group => {
            group.querySelectorAll('.att-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    group.querySelectorAll('.att-btn').forEach(b => {
                        b.classList.remove('glass-btn-primary', 'glass-btn-secondary', 'glass-badge-danger');
                    });
                    const status = e.target.dataset.status;
                    if (status === 'present') e.target.classList.add('glass-btn-primary');
                    if (status === 'late') e.target.classList.add('glass-btn-secondary');
                    if (status === 'absent') e.target.classList.add('glass-badge-danger');
                });
            });
        });

        const saveBtn = container.querySelector('#btn-save-attendance');
        saveBtn.addEventListener('click', async () => {
            const selectedDate = container.querySelector('#att-date-picker').value;
            const records = [];
            container.querySelectorAll('.att-status-buttons').forEach(group => {
                const studentId = group.dataset.studentId;
                let status = 'present';
                group.querySelectorAll('.att-btn').forEach(b => {
                    if (b.classList.contains('glass-btn-primary')) status = 'present';
                    if (b.classList.contains('glass-btn-secondary')) status = 'late';
                    if (b.classList.contains('glass-badge-danger')) status = 'absent';
                });
                records.push({ student_id: studentId, status });
            });

            try {
                await API.markAttendance(this.currentClassId, selectedDate, records);
                App.toast(`Attendance recorded for ${selectedDate}!`, 'success');
            } catch (err) {
                App.toast(`Failed to save attendance: ${err.message}`, 'danger');
            }
        });
    },

    // 6. Assignments List
    async renderAssignments(container) {
        if (!this.currentClassId) return;
        const res = await API.getAssignments(this.currentClassId);
        const assignments = res.assignments || [];

        container.innerHTML = `
            <div class="glass-card" style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 18px; font-weight: 700;">Class Assignments</h3>
                    <button class="glass-btn glass-btn-primary bouncy-btn" onclick="TeacherView.showNewAssignmentFormModal()">+ New Assignment</button>
                </div>

                ${assignments.length === 0 ? '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No assignments published yet.</p>' : ''}
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${assignments.map(a => `
                        <div class="glass-card" style="padding: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <h4 style="font-size: 16px; font-weight: 700;">${a.title}</h4>
                                    <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${a.description}</p>
                                </div>
                                <span class="glass-badge glass-badge-accent">Due: ${new Date(a.due_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // 7. Exams List
    async renderExams(container) {
        if (!this.currentClassId) return;
        const res = await API.getExams();
        const exams = res.exams || [];

        container.innerHTML = `
            <div class="glass-card" style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 18px; font-weight: 700;">Class Exams & Quizzes</h3>
                    <button class="glass-btn glass-btn-primary bouncy-btn" onclick="TeacherView.showNewExamFormModal()">+ Create Exam</button>
                </div>

                ${exams.length === 0 ? '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No exams published yet.</p>' : ''}
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${exams.map(e => `
                        <div class="glass-card" style="padding: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h4 style="font-size: 16px; font-weight: 700;">${e.title}</h4>
                                    <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Time Limit: ${e.duration_minutes} Minutes | Submissions: ${e.submissions_count || 0}</p>
                                </div>
                                <span class="glass-badge glass-badge-success">Published ✓</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // 8. Class Chat & Pinned Announcements
    async renderChat(container) {
        container.innerHTML = `
            <div class="glass-card" style="padding: 20px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <h3 style="font-size: 18px; font-weight: 700;">Class Announcements & Chat</h3>
                    <button id="btn-make-announcement" class="glass-btn glass-btn-primary bouncy-btn">
                        <img src="/assets/icons/icon-announcement.svg" style="width: 18px; height: 18px;" alt="Announcement">
                        <span>Post Announcement</span>
                    </button>
                </div>
                <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                    <p>Post class-wide announcements or message students directly from the Student Roster tab.</p>
                </div>
            </div>
        `;

        container.querySelector('#btn-make-announcement').addEventListener('click', () => {
            const text = prompt('Enter class-wide announcement message:');
            if (text && text.trim()) {
                const io = window.SocketClient || window.SocketManager;
                if (io && io.sendMessage) {
                    io.sendMessage({ group_id: 1, content: `📢 ANNOUNCEMENT: ${text.trim()}` });
                }
                App.toast('Announcement posted to class! 📢', 'success');
            }
        });
    }
};
