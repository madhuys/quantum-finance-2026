// Quantum Finance 2026-2027 Vol 1 Microsite reader (PROVE v4 architecture):
// black edition: glass app bar, reading progress and citation drawer (hero lives in hero.js).
(function () {
  var root = document.documentElement;
  var bar = document.querySelector('.bar');
  var heroEl = document.querySelector('.hero');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---- App bar glass & paper state + reading progress
  function onScroll() {
    if (heroEl && bar) {
      var r = heroEl.getBoundingClientRect();
      bar.classList.toggle('on-paper', r.bottom < 68);
      bar.classList.toggle('glass', window.scrollY > 8);
    }
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docH > 0 ? Math.min(100, Math.max(0, (window.scrollY / docH) * 100)) : 0;
    root.style.setProperty('--scroll-p', pct.toFixed(2) + '%');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // ---- Subtle pointer/scroll parallax on hero planes (respects prefers-reduced-motion)
  if (!reduce.matches && heroEl) {
    var plate = heroEl.querySelector('.plate');
    var glow = heroEl.querySelector('.glow');
    var near = heroEl.querySelector('.near');
    var orbit = heroEl.querySelector('.hero-orbit');
    var mx = 0, my = 0, tmx = 0, tmy = 0, raf = false, heroVis = true;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        heroVis = es[0].isIntersecting;
        if (heroVis) tickKick();
      }).observe(heroEl);
    }
    if (window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', function (e) {
        tmx = (e.clientX / window.innerWidth) * 2 - 1;
        tmy = (e.clientY / window.innerHeight) * 2 - 1;
        tickKick();
      }, { passive: true });
    }
    function tickKick() {
      if (!raf && heroVis) {
        raf = true;
        requestAnimationFrame(stepHero);
      }
    }
    function stepHero() {
      raf = false;
      mx += (tmx - mx) * 0.08;
      my += (tmy - my) * 0.08;
      if (plate) plate.style.transform = 'translate3d(' + (mx * -5).toFixed(1) + 'px,' + (my * -4).toFixed(1) + 'px,0)';
      if (near) near.style.transform = 'translate3d(' + (mx * -20).toFixed(1) + 'px,' + (my * -16).toFixed(1) + 'px,0)';
      if (orbit) orbit.style.transform = 'translate3d(' + (mx * 8).toFixed(1) + 'px,' + (my * 6).toFixed(1) + 'px,0)';
      if (glow) glow.style.setProperty('--gx', (68 + mx * 3).toFixed(1) + '%');
      if (Math.abs(tmx - mx) > 0.002 || Math.abs(tmy - my) > 0.002) tickKick();
    }
  }

  // ---- Citation popover drawer (fixed bottom-right, page never jumps unexpectedly)
  var pop = document.querySelector('.pop');
  if (pop) {
    var popT = pop.querySelector('.pop-t');
    var popQ = pop.querySelector('.pop-q');
    var popSrc = pop.querySelector('.pop-src');
    var popGo = pop.querySelector('.pop-go');
    var opener = null;

    function closePop() {
      pop.hidden = true;
      if (opener) {
        opener.focus({ preventScroll: true });
        opener = null;
      }
    }

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a.cite-link[data-ref]');
      if (a) {
        var refId = a.dataset.ref;
        var entry = (window.REFERENCES || {})[refId];
        if (!entry) return;
        e.preventDefault();
        opener = a;
        popT.textContent = 'Reference [' + refId + ']';
        popQ.textContent = entry.text;
        if (entry.url) {
          popSrc.hidden = false;
          popSrc.href = entry.url;
        } else {
          popSrc.hidden = true;
        }
        popGo.href = '#ref-' + refId;
        pop.hidden = false;
        pop.querySelector('.pop-x').focus({ preventScroll: true });
        return;
      }
      if (!pop.hidden && !e.target.closest('.pop')) {
        closePop();
      }
    });

    pop.querySelector('.pop-x').addEventListener('click', closePop);
    popGo.addEventListener('click', function (e) {
      e.preventDefault();
      var targetHref = popGo.getAttribute('href');
      pop.hidden = true;
      opener = null;
      var el = document.querySelector(targetHref);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('flash');
        setTimeout(function () { el.classList.remove('flash'); }, 1800);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pop.hidden) closePop();
    });
  }

  // ---- Reveal on scroll + chapter-in-view (skipped with reduced motion)
  if (!reduce.matches && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.st-band, .part-banner').forEach(function (el) { io.observe(el); });
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('in-view', e.isIntersecting); });
    }, { rootMargin: '-35% 0px -35% 0px' });
    document.querySelectorAll('.chapter').forEach(function (el) { cio.observe(el); });
  }
})();
