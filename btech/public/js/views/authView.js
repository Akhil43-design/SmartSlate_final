const AuthView = {
    render(container) {
        container.innerHTML = `
            <div class="auth-container" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #090D16 0%, #111827 50%, #090D16 100%); padding: 20px;">
                <div class="glass-card" style="width: 100%; max-width: 440px; padding: 40px 32px; text-align: center; background: rgba(17, 24, 39, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; box-shadow: 0 12px 40px rgba(0,0,0,0.5);">
                    <div style="margin-bottom: 24px;">
                        <span style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: #FFF; font-weight: 800; padding: 6px 14px; border-radius: 8px; font-size: 13px; letter-spacing: 0.5px;">B.TECH & HIGHER ED</span>
                        <h1 style="font-size: 24px; font-weight: 800; color: #F9FAFB; margin-top: 12px;">SmartSlate B.Tech OS</h1>
                        <p style="font-size: 14px; color: #9CA3AF; margin-top: 4px;">Sign in to your engineering digital notebook</p>
                    </div>

                    <form id="student-login-form" style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; color: #9CA3AF; margin-bottom: 6px;">Student Email</label>
                            <input type="email" id="login-email" class="glass-input" placeholder="engineering.student@smartslate.edu.in" required style="width: 100%; padding: 12px 14px; background: rgba(17, 24, 39, 0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #FFF; outline: none;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; color: #9CA3AF; margin-bottom: 6px;">Password</label>
                            <input type="password" id="login-password" class="glass-input" placeholder="••••••••" required style="width: 100%; padding: 12px 14px; background: rgba(17, 24, 39, 0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #FFF; outline: none;">
                        </div>

                        <button type="submit" class="bouncy-btn" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #3B82F6, #8B5CF6); border: none; border-radius: 10px; color: #FFF; font-weight: 700; font-size: 15px; cursor: pointer; margin-top: 8px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">
                            Sign In to Engineering OS →
                        </button>
                    </form>

                    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 14px; color: #9CA3AF;">
                        Don't have an engineering account? 
                        <button id="btn-create-account-direct" style="background: none; border: none; color: #60A5FA; font-weight: 700; cursor: pointer; text-decoration: underline;">
                            Register B.Tech Student
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
                    console.error('[AuthView B.Tech] Sign-in Error:', err);
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
            <div class="glass-card" style="width: 100%; max-width: 580px; padding: 32px; text-align: left; max-height: 90vh; overflow-y: auto; background: #111827; color: #F9FAFB; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <div>
                        <h2 style="font-size: 22px; font-weight: 800; color: #F9FAFB;">B.Tech Engineering Registration</h2>
                        <p style="font-size: 13px; color: #9CA3AF;">Create your SmartSlate engineering student profile</p>
                    </div>
                    <button id="btn-close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #9CA3AF;">&times;</button>
                </div>

                <form id="student-register-form" style="display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #9CA3AF;">Full Student Name *</label>
                        <input type="text" id="reg-name" class="glass-input" placeholder="e.g. Anitha Rao" required style="width: 100%; padding: 10px 12px; background: rgba(17,24,39,0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #FFF;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #9CA3AF;">Roll Number / Student ID *</label>
                            <input type="text" id="reg-roll-no" class="glass-input" placeholder="e.g. 21B91A0501" required style="width: 100%; padding: 10px 12px; background: rgba(17,24,39,0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #FFF;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #9CA3AF;">University / College *</label>
                            <input type="text" id="reg-university" class="glass-input" placeholder="Engineering College Name" required style="width: 100%; padding: 10px 12px; background: rgba(17,24,39,0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #FFF;">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #9CA3AF;">Engineering Branch *</label>
                            <select id="reg-branch" class="glass-input" required style="width: 100%; padding: 10px 12px; background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #FFF;">
                                <option value="CSE" selected>CSE (Computer Science)</option>
                                <option value="CSE-AI">CSE (Artificial Intelligence)</option>
                                <option value="CSE-DS">CSE (Data Science)</option>
                                <option value="ECE">ECE (Electronics & Comm)</option>
                                <option value="EEE">EEE (Electrical & Electronics)</option>
                                <option value="Mechanical">Mechanical Engineering</option>
                                <option value="Civil">Civil Engineering</option>
                                <option value="IT">Information Technology</option>
                                <option value="Other">Other Branch</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #9CA3AF;">Academic Year *</label>
                            <select id="reg-year" class="glass-input" required style="width: 100%; padding: 10px 12px; background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #FFF;">
                                <option value="1st Year">1st Year (Freshman)</option>
                                <option value="2nd Year">2nd Year (Sophomore)</option>
                                <option value="3rd Year" selected>3rd Year (Junior)</option>
                                <option value="4th Year">4th Year (Senior)</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #9CA3AF;">Semester *</label>
                            <select id="reg-semester" class="glass-input" required style="width: 100%; padding: 10px 12px; background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #FFF;">
                                <option value="1-1">Semester 1-1</option>
                                <option value="1-2">Semester 1-2</option>
                                <option value="2-1">Semester 2-1</option>
                                <option value="2-2">Semester 2-2</option>
                                <option value="3-1" selected>Semester 3-1</option>
                                <option value="3-2">Semester 3-2</option>
                                <option value="4-1">Semester 4-1</option>
                                <option value="4-2">Semester 4-2</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #9CA3AF;">Student Email *</label>
                            <input type="email" id="reg-email" class="glass-input" placeholder="anitha@btech.edu.in" required style="width: 100%; padding: 10px 12px; background: rgba(17,24,39,0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #FFF;">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #9CA3AF;">Password *</label>
                            <input type="password" id="reg-password" class="glass-input" placeholder="At least 6 chars" required style="width: 100%; padding: 10px 12px; background: rgba(17,24,39,0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #FFF;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #9CA3AF;">Confirm Password *</label>
                            <input type="password" id="reg-confirm-password" class="glass-input" placeholder="Repeat password" required style="width: 100%; padding: 10px 12px; background: rgba(17,24,39,0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #FFF;">
                        </div>
                    </div>

                    <button type="submit" class="bouncy-btn" style="padding: 14px; background: linear-gradient(135deg, #3B82F6, #8B5CF6); border: none; border-radius: 8px; color: #FFF; font-weight: 700; cursor: pointer; margin-top: 10px;">
                        Create B.Tech Account →
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
                    const name = modalContainer.querySelector('#reg-name').value.trim();
                    const rollNumber = modalContainer.querySelector('#reg-roll-no').value.trim();
                    const university = modalContainer.querySelector('#reg-university').value.trim();
                    const branch = modalContainer.querySelector('#reg-branch').value;
                    const year = modalContainer.querySelector('#reg-year').value;
                    const semester = modalContainer.querySelector('#reg-semester').value;
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
                                studentCode: rollNumber,
                                classGrade: `B.Tech ${branch} (${year} - Sem ${semester})`,
                                educationLevel: 'btech',
                                program: 'B.Tech',
                                branch,
                                year,
                                semester,
                                institution: university,
                                rollNumber
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
                        console.error('[AuthView B.Tech] Registration Error:', err);
                        App.toast(err.message || 'Error registering student profile.', 'danger');
                    }
                });
            }
        }
    }
};

window.AuthView = AuthView;
