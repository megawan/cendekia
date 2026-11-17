// Shared motion for every Cendekia app, built on anime.js (shared/anime.esm.min.js, MIT, see anime.LICENSE.md).
// The library is loaded the first time something animates, so a page does not wait for it. Nothing is drawn when the
// device asks for reduced motion or the library cannot load.
//
//   Cendekia.fx.confetti(n)                  n pieces fall from the top of the screen
//   Cendekia.fx.confetti(n, { glyphs: [] })  the same with emoji instead of paper pieces
//   Cendekia.fx.burst(element)               a small ring of sparks around a right answer
//   Cendekia.fx.pop(element)                 the element swells and settles, for something that was just finished
//   Cendekia.fx.hop(element, left, top)      an absolutely placed element jumps to a new place in an arc
//   Cendekia.fx.drop(element)                the element falls into place from a little above
//   Cendekia.fx.mascot(svg)                  makes a mascot idle: it blinks and its marked parts move
//   Cendekia.fx.react(svg, 'cheer' | 'oops') the mascot hops and flaps, or shakes its head
//
// A mascot is drawn once in a <symbol> and shown with <use>. Its parts are marked with the classes crest, wing-l,
// wing-r, tail, mane and eyes inside the symbol (see PARTS); a part a mascot does not have is skipped.
(function () {
  var COLORS = ['#1f9d6b', '#f2a33a', '#e0558a', '#7a5af8', '#2e90fa', '#0e9aa7'];
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var lib = null;
  var layer = null;

  function load() {
    if (!lib) lib = import('./anime.esm.min.js').catch(function () { return null; });
    return lib;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // One layer above the page for all pieces, made on first use, so an app needs no markup for it.
  function stage() {
    if (!layer || !layer.isConnected) {
      layer = document.createElement('div');
      layer.setAttribute('aria-hidden', 'true');
      layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50';
      document.body.appendChild(layer);
    }
    return layer;
  }

  // Makes the pieces, runs one animation over them and removes them when it ends.
  function play(make, n, props) {
    if (reduce.matches) return;
    load().then(function (a) {
      if (!a || reduce.matches) return;
      var host = stage(), els = [];
      for (var k = 0; k < n; k++) els.push(host.appendChild(make(k)));
      props.onComplete = function () { els.forEach(function (e) { e.remove(); }); };
      a.animate(els, props);
    });
  }

  function confetti(n, opts) {
    var glyphs = opts && opts.glyphs;
    var h = window.innerHeight;
    play(function () {
      var p = document.createElement(glyphs ? 'span' : 'i');
      p.style.cssText = 'position:absolute;top:-40px;left:' + rand(0, 96) + '%';
      if (glyphs) { p.textContent = pick(glyphs); p.style.fontSize = '1.8rem'; }
      else p.style.cssText += ';top:-12px;width:10px;height:14px;border-radius:2px;background:' + pick(COLORS);
      return p;
    }, n, {
      translateX: function () { return rand(-80, 80); },
      translateY: h + 60,
      rotate: function () { return rand(-360, 360); },
      opacity: { from: 1, to: 0, ease: 'inCubic' },
      duration: function () { return rand(1500, 2600); },
      delay: function () { return rand(0, 400); },
      ease: 'outCubic'
    });
  }

  function burst(el) {
    if (!el || reduce.matches) return;
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2, n = 8;
    play(function (k) {
      var p = document.createElement('i');
      p.style.cssText = 'position:absolute;width:8px;height:8px;border-radius:50%;left:' + (cx - 4) + 'px;top:' + (cy - 4) + 'px;background:' + COLORS[k % COLORS.length];
      return p;
    }, n, {
      translateX: function (_, k) { return Math.cos(k / n * 2 * Math.PI) * 48; },
      translateY: function (_, k) { return Math.sin(k / n * 2 * Math.PI) * 48; },
      scale: [1, 0.2],
      opacity: [1, 0],
      duration: 550,
      ease: 'outQuad'
    });
  }

  // A <use> hides its parts from scripts, so the symbol's shapes are copied into the svg in its place.
  function inline(svg) {
    var use = svg.querySelector('use');
    var sym = use && document.querySelector(use.getAttribute('href'));
    if (!sym) return;
    Array.prototype.forEach.call(sym.children, function (c) { svg.insertBefore(c.cloneNode(true), use); });
    use.remove();
  }
  function pop(el) {
    if (!el || reduce.matches) return;
    load().then(function (a) {
      if (a) a.animate(el, { scale: [1, 1.06, 0.98, 1], duration: 520, ease: 'outQuad' });
    });
  }

  function hop(el, left, top) {
    function set() { el.style.left = left + 'px'; el.style.top = top + 'px'; }
    if (reduce.matches) { set(); return; }
    load().then(function (a) {
      if (!a) { set(); return; }
      a.remove(el);
      a.animate(el, { left: left, top: top, duration: 420, ease: 'inOutQuad' });
      a.animate(el, { translateY: [0, -26, 0], duration: 420, ease: 'outQuad' });
    });
  }

  function drop(el) {
    if (!el || reduce.matches) return;
    load().then(function (a) {
      if (a) a.animate(el, { translateY: [-22, 0], opacity: [0, 1], duration: 300, ease: 'outBounce' });
    });
  }

  // The parts a mascot can have. A part turns around its own box, so `hinge` is the point it hangs from. `idle` is its
  // slow movement while the mascot waits, and `cheer` how far it swings (rotate, in degrees) when the mascot hops.
  var PARTS = {
    '.crest':  { hinge: '50% 100%', idle: { rotate: [-5, 5], duration: 1900 } },
    '.wing-l': { hinge: '100% 0%',  idle: { rotate: [3, -4], duration: 2400 }, cheer: -35 },
    '.wing-r': { hinge: '0% 0%',    idle: { rotate: [-3, 4], duration: 2400 }, cheer: 35 },
    '.tail':   { hinge: '0% 100%',  idle: { rotate: [-5, 6], duration: 2100 }, cheer: 14 },
    '.mane':   { hinge: '50% 50%',  idle: { scale: [1, 1.035], duration: 2300 } },
    '.eyes':   { hinge: '50% 50%' }
  };
  function parts(svg, sel) { return svg.querySelectorAll(sel); }

  function mascot(svg) {
    if (!svg || svg.dataset.alive || reduce.matches) return;
    svg.dataset.alive = '1';
    load().then(function (a) {
      if (!a) return;
      inline(svg);
      Object.keys(PARTS).forEach(function (sel) {
        var part = PARTS[sel];
        parts(svg, sel).forEach(function (e) { e.style.transformBox = 'fill-box'; e.style.transformOrigin = part.hinge; });
        if (part.idle) a.animate(parts(svg, sel), Object.assign({ loop: true, alternate: true, ease: 'inOutSine' }, part.idle));
      });
      (function blink() {
        if (!svg.isConnected) return;
        if (!document.hidden) a.animate(parts(svg, '.eyes'), { scaleY: [1, 0.1, 1], duration: 180, ease: 'inOutQuad' });
        setTimeout(blink, rand(2200, 5200));
      })();
    });
  }

  function react(svg, mood) {
    if (!svg || reduce.matches) return;
    load().then(function (a) {
      if (!a) return;
      a.remove(svg); // a reaction still running is replaced, so a quick second answer starts clean
      if (mood === 'cheer') {
        a.animate(svg, { translateY: [0, -16, 0], scale: [1, 1.08, 1], duration: 480, ease: 'outQuad' });
        Object.keys(PARTS).forEach(function (sel) {
          // 'blend' adds the swing to the idle movement instead of cancelling it
          if (PARTS[sel].cheer) a.animate(parts(svg, sel), { rotate: [0, PARTS[sel].cheer, 0], duration: 480, ease: 'outQuad', composition: 'blend' });
        });
      } else if (mood === 'oops') {
        a.animate(svg, { translateX: [0, -7, 7, -5, 0], duration: 320, ease: 'inOutQuad' });
      }
    });
  }

  window.Cendekia = window.Cendekia || {};
  window.Cendekia.fx = { confetti: confetti, burst: burst, pop: pop, hop: hop, drop: drop, mascot: mascot, react: react };
})();
