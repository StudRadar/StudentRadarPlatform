/* Shared mobile burger drawer — keeps the real page header in place.
   - Drawer is a full-width panel that opens BELOW the header.
   - Burger icon swaps to an X (close) when the drawer is open.
   - The "Войти" link in the header is hidden while the drawer is open
     (it is duplicated inside the drawer instead).
*/
(function () {
  if (window.__SR_DRAWER_INIT__) return;
  window.__SR_DRAWER_INIT__ = true;

  var BURGER_SVG = '<svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor"><rect x="3" y="6" width="16" height="2" rx="1"/><rect x="3" y="14" width="16" height="2" rx="1"/></svg>';
  var CLOSE_SVG  = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function isEmployerPage() {
    var p = (location.pathname || '').toLowerCase();
    if (/for-students/.test(p)) return false;
    return /employer/.test(p);
  }

  function buildHTML() {
    var employer = isEmployerPage();
    var primaryHref  = employer ? 'employer-new-task.html' : 'catalog.html';
    var primaryLabel = employer ? 'Разместить задачу'     : 'Найти подработку';
    var primaryColor = employer ? '#DD5444'               : '#1153B5';

    var links;
    if (employer) {
      links = [
        ['students.html',         'Студенты'],
        ['employer.html#how',     'О платформе'],
        ['blog.html',             'Блог']
      ];
    } else {
      links = [
        ['catalog.html',          'Задачи'],
        ['students.html',         'Студенты'],
        ['for-students.html#how', 'О платформе'],
        ['blog.html',             'Блог']
      ];
    }

    var linksHTML = links.map(function (l) {
      return '<a href="' + l[0] + '" style="display:block;padding:18px 0;font-size:18px;font-weight:600;color:#020327;text-decoration:none;border-bottom:1px solid rgba(2,3,39,0.08);">' + l[1] + '</a>';
    }).join('');

    return ''
      + '<div id="mobileDrawer" hidden style="position:fixed;left:0;right:0;bottom:0;top:60px;background:#fff;z-index:48;padding:8px 14px 24px;box-sizing:border-box;flex-direction:column;font-family:\'Manrope\',sans-serif;overflow-y:auto;">'
      +   linksHTML
      +   '<div style="margin-top:auto;padding-top:32px;display:flex;flex-direction:column;gap:12px;">'
      +     '<a href="' + primaryHref + '" style="display:flex;align-items:center;justify-content:center;height:52px;background:' + primaryColor + ';color:#fff;border-radius:14px;font-size:16px;font-weight:700;text-decoration:none;">' + primaryLabel + '</a>'
      +     '<a href="#login" class="link-login" style="display:flex;align-items:center;justify-content:center;width:100%;margin:0;height:52px;background:#EEEEF0;color:#020327;border-radius:14px;font-size:16px;font-weight:600;text-decoration:none;">Войти</a>'
      +   '</div>'
      + '</div>';
  }

  function init() {
    var burgers = document.querySelectorAll('.burger');
    if (!burgers.length) return;

    // Remove any legacy drawer markup + overlay from page-local code.
    var legacy = document.getElementById('mobileDrawer');
    if (legacy && !legacy.dataset.shared) legacy.remove();
    var overlay = document.getElementById('mobileOverlay');
    if (overlay) overlay.remove();

    var wrap = document.createElement('div');
    wrap.innerHTML = buildHTML();
    var drawer = wrap.firstChild;
    drawer.dataset.shared = '1';
    document.body.appendChild(drawer);

    // Header & header login link (to hide while open)
    var headerLogins = document.querySelectorAll('header .link-login, header .btn-login');

    var open = false;
    function setOpen(next) {
      open = next;
      if (open) {
        drawer.hidden = false;
        drawer.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      } else {
        drawer.style.display = 'none';
        drawer.hidden = true;
        document.body.style.overflow = '';
      }
      burgers.forEach(function (b) {
        b.setAttribute('aria-expanded', String(open));
        b.innerHTML = open ? CLOSE_SVG : BURGER_SVG;
      });
      headerLogins.forEach(function (el) {
        el.style.display = open ? 'none' : '';
      });
    }

    burgers.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        setOpen(!open);
      });
    });

    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setOpen(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
