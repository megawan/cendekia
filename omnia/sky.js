// The sky for Omnia: the Earth spinning (day and night), going round the Sun (seasons) and the Moon changing its shape (phases).
// Drawn on a canvas as a real globe: the coastlines of the world map (maps.js) are turned back into latitude and longitude and
// drawn in 3D, so the Earth turns and tilts like the real one, with the Sun's light on one side. Moved with anime.js.
// Adds the 'sky' scene, watch screen and questions to OMNIA_SCIENCE (science.js).
//
//   mount('sky', host, { labels }).show({ mode, at })
//     mode: 'day' | 'seasons' | 'moon'
//     at:   nothing keeps it moving; a number holds one moment (day: 0 morning, 1 noon, 2 sunset, 3 night;
//           seasons: 0 March, 1 June, 2 September, 3 December; moon: 0 to 7, the new moon to the waning crescent)
(function () {
  'use strict';
  var S = window.OMNIA_SCIENCE, MAPS = window.OMNIA_MAPS;
  var tx = window.Cendekia.t, IDL = window.Cendekia.lang === 'id';
  var PI = Math.PI, TAU = PI * 2, D = PI / 180, W = 800, H = 480;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var FONT = '"Plus Jakarta Sans", system-ui, sans-serif';
  var lib = null;
  function load() { if (!lib) lib = import('../shared/anime.esm.min.js').catch(function () { return null; }); return lib; }
  var wrap = function (x) { return x - TAU * Math.round(x / TAU); }; // to -PI..PI

  // ---- The land, as points on a sphere ----
  // The world map is drawn in the Natural Earth projection; this turns each point back into latitude and longitude
  // (the inverse of project() in index.html) and keeps sin(lat), cos(lat) and longitude.
  var land = null;
  function toLatLon(map, x, y) {
    var X = (x - map.tx) / map.k, Y = (map.ty - y) / map.k, p = Y / 1.007226, i;
    for (i = 0; i < 8; i++) {
      var p2 = p * p, p4 = p2 * p2;
      var f = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4))) - Y;
      p -= f / (1.007226 + 3 * 0.015085 * p2 + 7 * -0.044475 * p4 * p2 + 9 * 0.028874 * p4 * p4 + 11 * -0.005916 * p4 * p4 * p2);
    }
    p = Math.max(-PI / 2, Math.min(PI / 2, p));
    var q2 = p * p, q4 = q2 * q2, g = 0.8707 - 0.131979 * q2 + q4 * (-0.013791 + q4 * (0.003971 * q2 - 0.001529 * q4));
    return [p, Math.max(-PI, Math.min(PI, X / g))];
  }
  function buildLand() {
    var map = MAPS.world, rings = [];
    map.shapes.forEach(function (sh) {
      var re = /M([-\d.]+),([-\d.]+)|L([-\d.]+),([-\d.]+)|Z/g, t, cur = null;
      while ((t = re.exec(sh[1]))) {
        if (t[0] === 'Z') { cur = null; continue; }
        if (t[1] !== undefined) { cur = []; rings.push(cur); }
        var ll = t[1] !== undefined ? toLatLon(map, +t[1], +t[2]) : toLatLon(map, +t[3], +t[4]);
        if (cur) cur.push(Math.sin(ll[0]), Math.cos(ll[0]), ll[1]);
      }
    });
    return rings.filter(function (r) { return r.length >= 9; }).map(function (r) { return new Float32Array(r); });
  }

  // ---- Drawing helpers ----
  // Vectors are in the view: x to the right, y up, z towards the person looking.
  var dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
  function basis(a) { // two directions across the equator of a globe whose north is a, east being e1 then e2
    var e1 = [a[1], -a[0], 0], n = Math.hypot(e1[0], e1[1]);
    e1 = n < 1e-6 ? [1, 0, 0] : [e1[0] / n, e1[1] / n, 0];
    return [e1, [a[1] * e1[2] - a[2] * e1[1], a[2] * e1[0] - a[0] * e1[2], a[0] * e1[1] - a[1] * e1[0]]];
  }
  function text(ctx, str, x, y, size, color, align, halo) {
    ctx.font = '700 ' + size + 'px ' + FONT; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    if (halo !== false) { ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(6,10,36,.85)'; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
    ctx.fillStyle = color || '#fff'; ctx.fillText(str, x, y);
  }
  var stars = (function () { var out = [], seed = 7; for (var i = 0; i < 110; i++) { seed = (seed * 16807) % 2147483647; var x = seed / 2147483647 * W; seed = (seed * 16807) % 2147483647; var y = seed / 2147483647 * H; seed = (seed * 16807) % 2147483647; out.push([x, y, 0.4 + seed / 2147483647 * 1.1, 0.35 + (seed % 7) / 11]); } return out; })();
  function space(ctx) {
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#050825'); g.addColorStop(1, '#0d1238');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    stars.forEach(function (s) { ctx.globalAlpha = s[3]; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s[0], s[1], s[2], 0, TAU); ctx.fill(); });
    ctx.globalAlpha = 1;
  }
  function sun(ctx, x, y, r) {
    var g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3.4);
    g.addColorStop(0, 'rgba(255,214,90,.95)'); g.addColorStop(0.3, 'rgba(255,160,40,.35)'); g.addColorStop(1, 'rgba(255,140,30,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, TAU); ctx.fill();
    g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#fffbe0'); g.addColorStop(0.6, '#ffd54a'); g.addColorStop(1, '#ff9d1c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  // The side of a ball that the Sun (s, a unit vector in the view) does not light: the half of the disc away from the Sun,
  // bounded by the terminator, which seen from here is half an ellipse.
  function nightPath(ctx, R, s, shift) {
    var c = Math.max(-1, Math.min(1, s[2] - shift));
    ctx.save();
    ctx.rotate(Math.atan2(-s[1], s[0]));
    ctx.beginPath();
    ctx.arc(0, 0, R, -PI / 2, PI / 2, true);
    ctx.ellipse(0, 0, Math.abs(c) * R, R, 0, PI / 2, -PI / 2, c < 0);
    ctx.closePath();
    ctx.restore();
  }
  // A globe: ocean, land, the night side and a thin sky around it. a is the direction of its north pole, spin how far it has
  // turned (eastwards), s the direction of the Sun. Returns where a place (latitude, longitude in radians) is on it, or null if
  // it is round the back.
  function globe(ctx, cx, cy, R, a, spin, s, mark) {
    if (!land) land = buildLand();
    var b = basis(a), e1 = b[0], e2 = b[1], i, j;
    ctx.save();
    var halo = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.18);
    halo.addColorStop(0, 'rgba(120,190,255,.55)'); halo.addColorStop(1, 'rgba(120,190,255,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.18, 0, TAU); ctx.fill();
    ctx.translate(cx, cy);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
    var sea = ctx.createRadialGradient(s[0] * R * 0.5, -s[1] * R * 0.5, R * 0.1, 0, 0, R * 1.05);
    sea.addColorStop(0, '#4aa3e8'); sea.addColorStop(0.7, '#1f6fc0'); sea.addColorStop(1, '#134a8c');
    ctx.fillStyle = sea; ctx.fillRect(-R, -R, R * 2, R * 2);
    // land
    ctx.beginPath();
    var cos = Math.cos, sin = Math.sin;
    for (i = 0; i < land.length; i++) {
      var r = land[i], n = r.length, seen = false, prevHid = false, prevAng = 0, started = false, step = R < 60 ? 6 : 3;
      for (j = 0; j < n; j += step) { if (r[j] * a[2] + r[j + 1] * (cos(r[j + 2] + spin) * e1[2] + sin(r[j + 2] + spin) * e2[2]) > 0) { seen = true; break; } }
      if (!seen) continue;
      for (j = 0; j < n; j += step) {
        var sp = r[j], cp = r[j + 1], L = r[j + 2] + spin, c = cp * cos(L), sl = cp * sin(L);
        var px = sp * a[0] + c * e1[0] + sl * e2[0], py = sp * a[1] + c * e1[1] + sl * e2[1], pz = sp * a[2] + c * e1[2] + sl * e2[2];
        var hid = pz < 0, x = px, y = py;
        if (hid) { var m = Math.hypot(px, py) || 1; x = px / m; y = py / m; }
        var X = x * R, Y = -y * R, ang = Math.atan2(Y, X);
        if (!started) { ctx.moveTo(X, Y); started = true; }
        else if (hid && prevHid) { var df = wrap(ang - prevAng); ctx.arc(0, 0, R, prevAng, ang, df < 0); }
        else ctx.lineTo(X, Y);
        prevHid = hid; prevAng = ang;
      }
      ctx.closePath();
    }
    var ground = ctx.createLinearGradient(-R, -R, R, R);
    ground.addColorStop(0, '#6fb765'); ground.addColorStop(1, '#4f9a4f');
    ctx.fillStyle = ground; ctx.fill();
    ctx.lineWidth = Math.max(0.5, R / 160); ctx.strokeStyle = 'rgba(25,80,40,.6)'; ctx.stroke();
    // night, with a soft edge, then the round shading at the edge of the ball
    ctx.restore(); ctx.save(); ctx.translate(cx, cy);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(3,6,30,.26)'; nightPath(ctx, R, s, -0.16); ctx.fill();
    ctx.fillStyle = 'rgba(3,6,30,.50)'; nightPath(ctx, R, s, 0); ctx.fill();
    var rim = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R);
    rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,10,40,.45)');
    ctx.fillStyle = rim; ctx.fillRect(-R, -R, R * 2, R * 2);
    var shine = ctx.createRadialGradient(s[0] * R * 0.55, -s[1] * R * 0.55, 0, s[0] * R * 0.55, -s[1] * R * 0.55, R * 0.8);
    shine.addColorStop(0, 'rgba(255,255,255,.22)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine; ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.restore();
    // a place
    if (!mark) return null;
    var sp2 = sin(mark[0]), cp2 = cos(mark[0]), L2 = mark[1] + spin;
    var qx = sp2 * a[0] + cp2 * (cos(L2) * e1[0] + sin(L2) * e2[0]), qy = sp2 * a[1] + cp2 * (cos(L2) * e1[1] + sin(L2) * e2[1]), qz = sp2 * a[2] + cp2 * (cos(L2) * e1[2] + sin(L2) * e2[2]);
    return qz > 0.05 ? [cx + qx * R, cy - qy * R] : null;
  }
  function pin(ctx, p, t) { // the red dot for Indonesia, with a ring that grows and fades
    var k = (t % 1);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,70,70,' + (0.8 * (1 - k)) + ')'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(p[0], p[1], 6 + k * 16, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ff3b3b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ---- Day and night ----
  var DAY_TILT = 23.4 * D, DAY_PITCH = 18 * D;
  var DAY_AXIS = [-Math.sin(DAY_TILT), Math.cos(DAY_TILT) * Math.cos(DAY_PITCH), Math.cos(DAY_TILT) * Math.sin(DAY_PITCH)];
  var INDONESIA = [-2 * D, 118 * D];
  var sunAt = function (gamma) { return [-Math.sin(gamma), 0, Math.cos(gamma)]; };
  // Local solar time in Indonesia for a spin and a direction of the Sun.
  function clockOf(spin, gamma) {
    var b = basis(DAY_AXIS), s = sunAt(gamma), sub = Math.atan2(dot(s, b[1]), dot(s, b[0])) - spin;
    var T = 12 + wrap(INDONESIA[1] - sub) * 12 / PI;
    return (T + 24) % 24;
  }
  // The spin that makes it T o'clock in Indonesia.
  function spinFor(T, gamma) {
    var b = basis(DAY_AXIS), s = sunAt(gamma);
    return Math.atan2(dot(s, b[1]), dot(s, b[0])) - INDONESIA[1] + (T - 12) * PI / 12;
  }
  // The moments of a day. The view turns round the Earth to keep Indonesia in sight: with the Sun on the right we see the morning,
  // on the left the evening, and from behind the Earth the night.
  var DAY_AT = [{ T: 8, g: -70 * D }, { T: 12, g: 25 * D }, { T: 18, g: 70 * D }, { T: 0, g: 150 * D }], DAY_G = 50 * D;
  var hhmm = function (T) { var h = Math.floor(T), m = Math.floor((T - h) * 60 / 5) * 5; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; };
  var partOfDay = function (T) { return T >= 5 && T < 7 ? 'sunrise' : T >= 7 && T < 17 ? 'daytime' : T >= 17 && T < 19 ? 'sunset' : 'night'; };

  function drawDay(ctx, st, labels) {
    space(ctx);
    var s = sunAt(st.gamma), cx = 480, cy = 250, R = 175, onRight = s[0] > 0;
    sun(ctx, onRight ? W + 30 : -30, 250, 80);
    var p = globe(ctx, cx, cy, R, DAY_AXIS, st.theta, s, INDONESIA);
    if (p) pin(ctx, p, st.pulse);
    if (labels) {
      text(ctx, tx('Sun', 'Matahari'), onRight ? W - 70 : 70, 250, 26, '#ffe08a');
      var T = clockOf(st.theta, st.gamma), part = partOfDay(T);
      text(ctx, 'Indonesia  ' + hhmm(T) + '  ' + (IDL ? { sunrise: '🌅 Matahari terbit', daytime: '☀️ Siang hari', sunset: '🌇 Matahari terbenam', night: '🌙 Malam' } : { sunrise: '🌅 Sunrise', daytime: '☀️ Daytime', sunset: '🌇 Sunset', night: '🌙 Night' })[part], W / 2, H - 28, 28, '#fff');
      if (!p) text(ctx, tx('(Indonesia is round the back)', '(Indonesia ada di sisi belakang)'), W / 2, H - 62, 19, '#b9c4ff');
    }
  }

  // ---- The seasons ----
  var TILT = 23.4 * D, ELEV = Math.asin(0.36); // the orbit is seen from a little above
  var SEASON_AT = [{ m: tx('March', 'Maret'), psi: 90 * D }, { m: tx('June', 'Juni'), psi: 180 * D }, { m: 'September', psi: 270 * D }, { m: tx('December', 'Desember'), psi: 0 }];
  var OX = 400, OY = 236, RX = 290, RY = RX * Math.sin(ELEV);
  function earthView(psi) {
    var se = Math.sin(ELEV), ce = Math.cos(ELEV);
    return {
      a: [Math.sin(TILT), Math.cos(TILT) * ce, Math.cos(TILT) * se],
      s: [-Math.cos(psi), -Math.sin(psi) * se, Math.sin(psi) * ce],
      x: OX + RX * Math.cos(psi), y: OY - RY * Math.sin(psi)
    };
  }
  function drawSeasons(ctx, st, labels, held) {
    space(ctx);
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.setLineDash([6, 7]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(OX, OY, RX, RY, 0, 0, TAU); ctx.stroke(); ctx.restore();
    SEASON_AT.forEach(function (sa, k) {
      var v = earthView(sa.psi), up = sa.psi === 90 * D;
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(v.x, v.y, 52, 0, TAU); ctx.stroke();
      if (labels) {
        var names = IDL ? ['musim semi', 'musim panas', 'musim gugur', 'musim dingin'] : ['spring', 'summer', 'autumn', 'winter'];
        var north = names[k], south = names[(k + 2) % 4], dy = up ? -66 : 68;
        text(ctx, sa.m, v.x, v.y + dy, 24, '#fff');
        text(ctx, tx('N: ', 'U: ') + north + ' · S: ' + south, v.x, v.y + dy + (up ? -26 : 26), 16, '#b9c4ff');
      }
    });
    var e = earthView(st.psi), behind = Math.sin(st.psi) > 0;
    var drawEarth = function () {
      var pole = 66;
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(e.x - e.a[0] * pole, e.y + e.a[1] * pole); ctx.lineTo(e.x + e.a[0] * pole, e.y - e.a[1] * pole); ctx.stroke();
      globe(ctx, e.x, e.y, 44, e.a, st.spin, e.s);
      if (labels) text(ctx, tx('N', 'U'), e.x + e.a[0] * (pole + 10), e.y - e.a[1] * (pole + 12), 18, '#ffd54a');
    };
    if (behind) drawEarth();
    sun(ctx, OX, OY, 44);
    if (!behind) drawEarth();
    if (labels) {
      var lean = dot(e.a, e.s), msg = lean > 0.22 ? tx('North leans towards the Sun: summer in the north', 'Utara condong ke arah Matahari: musim panas di utara')
        : lean < -0.22 ? tx('North leans away from the Sun: winter in the north', 'Utara condong menjauhi Matahari: musim dingin di utara') : tx('Neither end leans to the Sun: spring or autumn', 'Tidak ada ujung yang condong ke Matahari: musim semi atau musim gugur');
      text(ctx, msg, W / 2, H - 20, 17, '#fff');
    }
  }

  // ---- The Moon ----
  var PHASES = IDL ? ['Bulan Baru', 'Sabit Awal', 'Kuartal Pertama', 'Cembung Awal', 'Purnama', 'Cembung Akhir', 'Kuartal Terakhir', 'Sabit Akhir']
    : ['New Moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full Moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  var MARIA = [[-0.30, -0.28, 0.26], [0.12, -0.38, 0.17], [0.30, -0.02, 0.24], [-0.12, 0.12, 0.2], [-0.4, 0.2, 0.13], [0.16, 0.42, 0.12], [0.5, -0.22, 0.1], [-0.05, -0.05, 0.08]];
  var phaseOf = function (phi) { return Math.round(((phi % TAU) + TAU) % TAU / (PI / 4)) % 8; };
  var MOON_C = [320, 245], MOON_R = 170;
  // The Moon as seen from the Earth: phi is how far round its orbit it is (0 new, PI full); the lit part is on the right while it grows.
  function moonFace(ctx, cx, cy, R, phi) {
    var f = ((phi % TAU) + TAU) % TAU, waning = f > PI, p = waning ? TAU - f : f, k = Math.cos(p);
    ctx.save(); ctx.translate(cx, cy);
    var glow = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 1.4); glow.addColorStop(0, 'rgba(255,250,220,.25)'); glow.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, R * 1.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1c2140'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(120,130,170,.28)'; MARIA.forEach(function (m) { ctx.beginPath(); ctx.arc(m[0] * R, m[1] * R, m[2] * R, 0, TAU); ctx.fill(); });
    if (waning) ctx.scale(-1, 1);
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, R, -PI / 2, PI / 2, false); ctx.ellipse(0, 0, Math.abs(k) * R, R, 0, PI / 2, -PI / 2, k > 0); ctx.closePath(); ctx.clip();
    var lit = ctx.createRadialGradient(-R * 0.2, -R * 0.2, R * 0.1, 0, 0, R * 1.1); lit.addColorStop(0, '#fffdf0'); lit.addColorStop(1, '#e3dcc0');
    ctx.fillStyle = lit; ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.fillStyle = 'rgba(150,140,110,.5)'; MARIA.forEach(function (m) { ctx.beginPath(); ctx.arc((waning ? -m[0] : m[0]) * R, m[1] * R, m[2] * R, 0, TAU); ctx.fill(); });
    ctx.restore();
    ctx.restore();
  }
  function drawMoon(ctx, st, labels) {
    space(ctx);
    var cx = MOON_C[0], cy = MOON_C[1], i;
    // sunlight comes from the left
    for (i = 0; i < 7; i++) {
      var y = 70 + i * 56;
      ctx.strokeStyle = 'rgba(255,214,90,.55)'; ctx.fillStyle = 'rgba(255,214,90,.7)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(96, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(104, y); ctx.lineTo(92, y - 6); ctx.lineTo(92, y + 6); ctx.fill();
    }
    if (labels) text(ctx, tx('Sunlight', 'Sinar Matahari'), 58, 34, 18, '#ffe08a');
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.setLineDash([6, 7]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, MOON_R, 0, TAU); ctx.stroke(); ctx.restore();
    // the eight phases around the orbit
    for (i = 0; i < 8; i++) {
      var an = i * PI / 4, px = cx - MOON_R * Math.cos(an), py = cy + MOON_R * Math.sin(an);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(px, py, 4, 0, TAU); ctx.fill();
      if (labels) text(ctx, PHASES[i], cx - (MOON_R + 52) * Math.cos(an), cy + (MOON_R + 34) * Math.sin(an), 17, '#b9c4ff');
    }
    globe(ctx, cx, cy, 52, [0, 0, 1], st.spin, [-1, 0, 0]);
    // the Moon, lit on the side that faces the Sun
    var mx = cx - MOON_R * Math.cos(st.phi), my = cy + MOON_R * Math.sin(st.phi), r = 21;
    ctx.fillStyle = '#242a4a'; ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f3efd8'; ctx.beginPath(); ctx.arc(mx, my, r, PI / 2, PI * 1.5, false); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.stroke();
    // what we see from the Earth
    var fx = 690, fy = 240;
    moonFace(ctx, fx, fy, 72, st.phi);
    if (labels) {
      text(ctx, tx('Seen from Earth', 'Dilihat dari Bumi'), fx, fy - 104, 18, '#fff');
      text(ctx, PHASES[phaseOf(st.phi)], fx, fy + 106, 22, '#fff');
    }
  }

  // ---- The scene ----
  function mountSky(host, opts) {
    var labels = !!opts.labels, cv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var st = { mode: 'day', theta: spinFor(11, DAY_G), gamma: DAY_G, psi: 150 * D, phi: 120 * D, spin: 0, pulse: 0 };
    cv.width = W * dpr; cv.height = H * dpr; cv.className = 'scene sky'; cv.style.setProperty('--ar', (W / H).toFixed(3));
    if (labels) { cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', tx('The Earth, the Sun and the Moon, moving', 'Bumi, Matahari, dan Bulan, bergerak')); } else cv.setAttribute('aria-hidden', 'true');
    host.textContent = ''; host.appendChild(cv);
    var ctx = cv.getContext('2d'), anims = [], token = 0, raf = 0, held = false, dead = false;

    function draw() {
      if (dead) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (st.mode === 'day') drawDay(ctx, st, labels);
      else if (st.mode === 'seasons') drawSeasons(ctx, st, labels, held);
      else drawMoon(ctx, st, labels);
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; draw(); }); }
    function stopAnims() { anims.forEach(function (x) { x.pause(); }); anims = []; }

    // Where the moment `at` of a mode is, as values of the state.
    function target(mode, at) {
      if (mode === 'day') { var d = DAY_AT[at]; return { gamma: d.g, theta: spinFor(d.T, d.g) }; }
      if (mode === 'seasons') return { psi: SEASON_AT[at].psi };
      return { phi: at * PI / 4 };
    }
    function show(view) {
      var mode = view.mode, at = view.at, t = ++token;
      stopAnims();
      st.mode = mode; held = at !== undefined && at !== null;
      var to = held ? target(mode, at) : null;
      if (reduce.matches) {
        if (to) Object.keys(to).forEach(function (k) { st[k] = to[k]; });
        draw(); return;
      }
      draw();
      load().then(function (a) {
        if (!a || t !== token || dead) return;
        var tick = { onUpdate: schedule }, loop = function (obj, ms) { return a.animate(st, Object.assign({ duration: ms, loop: true, ease: 'linear' }, obj, tick)); };
        anims.push(loop({ pulse: [0, 1] }, 1500));
        if (mode === 'day' && !held) {
          anims.push(a.animate(st, { gamma: DAY_G, duration: 900, ease: 'inOutQuad', onUpdate: schedule }));
          anims.push(loop({ theta: [st.theta, st.theta + TAU] }, 18000));
        } else if (mode === 'seasons') { anims.push(loop({ spin: [0, TAU] }, 3500)); if (!held) anims.push(loop({ psi: [st.psi, st.psi - TAU] }, 22000)); }
        else if (mode === 'moon') { anims.push(loop({ spin: [0, TAU] }, 4500)); if (!held) anims.push(loop({ phi: [st.phi, st.phi + TAU] }, 22000)); }
        if (held) {
          var go = {};
          Object.keys(to).forEach(function (k) { go[k] = st[k] + wrap(to[k] - st[k]); });
          anims.push(a.animate(st, Object.assign({ duration: 1500, ease: 'inOutCubic', onUpdate: schedule }, go)));
        }
      });
    }
    return { show: show, stop: function () { dead = true; token++; stopAnims(); cancelAnimationFrame(raf); cv.remove(); } };
  }
  S.scenes.sky = mountSky;

  // ---- The watch screen ----
  var tabInfo = S.tabInfo;
  var INFO = IDL ? {
    day: [
      ['Pagi', 'Sekarang pagi di Indonesia. Bumi berputar menghadap Matahari, dan titik merah bergerak masuk ke dalam cahaya.'],
      ['Siang', 'Sekarang tengah hari di Indonesia. Titik merah menghadap Matahari, jadi Matahari tinggi di langit.'],
      ['Senja', 'Sekarang sore di Indonesia. Bumi sudah berputar dan titik merah bergerak masuk ke dalam bayangan.'],
      ['Malam', 'Sekarang malam di Indonesia. Titik merah berada di sisi yang gelap, menjauh dari Matahari, sementara di sisi lain dunia sedang siang.']
    ],
    seasons: [
      ['Maret', 'Pada bulan Maret dan September, tidak ada ujung Bumi yang condong ke Matahari, jadi siang dan malam kira-kira sama panjangnya di mana-mana.'],
      ['Juni', 'Pada bulan Juni, belahan utara condong ke Matahari: siang yang panjang dan hangat di utara, dan musim dingin di selatan.'],
      ['September', 'Pada bulan September, tidak ada ujung yang condong ke Matahari, jadi siang dan malam kembali kira-kira sama panjangnya.'],
      ['Desember', 'Pada bulan Desember, belahan selatan condong ke Matahari: musim panas di selatan, dan siang yang pendek dan dingin di utara.']
    ],
    moon: [
      ['Bulan Baru', 'Bulan berada di antara Bumi dan Matahari. Sisi yang terang menghadap menjauh dari kita, jadi kita tidak bisa melihatnya.'],
      ['Sabit Awal', 'Lengkungan tipis dari sisi yang terang tampak di sebelah kanan. Bentuknya makin besar ("membesar") setiap malam.'],
      ['Kuartal Pertama', 'Kita melihat setengah dari sisi yang terang, di sebelah kanan. Bulan sudah menempuh seperempat orbitnya.'],
      ['Cembung Awal', 'Lebih dari separuh bagiannya terang, dan terus membesar menuju purnama.'],
      ['Purnama', 'Bumi berada di antara Matahari dan Bulan, jadi seluruh sisi yang kita lihat terang.'],
      ['Cembung Akhir', 'Bagian yang terang makin kecil ("menyusut"), sekarang di sebelah kiri.'],
      ['Kuartal Terakhir', 'Kita kembali melihat setengah dari sisi yang terang, sekarang di sebelah kiri.'],
      ['Sabit Akhir', 'Lengkungan tipis di sebelah kiri, makin menipis sampai bulan baru berikutnya.']
    ]
  } : {
    day: [
      ['Morning', 'It is morning in Indonesia. The Earth spins towards the Sun, and the red dot is moving into the light.'],
      ['Noon', 'It is noon in Indonesia. The red dot faces the Sun, so the Sun is high in the sky.'],
      ['Sunset', 'It is evening in Indonesia. The Earth has turned and the red dot is moving into the shadow.'],
      ['Night', 'It is night in Indonesia. The red dot is on the dark side, away from the Sun, while it is day on the other side of the world.']
    ],
    seasons: [
      ['March', 'In March and September neither end of the Earth leans towards the Sun, so day and night are about as long everywhere.'],
      ['June', 'In June the north leans towards the Sun: long, warm summer days in the north, and winter in the south.'],
      ['September', 'In September neither end leans towards the Sun, so day and night are about as long again.'],
      ['December', 'In December the south leans towards the Sun: summer in the south, and short, cold winter days in the north.']
    ],
    moon: [
      ['New Moon', 'The Moon is between the Earth and the Sun. The lit side faces away from us, so we cannot see it.'],
      ['Waxing crescent', 'A thin curve of the lit side shows on the right. It is growing ("waxing") every night.'],
      ['First quarter', 'We see half of the lit side, on the right. The Moon is a quarter of the way round its orbit.'],
      ['Waxing gibbous', 'More than half is lit, and it keeps growing towards the full Moon.'],
      ['Full Moon', 'The Earth is between the Sun and the Moon, so the whole side we see is lit.'],
      ['Waning gibbous', 'The lit part is getting smaller ("waning"), now on the left.'],
      ['Last quarter', 'We see half of the lit side again, now on the left.'],
      ['Waning crescent', 'A thin curve on the left, getting thinner until the next new Moon.']
    ]
  };
  var MODES = IDL ? {
    day: { pic: '🌍', label: 'Siang dan malam', info: 'Bumi berputar sekali setiap 24 jam. Sisi yang menghadap Matahari mengalami siang, dan sisi lainnya mengalami malam. Titik merah adalah Indonesia.' },
    seasons: { pic: '🍂', label: 'Musim', info: 'Bumi mengelilingi Matahari sekali setahun, dan sumbunya miring. Ketika belahan utara condong ke Matahari, di sana sedang musim panas. Indonesia dekat khatulistiwa, jadi punya musim hujan dan musim kemarau.' },
    moon: { pic: '🌙', label: 'Fase Bulan', info: 'Bulan mengelilingi Bumi kira-kira sebulan sekali. Bulan tidak menghasilkan cahaya sendiri: kita melihat bagian yang disinari Matahari.' }
  } : {
    day: { pic: '🌍', label: 'Day and night', info: 'The Earth spins once every 24 hours. The side facing the Sun has day, and the other side has night. The red dot is Indonesia.' },
    seasons: { pic: '🍂', label: 'The seasons', info: 'The Earth goes round the Sun once a year, and its axis is tilted. When the north leans towards the Sun it is summer there. Indonesia is near the equator, so it has a rainy and a dry season instead.' },
    moon: { pic: '🌙', label: 'Moon phases', info: 'The Moon goes round the Earth about once a month. It makes no light of its own: we see the part the Sun lights up.' }
  };
  S.kinds.sky = {
    title: tx('Watch the Earth and the Moon', 'Lihat Bumi dan Bulan'),
    tabs: ['day', 'seasons', 'moon'].map(function (id) { return { id: id, pic: MODES[id].pic, label: MODES[id].label }; }),
    intro: tabInfo('🌍', tx('The Earth, the Sun and the Moon', 'Bumi, Matahari, dan Bulan'), tx('Pick one to watch it move, then pick a moment to stop it there.', 'Pilih salah satu untuk melihatnya bergerak, lalu pilih satu momen untuk menghentikannya di sana.')),
    view: function (id) { return { mode: id }; },
    info: function (id, at) {
      if (at === undefined || at === null) return tabInfo(MODES[id].pic, MODES[id].label, S.esc(MODES[id].info));
      return tabInfo(MODES[id].pic, INFO[id][at][0], S.esc(INFO[id][at][1]));
    },
    // The moments of a mode, for a second row of buttons ("Keep going" lets it move again).
    picks: function (id) { return [{ id: null, label: tx('▶ Keep going', '▶ Lanjutkan') }].concat(INFO[id].map(function (x, k) { return { id: k, label: x[0] }; })); }
  };

  // ---- Questions ----
  var ask = S.ask, mix = S.shuffle;
  function moonPhases() {
    return PHASES.map(function (name, k) {
      return ask(tx('Phase ', 'Fase ') + name, tx('Which phase of the Moon is this?', 'Fase Bulan manakah ini?'), name, mix(PHASES.filter(function (n) { return n !== name; })).slice(0, 3),
        INFO.moon[k][0] + ': ' + INFO.moon[k][1], { mode: 'moon', at: k });
    });
  }
  var DAYQ = (IDL ? [
    ['Siang dan malam', 'Mengapa ada siang dan malam?', 'Bumi berputar', ['Matahari mengelilingi Bumi', 'Bulan menutupi Matahari', 'Bumi bergerak mendekati Matahari'], 'Bumi berputar seperti gasing. Sisi yang menghadap Matahari mengalami siang, dan sisi lainnya mengalami malam.', { mode: 'day' }],
    ['Satu putaran', 'Berapa lama Bumi berputar satu kali?', 'Satu hari (24 jam)', ['Satu jam', 'Satu minggu', 'Satu tahun'], 'Satu putaran Bumi memakan waktu 24 jam, dan itulah yang kita sebut satu hari.', { mode: 'day' }],
    ['Sisi lain', 'Ketika siang di Indonesia, apa yang terjadi di sisi Bumi yang berlawanan?', 'Malam', ['Siang juga', 'Hujan', 'Turun salju'], 'Hanya separuh Bumi yang menghadap Matahari pada satu waktu, jadi ketika kita siang, sisi lainnya malam.', { mode: 'day' }],
    ['Arah putaran', 'Ke arah mana Bumi berputar?', 'Dari barat ke timur', ['Dari timur ke barat', 'Dari utara ke selatan', 'Bumi tidak berputar'], 'Bumi berputar ke arah timur, dan itulah sebabnya Matahari tampak terbit di timur.', { mode: 'day' }],
    ['Matahari terbit', 'Di mana Matahari tampak terbit?', 'Di timur', ['Di barat', 'Di utara', 'Di selatan'], 'Bumi berputar ke arah timur, jadi Matahari tampak muncul di timur dan terbenam di barat.', { mode: 'day' }],
    ['Malam di Indonesia', 'Titik merah adalah Indonesia. Sekarang bagian hari apa di sana?', 'Malam', ['Tengah hari', 'Pagi', 'Sore'], 'Titik merah berada di sisi gelap Bumi, menjauh dari Matahari, jadi di sana malam.', { mode: 'day', at: 3 }],
    ['Siang di Indonesia', 'Titik merah adalah Indonesia. Di sana siang atau malam?', 'Siang', ['Malam', 'Tengah malam', 'Matahari terbit'], 'Titik merah berada di sisi yang menghadap Matahari, jadi di sana siang.', { mode: 'day', at: 1 }],
    ['Cahaya di siang hari', 'Apa yang memberi kita cahaya dan kehangatan di siang hari?', 'Matahari', ['Bulan', 'Awan', 'Putaran Bumi'], 'Matahari adalah sebuah bintang. Cahaya dan panasnya sampai ke Bumi.', { mode: 'day' }]
  ] : [
    ['Day and night', 'Why do we have day and night?', 'The Earth spins round', ['The Sun goes round the Earth', 'The Moon covers the Sun', 'The Earth moves closer to the Sun'], 'The Earth spins like a top. The side facing the Sun has day, and the other side has night.', { mode: 'day' }],
    ['One spin', 'How long does the Earth take to spin round once?', 'One day (24 hours)', ['One hour', 'One week', 'One year'], 'One spin of the Earth takes 24 hours, and that is what we call a day.', { mode: 'day' }],
    ['The other side', 'When it is day in Indonesia, what is it on the opposite side of the Earth?', 'Night', ['Day too', 'Raining', 'Snowing'], 'Only half of the Earth faces the Sun at a time, so when we have day, the other side has night.', { mode: 'day' }],
    ['Which way it spins', 'Which way does the Earth spin?', 'From west to east', ['From east to west', 'From north to south', 'It does not spin'], 'The Earth spins towards the east, and that is why the Sun seems to rise in the east.', { mode: 'day' }],
    ['Sunrise', 'Where does the Sun seem to rise?', 'In the east', ['In the west', 'In the north', 'In the south'], 'The Earth spins towards the east, so the Sun seems to come up in the east and go down in the west.', { mode: 'day' }],
    ['Night in Indonesia', 'The red dot is Indonesia. What part of the day is it there?', 'Night', ['Noon', 'Morning', 'Afternoon'], 'The red dot is on the dark side of the Earth, away from the Sun, so it is night.', { mode: 'day', at: 3 }],
    ['Daytime in Indonesia', 'The red dot is Indonesia. Is it day or night there?', 'Day', ['Night', 'Midnight', 'Sunrise'], 'The red dot is on the side facing the Sun, so it is day.', { mode: 'day', at: 1 }],
    ['Light in the day', 'What gives us light and warmth in the daytime?', 'The Sun', ['The Moon', 'The clouds', 'The Earth\'s spin'], 'The Sun is a star. Its light and heat reach the Earth.', { mode: 'day' }]
  ]).map(function (f) { return ask(f[0], f[1], f[2], f[3], f[4], f[5]); });
  var SEASONQ = (IDL ? [
    ['Mengapa ada musim', 'Mengapa banyak negara mempunyai musim?', 'Sumbu Bumi miring', ['Bumi mendekati Matahari', 'Matahari membesar dan mengecil', 'Ukuran Bulan berubah'], 'Bumi sedikit miring ketika mengelilingi Matahari. Ujung mana pun yang condong ke Matahari mengalami musim panas.', { mode: 'seasons' }],
    ['Satu tahun', 'Berapa lama Bumi mengelilingi Matahari satu kali?', 'Satu tahun', ['Satu hari', 'Satu bulan', 'Satu jam'], 'Satu putaran mengelilingi Matahari memakan waktu sekitar 365 hari, yang kita sebut satu tahun.', { mode: 'seasons' }],
    ['Musim panas', 'Ketika belahan utara paling condong ke Matahari, musim apa di utara?', 'Musim panas', ['Musim dingin', 'Musim gugur', 'Musim semi'], 'Matahari lebih tinggi di langit dan siang lebih panjang, jadi udaranya hangat.', { mode: 'seasons', at: 1 }],
    ['Belahan selatan', 'Ketika di utara musim panas, musim apa di selatan?', 'Musim dingin', ['Musim panas juga', 'Musim semi', 'Musim gugur'], 'Kedua belahan Bumi mengalami musim yang berlawanan.', { mode: 'seasons', at: 1 }],
    ['Tanpa musim dingin', 'Mengapa Indonesia tidak punya musim dingin atau musim panas seperti negara lain?', 'Indonesia dekat khatulistiwa', ['Indonesia terlalu kecil', 'Indonesia punya banyak gunung berapi', 'Indonesia terdiri dari pulau-pulau'], 'Dekat khatulistiwa, Matahari tinggi sepanjang tahun, jadi hangat sepanjang tahun.', { mode: 'seasons' }],
    ['Musim di Indonesia', 'Dua musim apa yang dimiliki Indonesia?', 'Musim hujan dan musim kemarau', ['Musim panas dan musim dingin', 'Musim semi dan musim gugur', 'Musim yang panas dan musim yang dingin'], 'Angin membawa hujan ke Indonesia pada sebagian tahun, dan cuaca kering pada sisanya.', { mode: 'seasons' }],
    ['Lebih dekat saat musim panas?', 'Apakah Bumi lebih dekat ke Matahari saat musim panas?', 'Tidak, kemiringanlah yang membuat musim', ['Ya, itulah sebabnya panas', 'Ya, tetapi hanya pada malam hari', 'Sama setiap hari'], 'Jaraknya hampir tidak berubah. Kemiringan Bumilah yang membuat musim.', { mode: 'seasons' }],
    ['Ekuinoks', 'Pada dua hari dalam setahun, siang dan malam kira-kira sama panjangnya di mana-mana. Apa nama hari-hari itu?', 'Ekuinoks', ['Solstis', 'Gerhana', 'Pasang surut'], 'Pada bulan Maret dan September, tidak ada ujung Bumi yang condong ke Matahari.', { mode: 'seasons', at: 0 }]
  ] : [
    ['Why seasons', 'Why do many countries have seasons?', 'The Earth\'s axis is tilted', ['The Earth gets closer to the Sun', 'The Sun gets bigger and smaller', 'The Moon changes size'], 'The Earth leans a little as it goes round the Sun. Whichever end leans towards the Sun has summer.', { mode: 'seasons' }],
    ['A year', 'How long does the Earth take to go once round the Sun?', 'One year', ['One day', 'One month', 'One hour'], 'One trip round the Sun takes about 365 days, which we call a year.', { mode: 'seasons' }],
    ['Summer', 'When the north leans most towards the Sun, what season is it in the north?', 'Summer', ['Winter', 'Autumn', 'Spring'], 'The Sun is higher in the sky and the days are longer, so it is warm.', { mode: 'seasons', at: 1 }],
    ['The south then', 'When it is summer in the north, what is it in the south?', 'Winter', ['Summer too', 'Spring', 'Autumn'], 'The two halves of the Earth have opposite seasons.', { mode: 'seasons', at: 1 }],
    ['No winter', 'Why does Indonesia have no winter or summer like other countries?', 'It is near the equator', ['It is too small', 'It has many volcanoes', 'It is made of islands'], 'Near the equator the Sun is high all year, so it is warm all year.', { mode: 'seasons' }],
    ['Indonesian seasons', 'What two seasons does Indonesia have?', 'The rainy and the dry season', ['Summer and winter', 'Spring and autumn', 'The hot and the cold season'], 'Winds bring rain to Indonesia for part of the year, and dry weather for the rest.', { mode: 'seasons' }],
    ['Closer in summer?', 'Is the Earth closer to the Sun in summer?', 'No, it is the tilt that makes seasons', ['Yes, that is why it is hot', 'Yes, but only at night', 'It is the same every day'], 'The distance hardly changes. The tilt of the Earth makes the seasons.', { mode: 'seasons' }],
    ['Equinox', 'On two days of the year, day and night are about equally long everywhere. What are these days called?', 'Equinoxes', ['Solstices', 'Eclipses', 'Tides'], 'In March and September neither end of the Earth leans towards the Sun.', { mode: 'seasons', at: 0 }]
  ]).map(function (f) { return ask(f[0], f[1], f[2], f[3], f[4], f[5]); });
  var MOONQ = (IDL ? [
    ['Cahaya bulan', 'Apakah Bulan menghasilkan cahayanya sendiri?', 'Tidak, ia memantulkan cahaya Matahari', ['Ya, seperti Matahari', 'Ya, tetapi hanya pada malam hari', 'Hanya saat purnama'], 'Kita melihat bagian Bulan yang disinari Matahari.', { mode: 'moon' }],
    ['Sebulan', 'Kira-kira berapa lama dari satu bulan baru ke bulan baru berikutnya?', 'Kira-kira sebulan (29 hari)', ['Satu hari', 'Satu minggu', 'Satu tahun'], 'Bulan membutuhkan waktu sekitar sebulan untuk mengelilingi Bumi, lalu fasenya berulang.', { mode: 'moon' }],
    ['Yang dikelilinginya', 'Apa yang dikelilingi Bulan?', 'Bumi', ['Matahari', 'Mars', 'Yupiter'], 'Bulan mengelilingi Bumi, dan Bumi mengelilingi Matahari.', { mode: 'moon' }],
    ['Tidak terlihat', 'Kapan kita tidak bisa melihat Bulan dari Bumi?', 'Saat bulan baru', ['Saat purnama', 'Saat kuartal pertama', 'Saat kuartal terakhir'], 'Saat bulan baru, sisinya yang terang menghadap menjauh dari kita.', { mode: 'moon', at: 0 }],
    ['Lingkaran terang', 'Fase mana yang berupa lingkaran terang penuh?', 'Purnama', ['Bulan Baru', 'Kuartal Pertama', 'Sabit Akhir'], 'Saat purnama, Bumi berada di antara Matahari dan Bulan, dan seluruh sisi yang kita lihat terang.', { mode: 'moon', at: 4 }],
    ['Pasang surut', 'Apa yang menarik laut naik dan turun sehingga terjadi pasang surut?', 'Tarikan Bulan', ['Angin', 'Panas Matahari', 'Ikan yang berenang'], 'Bulan menarik laut dengan gravitasinya, dan air naik dan turun dua kali sehari.', { mode: 'moon' }]
  ] : [
    ['Moonlight', 'Does the Moon make its own light?', 'No, it reflects the Sun\'s light', ['Yes, like the Sun', 'Yes, but only at night', 'Only when it is full'], 'We see the part of the Moon that the Sun is shining on.', { mode: 'moon' }],
    ['A month', 'About how long is it from one new Moon to the next?', 'About a month (29 days)', ['One day', 'One week', 'One year'], 'The Moon takes about a month to go round the Earth, and the phases repeat.', { mode: 'moon' }],
    ['What it goes round', 'What does the Moon go round?', 'The Earth', ['The Sun', 'Mars', 'Jupiter'], 'The Moon goes round the Earth, and the Earth goes round the Sun.', { mode: 'moon' }],
    ['Cannot see it', 'When can we not see the Moon from the Earth?', 'At the new Moon', ['At the full Moon', 'At the first quarter', 'At the last quarter'], 'At the new Moon its lit side faces away from us.', { mode: 'moon', at: 0 }],
    ['A bright circle', 'Which phase is a whole bright circle?', 'Full Moon', ['New Moon', 'First quarter', 'Waning crescent'], 'At the full Moon the Earth is between the Sun and the Moon, and the whole side we see is lit.', { mode: 'moon', at: 4 }],
    ['Tides', 'What pulls the sea up and down to make the tides?', 'The Moon\'s pull', ['The wind', 'The Sun\'s heat', 'Fish swimming'], 'The Moon pulls on the sea with its gravity, and the water rises and falls twice a day.', { mode: 'moon' }]
  ]).map(function (f) { return ask(f[0], f[1], f[2], f[3], f[4], f[5]); });

  S.questions['d.day'] = function () { return DAYQ.slice(); };
  S.questions['d.seasons'] = function () { return SEASONQ.slice(); };
  S.questions['d.moon'] = function () { return moonPhases().concat(MOONQ); };
  S.questions['d.all'] = function () { return DAYQ.concat(SEASONQ, moonPhases(), MOONQ); };
})();
