/* Auth View Component (Login / Signup) */

const AuthView = {
    mode: 'login', // 'login' or 'signup'
    selectedRole: 'student',

    render(container) {
        container.innerHTML = `
            <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
                <div class="glass-card" style="width: 100%; max-width: 480px; padding: 36px; border-radius: var(--radius-lg);">
                    <div style="text-align: center; margin-bottom: 28px;">
                        <div style="width: 56px; height: 56px; background: var(--accent-primary); color: #FFF; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; box-shadow: 0 8px 20px rgba(107, 143, 216, 0.3);">
                            <svg class="icon-svg icon-svg-lg"><use href="#icon-book"/></svg>
                        </div>
                        <h2 style="font-size: 26px; font-weight: 800; color: var(--text-primary);">Welcome to SmartSlate</h2>
                        <p style="color: var(--text-secondary); font-size: 15px; margin-top: 4px;">Digital Learning Operating System</p>
                    </div>

                    <!-- Mode Toggle -->
                    <div style="display: flex; background: rgba(0, 0, 0, 0.04); padding: 4px; border-radius: var(--radius-sm); margin-bottom: 24px;">
                        <button id="btn-toggle-login" class="tab-btn ${this.mode === 'login' ? 'active' : ''}" style="flex: 1;">Log In</button>
                        <button id="btn-toggle-signup" class="tab-btn ${this.mode === 'signup' ? 'active' : ''}" style="flex: 1;">Create Account</button>
                    </div>

                    <!-- Demo Quick Fill Buttons -->
                    <div style="margin-bottom: 20px; padding: 12px; background: var(--accent-light); border-radius: var(--radius-sm); border: 1px solid rgba(107, 143, 216, 0.2);">
                        <div style="font-size: 13px; font-weight: 700; color: var(--accent-primary); margin-bottom: 8px; text-transform: uppercase;">Quick Demo Fill:</div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button id="demo-student-btn" class="glass-btn glass-btn-sm" style="flex: 1; font-size: 13px;">👨‍🎓 Student</button>
                            <button id="demo-teacher-btn" class="glass-btn glass-btn-sm" style="flex: 1; font-size: 13px;">👩‍🏫 Teacher</button>
                            <button id="demo-parent-btn" class="glass-btn glass-btn-sm" style="flex: 1; font-size: 13px;">👨‍👩‍👦 Parent</button>
                        </div>
                    </div>

                    <!-- Form -->
                    <form id="auth-form" style="display: flex; flex-direction: column; gap: 16px;">
                        <div id="signup-fields" style="display: ${this.mode === 'signup' ? 'flex' : 'none'}; flex-direction: column; gap: 16px;">
                            <div>
                                <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Full Name</label>
                                <input type="text" id="auth-name" class="glass-input" placeholder="e.g. Alex Rivera">
                            </div>

                            <div>
                                <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">I am a:</label>
                                <div style="display: flex; gap: 10px;">
                                    <button type="button" class="role-chip-btn ${this.selectedRole === 'student' ? 'active' : ''}" data-role="student" style="flex: 1; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: #FFF; font-weight: 600; cursor: pointer;">Student</button>
                                    <button type="button" class="role-chip-btn ${this.selectedRole === 'teacher' ? 'active' : ''}" data-role="teacher" style="flex: 1; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: #FFF; font-weight: 600; cursor: pointer;">Teacher</button>
                                    <button type="button" class="role-chip-btn ${this.selectedRole === 'parent' ? 'active' : ''}" data-role="parent" style="flex: 1; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: #FFF; font-weight: 600; cursor: pointer;">Parent</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Email Address</label>
                            <input type="email" id="auth-email" class="glass-input" placeholder="student@smartslate.local" required>
                        </div>

                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Password</label>
                            <input type="password" id="auth-password" class="glass-input" placeholder="••••••••" required>
                        </div>

                        <button type="submit" id="auth-submit-btn" class="glass-btn glass-btn-primary" style="margin-top: 8px; padding: 14px; width: 100%;">
                            ${this.mode === 'login' ? 'Log In' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    bindEvents(container) {
        const toggleLogin = container.querySelector('#btn-toggle-login');
        const toggleSignup = container.querySelector('#btn-toggle-signup');
        const signupFields = container.querySelector('#signup-fields');
        const submitBtn = container.querySelector('#auth-submit-btn');

        toggleLogin.addEventListener('click', () => {
            this.mode = 'login';
            toggleLogin.classList.add('active');
            toggleSignup.classList.remove('active');
            signupFields.style.display = 'none';
            submitBtn.textContent = 'Log In';
        });

        toggleSignup.addEventListener('click', () => {
            this.mode = 'signup';
            toggleSignup.classList.add('active');
            toggleLogin.classList.remove('active');
            signupFields.style.display = 'flex';
            submitBtn.textContent = 'Create Account';
        });

        // Role chips
        container.querySelectorAll('.role-chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll('.role-chip-btn').forEach(b => {
                    b.style.borderColor = 'var(--border-color)';
                    b.style.background = '#FFF';
                    b.style.color = 'var(--text-primary)';
                });
                const role = e.currentTarget.dataset.role;
                this.selectedRole = role;
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'var(--accent-light)';
                e.currentTarget.style.color = 'var(--accent-primary)';
            });
        });

        // Demo buttons
        container.querySelector('#demo-student-btn').addEventListener('click', () => {
            container.querySelector('#auth-email').value = 'student@smartslate.local';
            container.querySelector('#auth-password').value = 'password123';
        });
        container.querySelector('#demo-teacher-btn').addEventListener('click', () => {
            container.querySelector('#auth-email').value = 'teacher@smartslate.local';
            container.querySelector('#auth-password').value = 'password123';
        });
        container.querySelector('#demo-parent-btn').addEventListener('click', () => {
            container.querySelector('#auth-email').value = 'parent@smartslate.local';
            container.querySelector('#auth-password').value = 'password123';
        });

        // Form Submit
        const form = container.querySelector('#auth-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = container.querySelector('#auth-email').value;
            const password = container.querySelector('#auth-password').value;

            try {
                if (this.mode === 'login') {
                    const res = await API.login(email, password);
                    API.setToken(res.token);
                    App.currentUser = res.user;
                    App.toast(`Welcome back, ${res.user.name}! 👋`, 'success');
                    App.navigateTo(res.user.role);
                } else {
                    const name = container.querySelector('#auth-name').value;
                    if (!name) throw new Error('Please enter your full name.');
                    const res = await API.signup(name, this.selectedRole, email, password);
                    API.setToken(res.token);
                    App.currentUser = res.user;
                    App.toast(`Account created! Welcome, ${res.user.name}! 🎉`, 'success');
                    App.navigateTo(res.user.role);
                }
            } catch (err) {
                App.toast(err.message || 'Authentication failed. Please check your credentials.', 'danger');
            }
        });
    }
};
