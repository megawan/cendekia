// Shared motion for every Cendekia app, built on anime.js (shared/anime.esm.min.js, MIT, see anime.LICENSE.md).
// The library is loaded the first time something animates, so a page does not wait for it. Nothing is drawn when the
// device asks for reduced motion or the library cannot load.
//
//   Cendekia.fx.confetti(n)                  n pieces fall from the top of the screen
//   Cendekia.fx.confetti(n, { glyphs: [] })  the same with emoji instead of paper pieces
//   Cendekia.fx.burst(element)               a small ring of sparks around a right answer
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

  window.Cendekia = window.Cendekia || {};
  window.Cendekia.fx = { confetti: confetti, burst: burst };
})();
