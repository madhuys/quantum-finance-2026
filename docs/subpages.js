/* Challenge + Readiness Index pages: header, register links, role tabs, and the readiness preview UI
   (ported from the Perplexity mockups, re-coloured to the Q-FINEX palette). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header glass on scroll */
  var hdr = $('.bar');
  function onScroll() { if (hdr) hdr.classList.toggle('glass', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* registration forms (the only links that leave the site: they open in a new tab) */
  var REG = 'https://australia.blackswansummit.com/register-interest?forum_participation_interest=Q-FINEX%20Challenge';
  var REG_RX = 'https://australia.blackswansummit.com/register-interest?forum_participation_interest=Quantum%20Readiness%20Index';
  $$('[data-reg]').forEach(function (a) { a.href = REG; a.target = '_blank'; a.rel = 'noopener'; });
  $$('[data-reg-rx]').forEach(function (a) { a.href = REG_RX; a.target = '_blank'; a.rel = 'noopener'; });

  /* role tabs (Challenge) */
  var tabs = $$('[role=tab]');
  function select(t) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on);
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.tabIndex = i ? -1 : 0;
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus();
    });
  });

  /* ---------- Readiness Index preview ---------- */
  var QF = window.QF;
  if (!QF || !$('#stage')) return;
  var Q = QF.Q, NOW = QF.NOW;
  var COLS = ['var(--wave-blue)', 'var(--purple)', 'var(--lime)', 'var(--deep-white)'];
  var C_UP = '#0050E7', C_SENS = '#CD34E8', C_QDAY = '#D0EF1B';
  var state = { step: -1, ans: {} };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function show(name) {
    $$('.screen').forEach(function (el) { el.classList.toggle('is-on', el.dataset.screen === name); });
    $('#stage').classList.toggle('dim', name !== 'intro');
    var th = $('.top-home'); if (th) th.hidden = name === 'intro';
    var top = $('#stage').getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
  }

  function renderQ(i) {
    var q = Q[i];
    state.step = i;
    $('#steps').innerHTML = Q.map(function (s, k) {
      var cls = k < i ? 'done' : (k === i ? 'now' : '');
      return '<div class="step ' + cls + '"><span>' + (k + 1) + '. ' + esc(s.short) + '</span></div>';
    }).join('');
    $('#qTitle').textContent = q.title;
    $('#qHelp').textContent = q.help;
    $('#qWhy').textContent = q.why;
    var box = $('#qOpts');
    box.innerHTML = '';
    q.opts.forEach(function (o, k) {
      var b = document.createElement('button');
      b.className = 'opt';
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.style.setProperty('--c', COLS[k]);
      var sel = state.ans[q.key] && state.ans[q.key].b === o.b;
      if (sel) b.classList.add('sel');
      b.setAttribute('aria-checked', sel ? 'true' : 'false');
      b.innerHTML = '<em></em><b></b><span></span>';
      b.querySelector('em').textContent = o.k;
      b.querySelector('b').textContent = o.b;
      b.querySelector('span').textContent = o.s;
      b.addEventListener('click', function () { choose(i, o, b); });
      box.appendChild(b);
    });
    show('q');
  }

  var busy = false;
  function choose(i, o, el) {
    if (busy) return;
    busy = true;
    state.ans[Q[i].key] = o;
    $$('.opt').forEach(function (b) { b.classList.remove('sel'); b.setAttribute('aria-checked', 'false'); });
    el.classList.add('sel');
    el.setAttribute('aria-checked', 'true');
    setTimeout(function () { busy = false; i < Q.length - 1 ? renderQ(i + 1) : result(); }, 300);
  }

  function result() {
    state.step = 3;
    var r = QF.compute(state.ans);
    var tag = $('#rTag');
    tag.className = 'rx-tag t-' + r.tier;
    tag.querySelector('span').textContent = r.tag;
    $('#rTitle').textContent = r.head;
    $('#rText').textContent = r.body;
    $('#nist').innerHTML = '<b>NIST’s transition plan</b> deprecates quantum-vulnerable public-key algorithms after 2030 and disallows them after 2035. ' + esc(r.nist);
    var cc = [C_UP, C_SENS, C_QDAY];
    $('#chips').innerHTML = r.chips.map(function (c, k) {
      return '<div class="chip-y" style="--c:' + cc[k] + '"><b>' + c.year + '</b><span>' + esc(c.label) + '</span></div>';
    }).join('');
    $('#rSteps').innerHTML = r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    setBadge(r.n, r.unit);
    show('result');
    requestAnimationFrame(function () { drawTimeline(r); });
  }

  function setBadge(n, unit) {
    var badge = $('#badge'), num = $('#badgeNum');
    $('#badgeUnit').textContent = unit;
    badge.classList.remove('spin'); void badge.offsetWidth; badge.classList.add('spin');
    if (reduce) { num.textContent = n; return; }
    var t0 = null;
    (function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 900);
      num.textContent = Math.round(n * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }

  function drawTimeline(r) {
    var X = r.X, Y = r.Y, Zy = r.Z;
    var svg = $('#tl');
    var W = Math.max(300, svg.clientWidth || 800), H = 150;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var end = Math.max(r.safe, Zy, 2035) + 2;
    var padL = 4, padR = 22, axisY = 124;
    var sx = function (yr) { return padL + (yr - NOW) / (end - NOW) * (W - padL - padR); };
    var h = [], narrow = W < 520;
    h.push('<line x1="' + sx(NOW) + '" x2="' + sx(end) + '" y1="' + axisY + '" y2="' + axisY + '" stroke="rgba(245,245,245,.3)"/>');
    var stepYr = narrow ? 4 : 2;
    for (var yr = NOW; yr <= end; yr += stepYr) {
      h.push('<line x1="' + sx(yr) + '" x2="' + sx(yr) + '" y1="' + axisY + '" y2="' + (axisY + 5) + '" stroke="rgba(245,245,245,.35)"/>');
      h.push('<text x="' + sx(yr) + '" y="' + (axisY + 19) + '" fill="#A3A7C6" font-size="11" text-anchor="' + (yr === NOW ? 'start' : 'middle') + '">' + yr + '</text>');
    }
    if (r.safe > Zy) h.push('<rect x="' + sx(Zy) + '" y="8" width="' + (sx(r.safe) - sx(Zy)) + '" height="' + (axisY - 14) + '" fill="rgba(208,239,27,.14)"/>');
    h.push('<line x1="' + sx(2035) + '" x2="' + sx(2035) + '" y1="4" y2="' + axisY + '" stroke="rgba(245,245,245,.4)" stroke-dasharray="3 4"/>');
    h.push(drawBar(sx(NOW), 40, sx(r.fin) - sx(NOW), 24, C_UP, '#FFFFFF', 'Upgrade ' + Y + ' yrs', W));
    h.push(drawBar(sx(r.fin), 78, sx(r.safe) - sx(r.fin), 24, C_SENS, '#000120', 'Stays sensitive ' + X + ' yrs', W));
    h.push('<line x1="' + sx(Zy) + '" x2="' + sx(Zy) + '" y1="4" y2="' + axisY + '" stroke="' + C_QDAY + '" stroke-width="2.5"/>');
    var qx = sx(Zy), anchor = qx > W - 110 ? 'end' : 'start', off = anchor === 'end' ? -6 : 6;
    h.push('<text x="' + (qx + off) + '" y="20" fill="' + C_QDAY + '" font-size="12" font-weight="700" text-anchor="' + anchor + '">Your Q‑Day ' + Zy + '</text>');
    svg.innerHTML = h.join('');
    $('#tlCap').innerHTML =
      '<span><i style="background:' + C_UP + '"></i>Time to upgrade</span>' +
      '<span><i style="background:' + C_SENS + '"></i>Time your data must stay secret</span>' +
      '<span><i style="background:rgba(208,239,27,.35)"></i>Window at risk</span>' +
      '<span><i style="background:transparent;border:1px dashed rgba(245,245,245,.6)"></i>NIST cut-off, 2035</span>';
  }
  function drawBar(x, y, w, hgt, c, ink, label, W) {
    var anim = reduce ? '' : '<animate attributeName="width" from="0" to="' + Math.max(2, w) + '" dur=".9s" fill="freeze" calcMode="spline" keySplines=".2 .7 .2 1" keyTimes="0;1"/>';
    var s = '<rect x="' + x + '" y="' + y + '" width="' + (reduce ? Math.max(2, w) : 0) + '" height="' + hgt + '" rx="3" fill="' + c + '">' + anim + '</rect>';
    var lw = label.length * 7, inside = w > lw + 20;
    var tx = inside ? x + 10 : (x + w + 8 + lw > W ? x - 8 : x + w + 8);
    var anchor = !inside && tx < x ? 'end' : 'start';
    s += '<text x="' + tx + '" y="' + (y + 16) + '" text-anchor="' + anchor + '" font-size="12" font-weight="600" fill="' + (inside ? ink : 'rgba(245,245,245,.9)') + '">' + label + '</text>';
    return s;
  }

  function restart() {
    state = { step: -1, ans: {} };
    show('intro');
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]');
    if (!a) return;
    var act = a.dataset.action;
    if (act === 'start') renderQ(0);
    else if (act === 'back') state.step > 0 ? renderQ(state.step - 1) : restart();
    else if (act === 'restart') restart();
  });
  window.addEventListener('resize', function () {
    if (state.step === 3) drawTimeline(QF.compute(state.ans));
  });
})();
