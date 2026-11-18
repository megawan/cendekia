// Science for Omnia: the water cycle and food chains. Animated scenes (anime.js, loaded from ../shared the first time one is drawn),
// what to say about them, and the questions of every level.
//
//   OMNIA_SCIENCE.mount(kind, host, { labels, onPick })  draws a scene ('water', 'chain' or, from sky.js, 'sky') in host; returns { show(view), stop() }
//       water: show({ stage })              lights up one step of the cycle (no stage lights none)
//       chain: show({ chain, hide, hl })    draws a food chain; hide is the number of a place left as "?", hl one to light up
//       labels: names and numbers are written on the scene (to watch); onPick({ tab }) or onPick({ chain, node }) makes it tappable
//   OMNIA_SCIENCE.kinds[kind]   what the watch screen needs: title, tabs, view(tab), info(tab), nodeInfo(chain, node)
//   OMNIA_SCIENCE.questions[id]()  the questions of a level: { sci, name, text, right, wrong, note, view }
//
// With "reduce motion" on, the scenes are drawn still.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var lib = null;
  function load() { if (!lib) lib = import('../shared/anime.esm.min.js').catch(function () { return null; }); return lib; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cap(s) { return s[0].toUpperCase() + s.slice(1); }

  // ---- The water cycle ----
  var STAGES = [
    { id: 'evaporation', pic: '☀️', name: 'Evaporation',
      text: 'The Sun warms the water in the sea, lakes and rivers. The water turns into water vapour, a gas you cannot see, and rises into the air.',
      clue: 'The Sun warms the sea and the water rises into the air as vapour.' },
    { id: 'condensation', pic: '☁️', name: 'Condensation',
      text: 'High up the air is cold. The water vapour cools and turns into tiny drops of water. Lots of drops together make a cloud.',
      clue: 'Water vapour cools high in the sky and turns into tiny drops that make clouds.' },
    { id: 'precipitation', pic: '🌧️', name: 'Precipitation',
      text: 'When the drops in a cloud get big and heavy, they fall as rain. In very cold places they fall as snow or hail.',
      clue: 'Water falls from the clouds as rain, snow or hail.' },
    { id: 'collection', pic: '🏞️', name: 'Collection',
      text: 'The rain runs down hills into streams and rivers, or soaks into the ground. It collects in lakes and in the sea, and then the Sun warms it again.',
      clue: 'Water runs into rivers, lakes and the sea, ready to start again.' }
  ];
  var STAGE = {}; STAGES.forEach(function (s, i) { s.n = i + 1; STAGE[s.id] = s; });

  function waterSvg(labels, tap) {
    var rays = '', vap = '', rain = '', i, t;
    for (i = 0; i < 8; i++) {
      t = i * Math.PI / 4;
      rays += '<line x1="' + (350 + 27 * Math.cos(t)).toFixed(1) + '" y1="' + (45 + 27 * Math.sin(t)).toFixed(1)
        + '" x2="' + (350 + 37 * Math.cos(t)).toFixed(1) + '" y2="' + (45 + 37 * Math.sin(t)).toFixed(1) + '"/>';
    }
    for (i = 0; i < 6; i++) vap += '<circle class="vap" cx="' + (310 - i * 17) + '" cy="' + (180 - i * 20) + '" r="5" opacity=".8"/>';
    for (i = 0; i < 7; i++) rain += '<line class="drop" x1="' + (132 + i * 11) + '" y1="80" x2="' + (129 + i * 11) + '" y2="90"/>';
    var lbl = function (id, x, y) { return labels ? '<text class="lbl" x="' + x + '" y="' + y + '" text-anchor="middle">' + STAGE[id].n + ' ' + STAGE[id].name + '</text>' : ''; };
    var hit = function (id, x, y, w, h) {
      return tap ? '<rect class="hit" data-tab="' + id + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" tabindex="0" role="button" aria-label="' + STAGE[id].name + '"/>' : '';
    };
    return '<rect width="400" height="260" fill="#c6e6fb"/>'
      + '<g data-stage="evaporation"><g class="sun"><g class="rays">' + rays + '</g><circle cx="350" cy="45" r="20"/></g>' + vap + '</g>'
      + '<path class="waves" d="M210 203 q11 -7 22 0 t22 0 t22 0 t22 0 t22 0 t22 0 t22 0 t22 0 t22 0 t22 0 v70 h-250z"/>'
      + '<path class="land" d="M0 260 L0 140 L70 78 L105 108 L140 128 L180 165 L235 200 L235 260z"/>'
      + '<path class="snow" d="M70 78 L56 91 L64 88 L70 94 L78 88 L84 91z"/>'
      + '<g data-stage="collection"><path class="river" d="M118 118 Q158 128 168 160 T236 198"/><path class="flow" d="M118 118 Q158 128 168 160 T236 198"/></g>'
      + '<g data-stage="condensation"><g class="cloud"><circle cx="145" cy="54" r="15"/><circle cx="168" cy="44" r="20"/><circle cx="192" cy="53" r="14"/><ellipse cx="168" cy="58" rx="40" ry="14"/></g></g>'
      + '<g data-stage="precipitation">' + rain + '</g>'
      + lbl('evaporation', 352, 128) + lbl('condensation', 165, 22) + lbl('precipitation', 230, 108) + lbl('collection', 122, 226)
      + hit('evaporation', 235, 15, 165, 180) + hit('condensation', 105, 25, 130, 50) + hit('precipitation', 105, 76, 100, 60) + hit('collection', 95, 138, 150, 75);
  }
  function waterMotion(a, svg) {
    var q = function (sel) { return svg.querySelectorAll(sel); };
    return [
      a.animate(q('.rays'), { rotate: 360, duration: 26000, loop: true, ease: 'linear' }),
      a.animate(q('.sun circle'), { scale: [1, 1.08], duration: 1800, alternate: true, loop: true, ease: 'inOutSine' }),
      a.animate(q('.vap'), { cx: [315, 270, 215], cy: [190, 120, 62], r: [3, 6, 9], opacity: [0, 0.9, 0], duration: 4200, delay: a.stagger(700), loop: true, ease: 'linear' }),
      a.animate(q('.cloud'), { translateX: [-7, 7], duration: 4800, alternate: true, loop: true, ease: 'inOutSine' }),
      a.animate(q('.drop'), { translateY: [0, 42], opacity: [0, 1, 0], duration: 1000, delay: a.stagger(130), loop: true, ease: 'linear' }),
      a.animate(q('.flow'), { strokeDashoffset: [0, -28], duration: 1400, loop: true, ease: 'linear' }),
      a.animate(q('.waves'), { translateX: [-11, 11], duration: 2400, alternate: true, loop: true, ease: 'inOutSine' })
    ];
  }

  // ---- Food chains ----
  // Arrows point from the food to the one that eats it. Names are used as answers, so each is in one chain only.
  var ROLE = {
    producer: { name: 'Producer', fill: '#d9f5e8', ink: '#1f9d6b' },
    herbivore: { name: 'Herbivore', fill: '#fff1c2', ink: '#c9760f' },
    carnivore: { name: 'Carnivore', fill: '#ffe0ec', ink: '#d6336c' }
  };
  var CHAINS = {
    komodo: { name: 'Komodo Island', pic: '🦎', decoys: ['Shark', 'Shrimp', 'Plankton'], nodes: [
      { name: 'Grass', ref: 'grass', mass: true, pic: '🌿', role: 'producer', note: 'makes its own food from sunlight, air and water' },
      { name: 'Deer', ref: 'deer', pic: '🦌', role: 'herbivore', note: 'eats grass and leaves' },
      { name: 'Komodo dragon', ref: 'Komodo dragon', pic: '🦎', role: 'carnivore', note: 'hunts deer and other animals, and is the biggest lizard in the world' }] },
    rice: { name: 'Rice field', pic: '🌾', decoys: ['Shark', 'Shrimp', 'Plankton'], nodes: [
      { name: 'Rice plant', ref: 'rice plant', pic: '🌾', role: 'producer', note: 'makes its own food from sunlight, air and water' },
      { name: 'Rat', ref: 'rat', pic: '🐀', role: 'herbivore', note: 'eats rice and other seeds' },
      { name: 'Snake', ref: 'snake', pic: '🐍', role: 'carnivore', note: 'hunts rats and swallows them whole' },
      { name: 'Eagle', ref: 'eagle', pic: '🦅', role: 'carnivore', note: 'hunts snakes from the sky' }] },
    sea: { name: 'The sea', pic: '🦈', decoys: ['Deer', 'Langur', 'Grass'], nodes: [
      { name: 'Plankton', ref: 'plankton', mass: true, pic: '🟢', role: 'producer', note: 'is a tiny floating plant that makes its own food from sunlight' },
      { name: 'Shrimp', ref: 'shrimp', pic: '🦐', role: 'herbivore', note: 'eats plankton' },
      { name: 'Fish', ref: 'fish', pic: '🐟', role: 'carnivore', note: 'eats shrimp and other small animals' },
      { name: 'Shark', ref: 'shark', pic: '🦈', role: 'carnivore', note: 'hunts big fish' }] },
    forest: { name: 'Rainforest', pic: '🐆', decoys: ['Shark', 'Shrimp', 'Plankton'], nodes: [
      { name: 'Leaves', ref: 'leaves', mass: true, pic: '🍃', role: 'producer', note: 'are made by trees, which make their own food from sunlight' },
      { name: 'Langur', ref: 'langur', pic: '🐒', role: 'herbivore', note: 'is a monkey that eats leaves' },
      { name: 'Leopard', ref: 'leopard', pic: '🐆', role: 'carnivore', note: 'hunts langurs and other animals' }] }
  };
  var CHAIN_IDS = ['komodo', 'rice', 'sea', 'forest'];
  var DECOY_ROLES = ['Decomposer'];
  var the = function (nd) { return nd.mass ? nd.ref : 'the ' + nd.ref; };
  var SAME_PLURAL = { fish: 1 };

  function chainSvg(ch, v, labels, tap) {
    var nodes = ch.nodes, n = nodes.length, cy = 96, r = 30, s = '', i;
    var xs = nodes.map(function (_, k) { return Math.round(52 + k * (296 / (n - 1))); });
    s += '<text class="sun" x="' + xs[0] + '" y="29" font-size="24" text-anchor="middle">☀️</text>'
      + '<path class="arrow" d="M' + xs[0] + ' 40 V56"/><polygon class="head" points="' + (xs[0] - 6) + ',54 ' + (xs[0] + 6) + ',54 ' + xs[0] + ',62"/>';
    for (i = 0; i < n - 1; i++) {
      var x1 = xs[i] + r + 3, x2 = xs[i + 1] - r - 3;
      s += '<path class="arrow" d="M' + x1 + ' ' + cy + ' H' + (x2 - 6) + '"/><polygon class="head" points="' + (x2 - 9) + ',' + (cy - 6) + ' ' + x2 + ',' + cy + ' ' + (x2 - 9) + ',' + (cy + 6) + '"/>'
        + '<circle class="spk" data-x1="' + x1 + '" data-x2="' + (x2 - 4) + '" cx="' + x1 + '" cy="' + cy + '" r="4"/>';
    }
    nodes.forEach(function (nd, k) {
      var hidden = v.hide === k, ro = ROLE[nd.role], x = xs[k];
      var head = '<g class="nd' + (v.hl === k ? ' hl' : '') + '" data-i="' + k + '"' + (tap ? ' tabindex="0" role="button" aria-label="' + esc(nd.name) + '"' : '') + '><g class="bob"><g class="face">';
      s += head + (hidden
        ? '<circle class="q" cx="' + x + '" cy="' + cy + '" r="' + r + '"/><text class="qm" x="' + x + '" y="' + (cy + 12) + '" text-anchor="middle">?</text>'
        : '<circle cx="' + x + '" cy="' + cy + '" r="' + r + '" fill="' + ro.fill + '" stroke="' + ro.ink + '"/><text class="pic" x="' + x + '" y="' + (cy + 12) + '" text-anchor="middle">' + nd.pic + '</text>')
        + '</g></g>'
        + (labels && !hidden ? '<text class="nm" x="' + x + '" y="' + (cy + 52) + '" text-anchor="middle">' + esc(nd.name) + '</text><text class="rl" x="' + x + '" y="' + (cy + 67) + '" text-anchor="middle" fill="' + ro.ink + '">' + ro.name + '</text>' : '')
        + '</g>';
    });
    return s;
  }
  function chainMotion(a, svg, pop) {
    var q = function (sel) { return svg.querySelectorAll(sel); }, out = [];
    out.push(a.animate(q('.bob'), { translateY: [0, -4, 0], duration: 2300, delay: a.stagger(280), loop: true, ease: 'inOutSine' }));
    out.push(a.animate(q('.spk'), { cx: function (el) { return [+el.dataset.x1, +el.dataset.x2]; }, opacity: [0, 1, 0], duration: 1500, delay: a.stagger(420), loop: true, ease: 'inOutQuad' }));
    out.push(a.animate(q('.sun'), { scale: [1, 1.14], duration: 1600, alternate: true, loop: true, ease: 'inOutSine' }));
    var faces = q('.nd .face'), pops = [];
    faces.forEach(function (f, k) { if (pop === 'all' || pop === k) pops.push(f); });
    if (pops.length) out.push(a.animate(pops, { scale: [0, 1], opacity: [0, 1], duration: 560, delay: a.stagger(150), ease: 'outBack' }));
    return out;
  }

  // ---- Mounting a scene ----
  var scenes = {}; // scenes drawn elsewhere (sky.js), by kind: scenes[kind](host, opts) returns { show, stop }
  function mount(kind, host, opts) {
    opts = opts || {};
    if (scenes[kind]) return scenes[kind](host, opts);
    var svg = document.createElementNS(NS, 'svg'), anims = [], token = 0, cur = null;
    svg.setAttribute('class', 'scene ' + kind);
    // A food chain without names (in a quiz) is shorter, since there is no text under the animals.
    var h = kind === 'water' ? 260 : opts.labels ? 190 : 142;
    svg.setAttribute('viewBox', '0 0 400 ' + h);
    svg.style.setProperty('--ar', (400 / h).toFixed(3));
    if (opts.onPick) { svg.setAttribute('role', 'group'); svg.setAttribute('aria-label', kind === 'water' ? 'The water cycle. Tap a step.' : 'A food chain. Tap an animal or plant.'); } else svg.setAttribute('aria-hidden', 'true');
    host.textContent = '';
    host.appendChild(svg);

    function motion(draw) {
      var t = ++token;
      anims.forEach(function (x) { x.pause(); }); anims = [];
      if (reduce.matches) return;
      load().then(function (a) { if (a && t === token) anims = draw(a); });
    }
    function tapAll(attr, pick) {
      svg.querySelectorAll('[' + attr + ']').forEach(function (el) {
        el.addEventListener('click', function () { pick(el); });
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(el); } });
      });
    }

    if (kind === 'water') {
      svg.innerHTML = waterSvg(!!opts.labels, !!opts.onPick);
      tapAll('data-tab', function (el) { opts.onPick({ tab: el.dataset.tab }); });
      motion(function (a) { return waterMotion(a, svg); });
      return {
        show: function (v) {
          var st = v && v.stage;
          svg.querySelectorAll('[data-stage]').forEach(function (g) { g.classList.toggle('dim', !!st && g.dataset.stage !== st); g.classList.toggle('lit', !!st && g.dataset.stage === st); });
        },
        stop: function () { token++; anims.forEach(function (x) { x.pause(); }); svg.remove(); }
      };
    }
    return {
      show: function (v) {
        var ch = CHAINS[v.chain], pop = !cur || cur.chain !== v.chain ? 'all' : v.hl === undefined ? -1 : v.hl;
        cur = v;
        svg.innerHTML = chainSvg(ch, v, !!opts.labels, !!opts.onPick);
        tapAll('data-i', function (el) { opts.onPick({ chain: v.chain, node: +el.dataset.i }); });
        motion(function (a) { return chainMotion(a, svg, pop); });
      },
      stop: function () { token++; anims.forEach(function (x) { x.pause(); }); svg.remove(); }
    };
  }

  // ---- The watch screen ----
  var tabInfo = function (pic, title, text) { return '<span class="flag" aria-hidden="true">' + pic + '</span><span><b>' + esc(title) + '</b><p>' + text + '</p></span>'; };
  function chainSentence(ch) {
    return ch.nodes.map(function (nd, k) {
      return k === 0 ? cap(the(nd)) + ' ' + nd.note + '.' : cap(the(nd)) + ' eats ' + the(ch.nodes[k - 1]) + '.';
    }).join(' ');
  }
  var kinds = {
    water: {
      title: 'Watch the water cycle',
      tabs: STAGES.map(function (s) { return { id: s.id, pic: s.pic, label: s.n + '. ' + s.name }; }),
      intro: tabInfo('💧', 'The water cycle', 'Water never gets used up. It goes round and round. Tap a step to see it.'),
      view: function (id) { return { stage: id }; },
      info: function (id) { var s = STAGE[id]; return tabInfo(s.pic, s.n + '. ' + s.name, esc(s.text)); }
    },
    chain: {
      title: 'Watch the food chains',
      tabs: CHAIN_IDS.map(function (id) { return { id: id, pic: CHAINS[id].pic, label: CHAINS[id].name }; }),
      intro: tabInfo('🔗', 'A food chain', 'Every food chain starts with the Sun. The arrows show who eats what, and where the energy goes.'),
      view: function (id) { return { chain: id }; },
      info: function (id) { var ch = CHAINS[id]; return tabInfo(ch.pic, ch.name, esc(chainSentence(ch)) + ' <i>Tap one to find out more.</i>'); },
      nodeInfo: function (id, k) {
        var ch = CHAINS[id], nd = ch.nodes[k], next = ch.nodes[k + 1], prev = ch.nodes[k - 1];
        var eats = prev ? '' : ' It gets its energy from the Sun.'; // what a consumer eats is in its note
        var eaten = next ? ' It is eaten by ' + esc(the(next)) + '.' : ' Nothing hunts it here.';
        return tabInfo(nd.pic, nd.name, '<b>' + ROLE[nd.role].name + '</b>: ' + esc(cap(the(nd))) + ' ' + esc(nd.note) + '.' + eats + eaten);
      }
    }
  };

  // ---- Questions ----
  // A question: text, the right answer, three wrong ones, what to remember after a miss (note), what the scene shows (view).
  function ask(name, text, right, wrong, note, view) { return { sci: true, name: name, text: text, right: right, wrong: wrong, note: note, view: view }; }
  var others = function (ids, id) { return ids.filter(function (x) { return x !== id; }); };

  var WATER_FACTS = [
    ['Energy', 'What gives the water cycle its energy?', 'The Sun', ['The Moon', 'The wind', 'The sea floor'], 'The Sun warms the water, and that makes it all move.', 'evaporation'],
    ['Clouds', 'What are clouds made of?', 'Tiny drops of water', ['Smoke', 'Cotton', 'Dust only'], 'A cloud is made of billions of tiny drops of water.', 'condensation'],
    ['Water vapour', 'What is water vapour?', 'Water as a gas you cannot see', ['Frozen water', 'Very salty water', 'Dirty water'], 'Water vapour is water as a gas, so it is in the air all around us.', 'evaporation'],
    ['In the cold sky', 'What happens to water vapour high up in the cold sky?', 'It cools and turns into drops', ['It disappears for ever', 'It turns into rocks', 'It gets hotter'], 'The cold air cools the vapour, and it turns back into tiny drops of water.', 'condensation'],
    ['The sea', 'Where does most of the Earth\'s water collect?', 'In the oceans', ['In the clouds', 'In puddles', 'In the air'], 'Most of the water on Earth is in the oceans.', 'collection'],
    ['Rain, snow and hail', 'What do we call rain, snow and hail together?', 'Precipitation', ['Evaporation', 'Condensation', 'Collection'], 'Water that falls from the clouds is called precipitation.', null],
    ['After the rain', 'Where does the rain go after it falls?', 'Into rivers, lakes and the sea', ['Up to space', 'Into the Moon', 'It turns to sand'], 'It runs into streams and rivers, soaks into the ground, and ends up in lakes and the sea.', 'collection'],
    ['Used up', 'Is water ever used up in the water cycle?', 'No, it goes round and round', ['Yes, it is used up', 'Yes, it turns into air for ever', 'Only in summer'], 'The water we drink today is water that has been going round for millions of years.', null],
    ['Drying clothes', 'Which day dries wet clothes fastest?', 'A hot, sunny day', ['A cold, dark night', 'A cloudy, cold day', 'A foggy morning'], 'The more heat, the faster water evaporates.', 'evaporation'],
    ['Hail', 'What do we call water that falls as little balls of ice?', 'Hail', ['Dew', 'Fog', 'Steam'], 'Hail forms in very cold clouds. Snow and hail are precipitation too.', 'precipitation']
  ].map(function (f) { return ask(f[0], f[1], f[2], f[3], f[4], { stage: f[5] }); });

  function waterSteps() {
    var out = [];
    STAGES.forEach(function (s) {
      var rest = others(STAGES.map(function (x) { return x.id; }), s.id).map(function (id) { return STAGE[id].name; });
      out.push(ask(s.name, 'Which step of the water cycle is lit up?', s.name, rest, s.name + ': ' + s.text, { stage: s.id }));
      out.push(ask(s.name, s.clue + ' What is this step called?', s.name, rest, s.name + ': ' + s.text, { stage: null }));
    });
    return out;
  }
  function waterOrder() {
    var out = [];
    STAGES.forEach(function (s, i) {
      var next = STAGES[(i + 1) % 4], prev = STAGES[(i + 3) % 4], all = STAGES.map(function (x) { return x.name; });
      out.push(ask('After ' + s.name, 'What comes right after ' + s.name.toLowerCase() + '?', next.name, others(all, next.name), s.name + ' comes before ' + next.name.toLowerCase() + '. ' + next.text, { stage: s.id }));
      out.push(ask('Before ' + s.name, 'What comes right before ' + s.name.toLowerCase() + '?', prev.name, others(all, prev.name), prev.name + ' comes before ' + s.name.toLowerCase() + '. ' + s.text, { stage: s.id }));
    });
    return out;
  }

  var FACTS = [
    ['Where energy starts', 'Where does the energy in a food chain start?', 'With the Sun', ['With the soil', 'With the wind', 'With the biggest animal'], 'Plants use sunlight to make food, and every animal gets its energy from plants, directly or not.'],
    ['Producers', 'What do we call a plant that makes its own food?', 'A producer', ['A predator', 'A herbivore', 'A decomposer'], 'A plant is a producer: it makes its own food from sunlight, air and water.'],
    ['Herbivores', 'What do we call an animal that eats only plants?', 'A herbivore', ['A carnivore', 'A producer', 'A decomposer'], 'A herbivore eats plants, like a deer or a rat.'],
    ['Carnivores', 'What do we call an animal that eats only other animals?', 'A carnivore', ['A herbivore', 'A producer', 'A decomposer'], 'A carnivore eats other animals, like a snake or a shark.'],
    ['Predators', 'What do we call an animal that hunts other animals?', 'A predator', ['Prey', 'A producer', 'A herbivore'], 'A predator hunts other animals for food.'],
    ['Prey', 'What do we call an animal that is hunted by another animal?', 'Prey', ['A predator', 'A producer', 'A decomposer'], 'The animal that is hunted is called prey.'],
    ['The arrows', 'What do the arrows in a food chain show?', 'Where the energy goes', ['Which animal is bigger', 'Which animal runs faster', 'Where animals live'], 'An arrow points from the food to the one that eats it, so it shows where the energy goes.'],
    ['Decomposers', 'What do mushrooms and worms do to dead plants and animals?', 'They break them down', ['They hunt them', 'They make them grow', 'They turn them into rocks'], 'Decomposers break down what is dead, and the goodness goes back into the soil.']
  ].map(function (f, k) { return ask(f[0], f[1], f[2], f[3], f[4], { chain: CHAIN_IDS[k % 4] }); });

  function chainEats() {
    var out = [];
    CHAIN_IDS.forEach(function (id) {
      var ch = CHAINS[id];
      ch.nodes.forEach(function (nd, k) {
        if (k > 0) {
          var food = ch.nodes[k - 1];
          out.push(ask('What ' + the(nd) + ' eats', 'What does ' + the(nd) + ' eat?', food.name, ch.decoys,
            cap(the(nd)) + ' eats ' + the(food) + '. ' + food.pic + ' → ' + nd.pic, { chain: id, hide: k - 1 }));
        }
        if (k < ch.nodes.length - 1) {
          var eater = ch.nodes[k + 1];
          out.push(ask('What eats ' + the(nd), 'What eats ' + the(nd) + '?', eater.name, ch.decoys,
            cap(the(eater)) + ' eats ' + the(nd) + '. ' + nd.pic + ' → ' + eater.pic, { chain: id, hide: k + 1 }));
        }
      });
    });
    return out;
  }
  function chainWhatIf() {
    var out = [], plural = function (nd) { return nd.mass || SAME_PLURAL[nd.ref] || /s$/.test(nd.ref) ? nd.ref : nd.ref + 's'; };
    CHAIN_IDS.forEach(function (id) {
      var ch = CHAINS[id], elsewhere = [];
      CHAIN_IDS.forEach(function (c) { if (c !== id) CHAINS[c].nodes.forEach(function (n) { if (n.role !== 'producer') elsewhere.push(n.name); }); });
      ch.nodes.forEach(function (nd, k) {
        if (k === ch.nodes.length - 1) return;
        var next = ch.nodes[k + 1];
        out.push(ask('If ' + the(nd) + ' went', 'What if all the ' + plural(nd) + ' disappeared? Who would soon go hungry?', next.name, shuffle(elsewhere).slice(0, 3),
          cap(the(next)) + ' eats ' + the(nd) + ', so it would have nothing to eat. Everything in a food chain depends on the rest.', { chain: id, hl: k }));
      });
    });
    return out;
  }
  function chainRoles() {
    var out = [];
    CHAIN_IDS.forEach(function (id) {
      CHAINS[id].nodes.forEach(function (nd, k) {
        var ro = ROLE[nd.role], all = Object.keys(ROLE).map(function (r) { return ROLE[r].name; }).filter(function (n) { return n !== ro.name; });
        out.push(ask('Is ' + the(nd) + '?', 'Is ' + the(nd) + ' a producer, a herbivore or a carnivore?', ro.name, all.concat(DECOY_ROLES).slice(0, 3),
          cap(the(nd)) + ' ' + nd.note + '. So it is a ' + ro.name.toLowerCase() + '.', { chain: id, hl: k }));
      });
    });
    return out;
  }

  var questions = {
    'w.steps': waterSteps,
    'w.order': waterOrder,
    'w.facts': function () { return WATER_FACTS.slice(); },
    'w.all': function () { return waterSteps().concat(waterOrder(), WATER_FACTS); },
    'c.eats': chainEats,
    'c.whatif': chainWhatIf,
    'c.roles': chainRoles,
    'c.facts': function () { return FACTS.slice(); },
    'c.all': function () { return chainEats().concat(chainWhatIf(), chainRoles(), FACTS); }
  };

  window.OMNIA_SCIENCE = { mount: mount, kinds: kinds, questions: questions, scenes: scenes, ask: ask, tabInfo: tabInfo, cap: cap, shuffle: shuffle, esc: esc };
})();
