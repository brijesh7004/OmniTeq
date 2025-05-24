// Initialize notification system
const notificationSystem = {
    container: null,
    timeout: null,

    init() {
        // Create container for notifications if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = 'position: fixed; top: 0; right: 0; z-index: 9999;';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'success') {
        this.init();
        console.log('Showing notification:', message, type);

        // Clear existing timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 400);
        });

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'alert');

        // Add icon and message
        const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        // Add to container
        this.container.appendChild(notification);

        // Force reflow and show notification
        notification.offsetHeight;
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Set timeout to remove
        this.timeout = setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 400);
            }
        }, 5000);
    }
};

// Make utils globally available
window.utils = {
    showNotification(message, type = 'success') {
        notificationSystem.show(message, type);
    }
};

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

            const response = await fetch(`api/${endpoint}.php`, {
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
        return forms.submitForm(event, 'contact', ['name', 'email', 'phone', 'subject', 'message']);
    },

    // Consultation form handler
    async submitConsultationForm(event) {
        return forms.submitForm(event, 'consultation', [
            'name', 'email', 'phone', 'consultation_type',
            'preferred_date', 'preferred_time', 'project_brief'
        ]);
    },

    // Quote form handler
    async submitQuoteForm(event) {
        event.preventDefault();
        return this.submitForm(event, 'quote', [
            'name', 'email', 'phone', 'project_type', 'project_details'
        ], true);
    }
};

// UI Components
const ui = {
    initMobileNav() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    },

    initStickyHeader() {
        const header = document.querySelector('header');
        const scrollThreshold = 100;

        window.addEventListener('scroll', () => {
            if (window.scrollY > scrollThreshold) {
                header.classList.add('sticky');
            } else {
                header.classList.remove('sticky');
            }
        });
    },

    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
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
            question.addEventListener('click', function() {
                this.classList.toggle('active');
                const answer = this.nextElementSibling;
                
                if (this.classList.contains('active')) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = 0;
                }
                
                // Close other FAQs
                faqQuestions.forEach(item => {
                    if (item !== this) {
                        item.classList.remove('active');
                        item.nextElementSibling.style.maxHeight = 0;
                    }
                });
            });
        });
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI components
    ui.initMobileNav();
    ui.initStickyHeader();
    ui.initSmoothScroll();
    ui.initFAQs();

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
            button.addEventListener('click', function() {
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
        fileUpload.addEventListener('change', function() {
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
    
    // Check on scroll
    window.addEventListener('scroll', handleRevealElements);

    // Updated thumbnail gallery functionality for product pages
    const thumbnailItems = document.querySelectorAll('.thumbnail-item');
    
    thumbnailItems.forEach(thumbItem => {
        thumbItem.addEventListener('click', function() {
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
            button.addEventListener('click', function() {
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

    // FAQ toggle functionality
    const faqQuestions = document.querySelectorAll('.faq-question');

    if (faqQuestions.length > 0) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
                // Toggle active class on the clicked question
                this.classList.toggle('active');
                
                // Get the answer element (next sibling of question)
                const answer = this.nextElementSibling;
                
                // Toggle answer visibility
                if (this.classList.contains('active')) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = 0;
                }
                
                // Close other open FAQs (optional, remove if you want multiple answers open at once)
                faqQuestions.forEach(item => {
                    if (item !== this) {
                        item.classList.remove('active');
                        item.nextElementSibling.style.maxHeight = 0;
                    }
                });
            });
        });
    }

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