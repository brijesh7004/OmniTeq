/**
 * OmniTeq Cloud — shared UI layer.
 * Load AFTER js/cloud.js (it upgrades showToast / openModal / closeModal).
 *
 *   await UI.confirm({ title, message, confirmText, danger })  -> true | false
 *   await UI.prompt({ title, message, label, value, validate }) -> string | null
 *   await UI.busy(button, promiseOrFn)                          -> result
 *   UI.progress.start() / UI.progress.done()
 *   UI.skeletonRows(tbody, cols, rows)
 *
 * Automatic (no page changes needed):
 *   - page enter/leave transitions on internal links
 *   - top progress bar + spinner on the button that triggered an API call
 *   - toast / modal upgrades (Esc, backdrop click, focus trap, focus restore)
 *   - a11y fixes (aria-labels from title, skip link, main landmark, button types)
 *   - offline banner
 */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var esc = window.escapeHtml || function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    };

    /* ------------------------------------------------------------------ *
     * Top progress bar (driven by in-flight fetch calls)
     * ------------------------------------------------------------------ */
    var progress = (function () {
        var el, timer, value = 0, active = 0;
        function ensure() {
            if (el) return el;
            el = document.createElement('div');
            el.id = 'ui-progress';
            el.setAttribute('role', 'progressbar');
            el.setAttribute('aria-hidden', 'true');
            document.body.appendChild(el);
            return el;
        }
        function set(v) {
            value = v;
            ensure().style.transform = 'scaleX(' + v + ')';
        }
        function start() {
            if (!document.body) return;
            active++;
            if (active > 1) return;
            ensure();
            clearInterval(timer);
            el.classList.add('active');
            set(0.08);
            timer = setInterval(function () {
                // Ease towards 90% but never reach it until done()
                set(value + (0.9 - value) * 0.12);
            }, 250);
        }
        function done() {
            active = Math.max(0, active - 1);
            if (active > 0) return;
            clearInterval(timer);
            set(1);
            setTimeout(function () {
                if (active === 0 && el) { el.classList.remove('active'); set(0); }
            }, 320);
        }
        return { start: start, done: done };
    })();

    /* ------------------------------------------------------------------ *
     * Button busy state
     * ------------------------------------------------------------------ */
    function setBusy(btn, on) {
        if (!btn) return;
        if (on) {
            btn._uiBusy = (btn._uiBusy || 0) + 1;
            if (btn._uiBusy === 1) {
                btn.classList.add('is-loading');
                btn.setAttribute('aria-busy', 'true');
                btn._uiWasDisabled = btn.disabled;
                btn.disabled = true;
            }
        } else {
            btn._uiBusy = Math.max(0, (btn._uiBusy || 1) - 1);
            if (btn._uiBusy === 0) {
                btn.classList.remove('is-loading');
                btn.removeAttribute('aria-busy');
                // Only restore if the page did not change the state meanwhile
                if (!btn._uiWasDisabled) btn.disabled = false;
            }
        }
    }

    function busy(btn, work) {
        setBusy(btn, true);
        var p;
        try { p = typeof work === 'function' ? work() : work; } catch (e) { setBusy(btn, false); throw e; }
        return Promise.resolve(p).then(
            function (r) { setBusy(btn, false); return r; },
            function (e) { setBusy(btn, false); throw e; }
        );
    }

    /* ------------------------------------------------------------------ *
     * fetch hook: progress bar + spinner on the button that was clicked
     * ------------------------------------------------------------------ */
    var lastClick = { el: null, t: 0 };
    document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('button, .btn-primary, .btn-secondary, .btn-danger, .btn-icon, .icon-btn');
        if (b && !b.hasAttribute('data-no-autoload') && !b.classList.contains('modal-close-btn') &&
            !b.closest('.ui-dialog') && b.id !== 'themeToggle' && b.id !== 'sidebarToggle') {
            lastClick = { el: b, t: Date.now() };
        }
    }, true);

    if (window.fetch && !window.fetch._uiHooked) {
        var nativeFetch = window.fetch.bind(window);
        var hooked = function (input, init) {
            var url = typeof input === 'string' ? input : (input && input.url) || '';
            var quiet = /\/health(\?|$)/.test(url) || (init && init.quiet);
            var btn = null;
            if (!quiet) {
                progress.start();
                if (lastClick.el && Date.now() - lastClick.t < 400 && document.contains(lastClick.el) &&
                    !lastClick.el.disabled && !lastClick.el.querySelector('.bx-spin')) {
                    btn = lastClick.el;
                    setBusy(btn, true);
                }
            }
            var finish = function () {
                if (quiet) return;
                progress.done();
                if (btn) setBusy(btn, false);
            };
            return nativeFetch(input, init).then(
                function (r) { finish(); return r; },
                function (e) { finish(); throw e; }
            );
        };
        hooked._uiHooked = true;
        window.fetch = hooked;
    }

    /* ------------------------------------------------------------------ *
     * Toasts
     * ------------------------------------------------------------------ */
    var ICONS = { success: 'bx-check-circle', error: 'bx-error-circle', warning: 'bx-error', info: 'bx-info-circle' };

    window.showToast = function (message, type) {
        type = ICONS[type] ? type : 'success';
        var container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'false');
            document.body.appendChild(container);
        } else {
            container.removeAttribute('style'); // drop legacy inline styles
        }
        // Cap the stack
        while (container.children.length >= 4) container.removeChild(container.firstChild);

        var toast = document.createElement('div');
        toast.className = 'ui-toast ' + type;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

        var icon = document.createElement('i');
        icon.className = 'bx ' + ICONS[type];
        icon.setAttribute('aria-hidden', 'true');
        var text = document.createElement('span');
        text.textContent = message == null ? '' : String(message); // never innerHTML
        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'ui-toast-close';
        close.setAttribute('aria-label', 'Dismiss notification');
        close.innerHTML = '&times;';

        toast.appendChild(icon); toast.appendChild(text); toast.appendChild(close);
        container.appendChild(toast);
        requestAnimationFrame(function () { toast.classList.add('show'); });

        var remaining = type === 'error' ? 6500 : 4000, started, timer;
        function dismiss() {
            clearTimeout(timer);
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 300);
        }
        function arm() { started = Date.now(); timer = setTimeout(dismiss, remaining); }
        toast.addEventListener('mouseenter', function () { clearTimeout(timer); remaining -= Date.now() - started; });
        toast.addEventListener('mouseleave', function () { remaining = Math.max(remaining, 1200); arm(); });
        close.addEventListener('click', dismiss);
        arm();
    };

    /* ------------------------------------------------------------------ *
     * Modals: keep cloud.js API, add a11y + Esc + backdrop + focus trap
     * ------------------------------------------------------------------ */
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    var openers = {};

    function visibleFocusables(root) {
        return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), function (n) {
            return n.offsetParent !== null || n === document.activeElement;
        });
    }

    window.openModal = function (id) {
        var modal = document.getElementById(id);
        if (!modal) return;
        openers[id] = document.activeElement;
        modal.style.display = 'flex';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        var heading = modal.querySelector('h1, h2, h3');
        if (heading) {
            if (!heading.id) heading.id = id + '-title';
            modal.setAttribute('aria-labelledby', heading.id);
        }
        modal.removeAttribute('aria-hidden');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function () {
            modal.classList.add('active');
            // Retry: the backdrop is not focusable until its visibility transition begins,
            // which can lag on slow devices.
            (function tryFocus(n) {
                if (!modal.classList.contains('active') || modal.contains(document.activeElement)) return;
                var target = modal.querySelector('[autofocus]') ||
                    modal.querySelector('input:not([type="hidden"]):not([readonly]), select, textarea') ||
                    visibleFocusables(modal)[0];
                if (target) target.focus({ preventScroll: true });
                if (!modal.contains(document.activeElement) && n < 10) setTimeout(function () { tryFocus(n + 1); }, 60);
            })(0);
        });
    };

    window.closeModal = function (id) {
        var modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        setTimeout(function () {
            if (!modal.classList.contains('active')) modal.style.display = 'none';
            if (!document.querySelector('.modal-backdrop.active')) document.body.style.overflow = '';
        }, 200);
        var opener = openers[id];
        if (opener && document.contains(opener) && opener.focus) opener.focus({ preventScroll: true });
        delete openers[id];
    };

    function topModal() {
        var list = document.querySelectorAll('.modal-backdrop.active');
        return list.length ? list[list.length - 1] : null;
    }

    document.addEventListener('keydown', function (e) {
        var modal = topModal();
        if (!modal) return;
        if (e.key === 'Escape' && !modal.hasAttribute('data-modal-static')) {
            e.preventDefault();
            if (modal._uiDialogCancel) modal._uiDialogCancel(); else if (modal.id) window.closeModal(modal.id);
        } else if (e.key === 'Tab') {
            var items = visibleFocusables(modal);
            if (!items.length) return;
            var first = items[0], last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            else if (!modal.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        }
    });

    // Backdrop click closes — but only if the press also STARTED on the backdrop,
    // so selecting text inside a modal and releasing outside doesn't close it.
    var downOnBackdrop = null;
    document.addEventListener('mousedown', function (e) {
        downOnBackdrop = e.target.classList && e.target.classList.contains('modal-backdrop') ? e.target : null;
    });
    document.addEventListener('click', function (e) {
        var t = e.target;
        if (t.classList && t.classList.contains('modal-backdrop') && t === downOnBackdrop &&
            t.classList.contains('active') && !t.hasAttribute('data-modal-static')) {
            if (t._uiDialogCancel) t._uiDialogCancel(); else if (t.id) window.closeModal(t.id);
        }
    });

    /* ------------------------------------------------------------------ *
     * Confirm + Prompt dialogs (replace native confirm()/prompt())
     * ------------------------------------------------------------------ */
    function buildDialog(opts, withInput) {
        var danger = opts.danger ? 'danger' : (opts.warning ? 'warning' : '');
        var iconName = opts.icon || (opts.danger ? 'bx-trash' : (opts.warning ? 'bx-error' : (withInput ? 'bx-edit-alt' : 'bx-help-circle')));
        var uid = 'ui-dlg-' + Math.random().toString(36).slice(2, 8);

        var backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.style.display = 'flex';
        backdrop.setAttribute('role', opts.danger ? 'alertdialog' : 'dialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('aria-labelledby', uid + '-t');
        backdrop.setAttribute('aria-describedby', uid + '-d');

        backdrop.innerHTML =
            '<div class="modal-content ui-dialog ' + danger + '">' +
              '<div class="ui-dialog-icon" aria-hidden="true"><i class="bx ' + esc(iconName) + '"></i></div>' +
              '<h3 id="' + uid + '-t">' + esc(opts.title || (withInput ? 'Enter a value' : 'Are you sure?')) + '</h3>' +
              '<p id="' + uid + '-d">' + esc(opts.message || '') + '</p>' +
              (withInput
                ? '<input class="ui-dialog-input" type="' + esc(opts.type || 'text') + '" id="' + uid + '-i" ' +
                  'placeholder="' + esc(opts.placeholder || '') + '" value="' + esc(opts.value || '') + '" ' +
                  'aria-label="' + esc(opts.label || opts.title || 'Value') + '" autocomplete="off">' +
                  '<div class="ui-dialog-error" id="' + uid + '-e" role="alert"></div>'
                : '') +
              '<div class="modal-actions">' +
                '<button type="button" class="btn-secondary" data-act="cancel">' + esc(opts.cancelText || 'Cancel') + '</button>' +
                '<button type="button" class="' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-act="ok">' + esc(opts.confirmText || (opts.danger ? 'Delete' : 'Confirm')) + '</button>' +
              '</div>' +
            '</div>';
        return backdrop;
    }

    function showDialog(opts, withInput) {
        return new Promise(function (resolve) {
            var prevFocus = document.activeElement;
            var dlg = buildDialog(opts, withInput);
            document.body.appendChild(dlg);
            document.body.style.overflow = 'hidden';
            var input = dlg.querySelector('.ui-dialog-input');
            var errEl = dlg.querySelector('.ui-dialog-error');
            var okBtn = dlg.querySelector('[data-act="ok"]');
            var cancelBtn = dlg.querySelector('[data-act="cancel"]');
            var settled = false;

            function finish(result) {
                if (settled) return;
                settled = true;
                dlg.classList.remove('active');
                dlg.removeEventListener('keydown', onKey);
                setTimeout(function () {
                    dlg.remove();
                    if (!document.querySelector('.modal-backdrop.active')) document.body.style.overflow = '';
                }, 200);
                if (prevFocus && document.contains(prevFocus) && prevFocus.focus) prevFocus.focus({ preventScroll: true });
                resolve(result);
            }
            function submit() {
                if (!withInput) return finish(true);
                var v = input.value.trim();
                var msg = null;
                if (opts.required !== false && !v) msg = opts.requiredMessage || 'This field is required.';
                else if (typeof opts.validate === 'function') msg = opts.validate(v) || null;
                if (msg) {
                    errEl.textContent = msg;
                    input.classList.add('is-invalid');
                    input.setAttribute('aria-invalid', 'true');
                    input.classList.remove('ui-shake'); void input.offsetWidth; input.classList.add('ui-shake');
                    input.focus();
                    return;
                }
                finish(v);
            }
            function onKey(e) {
                if (e.key === 'Enter' && withInput && e.target === input) { e.preventDefault(); submit(); }
            }

            dlg._uiDialogCancel = function () { finish(withInput ? null : false); };
            okBtn.addEventListener('click', submit);
            cancelBtn.addEventListener('click', dlg._uiDialogCancel);
            dlg.addEventListener('keydown', onKey);
            if (input) input.addEventListener('input', function () {
                errEl.textContent = ''; input.classList.remove('is-invalid'); input.removeAttribute('aria-invalid');
            });

            requestAnimationFrame(function () {
                dlg.classList.add('active');
                // Destructive: focus Cancel so a stray Enter can't delete anything.
                var f = input || (opts.danger ? cancelBtn : okBtn);
                setTimeout(function () { f.focus({ preventScroll: true }); if (input) input.select(); }, 60);
            });
        });
    }

    function normalise(o, extra) {
        if (typeof o === 'string') o = { message: o };
        return Object.assign({}, extra || {}, o || {});
    }

    var UI = {
        progress: progress,
        busy: busy,
        setBusy: setBusy,
        confirm: function (o) { return showDialog(normalise(o), false); },
        confirmDelete: function (name, extra) {
            return showDialog(normalise(extra, {
                danger: true,
                title: 'Delete ' + (name ? '“' + name + '”' : 'this item') + '?',
                message: 'This action cannot be undone.',
                confirmText: 'Delete'
            }), false);
        },
        prompt: function (o) { return showDialog(normalise(o), true); },

        skeletonRows: function (tbody, cols, rows) {
            if (!tbody) return;
            var html = '';
            for (var r = 0; r < (rows || 4); r++) {
                html += '<tr class="skeleton-row" aria-hidden="true">';
                for (var c = 0; c < cols; c++) html += '<td><span class="skeleton" style="width:' + (55 + ((r + c) * 13) % 40) + '%"></span></td>';
                html += '</tr>';
            }
            tbody.innerHTML = html;
        },
        loadingBlock: function (text) {
            return '<div class="ui-loading" role="status"><i class="bx bx-loader-alt bx-spin ui-loading-icon" aria-hidden="true"></i><span>' + esc(text || 'Loading…') + '</span></div>';
        },
        emptyBlock: function (icon, title, hint) {
            return '<div class="ui-empty"><i class="bx ' + esc(icon || 'bx-folder-open') + '" aria-hidden="true"></i><strong>' + esc(title || 'Nothing here yet') + '</strong>' + (hint ? '<span>' + esc(hint) + '</span>' : '') + '</div>';
        }
    };
    window.UI = UI;

    /* ------------------------------------------------------------------ *
     * Page transitions for internal navigation
     * ------------------------------------------------------------------ */
    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
        var url;
        try { url = new URL(a.href, location.href); } catch (err) { return; }
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash
        if (reduceMotion) return;
        e.preventDefault();
        document.body.classList.add('ui-leaving');
        progress.start();
        setTimeout(function () { location.href = url.href; }, 170);
    });
    window.addEventListener('pageshow', function (e) {
        // Back/forward cache restores the "leaving" state — clear it.
        if (e.persisted) { document.body.classList.remove('ui-leaving'); }
    });

    /* ------------------------------------------------------------------ *
     * A11y + standards clean-up, run once the DOM is ready
     * ------------------------------------------------------------------ */
    function standardise() {
        // Main landmark + skip link
        var main = document.querySelector('main, .main-content, .auth-container');
        if (main) {
            if (!main.id) main.id = 'main-content';
            if (main.tagName !== 'MAIN' && !main.getAttribute('role')) main.setAttribute('role', 'main');
            if (!document.querySelector('.skip-link')) {
                var skip = document.createElement('a');
                skip.className = 'skip-link';
                skip.href = '#' + main.id;
                skip.textContent = 'Skip to main content';
                document.body.insertBefore(skip, document.body.firstChild);
            }
        }

        // Icon-only buttons/links get an accessible name from their title
        document.querySelectorAll('button, a[href]').forEach(function (el) {
            if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;
            if (el.textContent.trim()) return;
            var name = el.getAttribute('title');
            if (name) el.setAttribute('aria-label', name);
        });

        // Buttons outside forms should never submit anything
        document.querySelectorAll('button:not([type])').forEach(function (b) {
            if (!b.closest('form')) b.setAttribute('type', 'button');
        });

        // Decorative icons are hidden from screen readers
        document.querySelectorAll('i.bx, i.bxl, i.bxs').forEach(function (i) {
            if (!i.hasAttribute('aria-hidden')) i.setAttribute('aria-hidden', 'true');
        });

        // Modals default to hidden dialogs
        document.querySelectorAll('.modal-backdrop').forEach(function (m) {
            m.setAttribute('role', 'dialog');
            m.setAttribute('aria-modal', 'true');
            if (!m.classList.contains('active')) m.setAttribute('aria-hidden', 'true');
        });

        // Images: decorative fallback alt so they're never announced by filename
        document.querySelectorAll('img:not([alt])').forEach(function (img) { img.setAttribute('alt', ''); });

        // Tables: header cells get a scope
        document.querySelectorAll('th:not([scope])').forEach(function (th) { th.setAttribute('scope', 'col'); });

        // Optional: add meta theme-color / color-scheme if missing
        if (!document.querySelector('meta[name="theme-color"]')) {
            var m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#060913';
            document.head.appendChild(m);
        }
        if (!document.querySelector('link[rel~="icon"]')) {
            var l = document.createElement('link'); l.rel = 'icon'; l.type = 'image/svg+xml';
            l.href = 'images/logo/logo.svg';
            document.head.appendChild(l);
        }
    }

    // Elements injected later (tables rendered from API data) also need names.
    var pending = false;
    var mo = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        setTimeout(function () {
            pending = false;
            document.querySelectorAll('button:not([aria-label]):not([data-a11y]), a[href]:not([aria-label]):not([data-a11y])').forEach(function (el) {
                el.setAttribute('data-a11y', '1');
                if (!el.textContent.trim() && el.getAttribute('title')) el.setAttribute('aria-label', el.getAttribute('title'));
            });
            document.querySelectorAll('button:not([type])').forEach(function (b) {
                if (!b.closest('form')) b.setAttribute('type', 'button');
            });
            document.querySelectorAll('i.bx:not([aria-hidden])').forEach(function (i) { i.setAttribute('aria-hidden', 'true'); });
        }, 80);
    });

    /* ------------------------------------------------------------------ *
     * Offline banner
     * ------------------------------------------------------------------ */
    function initOffline() {
        var bar = document.createElement('div');
        bar.id = 'ui-offline';
        bar.setAttribute('role', 'status');
        bar.textContent = 'You are offline — changes cannot be saved until the connection returns.';
        document.body.appendChild(bar);
        function sync() { bar.classList.toggle('show', !navigator.onLine); }
        window.addEventListener('online', function () { sync(); window.showToast('Back online', 'success'); });
        window.addEventListener('offline', sync);
        sync();
    }

    // Avatar fallback: if the remote avatar service is unreachable, draw initials locally.
    document.addEventListener('error', function (e) {
        var img = e.target;
        if (!img || img.tagName !== 'IMG' || img._uiFallback || !img.closest('.user-profile, #user-avatar-img, .avatar')) return;
        img._uiFallback = true;
        var nameEl = document.querySelector('.user-name');
        var initial = ((nameEl && nameEl.textContent.trim().charAt(0)) || 'U').toUpperCase();
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#185FA5"/>' +
                  '<text x="50%" y="54%" font-family="Inter,Arial,sans-serif" font-size="36" font-weight="600" fill="#fff" text-anchor="middle" dominant-baseline="middle">' + esc(initial) + '</text></svg>';
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }, true);

    function init() {
        standardise();
        initOffline();
        mo.observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
