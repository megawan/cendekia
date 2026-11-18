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
//   Cendekia.fx.reveal(stars, gift)          the earned stars (.on) pop in one by one, then the new-sticker box drops in
//   Cendekia.fx.flip(element)                the element turns over like a card (its parent needs CSS `perspective`)
//   Cendekia.fx.loop(ms, step)               calls step(0..1) each frame, once round every ms, forever; returns a function that stops it
//   Cendekia.fx.drag(element, opts)          lets the element be dragged along one axis in steps (opts: axis, step (pixels or a function returning them), onGrab, onDrag, onSettle)
//   Cendekia.fx.cascade(elements)         the elements rise in one after another
//   Cendekia.fx.count(element)               the first number in the element counts up from 0 ("12 stars" keeps its words)
//   Cendekia.fx.flame(element)               the element flickers like a flame, for the days in a row
//   Cendekia.fx.mascot(svg)                  makes a mascot idle: it blinks and its marked parts move
//   Cendekia.fx.react(svg, 'cheer' | 'oops') the mascot hops and flaps, or shakes its head
//
// On a home screen, the numbers in #homeStars and #homeDays count up each time it appears, and the flame of a streak
// flickers. Screens need no call: an app is a set of <section>s in <main>, shown one at a time by toggling `hidden`. Once the page
// has loaded, every section that appears has its children rise in one after another (the first screen is left alone).
//
// A mascot is drawn once in a <symbol> and shown with <use>. Its parts are marked with the classes crest, wing-l,
// wing-r, ear-l, ear-r, tail, mane and eyes inside the symbol (see PARTS); a part a mascot does not have is skipped.
(function () {
  var COLORS = ['#1f9d6b', '#f2a33a', '#e0558a', '#7a5af8', '#2e90fa', '#0e9aa7'];
  var reduce = { get matches() { return window.Cendekia ? window.Cendekia.calm() : false; } }; // device setting or Accessibility > Calm
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

  // Earned stars and the sticker box are hidden at once, so they do not show for a moment before the animation starts,
  // and shown again if the library cannot load.
  function reveal(starsEl, giftEl) {
    if (reduce.matches) return;
    var on = starsEl ? Array.prototype.slice.call(starsEl.querySelectorAll('.on')) : [];
    var gift = giftEl && !giftEl.hidden ? giftEl : null;
    var held = gift ? on.concat(gift) : on;
    if (!held.length) return;
    held.forEach(function (e) { e.style.opacity = '0'; });
    load().then(function (a) {
      if (!a) { held.forEach(function (e) { e.style.opacity = ''; }); return; }
      if (on.length) a.animate(on, { scale: [0, 1], rotate: [-40, 0], opacity: [0, 1], duration: 650, delay: a.stagger(240, { start: 300 }), ease: 'outBack' });
      if (gift) a.animate(gift, { translateY: [28, 0], scale: [0.85, 1], opacity: [0, 1], duration: 520, delay: 300 + on.length * 240 + 200, ease: 'outBack' });
    });
  }

  // The parts a mascot can have. A part turns around its own box, so `hinge` is the point it hangs from. `idle` is its
  // slow movement while the mascot waits, and `cheer` how far it swings (rotate, in degrees) when the mascot hops.
  var PARTS = {
    '.crest':  { hinge: '50% 100%', idle: { rotate: [-5, 5], duration: 1900 } },
    '.wing-l': { hinge: '100% 0%',  idle: { rotate: [3, -4], duration: 2400 }, cheer: -35 },
    '.wing-r': { hinge: '0% 0%',    idle: { rotate: [-3, 4], duration: 2400 }, cheer: 35 },
    '.tail':   { hinge: '0% 100%',  idle: { rotate: [-5, 6], duration: 2100 }, cheer: 14 },
    '.ear-l':  { hinge: '70% 100%', idle: { rotate: [-3, 4], duration: 2200 }, cheer: -14 },
    '.ear-r':  { hinge: '30% 100%', idle: { rotate: [3, -4], duration: 2200 }, cheer: 14 },
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
        if (part.idle && parts(svg, sel).length) a.animate(parts(svg, sel), Object.assign({ loop: true, alternate: true, ease: 'inOutSine' }, part.idle));
      });
      (function blink() {
        if (!svg.isConnected) { a.remove(svg.querySelectorAll('*')); return; } // a mascot taken out of the page stops moving
        if (!document.hidden && parts(svg, '.eyes').length) a.animate(parts(svg, '.eyes'), { scaleY: [1, 0.1, 1], duration: 180, ease: 'inOutQuad' });
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
          if (PARTS[sel].cheer && parts(svg, sel).length) a.animate(parts(svg, sel), { rotate: [0, PARTS[sel].cheer, 0], duration: 480, ease: 'outQuad', composition: 'blend' });
        });
      } else if (mood === 'oops') {
        a.animate(svg, { translateX: [0, -7, 7, -5, 0], duration: 320, ease: 'inOutQuad' });
      }
    });
  }

  // The elements are hidden before the browser paints, so they do not show for a moment before they animate, and
  // shown again if the library cannot load. Their inline opacity and transform are cleared when the animation ends.
  function cascade(els, gap) {
    var kids = Array.prototype.slice.call(els || []);
    if (!kids.length || reduce.matches) return;
    kids.forEach(function (e) { e.style.opacity = '0'; });
    function clear() { kids.forEach(function (e) { e.style.opacity = ''; e.style.transform = ''; }); }
    load().then(function (a) {
      if (!a) { clear(); return; }
      a.remove(kids);
      a.animate(kids, { translateY: [14, 0], opacity: [0, 1], duration: 320, delay: a.stagger(gap || 35), ease: 'outCubic', onComplete: clear });
    });
  }
  function enter(sec) {
    cascade(Array.prototype.slice.call(sec.children, 0, 8).filter(function (e) { return !e.hidden; }));
    count(sec.querySelector('#homeStars'));
    count(sec.querySelector('#homeDays'));
    lightFlame(sec);
  }

  function count(el) {
    var m = el && el.textContent.match(/\d+/);
    if (!m || !+m[0] || reduce.matches) return;
    var text = el.textContent, to = +m[0], n = { v: 0 };
    el.textContent = text.replace(/\d+/, '0'); // before the first paint, so the real number does not show first
    load().then(function (a) {
      if (!a) { el.textContent = text; return; }
      a.animate(n, {
        v: to, duration: 800, ease: 'outCubic',
        onUpdate: function () { el.textContent = text.replace(/\d+/, Math.round(n.v)); },
        onComplete: function () { el.textContent = text; }
      });
    });
  }

  function flame(el) {
    if (!el || reduce.matches || el.dataset.lit) return;
    el.dataset.lit = '1';
    el.style.display = 'inline-block'; el.style.transformOrigin = '50% 90%';
    load().then(function (a) {
      if (a) a.animate(el, { scale: [1, 1.18, 0.96, 1.12, 1], rotate: [-4, 5, -3, 4, -4], duration: 1500, loop: true, ease: 'inOutSine' });
    });
  }
  // The icon beside the days in a row, when there is a streak.
  function lightFlame(root) {
    var days = root.querySelector('#homeDays'), pill = days && days.closest('.pill');
    if (pill && /[1-9]/.test(days.textContent)) flame(pill.firstElementChild);
  }

  function flip(el) {
    if (!el || reduce.matches) return;
    load().then(function (a) {
      if (!a) return;
      a.remove(el);
      a.animate(el, { rotateY: [90, 0], scale: [0.92, 1], duration: 460, ease: 'outBack', onComplete: function () { el.style.transform = ''; } });
    });
  }
  function watchScreens() {
    var main = document.querySelector('main');
    if (!main || !window.MutationObserver || reduce.matches) return;
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        var s = m.target;
        // oldValue is null when the section was already shown, so only a section that was hidden counts
        if (s.parentNode === main && s.tagName === 'SECTION' && m.oldValue !== null && !s.hasAttribute('hidden')) enter(s);
      });
    }).observe(main, { attributes: true, attributeFilter: ['hidden'], attributeOldValue: true, subtree: true });
  }
  // Calls step(0..1) every frame, going round once every `ms` and again and again, until the returned function is called.
  function loop(ms, step) {
    var stopped = false, anim = null;
    if (!reduce.matches) load().then(function (a) {
      if (!a || stopped || reduce.matches) return;
      var o = { t: 0 };
      anim = a.animate(o, { t: 1, duration: ms, ease: 'linear', loop: true, onUpdate: function () { step(o.t); } });
    });
    return function () { stopped = true; if (anim) anim.pause(); };
  }
  // Lets a finger or mouse drag the element along one axis, in steps of o.step pixels, with anime.js's draggable. The caller
  // keeps the element's real place (CSS left and top), the drag only moves it by a transform. o.axis is 'x' or 'y'.
  // The returned object: range(min, max) limits how far it may go (pixels from where it is, set when it is grabbed);
  // reset() puts it back at zero once the caller has moved it for real; enable(false) stops it being dragged.
  // o.onGrab() and o.onDrag(px) run while it is held and o.onSettle(px) when it has come to rest on a step.
  // Dragging is a way to play, not a decoration, so it works with reduced motion too; without the library nothing is draggable.
  function drag(el, o) {
    var lo = 0, hi = 0, d = null, on = true, axis = o.axis === 'y' ? 'y' : 'x';
    var api = {
      range: function (a, b) { lo = a; hi = b; },
      reset: function () { if (d) { if (axis === 'x') d.setX(0, true); else d.setY(0, true); } },
      enable: function (yes) { on = yes; if (d) { if (yes) d.enable(); else d.disable(); } }
    };
    load().then(function (a) {
      if (!a) return;
      // The step is read each time (o.step may be a function) so a lane that has been resized still snaps to its cells.
      var spec = { modifier: function (v) { var st = typeof o.step === 'function' ? o.step() : o.step; return Math.max(lo, Math.min(hi, st ? Math.round(v / st) * st : v)); } };
      d = a.createDraggable(el, {
        x: axis === 'x' ? spec : false,
        y: axis === 'y' ? spec : false,
        // Held inside its own lane's box, and the page must not scroll under a drag that ends near the window's edge.
        container: el.parentNode, scrollSpeed: 0, scrollThreshold: 0,
        releaseEase: 'outQuad', releaseStiffness: 120,
        onGrab: function () { if (o.onGrab) o.onGrab(); },
        onDrag: function (s) { if (o.onDrag) o.onDrag(axis === 'x' ? s.x : s.y); },
        onSettle: function (s) { if (o.onSettle) o.onSettle(axis === 'x' ? s.x : s.y); }
      });
      if (!on) d.disable();
    });
    return api;
  }
  function start() { watchScreens(); lightFlame(document); }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);

  window.Cendekia = window.Cendekia || {};
  window.Cendekia.fx = { confetti: confetti, burst: burst, count: count, flame: flame, flip: flip, cascade: cascade, reveal: reveal, pop: pop, hop: hop, drop: drop, mascot: mascot, react: react, loop: loop, drag: drag };
})();
