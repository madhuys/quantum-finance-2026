/* motif-anim.js — subtle live versions of the Part-opener diagrams (15 Nov 2026).
   The SVGs come from motifs.py / bloch.py exactly as the print edition draws them; this file only
   adds motion on the web page. Each diagram starts when it scrolls into view, pauses off screen and
   when the tab is hidden. prefers-reduced-motion (or no IntersectionObserver): the static picture stays.
   Geometry constants below mirror motifs.py — change both together. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var LIME = '#D0EF1B', WHITE = '#F5F5F5';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  if (mq.matches || !('IntersectionObserver' in window) || !('requestAnimationFrame' in window)) return;

  function el(tag, attrs, parent, before) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.insertBefore(e, before || null);
    return e;
  }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function kids(svg, sel) { return Array.prototype.slice.call(svg.querySelectorAll(sel)); }

  /* ---------- Part I: double slit. Wavefronts travel from the source through both slits;
     single hits land on the screen with probability |amplitude|^2 and build up the fringes. ---------- */
  function slit(svg) {
    var CY = 240, S1 = 190, S2 = 290, STEP = 28, V = 30; // px per second, viewBox units
    var plane = kids(svg, ':scope > line').filter(function (l) { return +l.getAttribute('y1') === CY - 120; });
    var rings = kids(svg, 'g[clip-path] circle');
    var bands = kids(svg, ':scope > rect').filter(function (r) { return r.getAttribute('x') === '814'; });
    var prof = kids(svg, ':scope > path').filter(function (p) { return /^M832,30/.test(p.getAttribute('d')); })[0];
    var hitsG = el('g', { 'aria-hidden': 'true' }, svg, prof ? prof.nextSibling : null);
    var bandOp = bands.map(function (b) { return +b.getAttribute('fill-opacity'); });
    if (prof) { prof.setAttribute('pathLength', '1'); prof.setAttribute('stroke-dasharray', '1 1'); }
    var I = function (y) { var u = (y - CY) / 210; return Math.exp(-(u * 1.5) * (u * 1.5)) * Math.pow(Math.cos(u * 3.2 * Math.PI), 2); };
    var hits = [], MAXH = 220, nextHit = 0, seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function sample() { for (var k = 0; k < 60; k++) { var y = 30 + rnd() * 420; if (rnd() < I(y)) return y; } return CY; }
    var CYCLE = 13; // s: 8 build, 4 hold, 1 fade
    return function (t, dt) {
      // plane waves, source to barrier (x 106..300), fading at both ends
      plane.forEach(function (l, i) {
        var x = 106 + ((i * STEP + t * V) % (plane.length * STEP));
        l.setAttribute('x1', x.toFixed(1)); l.setAttribute('x2', x.toFixed(1));
        l.setAttribute('stroke-opacity', (0.55 * clamp((x - 106) / 24, 0, 1) * clamp((296 - x) / 14, 0, 1)).toFixed(3));
      });
      // circular wavefronts leaving each slit, same speed and spacing
      var n = rings.length / 2;
      rings.forEach(function (c, i) {
        var k = i % n, r = 4 + ((k * STEP + t * V) % (n * STEP));
        c.setAttribute('r', r.toFixed(1));
        c.setAttribute('stroke-opacity', (Math.max(0.08, 0.5 - r / 1300) * clamp(r / 30, 0, 1)).toFixed(3));
      });
      // the screen
      var c = t % CYCLE, p = ease(c / 8), fade = c > 12 ? 1 - (c - 12) : 1;
      if (c < dt + 0.02) { while (hitsG.firstChild) hitsG.removeChild(hitsG.firstChild); hits = []; nextHit = 0; }
      while (c < 8 && hits.length < MAXH && nextHit <= c) {
        hits.push(el('circle', { cx: (815 + rnd() * 14).toFixed(1), cy: sample().toFixed(1), r: (1 + rnd() * 1.4).toFixed(2), fill: LIME, 'fill-opacity': '0.9' }, hitsG));
        nextHit += 8 / MAXH;
      }
      hitsG.setAttribute('opacity', (fade * (c < 8 ? 1 : clamp(1 - (c - 8) / 3, 0.25, 1))).toFixed(3));
      bands.forEach(function (b, i) { b.setAttribute('fill-opacity', (bandOp[i] * p * fade).toFixed(3)); });
      if (prof) {
        prof.setAttribute('stroke-dashoffset', (1 - p).toFixed(3));
        prof.setAttribute('fill-opacity', (0.18 * p * fade).toFixed(3));
        prof.setAttribute('stroke-opacity', fade.toFixed(3));
      }
    };
  }

  /* ---------- Part II: circuit. A time slice runs left to right along the three wires; each
     operation lights as it is applied; the meters read out and the result runs off on the double wires. ---------- */
  function circuit(svg) {
    var YS = [90, 210, 330], X0 = 70, XM = 905, XE = 1000;
    var ops = [[160, 90, 90], [160, 330, 330], [300, 90, 210], [430, 210, 330], [560, 90, 90], [560, 330, 330], [690, 90, 330], [800, 210, 210]];
    var firstGate = kids(svg, ':scope > rect')[0];
    var halos = ops.map(function (o) {
      return { x: o[0], e: el('rect', { x: o[0] - 40, y: o[1] - 40, width: 80, height: o[2] - o[1] + 80, rx: 10, fill: LIME, 'fill-opacity': 0 }, svg, firstGate) };
    });
    var needles = kids(svg, ':scope > line').filter(function (l) { return +l.getAttribute('x1') === XM && l.getAttribute('stroke') === LIME; });
    var dots = YS.map(function (y) {
      var g = el('g', { opacity: 0 }, svg);
      el('circle', { cx: 0, cy: y, r: 14, fill: LIME, 'fill-opacity': 0.14 }, g);
      el('circle', { cx: 0, cy: y, r: 6, fill: LIME }, g);
      return g;
    });
    var CYCLE = 5.5, RUN = 3.6;
    return function (t) {
      var c = t % CYCLE, u = c / RUN, x = X0 + (XE - X0) * ease(u);
      var vis = c < RUN ? clamp(c / 0.25, 0, 1) * clamp((RUN - c) / 0.4, 0, 1) : 0;
      dots.forEach(function (g) { g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',0)'); g.setAttribute('opacity', vis.toFixed(3)); });
      halos.forEach(function (h) {
        var d = (x - h.x) / 34, a = c < RUN ? Math.exp(-d * d) : 0;
        h.e.setAttribute('fill-opacity', (0.28 * a).toFixed(3));
      });
      // meters: the needle swings when the slice arrives, then settles on its reading
      var since = c - RUN * 0.83;
      needles.forEach(function (n, i) {
        var a = since > 0 ? 38 * Math.exp(-since * 2.2) * Math.sin(since * 11 + i) : 0;
        n.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' ' + XM + ' ' + (YS[i] + 12) + ')');
      });
    };
  }

  /* ---------- Statement 03: amplitude amplification. The marked state |101> grows with each
     iteration while the others shrink (uniform -> one iteration -> two, the static picture). ---------- */
  function amp(svg) {
    var BASE = 250;
    var bars = kids(svg, ':scope > rect').filter(function (r) { return r.getAttribute('width') === '36' && +r.getAttribute('x') >= 580; });
    var halo = kids(svg, ':scope > rect').filter(function (r) { return r.getAttribute('width') === '48' && +r.getAttribute('x') >= 570; })[0];
    var arrow = kids(svg, ':scope > path').slice(-4);
    var hot = 5, stages = [[60, 60], [150, 34], [196, 22]]; // [marked, other] heights
    var CYCLE = 9;
    function setH(m, o) {
      bars.forEach(function (b, k) { var h = k === hot ? m : o; b.setAttribute('y', (BASE - h).toFixed(1)); b.setAttribute('height', h.toFixed(1)); });
      if (halo) { halo.setAttribute('y', (BASE - m - 6).toFixed(1)); halo.setAttribute('height', (m + 6).toFixed(1)); }
    }
    return function (t) {
      var c = t % CYCLE, s, a, pulse = 0;
      // 0-1.2 uniform; 1.2-2.4 -> iteration 1; hold; 3.6-4.8 -> iteration 2; hold; 8.2-9 back to uniform
      if (c < 1.2) { s = [stages[0], stages[0], 0]; }
      else if (c < 3.6) { a = ease((c - 1.2) / 1.2); s = [stages[0], stages[1], a]; pulse = c < 2.4 ? Math.sin(Math.PI * (c - 1.2) / 1.2) : 0; }
      else if (c < 8.2) { a = ease((c - 3.6) / 1.2); s = [stages[1], stages[2], a]; pulse = c < 4.8 ? Math.sin(Math.PI * (c - 3.6) / 1.2) : 0; }
      else { a = ease((c - 8.2) / 0.8); s = [stages[2], stages[0], a]; }
      setH(s[0][0] + (s[1][0] - s[0][0]) * s[2], s[0][1] + (s[1][1] - s[0][1]) * s[2]);
      arrow.forEach(function (p) { p.setAttribute('opacity', (0.55 + 0.45 * pulse).toFixed(3)); });
    };
  }

  /* ---------- Statement 04: entanglement network. Pulses travel along every link; the nodes breathe. ---------- */
  function net(svg) {
    var arcs = kids(svg, ':scope > g > path:last-child');
    var pulses = arcs.map(function (p, i) {
      var q = el('path', { d: p.getAttribute('d'), fill: 'none', stroke: LIME, 'stroke-width': 4.5, 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': '5 95' }, p.parentNode);
      return { e: q, k: i };
    });
    var cores = kids(svg, ':scope > circle').filter(function (c) { return Math.abs(+c.getAttribute('r') - 7.14) < 0.05; });
    return function (t) {
      pulses.forEach(function (p) {
        var ph = ((t * 0.32 + p.k * 0.17) % 1);
        p.e.setAttribute('stroke-dashoffset', (100 - ph * 100).toFixed(2));
        p.e.setAttribute('stroke-opacity', (Math.sin(Math.PI * ph) * 0.95).toFixed(3));
      });
      cores.forEach(function (c, i) { c.setAttribute('r', (7.14 * (1 + 0.22 * Math.max(0, Math.sin(t * 2.4 - i * 0.9)))).toFixed(2)); });
    };
  }

  /* ---------- Part III: Bell pair |01> - |10>. Both qubits turn by the same rotation (about the line of
     sight), so they stay exactly opposite at every instant, and each lands where the other started:
     they flip together. The bond between them oscillates as a standing wave. ---------- */
  function bell(svg) {
    var spheres = kids(svg, ':scope > svg').map(function (s) {
      var ch = Array.prototype.slice.call(s.children);
      var cloud = ch.filter(function (e) { return e.tagName.toLowerCase() === 'g'; })[0];
      var ci = ch.indexOf(cloud), start = -1;
      for (var i = ci + 1; i < ch.length; i++) if (ch[i].tagName.toLowerCase() === 'path' && ch[i].getAttribute('stroke') === LIME) { start = i; break; }
      var g = el('g', {}, s, ch[ch.length - 2]); // keep the two pole markers on top and in place
      if (cloud) g.appendChild(cloud);
      if (start > 0) ch.slice(start, ch.length - 2).forEach(function (e) { g.appendChild(e); });
      return g;
    });
    var bond = kids(svg, ':scope > path');
    var X1 = 412, X2 = 588, YB = 230;
    function wave(f) {
      var d = [];
      for (var k = 0; k <= 120; k++) { var u = k / 120; d.push((X1 + (X2 - X1) * u).toFixed(1) + ',' + (YB - f * 26 * Math.sin(Math.PI * u) * Math.sin(u * Math.PI * 6)).toFixed(1)); }
      return 'M' + d.join(' L');
    }
    var CYCLE = 6;
    return function (t) {
      var c = t % CYCLE, half = Math.floor(t / CYCLE) % 2;
      var a = 180 * (half + ease((c - 3.6) / 1.6));
      spheres.forEach(function (g) { g.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' 500 500)'); });
      var f = Math.cos(t * 2.2);
      bond.forEach(function (p, i) { p.setAttribute('d', wave(i < bond.length - 1 ? f : -f)); });
    };
  }

  /* ---------- Part IV: the Bloch-sphere seal. The outer interference rings turn slowly, the
     precession ring flows, the probability cloud shimmers and the state vector's tip glows. ---------- */
  function seal(svg) {
    var ch = Array.prototype.slice.call(svg.children);
    var rings = ch.filter(function (e) { return e.tagName.toLowerCase() === 'circle' && /^1 \d+$/.test(e.getAttribute('stroke-dasharray') || ''); });
    var cloud = ch.filter(function (e) { return e.tagName.toLowerCase() === 'g'; }).pop();
    var groups = [];
    if (cloud) {
      var dots = Array.prototype.slice.call(cloud.children);
      for (var k = 0; k < 3; k++) groups.push(el('g', {}, cloud));
      dots.forEach(function (d, i) { groups[i % 3].appendChild(d); });
    }
    var cone = ch.filter(function (e) { return e.getAttribute('stroke-dasharray') === '7 6'; });
    var halo = ch.filter(function (e) { return e.tagName.toLowerCase() === 'circle' && e.getAttribute('r') === '26'; });
    return function (t) {
      rings.forEach(function (r, i) { r.setAttribute('transform', 'rotate(' + ((i % 2 ? -1 : 1) * t * (4 - i)).toFixed(2) + ' 500 500)'); });
      groups.forEach(function (g, i) { g.setAttribute('opacity', (0.72 + 0.28 * Math.sin(t * 1.3 + i * 2.1)).toFixed(3)); });
      cone.forEach(function (p) { p.setAttribute('stroke-dashoffset', (-t * 14).toFixed(1)); });
      halo.forEach(function (h) { h.setAttribute('r', (26 * (1 + 0.25 * Math.sin(t * 2))).toFixed(2)); });
    };
  }

  var KINDS = [['svg.m-slit', slit], ['svg.m-circuit', circuit], ['svg.m-amp', amp], ['svg.m-net', net], ['svg.m-bell', bell], ['.part-banner svg.bloch', seal]];
  var items = [];
  KINDS.forEach(function (k) {
    Array.prototype.forEach.call(document.querySelectorAll(k[0]), function (svg) {
      var orig = svg.cloneNode(true);
      try { items.push({ svg: svg, orig: orig, step: k[1](svg), t: 0, on: false }); }
      catch (e) { if (svg.parentNode) svg.parentNode.replaceChild(orig, svg); } // never leave a half-built picture
    });
  });
  if (!items.length) return;

  var raf = 0, last = 0;
  function anyOn() { for (var i = 0; i < items.length; i++) if (items[i].on) return true; return false; }
  function frame(now) {
    var dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    items.forEach(function (it) { if (it.on) { it.t += dt; it.step(it.t, dt); } });
    raf = anyOn() && !document.hidden ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  }
  function kick() { if (!raf && anyOn() && !document.hidden) raf = requestAnimationFrame(frame); }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      items.forEach(function (it) { if (it.svg === e.target) it.on = e.isIntersecting; });
    });
    kick();
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });
  items.forEach(function (it) { it.step(0, 0); io.observe(it.svg); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; last = 0; } else kick();
  });
  // reduced motion switched on while reading: stop and put the static pictures back
  if (mq.addEventListener) mq.addEventListener('change', function () {
    if (!mq.matches) return;
    if (raf) cancelAnimationFrame(raf);
    raf = 0; io.disconnect();
    items.forEach(function (it) { it.on = false; if (it.svg.parentNode) it.svg.parentNode.replaceChild(it.orig, it.svg); });
  });
  window.__motifAnim = items; // for QA only
})();

