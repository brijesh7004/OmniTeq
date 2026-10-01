/**
 * OmniTeq Cloud - global connection status banner.
 *
 * Injected by js/config.js on every page (config.js is the one script every
 * document loads), so no HTML file has to be touched to opt in.
 *
 * Shows a persistent full-width line at the very top of the screen:
 *   - amber : the browser itself is offline
 *   - red   : the browser is online but the gateway is not responding
 *   - hidden: online and the gateway answered /health
 *
 * The line stays visible until BOTH conditions are satisfied (online AND the
 * server answers), then disappears. It re-checks on online/offline events, on
 * tab focus, and on a 10-second poll.
 */
(function () {
    'use strict';
    if (window.__omniteqStatusInit) return;
    window.__omniteqStatusInit = true;

    var POLL_MS = 10000;
    var PROBE_TIMEOUT_MS = 5000;

    var OFFLINE_TEXT = 'Internet not available - please connect to the Internet.';
    var OFFLINE_BG = '#B45309'; // amber-700
    var SERVER_TEXT = 'Server not responding. Check your internet connection and try again after some time.';
    var SERVER_BG = '#B91C1C';  // red-700

    var banner = null;
    var probeTimer = null;
    var probing = false;

    function cfg() { return window.OMNITEQ_CONFIG || {}; }

    function healthUrl() {
        var c = cfg();
        var origin = c.origin || String(c.apiBaseUrl || '').replace(/\/api\/v1\/?$/, '');
        if (!origin) return '';
        return String(origin).replace(/\/+$/, '') + '/health';
    }

    function ensureBanner() {
        if (banner) return banner;
        if (!document.body) return null;
        banner = document.createElement('div');
        banner.id = 'omniteq-status-banner';
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');
        banner.style.cssText = [
            'position: fixed',
            'top: 0', 'left: 0', 'right: 0',
            'z-index: 2147483000',
            'display: none',
            'padding: 7px 14px',
            'text-align: center',
            'font: 600 13px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
            'letter-spacing: .01em',
            'color: #ffffff',
            'box-shadow: 0 1px 6px rgba(0, 0, 0, .28)',
            'pointer-events: none',
            '-webkit-font-smoothing: antialiased'
        ].join(';');
        document.body.appendChild(banner);
        return banner;
    }

    function show(text, bg) {
        var el = ensureBanner();
        if (!el) return;
        if (el.textContent !== text) el.textContent = text;
        el.style.background = bg;
        el.style.display = 'block';
    }

    function hide() {
        if (banner) banner.style.display = 'none';
    }

    function isOnline() {
        return navigator.onLine === undefined ? true : navigator.onLine;
    }

    function probe() {
        if (probing) return;
        var url = healthUrl();
        if (!url) { hide(); return; }

        probing = true;
        var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = setTimeout(function () { if (controller) controller.abort(); }, PROBE_TIMEOUT_MS);

        fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-store',
            signal: controller ? controller.signal : undefined
        })
            .then(function (res) { return !!(res && res.ok); })
            .catch(function () { return false; })
            .then(function (ok) {
                if (!isOnline()) { show(OFFLINE_TEXT, OFFLINE_BG); return; }
                if (ok) hide(); else show(SERVER_TEXT, SERVER_BG);
            })
            .finally(function () { clearTimeout(timer); probing = false; });
    }

    function evaluate() {
        if (!isOnline()) { show(OFFLINE_TEXT, OFFLINE_BG); return; }
        probe();
    }

    function start() {
        ensureBanner();
        evaluate();
        window.addEventListener('online', evaluate);
        window.addEventListener('offline', function () { show(OFFLINE_TEXT, OFFLINE_BG); });
        document.addEventListener('visibilitychange', function () { if (!document.hidden) evaluate(); });
        clearInterval(probeTimer);
        probeTimer = setInterval(function () { if (!document.hidden) evaluate(); }, POLL_MS);
    }

    // Exposed for diagnostics / manual re-checks.
    window.omniteqStatus = { check: evaluate, hide: hide };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
