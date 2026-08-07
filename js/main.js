// Unified Notification System (Omni-Toast)
window.showToast = (message, type = 'success') => {
    console.log(`[OmniToast] Showing ${type}: ${message}`);
    // Remove existing toasts
    document.querySelectorAll('.omni-toast').forEach(t => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 500);
    });

    const toast = document.createElement('div');
    toast.className = `omni-toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger animation with a slight delay to ensure the browser registers the initial state
    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    // Auto-remove
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }
    }, 5000);
};

// Compatibility alias
window.utils = {
    showNotification: (msg, type) => window.showToast(msg, type)
};

// Global Logout Handler
window.handleLogout = async (e) => {
    if (e) e.preventDefault();
    console.log('[OmniTeq] Logout triggered');

    let prefix = "";
    if (window.location.pathname.includes('/customer/')) {
        prefix = "../";
    }

    try {
        window.showToast('Logging out... See you soon!', 'info');
        // Call backend logout
        await fetch(prefix + 'api/auth/logout.php', { method: 'POST' });
    } catch (err) {
        console.error('[OmniTeq] Logout error:', err);
    }

    setTimeout(() => {
        window.location.href = prefix + 'index.html';
    }, 1500); // Reduced delay slightly for better UX
};

// Dynamic Navbar Logic
async function initDynamicNavbar() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const prefix = window.location.pathname.includes('/customer/') ? '../' : '';

    try {
        const resp = await fetch(prefix + 'api/auth/check_session.php');
        const data = await resp.json();

        if (data.authenticated) {
            window.isAuthenticated = true; // Global flag for form submission check
            window.userData = data.user;   // Store user data for prepopulation
            console.log('[OmniTeq] User is authenticated:', data.user.full_name);

            // Prepopulate any available forms
            forms.prepopulateForms(data.user);

            // On index.html, replace Login/Register with Dashboard/Logout
            const loginLink = navActions.querySelector('.nav-auth-link');
            const registerBtn = navActions.querySelector('.nav-auth-btn');

            if (loginLink && registerBtn) {
                // Determine dashboard link based on role
                let dashboardPage = 'customer/dashboard.php';
                const role = data.user.role;
                if (role === 'admin') dashboardPage = 'admin.html';
                else if (role === 'employee') dashboardPage = 'employee.html';

                loginLink.href = dashboardPage;
                loginLink.textContent = 'Dashboard';
                loginLink.classList.remove('active'); // Reset active state if on login page

                registerBtn.href = '#';
                registerBtn.textContent = 'Logout';
                registerBtn.classList.add('logout-btn');
                registerBtn.onclick = (e) => window.handleLogout(e);
            }
        }
        document.querySelector('.nav-auth-link').style.display = "inline";
        document.querySelector('.nav-auth-btn').style.display = "inline";
    } catch (err) {
        console.error('[OmniTeq] Auth check failed:', err);
    }
}

// Handle animations on scroll
function handleScrollAnimation(elements, callback) {
    const windowHeight = window.innerHeight;
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        if (elementTop < windowHeight - 50) {
            callback(element);
        }
    });

};

// Form Handlers
const forms = {
    // Generic form submission handler
    async submitForm(event, endpoint, requiredFields = [], hasFiles = false) {
        event.preventDefault();

        // Security Check: Only authenticated users can submit forms
        if (!window.isAuthenticated) {
            window.showToast('Please login to submit your request.', 'info');
            const prefix = window.location.pathname.includes('/customer/') ? '../' : '';
            setTimeout(() => {
                window.location.href = prefix + 'login.html';
            }, 1500);
            return;
        }

        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonHtml = submitButton.innerHTML;

        try {
            // Validate required fields
            const missingFields = requiredFields.filter(field => {
                const input = form.querySelector(`[name="${field}"]`);
                return !input || !input.value.trim();
            });

            if (missingFields.length > 0) {
                throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            }

            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            // Always use FormData for consistency
            const formData = new FormData(form);

            // Log form data for debugging
            console.log('Form data being sent:', Object.fromEntries(formData));

            const prefix = window.location.pathname.includes('/customer/') ? '../' : '';
            const response = await fetch(`${prefix}api/${endpoint}.php`, {
                method: 'POST',
                body: formData // Send as FormData for both files and regular data
            });

            console.log('Response status:', response.status); // Debug log
            const responseText = await response.text();
            console.log('Raw response:', responseText); // Debug log

            let result;
            try {
                result = JSON.parse(responseText);
                console.log('Parsed response:', result);
            } catch (e) {
                console.error('JSON parse error:', e);
                throw new Error('Server returned invalid response');
            }

            if (response.ok) {
                window.utils.showNotification('Your request has been submitted successfully!', 'success');
                form.reset();

                // Reset file input if present
                const fileInput = form.querySelector('input[type="file"]');
                if (fileInput) {
                    fileInput.value = '';
                    const selectedFilesText = form.querySelector('.selected-files');
                    if (selectedFilesText) {
                        selectedFilesText.textContent = 'No files selected';
                    }
                }
            } else {
                throw new Error(result.message || 'Failed to submit form');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            window.utils.showNotification(error.message || 'An error occurred while submitting the form.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHtml;
        }
    },

    // Contact form handler
    async submitContactForm(event) {
        return forms.submitForm(event, 'contact', ['name', 'email', 'mobile', 'subject', 'message']);
    },

    // Consultation form handler
    async submitConsultationForm(event) {
        return forms.submitForm(event, 'consultation', [
            'name', 'email', 'mobile', 'consultation_type',
            'preferred_date', 'preferred_time', 'project_brief'
        ]);
    },

    // Quote form handler
    async submitQuoteForm(event) {
        event.preventDefault();
        return this.submitForm(event, 'quote', [
            'name', 'email', 'mobile', 'project_type', 'project_details'
        ], true);
    },

    // Prepopulate forms with user data and lock specific fields
    prepopulateForms(user) {
        const formsToPopulate = ['contactForm', 'consultationForm', 'quoteForm'];
        formsToPopulate.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                console.log(`[OmniTeq] Prepopulating form: ${formId}`);

                // Fields to populate: [name in user object, selector in form]
                const mapping = [
                    { value: user.full_name, name: 'name' },
                    { value: user.email, name: 'email', readonly: true },
                    { value: user.mobile, name: 'mobile', readonly: false }
                ];

                mapping.forEach(field => {
                    const input = form.querySelector(`[name="${field.name}"]`);
                    if (input) {
                        input.value = field.value || '';
                        if (field.readonly && field.value) {
                            input.readOnly = true;
                            input.classList.add('readonly-field');
                            input.title = "This field is pre-filled from your profile and cannot be changed here.";
                        }
                    }
                });
            }
        });
    }
};

// UI Components
const ui = {
    initMobileNav() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.querySelector('.nav-menu');
        const body = document.body;

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
                body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
            });

            // Close menu when clicking links
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                    body.style.overflow = '';
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (navMenu.classList.contains('active') &&
                    !navMenu.contains(e.target) &&
                    !hamburger.contains(e.target)) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                    body.style.overflow = '';
                }
            });
        }
    },

    initStickyHeader() {
        const header = document.querySelector('#header');
        const scrollThreshold = 50;

        const handleScroll = () => {
            if (!header) return;
            if (window.scrollY > scrollThreshold) {
                header.classList.add('sticky');
            } else {
                header.classList.remove('sticky');
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check
    },

    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    const headerHeight = document.querySelector('#header')?.offsetHeight || 0;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    window.scrollTo({
                        top: targetPosition - headerHeight,
                        behavior: 'smooth'
                    });
                }
            });
        });
    },

    initFAQs() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        if (!faqQuestions.length) return;

        faqQuestions.forEach(question => {
            question.addEventListener('click', function () {
                const isActive = this.classList.contains('active');

                // Close all other FAQs
                faqQuestions.forEach(item => {
                    item.classList.remove('active');
                    item.nextElementSibling.style.maxHeight = 0;
                });

                if (!isActive) {
                    this.classList.add('active');
                    const answer = this.nextElementSibling;
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            });
        });
    },

    initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const logos = document.querySelectorAll('.logo img, .footer-logo, .auth-header img');

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

        // Initial theme setup
        const currentTheme = localStorage.getItem('theme') || 'dark';
        if (currentTheme === 'dark') {
            document.documentElement.classList.add('dark-theme');
            updateLogo('dark');
        }

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isDark = document.documentElement.classList.toggle('dark-theme');
                const theme = isDark ? 'dark' : 'light';
                localStorage.setItem('theme', theme);
                updateLogo(theme);

                // Haptic feedback feel
                themeToggle.style.transform = 'scale(0.9) translateY(-2px)';
                setTimeout(() => {
                    themeToggle.style.transform = 'translateY(-2px)';
                }, 100);
            });
        }
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize UI components
    ui.initMobileNav();
    ui.initStickyHeader();
    ui.initSmoothScroll();
    ui.initFAQs();
    ui.initTheme();
    initDynamicNavbar();

    // Portfolio filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    if (filterButtons.length > 0 && portfolioItems.length > 0) {
        // Initialize - show all items
        portfolioItems.forEach(item => {
            item.style.display = 'block';
        });

        // Make sure "All Projects" button is active by default
        const allProjectsBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allProjectsBtn) {
            allProjectsBtn.classList.add('active');
        }

        // Add click event to each filter button
        filterButtons.forEach(button => {
            button.addEventListener('click', function () {
                // Remove active class from all buttons
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                });

                // Add active class to clicked button
                this.classList.add('active');

                // Get filter value
                const filterValue = this.getAttribute('data-filter');

                // Filter items with animation
                portfolioItems.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        // First make it invisible
                        item.style.opacity = '0';

                        // Then show it and fade in
                        setTimeout(() => {
                            item.style.display = 'block';
                            setTimeout(() => {
                                item.style.opacity = '1';
                            }, 50);
                        }, 300);
                    } else {
                        // Fade out and then hide
                        item.style.opacity = '0';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }

    // Testimonial slider (if present)
    const testimonialSlider = document.querySelector('.testimonial-slider');
    if (testimonialSlider) {
        let currentSlide = 0;
        const slides = testimonialSlider.querySelectorAll('.testimonial-slide');
        const totalSlides = slides.length;
        const nextBtn = document.querySelector('.testimonial-next');
        const prevBtn = document.querySelector('.testimonial-prev');

        // Function to show a specific slide
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.style.display = i === index ? 'block' : 'none';
            });
        }

        // Initialize first slide
        if (totalSlides > 0) {
            showSlide(currentSlide);
        }

        // Next button functionality
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentSlide = (currentSlide + 1) % totalSlides;
                showSlide(currentSlide);
            });
        }

        // Previous button functionality
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
                showSlide(currentSlide);
            });
        }
    }



    // Animation on scroll
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    function checkIfInView() {
        animatedElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;

            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('visible');
            }
        });
    }

    // Initial check
    checkIfInView();

    // Check on scroll
    window.addEventListener('scroll', checkIfInView);

    // File upload interaction
    const fileUpload = document.getElementById('file-upload');
    const selectedFilesText = document.querySelector('.selected-files');

    if (fileUpload && selectedFilesText) {
        fileUpload.addEventListener('change', function () {
            if (this.files.length > 0) {
                if (this.files.length === 1) {
                    selectedFilesText.textContent = this.files[0].name;
                } else {
                    selectedFilesText.textContent = `${this.files.length} files selected`;
                }
            } else {
                selectedFilesText.textContent = 'No files selected';
            }
        });
    }

    // Animated counter for statistics
    function animateCounter() {
        const statValues = document.querySelectorAll('.stat-value');

        if (statValues.length === 0) return;

        const options = {
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const countTo = parseInt(target.getAttribute('data-count'));
                    let count = 0;
                    const duration = 2000; // 2 seconds
                    const increment = countTo / (duration / 30); // Update every 30ms

                    const counter = setInterval(() => {
                        count += increment;
                        if (count >= countTo) {
                            clearInterval(counter);
                            target.textContent = countTo;
                        } else {
                            target.textContent = Math.floor(count);
                        }
                    }, 30);

                    // Unobserve after animation starts
                    observer.unobserve(target);
                }
            });
        }, options);

        statValues.forEach(value => {
            observer.observe(value);
        });
    }

    // Initialize counter when DOM is loaded
    animateCounter();

    // Reveal animations
    function handleRevealElements() {
        const reveals = document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up');

        reveals.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            const delay = element.getAttribute('data-delay') || 0;

            if (elementTop < window.innerHeight - elementVisible) {
                setTimeout(() => {
                    element.classList.add('visible');
                }, delay);
            }
        });
    }

    // Initial check
    handleRevealElements();
    loadFeaturedProducts();

    // Check on scroll
    window.addEventListener('scroll', handleRevealElements);

    // Updated thumbnail gallery functionality for product pages
    const thumbnailItems = document.querySelectorAll('.thumbnail-item');

    thumbnailItems.forEach(thumbItem => {
        thumbItem.addEventListener('click', function () {
            // Get container
            const galleryContainer = this.closest('.gallery-container');
            if (!galleryContainer) return;

            // Get main image
            const mainImage = galleryContainer.querySelector('.main-image img');
            if (!mainImage) return;

            // Get thumbnail image
            const thumbImg = this.querySelector('img');
            if (!thumbImg || !thumbImg.dataset.full) return;

            // Update main image source
            mainImage.src = thumbImg.dataset.full;
            mainImage.alt = thumbImg.alt;

            // Update active state
            thumbnailItems.forEach(item => {
                if (item.closest('.gallery-container') === galleryContainer) {
                    item.classList.remove('active');
                }
            });
            this.classList.add('active');
        });
    });

    // Resource filter functionality
    const resourceFilterButtons = document.querySelectorAll('#resource-filter .filter-btn');
    const resourceItems = document.querySelectorAll('.resource-item');

    if (resourceFilterButtons.length > 0 && resourceItems.length > 0) {
        // Initialize - show all items
        resourceItems.forEach(item => {
            item.style.display = 'block';
        });

        // Make sure "All Resources" button is active by default
        const allResourcesBtn = document.querySelector('#resource-filter .filter-btn[data-filter="all"]');
        if (allResourcesBtn) {
            allResourcesBtn.classList.add('active');
        }

        // Add click event to each filter button
        resourceFilterButtons.forEach(button => {
            button.addEventListener('click', function () {
                // Remove active class from all buttons
                resourceFilterButtons.forEach(btn => {
                    btn.classList.remove('active');
                });

                // Add active class to clicked button
                this.classList.add('active');

                // Get filter value
                const filterValue = this.getAttribute('data-filter');

                // Filter items with animation
                resourceItems.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        // First make it invisible
                        item.style.opacity = '0';

                        // Then show it and fade in
                        setTimeout(() => {
                            item.style.display = 'block';
                            setTimeout(() => {
                                item.style.opacity = '1';
                            }, 50);
                        }, 300);
                    } else {
                        // Fade out and then hide
                        item.style.opacity = '0';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }


    // #region Auth (Login / Register)
    const isAuthPage = !!document.querySelector('.login-container') && !!document.querySelector('form.login-box');
    const isRegisterPage = isAuthPage && !!document.getElementById('confirm_password');
    const isLoginPage = isAuthPage && !isRegisterPage;

    if (isAuthPage) {
        // Perfecting the flow: Enforce HTTPS protocol for auth to prevent POST data loss during 301 redirects
        if (location.protocol === 'http:' && location.hostname !== 'localhost') {
            location.replace(window.location.href.replace('http:', 'https:'));
        }

        const authForm = document.querySelector('form.login-box');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        const showAuthError = (msg) => {
            console.error('Auth Error:', msg);
            if (window.utils?.showNotification) window.utils.showNotification(msg, 'error');
            else alert(msg);
        };

        const showAuthSuccess = (msg) => {
            if (window.utils?.showNotification) window.utils.showNotification(msg, 'success');
            else alert(msg);
        };

        if (isRegisterPage) {
            const fullNameInput = document.getElementById('fullname');
            const mobileInput = document.getElementById('mobile');
            const confirmPasswordInput = document.getElementById('confirm_password');

            authForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const full_name = fullNameInput?.value?.trim() || '';
                const email = emailInput?.value?.trim() || '';
                const mobile = mobileInput?.value?.trim() || '';
                const password = passwordInput?.value || '';
                const confirm_password = confirmPasswordInput?.value || '';

                if (!full_name || !email || !mobile || !password || !confirm_password) {
                    showAuthError('Please fill all required fields.');
                    return;
                }
                if (password !== confirm_password) {
                    showAuthError('Passwords do not match.');
                    return;
                }

                const prefix = window.location.pathname.includes('/customer/') ? '../' : '';
                try {
                    const resp = await fetch(prefix + 'api/auth/register.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ full_name, email, mobile, password, confirm_password })
                    });
                    const payload = await resp.json().catch(() => null);
                    if (!resp.ok || !payload || payload.status !== 'success') {
                        showAuthError(payload?.message || 'Registration failed.');
                        return;
                    }

                    showAuthSuccess('Account created successfully! Redirecting...');
                    setTimeout(() => {
                        window.location.href = payload.redirect || 'index.html';
                    }, 2000);
                } catch (err) {
                    showAuthError('Registration failed due to a network/server error.');
                }
            });
        }

        if (isLoginPage) {
            console.log('[OmniTeq] Login form detected. Attaching listener...');
            authForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('[OmniTeq] Login form submitted! Intercepting for toast...');
                const email = emailInput?.value?.trim() || '';
                const password = passwordInput?.value || '';

                if (!email || !password) {
                    showAuthError('Please enter email and password.');
                    return;
                }

                const prefix = window.location.pathname.includes('/customer/') ? '../' : '';
                try {
                    const resp = await fetch(prefix + 'api/auth/login.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ email, password })
                    });
                    const payload = await resp.json().catch(() => null);
                    if (!resp.ok || !payload || payload.status !== 'success') {
                        showAuthError(payload?.message || 'Login failed.');
                        return;
                    }

                    showAuthSuccess('Login successful! Redirecting...');
                    setTimeout(() => {
                        window.location.href = payload.redirect || 'index.html';
                    }, 2000);
                } catch (err) {
                    showAuthError('Login failed due to a network/server error.');
                }
            });
        }
    }
    // #endregion

    // Attach form handlers
    const contactForm = document.getElementById('contactForm');
    const consultationForm = document.getElementById('consultationForm');
    const quoteForm = document.getElementById('quoteForm');

    if (contactForm) {
        contactForm.addEventListener('submit', forms.submitContactForm.bind(forms));
    }

    if (consultationForm) {
        consultationForm.addEventListener('submit', forms.submitConsultationForm.bind(forms));
    }

    if (quoteForm) {
        quoteForm.addEventListener('submit', forms.submitQuoteForm.bind(forms));
    }
});

// Dynamic Products Highlight for Homepage
async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products-container');
    if (!container) return;

    try {
        const prefix = window.location.pathname.includes('/customer/') ? '../' : '';
        const resp = await fetch(prefix + 'api/products/get_products.php');
        const data = await resp.json();

        if (data.status === 'success' && data.products.length > 0) {
            container.innerHTML = data.products.map(p => `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${p.main_image || 'https://placehold.co/600x400?text=No+Image'}" alt="${p.name}">
                        ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
                    </div>
                    <div class="product-content">
                        <h3>${p.name}</h3>
                        <p>${p.description}</p>
                        <a href="products.html#${p.section_id || p.slug || ''}" class="btn-secondary">View Details</a>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-center w-100 p-5 text-muted">No featured products available at the moment.</p>';
        }
    } catch (err) {
        console.error('[OmniTeq] Error loading featured products:', err);
        container.innerHTML = '<p class="text-center w-100 p-5 text-danger">Failed to load featured products. Please try again later.</p>';
    }
}
