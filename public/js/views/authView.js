/* Lock Screen, Account Switcher & PIN-Only Keypad Component */

const AuthView = {
    selectedAccount: null,
    enteredPin: '',
    selectedRole: 'student',
    accountsList: [],

    defaultAccounts: [
        { id: 1, name: 'Alex Rivera', role: 'student', email: 'student@smartslate.local', avatar: '👨‍🎓', color: 'var(--accent-coral)' },
        { id: 2, name: 'Maya Patel', role: 'student', email: 'maya@smartslate.local', avatar: '👩‍🎓', color: 'var(--accent-purple)' },
        { id: 3, name: 'Prof. Sarah Lin', role: 'teacher', email: 'teacher@smartslate.local', avatar: '👩‍🏫', color: 'var(--accent-blue)' },
        { id: 4, name: 'Robert Rivera', role: 'parent', email: 'parent@smartslate.local', avatar: '👨‍👩‍👦', color: 'var(--accent-green)' }
    ],

    async render(container) {
        if (!this.selectedAccount) {
            await this.renderAccountSelector(container);
        } else {
            this.renderPinEntry(container);
        }
    },

    async renderAccountSelector(container) {
        this.selectedAccount = null;
        this.enteredPin = '';

        // Load registered users dynamically from database API on EVERY load
        try {
            const res = await API.get('/api/auth/profiles');
            if (res && res.profiles && res.profiles.length > 0) {
                this.accountsList = res.profiles;
            } else {
                this.accountsList = this.defaultAccounts;
            }
        } catch (err) {
            this.accountsList = this.defaultAccounts;
        }

        container.innerHTML = `
            <div style="min-height: 85vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                <div style="text-align: center; margin-bottom: 32px;" class="mascot-anim">
                    <img src="/assets/icons/icon-loading-mascot.svg" style="width: 72px; height: 72px; margin-bottom: 10px;" alt="SmartSlate Mascot">
                    <h1 style="font-size: 32px; font-weight: 800; color: var(--text-primary);">SmartSlate</h1>
                    <p style="color: var(--text-secondary); font-size: 16px; margin-top: 4px;">Who is using SmartSlate today?</p>
                </div>

                <!-- Account Grid Tiles (Dynamic Registered Profiles) -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; width: 100%; max-width: 800px; margin-bottom: 28px;">
                    ${this.accountsList.map(acc => `
                        <div class="glass-card interactive account-profile-card bouncy-btn" data-email="${acc.email}" style="text-align: center; padding: 24px 16px; border-top: 4px solid ${acc.color || 'var(--accent-primary)'};">
                            <div style="font-size: 48px; margin-bottom: 12px;">${acc.avatar || (acc.role === 'student' ? '👨‍🎓' : acc.role === 'teacher' ? '👩‍🏫' : '👨‍👩‍👦')}</div>
                            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${acc.name}</h3>
                            <span class="glass-badge" style="text-transform: capitalize; font-size: 12px;">${acc.role}</span>
                        </div>
                    `).join('')}

                    <!-- Create New Account Tile -->
                    <div id="card-create-account" class="glass-card interactive bouncy-btn" style="text-align: center; padding: 24px 16px; border: 2px dashed var(--accent-primary); display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.4);">
                        <img src="/assets/icons/icon-add-account.svg" style="width: 42px; height: 42px; margin-bottom: 10px; color: var(--accent-primary);" alt="Add Account">
                        <h3 style="font-size: 16px; font-weight: 700; color: var(--accent-primary);">Create New Account</h3>
                    </div>
                </div>
            </div>
        `;

        // Bind clicks to select account
        container.querySelectorAll('.account-profile-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const email = e.currentTarget.dataset.email;
                this.selectedAccount = this.accountsList.find(a => a.email === email);
                this.enteredPin = '';
                this.renderPinEntry(container);
            });
        });

        const createAccBtn = container.querySelector('#card-create-account');
        if (createAccBtn) {
            createAccBtn.addEventListener('click', () => this.showCreateAccountModal(container));
        }
    },

    renderPinEntry(container) {
        const acc = this.selectedAccount;
        if (!acc) return this.renderAccountSelector(container);

        container.innerHTML = `
            <div style="min-height: 85vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                <button id="btn-back-accounts" class="glass-btn glass-btn-sm bouncy-btn" style="margin-bottom: 24px;">
                    <img src="/assets/icons/icon-back.svg" style="width: 18px; height: 18px;" alt="Back">
                    <span>Switch User</span>
                </button>

                <div class="glass-card" style="width: 100%; max-width: 420px; padding: 32px; text-align: center;">
                    <div style="font-size: 54px; margin-bottom: 8px;">${acc.avatar || '👤'}</div>
                    <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">${acc.name}</h2>
                    <p style="color: var(--text-secondary); font-size: 14px; margin-top: 2px; margin-bottom: 20px;">Enter 4-Digit PIN to unlock</p>

                    <!-- PIN Dots Display -->
                    <div style="display: flex; justify-content: center; gap: 14px; margin-bottom: 24px;">
                        ${[0,1,2,3].map(i => `
                            <div class="pin-dot" style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--accent-primary); background: ${this.enteredPin.length > i ? 'var(--accent-primary)' : 'transparent'}; transition: all 150ms ease;"></div>
                        `).join('')}
                    </div>

                    <!-- Numeric Keypad (Touch friendly) -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
                        ${[1,2,3,4,5,6,7,8,9].map(num => `
                            <button class="glass-btn keypad-num-btn bouncy-btn" data-val="${num}" style="font-size: 22px; font-weight: 700; padding: 14px; min-height: 54px;">${num}</button>
                        `).join('')}
                        <button class="glass-btn keypad-num-btn bouncy-btn" id="keypad-clear" style="font-size: 14px; font-weight: 600; padding: 14px; min-height: 54px; color: var(--text-muted);">Clear</button>
                        <button class="glass-btn keypad-num-btn bouncy-btn" data-val="0" style="font-size: 22px; font-weight: 700; padding: 14px; min-height: 54px;">0</button>
                        <button class="glass-btn keypad-num-btn bouncy-btn" id="keypad-backspace" style="font-size: 18px; padding: 14px; min-height: 54px;">⌫</button>
                    </div>

                    <!-- Direct Text PIN Fallback -->
                    <form id="pin-form" style="display: flex; gap: 8px;">
                        <input type="password" id="pin-password-input" class="glass-input" placeholder="Type 4-digit PIN..." maxlength="6" value="${this.enteredPin}" style="text-align: center;">
                        <button type="submit" class="glass-btn glass-btn-primary bouncy-btn">Unlock</button>
                    </form>
                </div>
            </div>
        `;

        container.querySelector('#btn-back-accounts').addEventListener('click', () => {
            this.selectedAccount = null;
            this.renderAccountSelector(container);
        });

        // Keypad buttons
        container.querySelectorAll('.keypad-num-btn[data-val]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.enteredPin.length < 6) {
                    this.enteredPin += btn.dataset.val;
                    this.updatePinDots(container);
                    if (this.enteredPin.length >= 4) {
                        this.submitLogin(container);
                    }
                }
            });
        });

        const clearBtn = container.querySelector('#keypad-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.enteredPin = '';
                this.updatePinDots(container);
            });
        }

        const backspaceBtn = container.querySelector('#keypad-backspace');
        if (backspaceBtn) {
            backspaceBtn.addEventListener('click', () => {
                this.enteredPin = this.enteredPin.slice(0, -1);
                this.updatePinDots(container);
            });
        }

        const form = container.querySelector('#pin-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const manual = container.querySelector('#pin-password-input').value;
            if (manual) this.enteredPin = manual;
            this.submitLogin(container);
        });
    },

    updatePinDots(container) {
        const dots = container.querySelectorAll('.pin-dot');
        dots.forEach((dot, idx) => {
            dot.style.background = this.enteredPin.length > idx ? 'var(--accent-primary)' : 'transparent';
        });
        const passInput = container.querySelector('#pin-password-input');
        if (passInput) passInput.value = this.enteredPin;
    },

    async submitLogin(container) {
        const email = this.selectedAccount.email;
        const pin = this.enteredPin || '1234';

        try {
            const res = await API.login(email, pin);
            API.setToken(res.token);
            App.currentUser = res.user;
            App.toast(`Unlocked! Welcome, ${res.user.name}! 🎉`, 'success');
            App.navigateTo(res.user.role);
        } catch (err) {
            App.toast(err.message || 'Incorrect PIN. Try again (Demo PIN: 1234).', 'danger');
            this.enteredPin = '';
            this.updatePinDots(container);
        }
    },

    async showCreateAccountModal(container) {
        // Fetch classes/teachers for student assignment
        let classes = [];
        try {
            const cRes = await API.get('/api/classes');
            classes = cRes.classes || [];
        } catch (e) {
            classes = [{ id: 1, name: 'Grade 5 Alpha (Prof. Sarah Lin)' }];
        }

        App.showModal(`
            <div class="modal-card">
                <div class="modal-header">
                    <h3 class="modal-title">Create New Account</h3>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>

                <form id="modal-create-account-form" style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Full Name</label>
                        <input type="text" id="new-user-name" class="glass-input" placeholder="e.g. Charlie Brown" required>
                    </div>

                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">I am a:</label>
                        <div style="display: flex; gap: 10px;">
                            <button type="button" class="glass-btn modal-role-btn active" data-role="student" style="flex: 1;">👨‍🎓 Student</button>
                            <button type="button" class="glass-btn modal-role-btn" data-role="teacher" style="flex: 1;">👩‍🏫 Teacher</button>
                            <button type="button" class="glass-btn modal-role-btn" data-role="parent" style="flex: 1;">👨‍👩‍👦 Parent</button>
                        </div>
                    </div>

                    <!-- Teacher / Class Dropdown Selector for Students -->
                    <div id="teacher-select-group">
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Select Assigned Teacher / Class</label>
                        <select id="new-user-class-id" class="glass-select">
                            ${classes.map(c => `<option value="${c.id}">${c.name} (Teacher: ${c.teacher_name || 'Prof. Sarah Lin'})</option>`).join('')}
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Email Address</label>
                        <input type="email" id="new-user-email" class="glass-input" placeholder="charlie@smartslate.local" required>
                    </div>

                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Set 4-Digit PIN</label>
                        <input type="password" id="new-user-pin" class="glass-input" placeholder="e.g. 1234" maxlength="6" required>
                    </div>

                    <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; margin-top: 8px;">Create Account & Add Tile</button>
                </form>
            </div>
        `);

        let selectedModalRole = 'student';
        const modal = document.getElementById('modal-container');
        const teacherGroup = modal.querySelector('#teacher-select-group');

        modal.querySelectorAll('.modal-role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                modal.querySelectorAll('.modal-role-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                selectedModalRole = e.currentTarget.dataset.role;
                if (teacherGroup) {
                    teacherGroup.style.display = selectedModalRole === 'student' ? 'block' : 'none';
                }
            });
        });

        const form = modal.querySelector('#modal-create-account-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = modal.querySelector('#new-user-name').value;
            const email = modal.querySelector('#new-user-email').value;
            const pin = modal.querySelector('#new-user-pin').value;
            const class_id = modal.querySelector('#new-user-class-id')?.value;

            try {
                const res = await API.signup(name, selectedModalRole, email, pin, class_id);
                App.closeModal();
                App.toast(`Account created for ${name}! Tap your profile card to unlock. 🎉`, 'success');
                // Re-render Lock Screen so new tile appears immediately
                await this.renderAccountSelector(container);
            } catch (err) {
                App.toast(err.message || 'Failed to create account.', 'danger');
            }
        });
    }
};
