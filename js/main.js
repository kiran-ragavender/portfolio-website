/* ==========================================================
   main.js · site interactions

   1. Theme toggle (dark / light, remembered in this browser)
   2. Navigation: hidden on the hero, slides in from section 2,
      highlights the current section, mobile menu, scroll-to-top
   3. Scroll reveal animations
   4. Placeholder links (href="#") are hidden
   5. Contact form + mailbox animation
   6. Print resume buttons
   7. Footer year
   ========================================================== */
(function () {
    'use strict';

    /* ---- Contact settings: EDIT these ----
       endpoint: paste a Formspree URL (https://formspree.io/f/xxxxxxx) to
                 receive messages directly. Leave it empty and the form opens
                 the visitor's email app with the message pre-filled. */
    var CONTACT = {
        endpoint: '',
        email: 'kiranragavendershankar@gmail.com'
    };

    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');


    /* 1. Theme toggle
    ------------------------------------------------------------ */
    var themeButtons = document.querySelectorAll('[data-theme-toggle]');
    var themeMeta = document.querySelector('meta[name="theme-color"]');

    function applyTheme(theme, save) {
        root.setAttribute('data-theme', theme);
        if (save) {
            try { localStorage.setItem('theme', theme); } catch (e) { /* storage blocked: ignore */ }
        }
        var next = theme === 'dark' ? 'light' : 'dark';
        themeButtons.forEach(function (btn) {
            btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
        });
        if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#07060d' : '#f3efe6');
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
    }

    themeButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            applyTheme(current === 'dark' ? 'light' : 'dark', true);
        });
    });

    applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);


    /* 2. Navigation
    ------------------------------------------------------------ */
    var nav = document.getElementById('site-nav');
    var hero = document.querySelector('.hero');
    var menuBtn = document.querySelector('.nav-menu-btn');
    var navLinks = document.querySelectorAll('.nav-links a');
    var toTop = document.getElementById('to-top');

    function closeMenu() {
        nav.classList.remove('menu-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Open menu');
    }

    // Show the nav and scroll-to-top button once the hero has mostly scrolled away
    var navTicking = false;
    function updateNav() {
        var visible = window.scrollY > hero.offsetHeight - 160;
        nav.classList.toggle('is-visible', visible);
        if (toTop) toTop.classList.toggle('is-visible', visible);
        if (!visible) closeMenu();
        navTicking = false;
    }

    window.addEventListener('scroll', function () {
        if (!navTicking) {
            navTicking = true;
            requestAnimationFrame(updateNav);
        }
    }, { passive: true });
    updateNav();

    menuBtn.addEventListener('click', function () {
        var open = !nav.classList.contains('menu-open');
        nav.classList.toggle('menu-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    navLinks.forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
    });

    // Highlight the link for the section currently in view
    if ('IntersectionObserver' in window) {
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (link) {
                    var active = link.getAttribute('href') === '#' + entry.target.id;
                    link.classList.toggle('is-active', active);
                    if (active) link.setAttribute('aria-current', 'true');
                    else link.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        document.querySelectorAll('main section[id]').forEach(function (section) {
            sectionObserver.observe(section);
        });
    }


    /* 3. Scroll reveal
       Once an element has animated in, the reveal classes are removed
       so the element's own hover transitions take over again.
    ------------------------------------------------------------ */
    var revealEls = document.querySelectorAll('.reveal');

    function finishReveal(el) {
        var delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
        setTimeout(function () {
            el.classList.remove('reveal', 'is-in');
        }, 950 + delay * 1000);
    }

    if ('IntersectionObserver' in window && !reduceMotion.matches) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                finishReveal(entry.target);
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

        revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.remove('reveal'); });
    }


    /* 4. Placeholder links
       Any link left as href="#" (e.g. a Live Demo you haven't
       deployed yet, or a social profile) is hidden so visitors
       never hit a dead link. Add the real URL and it appears.
    ------------------------------------------------------------ */
    document.querySelectorAll('a[href="#"]').forEach(function (link) {
        link.classList.add('is-placeholder');
    });


    /* 5. Contact form
    ------------------------------------------------------------ */
    var form = document.getElementById('contact-form');
    var mailbox = document.getElementById('mailbox');
    var statusEl = document.getElementById('form-status');

    var validators = {
        name: function (v) { return v ? '' : 'Please enter your name.'; },
        email: function (v) {
            if (!v) return 'Please enter your email.';
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'That email doesn\'t look right.';
        },
        message: function (v) { return v.length >= 10 ? '' : 'Your message needs at least 10 characters.'; }
    };

    function validateField(input) {
        var check = validators[input.name];
        if (!check) return true;
        var error = check(input.value.trim());
        var field = input.closest('.field');
        field.classList.toggle('has-error', Boolean(error));
        input.setAttribute('aria-invalid', error ? 'true' : 'false');
        field.querySelector('.field-error').textContent = error;
        return !error;
    }

    function setStatus(message, type) {
        statusEl.textContent = message;
        statusEl.className = 'form-status' + (type ? ' is-' + type : '');
    }

    function playMailbox() {
        mailbox.classList.remove('is-sent');
        void mailbox.offsetWidth; // restart the animation
        mailbox.classList.add('is-sent');
        setTimeout(function () { mailbox.classList.remove('is-sent'); }, 4500);
    }

    if (form) {
        var inputs = form.querySelectorAll('input[name="name"], input[name="email"], textarea[name="message"]');

        // Re-check a field as the user fixes it
        inputs.forEach(function (input) {
            input.addEventListener('input', function () {
                if (input.closest('.field').classList.contains('has-error')) validateField(input);
            });
            input.addEventListener('blur', function () {
                if (input.value) validateField(input);
            });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var firstInvalid = null;
            inputs.forEach(function (input) {
                if (!validateField(input) && !firstInvalid) firstInvalid = input;
            });
            if (firstInvalid) {
                firstInvalid.focus();
                setStatus('Please fix the highlighted fields.', 'error');
                return;
            }

            var data = new FormData(form);
            if (data.get('_gotcha')) return; // bot

            var name = data.get('name').trim();
            var email = data.get('email').trim();
            var message = data.get('message').trim();
            var button = form.querySelector('button[type="submit"]');

            // No endpoint configured: hand off to the visitor's email app
            if (!CONTACT.endpoint) {
                var subject = 'Portfolio message from ' + name;
                var body = message + '\n\n- ' + name + ' (' + email + ')';
                window.location.href = 'mailto:' + CONTACT.email +
                    '?subject=' + encodeURIComponent(subject) +
                    '&body=' + encodeURIComponent(body);
                playMailbox();
                setStatus('Opening your email app to send this message...', 'success');
                return;
            }

            // Endpoint configured: send it directly
            button.disabled = true;
            setStatus('Transmitting...', '');

            fetch(CONTACT.endpoint, {
                method: 'POST',
                body: data,
                headers: { Accept: 'application/json' }
            }).then(function (response) {
                if (!response.ok) throw new Error('Request failed');
                playMailbox();
                form.reset();
                setStatus('Message received! I\'ll get back to you soon.', 'success');
            }).catch(function () {
                setStatus('Couldn\'t send right now. Please email ' + CONTACT.email + ' directly.', 'error');
            }).then(function () {
                button.disabled = false;
            });
        });
    }


    /* 6. Print resume
       Printing shows only the black & white resume (see section 13
       of styles.css), so viewers can print it or save it as a PDF.
    ------------------------------------------------------------ */
    document.querySelectorAll('[data-print-resume]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            closeMenu();
            window.print();
        });
    });


    /* 7. Footer year
    ------------------------------------------------------------ */
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();
