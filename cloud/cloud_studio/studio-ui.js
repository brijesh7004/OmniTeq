/**
 * OmniTeq Cloud Studio — shared UI layer.
 * Load BEFORE app.js. app.js delegates showToast / openModal / closeModal to it.
 *
 *   StudioUI.toast(message, type)        type: success | error | warning | info (auto-detected if omitted)
 *   await StudioUI.confirm({...})        -> true | false
 *   StudioUI.openModal(id) / closeModal(id)
 *   StudioUI.busy(button, promiseOrFn)
 *   StudioUI.bootDone()                  hide the boot splash
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  /* -------------------- Progress bar -------------------- */
  var progress = (function () {
    var el, timer, value = 0, active = 0;
    function ensure() {
      if (el) return el;
      el = document.createElement('div');
      el.id = 'sui-progress';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      return el;
    }
    function set(v) { value = v; ensure().style.transform = 'scaleX(' + v + ')'; }
    return {
      start: function () {
        if (!document.body) return;
        active++;
        if (active > 1) return;
        ensure(); clearInterval(timer);
        el.classList.add('active'); set(0.08);
        timer = setInterval(function () { set(value + (0.9 - value) * 0.12); }, 250);
      },
      done: function () {
        active = Math.max(0, active - 1);
        if (active > 0) return;
        clearInterval(timer); set(1);
        setTimeout(function () { if (active === 0 && el) { el.classList.remove('active'); set(0); } }, 320);
      }
    };
  })();

  /* -------------------- Button busy -------------------- */
  function setBusy(btn, on) {
    if (!btn) return;
    if (on) {
      btn._suiBusy = (btn._suiBusy || 0) + 1;
      if (btn._suiBusy === 1) {
        btn._suiWasDisabled = btn.disabled;
        btn.classList.add('is-busy');
        btn.setAttribute('aria-busy', 'true');
        btn.disabled = true;
      }
    } else {
      btn._suiBusy = Math.max(0, (btn._suiBusy || 1) - 1);
      if (btn._suiBusy === 0) {
        btn.classList.remove('is-busy');
        btn.removeAttribute('aria-busy');
        if (!btn._suiWasDisabled) btn.disabled = false;
      }
    }
  }
  function busy(btn, work) {
    setBusy(btn, true);
    var p;
    try { p = typeof work === 'function' ? work() : work; } catch (e) { setBusy(btn, false); throw e; }
    return Promise.resolve(p).then(function (r) { setBusy(btn, false); return r; },
                                   function (e) { setBusy(btn, false); throw e; });
  }

  /* -------------------- fetch hook: progress bar (+ spinner for buttons app.js doesn't handle) -------------------- */
  if (window.fetch && !window.fetch._suiHooked) {
    var nativeFetch = window.fetch.bind(window);
    var hooked = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var quiet = /\/health(\?|$)/.test(url);
      if (!quiet) progress.start();
      var finish = function () { if (!quiet) progress.done(); };
      return nativeFetch(input, init).then(function (r) { finish(); return r; },
                                           function (e) { finish(); throw e; });
    };
    hooked._suiHooked = true;
    window.fetch = hooked;
  }

  /* -------------------- Toasts -------------------- */
  var ICONS = {
    success: '<path d="M20 6 9 17l-5-5"/>',
    error: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    warning: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
  };
  // app.js calls showToast(message) with no type — infer it from the wording.
  function inferType(msg) {
    var m = String(msg || '').toLowerCase();
    if (/(fail|error|invalid|could not|unable|unavailable|not found|rejected|denied|unreachable)/.test(m)) return 'error';
    if (/(warning|some failures|check each|missing|required|cleared)/.test(m)) return 'warning';
    if (/(added|created|removed|saved|copied|generated|provisioned|success|registered|complete|reset|restored|downloaded|exported|imported|loaded)/.test(m)) return 'success';
    return 'info';
  }
  function toast(message, type) {
    type = ICONS[type] ? type : inferType(message);
    var stack = document.getElementById('sui-toasts');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'sui-toasts';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    while (stack.children.length >= 4) stack.removeChild(stack.firstChild);

    var t = document.createElement('div');
    t.className = 'sui-toast ' + type;
    t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    t.innerHTML = '<svg class="sui-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[type] + '</svg>';
    var span = document.createElement('span');
    span.textContent = message == null ? '' : String(message); // never innerHTML
    var close = document.createElement('button');
    close.type = 'button'; close.className = 'sui-toast-close';
    close.setAttribute('aria-label', 'Dismiss notification'); close.innerHTML = '&times;';
    t.appendChild(span); t.appendChild(close);
    stack.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });

    var remaining = type === 'error' ? 6500 : 3800, started, timer;
    function dismiss() { clearTimeout(timer); t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }
    function arm() { started = Date.now(); timer = setTimeout(dismiss, remaining); }
    t.addEventListener('mouseenter', function () { clearTimeout(timer); remaining -= Date.now() - started; });
    t.addEventListener('mouseleave', function () { remaining = Math.max(remaining, 1200); arm(); });
    close.addEventListener('click', dismiss);
    arm();
  }

  /* -------------------- Scroll lock -------------------- */
  // Keeps <body> locked exactly while a modal is open, whoever toggles the class.
  function syncModalLock() {
    if (!document.body) return;
    var anyOpen = !!document.querySelector(".modal-overlay.open");
    document.body.classList.toggle("sui-modal-open", anyOpen);
    // Clear any inline lock left behind by an older build of this file.
    if (!anyOpen && document.body.style.overflow === "hidden") document.body.style.overflow = "";
  }
  function watchModalLock() {
    if (!document.body || typeof MutationObserver !== "function") return;
    var sync = function () { syncModalLock(); };
    new MutationObserver(sync).observe(document.body, {
      // `style` matters as well: a leftover inline overflow lock must be able to
      // trigger a re-sync the moment it appears.
      childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"]
    });
    sync();
  }

  /* -------------------- Modals -------------------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var openers = {};
  function focusables(root) {
    return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), function (n) { return n.offsetParent !== null; });
  }
  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    openers[id] = document.activeElement;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    var h = modal.querySelector('h1, h2, h3');
    if (h) { if (!h.id) h.id = id + '-title'; modal.setAttribute('aria-labelledby', h.id); }
    modal.removeAttribute('aria-hidden');
    modal.classList.add('open');
    syncModalLock();
    focusWhenReady(modal);
  }
  // The overlay only becomes focusable once its visibility transition has started, which can lag
  // on slow devices — retry a few times instead of assuming a fixed delay is enough.
  function focusWhenReady(modal, tries) {
    tries = tries || 0;
    if (!modal.classList.contains('open') || modal.contains(document.activeElement)) return;
    var target = modal.querySelector('[autofocus]') || modal.querySelector('input:not([type="hidden"]):not([readonly]), select, textarea') || focusables(modal)[0];
    if (target) target.focus({ preventScroll: true });
    if (!modal.contains(document.activeElement) && tries < 10) setTimeout(function () { focusWhenReady(modal, tries + 1); }, 60);
  }
  function closeModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    syncModalLock();
    var op = openers[id];
    if (op && document.contains(op) && op.focus) op.focus({ preventScroll: true });
    delete openers[id];
  }
  function topModal() {
    var l = document.querySelectorAll('.modal-overlay.open');
    return l.length ? l[l.length - 1] : null;
  }
  document.addEventListener('keydown', function (e) {
    var modal = topModal();
    if (!modal) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (modal._suiCancel) return modal._suiCancel();
      // The session-choice prompt must be answered: Esc resolves it as "Previous Session" (non-destructive)
      if (modal.dataset.awaitingChoice === '1') { var b = document.getElementById('btn-session-previous'); if (b) b.click(); return; }
      closeModal(modal.id);
    } else if (e.key === 'Tab') {
      var items = focusables(modal);
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    }
  });

  /* -------------------- Confirm dialog -------------------- */
  var DIALOG_ICONS = {
    danger: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    warning: ICONS.warning,
    info: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
  };
  function confirmDialog(o) {
    if (typeof o === 'string') o = { message: o };
    o = o || {};
    return new Promise(function (resolve) {
      var prev = document.activeElement;
      var uid = 'sui-dlg-' + Math.random().toString(36).slice(2, 8);
      var kind = o.danger ? 'danger' : (o.warning ? 'warning' : '');
      var el = document.createElement('div');
      el.className = 'modal-overlay';
      el.setAttribute('role', o.danger ? 'alertdialog' : 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', uid + '-t');
      el.setAttribute('aria-describedby', uid + '-d');
      el.innerHTML =
        '<div class="modal-window modal-window-medium sui-dialog ' + kind + '">' +
          '<div class="modal-body-pad">' +
            '<div class="sui-dialog-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              (DIALOG_ICONS[kind || 'info']) + '</svg></div>' +
            '<h2 id="' + uid + '-t">' + esc(o.title || 'Are you sure?') + '</h2>' +
            '<p id="' + uid + '-d">' + esc(o.message || '') + '</p>' +
            '<div class="sui-dialog-actions">' +
              '<button type="button" class="btn btn-secondary" data-act="cancel">' + esc(o.cancelText || 'Cancel') + '</button>' +
              '<button type="button" class="btn ' + (o.danger ? 'btn-danger-solid' : 'btn-primary') + '" data-act="ok">' + esc(o.confirmText || 'Confirm') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(el);
      var ok = el.querySelector('[data-act="ok"]'), cancel = el.querySelector('[data-act="cancel"]');
      var done = false, downOnBackdrop = false;
      function finish(v) {
        if (done) return; done = true;
        el.classList.remove('open');
        setTimeout(function () { el.remove(); syncModalLock(); }, 260);
        if (prev && document.contains(prev) && prev.focus) prev.focus({ preventScroll: true });
        resolve(v);
      }
      el._suiCancel = function () { finish(false); };
      ok.addEventListener('click', function () { finish(true); });
      cancel.addEventListener('click', el._suiCancel);
      el.addEventListener('mousedown', function (e) { downOnBackdrop = e.target === el; });
      el.addEventListener('click', function (e) { if (e.target === el && downOnBackdrop) finish(false); });
      requestAnimationFrame(function () {
        el.classList.add('open');
        syncModalLock();
        // Destructive: focus Cancel so a stray Enter cannot discard work.
        setTimeout(function () { (o.danger ? cancel : ok).focus({ preventScroll: true }); }, 60);
      });
    });
  }

  /* -------------------- Boot splash -------------------- */
  function bootSplash() {
    var s = document.createElement('div');
    s.id = 'sui-boot'; s.setAttribute('role', 'status');
    s.innerHTML = '<div class="sui-spinner" aria-hidden="true"></div><span>Loading Cloud Studio…</span>';
    document.body.appendChild(s);
    // Never trap the user behind the splash if boot stalls.
    setTimeout(bootDone, 6000);
  }
  function bootDone() {
    var s = document.getElementById('sui-boot');
    if (!s || s.classList.contains('hide')) return;
    s.classList.add('hide');
    setTimeout(function () { s.remove(); }, 400);
  }

  /* -------------------- a11y / standards clean-up -------------------- */
  function standardise() {
    var main = document.querySelector('main, .studio-container');
    if (main) {
      if (!main.id) main.id = 'main-content';
      if (main.tagName !== 'MAIN' && !main.getAttribute('role')) main.setAttribute('role', 'main');
      if (!document.querySelector('.skip-link')) {
        var a = document.createElement('a');
        a.className = 'skip-link'; a.href = '#' + main.id; a.textContent = 'Skip to main content';
        document.body.insertBefore(a, document.body.firstChild);
      }
    }
    var head = document.querySelector('header.top-nav');
    if (head && !head.getAttribute('role')) head.setAttribute('role', 'banner');

    document.querySelectorAll('button, a[href]').forEach(function (el) {
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;
      var name = el.getAttribute('title');
      if (name && !el.textContent.replace(/[^\w]/g, '').trim()) el.setAttribute('aria-label', name);
    });
    document.querySelectorAll('button:not([type])').forEach(function (b) { if (!b.closest('form')) b.setAttribute('type', 'button'); });
    // Decorative inline SVG icons
    document.querySelectorAll('svg:not([aria-hidden]):not([role])').forEach(function (s) { s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false'); });

    // Mode switcher is a toggle group
    var toggle = document.querySelector('.view-mode-toggle');
    if (toggle) {
      toggle.setAttribute('role', 'group'); toggle.setAttribute('aria-label', 'View mode');
      var sync = function () { toggle.querySelectorAll('.mode-btn').forEach(function (b) { b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false'); }); };
      sync();
      new MutationObserver(sync).observe(toggle, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }

    // Labels without `for` that wrap or precede a control get associated
    document.querySelectorAll('label:not([for])').forEach(function (l) {
      if (l.querySelector('input, select, textarea')) return;
      var c = l.nextElementSibling && l.nextElementSibling.matches('input, select, textarea') ? l.nextElementSibling
            : (l.parentElement && l.parentElement.querySelector('input, select, textarea'));
      if (c && c.id) l.setAttribute('for', c.id);
    });

    if (!document.querySelector('meta[name="theme-color"]')) { var m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#060913'; document.head.appendChild(m); }
    if (!document.querySelector('link[rel~="icon"]')) { var l = document.createElement('link'); l.rel = 'icon'; l.type = 'image/svg+xml'; l.href = '../images/logo/logo.svg'; document.head.appendChild(l); }
  }

  // Dynamically rendered lists (sensors, rules, commands) get the same treatment.
  var pending = false;
  var mo = new MutationObserver(function () {
    if (pending) return; pending = true;
    setTimeout(function () {
      pending = false;
      document.querySelectorAll('button:not([aria-label]), a[href]:not([aria-label])').forEach(function (el) {
        var t = el.getAttribute('title');
        if (t && !el.textContent.replace(/[^\w]/g, '').trim()) el.setAttribute('aria-label', t);
      });
      document.querySelectorAll('button:not([type])').forEach(function (b) { if (!b.closest('form')) b.setAttribute('type', 'button'); });
      document.querySelectorAll('svg:not([aria-hidden]):not([role])').forEach(function (s) { s.setAttribute('aria-hidden', 'true'); });
    }, 80);
  });

  /* -------------------- Offline banner -------------------- */
  function initOffline() {
    var bar = document.createElement('div');
    bar.id = 'sui-offline'; bar.setAttribute('role', 'status');
    bar.textContent = 'You are offline — cloud sync and provisioning are unavailable. Firmware generation still works.';
    document.body.appendChild(bar);
    function sync() { bar.classList.toggle('show', !navigator.onLine); }
    window.addEventListener('online', function () { sync(); toast('Back online', 'success'); });
    window.addEventListener('offline', sync);
    sync();
  }

  function init() {
    standardise();
    initOffline();
    watchModalLock();
    mo.observe(document.body, { childList: true, subtree: true });
    // Fallback: hide the splash once everything has loaded, even if app.js never calls bootDone().
    window.addEventListener('load', function () { setTimeout(bootDone, 400); });
  }

  window.StudioUI = {
    toast: toast, confirm: confirmDialog, openModal: openModal, closeModal: closeModal,
    busy: busy, setBusy: setBusy, progress: progress, bootDone: bootDone,
    syncModalLock: syncModalLock
  };

  if (document.readyState === 'loading') { bootSplash_safe(); document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
  function bootSplash_safe() {
    // <body> may not exist yet when this script is parsed from <head>; wait for it.
    if (document.body) bootSplash();
    else document.addEventListener('DOMContentLoaded', bootSplash);
  }
})();
