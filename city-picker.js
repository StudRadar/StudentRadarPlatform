/* Shared HMAO city picker.
   Upgrades every .location element on the page into a dropdown.
   Selected city is stored in localStorage under 'sr_city'. */
(function () {
  var CITIES = [
    'Сургут','Нижневартовск','Нефтеюганск','Ханты-Мансийск',
    'Когалым','Нягань','Мегион','Радужный','Лангепас',
    'Урай','Пыть-Ях','Югорск','Белоярский'
  ];
  var STORAGE_KEY = 'sr_city';

  function getStoredCity() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch (e) { return ''; }
  }
  function setStoredCity(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
  }

  function upgrade(loc) {
    if (loc.dataset.cityPickerInit) return;
    loc.dataset.cityPickerInit = '1';

    // Find existing pin svg (keep first svg as the pin icon).
    var pinSvg = loc.querySelector('svg');

    // Decide initial label: stored value if any, otherwise the existing text.
    var existingText = (loc.textContent || '').trim();
    var current = getStoredCity() || existingText || CITIES[0];

    // Build button
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'location';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.title = 'Сменить город';

    if (pinSvg) btn.appendChild(pinSvg.cloneNode(true));

    var labelSpan = document.createElement('span');
    labelSpan.className = 'city-picker-label';
    labelSpan.textContent = current;
    btn.appendChild(labelSpan);

    var caret = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    caret.setAttribute('width', '14');
    caret.setAttribute('height', '14');
    caret.setAttribute('viewBox', '0 0 18 18');
    caret.setAttribute('fill', 'none');
    caret.setAttribute('aria-hidden', 'true');
    caret.innerHTML = '<path d="M4.5 7 9 11.5 13.5 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
    btn.appendChild(caret);

    // Build menu
    var menu = document.createElement('ul');
    menu.className = 'city-menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    CITIES.forEach(function (city) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.dataset.city = city;
      li.textContent = city;
      if (city === current) li.classList.add('active');
      menu.appendChild(li);
    });

    // Wrap in .city-picker, replacing the original .location element.
    var wrap = document.createElement('div');
    wrap.className = 'city-picker';
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    loc.parentNode.replaceChild(wrap, loc);

    function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    function open()  { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hidden) open(); else close();
    });
    menu.addEventListener('click', function (e) {
      var li = e.target.closest('li[data-city]');
      if (!li) return;
      var city = li.dataset.city;
      labelSpan.textContent = city;
      setStoredCity(city);
      Array.prototype.forEach.call(menu.children, function (item) {
        item.classList.toggle('active', item.dataset.city === city);
      });
      close();
      document.dispatchEvent(new CustomEvent('city:change', { detail: { city: city } }));
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  function init() {
    var nodes = document.querySelectorAll('.location');
    Array.prototype.forEach.call(nodes, upgrade);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
