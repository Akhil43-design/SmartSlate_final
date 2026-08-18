const AuthView = {
    render(container) {
        container.innerHTML = `
            <div class="auth-container" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%); padding: 20px;">
                <div class="glass-card" style="width: 100%; max-width: 440px; padding: 40px 32px; text-align: center; background: rgba(30, 41, 59, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; box-shadow: 0 12px 40px rgba(0,0,0,0.4);">
                    <div style="margin-bottom: 24px;">
                        <span style="background: #6366F1; color: #FFF; font-weight: 800; padding: 6px 14px; border-radius: 8px; font-size: 13px; letter-spacing: 0.5px;">DIPLOMA & INTERMEDIATE</span>
                        <h1 style="font-size: 24px; font-weight: 800; color: #F8FAFC; margin-top: 12px;">SmartSlate Intermediate OS</h1>
                        <p style="font-size: 14px; color: #94A3B8; margin-top: 4px;">Sign in to your higher secondary / diploma notebook</p>
                    </div>

                    <form id="student-login-form" style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; color: #94A3B8; margin-bottom: 6px;">Email Address</label>
                            <input type="email" id="login-email" class="glass-input" placeholder="student@smartslate.edu.in" required style="width: 100%; padding: 12px 14px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #FFF; outline: none;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; color: #94A3B8; margin-bottom: 6px;">Password</label>
                            <input type="password" id="login-password" class="glass-input" placeholder="••••••••" required style="width: 100%; padding: 12px 14px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #FFF; outline: none;">
                        </div>

                        <button type="submit" class="bouncy-btn" style="width: 100%; padding: 14px; background: #6366F1; border: none; border-radius: 10px; color: #FFF; font-weight: 700; font-size: 15px; cursor: pointer; margin-top: 8px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);">
                            Sign In to Student OS →
                        </button>
                    </form>

                    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 14px; color: #94A3B8;">
                        Don't have an account? 
                        <button id="btn-create-account-direct" style="background: none; border: none; color: #818CF8; font-weight: 700; cursor: pointer; text-decoration: underline;">
                            Register New Student
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    bindEvents(container) {
        const loginForm = container.querySelector('#student-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = container.querySelector('#login-email').value.trim();
                const password = container.querySelector('#login-password').value;

                try {
                    let user = null;
                    if (window.firebaseAuthService) {
                        user = await window.firebaseAuthService.signInUser(email, password);
                    }
                    App.toast(`Welcome back, ${email}!`, 'success');
                    if (typeof App.routeStudentToDashboard === 'function') {
                        App.routeStudentToDashboard();
                    } else {
                        App.navigateTo('student');
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
            <div class="glass-card" style="width: 100%; max-width: 560px; padding: 32px; text-align: left; max-height: 90vh; overflow-y: auto; background: #1E293B; color: #F8FAFC; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <div>
                        <h2 style="font-size: 22px; font-weight: 800; color: #F8FAFC;">Intermediate & Diploma Registration</h2>
                        <p style="font-size: 13px; color: #94A3B8;">Create your SmartSlate higher secondary student profile</p>
                    </div>
                    <button id="btn-close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #94A3B8;">&times;</button>
                </div>

                <form id="student-register-form" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #94A3B8;">Education Program *</label>
                        <div style="display: flex; gap: 16px;">
                            <label style="font-size: 14px; font-weight: 600; cursor: pointer; color: #F8FAFC;">
                                <input type="radio" name="edu-type" value="Intermediate" checked id="type-inter"> Intermediate (10+2)
                            </label>
                            <label style="font-size: 14px; font-weight: 600; cursor: pointer; color: #F8FAFC;">
                                <input type="radio" name="edu-type" value="Diploma" id="type-diploma"> Diploma (Polytechnic)
                            </label>
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #94A3B8;">Full Student Name *</label>
                        <input type="text" id="reg-name" class="glass-input" placeholder="e.g. Sai Teja Rao" required style="width: 100%; padding: 10px 12px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #FFF;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #94A3B8;">Student ID / Roll No *</label>
                            <input type="text" id="reg-student-id" class="glass-input" placeholder="e.g. INT-2026-01" required style="width: 100%; padding: 10px 12px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #FFF;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #94A3B8;">College / Institution *</label>
                            <input type="text" id="reg-college" class="glass-input" placeholder="College Name" required style="width: 100%; padding: 10px 12px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #FFF;">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div id="group-stream">
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #94A3B8;">Course / Stream *</label>
                            <select id="reg-stream" class="glass-input" style="width: 100%; padding: 10px 12px; background: #0F172A; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #FFF;">
                                <option value="MPC" selected>MPC (Math, Physics, Chem)</option>
                                <option value="BiPC">BiPC (Biology, Physics, Chem)</option>
                                <option value="MEC">MEC (Math, Econ, Commerce)</option>
                                <option value="CEC">CEC (Civics, Econ, Commerce)</option>
                                <option value="Other">Other Stream</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #94A3B8;">Year *</label>
                            <select id="reg-year" class="glass-input" required style="width: 100%; padding: 10px 12px; background: #0F172A; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #FFF;">
                                <option value="1st Year" selected>1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year (Diploma)</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #94A3B8;">Student Email *</label>
                            <input type="email" id="reg-email" class="glass-input" placeholder="student@example.com" required style="width: 100%; padding: 10px 12px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #FFF;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #94A3B8;">Section (Optional)</label>
                            <input type="text" id="reg-section" class="glass-input" value="A" style="width: 100%; padding: 10px 12px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #FFF;">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #94A3B8;">Password *</label>
                            <input type="password" id="reg-password" class="glass-input" placeholder="At least 6 chars" required style="width: 100%; padding: 10px 12px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #FFF;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #94A3B8;">Confirm Password *</label>
                            <input type="password" id="reg-confirm-password" class="glass-input" placeholder="Repeat password" required style="width: 100%; padding: 10px 12px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #FFF;">
                        </div>
                    </div>

                    <button type="submit" class="bouncy-btn" style="padding: 14px; background: #6366F1; border: none; border-radius: 8px; color: #FFF; font-weight: 700; cursor: pointer; margin-top: 10px;">
                        Complete Registration →
                    </button>
                </form>
            </div>
        `;

        App.showModal(modalHtml);

        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            const closeBtn = modalContainer.querySelector('#btn-close-modal');
            if (closeBtn) closeBtn.addEventListener('click', () => App.closeModal());

            const form = modalContainer.querySelector('#student-register-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const program = modalContainer.querySelector('input[name="edu-type"]:checked').value;
                    const name = modalContainer.querySelector('#reg-name').value.trim();
                    const studentId = modalContainer.querySelector('#reg-student-id').value.trim();
                    const college = modalContainer.querySelector('#reg-college').value.trim();
                    const stream = modalContainer.querySelector('#reg-stream').value;
                    const year = modalContainer.querySelector('#reg-year').value;
                    const email = modalContainer.querySelector('#reg-email').value.trim();
                    const password = modalContainer.querySelector('#reg-password').value;
                    const confirmPassword = modalContainer.querySelector('#reg-confirm-password').value;

                    if (password !== confirmPassword) {
                        return App.toast('Passwords do not match.', 'danger');
                    }

                    try {
                        let firebaseUser = null;
                        if (window.firebaseAuthService) {
                            firebaseUser = await window.firebaseAuthService.registerStudent({
                                email,
                                password,
                                fullName: name,
                                name,
                                studentCode: studentId,
                                classGrade: `${program} (${stream} - ${year})`,
                                educationLevel: program.toLowerCase(),
                                program,
                                stream,
                                year,
                                institution: college
                            });
                        }
                        App.toast(`Registration successful! Welcome ${name}.`, 'success');
                        App.closeModal();
                        if (typeof App.routeStudentToDashboard === 'function') {
                            App.routeStudentToDashboard();
                        } else {
                            App.navigateTo('student');
                        }
                    } catch (err) {
                        console.error('[AuthView] Registration Error:', err);
                        App.toast(err.message || 'Error registering student profile.', 'danger');
                    }
                });
            }
        }
    }
};

window.AuthView = AuthView;
