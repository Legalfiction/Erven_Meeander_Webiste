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
       4. FORM SUBMISSION (Web3Forms)
    ========================================= */
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('form-message');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verzenden...';
            btn.disabled = true;

            const formData = {
                access_key: 'a62b3f12-f90e-4b61-aba0-6071ddd3e65e',
                subject: 'Nieuwe aanmelding — Erve Meander',
                from_name: 'Erve Meander Website',
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                interest: document.getElementById('interest').value,
            };

            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();

                if (result.success) {
                    contactForm.reset();
                    contactForm.style.display = 'none';
                    formMessage.classList.remove('hidden');

                    setTimeout(() => {
                        formMessage.classList.add('hidden');
                        contactForm.style.display = 'block';
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }, 5000);
                } else {
                    throw new Error('Verzending mislukt');
                }
            } catch {
                btn.innerHTML = originalText;
                btn.disabled = false;
                alert('Er is iets misgegaan. Probeer het later opnieuw of mail naar aldo.huizinga@gmail.com');
            }
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
