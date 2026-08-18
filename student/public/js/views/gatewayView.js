/* SmartSlate Main Gateway Selection View Component (Port 3000 Launcher) */

const GatewayView = {
    render(container) {
        const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '10.42.0.1';
        const proto = (typeof window !== 'undefined' && window.location && window.location.protocol) ? window.location.protocol : 'http:';
        const urls = window.DASHBOARD_URLS || {
            elementary: `${proto}//${host}:3002`,
            highSchool: `${proto}//${host}:3003`,
            intermediate: `${proto}//${host}:3004`,
            btech: `${proto}//${host}:3005`
        };

        const cards = [
            {
                id: 'elementary',
                icon: '🎒',
                level: 'ELEMENTARY',
                classes: 'Classes 1–5',
                description: 'Learning made simple and fun.',
                url: urls.elementary,
                color: '#3B82F6'
            },
            {
                id: 'highSchool',
                icon: '📚',
                level: 'HIGH SCHOOL',
                classes: 'Classes 6–10',
                description: 'Learn, practice and track your progress.',
                url: urls.highSchool,
                color: '#8864F3'
            },
            {
                id: 'intermediate',
                icon: '🎓',
                level: 'INTERMEDIATE / DIPLOMA',
                classes: 'Intermediate & Diploma',
                description: 'Build your knowledge and skills.',
                url: urls.intermediate,
                color: '#059669'
            },
            {
                id: 'btech',
                icon: '💻',
                level: 'B.TECH',
                classes: 'B.Tech & Higher Education',
                description: 'Learn, build and grow.',
                url: urls.btech,
                color: '#D97706'
            }
        ];

        container.innerHTML = `
            <div style="min-height: 100vh; background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; box-sizing: border-radius;">
                
                <!-- Main Gateway Brand Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: linear-gradient(135deg, #8864F3, #6D28D9); border-radius: 20px; box-shadow: 0 8px 24px rgba(136, 100, 243, 0.3); margin-bottom: 16px;">
                        <span style="font-size: 34px;">📖</span>
                    </div>
                    <h1 style="font-size: 38px; font-weight: 900; color: #151A2D; margin: 0; letter-spacing: -1px;">SMARTSLATE</h1>
                    <p style="font-size: 16px; font-weight: 700; color: #8864F3; margin-top: 6px;">Choose your learning level</p>
                </div>

                <!-- 4 Circular Cards Grid -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 36px; max-width: 720px; width: 100%; justify-items: center;" class="gateway-card-grid">
                    ${cards.map(c => `
                        <div class="gateway-circle-card bouncy-btn" onclick="GatewayView.launchApp('${c.url}', '${c.level}')" style="border-color: ${c.color}33;">
                            <div style="font-size: 40px; margin-bottom: 6px; line-height: 1;">${c.icon}</div>
                            <div style="font-size: 13px; font-weight: 900; color: #151A2D; letter-spacing: 0.5px; text-transform: uppercase;">${c.level}</div>
                            <div style="font-size: 11px; font-weight: 800; color: ${c.color}; margin-top: 2px;">${c.classes}</div>
                            <div style="font-size: 10.5px; color: #6B7280; margin-top: 6px; line-height: 1.3; max-width: 140px;">${c.description}</div>
                        </div>
                    `).join('')}
                </div>

                <!-- Footer Tagline -->
                <div style="margin-top: 48px; text-align: center;">
                    <p style="font-size: 12px; font-weight: 600; color: #94A3B8; margin: 0;">Learn Offline. Connect When Online.</p>
                </div>

            </div>
        `;

        // Inject responsive grid style if not present
        if (!document.getElementById('gateway-responsive-style')) {
            const style = document.createElement('style');
            style.id = 'gateway-responsive-style';
            style.innerHTML = `
                @media (max-width: 650px) {
                    .gateway-card-grid {
                        grid-template-columns: 1fr !important;
                        gap: 24px !important;
                    }
                    .gateway-circle-card {
                        width: 190px !important;
                        height: 190px !important;
                    }
                }
                .gateway-circle-card {
                    width: 220px;
                    height: 220px;
                    border-radius: 50%;
                    background: #FFFFFF;
                    border: 3px solid rgba(136, 100, 243, 0.2);
                    box-shadow: 0 12px 32px rgba(21, 26, 45, 0.08);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 20px;
                    cursor: pointer;
                    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
                    user-select: none;
                    box-sizing: border-box;
                }
                .gateway-circle-card:hover {
                    transform: translateY(-8px) scale(1.04);
                    box-shadow: 0 20px 40px rgba(136, 100, 243, 0.22);
                }
            `;
            document.head.appendChild(style);
        }
    },

    launchApp(url, title) {
        console.log(`[GATEWAY] Launching ${title} -> ${url}`);
        window.location.href = url;
    }
};
