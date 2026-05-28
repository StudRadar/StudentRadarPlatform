// Shared utilities for header pill sync, dropdown, logout, and counters.
// Single source of truth across all pages.
(function (global) {
  'use strict';

  var PROFILE_KEY = 'studradar_profile_v1';
  var SESSION_KEY = 'studradar_session';

  // Mock counters — single config point for all pages.
  // When real backend exists, swap this with API call result.
  var MOCK_COUNTERS = {
    myTasks: 4,
    chats: 3,
    walletRub: 500,
    unreadWork: 3   // бейдж «В работе» в сайдбаре кабинета
  };

  // First name only, no surname initial.
  function firstName(full) {
    if (!full) return '';
    return full.trim().split(/\s+/)[0] || '';
  }

  function readProfile() {
    try {
      var raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.profile ? parsed.profile : null;
    } catch (e) { return null; }
  }

  function readSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function applyHeaderName(name) {
    var nm = document.querySelector('.feed-user-name');
    if (nm) nm.textContent = name || '';
    var ec = document.querySelector('.ec-user-name');
    if (ec && name) ec.textContent = name;
  }

  function applyHeaderAvatar(photo) {
    var av = document.querySelector('.feed-user-avatar');
    if (!av) return;
    av.style.backgroundImage    = photo ? 'url("' + photo + '")' : '';
    av.style.backgroundSize     = photo ? 'cover' : '';
    av.style.backgroundPosition = photo ? 'center' : '';
  }

  function readPhone() {
    try {
      var raw = localStorage.getItem('studradar_docs_v1');
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.phone) return d.phone;
      }
    } catch (e) {}
    return '';
  }

  // Set phone (bypass firstName which splits on spaces).
  function applyPhone() {
    var nm = document.querySelector('.feed-user-name');
    if (nm) nm.textContent = readPhone();
  }

  // Public API: sync header pill from current localStorage state.
  // When called with args, explicit name/photo override — empty name falls back to phone for students.
  // When called without args, reads profile from storage.
  function syncHeaderPill(nameOverride, photoOverride) {
    if (arguments.length >= 1) {
      var s = readSession();
      if (!nameOverride && (!s || s.role === 'student')) {
        applyPhone();
      } else {
        applyHeaderName(nameOverride || '');
      }
      applyHeaderAvatar(photoOverride || '');
      return;
    }
    var s2 = readSession();
    var p = readProfile();
    if (s2 && s2.role === 'student') {
      // У студента имя в шапке появляется только после загрузки справки об обучении
      var certOk = !!(s2 && s2.certConfirmed);
      try {
        if (!certOk) {
          var _d = JSON.parse(localStorage.getItem('studradar_docs_v1') || '{}');
          if (_d.certConfirmed) certOk = true;
        }
      } catch(eDoc) {}
      if (certOk) {
        applyHeaderName((p && p.name) || 'Анна Петрова');
      } else {
        applyPhone();
      }
    } else if (p && p.name) {
      applyHeaderName(p.name);
    } else if (!s2) {
      applyPhone();
    }
    // For employer with no profile, leave name as-is (HTML default).
    applyHeaderAvatar(p ? p.photo : '');
  }

  // Bind toggle + outside-click + Esc on the user pill dropdown.
  function bindHeaderDropdown() {
    var btn  = document.getElementById('userBtn');
    var menu = document.getElementById('userMenu');
    if (!btn || !menu) return;
    if (btn.dataset.shBound === '1') return;
    btn.dataset.shBound = '1';

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !menu.hidden;
      menu.hidden = open;
      btn.setAttribute('aria-expanded', String(!open));
      if (!open) {
        var nm = document.getElementById('notifMenu');
        if (nm) {
          nm.hidden = true;
          var nb = document.getElementById('notifBtn');
          if (nb) nb.setAttribute('aria-expanded', 'false');
        }
      }
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Bind notifications bell dropdown (employer header). Mutually exclusive with user menu.
  function bindNotifDropdown() {
    var btn  = document.getElementById('notifBtn');
    var menu = document.getElementById('notifMenu');
    if (!btn || !menu) return;
    if (btn.dataset.shBound === '1') return;
    btn.dataset.shBound = '1';
    var userMenu = document.getElementById('userMenu');

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !menu.hidden;
      menu.hidden = open;
      btn.setAttribute('aria-expanded', String(!open));
      if (!open && userMenu) {
        userMenu.hidden = true;
        var ub = document.getElementById('userBtn');
        if (ub) ub.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Bind every [data-logout] button to clear session and redirect.
  function bindLogout() {
    document.querySelectorAll('[data-logout]').forEach(function (b) {
      if (b.dataset.shBound === '1') return;
      b.dataset.shBound = '1';
      b.addEventListener('click', function () {
        try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
        window.location.href = 'index.html';
      });
    });
  }

  // Logo on logged-in pages: student → catalog.html, employer → index.html.
  function bindHeaderLogo() {
    var s = readSession();
    if (!s || !s.role) return;
    var logo = document.querySelector('[data-header="logged-in"] .feed-logo, header.feed-header .feed-logo');
    if (!logo) return;
    logo.setAttribute('href', s.role === 'employer' ? 'employer-dashboard.html' : 'catalog.html');
  }

  // Show/hide [data-header="guest"] vs [data-header="logged-in"] based on session.
  function applyHeaderVisibility() {
    var s = readSession();
    var guest  = document.querySelector('[data-header="guest"]');
    var logged = document.querySelector('[data-header="logged-in"]');
    if (s && s.role) {
      if (guest)  guest.style.display  = 'none';
      if (logged) logged.style.display = '';
      if (s.role === 'employer') document.body.classList.add('orange-theme');
    } else {
      if (logged) logged.style.display = 'none';
      if (guest)  guest.style.display  = '';
    }
  }

  // Render numeric badges on feed-nav chips.
  // Uses chip text content to identify ("Мои задачи", "Чаты") — order-independent.
  // Creates the counter span if it doesn't exist yet.
  function applyCounters() {
    var chips = document.querySelectorAll('.feed-chip');
    chips.forEach(function (chip) {
      var label = (chip.textContent || '').trim().toLowerCase();
      var val = null;
      if (label.indexOf('мои задачи') !== -1) val = MOCK_COUNTERS.myTasks;
      else if (label.indexOf('чат') !== -1)   val = MOCK_COUNTERS.chats;
      if (val === null) return;
      var counter = chip.querySelector('.feed-counter');
      if (!counter) {
        counter = document.createElement('span');
        counter.className = 'feed-counter';
        chip.appendChild(counter);
      }
      counter.textContent = val;
    });
    // Wallet chip
    document.querySelectorAll('.feed-chip').forEach(function (chip) {
      var span = chip.querySelector('span:not(.feed-counter)');
      if (span && /\d+\s*₽/.test(span.textContent)) {
        span.innerHTML = MOCK_COUNTERS.walletRub + '&nbsp;₽';
      }
    });
    // Sidebar «В работе» бейдж — единый источник из MOCK_COUNTERS.unreadWork.
    // HTML-хардкод «3» остаётся как fallback на случай, если shared.js не загрузился.
    document.querySelectorAll('.ec-nav-count, .cabinet-nav-count').forEach(function (el) {
      el.textContent = MOCK_COUNTERS.unreadWork;
    });
  }

  // Filter pill dropdown menu items by role.
  // Student sees Профиль + Документы + Настройки. Employer sees Профиль + Настройки.
  function filterMenuByRole() {
    var s = readSession();
    var menu = document.getElementById('userMenu');
    if (!menu || !s || !s.role) return;
    if (s.role === 'employer') {
      menu.querySelectorAll('a[href="documents.html"]').forEach(function (a) {
        a.style.display = 'none';
      });
    }
  }

  // Hide "Мои задачи" chip for students — they navigate tasks via Чаты.
  function filterChipsByRole() {
    var s = readSession();
    if (!s || s.role !== 'student') return;
    document.querySelectorAll('.feed-chip').forEach(function (chip) {
      var t = (chip.textContent || '').toLowerCase();
      if (t.indexOf('мои задачи') !== -1) chip.style.display = 'none';
    });
  }

  // One-shot init for header. Call once on DOMContentLoaded.
  function initHeader() {
    applyHeaderVisibility();
    bindHeaderLogo();
    bindHeaderDropdown();
    bindNotifDropdown();
    bindLogout();
    filterMenuByRole();
    filterChipsByRole();
    applyCounters();
    syncHeaderPill();
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // Auto-init unless caller sets window.SR_NO_AUTO_INIT before script load.
  // ── Favorites ──────────────────────────────────────────────────────────────
  var FAV_KEY = 'studradar_favorites_v1';

  function readFavorites() {
    try { var r = localStorage.getItem(FAV_KEY); return r ? JSON.parse(r) : []; } catch(e) { return []; }
  }
  function saveFavoritesData(favs) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch(e) {}
  }
  function isFavorite(catalogId) {
    return readFavorites().some(function(f){ return f.id === catalogId; });
  }
  // taskObj must have {id, status:'favorites', title, category, address, date, price(number), customer, customerRating, urgent, people, messages:0}
  function toggleFavorite(taskObj) {
    var favs = readFavorites();
    var idx = -1;
    for (var i = 0; i < favs.length; i++) { if (favs[i].id === taskObj.id) { idx = i; break; } }
    var added;
    if (idx >= 0) { favs.splice(idx, 1); added = false; }
    else { favs.push(taskObj); added = true; }
    saveFavoritesData(favs);
    return added;
  }

  // ── Documents warning: показать «!» на пункте «Документы»,
  //    если справка об обучении или статус самозанятого не подтверждён.
  function readDocsState() {
    try {
      var raw = localStorage.getItem('studradar_docs_v1');
      if (!raw) return { certConfirmed: false, selfConfirmed: false };
      var d = JSON.parse(raw) || {};
      return {
        certConfirmed: !!d.certConfirmed,
        selfConfirmed: !!d.selfConfirmed
      };
    } catch (e) { return { certConfirmed: false, selfConfirmed: false }; }
  }
  function applyDocsWarning() {
    // Только для студентов
    var s = readSession();
    if (s && s.role && s.role !== 'student') return;
    var st = readDocsState();
    var needsWarn = !st.certConfirmed || !st.selfConfirmed;
    var items = document.querySelectorAll('.cabinet-nav-item');
    items.forEach(function (el) {
      var href = el.getAttribute('href') || '';
      if (href.indexOf('documents.html') !== 0) return;
      var existing = el.querySelector('.cabinet-nav-warn');
      if (needsWarn) {
        if (!existing) {
          var warn = document.createElement('span');
          warn.className = 'cabinet-nav-warn';
          warn.setAttribute('aria-label', 'Требуется внимание: загрузите справку и подтвердите статус самозанятого');
          warn.setAttribute('title', 'Загрузите справку об обучении и подтвердите статус самозанятого');
          warn.textContent = '!';
          el.appendChild(warn);
        }
      } else if (existing) {
        existing.remove();
      }
    });
  }

  if (!global.SR_NO_AUTO_INIT) onReady(function () { initHeader(); applyDocsWarning(); });

  global.StudRadar = {
    firstName: firstName,
    readProfile: readProfile,
    readSession: readSession,
    syncHeaderPill: syncHeaderPill,
    bindHeaderDropdown: bindHeaderDropdown,
    bindLogout: bindLogout,
    bindHeaderLogo: bindHeaderLogo,
    applyHeaderVisibility: applyHeaderVisibility,
    applyCounters: applyCounters,
    filterMenuByRole: filterMenuByRole,
    initHeader: initHeader,
    readFavorites: readFavorites,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    applyDocsWarning: applyDocsWarning,
    COUNTERS: MOCK_COUNTERS,
    KEYS: { PROFILE: PROFILE_KEY, SESSION: SESSION_KEY, FAV: FAV_KEY }
  };
})(window);