/* Part banners (desktop): centre the big numeral's INK on the DRAWING, not on the svg box that also holds the labels
   below it, nor on the numeral's own line box (the display face draws its glyph high in the box).
   C = drawing's vertical centre / viewBox height, measured from the svgs (15 Nov 2026); others use the box centre. */
(function () {
  var C = { 'm-slit': 240 / 520, 'm-bell': 230 / 520 };
  var ctx = document.createElement('canvas').getContext('2d');
  function inkMid(n, top, h) {
    var cs = getComputedStyle(n);
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    var m = ctx.measureText(n.textContent.trim());
    if (!m.fontBoundingBoxAscent) return top + h / 2;
    var lh = parseFloat(cs.lineHeight) || h;
    var base = top + (lh - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
    return base - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  }
  function run() {
    document.querySelectorAll('.part-banner .pb-head').forEach(function (h) {
      var n = h.querySelector('.pb-num'), s = h.querySelector('svg');
      if (!n) return;
      n.style.transform = '';
      if (!s || window.innerWidth < 901) return;
      var c = 0.5;
      for (var k in C) if (s.classList.contains(k)) c = C[k];
      var sr = s.getBoundingClientRect(), nr = n.getBoundingClientRect();
      var d = sr.top + c * sr.height - inkMid(n, nr.top, nr.height);
      n.style.transform = 'translateY(' + d.toFixed(1) + 'px)';
    });
  }
  window.addEventListener('resize', run);
  window.addEventListener('load', run);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  run();
})();
