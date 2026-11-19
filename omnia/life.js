// Life cycles for Omnia: a butterfly (egg, caterpillar, chrysalis, butterfly) and a frog (frogspawn, tadpole, tadpole with legs,
// froglet, frog). Each stage is drawn in SVG and moves with anime.js (eggs wobble, the caterpillar crawls, the chrysalis sways,
// the butterfly flaps, the tadpole wags its tail, the frog hops); the stages are on a ring with arrows that flow round it.
// Adds the 'life' scene, watch screen and questions to OMNIA_SCIENCE (science.js).
//
//   mount('life', host, { labels }).show({ mode, at })
//     mode: 'butterfly' | 'frog'
//     at:   the stage to light up (0 is the first); nothing lights none (with labels it lights each in turn)
(function () {
  'use strict';
  var S = window.OMNIA_SCIENCE;
  var tx = window.Cendekia.t, IDL = window.Cendekia.lang === 'id';
  var NS = 'http://www.w3.org/2000/svg', PI = Math.PI, D = PI / 180, W = 400, H = 340;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var lib = null;
  function load() { if (!lib) lib = import('../shared/anime.esm.min.js').catch(function () { return null; }); return lib; }

  // ---- The stages ----
  var CYCLES = {
    butterfly: {
      name: 'Butterfly', pic: '🦋', bg: '#eaf7df', bubble: '#f7fcee', ring: '#8bc34a',
      stages: [
        { name: 'Egg', time: 'about 1 week', text: 'A mother butterfly lays tiny eggs on a leaf. Inside each egg a caterpillar is growing.',
          clue: 'It is tiny and round, stuck on a leaf, with a baby inside.' },
        { name: 'Caterpillar', time: '2 to 4 weeks', text: 'A tiny caterpillar hatches. It eats leaves all day and grows fast, and it grows out of its skin again and again.',
          clue: 'It has lots of legs, eats leaves all day and grows very fast.' },
        { name: 'Chrysalis', time: '1 to 2 weeks', text: 'The caterpillar hangs from a twig and its skin turns into a hard case. Inside, its body changes completely.',
          clue: 'It hangs very still from a twig while its body changes inside.' },
        { name: 'Butterfly', time: '2 to 4 weeks', text: 'The chrysalis opens and a butterfly comes out. It dries its wings, flies off to drink nectar and lays new eggs.',
          clue: 'It has four colourful wings and drinks nectar from flowers.' }
      ]
    },
    frog: {
      name: 'Frog', pic: '🐸', bg: '#e1f2fb', bubble: '#f2faff', ring: '#4aa3e8',
      stages: [
        { name: 'Frogspawn', time: '1 to 3 weeks', text: 'A mother frog lays lots of jelly-like eggs in the water. Each egg has a tiny black dot: a baby frog.',
          clue: 'Lots of jelly balls with black dots float in a pond.' },
        { name: 'Tadpole', time: 'about 6 weeks', text: 'A tadpole hatches. It has no legs, swims with its tail, breathes with gills like a fish and eats tiny plants.',
          clue: 'It looks like a little fish with a round head and a long tail, but it will be a frog.' },
        { name: 'Tadpole with legs', time: 'about 4 weeks', text: 'The back legs grow first, then the front legs. Lungs start to grow too, so it can breathe air.',
          clue: 'It still has its tail, but now it has legs too.' },
        { name: 'Froglet', time: 'about 4 weeks', text: 'A tiny frog with a short tail that is shrinking away. It climbs out of the water and hops about.',
          clue: 'A tiny frog whose tail is almost gone.' },
        { name: 'Frog', time: 'several years', text: 'The tail has gone. The frog breathes air, catches insects with its long sticky tongue and lays eggs in the water.',
          clue: 'It hops, breathes air and catches flies with its tongue.' }
      ]
    }
  };

  // The Indonesian name, and for each stage: name, time, text, clue.
  var CYCLES_ID = {
    butterfly: { name: 'Kupu-kupu', stages: [
      ['Telur', 'sekitar 1 minggu', 'Seekor induk kupu-kupu meletakkan telur-telur kecil di sehelai daun. Di dalam setiap telur, seekor ulat sedang tumbuh.', 'Ukurannya kecil dan bulat, menempel di daun, dengan seekor bayi di dalamnya.'],
      ['Ulat', '2 sampai 4 minggu', 'Seekor ulat kecil menetas. Ia memakan daun sepanjang hari dan tumbuh dengan cepat, dan ia berganti kulit berkali-kali.', 'Ia punya banyak kaki, memakan daun sepanjang hari, dan tumbuh sangat cepat.'],
      ['Kepompong', '1 sampai 2 minggu', 'Ulat itu bergantung di ranting dan kulitnya berubah menjadi selubung keras. Di dalamnya, tubuhnya berubah total.', 'Ia bergantung sangat diam di ranting sementara tubuhnya berubah di dalam.'],
      ['Kupu-kupu', '2 sampai 4 minggu', 'Kepompong terbuka dan seekor kupu-kupu keluar. Ia mengeringkan sayapnya, terbang untuk menghisap nektar, dan bertelur lagi.', 'Ia punya empat sayap berwarna-warni dan menghisap nektar dari bunga.']] },
    frog: { name: 'Katak', stages: [
      ['Telur katak', '1 sampai 3 minggu', 'Seekor induk katak bertelur banyak telur berlendir seperti agar-agar di dalam air. Setiap telur punya titik hitam kecil: seekor bayi katak.', 'Banyak bola agar-agar dengan titik hitam mengapung di kolam.'],
      ['Kecebong', 'sekitar 6 minggu', 'Seekor kecebong menetas. Ia tidak punya kaki, berenang dengan ekornya, bernapas dengan insang seperti ikan, dan memakan tumbuhan kecil.', 'Ia tampak seperti ikan kecil dengan kepala bulat dan ekor panjang, tetapi ia akan menjadi katak.'],
      ['Kecebong berkaki', 'sekitar 4 minggu', 'Kaki belakang tumbuh lebih dulu, lalu kaki depan. Paru-paru juga mulai tumbuh, jadi ia bisa bernapas di udara.', 'Ia masih punya ekor, tetapi sekarang ia punya kaki juga.'],
      ['Katak muda', 'sekitar 4 minggu', 'Seekor katak mungil dengan ekor pendek yang makin menyusut. Ia memanjat keluar dari air dan melompat ke sana kemari.', 'Seekor katak mungil yang ekornya hampir hilang.'],
      ['Katak', 'beberapa tahun', 'Ekornya sudah hilang. Katak bernapas di udara, menangkap serangga dengan lidahnya yang panjang dan lengket, dan bertelur di dalam air.', 'Ia melompat, bernapas di udara, dan menangkap lalat dengan lidahnya.']] }
  };
  if (IDL) Object.keys(CYCLES_ID).forEach(function (id) {
    CYCLES[id].name = CYCLES_ID[id].name;
    CYCLES_ID[id].stages.forEach(function (s, i) { var st = CYCLES[id].stages[i]; st.name = s[0]; st.time = s[1]; st.text = s[2]; st.clue = s[3]; });
  });

  // ---- Drawings, each around (0, 0) in a space about 80 across ----
  var eye = function (x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff"/><circle cx="' + (x + r * 0.2) + '" cy="' + y + '" r="' + r * 0.5 + '" fill="#1c2038"/>'; };
  var DRAW = {
    butterfly: [
      // egg: a leaf with a few eggs
      '<ellipse cx="0" cy="16" rx="36" ry="13" transform="rotate(-10 0 16)" fill="#5fb35a"/><path d="M-32 22 L30 8" stroke="#3f8f45" stroke-width="2" fill="none"/>'
      + [[-12, 8], [0, 3], [12, 0], [-4, 14], [8, 12]].map(function (p) { return '<circle class="egg" cx="' + p[0] + '" cy="' + p[1] + '" r="6.5" fill="#fff6c9" stroke="#e2cf84" stroke-width="1.5"/>'; }).join(''),
      // caterpillar: a row of round parts that ripple as it crawls
      '<ellipse cx="0" cy="26" rx="40" ry="9" fill="#5fb35a"/>'
      + [-34, -23, -12, -1, 10, 21].map(function (x, i) { return '<g class="seg"><circle cx="' + x + '" cy="12" r="9.5" fill="' + (i % 2 ? '#8bd35a' : '#6cc04a') + '"/><path d="M' + x + ' 3 v6" stroke="#f6c945" stroke-width="3" stroke-linecap="round"/></g>'; }).join('')
      + '<g class="seg"><circle cx="33" cy="9" r="11" fill="#f4b73e"/>' + eye(30, 6, 3.6) + eye(38, 6, 3.6) + '<path d="M30 14 q4 3 8 0" stroke="#7a4a12" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
      + '<path d="M28 -1 q-4 -8 -8 -9 M38 -1 q4 -8 8 -9" stroke="#7a4a12" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>',
      // chrysalis: hanging from a twig
      '<path d="M-38 -32 Q0 -40 38 -30" stroke="#7a5230" stroke-width="6" fill="none" stroke-linecap="round"/>'
      + '<g class="chry"><path d="M0 -34 V-24" stroke="#9aa98f" stroke-width="2"/>'
      + '<path d="M0 -26 C15 -20 17 6 7 27 C3 35 -3 35 -7 27 C-17 6 -15 -20 0 -26Z" fill="#9ed36c" stroke="#6aa842" stroke-width="2"/>'
      + '<path d="M-11 -8 Q0 -4 11 -8 M-12 4 Q0 8 12 4 M-9 16 Q0 20 9 16" stroke="#6aa842" stroke-width="2" fill="none"/>'
      + '<circle cx="-3" cy="-14" r="2" fill="#f6c945"/><circle cx="4" cy="-1" r="2" fill="#f6c945"/><circle cx="-4" cy="11" r="2" fill="#f6c945"/></g>',
      // butterfly: four wings that flap
      '<g class="fly">'
      + ['wingL', 'wingR'].map(function (cls, k) {
        var m = k ? 'transform="scale(-1 1)"' : '';
        return '<g class="' + cls + '"><g ' + m + '><path d="M-1 -3 C-16 -40 -48 -34 -40 -6 C-36 4 -10 6 -1 0Z" fill="#f28c28" stroke="#3a2418" stroke-width="2.4" stroke-linejoin="round"/>'
          + '<path d="M-1 3 C-26 4 -40 22 -26 31 C-13 37 -2 18 -1 8Z" fill="#f7b733" stroke="#3a2418" stroke-width="2.4" stroke-linejoin="round"/>'
          + '<circle cx="-30" cy="-14" r="3.6" fill="#fff"/><circle cx="-19" cy="-24" r="2.6" fill="#fff"/><circle cx="-24" cy="22" r="3" fill="#fff"/></g></g>';
      }).join('')
      + '<ellipse cx="0" cy="3" rx="3.6" ry="17" fill="#3a2418"/><circle cx="0" cy="-16" r="5" fill="#3a2418"/>'
      + '<path d="M-1.5 -20 q-5 -10 -11 -11 M1.5 -20 q5 -10 11 -11" stroke="#3a2418" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>'
    ],
    frog: [
      // frogspawn: jelly eggs with a dark dot
      [[-24, 8], [-10, 2], [4, 6], [18, 0], [28, 12], [-16, 20], [0, 22], [14, 18], [-30, 24], [22, 28], [-6, 34], [8, 36]].map(function (p) {
        return '<g class="egg"><circle cx="' + p[0] + '" cy="' + (p[1] - 10) + '" r="9" fill="rgba(214,240,232,.85)" stroke="#8cc3b4" stroke-width="1.5"/><circle cx="' + p[0] + '" cy="' + (p[1] - 10) + '" r="3.4" fill="#26332f"/></g>';
      }).join(''),
      // tadpole: round head, wagging tail
      '<g class="swim"><path class="tail" d="M6 0 Q22 -10 40 0 Q22 10 6 0Z" fill="#46583f"/><ellipse cx="-8" cy="0" rx="18" ry="13" fill="#46583f"/>' + eye(-16, -5, 3.2) + eye(-6, -6, 3.2) + '</g>',
      // tadpole with legs
      '<g class="swim"><path class="tail" d="M8 -2 Q20 -10 32 -2 Q20 6 8 -2Z" fill="#4f6a3f"/><ellipse cx="-6" cy="-2" rx="19" ry="14" fill="#4f6a3f"/>' + eye(-15, -8, 3.4) + eye(-4, -9, 3.4)
      + '<path d="M2 8 q10 6 17 3 M-8 10 q-4 9 -14 9" stroke="#5f8a45" stroke-width="5" stroke-linecap="round" fill="none"/></g>',
      // froglet: a small frog with a tail stub
      '<g class="hop"><path d="M-30 14 q-8 4 -14 0" stroke="#4f7a38" stroke-width="5" stroke-linecap="round" fill="none"/>'
      + '<ellipse cx="-4" cy="14" rx="26" ry="15" fill="#5fae4a"/><ellipse cx="2" cy="20" rx="15" ry="8" fill="#cfeaa0"/>'
      + '<path d="M-22 22 q-6 10 4 12 l12 -2 M16 26 q10 6 18 0" stroke="#4f9a3c" stroke-width="5" stroke-linecap="round" fill="none"/>'
      + '<ellipse cx="22" cy="6" rx="14" ry="11" fill="#5fae4a"/><circle cx="18" cy="-4" r="6.5" fill="#5fae4a"/><circle cx="29" cy="-3" r="6.5" fill="#5fae4a"/>' + eye(18, -4, 4.4) + eye(29, -3, 4.4)
      + '<path d="M26 10 q6 3 11 0" stroke="#2e5a20" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>',
      // frog: big eyes, a throat that puffs, hind legs ready to hop
      '<ellipse cx="0" cy="32" rx="44" ry="8" fill="#6fb85a"/><ellipse cx="-4" cy="32" rx="26" ry="5" fill="#59a248"/>'
      + '<g class="hop"><path d="M-30 20 q-14 12 4 18 l22 0 M-34 38 q18 6 36 0" stroke="#3f8f33" stroke-width="7" stroke-linecap="round" fill="none"/>'
      + '<ellipse cx="-6" cy="10" rx="32" ry="22" fill="#4cae3e"/><ellipse cx="4" cy="20" rx="20" ry="11" fill="#d3ee9d"/>'
      + '<ellipse cx="22" cy="2" rx="18" ry="14" fill="#4cae3e"/><circle cx="14" cy="-12" r="9" fill="#4cae3e"/><circle cx="30" cy="-12" r="9" fill="#4cae3e"/>' + eye(14, -12, 6) + eye(30, -12, 6)
      + '<path d="M16 6 q10 5 22 0" stroke="#256a1c" stroke-width="2" fill="none" stroke-linecap="round"/>'
      + '<ellipse class="throat" cx="26" cy="14" rx="9" ry="6" fill="#e7f5b8"/><path d="M20 34 q12 5 24 0" stroke="#3f8f33" stroke-width="7" stroke-linecap="round" fill="none"/></g>'
    ]
  };

  // ---- Mounting ----
  function mount(host, opts) {
    var labels = !!opts.labels, svg = document.createElementNS(NS, 'svg'), anims = [], token = 0, cur = null, step = -1, dead = false;
    svg.setAttribute('class', 'scene life'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.setProperty('--ar', (W / H).toFixed(3));
    if (labels) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', tx('A life cycle, going round', 'Daur hidup, berputar')); } else svg.setAttribute('aria-hidden', 'true');
    host.textContent = ''; host.appendChild(svg);
    var q = function (sel) { return svg.querySelectorAll(sel); };

    function build(mode) {
      var c = CYCLES[mode], n = c.stages.length, cx = 200, cy = 166, rx = 140, ry = 100, s = '<rect x="-20" y="-20" width="440" height="380" fill="' + c.bg + '"/>', i;
      var at = function (k, extra) { var a = (-90 + k * 360 / n) * D + (extra || 0); return [cx + rx * Math.cos(a), cy + ry * Math.sin(a), a]; };
      s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (rx - 8) + '" ry="' + (ry - 6) + '" fill="' + c.bubble + '" opacity=".7"/>';
      // arrows flowing round the ring, from each stage to the next
      var gap = 0.34 * (4 / n) * 0.8 + 0.06;
      for (i = 0; i < n; i++) {
        var p1 = at(i, gap), p2 = at(i + 1, -gap), tx = -rx * Math.sin(p2[2]), ty = ry * Math.cos(p2[2]), tl = Math.hypot(tx, ty), ux = tx / tl, uy = ty / tl;
        s += '<path class="ring" d="M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + ' A' + rx + ' ' + ry + ' 0 0 1 ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) + '" fill="none" stroke="' + c.ring + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="7 9"/>'
          + '<polygon points="' + [[p2[0] + ux * 9, p2[1] + uy * 9], [p2[0] - ux * 3 - uy * 8, p2[1] - uy * 3 + ux * 8], [p2[0] - ux * 3 + uy * 8, p2[1] - uy * 3 - ux * 8]].map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="' + c.ring + '"/>';
      }
      for (i = 0; i < n; i++) {
        var p = at(i), water = mode === 'frog' && i < 3;
        s += '<g transform="translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')"><g class="stg" data-i="' + i + '">'
          + '<circle r="46" fill="' + (water ? '#cfe9f8' : mode === 'frog' ? '#dff0c8' : '#ffffff') + '" stroke="' + c.ring + '" stroke-width="3"/>'
          + '<g clip-path="url(#clip' + i + ')">' + DRAW[mode][i] + '</g>'
          + (labels ? '<text class="nm" y="66" text-anchor="middle">' + (i + 1) + '. ' + c.stages[i].name + '</text>' : '') + '</g></g>';
      }
      var defs = '<defs>'; for (i = 0; i < n; i++) defs += '<clipPath id="clip' + i + '"><circle r="45"/></clipPath>'; defs += '</defs>';
      s = defs + s;
      if (labels) s += '<text id="lcName" class="ctr" x="200" y="162" text-anchor="middle"></text><text id="lcTime" class="ctr2" x="200" y="186" text-anchor="middle"></text>';
      svg.innerHTML = s;
    }
    function light(i) {
      step = i;
      q('.stg').forEach(function (g) { var k = +g.dataset.i; g.classList.toggle('lit', i === k); g.classList.toggle('dim', i >= 0 && i !== k); });
      if (!labels) return;
      var c = CYCLES[cur], name = svg.querySelector('#lcName'), time = svg.querySelector('#lcTime');
      name.textContent = i >= 0 ? c.stages[i].time : tx(c.name + ' life cycle', 'Daur hidup ' + c.name.toLowerCase());
      time.textContent = i >= 0 ? tx('stage ' + (i + 1) + ' of ' + c.stages.length, 'tahap ' + (i + 1) + ' dari ' + c.stages.length) : tx('tap a stage', 'ketuk sebuah tahap');
    }
    function motion(draw) {
      var t = ++token;
      anims.forEach(function (x) { x.pause(); }); anims = [];
      if (reduce.matches) return;
      load().then(function (a) { if (a && t === token && !dead) anims = draw(a); });
    }
    function loops(a) {
      var o = [];
      var go = function (sel, props) { var els = q(sel); if (els.length) o.push(a.animate(els, Object.assign({ loop: true, alternate: true, ease: 'inOutSine' }, props))); };
      o.push(a.animate(q('.ring'), { strokeDashoffset: [0, -32], duration: 1500, loop: true, ease: 'linear' }));
      go('.egg', { scale: [1, 1.14], duration: 1200, delay: a.stagger(140) });
      go('.seg', { translateY: [0, -6], duration: 520, delay: a.stagger(90) });
      go('.chry', { rotate: [-5, 5], duration: 1700 });
      go('.wingL', { scaleX: [1, 0.2], duration: 380 });
      go('.wingR', { scaleX: [1, 0.2], duration: 380 });
      go('.fly', { translateY: [-4, 5], duration: 900 });
      go('.tail', { rotate: [-16, 16], duration: 340 });
      go('.swim', { translateX: [-5, 5], duration: 1500 });
      go('.hop', { translateY: [0, -9], duration: 650, ease: 'outQuad' });
      go('.throat', { scale: [1, 1.35], duration: 420 });
      return o;
    }
    function show(view) {
      var mode = view.mode, at = view.at === undefined || view.at === null ? -1 : view.at;
      if (cur !== mode) { cur = mode; build(mode); motion(loops); }
      light(at);
      // with names on, a scene that is not stopped lights each stage in turn
      if (labels && at < 0 && !reduce.matches) {
        var t = token;
        load().then(function (a) {
          if (!a || dead || t !== token || cur !== mode) return;
          var n = CYCLES[mode].stages.length, st = { k: 0 };
          anims.push(a.animate(st, { k: [0, n], duration: n * 3200, loop: true, ease: 'linear', onUpdate: function () { var i = Math.min(n - 1, Math.floor(st.k)); if (i !== step) light(i); } }));
        });
      }
    }
    return { show: function (v) { if (cur === v.mode) { token++; anims.forEach(function (x) { x.pause(); }); anims = []; motion(loops); } show(v); }, stop: function () { dead = true; token++; anims.forEach(function (x) { x.pause(); }); svg.remove(); } };
  }
  S.scenes.life = mount;

  // ---- The watch screen ----
  var tabInfo = S.tabInfo, esc = S.esc;
  S.kinds.life = {
    title: tx('Watch the life cycles', 'Lihat daur hidup'),
    tabs: ['butterfly', 'frog'].map(function (id) { return { id: id, pic: CYCLES[id].pic, label: CYCLES[id].name }; }),
    intro: tabInfo('🔄', tx('A life cycle', 'Daur hidup'), tx('Animals change a lot as they grow. Pick a butterfly or a frog, then pick a stage to stop there.', 'Hewan berubah banyak saat tumbuh. Pilih kupu-kupu atau katak, lalu pilih satu tahap untuk menghentikannya di sana.')),
    view: function (id) { return { mode: id }; },
    info: function (id, at) {
      var c = CYCLES[id];
      if (at === undefined || at === null) return tabInfo(c.pic, tx(c.name + ' life cycle', 'Daur hidup ' + c.name.toLowerCase()), tx('It goes round and round: ', 'Ia berputar terus: ') + esc(c.stages.map(function (s) { return s.name.toLowerCase(); }).join(', ')) + tx(' and back to the start.', ' dan kembali ke awal.'));
      var st = c.stages[at];
      return tabInfo(c.pic, (at + 1) + '. ' + st.name, esc(st.text) + ' <i>(' + esc(st.time) + ')</i>');
    },
    picks: function (id) { return [{ id: null, label: tx('▶ Keep going', '▶ Lanjutkan') }].concat(CYCLES[id].stages.map(function (s, k) { return { id: k, label: s.name }; })); }
  };

  // ---- Questions ----
  var ask = S.ask, mix = S.shuffle;
  function stageQuestions(mode) {
    var c = CYCLES[mode], names = c.stages.map(function (s) { return s.name; }), n = names.length, out = [], low = function (x) { return x.toLowerCase(); };
    c.stages.forEach(function (st, i) {
      var others = mix(names.filter(function (x) { return x !== st.name; })).slice(0, 3), note = st.name + ': ' + st.text;
      out.push(ask(st.name, tx('Which stage of the ' + low(c.name) + '\'s life is this?', 'Tahap kehidupan ' + low(c.name) + ' yang manakah ini?'), st.name, others, note, { mode: mode, at: i }));
      out.push(ask(st.name + tx(' clue', ' petunjuk'), st.clue + tx(' Which stage is this?', ' Tahap manakah ini?'), st.name, others, note, { mode: mode }));
    });
    return out;
  }
  function orderQuestions(mode) {
    var c = CYCLES[mode], names = c.stages.map(function (s) { return s.name; }), n = names.length, out = [];
    c.stages.forEach(function (st, i) {
      var next = c.stages[(i + 1) % n], prev = c.stages[(i + n - 1) % n];
      out.push(ask(tx('After ', 'Setelah ') + st.name, tx('What comes right after the ' + st.name.toLowerCase() + '?', 'Apa yang datang tepat setelah ' + st.name.toLowerCase() + '?'), next.name, mix(names.filter(function (x) { return x !== next.name; })).slice(0, 3),
        tx(st.name + ' comes before ' + next.name.toLowerCase() + '. ', st.name + ' datang sebelum ' + next.name.toLowerCase() + '. ') + next.text, { mode: mode, at: i }));
      out.push(ask(tx('Before ', 'Sebelum ') + st.name, tx('What comes right before the ' + st.name.toLowerCase() + '?', 'Apa yang datang tepat sebelum ' + st.name.toLowerCase() + '?'), prev.name, mix(names.filter(function (x) { return x !== prev.name; })).slice(0, 3),
        tx(prev.name + ' comes before ' + st.name.toLowerCase() + '. ', prev.name + ' datang sebelum ' + st.name.toLowerCase() + '. ') + st.text, { mode: mode, at: i }));
    });
    return out;
  }
  var BFACTS = (IDL ? [
    ['Metamorfosis', 'Apa sebutan untuk perubahan besar dari ulat menjadi kupu-kupu?', 'Metamorfosis', ['Migrasi', 'Hibernasi', 'Penguapan'], 'Metamorfosis berarti perubahan bentuk tubuh secara menyeluruh, ketika ulat menjadi kupu-kupu.', 3],
    ['Makanan ulat', 'Apa yang dimakan ulat?', 'Daun', ['Nektar', 'Serangga lain', 'Sari buah'], 'Ulat memakan daun sepanjang hari, supaya ia bisa tumbuh cukup besar untuk berubah.', 1],
    ['Minuman kupu-kupu', 'Apa yang diminum kupu-kupu?', 'Nektar dari bunga', ['Sari daun', 'Air berlumpur', 'Susu'], 'Kupu-kupu menyedot nektar yang manis lewat tabung panjang, yaitu lidahnya.', 3],
    ['Sayap', 'Berapa sayap yang dimiliki kupu-kupu?', 'Empat', ['Dua', 'Enam', 'Delapan'], 'Kupu-kupu punya dua sayap di setiap sisi: empat semuanya.', 3],
    ['Kaki', 'Berapa kaki yang dimiliki kupu-kupu?', 'Enam', ['Dua', 'Empat', 'Delapan'], 'Kupu-kupu adalah serangga, dan setiap serangga punya enam kaki.', 3],
    ['Tempat berubah', 'Di mana ulat berubah menjadi kupu-kupu?', 'Di dalam kepompong', ['Di dalam telur', 'Di bawah tanah', 'Di dalam air'], 'Dengan aman di dalam kepompong, tubuh ulat berubah menjadi kupu-kupu.', null],
    ['Tempat bertelur', 'Di mana induk kupu-kupu bertelur?', 'Di tanaman', ['Di dalam air', 'Di bawah tanah', 'Di dalam sarang'], 'Ulat membutuhkan daun untuk dimakan begitu menetas, jadi telurnya diletakkan di tanaman.', 0]
  ] : [
    ['Metamorphosis', 'What do we call the big change from a caterpillar to a butterfly?', 'Metamorphosis', ['Migration', 'Hibernation', 'Evaporation'], 'Metamorphosis means a complete change of body shape, as the caterpillar becomes a butterfly.', 3],
    ['What a caterpillar eats', 'What does a caterpillar eat?', 'Leaves', ['Nectar', 'Other insects', 'Fruit juice'], 'A caterpillar eats leaves all day, so it can grow big enough to change.', 1],
    ['What a butterfly drinks', 'What does a butterfly drink?', 'Nectar from flowers', ['Leaf juice', 'Muddy water', 'Milk'], 'A butterfly sucks up sweet nectar through a long tube, its tongue.', 3],
    ['Wings', 'How many wings does a butterfly have?', 'Four', ['Two', 'Six', 'Eight'], 'A butterfly has two wings on each side: four in all.', 3],
    ['Legs', 'How many legs does a butterfly have?', 'Six', ['Two', 'Four', 'Eight'], 'A butterfly is an insect, and every insect has six legs.', 3],
    ['Where it changes', 'Where does a caterpillar change into a butterfly?', 'Inside the chrysalis', ['Inside the egg', 'Under the ground', 'In the water'], 'Safe inside the chrysalis, the body of the caterpillar turns into a butterfly.', null],
    ['Where eggs are laid', 'Where does a mother butterfly lay her eggs?', 'On a plant', ['In the water', 'Under the ground', 'In a nest'], 'The caterpillars need leaves to eat as soon as they hatch, so the eggs are laid on a plant.', 0]
  ]).map(function (f) { return ask(f[0], f[1], f[2], f[3], f[4], { mode: 'butterfly', at: f[5] }); });
  var FFACTS = (IDL ? [
    ['Tempat katak bertelur', 'Di mana sebagian besar katak bertelur?', 'Di dalam air', ['Di atas sarang', 'Di bawah pasir', 'Di atas batu yang terkena sinar matahari'], 'Sebagian besar katak bertelur di kolam, tempat kecebong bisa berenang.', 0],
    ['Bayi katak', 'Apa sebutan untuk bayi katak yang hidup di dalam air?', 'Kecebong', ['Ulat', 'Katak muda', 'Kepompong'], 'Kecebong hidup di dalam air, berenang dengan ekornya, dan pada awalnya tidak punya kaki.', null],
    ['Berenang', 'Apa yang dipakai kecebong muda untuk berenang?', 'Ekornya', ['Kakinya', 'Sayapnya', 'Lengannya'], 'Kecebong menggoyangkan ekornya dari sisi ke sisi, seperti ikan.', 1],
    ['Bernapas', 'Apa yang dipakai kecebong muda untuk bernapas?', 'Insang', ['Paru-paru', 'Hidungnya', 'Ekornya'], 'Kecebong muda bernapas di bawah air dengan insang. Paru-paru tumbuh kemudian.', 1],
    ['Kaki pertama', 'Kaki mana yang tumbuh lebih dulu pada kecebong?', 'Kaki belakang', ['Kaki depan', 'Keduanya sekaligus', 'Sayap'], 'Kaki belakang muncul lebih dulu, lalu kaki depan.', 2],
    ['Ekor', 'Apa yang terjadi pada ekor katak muda?', 'Ekornya memendek dan menghilang', ['Ekornya memanjang', 'Ekornya berubah menjadi sayap', 'Ekornya berubah menjadi kaki'], 'Katak muda memakai ekornya sebagai makanan selagi tumbuh, sampai ekor itu hilang.', 3],
    ['Menangkap lalat', 'Apa yang dipakai katak dewasa untuk menangkap lalat?', 'Lidahnya yang panjang dan lengket', ['Ekornya', 'Giginya', 'Kaki depannya'], 'Katak menjulurkan lidahnya yang panjang dan lengket, lalu menarik serangga itu ke mulutnya.', 4]
  ] : [
    ['Where frogs lay eggs', 'Where do most frogs lay their eggs?', 'In water', ['Up in a nest', 'Under the sand', 'On a rock in the sun'], 'Most frogs lay their eggs in ponds, where the tadpoles can swim.', 0],
    ['Baby frog', 'What do we call a baby frog that lives in the water?', 'A tadpole', ['A caterpillar', 'A froglet', 'A chrysalis'], 'A tadpole lives in the water, swims with its tail and has no legs at first.', null],
    ['Swimming', 'What does a young tadpole use to swim?', 'Its tail', ['Its legs', 'Its wings', 'Its arms'], 'A tadpole wags its tail from side to side, like a fish.', 1],
    ['Breathing', 'What does a young tadpole use to breathe?', 'Gills', ['Lungs', 'Its nose', 'Its tail'], 'A young tadpole breathes under water with gills. Lungs grow later.', 1],
    ['First legs', 'Which legs does a tadpole grow first?', 'The back legs', ['The front legs', 'Both at the same time', 'Wings'], 'The back legs come first, then the front legs.', 2],
    ['The tail', 'What happens to the tail of a froglet?', 'It gets shorter and goes away', ['It gets longer', 'It turns into wings', 'It turns into legs'], 'The froglet uses up its tail as food while it grows, until it is gone.', 3],
    ['Catching flies', 'What does an adult frog use to catch flies?', 'Its long sticky tongue', ['Its tail', 'Its teeth', 'Its front legs'], 'A frog flicks out its long sticky tongue and pulls the insect into its mouth.', 4]
  ]).map(function (f) { return ask(f[0], f[1], f[2], f[3], f[4], { mode: 'frog', at: f[5] }); });

  S.questions['lc.butterfly'] = function () { return stageQuestions('butterfly').concat(BFACTS); };
  S.questions['lc.frog'] = function () { return stageQuestions('frog').concat(FFACTS); };
  S.questions['lc.order'] = function () { return orderQuestions('butterfly').concat(orderQuestions('frog')); };
  S.questions['lc.all'] = function () { return stageQuestions('butterfly').concat(stageQuestions('frog'), orderQuestions('butterfly'), orderQuestions('frog'), BFACTS, FFACTS); };
})();
