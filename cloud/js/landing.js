/**
 * js/landing.js — behaviour that is specific to cloud_landing.html.
 *
 * Loaded AFTER js/cloud.js and js/ui.js, so it deliberately avoids
 * re-implementing anything they already own:
 *   - theme toggle            -> js/cloud.js (initTheme)
 *   - .animate-on-scroll      -> js/cloud.js (initScrollAnimations)
 *   - #hamburger / #mobileMenu open/close -> js/cloud.js
 *   - toasts / copy feedback  -> window.copyText (js/cloud.js), showToast (js/ui.js)
 *   - [data-endpoint] values  -> js/config.js (injectEndpoints)
 *
 * What it adds: compact nav on scroll, scroll-spy, offset-aware smooth
 * scrolling, animated spec counters, the code-example tabs, a copy button,
 * back-to-top, and the accessibility wiring the mobile sheet was missing.
 *
 * Everything lives in an IIFE and exports no globals.
 */
(function () {
    'use strict';

    if (!document.body || !document.body.classList.contains('landing-page')) return;

    var reduceMotion = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : { matches: false };

    var NAV_OFFSET = 96;     // fixed pill nav + breathing room
    var MOBILE_BREAKPOINT = 992;

    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    /* ---------------------------------------------------------------- *
     * 1. Compact nav + back-to-top + scroll-spy (one throttled pass)
     * ---------------------------------------------------------------- */
    function initScrollUi() {
        var nav = document.getElementById('landingNav');
        var toTop = document.getElementById('backToTop');
        var navLinks = Array.prototype.slice.call(
            document.querySelectorAll('.nav-links-desktop a[href^="#"]')
        );

        // Resolve each in-page nav link to its target section once.
        var targets = navLinks
            .map(function (link) {
                var el = document.getElementById(link.getAttribute('href').slice(1));
                return el ? { link: link, el: el } : null;
            })
            .filter(Boolean);

        var queued = false;

        function update() {
            queued = false;
            var y = window.pageYOffset || document.documentElement.scrollTop || 0;

            if (nav) nav.classList.toggle('scrolled', y > 40);
            if (toTop) toTop.classList.toggle('is-visible', y > 600);

            if (!targets.length) return;

            // The active section is the last one whose top has passed the nav.
            var current = null;
            for (var i = 0; i < targets.length; i++) {
                if (targets[i].el.getBoundingClientRect().top - NAV_OFFSET - 12 <= 0) {
                    current = targets[i];
                }
            }
            // Near the very bottom the last section may never cross the line.
            var atBottom = (window.innerHeight + y) >= (document.body.scrollHeight - 2);
            if (atBottom) current = targets[targets.length - 1];

            for (var j = 0; j < targets.length; j++) {
                targets[j].link.classList.toggle('active', targets[j] === current);
            }
        }

        function request() {
            if (queued) return;
            queued = true;
            window.requestAnimationFrame(update);
        }

        window.addEventListener('scroll', request, { passive: true });
        window.addEventListener('resize', request, { passive: true });
        update();

        if (toTop) {
            toTop.addEventListener('click', function () {
                window.scrollTo({
                    top: 0,
                    behavior: reduceMotion.matches ? 'auto' : 'smooth'
                });
            });
        }
    }

    /* ---------------------------------------------------------------- *
     * 2. Offset-aware smooth scrolling for in-page links
     *    Delegated on document so it runs after the direct listeners
     *    js/cloud.js attaches to .mobile-nav-link (which close the sheet).
     * ---------------------------------------------------------------- */
    function initAnchorScroll() {
        document.addEventListener('click', function (e) {
            var link = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
            if (!link) return;

            // The skip link injected by js/ui.js must keep its native behaviour,
            // otherwise focus never moves into <main> for keyboard users.
            if (link.classList.contains('skip-link')) return;

            var hash = link.getAttribute('href');
            if (!hash || hash === '#' || hash.length < 2) return;

            var target = document.getElementById(hash.slice(1));
            if (!target) return;

            e.preventDefault();

            var top = target.getBoundingClientRect().top
                + (window.pageYOffset || document.documentElement.scrollTop || 0)
                - NAV_OFFSET;

            window.scrollTo({
                top: top < 0 ? 0 : top,
                behavior: reduceMotion.matches ? 'auto' : 'smooth'
            });

            // Keep the URL shareable without triggering a second native jump.
            if (window.history && window.history.pushState) {
                window.history.pushState(null, '', hash);
            }
        });
    }

    /* ---------------------------------------------------------------- *
     * 3. Mobile sheet: a11y state, Esc, outside click, resize cleanup.
     *    js/cloud.js owns the actual open/close toggle; we only ever
     *    close, so the two never fight over the same click.
     * ---------------------------------------------------------------- */
    function initMobileNavA11y() {
        var btn = document.getElementById('hamburger');
        var menu = document.getElementById('mobileMenu');
        if (!btn || !menu) return;

        function syncLabel() {
            var open = btn.classList.contains('active') || menu.classList.contains('active');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            btn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
            return open;
        }

        function close() {
            btn.classList.remove('active');
            menu.classList.remove('active');
            syncLabel();
        }

        // Runs after the toggle in js/cloud.js, so the class state is final.
        btn.addEventListener('click', syncLabel);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menu.classList.contains('active')) {
                close();
                btn.focus();
            }
        });

        document.addEventListener('click', function (e) {
            if (!menu.classList.contains('active')) return;
            if (menu.contains(e.target) || btn.contains(e.target)) return;
            close();
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > MOBILE_BREAKPOINT && menu.classList.contains('active')) {
                close();
            }
        }, { passive: true });

        syncLabel();
    }

    /* ---------------------------------------------------------------- *
     * 4. Animated spec counters
     * ---------------------------------------------------------------- */
    function initCounters() {
        var items = Array.prototype.slice.call(document.querySelectorAll('[data-count-to]'));
        if (!items.length) return;

        function format(el, value) {
            var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
            var text = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));

            if (el.getAttribute('data-separator')) {
                var parts = text.split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                text = parts.join('.');
            }
            return (el.getAttribute('data-prefix') || '') + text + (el.getAttribute('data-suffix') || '');
        }

        function run(el) {
            if (el.dataset.counted) return;
            el.dataset.counted = '1';

            var to = parseFloat(el.getAttribute('data-count-to'));
            if (isNaN(to)) return;

            // The markup already contains the final value, so a reduced-motion
            // or no-IntersectionObserver visitor simply keeps it.
            if (reduceMotion.matches) {
                el.textContent = format(el, to);
                return;
            }

            var duration = 1400;
            var started = null;

            function step(now) {
                if (started === null) started = now;
                var p = Math.min((now - started) / duration, 1);
                var eased = 1 - Math.pow(1 - p, 3);          // easeOutCubic
                el.textContent = format(el, to * eased);
                if (p < 1) window.requestAnimationFrame(step);
            }

            el.textContent = format(el, 0);
            window.requestAnimationFrame(step);
        }

        if (!('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.textContent = format(el, parseFloat(el.getAttribute('data-count-to'))); });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                run(entry.target);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.4 });

        items.forEach(function (el) { observer.observe(el); });
    }

    /* ---------------------------------------------------------------- *
     * 5. Code example tabs + copy button
     * ---------------------------------------------------------------- */
    function initCodeTabs() {
        var tabs = Array.prototype.slice.call(document.querySelectorAll('.code-tab'));
        var panes = Array.prototype.slice.call(document.querySelectorAll('.code-pane'));
        if (!tabs.length || !panes.length) return;

        function select(tab) {
            tabs.forEach(function (t) {
                var on = t === tab;
                t.classList.toggle('is-active', on);
                t.setAttribute('aria-selected', on ? 'true' : 'false');
                t.tabIndex = on ? 0 : -1;
            });
            panes.forEach(function (p) {
                var on = p.id === tab.getAttribute('aria-controls');
                p.classList.toggle('is-active', on);
                if (on) { p.removeAttribute('hidden'); } else { p.setAttribute('hidden', ''); }
            });
        }

        tabs.forEach(function (tab, index) {
            tab.addEventListener('click', function () { select(tab); });

            // Standard tablist keyboard support.
            tab.addEventListener('keydown', function (e) {
                var next = null;
                if (e.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
                else if (e.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
                else if (e.key === 'Home') next = tabs[0];
                else if (e.key === 'End') next = tabs[tabs.length - 1];
                if (!next) return;
                e.preventDefault();
                select(next);
                next.focus();
            });
        });

        var active = tabs.filter(function (t) { return t.classList.contains('is-active'); })[0] || tabs[0];
        select(active);

        var copyBtn = document.getElementById('codeCopy');
        if (!copyBtn) return;

        copyBtn.addEventListener('click', function () {
            var pane = panes.filter(function (p) { return p.classList.contains('is-active'); })[0];
            var code = pane && pane.querySelector('code');
            if (!code) return;

            // Reuse the platform helper: it handles insecure contexts and toasts.
            if (typeof window.copyText === 'function') {
                window.copyText(code.innerText, 'Code example');
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(code.innerText);
            }

            var label = copyBtn.querySelector('span');
            copyBtn.classList.add('is-copied');
            if (label) label.textContent = 'Copied';
            window.setTimeout(function () {
                copyBtn.classList.remove('is-copied');
                if (label) label.textContent = 'Copy';
            }, 1800);
        });
    }

    onReady(function () {
        initScrollUi();
        initAnchorScroll();
        initMobileNavA11y();
        initCounters();
        initCodeTabs();
    });
})();
