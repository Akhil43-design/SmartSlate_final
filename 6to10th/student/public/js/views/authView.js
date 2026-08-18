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
                    if (typeof App.navigateTo === 'function') {
                        App.navigateTo('student');
                    } else if (typeof App.routeStudentToDashboard === 'function') {
                        App.routeStudentToDashboard();
                    }
                } catch (err) {
                    console.error('[AuthView] Sign-in Error:', err);
                    App.toast(err.message || 'Invalid email or password.', 'danger');
                }
            });
        }

        const createAccBtn = container.querySelector('#btn-create-account-direct');
        if (createAccBtn) {
            createAccBtn.addEventListener('click', () => {
                this.showCreateAccountModal(container);
            });
        }
    },

    showCreateAccountModal(container) {
        const modalHtml = `
            <div class="glass-card" style="width: 100%; max-width: 520px; padding: 32px; text-align: left; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <div>
                        <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary);">Student Registration (Class 6–10)</h2>
                        <p style="font-size: 13px; color: var(--text-secondary);">Create your SmartSlate account</p>
                    </div>
                    <button id="btn-close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">&times;</button>
                </div>

                <form id="student-register-form" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px;">Student Name *</label>
                        <input type="text" id="reg-name" class="glass-input" placeholder="Full Student Name" required style="width: 100%; padding: 10px 12px;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px;">Student ID *</label>
                            <input type="text" id="reg-student-id" class="glass-input" placeholder="e.g. STU-601" required style="width: 100%; padding: 10px 12px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px;">Class *</label>
                            <select id="reg-class" class="glass-input" required style="width: 100%; padding: 10px 12px;">
                                <option value="6">Class 6</option>
                                <option value="7">Class 7</option>
                                <option value="8" selected>Class 8</option>
                                <option value="9">Class 9</option>
                                <option value="10">Class 10</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px;">Section *</label>
                            <input type="text" id="reg-section" class="glass-input" value="A" required style="width: 100%; padding: 10px 12px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px;">Student Email *</label>
                            <input type="email" id="reg-email" class="glass-input" placeholder="student@example.com" required style="width: 100%; padding: 10px 12px;">
                        </div>
                    </div>

                    <div style="border-top: 1px solid rgba(0,0,0,0.08); padding-top: 12px; margin-top: 4px;">
                        <h4 style="font-size: 13px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">Parent / Guardian Information</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px;">
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; margin-bottom: 4px;">Parent Name</label>
                                <input type="text" id="reg-parent-name" class="glass-input" placeholder="Parent Name" style="width: 100%; padding: 8px 10px;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; margin-bottom: 4px;">Parent Email</label>
                                <input type="email" id="reg-parent-email" class="glass-input" placeholder="parent@example.com" style="width: 100%; padding: 8px 10px;">
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px;">Password *</label>
                            <input type="password" id="reg-password" class="glass-input" placeholder="At least 6 chars" required style="width: 100%; padding: 10px 12px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px;">Confirm Password *</label>
                            <input type="password" id="reg-confirm-password" class="glass-input" placeholder="Re-enter password" required style="width: 100%; padding: 10px 12px;">
                        </div>
                    </div>

                    <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 12px; font-weight: 700; margin-top: 12px; width: 100%; justify-content: center;">
                        Complete Registration & Sign In
                    </button>
                </form>
            </div>
        `;
        App.showModal(modalHtml);

        const closeBtn = document.getElementById('btn-close-modal');
        if (closeBtn) closeBtn.addEventListener('click', () => App.closeModal());

        const form = document.getElementById('student-register-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-name').value.trim();
                const studentId = document.getElementById('reg-student-id').value.trim();
                const cls = document.getElementById('reg-class').value;
                const section = document.getElementById('reg-section').value.trim() || 'A';
                const email = document.getElementById('reg-email').value.trim();
                const parentName = document.getElementById('reg-parent-name').value.trim();
                const parentEmail = document.getElementById('reg-parent-email').value.trim();
                const password = document.getElementById('reg-password').value;
                const confirmPassword = document.getElementById('reg-confirm-password').value;

                if (password !== confirmPassword) {
                    App.toast('Passwords do not match.', 'danger');
                    return;
                }
                if (password.length < 6) {
                    App.toast('Password must be at least 6 characters.', 'danger');
                    return;
                }

                try {
                    if (window.firebaseAuthService) {
                        const studentData = {
                            studentId,
                            name,
                            email,
                            class: cls,
                            className: `Class ${cls}`,
                            educationLevel: 'secondary',
                            section,
                            parentInfo: { name: parentName, email: parentEmail }
                        };
                        const user = await window.firebaseAuthService.registerStudentProfile(email, password, studentData);
                        const profile = await window.firebaseAuthService.getStudentProfileByUid(user.uid);
                        App.currentUser = profile || { uid: user.uid, ...studentData };
                        if (typeof AcademicData !== 'undefined') {
                            AcademicData.studentProfile = App.currentUser;
                        }
                        App.closeModal();
                        App.toast(`Account registered successfully! Welcome, ${name}!`, 'success');
                        App.navigateTo('student');
                    }
                } catch (err) {
                    console.error('[Registration Error]:', err);
                    if (err.message && (err.message.includes('already') || err.message.includes('email-already-in-use'))) {
                        App.toast('This account already exists. Please log in.', 'warning');
                    } else {
                        App.toast(err.message || 'Registration failed.', 'danger');
                    }
                }
            });
        }
    }
};
