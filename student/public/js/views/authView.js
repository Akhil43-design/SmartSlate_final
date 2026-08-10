/* Student Kiosk PIN Lock Screen & Registration */

const AuthView = {
    enteredPin: '',

    async render(container) {
        this.enteredPin = '';
        this.renderDirectPinScreen(container);
    },

    renderDirectPinScreen(container) {
        container.innerHTML = `
            <div style="min-height: 85vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                
                <div style="text-align: center; margin-bottom: 24px;" class="mascot-anim">
                    <img src="/assets/icons/icon-loading-mascot.svg" style="width: 72px; height: 72px; margin-bottom: 10px;" alt="SmartSlate Mascot">
                    <h1 style="font-size: 32px; font-weight: 800; color: var(--text-primary);">SmartSlate Student Kiosk</h1>
                    <p style="color: var(--text-secondary); font-size: 16px; margin-top: 4px;">Enter your 4-Digit PIN to unlock your notebook</p>
                </div>

                <div class="glass-card" style="padding: 12px 18px; max-width: 480px; width: 100%; margin-bottom: 20px; font-size: 13px; text-align: center; background: rgba(255,255,255,0.6);">
                    <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">🔑 Student Demo PINs:</div>
                    <div style="display: flex; justify-content: center; gap: 16px; color: var(--text-secondary);">
                        <span>👨‍🎓 Alex Rivera: <strong>1111</strong></span>
                        <span>👩‍🎓 Maya Patel: <strong>2222</strong></span>
                    </div>
                </div>

                <div class="glass-card" style="width: 100%; max-width: 420px; padding: 32px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 8px;">🔐</div>
                    <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">Enter PIN</h2>
                    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 20px;">Accounts automatically unlock based on matching PIN</p>

                    <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 24px;">
                        ${[0,1,2,3].map(i => `
                            <div class="pin-dot" style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--accent-primary); background: ${this.enteredPin.length > i ? 'var(--accent-primary)' : 'transparent'}; transition: all 150ms ease;"></div>
                        `).join('')}
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
                        ${[1,2,3,4,5,6,7,8,9].map(num => `
                            <button class="glass-btn keypad-num-btn bouncy-btn" data-val="${num}" style="font-size: 22px; font-weight: 700; padding: 14px; min-height: 54px;">${num}</button>
                        `).join('')}
                        <button class="glass-btn keypad-num-btn bouncy-btn" id="keypad-clear" style="font-size: 13px; font-weight: 600; padding: 14px; min-height: 54px; color: var(--text-muted);">Clear</button>
                        <button class="glass-btn keypad-num-btn bouncy-btn" data-val="0" style="font-size: 22px; font-weight: 700; padding: 14px; min-height: 54px;">0</button>
                        <button class="glass-btn keypad-num-btn bouncy-btn" id="keypad-backspace" style="font-size: 18px; padding: 14px; min-height: 54px;">⌫</button>
                    </div>

                    <form id="direct-pin-form" style="display: flex; gap: 8px; margin-bottom: 20px;">
                        <input type="password" id="pin-password-input" class="glass-input" placeholder="Type 4-digit PIN..." maxlength="6" value="${this.enteredPin}" style="text-align: center; font-size: 16px;">
                        <button type="submit" class="glass-btn glass-btn-primary bouncy-btn">Unlock</button>
                    </form>

                    <div style="border-top: 1px solid rgba(0,0,0,0.08); padding-top: 16px; margin-top: 8px;">
                        <button id="btn-create-account-direct" class="glass-btn glass-btn-secondary bouncy-btn" style="width: 100%; justify-content: center; gap: 8px; padding: 12px;">
                            <img src="/assets/icons/icon-add-account.svg" style="width: 20px; height: 20px;" alt="Add">
                            <span>Register New Student Account</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.querySelectorAll('.keypad-num-btn[data-val]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.enteredPin.length < 6) {
                    this.enteredPin += btn.dataset.val;
                    this.updatePinDots(container);
                    if (this.enteredPin.length >= 4) {
                        this.submitPinLogin(container);
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

        const form = container.querySelector('#direct-pin-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const manual = container.querySelector('#pin-password-input').value;
                if (manual) this.enteredPin = manual;
                this.submitPinLogin(container);
            });
        }

        const createAccBtn = container.querySelector('#btn-create-account-direct');
        if (createAccBtn) {
            createAccBtn.addEventListener('click', () => this.showCreateAccountModal(container));
        }
    },

    updatePinDots(container) {
        const dots = container.querySelectorAll('.pin-dot');
        dots.forEach((dot, idx) => {
            dot.style.background = this.enteredPin.length > idx ? 'var(--accent-primary)' : 'transparent';
        });
        const passInput = container.querySelector('#pin-password-input');
        if (passInput) passInput.value = this.enteredPin;
    },

    async submitPinLogin(container) {
        const pinToSubmit = this.enteredPin;
        if (!pinToSubmit) {
            App.toast('Please enter a 4-digit PIN.', 'warning');
            return;
        }

        try {
            const res = await API.loginByPin(pinToSubmit);
            API.setToken(res.token);
            App.currentUser = res.user;
            App.toast(`Unlocked! Welcome, ${res.user.name}! 🎉`, 'success');
            App.navigateTo('student');
        } catch (err) {
            App.toast(err.message || 'Invalid PIN. No matching student account found.', 'danger');
            this.enteredPin = '';
            this.updatePinDots(container);
        }
    },

    async showCreateAccountModal(container) {
        App.showModal(`
            <div class="modal-card">
                <div class="modal-header">
                    <h3 class="modal-title">New Student Registration</h3>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>

                <form id="modal-create-account-form" style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Student Full Name</label>
                        <input type="text" id="new-user-name" class="glass-input" placeholder="e.g. Alex Rivera" required>
                    </div>

                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Email Address</label>
                        <input type="email" id="new-user-email" class="glass-input" placeholder="alex@smartslate.local" required>
                    </div>

                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Set 4-Digit PIN</label>
                        <input type="password" id="new-user-pin" class="glass-input" placeholder="e.g. 5555" maxlength="6" required>
                        <span style="font-size: 12px; color: var(--text-muted); display: block; margin-top: 4px;">Choose a unique PIN to unlock your tablet.</span>
                    </div>

                    <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; margin-top: 8px;">Register & Unlock</button>
                </form>
            </div>
        `);

        const modal = document.getElementById('modal-container');
        const form = modal.querySelector('#modal-create-account-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = modal.querySelector('#new-user-name').value;
            const email = modal.querySelector('#new-user-email').value;
            const password = modal.querySelector('#new-user-pin').value;

            try {
                const res = await API.signup({ name, email, password });
                API.setToken(res.token);
                App.currentUser = res.user;
                App.closeModal();
                App.toast(`Registered! Welcome, ${name}! 🎉`, 'success');
                App.navigateTo('student');
            } catch (err) {
                App.toast(err.message || 'Error registering student account.', 'danger');
            }
        });
    }
};
