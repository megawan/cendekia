/* Letter tracing for Cendekia apps. Loaded after shared/profile.js; adds Cendekia.trace.
 *
 *   var t = Cendekia.trace(hostElement, { font: '"Andika", sans-serif', weight: 700, scale: .8, label: 'letter', onDone: fn });
 *   t.set('b');   // shows the letter to trace and clears the drawing
 *
 * The letter is drawn from the font, so no stroke data is needed and any script works. The child draws with a finger
 * or mouse; the drawing is compared with the letter on a small grid:
 *   coverage: the share of the letter's pixels the child's line went over
 *   accuracy: the share of the child's line that stayed on the letter
 * The letter counts as traced when coverage is high enough and every separate part of it (the dots of a hijaiyah
 * letter, for example) was touched. onDone gets { stars: 1-3, coverage, accuracy, ms } once. Stroke order is not checked. */
(function () {
  'use strict';
  var root = window.Cendekia = window.Cendekia || {};
  var GRID = 128, PASS = 0.8, PART = 0.5;
  var styled = false;
  function style() {
    if (styled) return; styled = true;
    var css = document.createElement('style');
    css.textContent =
      '.tr{display:grid;gap:10px;justify-items:center}' +
      '.tr-box{position:relative;width:min(100%,380px);aspect-ratio:1;background:#fff;border:2px solid #cfe0f5;border-radius:20px;overflow:hidden}' +
      '.tr-box canvas{position:absolute;inset:0;width:100%;height:100%}' +
      '.tr-ink{touch-action:none;cursor:crosshair}' +
      '.tr-box.done{border-color:#1f9d6b;box-shadow:0 0 0 4px rgba(31,157,107,.25)}' +
      '.tr-meter{width:min(100%,380px);height:14px;border-radius:7px;background:#cfe0f5;overflow:hidden}' +
      '.tr-meter i{display:block;height:100%;width:0;background:#f2a33a;border-radius:7px;transition:width .15s}' +
      '.tr-box.done+.tr-meter i{background:#1f9d6b}' +
      '.tr-msg{min-height:1.5em;margin:0;font-weight:700;text-align:center}';
    document.head.appendChild(css);
  }

  root.trace = function (host, o) {
    o = o || {};
    style();
    var font = o.font || 'system-ui, sans-serif', weight = o.weight || 700, scale = o.scale || 0.8, brush = o.brush || 0.075;
    var box = document.createElement('div'); box.className = 'tr-box';
    var guide = document.createElement('canvas'), ink = document.createElement('canvas');
    ink.className = 'tr-ink'; ink.setAttribute('role', 'img');
    box.appendChild(guide); box.appendChild(ink);
    var meter = document.createElement('div'); meter.className = 'tr-meter'; meter.innerHTML = '<i></i>';
    var msg = document.createElement('p'); msg.className = 'tr-msg'; msg.setAttribute('aria-live', 'polite');
    var again = document.createElement('button'); again.type = 'button'; again.className = 'btn ghost'; again.textContent = o.clearText || 'Start again';
    var wrap = document.createElement('div'); wrap.className = 'tr';
    wrap.appendChild(box); wrap.appendChild(meter); wrap.appendChild(msg); wrap.appendChild(again);
    host.appendChild(wrap);

    var text = '', size = 0, strokes = [], cur = null, finished = false, started = 0;
    var score = document.createElement('canvas'); score.width = score.height = GRID;
    var sctx = score.getContext('2d', { willReadFrequently: true });
    var mask = null, comp = null, compSize = [], glyphCount = 0;
    var raf = 0;

    function fontSpec(px) { return weight + ' ' + px + 'px ' + font; }
    // Where to draw the text so its box sits in the middle of a square of side `s`, and at what font size.
    function layout(ctx, s) {
      ctx.font = fontSpec(100); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      var m = ctx.measureText(text);
      var w = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) || 50, h = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) || 70;
      var px = Math.min(scale * s, 100 * 0.82 * s / Math.max(w, h)), k = px / 100;
      return { px: px, x: s / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) * k / 2,
               y: s / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) * k / 2 };
    }

    function buildMask() {
      sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, GRID, GRID);
      var L = layout(sctx, GRID);
      sctx.font = fontSpec(L.px); sctx.fillStyle = '#000';
      sctx.fillText(text, L.x, L.y);
      var d = sctx.getImageData(0, 0, GRID, GRID).data, n = GRID * GRID;
      mask = new Uint8Array(n); glyphCount = 0;
      for (var i = 0; i < n; i++) if (d[i * 4 + 3] > 100) { mask[i] = 1; glyphCount++; }
      // Separate parts of the letter (a dot is a part of its own), by flood fill.
      comp = new Int16Array(n); compSize = [0];
      var next = 1, stack = [];
      for (var s = 0; s < n; s++) {
        if (!mask[s] || comp[s]) continue;
        var cnt = 0; stack.push(s); comp[s] = next;
        while (stack.length) {
          var p = stack.pop(); cnt++;
          var x = p % GRID, y = (p - x) / GRID;
          if (x > 0 && mask[p - 1] && !comp[p - 1]) { comp[p - 1] = next; stack.push(p - 1); }
          if (x < GRID - 1 && mask[p + 1] && !comp[p + 1]) { comp[p + 1] = next; stack.push(p + 1); }
          if (y > 0 && mask[p - GRID] && !comp[p - GRID]) { comp[p - GRID] = next; stack.push(p - GRID); }
          if (y < GRID - 1 && mask[p + GRID] && !comp[p + GRID]) { comp[p + GRID] = next; stack.push(p + GRID); }
        }
        compSize.push(cnt); next++;
      }
      // Specks smaller than a few pixels are noise from the font, not parts to trace.
      for (var c = 1; c < compSize.length; c++) if (compSize[c] < 6) compSize[c] = 0;
      sctx.clearRect(0, 0, GRID, GRID);
      strokes.forEach(function (st) { scoreStroke(st, 0); });
    }

    function scoreStroke(st, from) {
      sctx.lineCap = sctx.lineJoin = 'round'; sctx.strokeStyle = '#000'; sctx.lineWidth = brush * GRID;
      sctx.beginPath();
      var p = st[Math.max(from - 1, 0)];
      sctx.moveTo(p[0] * GRID, p[1] * GRID);
      if (st.length === 1) sctx.lineTo(p[0] * GRID + 0.01, p[1] * GRID);
      for (var i = Math.max(from, 1); i < st.length; i++) sctx.lineTo(st[i][0] * GRID, st[i][1] * GRID);
      sctx.stroke();
    }

    function measure() {
      var d = sctx.getImageData(0, 0, GRID, GRID).data, n = GRID * GRID;
      var hit = new Array(compSize.length).fill(0), inkCount = 0, onGlyph = 0;
      // A pixel of the line counts as on the letter when the letter is within about a brush width of it.
      var r = Math.max(2, Math.round(brush * GRID * 0.9));
      for (var i = 0; i < n; i++) {
        if (d[i * 4 + 3] < 100) continue;
        inkCount++;
        if (mask[i]) { hit[comp[i]]++; onGlyph++; continue; }
        var x = i % GRID, y = (i - x) / GRID, near = false;
        for (var dy = -r; dy <= r && !near; dy += 2) for (var dx = -r; dx <= r; dx += 2) {
          var xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < GRID && yy < GRID && mask[yy * GRID + xx]) { near = true; break; }
        }
        if (near) onGlyph++;
      }
      var covered = 0, partsOk = true;
      for (var c = 1; c < compSize.length; c++) {
        if (!compSize[c]) continue;
        covered += hit[c];
        if (hit[c] / compSize[c] < PART) partsOk = false;
      }
      return { coverage: glyphCount ? covered / glyphCount : 0, accuracy: inkCount ? onGlyph / inkCount : 1, partsOk: partsOk, ink: inkCount };
    }

    function check() {
      raf = 0;
      if (!mask || finished || !strokes.length) return;
      var m = measure();
      meter.firstChild.style.width = Math.min(100, Math.round(m.coverage / PASS * 100)) + '%';
      if (m.coverage >= PASS && m.partsOk && m.accuracy >= 0.6) {
        finished = true; box.classList.add('done'); draw();
        msg.textContent = o.doneText || 'Well done!';
        var stars = m.accuracy >= 0.85 ? 3 : m.accuracy >= 0.72 ? 2 : 1;
        if (o.onDone) o.onDone({ stars: stars, coverage: m.coverage, accuracy: m.accuracy, ms: Date.now() - started });
      } else if (m.ink > GRID * GRID * 0.02 && m.accuracy < 0.5) {
        msg.textContent = o.offText || 'Stay on the letter.';
      } else if (m.coverage >= PASS && !m.partsOk) {
        msg.textContent = o.partText || 'Something is missing. Look for a dot.';
      } else {
        msg.textContent = '';
      }
    }
    function later() { if (!raf) raf = requestAnimationFrame(check); }

    // ---- Drawing on the screen ----
    function fit() {
      var r = box.getBoundingClientRect(), s = Math.round(r.width), dpr = window.devicePixelRatio || 1;
      if (!s) return false;
      if (s !== size || guide.width !== Math.round(s * dpr)) {
        size = s;
        [guide, ink].forEach(function (c) { c.width = c.height = Math.round(s * dpr); });
      }
      return true;
    }
    function draw() {
      if (!fit()) return;
      var dpr = guide.width / size, g = guide.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, size, size);
      var L = layout(g, size);
      g.font = fontSpec(L.px); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillStyle = finished ? '#bfe9d6' : '#e3edfb'; g.fillText(text, L.x, L.y);
      if (!finished) {
        g.setLineDash([size * 0.02, size * 0.02]); g.lineWidth = Math.max(1.5, size * 0.006);
        g.strokeStyle = '#7ba7e0'; g.strokeText(text, L.x, L.y);
      }
      var c = ink.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, size, size);
      c.lineCap = c.lineJoin = 'round'; c.strokeStyle = finished ? '#1f9d6b' : '#2e90fa'; c.lineWidth = brush * size;
      strokes.forEach(function (st) {
        c.beginPath(); c.moveTo(st[0][0] * size, st[0][1] * size);
        if (st.length === 1) c.lineTo(st[0][0] * size + 0.01, st[0][1] * size);
        for (var i = 1; i < st.length; i++) c.lineTo(st[i][0] * size, st[i][1] * size);
        c.stroke();
      });
    }

    function pt(e) {
      var r = ink.getBoundingClientRect();
      return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
    }
    ink.addEventListener('pointerdown', function (e) {
      if (finished || !mask || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      try { ink.setPointerCapture(e.pointerId); } catch (x) { /* not supported */ }
      if (!started) started = Date.now();
      cur = [pt(e)]; strokes.push(cur); scoreStroke(cur, 0); draw(); later();
    });
    ink.addEventListener('pointermove', function (e) {
      if (!cur) return;
      e.preventDefault();
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e], from = cur.length;
      (evs.length ? evs : [e]).forEach(function (ev) { cur.push(pt(ev)); });
      scoreStroke(cur, from); draw(); later();
    });
    function up() { if (cur) { cur = null; later(); } }
    ink.addEventListener('pointerup', up); ink.addEventListener('pointercancel', up);

    function reset() {
      strokes = []; cur = null; finished = false; started = 0;
      box.classList.remove('done'); meter.firstChild.style.width = '0'; msg.textContent = '';
      sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, GRID, GRID);
      draw();
    }
    again.addEventListener('click', reset);
    window.addEventListener('resize', function () { if (size) draw(); });

    return {
      set: function (t) {
        text = t; ink.setAttribute('aria-label', (o.label || 'Tracing area for') + ' ' + t);
        buildMask(); reset();
        // The font may arrive after the first draw; the shape then changes, so the mask is built again.
        if (document.fonts && document.fonts.load) {
          document.fonts.load(fontSpec(100), t).then(function () {
            if (text === t && !strokes.length) { buildMask(); draw(); }
          }, function () { /* keep the fallback font */ });
        }
      },
      clear: reset,
      get done() { return finished; }
    };
  };
})();
