document.addEventListener('DOMContentLoaded', () => {
    // Theme setup and toggle handling
    const initTheme = () => {
        const themeToggles = document.querySelectorAll('.theme-toggle, #themeToggle');
        const logos = document.querySelectorAll('.logo img');

        const updateLogo = (theme) => {
            logos.forEach(img => {
                const currentSrc = img.src;
                if (theme === 'dark') {
                    if (currentSrc.includes('logo.svg') && !currentSrc.includes('logo-white.svg')) {
                        img.src = currentSrc.replace('logo.svg', 'logo-white.svg');
                    }
                } else {
                    if (currentSrc.includes('logo-white.svg')) {
                        img.src = currentSrc.replace('logo-white.svg', 'logo.svg');
                    }
                }
            });
        };

        const currentTheme = localStorage.getItem('theme') || 'dark';
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.documentElement.classList.add('dark-theme');
            updateLogo('dark');
        } else {
            document.body.classList.remove('dark-theme');
            document.documentElement.classList.remove('dark-theme');
            updateLogo('light');
        }

        themeToggles.forEach(btn => {
            btn.style.display = 'inline-flex';
            const sunIcon = btn.querySelector('.bx-sun');
            const moonIcon = btn.querySelector('.bx-moon');
            if (sunIcon && moonIcon) {
                sunIcon.style.display = currentTheme === 'dark' ? 'none' : 'block';
                moonIcon.style.display = currentTheme === 'dark' ? 'block' : 'none';
            }

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const isDark = document.body.classList.toggle('dark-theme');
                document.documentElement.classList.toggle('dark-theme', isDark);
                const theme = isDark ? 'dark' : 'light';
                localStorage.setItem('theme', theme);
                updateLogo(theme);
                
                themeToggles.forEach(b => {
                    const sun = b.querySelector('.bx-sun');
                    const moon = b.querySelector('.bx-moon');
                    if (sun && moon) {
                        sun.style.display = theme === 'dark' ? 'none' : 'block';
                        moon.style.display = theme === 'dark' ? 'block' : 'none';
                    }
                });

                if (window.updateChartTheme) {
                    window.updateChartTheme(theme);
                }
            });
        });
    };
    initTheme();

    // Active Sidebar Highlight based on URL filename
    const currentPath = window.location.pathname.split('/').pop() || 'cloud_dashboard.html';
    document.querySelectorAll('.sidebar .nav-links li').forEach(li => {
        const a = li.querySelector('a');
        if (a) {
            const href = a.getAttribute('href');
            if (href === currentPath) {
                li.classList.add('active');
            } else if (currentPath === '' && href === 'cloud_dashboard.html') {
                li.classList.add('active');
            }
        }
    });

    // Switcher dropdown toggler
    const switcherToggle = document.getElementById('navSwitcherToggle');
    const navSwitcher = document.querySelector('.nav-switcher');
    if (switcherToggle && navSwitcher) {
        switcherToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navSwitcher.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!navSwitcher.contains(e.target)) {
                navSwitcher.classList.remove('active');
            }
        });
    }

    // Apply saved accent theme
    const savedAccent = localStorage.getItem('omniteq_accent') || 'cyan';
    ['cyan', 'indigo', 'purple', 'emerald'].forEach(acc => {
        document.body.classList.remove(`accent-${acc}`);
    });
    document.body.classList.add(`accent-${savedAccent}`);

    // Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            if(window.innerWidth > 768) {
                sidebar.classList.toggle('collapsed');
            } else {
                sidebar.classList.toggle('mobile-open');
            }
        });
    }

    // Mobile Hamburger
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    if (hamburger && mobileMenu) {
        const mobileLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
        mobileLinks.forEach((link, idx) => {
            link.style.animationDelay = `${idx * 0.08}s`;
        });
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });
    }

    // User profile and session management
    const loadUserProfile = async () => {
        const currentPath = window.location.pathname.split('/').pop() || 'cloud_dashboard.html';
        const publicPages = ['login.html', 'signup.html', 'cloud_landing.html', 'about.html', 'api-reference.html', ''];
        const isProtected = currentPath.startsWith('cloud_') && !publicPages.includes(currentPath);

        const token = localStorage.getItem('access_token');
        if (!token) {
            if (isProtected) {
                window.location.href = 'login.html';
                return;
            }
            return;
        }

        try {
            if (window.api && window.api.auth) {
                const res = await window.api.auth.me();
                if (res && res.success && res.data) {
                    const displayName = res.data.display_name || res.data.name || "User";
                    const email = res.data.email || "";
                    const role = res.data.role || (res.data.id === 'usr_01HXKJ2P3M4N5Q6R7S8T9V0W' ? "Administrator" : "Developer");
                    
                    document.querySelectorAll('.user-name, #user-display-name').forEach(el => { el.textContent = displayName; });
                    document.querySelectorAll('.user-role, #user-display-role').forEach(el => { el.textContent = role; });
                    document.querySelectorAll('.user-profile img, #user-avatar-img').forEach(img => {
                        img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=185FA5&color=fff`;
                    });

                    const settingsNameInput = document.getElementById('settings-fullname');
                    if (settingsNameInput) settingsNameInput.value = displayName;
                    const settingsEmailInput = document.getElementById('settings-email');
                    if (settingsEmailInput) settingsEmailInput.value = email;
                    const settingsRoleInput = document.getElementById('settings-role');
                    if (settingsRoleInput) settingsRoleInput.value = role;
                } else {
                    if (isProtected) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        window.location.href = 'login.html';
                    }
                }
            }
        } catch (e) {
            console.warn("User session check failed:", e);
            if (isProtected && e.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = 'login.html';
            }
        }
    };
    loadUserProfile();

    // Universal Logout Handler
    document.querySelectorAll('a[href="login.html"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (btn.closest('.nav-links') || btn.textContent.toLowerCase().includes('logout')) {
                e.preventDefault();
                try {
                    if (window.api && window.api.auth) {
                        await window.api.auth.logout();
                    }
                } catch (err) {
                    // Ignore network logout error
                }
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = 'login.html';
            }
        });
    });

    // Server Vitals Navigation Header Badge Injector
    const initServerVitalsHeaderBadge = () => {
        const navActions = document.querySelector('.top-header .nav-actions, .header-right');
        if (!navActions || document.getElementById('headerServerBadge')) return;

        const badge = document.createElement('a');
        badge.id = 'headerServerBadge';
        badge.className = 'server-vitals-badge';
        badge.href = 'cloud_settings.html#api';
        badge.title = 'Click to open Developer API & Server Settings';

        const updateBadgeContent = async () => {
            // Host comes from the live client, falling back to the shared config
            // (js/config.js) so this never hardcodes a gateway of its own.
            const cfg = window.OMNITEQ_CONFIG;
            const gatewayHost = (window.api && window.api.baseUrl)
                ? window.api.baseUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1$/, '')
                : (cfg ? cfg.host : '');

            let isHealthy = false;
            try {
                if (window.api && window.api.health) {
                    const health = await window.api.health.check();
                    isHealthy = !!(health && health.success && health.data && (health.data.status === 'healthy' || health.data.status === 'ok'));
                }
            } catch (e) {
                isHealthy = false;
            }

            if (isHealthy) {
                badge.className = 'server-vitals-badge';
                badge.innerHTML = `<span class="pulse-dot"></span> <span>${gatewayHost}</span>`;
            } else {
                badge.className = 'server-vitals-badge offline';
                badge.title = `Gateway unreachable at ${gatewayHost} - open Developer API & Server Settings`;
                badge.innerHTML = `<span class="pulse-dot"></span> <span>${gatewayHost} (Unreachable)</span>`;
            }
        };

        navActions.insertBefore(badge, navActions.firstChild);
        updateBadgeContent();
        setInterval(updateBadgeContent, 15000); // Poll health status every 15s
    };
    initServerVitalsHeaderBadge();

    // Scroll Animation Revealer for .animate-on-scroll elements
    const initScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        if (!animatedElements.length) return;

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });

            animatedElements.forEach(el => {
                observer.observe(el);
                const rect = el.getBoundingClientRect();
                if (rect.top <= window.innerHeight) {
                    el.classList.add('visible');
                }
            });
        } else {
            animatedElements.forEach(el => el.classList.add('visible'));
        }
    };
    initScrollAnimations();
});

// Toast / Notification Helper
window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg = type === 'error' ? 'rgba(239, 68, 68, 0.9)'
        : type === 'warning' ? 'rgba(245, 158, 11, 0.9)'
        : type === 'info' ? 'rgba(59, 130, 246, 0.9)'
        : 'rgba(16, 185, 129, 0.9)';
    const icon = type === 'error' ? 'bx-error-circle'
        : type === 'warning' ? 'bx-error'
        : type === 'info' ? 'bx-info-circle'
        : 'bx-check-circle';

    toast.style.cssText = `background: ${bg}; color: #fff; padding: 12px 20px; border-radius: 10px; font-family: Inter, sans-serif; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); backdrop-filter: blur(10px); transition: all 0.3s ease; transform: translateY(20px); opacity: 0; pointer-events: auto;`;
    toast.innerHTML = `<i class='bx ${icon}' style='font-size: 20px;'></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

// Global HTML escaping helper.
// Server-supplied strings (device names, labels, descriptions) are interpolated
// into innerHTML across the console, so they must be escaped both to avoid
// breaking markup and to prevent script injection through a crafted name.
window.escapeHtml = function(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
};

// Copy an arbitrary string to the clipboard and confirm it, without needing a
// hidden <input> to exist first. Used by the inline copy buttons on generated IDs.
window.copyText = function(value, label) {
    if (value === null || value === undefined || value === '') {
        showToast('Nothing to copy', 'warning');
        return;
    }
    const text = String(value);
    const done = () => showToast(`${label ? label + ' ' : ''}copied to clipboard`, 'success');
    const fallback = () => {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            done();
        } catch (e) {
            showToast('Copy failed — select the value and copy manually', 'error');
        }
    };
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
        fallback();
    }
};

// Telemetry chart factory.
//
// Chart.js is loaded by the pages, but nothing ever constructed a chart, so the
// dashboards were calling telemetryChart.update() on an object that did not
// exist and the canvas stayed empty. Every page that needs a chart now calls
// this once and keeps using window.telemetryChart afterwards.
window.omniteqInitTelemetryChart = function(canvasId, options) {
    const canvas = document.getElementById(canvasId || 'telemetryChart');
    if (!canvas) return null;

    if (typeof Chart === 'undefined') {
        console.warn('[OmniTeq] Chart.js is not loaded; the telemetry plot cannot be drawn.');
        canvas.insertAdjacentHTML('afterend',
            '<p style="text-align:center;color:var(--text-muted-dark);font-size:13px;padding:20px;">Chart library unavailable (offline?). The raw data logs below are still live.</p>');
        return null;
    }

    const opts = options || {};

    // Re-initialising the same canvas throws "Canvas is already in use".
    if (window.telemetryChart && typeof window.telemetryChart.destroy === 'function') {
        try { window.telemetryChart.destroy(); } catch (e) { /* already gone */ }
    }

    const css = getComputedStyle(document.body);
    const primary = (css.getPropertyValue('--primary-color') || css.getPropertyValue('--primary') || '#3b82f6').trim() || '#3b82f6';
    const muted = (css.getPropertyValue('--text-muted-dark') || '#94a3b8').trim() || '#94a3b8';
    const grid = 'rgba(148, 163, 184, 0.15)';

    window.telemetryChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: opts.label || 'Telemetry',
                data: [],
                borderColor: primary,
                backgroundColor: opts.fill === false ? 'transparent' : 'rgba(59, 130, 246, 0.12)',
                pointBorderColor: primary,
                pointBackgroundColor: primary,
                pointRadius: opts.pointRadius !== undefined ? opts.pointRadius : 3,
                pointHoverRadius: 5,
                borderWidth: 2,
                tension: 0.35,
                fill: opts.fill !== false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300 },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: opts.showLegend === true, labels: { color: muted, boxWidth: 12 } },
                tooltip: {
                    backgroundColor: 'rgba(13, 18, 34, 0.95)',
                    borderColor: 'rgba(148, 163, 184, 0.25)',
                    borderWidth: 1,
                    titleColor: '#f8fafc',
                    bodyColor: '#e2e8f0',
                    padding: 10,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    ticks: { color: muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
                    grid: { color: grid, drawTicks: false }
                },
                y: {
                    ticks: { color: muted },
                    grid: { color: grid, drawTicks: false },
                    beginAtZero: false
                }
            }
        }
    });

    /**
     * Re-apply colours after a theme toggle. cloud.js already calls
     * window.updateChartTheme, which was previously undefined.
     */
    window.updateChartTheme = function() {
        if (!window.telemetryChart) return;
        const c = getComputedStyle(document.body);
        const p = (c.getPropertyValue('--primary-color') || c.getPropertyValue('--primary') || '#3b82f6').trim() || '#3b82f6';
        const m = (c.getPropertyValue('--text-muted-dark') || '#94a3b8').trim() || '#94a3b8';
        const ch = window.telemetryChart;
        ch.data.datasets[0].borderColor = p;
        ch.data.datasets[0].pointBorderColor = p;
        ch.data.datasets[0].pointBackgroundColor = p;
        if (ch.options.scales && ch.options.scales.x) {
            ch.options.scales.x.ticks.color = m;
            ch.options.scales.y.ticks.color = m;
        }
        ch.update('none');
    };

    return window.telemetryChart;
};

// Global Modal Helpers
window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('active'));
    }
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
};

// Device credential helpers.
//
// The gateway returns a device's secret_key exactly once, in the POST
// /projects/:id/devices response. If it is lost the device must be recreated,
// so the value is cached in sessionStorage (current tab only, cleared when the
// browser closes) purely to pre-fill the /ingest test forms for convenience.
// The server never returns it again, so nothing here is a source of truth.
const DEVICE_SECRET_CACHE_KEY = 'omniteq_device_secret_cache';

function readDeviceSecretCache() {
    try {
        return JSON.parse(sessionStorage.getItem(DEVICE_SECRET_CACHE_KEY) || '{}');
    } catch (e) {
        return {};
    }
}

window.omniteqRememberDeviceSecret = function(deviceId, secretKey) {
    if (!deviceId || !secretKey) return;
    try {
        const cache = readDeviceSecretCache();
        cache[deviceId] = secretKey;
        sessionStorage.setItem(DEVICE_SECRET_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        // sessionStorage may be unavailable (private mode); prefill is optional.
    }
};

window.omniteqDeviceSecret = function(deviceId) {
    if (!deviceId) return '';
    return readDeviceSecretCache()[deviceId] || '';
};

window.fillDeviceSecretIfAvailable = function(deviceSelectId, secretInputId) {
    const deviceSelect = document.getElementById(deviceSelectId);
    const secretInput = document.getElementById(secretInputId);
    if (!deviceSelect || !secretInput) return;
    const secret = window.omniteqDeviceSecret(deviceSelect.value);
    if (secret) secretInput.value = secret;
};

// Remember the secret whenever a device is created, so the ingest test modals
// can offer it without the operator re-copying it from the creation modal.
if (window.api && window.api.devices && !window.api.devices._secretCaptureInstalled) {
    const originalCreate = window.api.devices.create.bind(window.api.devices);
    window.api.devices.create = async function(projectId, data) {
        const res = await originalCreate(projectId, data);
        if (res && res.success && res.data && res.data.id && res.data.secret_key) {
            window.omniteqRememberDeviceSecret(res.data.id, res.data.secret_key);
        }
        return res;
    };
    window.api.devices._secretCaptureInstalled = true;
}
