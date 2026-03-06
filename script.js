document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. SCROLL ANIMATIONS (Intersection Observer)
    ========================================= */
    const fadeElements = document.querySelectorAll('.fade-in, .bounce-on-scroll');

    const fadeObserverOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px', // Trigger slightly before element comes into view
        threshold: 0.1
    };

    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once visible if you don't want it to repeat
                observer.unobserve(entry.target);
            }
        });
    }, fadeObserverOptions);

    fadeElements.forEach(element => {
        fadeObserver.observe(element);
    });

    /* =========================================
       2. STICKY HEADER SCROLL EFFECT
    ========================================= */
    const header = document.getElementById('header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        }
    });

    /* =========================================
       3. SMOOTH NAVIGATION SCROLL (Adding offset)
    ========================================= */
    const navLinks = document.querySelectorAll('.main-nav a[href^="#"], .hero-content a[href^="#"]');

    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* =========================================
       4. FORM SUBMISSION (Mock)
    ========================================= */
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('form-message');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent page reload

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;

            // Show loading state
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verzenden...';
            btn.disabled = true;

            // Simulate server request
            setTimeout(() => {
                contactForm.reset();
                contactForm.style.display = 'none';
                formMessage.classList.remove('hidden');

                // Reset after 5 seconds
                setTimeout(() => {
                    formMessage.classList.add('hidden');
                    contactForm.style.display = 'block';
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 5000);
            }, 1500);
        });
    }

    /* =========================================
       5. FAQ ACCORDION LOGIC
    ========================================= */
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Close all other items
            const allItems = document.querySelectorAll('.faq-item');
            allItems.forEach(item => {
                item.classList.remove('active');
            });

            // Toggle clicked item
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
});
