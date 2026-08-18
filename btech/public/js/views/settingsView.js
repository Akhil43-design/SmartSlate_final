/* SmartSlate Student Profile & Academic Hub (Class 6–10)
   Includes: Read-only Academic Information, Attendance Bars, Syllabus Progress,
   Report Card Viewer, and Application Settings.
*/

const SettingsView = {
    render(container) {
        const studentInfo = App.currentUser || AcademicData.studentProfile;
        if (!studentInfo) {
            container.innerHTML = `
                <div class="glass-card" style="padding: 40px; text-align: center; color: var(--status-danger);">
                    <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">⚠️ Student Profile Not Found</h2>
                    <p style="font-size: 14px; color: var(--text-secondary);">Unable to resolve student profile from Cloud Firestore for the authenticated user.</p>
                    <button class="glass-btn glass-btn-primary bouncy-btn" style="margin-top: 16px; padding: 10px 20px;" onclick="App.logout()">Return to Login</button>
                </div>
            `;
            return;
        }
        const activeClass = studentInfo.class || AcademicData.selectedClass || 8;
        const subjects = AcademicData.getSubjects(activeClass);

        const attendanceData = [
            { subject: 'Overall Academic Attendance', percent: 92, color: '#8864F3', tag: '320 / 348 Sessions' },
            { subject: 'Mathematics', percent: 94, color: '#6D28D9', tag: '64 / 68 Periods' },
            { subject: 'Science', percent: 90, color: '#059669', tag: '58 / 64 Periods' },
            { subject: 'English', percent: 93, color: '#2563EB', tag: '54 / 58 Periods' },
            { subject: 'Social Science', percent: 91, color: '#D97706', tag: '49 / 54 Periods' }
        ];

        const progressData = subjects.map(s => ({
            name: s.name,
            percent: s.progress || 80,
            color: s.color || '#8864F3'
        }));

        container.innerHTML = `
            <div class="settings-page-wrapper" style="max-width: 1000px; margin: 0 auto;">
                
                <!-- Profile Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <h1 style="font-size: 26px; font-weight: 800; color: #151A2D; margin: 0; display: flex; align-items: center; gap: 10px;">
                            <span>Academic Profile</span>
                            <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-weight: 800; font-size: 11px;">
                                Class ${activeClass} • ${studentInfo.section}
                            </span>
                        </h1>
                        <p style="font-size: 13.5px; color: #6B7280; margin-top: 4px;">
                            Academic credentials, attendance records, curriculum progress & system settings
                        </p>
                    </div>

                    <!-- Teacher / School Admin Access Trigger -->
                    <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="App.showTeacherAdminModal()" style="padding: 9px 16px; font-size: 12.5px; border-radius: 8px;">
                        <span>🏫 Teacher / Admin Portal</span>
                    </button>
                </div>

                <!-- 1. STUDENT ACADEMIC INFORMATION (Read-only for Student) -->
                <div class="home-section-card" style="margin-bottom: 24px; padding: 22px 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid #ECEAF2; padding-bottom: 14px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 48px; height: 48px; border-radius: 12px; background: #8864F3; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; box-shadow: 0 4px 12px rgba(136, 100, 243, 0.3);">
                                ${studentInfo.name.charAt(0)}
                            </div>
                            <div>
                                <h3 style="font-size: 18px; font-weight: 800; color: #151A2D; margin: 0;">${studentInfo.name}</h3>
                                <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">Enrolled Student • Roll No. ${studentInfo.rollNo} • ${studentInfo.school}</div>
                            </div>
                        </div>

                        <span class="glass-badge" style="background: #ECFDF5; color: #059669; font-weight: 800; font-size: 11px;">
                            Active Student • Enrolled
                        </span>
                    </div>

                    <!-- Read-only Details Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div style="background: #FAFAFC; border: 1px solid #ECEAF2; border-radius: 10px; padding: 12px 14px;">
                            <span style="font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase;">Class & Section</span>
                            <div style="font-size: 14.5px; font-weight: 800; color: #151A2D; margin-top: 4px;">Class ${activeClass} • ${studentInfo.section}</div>
                            <span style="font-size: 10.5px; color: #059669; font-weight: 600;">🔒 Managed by School</span>
                        </div>

                        <div style="background: #FAFAFC; border: 1px solid #ECEAF2; border-radius: 10px; padding: 12px 14px;">
                            <span style="font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase;">Academic Year</span>
                            <div style="font-size: 14.5px; font-weight: 800; color: #151A2D; margin-top: 4px;">${studentInfo.academicYear}</div>
                            <span style="font-size: 10.5px; color: #6B7280;">Standard Term</span>
                        </div>

                        <div style="background: #FAFAFC; border: 1px solid #ECEAF2; border-radius: 10px; padding: 12px 14px;">
                            <span style="font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase;">Student ID</span>
                            <div style="font-size: 14.5px; font-weight: 800; color: #151A2D; margin-top: 4px; font-family: monospace;">${studentInfo.studentId}</div>
                            <span style="font-size: 10.5px; color: #6B7280;">SmartSlate Verified</span>
                        </div>

                        <div style="background: #FAFAFC; border: 1px solid #ECEAF2; border-radius: 10px; padding: 12px 14px;">
                            <span style="font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase;">School / Institution</span>
                            <div style="font-size: 14px; font-weight: 800; color: #151A2D; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${studentInfo.school}</div>
                            <span style="font-size: 10.5px; color: #6B7280;">CBSE / NCERT Board</span>
                        </div>
                    </div>
                </div>

                <!-- 2-COLUMN ACADEMIC DATA GRID: Attendance & Curriculum Progress -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px;">
                    
                    <!-- Attendance Progress Section -->
                    <div class="home-section-card" style="padding: 20px;">
                        <div class="home-section-header" style="margin-bottom: 16px;">
                            <div class="home-section-title-group">
                                <span style="font-size: 18px;">📊</span>
                                <h3 class="home-section-title">Attendance Records</h3>
                            </div>
                            <span class="glass-badge" style="background: #ECFDF5; color: #059669; font-weight: 800; font-size: 11px;">92% Overall</span>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            ${attendanceData.map(att => `
                                <div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 13px;">
                                        <span style="font-weight: 700; color: #151A2D;">${att.subject}</span>
                                        <span style="font-weight: 800; color: ${att.color};">${att.percent}% <span style="font-size: 11px; color: #6B7280; font-weight: 500;">(${att.tag})</span></span>
                                    </div>
                                    <div class="progress-track" style="height: 6px; background: #ECEAF2; border-radius: 3px;">
                                        <div class="progress-fill" style="width: ${att.percent}%; background: ${att.color}; border-radius: 3px;"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Academic Syllabus Progress Section -->
                    <div class="home-section-card" style="padding: 20px;">
                        <div class="home-section-header" style="margin-bottom: 16px;">
                            <div class="home-section-title-group">
                                <span style="font-size: 18px;">🎯</span>
                                <h3 class="home-section-title">Academic Progress</h3>
                            </div>
                            <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-weight: 800; font-size: 11px;">Class ${activeClass} Syllabus</span>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            ${progressData.map(p => `
                                <div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 13px;">
                                        <span style="font-weight: 700; color: #151A2D;">${p.name}</span>
                                        <span style="font-weight: 800; color: ${p.color};">${p.percent}% Mastered</span>
                                    </div>
                                    <div class="progress-track" style="height: 6px; background: #ECEAF2; border-radius: 3px;">
                                        <div class="progress-fill" style="width: ${p.percent}%; background: ${p.color}; border-radius: 3px;"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                </div>

                <!-- 3. REPORT CARDS & EXAM EVALUATIONS -->
                <div class="home-section-card" style="margin-bottom: 24px; padding: 20px 24px;">
                    <div class="home-section-header" style="margin-bottom: 14px;">
                        <div class="home-section-title-group">
                            <span style="font-size: 18px;">📜</span>
                            <h3 class="home-section-title">Academic Report Cards</h3>
                        </div>
                        <span style="font-size: 12px; color: #6B7280; font-weight: 600;">Official Assessment Records</span>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
                        
                        <!-- Term 1 Card -->
                        <div style="background: #FAFAFC; border: 1px solid #ECEAF2; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 14.5px; font-weight: 800; color: #151A2D;">Academic Session 2026 — Term 1</span>
                                    <span class="glass-badge" style="background: #ECFDF5; color: #059669; font-size: 10px; font-weight: 800;">Grade A</span>
                                </div>
                                <div style="font-size: 11.5px; color: #6B7280; margin-top: 3px;">Cumulative GPA: 9.2 / 10 • Verified by School Board</div>
                            </div>
                            <button class="glass-btn glass-btn-primary bouncy-btn" onclick="SettingsView.showReportCardModal('Term 1 (2026)')" style="padding: 8px 14px; font-size: 12px; border-radius: 8px;">
                                <span>View Report</span>
                            </button>
                        </div>

                        <!-- Term 2 Card -->
                        <div style="background: #FAFAFC; border: 1px solid #ECEAF2; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 14.5px; font-weight: 800; color: #151A2D;">Academic Session 2026 — Term 2</span>
                                    <span class="glass-badge" style="background: #F1EDFF; color: #8864F3; font-size: 10px; font-weight: 800;">In Progress</span>
                                </div>
                                <div style="font-size: 11.5px; color: #6B7280; margin-top: 3px;">Mid-Term Assessment • 4 / 6 Subject Exams Done</div>
                            </div>
                            <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="SettingsView.showReportCardModal('Term 2 Mid-Evaluation (2026)')" style="padding: 8px 14px; font-size: 12px; border-radius: 8px;">
                                <span>View Report</span>
                            </button>
                        </div>

                    </div>
                </div>

                <!-- 4. APPLICATION PREFERENCES & SYSTEM SETTINGS -->
                <div class="home-section-card" style="padding: 20px 24px;">
                    <div class="home-section-header" style="margin-bottom: 14px;">
                        <div class="home-section-title-group">
                            <span style="font-size: 18px;">⚙️</span>
                            <h3 class="home-section-title">Settings & Preferences</h3>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
                        
                        <div class="settings-item-row" style="background: #FAFAFC; border: 1px solid #ECEAF2; border-radius: 10px; padding: 12px 16px;">
                            <div class="settings-item-left">
                                <div class="settings-icon-box" style="background: #E0F2FE; color: #0284C7;">
                                    🔔
                                </div>
                                <div>
                                    <div class="settings-item-title" style="font-size: 13.5px; font-weight: 700;">Assignment Reminders</div>
                                    <div class="settings-item-subtitle" style="font-size: 11.5px; color: #6B7280;">Get alerted before homework deadlines</div>
                                </div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" checked onchange="App.toast('Notification preferences saved', 'info')">
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="settings-item-row" style="background: #FAFAFC; border: 1px solid #ECEAF2; border-radius: 10px; padding: 12px 16px;">
                            <div class="settings-item-left">
                                <div class="settings-icon-box" style="background: #F3E8FF; color: #8864F3;">
                                    🌙
                                </div>
                                <div>
                                    <div class="settings-item-title" style="font-size: 13.5px; font-weight: 700;">Dark Theme Mode</div>
                                    <div class="settings-item-subtitle" style="font-size: 11.5px; color: #6B7280;">High-contrast night study palette</div>
                                </div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" onchange="App.toast('Theme preference updated', 'info')">
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="settings-item-row bouncy-btn" onclick="App.toast('Language set to English (CBSE Standard)', 'info')" style="background: #FAFAFC; border: 1px solid #ECEAF2; border-radius: 10px; padding: 12px 16px; cursor: pointer;">
                            <div class="settings-item-left">
                                <div class="settings-icon-box" style="background: #DCFCE7; color: #16A34A;">
                                    🌐
                                </div>
                                <div>
                                    <div class="settings-item-title" style="font-size: 13.5px; font-weight: 700;">Curriculum Language</div>
                                    <div class="settings-item-subtitle" style="font-size: 11.5px; color: #6B7280;">English (NCERT / CBSE Medium)</div>
                                </div>
                            </div>
                            <span style="font-size: 12px; font-weight: 700; color: #8864F3;">Change →</span>
                        </div>

                        <div class="settings-item-row bouncy-btn" onclick="App.logout()" style="background: #FEE2E2; border: 1px solid #FECACA; border-radius: 10px; padding: 12px 16px; cursor: pointer;">
                            <div class="settings-item-left">
                                <div class="settings-icon-box" style="background: #FFFFFF; color: #DC2626;">
                                    🔒
                                </div>
                                <div>
                                    <div class="settings-item-title" style="font-size: 13.5px; font-weight: 800; color: #DC2626;">Lock Screen / Logout</div>
                                    <div class="settings-item-subtitle" style="font-size: 11.5px; color: #991B1B;">Secure session and lock tablet</div>
                                </div>
                            </div>
                            <span style="font-size: 12px; font-weight: 800; color: #DC2626;">Logout →</span>
                        </div>

                    </div>
                </div>

            </div>
        `;
    },

    showReportCardModal(termTitle) {
        const studentInfo = App.currentUser || AcademicData.studentProfile || { name: 'Student', class: 8, section: 'A' };
        const classNum = studentInfo.class || studentInfo.classNum || 8;
        const section = studentInfo.section || 'A';
        const html = `
            <div class="modal-card" style="max-width: 540px; text-align: left;">
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title" style="font-size: 18px; font-weight: 800; color: #151A2D;">📜 Official Academic Report Card</h3>
                        <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">${termTitle} • Class ${classNum} • ${section}</div>
                    </div>
                    <button class="modal-close" onclick="App.closeModal()">✕</button>
                </div>

                <div style="margin-top: 14px; background: #FFFFFF; border: 1.5px solid #ECEAF2; border-radius: 12px; padding: 16px;">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ECEAF2; padding-bottom: 10px; margin-bottom: 12px; font-size: 12px; color: #6B7280;">
                        <span><strong>Student:</strong> ${studentInfo.name}</span>
                        <span><strong>Roll No:</strong> ${studentInfo.rollNo || 24}</span>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="border-bottom: 1.5px solid #ECEAF2; text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase;">
                                <th style="padding: 8px 4px;">Subject</th>
                                <th style="padding: 8px 4px; text-align: center;">Max</th>
                                <th style="padding: 8px 4px; text-align: center;">Scored</th>
                                <th style="padding: 8px 4px; text-align: right;">Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #F3F4F6;">
                                <td style="padding: 10px 4px; font-weight: 700;">Mathematics</td>
                                <td style="text-align: center; color: #6B7280;">100</td>
                                <td style="text-align: center; font-weight: 800; color: #151A2D;">94</td>
                                <td style="text-align: right; font-weight: 800; color: #059669;">A1</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #F3F4F6;">
                                <td style="padding: 10px 4px; font-weight: 700;">Science</td>
                                <td style="text-align: center; color: #6B7280;">100</td>
                                <td style="text-align: center; font-weight: 800; color: #151A2D;">88</td>
                                <td style="text-align: right; font-weight: 800; color: #059669;">A2</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #F3F4F6;">
                                <td style="padding: 10px 4px; font-weight: 700;">English</td>
                                <td style="text-align: center; color: #6B7280;">100</td>
                                <td style="text-align: center; font-weight: 800; color: #151A2D;">92</td>
                                <td style="text-align: right; font-weight: 800; color: #059669;">A1</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #F3F4F6;">
                                <td style="padding: 10px 4px; font-weight: 700;">Social Science</td>
                                <td style="text-align: center; color: #6B7280;">100</td>
                                <td style="text-align: center; font-weight: 800; color: #151A2D;">86</td>
                                <td style="text-align: right; font-weight: 800; color: #059669;">A2</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 4px; font-weight: 700;">Computer Science</td>
                                <td style="text-align: center; color: #6B7280;">100</td>
                                <td style="text-align: center; font-weight: 800; color: #151A2D;">96</td>
                                <td style="text-align: right; font-weight: 800; color: #059669;">A1</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="border-top: 1.5px solid #ECEAF2; margin-top: 12px; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 800; font-size: 13.5px; color: #151A2D;">Overall Result: PASS</span>
                        <span style="font-weight: 900; font-size: 14px; color: #8864F3;">Percentage: 91.2% (Grade A1)</span>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px;">
                    <button class="glass-btn glass-btn-secondary bouncy-btn" onclick="App.closeModal()">
                        <span>Close</span>
                    </button>
                    <button class="glass-btn glass-btn-primary bouncy-btn" onclick="App.toast('Report PDF downloaded! 📥', 'success')">
                        <span>📥 Download PDF</span>
                    </button>
                </div>
            </div>
        `;
        App.showModal(html);
    }
};
