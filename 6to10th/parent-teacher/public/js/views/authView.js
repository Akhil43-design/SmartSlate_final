/* Parent & Teacher Web Portal Auth View */

const AuthView = {
    render(container) {
        container.innerHTML = `
            <div style="min-height: 85vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue)); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 32px; margin-bottom: 12px; box-shadow: 0 10px 25px rgba(155, 81, 224, 0.3);">
                        👨‍👩‍👧‍🏫
                    </div>
                    <h1 style="font-size: 32px; font-weight: 800; color: var(--text-primary);">SmartSlate Web Portal</h1>
                    <p style="color: var(--text-secondary); font-size: 16px; margin-top: 4px;">Parent & Teacher Dashboard (Vercel Cloud Deployment)</p>
                </div>

                <div class="glass-card" style="padding: 12px 18px; max-width: 480px; width: 100%; margin-bottom: 20px; font-size: 13px; text-align: center; background: rgba(255,255,255,0.7);">
                    <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">🔑 Quick Demo Accounts:</div>
                    <div style="display: flex; flex-direction: column; gap: 4px; color: var(--text-secondary);">
                        <span>👩‍🏫 Teacher (Prof. Sarah Lin): <strong>teacher@smartslate.local</strong> (PIN: <strong>3333</strong>)</span>
                        <span>👨‍👩‍👦 Parent (Robert Rivera): <strong>parent@smartslate.local</strong> (PIN: <strong>4444</strong>)</span>
                    </div>
                </div>

                <div class="glass-card" style="width: 100%; max-width: 440px; padding: 32px;">
                    <div style="display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 24px;">
                        <button id="tab-login" class="tab-btn active" style="flex: 1; text-align: center;">Sign In</button>
                        <button id="tab-signup" class="tab-btn" style="flex: 1; text-align: center;">Create Account</button>
                    </div>

                    <!-- Login Form -->
                    <form id="auth-login-form" style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Email Address</label>
                            <input type="email" id="login-email" class="glass-input" placeholder="e.g. teacher@smartslate.local" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Password / 4-Digit PIN</label>
                            <input type="password" id="login-password" class="glass-input" placeholder="e.g. 3333 or 4444" required>
                        </div>
                        <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; margin-top: 8px;">Sign In to Portal</button>
                    </form>

                    <!-- Signup Form -->
                    <form id="auth-signup-form" style="display: none; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Full Name</label>
                            <input type="text" id="signup-name" class="glass-input" placeholder="e.g. Dr. Jane Smith" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Account Role</label>
                            <select id="signup-role" class="glass-select">
                                <option value="parent">👨‍👩‍👦 Parent Account</option>
                                <option value="teacher">👩‍🏫 Teacher Account</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Email Address</label>
                            <input type="email" id="signup-email" class="glass-input" placeholder="e.g. jane@school.org" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Set Password / PIN</label>
                            <input type="password" id="signup-password" class="glass-input" placeholder="e.g. 8888" required>
                        </div>
                        <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; margin-top: 8px;">Register Account</button>
                    </form>
                </div>
            </div>
        `;

        const tabLogin = container.querySelector('#tab-login');
        const tabSignup = container.querySelector('#tab-signup');
        const loginForm = container.querySelector('#auth-login-form');
        const signupForm = container.querySelector('#auth-signup-form');

        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            loginForm.style.display = 'flex';
            signupForm.style.display = 'none';
        });

        tabSignup.addEventListener('click', () => {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            signupForm.style.display = 'flex';
            loginForm.style.display = 'none';
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = container.querySelector('#login-email').value;
            const password = container.querySelector('#login-password').value;

            try {
                const res = await API.login(email, password);
                API.setToken(res.token);
                App.currentUser = res.user;
                App.toast(`Welcome back, ${res.user.name}! 🎉`, 'success');
                App.navigateTo(res.user.role);
            } catch (err) {
                App.toast(err.message || 'Invalid credentials.', 'danger');
            }
        });

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = container.querySelector('#signup-name').value;
            const role = container.querySelector('#signup-role').value;
            const email = container.querySelector('#signup-email').value;
            const password = container.querySelector('#signup-password').value;

            try {
                const res = await API.signup(name, role, email, password);
                API.setToken(res.token);
                App.currentUser = res.user;
                App.toast(`Account created! Welcome, ${name}! 🎉`, 'success');
                App.navigateTo(role);
            } catch (err) {
                App.toast(err.message || 'Failed to create account.', 'danger');
            }
        });
    }
};
