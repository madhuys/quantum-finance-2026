(function () {
  var cv = document.querySelector('.bloch-canvas');
  if (!cv || !cv.getContext) return;
  document.documentElement.classList.add('js-hero');
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var LIME = '208,239,27', NEON = '230,255,61', WHITE = '245,245,245';
  var EL = 20 * Math.PI / 180, AZ0 = -28 * Math.PI / 180;
  var THETA = 54 * Math.PI / 180, PHI0 = -28 * Math.PI / 180;
  var W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;
  var s = 7; function rnd() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
  function gauss() { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
  var N = window.innerWidth < 700 ? 1500 : 2600, cloud = [];
  var sx = Math.sin(THETA), sz = Math.cos(THETA);
  while (cloud.length < N) {
    var u = rnd() * 2 - 1, v = rnd() * 2 * Math.PI, q = Math.sqrt(1 - u * u);
    var nx = q * Math.cos(v), ny = q * Math.sin(v), nz = u;
    var p = Math.pow((1 + nx * sx + nz * sz) / 2, 2.4);
    if (rnd() < p) {
      var r = 1 - Math.abs(gauss() * 0.05);
      cloud.push([nx * r, ny * r, nz * r, p, rnd() * 6.283, 0.7 + 2 * p * rnd(), rnd() < 0.5 && p > 0.75]);
    }
  }
  function size() {
    var b = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = b.width; H = b.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(W, H) * 0.3; cx = W / 2; cy = H / 2;
  }
  function proj(x, y, z, az) {
    var ca = Math.cos(az), sa = Math.sin(az);
    var x1 = x * ca - y * sa, y1 = x * sa + y * ca;
    var ce = Math.cos(EL), se = Math.sin(EL);
    return [cx + R * x1, cy - R * (z * ce - y1 * se), y1 * ce + z * se];
  }
  function ring(fn, az, alphaFront, alphaBack, col, dash) {
    var prev = null;
    for (var i = 0; i <= 160; i++) {
      var t = 2 * Math.PI * i / 160, a = fn(t), P = proj(a[0], a[1], a[2], az);
      if (prev) {
        var back = (P[2] + prev[2]) / 2 > 0;
        ctx.strokeStyle = 'rgba(' + col + ',' + (back ? alphaBack : alphaFront) + ')';
        ctx.setLineDash(back ? [3, 5] : (dash || []));
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(P[0], P[1]); ctx.stroke();
      }
      prev = P;
    }
    ctx.setLineDash([]);
  }
  function frame(t) {
    var az = AZ0 + Math.sin(t * 0.00006) * 0.25;
    var phi = PHI0 + t * 0.00028;
    var th = THETA + Math.sin(t * 0.0004) * 0.06;
    ctx.clearRect(0, 0, W, H);
    [[18, .035], [10, .06], [5, .1]].forEach(function (g) {
      ctx.lineWidth = g[0]; ctx.strokeStyle = 'rgba(' + LIME + ',' + g[1] + ')';
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
    });
    ctx.fillStyle = 'rgba(5,5,5,.55)'; ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(' + LIME + ',.75)';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1;
    [30, 60, 90, 120, 150].forEach(function (d) {
      var L = d * Math.PI / 180, eq = d === 90;
      ring(function (u) { return [Math.sin(L) * Math.cos(u), Math.sin(L) * Math.sin(u), Math.cos(L)]; }, az, eq ? .62 : .2, eq ? .15 : .07, WHITE);
    });
    [0, 30, 60, 90, 120, 150].forEach(function (d) {
      var M = d * Math.PI / 180;
      ring(function (u) { return [Math.sin(u) * Math.cos(M), Math.sin(u) * Math.sin(M), Math.cos(u)]; }, az, d === 0 ? .45 : .18, .07, WHITE);
    });
    var cp = Math.cos(phi), sp = Math.sin(phi);
    for (var i = 0; i < cloud.length; i++) {
      var c = cloud[i], x = c[0] * cp - c[1] * sp, y = c[0] * sp + c[1] * cp;
      var P = proj(x, y, c[2], az);
      var tw = reduce.matches ? 1 : 0.65 + 0.35 * Math.sin(t * 0.002 + c[4]);
      var a = Math.min(.95, (0.18 + 0.75 * c[3]) * (P[2] < 0 ? 1 : .35) * tw);
      ctx.fillStyle = 'rgba(' + (c[6] ? NEON : LIME) + ',' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(P[0], P[1], c[5] * R / 330, 0, 6.283); ctx.fill();
    }
    var stx = Math.sin(th) * Math.cos(phi), sty = Math.sin(th) * Math.sin(phi), stz = Math.cos(th);
    ctx.lineWidth = 1.4;
    ring(function (u) { return [Math.sin(th) * Math.cos(u), Math.sin(th) * Math.sin(u), Math.cos(th)]; }, az, .85, .25, LIME, [7, 6]);
    var T = proj(stx, sty, stz, az), E = proj(stx, sty, 0, az);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(' + LIME + ',.45)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(E[0], E[1]); ctx.lineTo(T[0], T[1]); ctx.stroke(); ctx.setLineDash([]);
    ctx.setLineDash([2, 6]); ctx.strokeStyle = 'rgba(' + WHITE + ',.28)'; ctx.lineWidth = 1;
    var A = proj(0, 0, 1.18, az), B = proj(0, 0, -1.18, az);
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); ctx.setLineDash([]);
    var ang = Math.atan2(T[1] - cy, T[0] - cx), hx = T[0] - 22 * Math.cos(ang) * R / 330, hy = T[1] - 22 * Math.sin(ang) * R / 330;
    [[20, .05], [12, .09], [6, .16]].forEach(function (g) {
      ctx.lineCap = 'round'; ctx.lineWidth = g[0] * R / 330; ctx.strokeStyle = 'rgba(' + NEON + ',' + g[1] + ')';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.stroke();
    });
    ctx.lineWidth = Math.max(2, 3.2 * R / 330); ctx.strokeStyle = 'rgb(' + LIME + ')';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.stroke();
    var lx = Math.cos(ang + Math.PI / 2), ly = Math.sin(ang + Math.PI / 2), k = 9 * R / 330;
    ctx.fillStyle = 'rgb(' + LIME + ')';
    ctx.beginPath(); ctx.moveTo(T[0], T[1]); ctx.lineTo(hx + k * lx, hy + k * ly); ctx.lineTo(hx - k * lx, hy - k * ly); ctx.fill();
    var gr = ctx.createRadialGradient(T[0], T[1], 0, T[0], T[1], 28 * R / 330);
    gr.addColorStop(0, 'rgba(' + NEON + ',.55)'); gr.addColorStop(1, 'rgba(' + NEON + ',0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(T[0], T[1], 28 * R / 330, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(T[0], T[1], 4 * R / 330, 0, 6.283); ctx.fill();
    var N0 = proj(0, 0, 1, az), S1 = proj(0, 0, -1, az), fs = Math.max(13, 24 * R / 330);
    ctx.lineWidth = 1.5; ctx.fillStyle = '#000';
    ctx.strokeStyle = 'rgb(' + LIME + ')'; ctx.beginPath(); ctx.arc(N0[0], N0[1], 4.5, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(' + WHITE + ',.7)'; ctx.beginPath(); ctx.arc(S1[0], S1[1], 4.5, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.font = fs + 'px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(' + WHITE + ',.9)'; ctx.fillText('|0⟩', N0[0] + 14, N0[1] - 14);
    ctx.fillStyle = 'rgba(' + WHITE + ',.7)'; ctx.fillText('|1⟩', S1[0] + 14, S1[1] + fs + 6);
    ctx.font = '700 ' + (fs * 1.08) + 'px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgb(' + LIME + ')'; ctx.fillText('|ψ⟩', T[0] + 18, T[1] - 14);
  }
  var visible = true, running = false;
  function loop(t) { if (!visible || reduce.matches) { running = false; return; } frame(t); requestAnimationFrame(loop); }
  function start() { if (!running && visible && !reduce.matches) { running = true; requestAnimationFrame(loop); } }
  function still() { frame(0); }
  size(); still();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!running) still(); });
  window.addEventListener('resize', function () { size(); if (!running) still(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(cv);
  }
  reduce.addEventListener && reduce.addEventListener('change', function () { reduce.matches ? still() : start(); });
  start();
})();
