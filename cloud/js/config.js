/**
 * OmniTeq Cloud — deployment configuration (SINGLE SOURCE OF TRUTH)
 * ============================================================================
 *
 * CHANGE THE GATEWAY IN ONE PLACE
 * -------------------------------
 * Edit only GATEWAY_ORIGIN below. Everything else in the project derives from it
 * at runtime:
 *
 *   REST base URL   ->  <GATEWAY_ORIGIN>/api/v1
 *   WebSocket URL   ->  wss://<host>/ws   (ws:// when the origin is http)
 *
 * Loaded before js/api.js on every page. Do not hardcode a gateway URL anywhere
 * else — read it from window.OMNITEQ_CONFIG instead.
 *
 * Examples
 *   Tailscale / hosted : 'https://omniteq-server.tail206540.ts.net'
 *   Local network      : 'http://192.168.1.100:3000'
 *   Localhost          : 'http://localhost:3000'
 */

(function () {
    'use strict';

    // ┌──────────────────────────────────────────────────────────────────────┐
    // │  EDIT THIS ONE LINE TO POINT THE WHOLE PROJECT AT A DIFFERENT HOST   │
    // └──────────────────────────────────────────────────────────────────────┘
    var GATEWAY_ORIGIN = 'https://omniteq-server.tail206540.ts.net';

    var API_PATH = '/api/v1';
    var WS_PATH = '/ws';

    /**
     * Origins that older builds shipped. A base URL persisted in localStorage
     * that points at one of these is discarded, so a stale saved value cannot
     * keep the console talking to a dead host after the default changes.
     */
    var LEGACY_ORIGINS = [
        '100.93.48.124:3000',
        '100.78.89.57:3000',
        '192.168.1.100:3000'
    ];

    function trimTrailingSlash(s) {
        return String(s || '').replace(/\/+$/, '');
    }

    var origin = trimTrailingSlash(GATEWAY_ORIGIN);

    // Accept the origin with or without an /api/v1 suffix, so pasting either
    // form into GATEWAY_ORIGIN produces the same result.
    var bareOrigin = origin.replace(/\/api\/v1$/, '');
    if (!/^https?:\/\//i.test(bareOrigin)) {
        bareOrigin = 'http://' + bareOrigin;
    }

    var apiBaseUrl = bareOrigin + API_PATH;

    // ws:// for plain http origins (a page served over https cannot open a ws://
    // socket — browsers block it as mixed content), wss:// for everything else.
    var wsScheme = /^http:\/\//i.test(bareOrigin) ? 'ws://' : 'wss://';
    var wsUrl = wsScheme + bareOrigin.replace(/^https?:\/\//i, '') + WS_PATH;

    // Host only, for display in the sidebar/badge.
    var host = bareOrigin.replace(/^https?:\/\//i, '');

    function isLegacy(value) {
        if (!value) return false;
        for (var i = 0; i < LEGACY_ORIGINS.length; i++) {
            if (value.indexOf(LEGACY_ORIGINS[i]) !== -1) return true;
        }
        return false;
    }

    // Drop persisted endpoints that point at a superseded host so the new
    // default takes effect without the user having to clear browser storage.
    try {
        if (isLegacy(localStorage.getItem('omniteq_api_baseUrl'))) {
            localStorage.removeItem('omniteq_api_baseUrl');
        }
        if (isLegacy(localStorage.getItem('omniteq_api_wsUrl'))) {
            localStorage.removeItem('omniteq_api_wsUrl');
        }
    } catch (e) {
        // localStorage can be unavailable (private mode); defaults still apply.
    }

    window.OMNITEQ_CONFIG = {
        /** e.g. "https://omniteq-server.tail206540.ts.net/api/v1" */
        apiBaseUrl: apiBaseUrl,

        /** e.g. "wss://omniteq-server.tail206540.ts.net/ws" */
        wsUrl: wsUrl,

        /** e.g. "omniteq-server.tail206540.ts.net" — for display only */
        host: host,

        /** e.g. "https://omniteq-server.tail206540.ts.net" — no trailing slash */
        origin: bareOrigin,

        /** Superseded hosts, exposed for diagnostics. */
        legacyOrigins: LEGACY_ORIGINS.slice(),

        /** True when `value` points at a superseded origin. */
        isLegacyOrigin: isLegacy,

        /**
         * Effective endpoints. A value saved from the Settings page overrides the
         * built-in default, unless it points at a superseded origin.
         */
        resolve: function () {
            var savedBase = null;
            var savedWs = null;
            try {
                savedBase = localStorage.getItem('omniteq_api_baseUrl');
                savedWs = localStorage.getItem('omniteq_api_wsUrl');
            } catch (e) { /* ignore */ }

            if (isLegacy(savedBase)) savedBase = null;
            if (isLegacy(savedWs)) savedWs = null;

            return {
                apiBaseUrl: trimTrailingSlash(savedBase) || apiBaseUrl,
                wsUrl: trimTrailingSlash(savedWs) || wsUrl
            };
        },

        /** Persist an override chosen in the Settings page. */
        save: function (baseUrl, wsUrl) {
            try {
                if (baseUrl) localStorage.setItem('omniteq_api_baseUrl', trimTrailingSlash(baseUrl));
                if (wsUrl) localStorage.setItem('omniteq_api_wsUrl', trimTrailingSlash(wsUrl));
            } catch (e) { /* ignore */ }
        },

        /** Remove any saved override, reverting to the values above. */
        reset: function () {
            try {
                localStorage.removeItem('omniteq_api_baseUrl');
                localStorage.removeItem('omniteq_api_wsUrl');
            } catch (e) { /* ignore */ }
        }
    };

    console.log('[OmniTeq] Gateway: ' + apiBaseUrl + '  |  Realtime: ' + wsUrl);

    /**
     * Fill any element marked with data-endpoint so documentation and marketing
     * pages show the live gateway instead of a hardcoded copy:
     *
     *   <code data-endpoint="api"></code>  -> https://host/api/v1
     *   <code data-endpoint="ws"></code>   -> wss://host/ws
     *   <code data-endpoint="host"></code> -> host
     *   <code data-endpoint="origin"></code> -> https://host
     *
     * Runs on DOMContentLoaded, and again immediately if the DOM is already ready.
     */
    function injectEndpoints() {
        var values = {
            api: apiBaseUrl,
            ws: wsUrl,
            host: host,
            origin: bareOrigin
        };
        var nodes = document.querySelectorAll('[data-endpoint]');
        for (var i = 0; i < nodes.length; i++) {
            var key = nodes[i].getAttribute('data-endpoint');
            if (Object.prototype.hasOwnProperty.call(values, key)) {
                nodes[i].textContent = values[key];
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectEndpoints);
    } else {
        injectEndpoints();
    }

    window.OMNITEQ_CONFIG.injectEndpoints = injectEndpoints;

    /**
     * Global connection-status banner (js/status.js). Injected here because
     * config.js is the one script every page loads, so the banner is project-wide
     * without editing each HTML document. The URL is derived from this script's
     * own location so it also works when config.js is referenced from a
     * subdirectory (e.g. ../js/config.js).
     */
    (function injectStatusScript() {
        if (document.getElementById('omniteq-status-script')) return;
        var selfUrl = (document.currentScript && document.currentScript.src) || 'js/config.js';
        var src = selfUrl.replace(/config\.js(\?.*)?$/, 'status.js');
        if (src === selfUrl) src = 'js/status.js';
        var s = document.createElement('script');
        s.id = 'omniteq-status-script';
        s.src = src;
        s.async = true;
        (document.head || document.documentElement).appendChild(s);
    })();
})();
