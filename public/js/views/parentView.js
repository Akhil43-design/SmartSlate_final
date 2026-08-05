/* Parent Dashboard View Component */

const ParentView = {
    activeTab: 'children', // 'children', 'progress', 'web-activity'
    children: [],
    selectedChildId: null,

    async render(container) {
        container.innerHTML = `
            <div class="dashboard-header">
                <div>
                    <h1 class="dashboard-title">Parent Companion Portal</h1>
                    <p class="dashboard-subtitle">Monitor student progress, review attendance, exam scores, and safe web activity</p>
                </div>
                <div>
                    <button id="parent-btn-link-child" class="glass-btn glass-btn-primary">
                        <svg class="icon-svg"><use href="#icon-plus"/></svg>
                        <span>Link Student Code</span>
                    </button>
                </div>
            </div>

            <!-- Children Selector Bar -->
            <div class="glass-card" style="margin-bottom: 20px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: 700; color: var(--text-secondary); font-size: 14px; text-transform: uppercase;">Active Student:</span>
                    <select id="parent-child-select" class="glass-select" style="min-width: 220px; padding: 8px 14px;">
                        <option value="">Loading linked children...</option>
                    </select>
                </div>
                <div id="parent-child-code-chip" style="font-weight: 600; font-size: 14px; color: var(--accent-primary);"></div>
            </div>

            <!-- Tab Bar -->
            <div class="tab-bar">
                <button class="tab-btn ${this.activeTab === 'children' ? 'active' : ''}" data-tab="children">👨‍👩‍👦 Linked Accounts</button>
                <button class="tab-btn ${this.activeTab === 'progress' ? 'active' : ''}" data-tab="progress">📊 Progress & Report Card</button>
                <button class="tab-btn ${this.activeTab === 'web-activity' ? 'active' : ''}" data-tab="web-activity">🛡️ Safe Web Audit Log</button>
            </div>

            <!-- Sub View Container -->
            <div id="parent-tab-content"></div>
        `;

        await this.loadChildren(container);
        this.bindEvents(container);
    },

    async loadChildren(container) {
        try {
            const data = await API.getChildren();
            this.children = data.children || [];

            const select = container.querySelector('#parent-child-select');
            if (!this.children.length) {
                select.innerHTML = `<option value="">No linked children</option>`;
                container.querySelector('#parent-tab-content').innerHTML = `
                    <div class="glass-card" style="text-align: center; padding: 40px;">
                        <h3>No Student Linked Yet</h3>
                        <p style="margin-top: 8px; color: var(--text-muted); max-width: 400px; margin: 8px auto 20px auto;">
                            Enter your child's SmartSlate Student Code (e.g. STU-101) to monitor their academic journey.
                        </p>
                        <button class="glass-btn glass-btn-primary" id="btn-link-first-child">
                            <svg class="icon-svg"><use href="#icon-plus"/></svg>
                            <span>Link Student Account</span>
                        </button>
                    </div>
                `;
                container.querySelector('#btn-link-first-child')?.addEventListener('click', () => this.showLinkChildModal());
                return;
            }

            select.innerHTML = this.children.map(c => `
                <option value="${c.student_id}" ${this.selectedChildId == c.student_id ? 'selected' : ''}>
                    ${c.student_name} (${c.student_code}) — ${c.class_name || 'Unassigned'}
                </option>
            `).join('');

            if (!this.selectedChildId && this.children.length > 0) {
                this.selectedChildId = this.children[0].student_id;
            }

            select.value = this.selectedChildId;
            this.updateChildChip(container);
            await this.renderTabContent(container.querySelector('#parent-tab-content'));
        } catch (err) {
            App.toast('Failed to load linked children: ' + err.message, 'danger');
        }
    },

    updateChildChip(container) {
        const child = this.children.find(c => c.student_id == this.selectedChildId);
        const chip = container.querySelector('#parent-child-code-chip');
        if (child && chip) {
            chip.textContent = `Student Code: ${child.student_code} | Class: ${child.class_name || 'N/A'}`;
        }
    },

    bindEvents(container) {
        const select = container.querySelector('#parent-child-select');
        if (select) {
            select.addEventListener('change', async (e) => {
                this.selectedChildId = e.target.value;
                this.updateChildChip(container);
                await this.renderTabContent(container.querySelector('#parent-tab-content'));
            });
        }

        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.activeTab = tab;
                container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.renderTabContent(container.querySelector('#parent-tab-content'));
            });
        });

        const linkBtn = container.querySelector('#parent-btn-link-child');
        if (linkBtn) {
            linkBtn.addEventListener('click', () => this.showLinkChildModal());
        }
    },

    async renderTabContent(contentArea) {
        contentArea.innerHTML = `<div style="text-align: center; padding: 40px;"><div class="spinner" style="margin: 0 auto;"></div></div>`;

        try {
            switch (this.activeTab) {
                case 'children':
                    await this.renderChildrenList(contentArea);
                    break;
                case 'progress':
                    await this.renderProgressCard(contentArea);
                    break;
                case 'web-activity':
                    await this.renderWebActivity(contentArea);
                    break;
            }
        } catch (err) {
            contentArea.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 40px; color: var(--danger-color);">
                    <p>Error loading content: ${err.message}</p>
                </div>
            `;
        }
    },

    // 1. Children List
    async renderChildrenList(container) {
        if (!this.children.length) return;

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
                ${this.children.map(c => `
                    <div class="glass-card interactive ${this.selectedChildId == c.student_id ? 'glass-badge-accent' : ''}" style="padding: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                            <div>
                                <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${c.student_name}</h3>
                                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">Code: <strong style="color: var(--accent-primary);">${c.student_code}</strong></p>
                            </div>
                            <span class="glass-badge glass-badge-success">${c.status}</span>
                        </div>
                        <div style="font-size: 13px; color: var(--text-muted); margin-top: 10px;">
                            Class: <strong>${c.class_name || 'Unassigned'}</strong>
                        </div>
                        <button class="glass-btn glass-btn-secondary glass-btn-sm select-child-btn" data-id="${c.student_id}" style="margin-top: 16px; width: 100%;">
                            View Student Report Card
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        container.querySelectorAll('.select-child-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedChildId = e.currentTarget.dataset.id;
                this.activeTab = 'progress';
                const parentTabContent = document.querySelector('#parent-tab-content');
                document.querySelectorAll('.tab-bar .tab-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.tab === 'progress');
                });
                this.renderTabContent(parentTabContent);
            });
        });
    },

    // 2. Progress & Comprehensive Report Card
    async renderProgressCard(container) {
        if (!this.selectedChildId) return;

        const res = await API.getProgressCard(this.selectedChildId);
        const card = res.progressCard;

        if (!card) {
            container.innerHTML = `<div class="glass-card" style="padding: 30px; text-align: center;">No progress data available.</div>`;
            return;
        }

        container.innerHTML = `
            <div class="glass-card" style="padding: 28px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed var(--border-color); padding-bottom: 16px; margin-bottom: 24px;">
                    <div>
                        <span class="glass-badge glass-badge-accent" style="margin-bottom: 6px;">OFFICIAL REPORT CARD</span>
                        <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">${card.student_name}</h2>
                        <p style="font-size: 14px; color: var(--text-secondary);">Student Code: ${card.student_code} | Class: ${card.class_name}</p>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: var(--text-muted);">
                        Report Generated:<br><strong>${new Date(card.generated_at).toLocaleDateString()}</strong>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    <div class="glass-card" style="text-align: center; background: rgba(107, 143, 216, 0.08);">
                        <div style="font-size: 12px; font-weight: 700; color: var(--accent-primary); text-transform: uppercase;">Attendance Rate</div>
                        <div style="font-size: 32px; font-weight: 800; color: var(--text-primary); margin: 8px 0;">${card.attendance.percentage}%</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${card.attendance.present_days} present / ${card.attendance.total_days} total days</div>
                    </div>

                    <div class="glass-card" style="text-align: center; background: rgba(72, 187, 120, 0.08);">
                        <div style="font-size: 12px; font-weight: 700; color: var(--success-color); text-transform: uppercase;">Exam Average</div>
                        <div style="font-size: 32px; font-weight: 800; color: var(--text-primary); margin: 8px 0;">${card.exams.average_score}%</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${card.exams.total_taken} exams completed</div>
                    </div>

                    <div class="glass-card" style="text-align: center; background: rgba(246, 173, 85, 0.08);">
                        <div style="font-size: 12px; font-weight: 700; color: #D69E2E; text-transform: uppercase;">Assignments Completed</div>
                        <div style="font-size: 32px; font-weight: 800; color: var(--text-primary); margin: 8px 0;">${card.assignments.completion_rate}%</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${card.assignments.submitted} of ${card.assignments.total} submitted</div>
                    </div>

                    <div class="glass-card" style="text-align: center; background: rgba(159, 122, 234, 0.08);">
                        <div style="font-size: 12px; font-weight: 700; color: #805AD5; text-transform: uppercase;">Digital Notebooks</div>
                        <div style="font-size: 32px; font-weight: 800; color: var(--text-primary); margin: 8px 0;">${card.notebooks.total_notes_created}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">notes created</div>
                    </div>
                </div>
            </div>
        `;
    },

    // 3. Web Activity Log
    async renderWebActivity(container) {
        if (!this.selectedChildId) return;

        const res = await API.getChildWebActivity(this.selectedChildId);
        const activity = res.activity || [];

        if (!activity.length) {
            container.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <p>No web search activity recorded for this student yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="glass-card" style="padding: 24px;">
                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">Safe Web Search Audit Log</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${activity.map(a => `
                        <div class="glass-card" style="padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-weight: 600; color: var(--text-primary); font-size: 15px;">"${a.query}"</span>
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted);">
                                ${new Date(a.timestamp).toLocaleString()}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Modal to link child via student code
    showLinkChildModal() {
        const modalHtml = `
            <div class="glass-card" style="width: 100%; max-width: 440px; padding: 28px;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">Link Student Account</h3>
                <form id="form-link-child" style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Student Pairing Code</label>
                        <input type="text" id="input-student-code" class="glass-input" placeholder="e.g. STU-101" style="text-transform: uppercase;" required>
                        <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
                            You can find this code on your child's SmartSlate student dashboard or settings page.
                        </p>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                        <button type="button" class="glass-btn" onclick="App.closeModal()">Cancel</button>
                        <button type="submit" class="glass-btn glass-btn-primary">Link Child</button>
                    </div>
                </form>
            </div>
        `;

        App.showModal(modalHtml);

        document.getElementById('form-link-child').addEventListener('submit', async (e) => {
            e.preventDefault();
            const studentCode = document.getElementById('input-student-code').value;

            try {
                const res = await API.linkChild(studentCode);
                App.toast(res.message, 'success');
                App.closeModal();
                await this.loadChildren(document.querySelector('#view-parent'));
            } catch (err) {
                App.toast('Failed to link student: ' + err.message, 'danger');
            }
        });
    }
};
