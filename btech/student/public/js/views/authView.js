/* Student Authentication & Registration */

const AuthView = {
    async render(container) {
        this.renderLoginScreen(container);
    },

    renderLoginScreen(container) {
        container.innerHTML = `
            <div style="min-height: 85vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                
                <div style="text-align: center; margin-bottom: 24px;" class="mascot-anim">
                    <img src="/assets/icons/icon-loading-mascot.svg" style="width: 72px; height: 72px; margin-bottom: 10px;" alt="SmartSlate Mascot">
                    <h1 style="font-size: 32px; font-weight: 800; color: var(--text-primary);">SmartSlate Student Portal</h1>
                    <p style="color: var(--text-secondary); font-size: 16px; margin-top: 4px;">Sign in to access your digital learning notebook</p>
                </div>

                <div class="glass-card" style="width: 100%; max-width: 440px; padding: 32px; text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 8px;">🎓</div>
                    <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 20px;">Student Sign In</h2>

                    <form id="student-email-login-form" style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-primary);">Email Address *</label>
                            <input type="email" id="login-email" class="glass-input" placeholder="e.g. alex@smartslate.edu" required style="padding: 12px 14px; font-size: 14px;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-primary);">Password *</label>
                            <input type="password" id="login-password" class="glass-input" placeholder="Enter your password" required style="padding: 12px 14px; font-size: 14px;">
                        </div>

                        <button type="submit" id="btn-login-submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; font-size: 16px; font-weight: 700; width: 100%; justify-content: center; margin-top: 8px;">
                            Sign In
                        </button>
                    </form>

                    <div style="border-top: 1px solid rgba(0,0,0,0.08); padding-top: 20px; margin-top: 24px; text-align: center;">
                        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">Don't have an account?</p>
                        <button id="btn-create-account-direct" class="glass-btn glass-btn-secondary bouncy-btn" style="width: 100%; justify-content: center; gap: 8px; padding: 12px;">
                            <img src="/assets/icons/icon-add-account.svg" style="width: 20px; height: 20px;" alt="Add">
                            <span>Register New Student Account</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const form = container.querySelector('#student-email-login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = container.querySelector('#login-email').value.trim();
                const password = container.querySelector('#login-password').value;

                if (!email || !password) {
                    App.toast('Please enter both Email and Password.', 'warning');
                    return;
                }

                try {
                    App.currentUser = null;
                    if (window.firebaseAuthService) {
                        const user = await window.firebaseAuthService.signInUser(email, password);
                        const profile = await window.firebaseAuthService.getStudentProfileByUid(user.uid);
                        App.currentUser = profile || {
                            uid: user.uid,
                            email: user.email,
                            name: user.displayName || email.split('@')[0],
                            class: '10',
                            educationLevel: 'secondary'
                        };
                    } else {
                        App.currentUser = { email, name: email.split('@')[0], class: '10', educationLevel: 'secondary' };
                    }

                    App.toast(`Welcome back, ${App.currentUser.name}! 🎉`, 'success');
                    App.routeStudentToDashboard();
                } catch (err) {
                    console.error('[AuthView] Sign-in Error:', err);
                    App.toast(err.message || 'Invalid email or password.', 'danger');
                }
            });
        }

        const createAccBtn = container.querySelector('#btn-create-account-direct');
        if (createAccBtn) {
            createAccBtn.addEventListener('click', () => {
                if (typeof this.showCreateAccountModal === 'function') {
                    this.showCreateAccountModal(container);
                }
            });
        }
    }
};
