/* Student Authentication & 4-Category Registration View */

const AuthView = {
    loginMode: 'standard', // 'standard' (Email) or 'below5' (Student ID)

    async render(container) {
        this.loginMode = 'standard';
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

                <div class="glass-card" style="width: 100%; max-width: 460px; padding: 32px; text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 8px;">🎓</div>
                    <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 16px;">Student Sign In</h2>

                    <!-- Login Mode Switcher -->
                    <div style="display: flex; background: rgba(0,0,0,0.05); border-radius: 12px; padding: 4px; margin-bottom: 20px;">
                        <button id="tab-login-email" class="glass-btn ${this.loginMode === 'standard' ? 'glass-btn-primary' : ''}" style="flex: 1; padding: 8px; font-size: 13px; border-radius: 10px;">
                            ✉️ Email Login
                        </button>
                        <button id="tab-login-below5" class="glass-btn ${this.loginMode === 'below5' ? 'glass-btn-primary' : ''}" style="flex: 1; padding: 8px; font-size: 13px; border-radius: 10px;">
                            🧒 Below 5 Login (ID)
                        </button>
                    </div>

                    <!-- Email Login Form -->
                    <form id="student-email-login-form" style="display: ${this.loginMode === 'standard' ? 'flex' : 'none'}; flex-direction: column; gap: 16px; text-align: left;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-primary);">Email Address *</label>
                            <input type="email" id="login-email" class="glass-input" placeholder="e.g. student@smartslate.edu" required style="padding: 12px 14px; font-size: 14px;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-primary);">Password *</label>
                            <input type="password" id="login-password" class="glass-input" placeholder="Enter your password" required style="padding: 12px 14px; font-size: 14px;">
                        </div>

                        <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; font-size: 16px; font-weight: 700; width: 100%; justify-content: center; margin-top: 8px;">
                            Sign In
                        </button>
                    </form>

                    <!-- Below 5 Student ID Login Form -->
                    <form id="student-below5-login-form" style="display: ${this.loginMode === 'below5' ? 'flex' : 'none'}; flex-direction: column; gap: 16px; text-align: left;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-primary);">Student ID / Username *</label>
                            <input type="text" id="login-studentid" class="glass-input" placeholder="e.g. STU-101 or kavya" required style="padding: 12px 14px; font-size: 14px;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-primary);">Password *</label>
                            <input type="password" id="login-below5-password" class="glass-input" placeholder="Enter password" required style="padding: 12px 14px; font-size: 14px;">
                        </div>

                        <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; font-size: 16px; font-weight: 700; width: 100%; justify-content: center; margin-top: 8px;">
                            Unlock Notebook
                        </button>
                    </form>

                    <div style="border-top: 1px solid rgba(0,0,0,0.08); padding-top: 20px; margin-top: 24px; text-align: center;">
                        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">Don't have an account?</p>
                        <button id="btn-create-account-direct" class="glass-btn glass-btn-secondary bouncy-btn" style="width: 100%; justify-content: center; gap: 8px; padding: 12px;">
                            <img src="/assets/icons/icon-add-account.svg" style="width: 20px; height: 20px;" alt="Add">
                            <span>Register New Account</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Mode Switching
        const tabEmail = container.querySelector('#tab-login-email');
        const tabBelow5 = container.querySelector('#tab-login-below5');

        tabEmail.addEventListener('click', () => {
            this.loginMode = 'standard';
            this.renderLoginScreen(container);
        });

        tabBelow5.addEventListener('click', () => {
            this.loginMode = 'below5';
            this.renderLoginScreen(container);
        });

        // Email Form Submit
        const emailForm = container.querySelector('#student-email-login-form');
        if (emailForm) {
            emailForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = container.querySelector('#login-email').value.trim();
                const password = container.querySelector('#login-password').value;
                await this.handleLoginSubmit(email, password);
            });
        }

        // Below 5 Form Submit
        const below5Form = container.querySelector('#student-below5-login-form');
        if (below5Form) {
            below5Form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const studentId = container.querySelector('#login-studentid').value.trim();
                const password = container.querySelector('#login-below5-password').value;
                const internalEmail = `${studentId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@smartslate.local`;
                await this.handleLoginSubmit(internalEmail, password);
            });
        }

        const createAccBtn = container.querySelector('#btn-create-account-direct');
        if (createAccBtn) {
            createAccBtn.addEventListener('click', () => this.showCreateAccountModal(container));
        }
    },

    async handleLoginSubmit(email, password) {
        if (!email || !password) {
            App.toast('Please enter credentials.', 'warning');
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
                    class: '5',
                    educationLevel: 'primary'
                };
            } else {
                App.currentUser = { email, name: email.split('@')[0], class: '5', educationLevel: 'primary' };
            }

            App.toast(`Welcome back, ${App.currentUser.name}! 🎉`, 'success');
            App.routeStudentToDashboard();
        } catch (err) {
            console.error('[AuthView] Sign-in Error:', err);
            App.toast(err.message || 'Invalid login credentials.', 'danger');
        }
    },

    async showCreateAccountModal(container) {
        App.showModal(`
            <div class="modal-card" style="max-width: 640px; width: 95%; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3 class="modal-title">👨‍🎓 Student Account Registration</h3>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>

                <form id="modal-create-account-form" style="display: flex; flex-direction: column; gap: 16px; padding-top: 10px;">
                    
                    <!-- Step 1: Category Selection -->
                    <div style="font-weight: 700; color: var(--accent-primary); border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 4px; font-size: 14px;">
                        1. Select Education Category *
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <label class="category-radio-card" style="display: flex; align-items: center; gap: 10px; padding: 12px; border: 2px solid var(--border-color); border-radius: 12px; cursor: pointer;">
                            <input type="radio" name="student-category" value="primary" checked>
                            <div>
                                <div style="font-weight: 700; font-size: 14px;">🧒 Below 5</div>
                                <div style="font-size: 11px; color: var(--text-secondary);">Class 1–5 (Primary)</div>
                            </div>
                        </label>

                        <label class="category-radio-card" style="display: flex; align-items: center; gap: 10px; padding: 12px; border: 2px solid var(--border-color); border-radius: 12px; cursor: pointer;">
                            <input type="radio" name="student-category" value="secondary">
                            <div>
                                <div style="font-weight: 700; font-size: 14px;">👦 Class 6–10</div>
                                <div style="font-size: 11px; color: var(--text-secondary);">Class 6–10 (Secondary)</div>
                            </div>
                        </label>

                        <label class="category-radio-card" style="display: flex; align-items: center; gap: 10px; padding: 12px; border: 2px solid var(--border-color); border-radius: 12px; cursor: pointer;">
                            <input type="radio" name="student-category" value="intermediate_diploma">
                            <div>
                                <div style="font-weight: 700; font-size: 14px;">🎓 Inter / Diploma</div>
                                <div style="font-size: 11px; color: var(--text-secondary);">Intermediate / Diploma</div>
                            </div>
                        </label>

                        <label class="category-radio-card" style="display: flex; align-items: center; gap: 10px; padding: 12px; border: 2px solid var(--border-color); border-radius: 12px; cursor: pointer;">
                            <input type="radio" name="student-category" value="btech">
                            <div>
                                <div style="font-weight: 700; font-size: 14px;">🏛️ B.Tech / Higher</div>
                                <div style="font-size: 11px; color: var(--text-secondary);">Engineering & Degree</div>
                            </div>
                        </label>
                    </div>

                    <!-- Step 2: Student Identity Fields -->
                    <div style="font-weight: 700; color: var(--accent-primary); border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 4px; font-size: 14px; margin-top: 6px;">
                        2. Student Details
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Full Name *</label>
                            <input type="text" id="reg-name" class="glass-input" placeholder="e.g. Rahul Kumar" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Student ID / Roll No *</label>
                            <input type="text" id="reg-studentid" class="glass-input" placeholder="e.g. STU-101" required>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div id="group-email">
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Email Address <span id="email-required-tag">*</span></label>
                            <input type="email" id="reg-email" class="glass-input" placeholder="student@smartslate.edu">
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Password *</label>
                            <input type="password" id="reg-password" class="glass-input" placeholder="Min 6 characters" required minlength="6">
                        </div>
                    </div>

                    <!-- Academic Specific Fields -->
                    <div style="font-weight: 700; color: var(--accent-primary); border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 4px; font-size: 14px; margin-top: 6px;">
                        3. Class & Academic Details
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Class / Year / Course *</label>
                            <input type="text" id="reg-class" class="glass-input" placeholder="e.g. 5th Class" value="5th Class" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Section</label>
                            <input type="text" id="reg-section" class="glass-input" placeholder="e.g. A" value="A">
                        </div>
                    </div>

                    <!-- Category-Specific College/Branch Group (Hidden for Below 5 & 6-10) -->
                    <div id="group-higher-ed" style="display: none; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Branch / Department</label>
                            <input type="text" id="reg-branch" class="glass-input" placeholder="e.g. CSE / ECE / MPC">
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px;">College / Institution</label>
                            <input type="text" id="reg-college" class="glass-input" placeholder="e.g. JNTU / Govt College">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Assigned Teacher</label>
                            <select id="reg-teacher" class="glass-input" style="padding: 10px;">
                                <option value="TCH-101">Ravi Kumar (Physical Science)</option>
                                <option value="TCH-102">Lakshmi Devi (Mathematics)</option>
                                <option value="TCH-103">Venkatesh Rao (English)</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Parent Name *</label>
                            <input type="text" id="reg-parent-name" class="glass-input" placeholder="e.g. Suresh Kumar" required>
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Parent Contact (Phone / Email) *</label>
                        <input type="text" id="reg-parent-contact" class="glass-input" placeholder="e.g. +91 98765 43210" required>
                    </div>

                    <button type="submit" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px; margin-top: 12px; font-weight: 700;">Complete Registration & Launch Portal</button>
                </form>
            </div>
        `);

        const modal = document.getElementById('modal-container');
        const form = modal.querySelector('#modal-create-account-form');
        const higherEdGroup = modal.querySelector('#group-higher-ed');
        const emailRequiredTag = modal.querySelector('#email-required-tag');

        // Dynamic Field Visibility
        modal.querySelectorAll('input[name="student-category"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const cat = e.target.value;
                if (cat === 'primary') {
                    higherEdGroup.style.display = 'none';
                    if (emailRequiredTag) emailRequiredTag.style.display = 'none';
                } else if (cat === 'secondary') {
                    higherEdGroup.style.display = 'none';
                    if (emailRequiredTag) emailRequiredTag.style.display = 'inline';
                } else {
                    higherEdGroup.style.display = 'grid';
                    if (emailRequiredTag) emailRequiredTag.style.display = 'inline';
                }
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const category = modal.querySelector('input[name="student-category"]:checked').value;
            const fullName = modal.querySelector('#reg-name').value.trim();
            const studentId = modal.querySelector('#reg-studentid').value.trim();
            let email = modal.querySelector('#reg-email').value.trim();
            const password = modal.querySelector('#reg-password').value;
            const className = modal.querySelector('#reg-class').value.trim();
            const section = modal.querySelector('#reg-section').value.trim();
            const branch = modal.querySelector('#reg-branch').value.trim();
            const college = modal.querySelector('#reg-college').value.trim();
            const classTeacherId = modal.querySelector('#reg-teacher').value;
            const parentName = modal.querySelector('#reg-parent-name').value.trim();
            const parentContact = modal.querySelector('#reg-parent-contact').value.trim();

            if (category === 'primary' && !email) {
                const cleanId = studentId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'stu';
                email = `${cleanId}@smartslate.local`;
            }

            if (!email) {
                App.toast('Please enter a valid email address.', 'warning');
                return;
            }

            try {
                App.currentUser = null;

                let fbRes = null;
                if (window.firebaseAuthService) {
                    fbRes = await window.firebaseAuthService.registerStudent({
                        fullName,
                        studentId,
                        email,
                        password,
                        educationLevel: category,
                        className,
                        section,
                        branch,
                        college,
                        classTeacherId,
                        parentName,
                        parentEmail: parentContact.includes('@') ? parentContact : '',
                        parentPhone: !parentContact.includes('@') ? parentContact : ''
                    });
                }

                if (window.firebaseAuthService && fbRes?.uid) {
                    const freshProfile = await window.firebaseAuthService.getStudentProfileByUid(fbRes.uid);
                    App.currentUser = freshProfile || {
                        uid: fbRes.uid,
                        studentId: fbRes.studentId || studentId,
                        name: fullName,
                        email,
                        class: className,
                        educationLevel: category
                    };
                } else {
                    App.currentUser = {
                        uid: fbRes?.uid || 'temp_uid',
                        studentId: fbRes?.studentId || studentId,
                        name: fullName,
                        email,
                        class: className,
                        educationLevel: category
                    };
                }

                App.closeModal();
                App.toast(`Registered! Welcome to SmartSlate, ${fullName}! 🎉`, 'success');
                App.routeStudentToDashboard();
            } catch (err) {
                console.error('[AuthView] Student Registration Error:', err);
                App.toast(err.message || 'Error registering student account.', 'danger');
            }
        });
    }
};
