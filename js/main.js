// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Smooth scrolling for anchor links with header offset
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerHeight = document.querySelector('#header').offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = targetPosition - headerHeight;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Sticky header on scroll
    const header = document.querySelector('header');
    const scrollThreshold = 100;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }
    });
    
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
    
    // Form validation
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            let isValid = true;
            const requiredFields = contactForm.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            });
            
            // Email validation
            const emailField = contactForm.querySelector('input[type="email"]');
            if (emailField && emailField.value) {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(emailField.value)) {
                    isValid = false;
                    emailField.classList.add('error');
                }
            }
            
            if (isValid) {
                // Here you would typically send the form data to a server
                // For now, we'll just show a success message
                const formMessage = document.createElement('div');
                formMessage.className = 'form-message success';
                formMessage.textContent = 'Thank you for your message! We will get back to you soon.';
                
                contactForm.appendChild(formMessage);
                contactForm.reset();
                
                // Remove the message after 5 seconds
                setTimeout(() => {
                    formMessage.remove();
                }, 5000);
            }
        });
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
});