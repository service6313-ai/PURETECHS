/* PureTechs — home.js
   Home-page behaviour: the living hero drawing, the exposure teaser, the engineering
   journey, the rack, setup tabs and the hours estimate. Runs after site.js. */
(function () {
  'use strict';
  var PT = window.PT || {};
  var reduce = !!PT.reduce;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- hero: three layers — backdrop, drawing, and a small live layer with the moving parts ---------- */
  var heroScene = document.querySelector('.hero-scene');
  if (heroScene) {
    var l1 = heroScene.querySelector('.hs-l1');
    var near = heroScene.querySelectorAll('.hs-l2, .hs-l3');
    var live = heroScene.querySelector('.hs-l3');
    var visible = true;
    /* Placement. Phones: a full-bleed crop keeps the rack large above the headline.
       Desktop: the rack drawing is fitted into the actual free space — right of the headline,
       below the header, above the bottom strip — so it is as large as possible, never cropped,
       and never touches the copy. The backdrop layer stays full-bleed. */
    var heroEl = heroScene.closest('.hero');
    var h1El = heroEl && heroEl.querySelector('h1');
    var railEl = heroEl && heroEl.querySelector('.hero-rail');
    var drawing = heroScene.querySelectorAll('.hs-l2, .hs-l3');
    var phone = window.matchMedia('(max-width: 899px)');
    var FULL = '0 0 1440 900';
    var place = function () {
      if (!l1 || !h1El || !railEl) return;
      if (phone.matches) {
        heroScene.classList.remove('is-compact');
        [l1].concat([].slice.call(drawing)).forEach(function (svg) {
          svg.setAttribute('viewBox', FULL);
          svg.setAttribute('preserveAspectRatio', 'xMaxYMin slice');
          svg.style.left = svg.style.top = svg.style.width = svg.style.height = svg.style.right = svg.style.bottom = '';
        });
        return;
      }
      l1.setAttribute('viewBox', FULL);
      l1.setAttribute('preserveAspectRatio', 'xMaxYMid slice');
      var scene = heroScene.getBoundingClientRect();
      var range = document.createRange();
      range.selectNodeContents(h1El);
      var textRight = 0;
      [].forEach.call(range.getClientRects(), function (r) { if (r.right > textRight) textRight = r.right; });
      var W = document.documentElement.clientWidth;
      var left = textRight + 40 - scene.left;
      var right = W - Math.max(20, W * 0.025) - scene.left;
      var top = 10;
      var bottom = railEl.getBoundingClientRect().top - 12 - scene.top;
      var w = Math.max(160, right - left), h = Math.max(200, bottom - top);
      var compact = h < 560;            // too short for the labels above the rack
      var narrow = window.innerWidth < 1100; // side labels are hidden by CSS below this width
      heroScene.classList.toggle('is-compact', compact);
      var x0 = narrow ? 1040 : 868, y0 = compact ? 150 : 70;
      var vb = x0 + ' ' + y0 + ' ' + (1440 - x0) + ' ' + (668 - y0);
      drawing.forEach(function (svg) {
        svg.setAttribute('viewBox', vb);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.left = left + 'px'; svg.style.top = top + 'px';
        svg.style.width = w + 'px'; svg.style.height = h + 'px';
        svg.style.right = 'auto'; svg.style.bottom = 'auto';
      });
    };
    var placeQueued = false;
    var queuePlace = function () { if (!placeQueued) { placeQueued = true; requestAnimationFrame(function () { placeQueued = false; place(); }); } };
    place();
    window.addEventListener('resize', queuePlace);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    var pause = function () { if (live && live.pauseAnimations) live.pauseAnimations(); if (live) live.classList.add('is-paused'); };
    var play = function () { if (live && live.unpauseAnimations) live.unpauseAnimations(); if (live) live.classList.remove('is-paused'); };
    if (reduce) {
      pause();
    } else {
      if (hasIO) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !document.hidden) play(); else pause(); }).observe(heroScene);
      document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else if (visible) play(); });
      // parallax moves whole layers with CSS transforms, so the drawings are never repainted for it
      var mx = 0, my = 0, queued = false;
      var paint = function () {
        queued = false;
        var y = Math.min(window.scrollY, 1400);
        if (l1) l1.style.transform = 'translate3d(' + (mx * -8).toFixed(1) + 'px,' + (y * 0.05 + my * -5).toFixed(1) + 'px,0)';
        var t = 'translate3d(' + (mx * 12).toFixed(1) + 'px,' + (y * -0.07 + my * 7).toFixed(1) + 'px,0)';
        near.forEach(function (el) { el.style.transform = t; });
      };
      var queue = function () { if (!visible || queued) return; queued = true; requestAnimationFrame(paint); };
      window.addEventListener('scroll', queue, { passive: true });
      if (window.matchMedia('(pointer: fine)').matches) {
        window.addEventListener('pointermove', function (e) {
          mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; queue();
        }, { passive: true });
      }
    }
  }

  /* ---------- exposure teaser: five self-reported statements, same bands and cap as the full check ---------- */
  var exp = document.querySelector('[data-exposure]');
  if (exp && PT.gauge) {
    var probes = exp.querySelectorAll('input[data-w]');
    var gauge = PT.gauge(exp.querySelector('.gauge'));
    var band = exp.querySelector('.g-band');
    var paintExp = function () {
      var sum = 0;
      probes.forEach(function (p) {
        var on = p.checked;
        if (on) sum += +p.getAttribute('data-w');
        p.closest('.probe').classList.toggle('is-on', on);
        var row = exp.querySelector('.sysrow[data-sys="' + p.getAttribute('data-sys') + '"]');
        if (row) {
          row.classList.toggle('is-flag', on);
          row.querySelector('.st').textContent = on ? p.getAttribute('data-flag') : 'No flag';
        }
      });
      var v = Math.min(96, sum);
      var col = v <= 20 ? 'var(--dk-ok)' : v <= 45 ? 'var(--dk-warn)' : 'var(--dk-risk)';
      var label = v === 0 ? 'Nothing flagged yet' : v <= 20 ? 'Low exposure' : v <= 45 ? 'Moderate exposure' : 'High exposure';
      gauge.set(v, col);
      if (band) {
        band.style.setProperty('--g-col', col);
        band.textContent = '';
        var sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = 'Exposure index ' + v + ' out of 100: ';
        band.appendChild(sr);
        band.appendChild(document.createTextNode(label));
      }
    };
    probes.forEach(function (p) { p.addEventListener('change', paintExp); });
    paintExp();
  }

  /* ---------- engineering journey: the drawing follows the scroll ---------- */
  var j = document.querySelector('[data-journey]');
  if (j) {
    var steps = j.querySelectorAll('.j-step');
    var scenes = j.querySelectorAll('.scene');
    var lives = j.querySelectorAll('.scene-live');
    var tabs = j.querySelectorAll('.j-tabs a');
    var dwgNo = j.querySelector('[data-dwg-no]');
    var dwgName = j.querySelector('[data-dwg-name]');
    var stage = j.querySelector('.j-stage');
    var jlive = j.querySelector('.j-live');
    var active = -1;
    var setScene = function (n) {
      if (n === active || !scenes[n]) return;
      active = n;
      scenes.forEach(function (s, i) { s.classList.toggle('is-on', i === n); });
      lives.forEach(function (s, i) { s.classList.toggle('is-on', i === n); });
      steps.forEach(function (s, i) { s.classList.toggle('is-on', i === n); });
      tabs.forEach(function (t, i) {
        t.classList.toggle('is-on', i === n);
        if (i === n) t.setAttribute('aria-current', 'step'); else t.removeAttribute('aria-current');
      });
      if (dwgNo) dwgNo.textContent = scenes[n].getAttribute('data-dwg');
      if (dwgName) dwgName.textContent = scenes[n].getAttribute('data-name');
      var tab = tabs[n], bar = tab && tab.parentNode;
      if (bar && bar.scrollWidth > bar.clientWidth + 4) {
        bar.scrollTo({ left: Math.max(0, tab.offsetLeft - 16), behavior: reduce ? 'auto' : 'smooth' });
      }
    };
    // on phones the sticky stage covers the top of the screen; jumps to a step should land just below it
    var sizeStage = function () { if (stage) j.style.setProperty('--jstage', stage.offsetHeight + 'px'); };
    sizeStage();
    window.addEventListener('resize', sizeStage);

    if (hasIO) {
      if (jlive) {
        if (reduce) { if (jlive.pauseAnimations) jlive.pauseAnimations(); }
        else new IntersectionObserver(function (e) {
          if (!jlive.pauseAnimations) return;
          if (e[0].isIntersecting) jlive.unpauseAnimations(); else jlive.pauseAnimations();
        }).observe(j);
      }
      var wide = window.matchMedia('(min-width: 1020px)');
      var jo = null;
      var observe = function () {
        if (jo) jo.disconnect();
        // a hairline band: exactly one step can cross it at a time, in either scroll direction
        jo = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) setScene(+en.target.getAttribute('data-step')); });
        }, { rootMargin: wide.matches ? '-50% 0px -49.8% 0px' : '-70% 0px -29.8% 0px' });
        steps.forEach(function (s) { jo.observe(s); });
      };
      observe();
      if (wide.addEventListener) wide.addEventListener('change', function () { sizeStage(); observe(); });
      setScene(0);
    } else {
      // no IntersectionObserver: show every step at full strength and keep the first drawing
      setScene(0);
      steps.forEach(function (s) { s.classList.add('is-on'); });
    }
  }

  /* ---------- the rack: units light up as it scrolls through view ---------- */
  var rack = document.querySelector('[data-rack]');
  if (rack) {
    var units = rack.querySelectorAll('.ru');
    if (reduce || !hasIO) {
      units.forEach(function (u) { u.classList.add('lit'); });
    } else {
      var inView = false, rq = false;
      var paintRack = function () {
        rq = false;
        var r = rack.getBoundingClientRect(), vh = window.innerHeight;
        // fully lit while the whole rack is still on screen
        var p = (vh * 0.88 - r.top) / (r.height * 0.6);
        var lit = Math.floor(Math.max(0, Math.min(1, p)) * units.length + 0.001);
        units.forEach(function (u, i) { u.classList.toggle('lit', i < lit); });
      };
      new IntersectionObserver(function (e) { inView = e[0].isIntersecting; if (inView) paintRack(); }).observe(rack);
      window.addEventListener('scroll', function () { if (inView && !rq) { rq = true; requestAnimationFrame(paintRack); } }, { passive: true });
    }
  }

  /* ---------- tabs (setups we deploy) ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var tabEls = box.querySelectorAll('[role="tab"]');
    var panels = box.querySelectorAll('[role="tabpanel"]');
    var select = function (i, focus) {
      tabEls.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (focus) tabEls[i].focus();
    };
    tabEls.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = tabEls.length, k = e.key, to = -1;
        if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % n;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i - 1 + n) % n;
        else if (k === 'Home') to = 0;
        else if (k === 'End') to = n - 1;
        if (to > -1) { e.preventDefault(); select(to, true); }
      });
    });
    box.classList.add('is-tabbed');
    select(0);
  });

  /* ---------- hours estimate (the formula is printed next to it) ---------- */
  var hrs = document.querySelector('[data-hours]');
  if (hrs) {
    var num = function (k) { return parseFloat(hrs.querySelector('[name="' + k + '"]').value); };
    var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
    var setF = function (k, t) { var el = hrs.querySelector('[data-f="' + k + '"]'); if (el) el.textContent = t; };
    var paintHrs = function () {
      var q = num('q'), d = num('d'), f = num('f'), s = num('s');
      var hQ = q * (2 / 60) * 26 * 0.6, hD = d * 26 * 0.7, hF = f * (10 / 60) * 4.3 * 0.8;
      var h = hQ + hD + hF, lo = Math.round(h * 0.8), hi = Math.round(h * 1.2), rate = s / (26 * 8);
      var out = hrs.querySelector('[data-hrs-out]');
      out.textContent = '';
      var strong = document.createElement('strong');
      if (h < 1) {
        strong.textContent = 'Under an hour';
        out.appendChild(strong);
        out.appendChild(document.createTextNode(' a month could be recovered — automation may not be worth it yet, and we will say exactly that.'));
      } else {
        strong.textContent = '≈ ' + lo + '–' + hi + ' recoverable hours';
        out.appendChild(strong);
        out.appendChild(document.createTextNode(' of staff time a month — roughly ' + inr(lo * rate) + '–' + inr(hi * rate) + ' at the salary you picked.'));
      }
      setF('q', q + ' queries a day × 2 min × 26 days × 60% an assistant can take ≈ ' + Math.round(hQ) + ' hrs');
      var dl = d === 0.5 ? '30 min' : d + (d === 1 ? ' hr' : ' hrs');
      setF('d', dl + ' a day of data entry × 26 days × 70% that can be automated ≈ ' + Math.round(hD) + ' hrs');
      setF('f', f + ' follow-ups a week × 10 min × 4.3 weeks × 80% that can be automated ≈ ' + Math.round(hF) + ' hrs');
      setF('r', inr(s) + ' a month ÷ (26 days × 8 hrs) = ' + inr(rate) + ' an hour · range shown ±20%');
    };
    hrs.querySelectorAll('select').forEach(function (el) { el.addEventListener('change', paintHrs); });
    paintHrs();
  }
})();
