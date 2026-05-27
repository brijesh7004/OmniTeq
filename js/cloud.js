document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        const body = document.body;
        const themeIcon = themeToggleBtn.querySelector('i');

        // Check for saved theme
        const currentTheme = localStorage.getItem('theme') || 'dark';
        if (currentTheme === 'light') {
            body.classList.remove('dark-theme');
            if (themeIcon) themeIcon.classList.replace('bx-sun', 'bx-moon');
        }

        themeToggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            let theme = 'light';
            
            if (body.classList.contains('dark-theme')) {
                theme = 'dark';
                if (themeIcon) themeIcon.classList.replace('bx-moon', 'bx-sun');
            } else {
                if (themeIcon) themeIcon.classList.replace('bx-sun', 'bx-moon');
            }
            
            localStorage.setItem('theme', theme);
            
            // Update chart colors if it exists
            if(window.telemetryChart) {
                updateChartTheme(theme);
            }
        });
    }

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

    // Initialize Chart.js
    initChart();
});

function initChart() {
    const ctx = document.getElementById('telemetryChart');
    if (!ctx) return;

    // Base colors
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    // Gradient fill for chart
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)'); // primary color transparent
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    window.telemetryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
            datasets: [{
                label: 'Temperature (°C)',
                data: [22.5, 23.1, 24.5, 25.2, 24.8, 24.1, 23.5, 22.8],
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#1e293b',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: isDark ? '#f8fafc' : '#1e293b',
                    bodyColor: isDark ? '#f8fafc' : '#1e293b',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' °C';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: { family: "'Inter', sans-serif", size: 12 }
                    }
                },
                y: {
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: { family: "'Inter', sans-serif", size: 12 },
                        stepSize: 1
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
}

function updateChartTheme(theme) {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const tooltipBg = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    const tooltipColor = isDark ? '#f8fafc' : '#1e293b';
    const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

    if(window.telemetryChart) {
        window.telemetryChart.options.scales.x.ticks.color = textColor;
        window.telemetryChart.options.scales.y.ticks.color = textColor;
        window.telemetryChart.options.scales.y.grid.color = gridColor;
        
        window.telemetryChart.options.plugins.tooltip.backgroundColor = tooltipBg;
        window.telemetryChart.options.plugins.tooltip.titleColor = tooltipColor;
        window.telemetryChart.options.plugins.tooltip.bodyColor = tooltipColor;
        window.telemetryChart.options.plugins.tooltip.borderColor = tooltipBorder;
        
        window.telemetryChart.update();
    }
}

// Landing Page Scroll Animations
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once animated
                // observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
});
