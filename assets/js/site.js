/* PureTechs — site.js
   Shared behaviour for every page. No dependencies, no tracking, no network requests. */
(function () {
  'use strict';

  var root = document.documentElement;
  // the inline <head> script adds .js; if it already gave up on us (very slow load) we leave reveals disabled
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var PT = window.PT = {
    reduce: reduce,
    phone: '919929612416',
    mail: 'Support@puretechs.in',
    wa: function (text) { return 'https://wa.me/' + PT.phone + '?text=' + encodeURIComponent(text); },
    mailto: function (subject, body) {
      return 'mailto:' + PT.mail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }
  };

  /* ---------- header: solid once the page scrolls ---------- */
  var hdr = document.querySelector('.hdr');
  var fab = document.querySelector('.fab');
  function onScroll() {
    var y = window.scrollY;
    if (hdr) hdr.classList.toggle('is-solid', y > 24);
    if (fab) fab.classList.toggle('is-on', y > window.innerHeight * 0.7);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mnav');
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    if (hdr) hdr.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    // keep focus inside the menu: everything behind the overlay is inert while it is open
    document.querySelectorAll('body > main, body > footer, body > .fab, .hdr-in > .brand, .hdr-act > [data-support]').forEach(function (el) {
      if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
    });
    var wideMq = window.matchMedia('(min-width: 1020px)');
    var closeIfWide = function (m) { if (m.matches) setMenu(false); };
    if (wideMq.addEventListener) wideMq.addEventListener('change', closeIfWide);
  }

  /* ---------- staged reveals ---------- */
  var rv = document.querySelectorAll('[data-rv], .step4');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- skip link: move focus without adding a history entry ---------- */
  document.querySelectorAll('.skip').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.getElementById((a.getAttribute('href') || '').slice(1));
      if (!target) return;
      e.preventDefault();
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start' });
    });
  });

  /* ---------- scrollspy for in-page indexes (services) ---------- */
  document.querySelectorAll('[data-spy]').forEach(function (nav) {
    if (!('IntersectionObserver' in window)) return;
    var links = nav.querySelectorAll('a[href^="#"]'), byId = {};
    links.forEach(function (l) { byId[l.getAttribute('href').slice(1)] = l; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-on'); l.removeAttribute('aria-current'); });
        var l = byId[en.target.id];
        if (l) { l.classList.add('is-on'); l.setAttribute('aria-current', 'location'); }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(byId).forEach(function (id) { var t = document.getElementById(id); if (t) spy.observe(t); });
  });

  /* ---------- animated drawings (e.g. the services lifecycle loop): pause when unseen or reduced motion ---------- */
  document.querySelectorAll('svg[data-motion]').forEach(function (svg) {
    if (!svg.pauseAnimations) return;
    if (reduce) { svg.pauseAnimations(); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { if (e[0].isIntersecting) svg.unpauseAnimations(); else svg.pauseAnimations(); }).observe(svg);
    }
  });

  /* ---------- current year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Quick Support: a real link; on wide screens it opens as a compact window ---------- */
  document.querySelectorAll('[data-support]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (window.innerWidth < 760) return; // phones: let the link open normally
      var w = window.open(a.href, 'ptSupport', 'popup=yes,width=480,height=780');
      if (w) { try { w.opener = null; } catch (err) { /* cross-origin already */ } e.preventDefault(); }
      // if the popup was blocked, the link's own target="_blank" takes over
    });
  });

  /* ---------- toast ---------- */
  // the live region exists (empty) from load, so screen readers announce the first message too
  var toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  document.body.appendChild(toastEl);
  PT.toast = function (msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  };

  PT.copy = function (text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return Promise.resolve(ok);
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
    }
    return fallback();
  };

  /* ---------- exposure gauge (home teaser and check result) ---------- */
  PT.gauge = function (el) {
    if (!el) return { set: function () {} };
    var val = el.querySelector('.g-val');
    var num = el.querySelector('.g-num');
    var ticks = el.querySelector('.g-ticks');
    if (ticks && !ticks.firstChild) {
      for (var i = 0; i <= 100; i += 5) {
        var a = (135 + i * 2.7) * Math.PI / 180, major = i % 25 === 0, r1 = major ? 66 : 70, r2 = 76;
        var ln = document.createElementNS(SVGNS, 'line');
        ln.setAttribute('x1', (100 + r1 * Math.cos(a)).toFixed(2));
        ln.setAttribute('y1', (100 + r1 * Math.sin(a)).toFixed(2));
        ln.setAttribute('x2', (100 + r2 * Math.cos(a)).toFixed(2));
        ln.setAttribute('y2', (100 + r2 * Math.sin(a)).toFixed(2));
        ln.setAttribute('class', 'g-tick' + (major ? ' maj' : ''));
        ticks.appendChild(ln);
      }
    }
    var shown = 0, raf = 0;
    return {
      set: function (v, colour) {
        v = Math.max(0, Math.min(100, Math.round(v)));
        if (colour) el.style.setProperty('--g-col', colour);
        if (val) val.setAttribute('stroke-dasharray', (75 * v / 100).toFixed(2) + ' 100');
        if (!num) return;
        cancelAnimationFrame(raf);
        if (reduce || document.hidden) { shown = v; num.textContent = String(v); return; }
        var from = shown, start = 0, dur = 700;
        var step = function (t) {
          if (!start) start = t;
          var p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
          shown = Math.round(from + (v - from) * e);
          num.textContent = String(shown);
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        // if animation frames are throttled (background tab, embedded view), still land on the value
        clearTimeout(el._gt);
        el._gt = setTimeout(function () { if (shown !== v) { cancelAnimationFrame(raf); shown = v; num.textContent = String(v); } }, dur + 250);
      }
    };
  };

  /* ---------- enquiry composer: builds a message for the visitor's own WhatsApp or email ---------- */
  document.querySelectorAll('[data-composer]').forEach(function (form) {
    var err = form.querySelector('[data-err]');
    var nameEl = form.querySelector('[name="name"]');
    var errText = err ? err.textContent : '';
    if (err && !err.id) err.id = 'composer-err';
    function v(k) { var el = form.querySelector('[name="' + k + '"]'); return el ? el.value.trim() : ''; }
    function clearErr() {
      if (err) err.hidden = true;
      nameEl.removeAttribute('aria-invalid');
      nameEl.removeAttribute('aria-describedby');
    }
    function build() {
      if (!v('name')) {
        if (err) {
          // re-set the text so the alert is announced again on every failed attempt
          err.textContent = '';
          err.hidden = false;
          setTimeout(function () { err.textContent = errText; }, 30);
          nameEl.setAttribute('aria-describedby', err.id);
        }
        nameEl.setAttribute('aria-invalid', 'true');
        nameEl.focus();
        return null;
      }
      clearErr();
      var lines = ['Hello PureTechs — enquiry from the website.', 'Name: ' + v('name')];
      if (v('company')) lines.push('Company: ' + v('company'));
      lines.push('Need: ' + v('need'));
      if (v('details')) lines.push('Details: ' + v('details'));
      return lines.join('\n');
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    nameEl.addEventListener('input', function () { if (v('name')) clearErr(); });
    var waBtn = form.querySelector('[data-send="wa"]');
    var mailBtn = form.querySelector('[data-send="mail"]');
    if (waBtn) waBtn.addEventListener('click', function () { var m = build(); if (m) window.open(PT.wa(m), '_blank', 'noopener'); });
    if (mailBtn) mailBtn.addEventListener('click', function () { var m = build(); if (m) window.location.href = PT.mailto('Website enquiry', m); });
  });
})();
