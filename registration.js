// СтудРадар — registration / login modal (SMS flow)
(function() {
  'use strict';

  // ========================================================
  // 1. INJECT MODAL HTML
  // ========================================================
  var modalHTML = ''
    + '<div class="reg-modal" id="reg-modal" hidden>'
    +   '<div class="reg-overlay" data-close></div>'
    +   '<div class="reg-card" role="dialog" aria-modal="true" aria-labelledby="reg-title">'
    +     '<button class="reg-close" type="button" data-close aria-label="Закрыть">'
    +       '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    +     '</button>'
    +     '<div class="reg-body" id="reg-body"></div>'
    +   '</div>'
    + '</div>';

  var wrap = document.createElement('div');
  wrap.innerHTML = modalHTML;
  document.body.appendChild(wrap.firstElementChild);

  var modal = document.getElementById('reg-modal');
  var body  = document.getElementById('reg-body');

  // ========================================================
  // 2. STATE
  // ========================================================
  var state = { screen: 'role', role: null, loginMode: false, phone: '', code: '', next: null };
  var resendTimer = null;
  var resendSecs  = 0;

  // ========================================================
  // 3. PUBLIC API & TRIGGERS
  // ========================================================
  function open(opts) {
    clearResendTimer();
    state = { screen: 'role', role: null, loginMode: false, phone: '', code: '', next: null, customSubtitle: null };
    if (opts && opts.login) { state.screen = 'phone'; state.loginMode = true; }
    if (opts && opts.role) { state.role = opts.role; state.screen = 'phone'; }
    if (opts && opts.next) { state.next = opts.next; }
    if (opts && opts.subtitle) { state.customSubtitle = opts.subtitle; }
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function(){ modal.classList.add('is-open'); });
    render();
  }
  function close() {
    clearResendTimer();
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function(){ modal.setAttribute('hidden', ''); }, 220);
  }

  window.StudRadarReg = { open: open };

  function isLoggedIn() {
    try { return !!JSON.parse(localStorage.getItem('studradar_session') || 'null'); }
    catch (_) { return false; }
  }

  document.addEventListener('click', function(e) {
    // Favorite (heart) buttons: require login first
    var favBtn = e.target.closest('[aria-label="В избранное"]');
    if (favBtn && !isLoggedIn()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      open({ subtitle: 'Добавлять в избранное могут только авторизованные пользователи' });
      return;
    }
    var loginBtn = e.target.closest('.btn-login') || e.target.closest('.link-login');
    if (loginBtn) {
      var href = loginBtn.getAttribute('href') || '';
      if (href && href.indexOf('#') !== 0) return;
      e.preventDefault();
      open();
      return;
    }
    if (e.target.closest('[data-close]')) { close(); return; }
  }, true);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) close();
  });

  // ========================================================
  // 4. SVG ICONS
  // ========================================================
  var STUDENT_SVG = '<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M31.8558 7.93262L18.3558 3.43262C18.1248 3.35563 17.8752 3.35563 17.6442 3.43262L4.14422 7.93262C3.92021 8.00729 3.72538 8.15056 3.58732 8.34212C3.44926 8.53369 3.37498 8.76383 3.375 8.99996V20.25C3.375 20.5483 3.49353 20.8345 3.7045 21.0455C3.91548 21.2564 4.20163 21.375 4.5 21.375C4.79837 21.375 5.08452 21.2564 5.29549 21.0455C5.50647 20.8345 5.625 20.5483 5.625 20.25V10.5609L10.3486 12.1345C9.0936 14.162 8.69451 16.6047 9.23897 18.9263C9.78343 21.2478 11.2269 23.2584 13.2525 24.5165C10.7212 25.5093 8.53312 27.3051 6.93281 29.7604C6.84958 29.8841 6.79177 30.0231 6.76274 30.1694C6.73371 30.3156 6.73404 30.4662 6.7637 30.6123C6.79336 30.7584 6.85177 30.8971 6.93553 31.0205C7.01929 31.1438 7.12674 31.2493 7.25161 31.3307C7.37649 31.4122 7.51631 31.468 7.66295 31.4949C7.80959 31.5219 7.96012 31.5194 8.10579 31.4876C8.25146 31.4559 8.38937 31.3955 8.51149 31.31C8.63362 31.2245 8.73753 31.1155 8.81719 30.9895C10.9364 27.7382 14.2833 25.875 18 25.875C21.7167 25.875 25.0636 27.7382 27.1828 30.9895C27.3478 31.2347 27.6027 31.4052 27.8924 31.464C28.182 31.5228 28.4832 31.4652 28.7308 31.3038C28.9784 31.1423 29.1525 30.8899 29.2154 30.6011C29.2783 30.3123 29.2251 30.0103 29.0672 29.7604C27.4669 27.3051 25.2703 25.5093 22.7475 24.5165C24.7711 23.2584 26.2133 21.2492 26.7576 18.9293C27.302 16.6095 26.9042 14.1685 25.6514 12.1415L31.8558 10.0743C32.0798 9.9997 32.2747 9.85646 32.4128 9.66489C32.5509 9.47332 32.6253 9.24315 32.6253 9.00699C32.6253 8.77083 32.5509 8.54066 32.4128 8.3491C32.2747 8.15753 32.0798 8.01428 31.8558 7.93965V7.93262ZM24.75 16.875C24.7503 17.9421 24.4976 18.9941 24.0126 19.9447C23.5276 20.8952 22.8241 21.7173 21.9599 22.3433C21.0957 22.9693 20.0954 23.3815 19.041 23.5461C17.9866 23.7107 16.9082 23.6229 15.8943 23.29C14.8805 22.9572 13.9599 22.3886 13.2083 21.6311C12.4567 20.8735 11.8954 19.9486 11.5705 18.9321C11.2456 17.9156 11.1663 16.8366 11.3391 15.7836C11.512 14.7305 11.932 13.7335 12.5648 12.8742L17.6442 14.5617C17.8752 14.6387 18.1248 14.6387 18.3558 14.5617L23.4352 12.8742C24.2899 14.0329 24.7507 15.4351 24.75 16.875Z" fill="#1153B5"/></svg>';
  var BRIEFCASE_SVG = '<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M21.375 15.75C21.375 16.0484 21.2565 16.3345 21.0455 16.5455C20.8345 16.7565 20.5484 16.875 20.25 16.875H15.75C15.4516 16.875 15.1655 16.7565 14.9545 16.5455C14.7435 16.3345 14.625 16.0484 14.625 15.75C14.625 15.4516 14.7435 15.1655 14.9545 14.9545C15.1655 14.7435 15.4516 14.625 15.75 14.625H20.25C20.5484 14.625 20.8345 14.7435 21.0455 14.9545C21.2565 15.1655 21.375 15.4516 21.375 15.75ZM32.625 10.125V28.125C32.625 28.7217 32.3879 29.294 31.966 29.716C31.544 30.1379 30.9717 30.375 30.375 30.375H5.625C5.02826 30.375 4.45597 30.1379 4.03401 29.716C3.61205 29.294 3.375 28.7217 3.375 28.125V10.125C3.375 9.52826 3.61205 8.95597 4.03401 8.53401C4.45597 8.11205 5.02826 7.875 5.625 7.875H11.25V6.75C11.25 5.85489 11.6056 4.99645 12.2385 4.36351C12.8714 3.73058 13.7299 3.375 14.625 3.375H21.375C22.2701 3.375 23.1286 3.73058 23.7615 4.36351C24.3944 4.99645 24.75 5.85489 24.75 6.75V7.875H30.375C30.9717 7.875 31.544 8.11205 31.966 8.53401C32.3879 8.95597 32.625 9.52826 32.625 10.125ZM13.5 7.875H22.5V6.75C22.5 6.45163 22.3815 6.16548 22.1705 5.95451C21.9595 5.74353 21.6734 5.625 21.375 5.625H14.625C14.3266 5.625 14.0405 5.74353 13.8295 5.95451C13.6185 6.16548 13.5 6.45163 13.5 6.75V7.875ZM30.375 15.9764V10.125H5.625V15.9764C9.42219 18.0433 13.6767 19.1258 18 19.125C22.3233 19.1258 26.5778 18.0433 30.375 15.9764Z" fill="#DD5444"/></svg>';

  // ========================================================
  // 5. RENDER
  // ========================================================
  function render() {
    body.classList.remove('reg-body--enter');
    void body.offsetWidth;
    body.classList.add('reg-body--enter');
    body.innerHTML = buildScreen();
    bindScreen();
  }

  function head(title, subtitle) {
    return ''
      + '<div class="reg-head">'
      +   '<h2 class="reg-title" id="reg-title">' + title + '</h2>'
      +   (subtitle ? '<p class="reg-subtitle">' + subtitle + '</p>' : '')
      + '</div>';
  }

  function buildScreen() {
    if (state.screen === 'role')  return buildRole();
    if (state.screen === 'phone') return buildPhone();
    if (state.screen === 'code')  return buildCode();
    return '';
  }

  // ---------- Screen 1: role ----------
  function buildRole() {
    var sub = state.customSubtitle || 'Выберите, кем вы хотите стать на платформе';
    return ''
      + head('Вход или регистрация', sub)
      + '<div class="reg-roles">'
      +   '<button type="button" class="reg-role" data-role="student">'
      +     '<div class="reg-role-icon">' + STUDENT_SVG + '</div>'
      +     '<div class="reg-role-text">'
      +       '<div class="reg-role-title">Я студент</div>'
      +       '<div class="reg-role-desc">Хочу выполнять задания, зарабатывать и получать опыт</div>'
      +     '</div>'
      +   '</button>'
      +   '<button type="button" class="reg-role" data-role="employer">'
      +     '<div class="reg-role-icon reg-role-icon--orange">' + BRIEFCASE_SVG + '</div>'
      +     '<div class="reg-role-text">'
      +       '<div class="reg-role-title">Я заказчик</div>'
      +       '<div class="reg-role-desc">Ищу студентов для своих задач и проектов</div>'
      +     '</div>'
      +   '</button>'
      + '</div>'
      + '<div class="reg-already">Уже есть аккаунт? <a href="#" data-action="signin">Войти</a></div>';
  }

  // ---------- Screen 2/3: phone ----------
  function buildPhone() {
    var valid = isValidPhone(state.phone);
    var title, subtitle;
    if (state.loginMode) {
      title = 'Вход';
      subtitle = '';
    } else if (state.role === 'employer') {
      title = 'Регистрация';
      subtitle = 'Зарегистрируйтесь как заказчик, чтобы разместить задачу';
    } else if (state.role === 'student') {
      title = 'Регистрация';
      subtitle = 'Зарегистрируйтесь как студент, чтобы откликаться на задачи';
    } else {
      title = 'Регистрация';
      subtitle = '';
    }
    return ''
      + head(title, subtitle)
      + '<div class="reg-sms-form">'
      +   smsField('reg-phone', 'Телефон', 'tel', state.phone)
      +   continueBtn(valid)
      +   '<div class="reg-already">Уже есть аккаунт? <a href="#" data-action="signin">Войти</a></div>'
      + '</div>';
  }

  // ---------- Screen 4/5: code ----------
  function buildCode() {
    var valid = state.code.replace(/\D/g, '').length >= 4;
    return ''
      + head('Введите код', 'Мы отправили СМС на ' + state.phone)
      + '<div class="reg-sms-form">'
      +   smsField('reg-code', 'Код из СМС', 'text', state.code)
      +   continueBtn(valid)
      +   '<div class="reg-resend" id="reg-resend"></div>'
      + '</div>';
  }

  // ---------- helpers ----------
  function smsField(id, label, type, value) {
    var filled = value && value.length > 0;
    return ''
      + '<div class="reg-sms-field' + (filled ? ' is-filled' : '') + '" data-field>'
      +   '<label class="reg-sms-label" for="' + id + '">' + label + '</label>'
      +   '<input class="reg-sms-input" id="' + id + '" type="' + type + '"'
      +     ' value="' + esc(value) + '"'
      +     ' autocomplete="' + (type === 'tel' ? 'tel' : 'one-time-code') + '"'
      +     ' inputmode="' + (type === 'tel' ? 'tel' : 'numeric') + '"'
      +   '/>'
      + '</div>';
  }

  function continueBtn(active) {
    return '<button type="button" class="reg-continue' + (active ? ' is-active' : '') + '" data-continue>Продолжить</button>';
  }

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  // ========================================================
  // 6. BIND
  // ========================================================
  function bindScreen() {
    if (state.screen === 'role') {
      body.querySelectorAll('.reg-role').forEach(function(btn) {
        btn.addEventListener('click', function() {
          state.role = btn.dataset.role;
          state.screen = 'phone';
          render();
        });
      });
      var signin = body.querySelector('[data-action="signin"]');
      if (signin) signin.addEventListener('click', function(e) {
        e.preventDefault();
        state.loginMode = true;
        state.screen = 'phone';
        render();
      });
      return;
    }

    if (state.screen === 'phone') {
      var input = body.querySelector('#reg-phone');
      if (input) {
        input.addEventListener('input', function() {
          state.phone = formatPhone(input.value);
          input.value = state.phone;
          var filled = state.phone.length > 0;
          body.querySelector('[data-field]').classList.toggle('is-filled', filled);
          updateContinue(isValidPhone(state.phone));
        });
        input.focus();
      }
      var signin = body.querySelector('[data-action="signin"]');
      if (signin) signin.addEventListener('click', function(e) {
        e.preventDefault();
        state.loginMode = true;
      });
      body.querySelector('[data-continue]').addEventListener('click', function() {
        if (!isValidPhone(state.phone)) return;
        state.screen = 'code';
        render();
        startResendTimer();
      });
      return;
    }

    if (state.screen === 'code') {
      var codeEl = body.querySelector('#reg-code');
      if (codeEl) {
        codeEl.addEventListener('input', function() {
          state.code = codeEl.value.replace(/\D/g, '').slice(0, 6);
          codeEl.value = state.code;
          var filled = state.code.length > 0;
          body.querySelector('[data-field]').classList.toggle('is-filled', filled);
          updateContinue(state.code.replace(/\D/g, '').length >= 4);
        });
        codeEl.focus();
      }
      renderResend();
      body.querySelector('[data-continue]').addEventListener('click', function() {
        if (state.code.replace(/\D/g, '').length < 4) return;
        var role = state.role || 'student';
        try {
          localStorage.setItem('studradar_session', JSON.stringify({ role: role }));
          localStorage.removeItem('studradar_onboarding_v1');
          localStorage.removeItem('studradar_profile_v1');
          localStorage.removeItem('studradar_docs_v1');
        } catch(_e) {}
        clearResendTimer();
        close();
        var dest;
        if (state.next) {
          dest = state.next;
        } else if (role === 'employer') {
          dest = 'employer-dashboard.html';
        } else {
          dest = 'onboarding.html';
        }
        setTimeout(function() { window.location.href = dest; }, 220);
      });
      return;
    }
  }

  function updateContinue(active) {
    var btn = body.querySelector('[data-continue]');
    if (!btn) return;
    btn.classList.toggle('is-active', active);
  }

  // ========================================================
  // 7. PHONE UTILS
  // ========================================================
  function formatPhone(raw) {
    var digits = raw.replace(/\D/g, '');
    if (digits.charAt(0) === '8') digits = '7' + digits.slice(1);
    if (digits.length > 0 && digits.charAt(0) !== '7') digits = '7' + digits;
    digits = digits.slice(0, 11);
    if (digits.length === 0) return '';
    var out = '+7';
    if (digits.length > 1) out += ' ' + digits.slice(1, 4);
    if (digits.length > 4) out += ' ' + digits.slice(4, 7);
    if (digits.length > 7) out += ' ' + digits.slice(7, 9);
    if (digits.length > 9) out += ' ' + digits.slice(9, 11);
    return out;
  }

  function isValidPhone(phone) {
    return (phone || '').replace(/\D/g, '').length === 11;
  }

  // ========================================================
  // 8. RESEND TIMER
  // ========================================================
  function startResendTimer() {
    clearResendTimer();
    resendSecs = 60;
    resendTimer = setInterval(function() {
      resendSecs--;
      renderResend();
      if (resendSecs <= 0) clearResendTimer();
    }, 1000);
  }

  function clearResendTimer() {
    if (resendTimer) { clearInterval(resendTimer); resendTimer = null; }
  }

  function renderResend() {
    var el = document.getElementById('reg-resend');
    if (!el) return;
    if (resendSecs > 0) {
      el.innerHTML = 'Отправить код повторно — через ' + resendSecs + ' с';
      el.classList.remove('is-link');
    } else {
      el.innerHTML = '<a href="#" data-resend>Отправить код повторно</a>';
      el.classList.add('is-link');
      var link = el.querySelector('[data-resend]');
      if (link) link.addEventListener('click', function(e) {
        e.preventDefault();
        startResendTimer();
        renderResend();
      });
    }
  }

})();
