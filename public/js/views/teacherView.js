/* Teacher Dashboard View Component */

const TeacherView = {
    activeTab: 'overview', // 'overview', 'attendance', 'assignments', 'exams'
    currentClassId: null,
    classes: [],
    students: [],

    async render(container) {
        container.innerHTML = `
            <div class="dashboard-header">
                <div>
                    <h1 class="dashboard-title">Teacher Portal</h1>
                    <p class="dashboard-subtitle">Manage classes, record attendance, create assignments and grade exams</p>
                </div>
                <div style="display: flex; gap: 10px;" id="teacher-header-actions">
                    <button id="teacher-btn-new-assign" class="glass-btn glass-btn-primary">
                        <svg class="icon-svg"><use href="#icon-plus"/></svg>
                        <span>New Assignment</span>
                    </button>
                    <button id="teacher-btn-new-exam" class="glass-btn glass-btn-secondary">
                        <svg class="icon-svg"><use href="#icon-exam"/></svg>
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
                <button class="tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">👥 Class Roster</button>
                <button class="tab-btn ${this.activeTab === 'attendance' ? 'active' : ''}" data-tab="attendance">📅 Attendance Marker</button>
                <button class="tab-btn ${this.activeTab === 'assignments' ? 'active' : ''}" data-tab="assignments">📝 Assignments & Submissions</button>
                <button class="tab-btn ${this.activeTab === 'exams' ? 'active' : ''}" data-tab="exams">🎯 Exams & Quizzes</button>
                <button class="tab-btn ${this.activeTab === 'chat' ? 'active' : ''}" data-tab="chat">💬 Class Chat</button>
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
            newAssignBtn.addEventListener('click', () => this.showNewAssignmentModal());
        }

        const newExamBtn = container.querySelector('#teacher-btn-new-exam');
        if (newExamBtn) {
            newExamBtn.addEventListener('click', () => this.showNewExamModal());
        }
    },

    async renderTabContent(contentArea) {
        contentArea.innerHTML = `<div style="text-align: center; padding: 40px;"><div class="spinner" style="margin: 0 auto;"></div></div>`;

        try {
            switch (this.activeTab) {
                case 'overview':
                    await this.renderOverview(contentArea);
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
            }
        } catch (err) {
            contentArea.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 40px; color: var(--danger-color);">
                    <p>Error loading tab content: ${err.message}</p>
                </div>
            `;
        }
    },

    // 1. Class Overview / Student Roster
    async renderOverview(container) {
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
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                ${this.students.map(s => {
                    const avgScore = s.avg_exam_score !== null ? `${Math.round(s.avg_exam_score)}%` : 'No Exams Yet';
                    return `
                        <div class="glass-card">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                <div>
                                    <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary);">${s.student_name}</h3>
                                    <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">Code: <strong style="color: var(--accent-primary);">${s.student_code}</strong></p>
                                </div>
                                <span class="glass-badge glass-badge-accent">${s.email}</span>
                            </div>
                            <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 12px 0;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                                <div style="background: rgba(0,0,0,0.02); padding: 8px; border-radius: 8px;">
                                    <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">Submissions</div>
                                    <div style="font-weight: 700; font-size: 16px; margin-top: 2px;">${s.submissions_count}</div>
                                </div>
                                <div style="background: rgba(0,0,0,0.02); padding: 8px; border-radius: 8px;">
                                    <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">Exam Avg</div>
                                    <div style="font-weight: 700; font-size: 16px; margin-top: 2px; color: var(--accent-primary);">${avgScore}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // 2. Attendance Marker
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
                        <button id="btn-save-attendance" class="glass-btn glass-btn-primary">
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

        // Attendance toggle logic
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

        // Save attendance button
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
                App.toast(`Attendance successfully recorded for ${selectedDate}!`, 'success');
            } catch (err) {
                App.toast(`Failed to save attendance: ${err.message}`, 'danger');
            }
        });
    },

    // 3. Assignments & Submissions
    async renderAssignments(container) {
        if (!this.currentClassId) return;
        const res = await API.getAssignments(this.currentClassId);
        const assignments = res.assignments || [];

        if (!assignments.length) {
            container.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 40px;">
                    <p style="color: var(--text-muted); margin-bottom: 16px;">No assignments posted for this class yet.</p>
                    <button class="glass-btn glass-btn-primary" id="btn-create-first-assign">
                        <svg class="icon-svg"><use href="#icon-plus"/></svg>
                        <span>Create First Assignment</span>
                    </button>
                </div>
            `;
            container.querySelector('#btn-create-first-assign')?.addEventListener('click', () => this.showNewAssignmentModal());
            return;
        }

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${assignments.map(a => `
                    <div class="glass-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                            <div>
                                <h3 style="font-size: 17px; font-weight: 700;">${a.title}</h3>
                                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${a.description || 'No instructions provided.'}</p>
                            </div>
                            <span class="glass-badge glass-badge-accent">Due: ${new Date(a.due_at).toLocaleDateString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: 13px;">
                            <span style="color: var(--text-muted);">Submissions received: <strong>${a.submission_count || 0}</strong></span>
                            <button class="glass-btn glass-btn-sm view-sub-btn" data-id="${a.id}">View Submissions</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.querySelectorAll('.view-sub-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assignId = e.currentTarget.dataset.id;
                this.showSubmissionsModal(assignId);
            });
        });
    },

    // 4. Exams & Quizzes
    async renderExams(container) {
        if (!this.currentClassId) return;
        const res = await API.getExams();
        const exams = res.exams || [];

        if (!exams.length) {
            container.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 40px;">
                    <p style="color: var(--text-muted); margin-bottom: 16px;">No exams created yet.</p>
                    <button class="glass-btn glass-btn-primary" id="btn-create-first-exam">
                        <svg class="icon-svg"><use href="#icon-plus"/></svg>
                        <span>Create First Exam</span>
                    </button>
                </div>
            `;
            container.querySelector('#btn-create-first-exam')?.addEventListener('click', () => this.showNewExamModal());
            return;
        }

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${exams.map(e => `
                    <div class="glass-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h3 style="font-size: 17px; font-weight: 700;">${e.title}</h3>
                                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
                                    Duration: ${e.duration_minutes} minutes | Class: ${e.class_name}
                                </p>
                            </div>
                            <button class="glass-btn glass-btn-sm view-results-btn" data-id="${e.id}">
                                <span>View Results</span>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.querySelectorAll('.view-results-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const examId = e.currentTarget.dataset.id;
                this.showExamResultsModal(examId);
            });
        });
    },

    // Modals
    showNewAssignmentModal() {
        if (!this.currentClassId) {
            App.toast('Please select a class first', 'warning');
            return;
        }

        const modalHtml = `
            <div class="glass-card" style="width: 100%; max-width: 500px; padding: 28px;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">Create New Assignment</h3>
                <form id="form-new-assignment" style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Title</label>
                        <input type="text" id="assign-title" class="glass-input" placeholder="e.g. Chapter 4 Worksheet" required>
                    </div>
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Instructions / Description</label>
                        <textarea id="assign-desc" class="glass-textarea" rows="4" placeholder="Enter assignment details..." required></textarea>
                    </div>
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Due Date</label>
                        <input type="date" id="assign-due" class="glass-input" required>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                        <button type="button" class="glass-btn" onclick="App.closeModal()">Cancel</button>
                        <button type="submit" class="glass-btn glass-btn-primary">Post Assignment</button>
                    </div>
                </form>
            </div>
        `;

        App.showModal(modalHtml);

        document.getElementById('form-new-assignment').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('assign-title').value;
            const description = document.getElementById('assign-desc').value;
            const due_at = document.getElementById('assign-due').value;

            try {
                await API.createAssignment(this.currentClassId, title, description, due_at);
                App.toast('Assignment published successfully!', 'success');
                App.closeModal();
                this.renderTabContent(document.querySelector('#teacher-tab-content'));
            } catch (err) {
                App.toast('Failed to create assignment: ' + err.message, 'danger');
            }
        });
    },

    showNewExamModal() {
        if (!this.currentClassId) {
            App.toast('Please select a class first', 'warning');
            return;
        }

        const modalHtml = `
            <div class="glass-card" style="width: 100%; max-width: 600px; padding: 28px;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">Create New Exam / Quiz</h3>
                <form id="form-new-exam" style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Exam Title</label>
                        <input type="text" id="exam-title" class="glass-input" placeholder="e.g. Unit 2 Physics Quiz" required>
                    </div>
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Time Limit (Minutes)</label>
                        <input type="number" id="exam-duration" class="glass-input" value="30" min="5" max="180" required>
                    </div>
                    
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Questions (JSON Array Format)</label>
                        <textarea id="exam-questions-json" class="glass-textarea" rows="8" style="font-family: monospace; font-size: 13px;" required>[
  {
    "id": 1,
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correct_option": 1,
    "points": 10
  }
]</textarea>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                        <button type="button" class="glass-btn" onclick="App.closeModal()">Cancel</button>
                        <button type="submit" class="glass-btn glass-btn-primary">Publish Exam</button>
                    </div>
                </form>
            </div>
        `;

        App.showModal(modalHtml);

        document.getElementById('form-new-exam').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('exam-title').value;
            const duration_minutes = parseInt(document.getElementById('exam-duration').value, 10);
            let questions = [];

            try {
                questions = JSON.parse(document.getElementById('exam-questions-json').value);
            } catch (err) {
                App.toast('Invalid JSON format for questions.', 'danger');
                return;
            }

            try {
                await API.createExam(this.currentClassId, title, questions, duration_minutes);
                App.toast('Exam published successfully!', 'success');
                App.closeModal();
                this.renderTabContent(document.querySelector('#teacher-tab-content'));
            } catch (err) {
                App.toast('Failed to publish exam: ' + err.message, 'danger');
            }
        });
    },

    async showSubmissionsModal(assignId) {
        try {
            const res = await API.getAssignmentSubmissions(assignId);
            const subs = res.submissions || [];

            const modalHtml = `
                <div class="glass-card" style="width: 100%; max-width: 650px; padding: 28px; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="font-size: 20px; font-weight: 700;">Student Submissions (${subs.length})</h3>
                        <button class="glass-btn glass-btn-sm" onclick="App.closeModal()">Close</button>
                    </div>
                    ${!subs.length ? '<p style="color: var(--text-muted);">No student submissions yet.</p>' : `
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${subs.map(s => `
                                <div class="glass-card" style="padding: 14px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <strong>${s.student_name} (${s.student_code})</strong>
                                        <span style="font-size: 12px; color: var(--text-muted);">${new Date(s.submitted_at).toLocaleString()}</span>
                                    </div>
                                    <div style="background: rgba(0,0,0,0.03); padding: 10px; border-radius: 6px; font-size: 14px;">
                                        ${(() => {
                                            if (s.content && s.content.startsWith('{')) {
                                                try {
                                                    const p = JSON.parse(s.content);
                                                    if (p.canvasData) {
                                                        return `<img src="${p.canvasData}" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--border-color); display: block; margin-bottom: 8px;"><div style="white-space: pre-wrap;">${p.text || ''}</div>`;
                                                    }
                                                } catch(e) {}
                                            }
                                            return `<div style="white-space: pre-wrap;">${s.content}</div>`;
                                        })()}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
            App.showModal(modalHtml);
        } catch (err) {
            App.toast('Error fetching submissions: ' + err.message, 'danger');
        }
    },

    async showExamResultsModal(examId) {
        try {
            const res = await API.getExamResults(examId);
            const results = res.results || [];

            const modalHtml = `
                <div class="glass-card" style="width: 100%; max-width: 650px; padding: 28px; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="font-size: 20px; font-weight: 700;">Exam Score Results (${results.length})</h3>
                        <button class="glass-btn glass-btn-sm" onclick="App.closeModal()">Close</button>
                    </div>
                    ${!results.length ? '<p style="color: var(--text-muted);">No students have completed this exam yet.</p>' : `
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${results.map(r => {
                                const pct = Math.round((r.score / r.total_points) * 100);
                                return `
                                    <div class="glass-card" style="padding: 14px; display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <strong>${r.student_name}</strong>
                                            <div style="font-size: 12px; color: var(--text-muted);">Completed: ${new Date(r.submitted_at).toLocaleString()}</div>
                                        </div>
                                        <div style="text-align: right;">
                                            <span style="font-size: 18px; font-weight: 800; color: var(--accent-primary);">${r.score} / ${r.total_points}</span>
                                            <span class="glass-badge glass-badge-accent" style="margin-left: 8px;">${pct}%</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            `;
            App.showModal(modalHtml);
        } catch (err) {
            App.toast('Error fetching exam results: ' + err.message, 'danger');
        }
    },

    // 5. Real-Time Class Chat Interface
    async renderChat(container) {
        const groupsRes = await API.getChatGroups();
        const groups = groupsRes.groups || [];

        if (!groups.length) {
            container.innerHTML = `<div class="glass-card" style="text-align: center; padding: 40px; color: var(--text-muted);">No chat groups assigned.</div>`;
            return;
        }

        const activeGroup = groups[0];
        const msgRes = await API.getChatMessages(activeGroup.id);
        const messages = msgRes.messages || [];

        container.innerHTML = `
            <div class="glass-card" style="display: grid; grid-template-columns: 240px 1fr; gap: 20px; height: 550px; padding: 0; overflow: hidden;">
                <!-- Group List -->
                <div style="border-right: 1px solid var(--border-color); padding: 16px; background: rgba(0,0,0,0.02);">
                    <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px;">Class Channels</div>
                    ${groups.map(g => `
                        <div class="glass-card interactive ${g.id === activeGroup.id ? 'glass-badge-accent' : ''}" style="padding: 10px 14px; margin-bottom: 8px;">
                            <strong style="font-size: 14px;">💬 ${g.name}</strong>
                        </div>
                    `).join('')}
                </div>

                <!-- Chat Room -->
                <div style="display: flex; flex-direction: column; height: 100%;">
                    <div class="chat-header" style="padding: 14px 20px; border-bottom: 1px solid var(--border-color); font-weight: 700;">💬 ${activeGroup.name}</div>
                    <div id="teacher-chat-messages" class="chat-messages-list" style="flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                        ${messages.map(m => `
                            <div class="chat-bubble ${m.sender_id == App.currentUser.id ? 'mine' : 'other'}">
                                <div style="font-size: 11px; font-weight: 700; opacity: 0.8; margin-bottom: 2px;">${m.sender_name} (${m.sender_role})</div>
                                <div>${m.content}</div>
                            </div>
                        `).join('')}
                    </div>
                    <form id="teacher-chat-form" style="padding: 12px 16px; border-top: 1px solid var(--border-color); display: flex; gap: 10px;">
                        <input type="text" id="teacher-chat-input" class="glass-input" placeholder="Type a message to the class..." style="flex: 1;" required>
                        <button type="submit" class="glass-btn glass-btn-primary">Send</button>
                    </form>
                </div>
            </div>
        `;

        const msgContainer = container.querySelector('#teacher-chat-messages');
        if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;

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

        container.querySelector('#teacher-chat-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = container.querySelector('#teacher-chat-input');
            const text = input.value;
            if (!text.trim()) return;

            try {
                await SocketManager.sendGroupMessage(activeGroup.id, text.trim());
                input.value = '';
            } catch (err) {
                App.toast('Failed to send message: ' + err.message, 'danger');
            }
        });
    }
};
