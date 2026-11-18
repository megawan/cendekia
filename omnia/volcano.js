// Volcanoes for Omnia: a cutaway of a volcano that erupts. Drawn in SVG and moved with anime.js: magma bubbles in its chamber and
// rises up the vent, the mountain shakes, ash and glowing rocks are thrown out of the crater, lava flows down the slopes and
// then cools while plants grow back. Adds the 'volcano' scene, watch screen and questions to OMNIA_SCIENCE (science.js).
//
//   mount('volcano', host, { labels }).show({ mode, at })
//     mode: 'parts' (a volcano with its parts; at lights one of them) or 'erupt' (at is the step, 0 to 4)
//     with names on, an eruption that is not stopped goes through the five steps one after another
(function () {
  'use strict';
  var S = window.OMNIA_SCIENCE;
  var NS = 'http://www.w3.org/2000/svg', W = 400, H = 320;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var lib = null;
  function load() { if (!lib) lib = import('../shared/anime.esm.min.js').catch(function () { return null; }); return lib; }

  // ---- What there is to say ----
  var PARTS = [
    { id: 'crater', name: 'Crater', text: 'The bowl at the top of the volcano. Lava, ash and gas come out of it.', clue: 'It is the bowl at the very top, where everything comes out.' },
    { id: 'vent', name: 'Vent', text: 'The pipe inside the volcano. Magma rushes up through it from deep below.', clue: 'It is a long pipe inside the mountain that carries magma upwards.' },
    { id: 'chamber', name: 'Magma chamber', text: 'A huge pocket of hot, melted rock deep under the volcano, where the magma collects.', clue: 'It is a huge pocket of melted rock deep under the volcano.' },
    { id: 'lava', name: 'Lava', text: 'Melted rock that has come out of the volcano. It flows down the slopes and cools into hard rock.', clue: 'It is the glowing red-hot river of melted rock on the outside of the volcano.' },
    { id: 'ash', name: 'Ash cloud', text: 'A cloud of tiny pieces of rock, thrown high into the sky. The ash falls back down far away.', clue: 'It is the big dark cloud of tiny pieces of rock above the volcano.' },
    { id: 'crust', name: 'Crust', text: 'The hard outer layer of the Earth, the ground that the volcano stands on.', clue: 'It is the hard layer of rock that the volcano and all of us stand on.' }
  ];
  var STEPS = [
    { name: 'Magma builds up', text: 'Deep underground, rock melts into hot, runny magma. It collects in the magma chamber and pushes on the rock around it.',
      clue: 'Rock deep underground melts, and the hot magma collects in a big pocket.' },
    { name: 'Magma rises', text: 'The magma is lighter than the rock around it, so it rises up the vent. Gas bubbles in it, like in a shaken fizzy drink, and the ground starts to shake.',
      clue: 'The magma climbs up the vent, full of gas bubbles, and the ground shakes.' },
    { name: 'Eruption', text: 'The pressure is too much! Magma and gas blast out of the crater with a bang, and ash and glowing rocks are thrown into the air.',
      clue: 'With a bang, ash and glowing rocks are blasted out of the crater.' },
    { name: 'Lava flows', text: 'Runny lava pours down the sides of the volcano, red-hot, while ash falls from the sky like dark snow.',
      clue: 'Red-hot lava runs down the sides of the volcano.' },
    { name: 'Calm again', text: 'The lava cools and turns into hard rock. Plants grow back, and the ash makes the soil very rich.',
      clue: 'The lava has turned to hard rock and green plants are growing back.' }
  ];
  // What each step looks like: how full the vent is, the glow of the chamber, ash, flying rocks, how far the lava has gone, how
  // cool it is, plants, how dark the sky is and how much the mountain shakes.
  var LOOK = [
    { rise: 0, glow: 0.6, plume: 0, bombs: 0, flow: 0, cool: 0, plants: 0, dark: 0, shake: 0 },
    { rise: 1, glow: 1, plume: 0, bombs: 0, flow: 0, cool: 0, plants: 0, dark: 0.1, shake: 1.6 },
    { rise: 1, glow: 1, plume: 1, bombs: 1, flow: 0.12, cool: 0, plants: 0, dark: 0.9, shake: 3.4 },
    { rise: 0.85, glow: 1, plume: 0.8, bombs: 0, flow: 1, cool: 0, plants: 0, dark: 0.7, shake: 1 },
    { rise: 0, glow: 0.2, plume: 0, bombs: 0, flow: 1, cool: 1, plants: 1, dark: 0, shake: 0 }
  ];
  var CALM = { rise: 1, glow: 1, plume: 0.4, bombs: 0, flow: 0.75, cool: 0, plants: 0, dark: 0.1, shake: 0 };

  // ---- The picture ----
  var CONDUIT = 'M191 108 L209 108 L211 266 L189 266Z';
  var FLOW_R = 'M214 104 L236 108 L292 190 L324 233 L352 238 L388 240', FLOW_L = 'M186 104 L170 112 L128 172 L96 222 L74 238 L50 240';
  var PUFFS = [[0, -18, 17], [-20, -40, 20], [18, -42, 20], [-34, -70, 22], [6, -76, 24], [38, -68, 21], [-14, -104, 22], [26, -106, 22], [-48, -98, 19], [50, -96, 19], [0, -130, 20], [-30, -128, 17], [32, -128, 17]];
  function svgText(labels) {
    var out = '', i;
    // lines from names to what they name
    var L = [['Crater', 108, 66, 188, 100], ['Vent', 86, 176, 189, 176], ['Magma chamber', 330, 292, 262, 292], ['Lava', 352, 214, 318, 222], ['Ash cloud', 318, 36, 262, 44], ['Crust', 46, 270, 46, 270]];
    if (!labels) return '';
    L.forEach(function (l, k) {
      if (k < 5) out += '<line class="pt" x1="' + l[3] + '" y1="' + l[4] + '" x2="' + (l[1] + (l[3] > l[1] ? 14 : -14)) + '" y2="' + l[2] + '"/>';
      out += '<text class="pn" x="' + l[1] + '" y="' + l[2] + '" text-anchor="middle">' + l[0] + '</text>';
    });
    return out;
  }
  function volcanoSvg(labels) {
    var i, s = '<defs>'
      + '<linearGradient id="vkSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f5"/><stop offset="1" stop-color="#d9f0fb"/></linearGradient>'
      + '<radialGradient id="vkMagma" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffd23f"/><stop offset=".55" stop-color="#ff8a1f"/><stop offset="1" stop-color="#e03a12"/></radialGradient>'
      + '<radialGradient id="vkGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb347" stop-opacity=".95"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="vkAsh" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#8a8592"/><stop offset="1" stop-color="#3f3b47"/></radialGradient>'
      + '<clipPath id="vkMag"><path d="' + CONDUIT + '"/><ellipse cx="200" cy="290" rx="60" ry="25"/></clipPath>'
      + '<clipPath id="vkVent"><path d="' + CONDUIT + '"/></clipPath>'
      + '<clipPath id="vkCham"><ellipse cx="200" cy="290" rx="60" ry="25"/></clipPath></defs>';
    s += '<rect width="400" height="320" fill="url(#vkSky)"/><circle class="sun" cx="338" cy="52" r="22" fill="#ffd54a"/><rect class="dark" width="400" height="320" fill="#241a2c" opacity="0"/>';
    s += '<g class="shake">'
      + '<rect x="0" y="235" width="400" height="85" fill="#8a6a4f"/><rect x="0" y="262" width="400" height="58" fill="#6b5142"/>'
      + '<path d="M0 262 H400 M0 244 q40 -6 80 0 t80 0 t80 0 t80 0 t80 0" stroke="#5a4333" stroke-width="2" fill="none" opacity=".6"/>'
      + '<path d="M70 235 L172 96 Q200 112 228 96 L330 235Z" fill="#7d6b5f"/><path d="M200 112 L228 96 L330 235 H215Z" fill="#6a5a50" opacity=".75"/>'
      + '<path d="M92 205 L308 205 M120 168 L280 168 M150 132 L250 132" stroke="#5f4f45" stroke-width="2" opacity=".5"/>'
      + '<path d="' + CONDUIT + '" fill="#4a3a33"/>'
      + '<ellipse class="gl" cx="200" cy="290" rx="95" ry="48" fill="url(#vkGlow)" opacity=".6"/>'
      + '<ellipse cx="200" cy="290" rx="60" ry="25" fill="#4a3a33"/>'
      + '<g clip-path="url(#vkMag)"><rect class="rise" x="130" y="108" width="140" height="230" fill="url(#vkMagma)"/>'
      + '<g clip-path="url(#vkCham)">' + [0, 1, 2, 3, 4, 5, 6].map(function (k) { return '<circle class="bub" cx="' + (166 + k * 11.5) + '" cy="306" r="' + (3 + (k % 3)) + '" fill="#ffe29a" opacity=".85"/>'; }).join('') + '</g>'
      + '<g class="vb" clip-path="url(#vkVent)">' + [0, 1, 2, 3, 4].map(function (k) { return '<circle class="vbub" cx="' + (194 + (k % 3) * 6) + '" cy="266" r="2.6" fill="#ffe29a"/>'; }).join('') + '</g></g>'
      + '<ellipse cx="200" cy="290" rx="60" ry="25" fill="none" stroke="#7a2a12" stroke-width="3"/>'
      + '<ellipse cx="200" cy="102" rx="20" ry="7" fill="#2f2420"/>'
      + '<path class="flow" d="' + FLOW_R + '" fill="none" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path class="flow" d="' + FLOW_L + '" fill="none" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<path class="core" d="' + FLOW_R + '" fill="none" stroke="#ffd36a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path class="core" d="' + FLOW_L + '" fill="none" stroke="#ffd36a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'
      + [40, 78, 112, 288, 322, 360].map(function (x, k) { return '<g transform="translate(' + x + ' 236)"><g class="plant"><path d="M-9 0 Q-9 -14 -3 -22 Q0 -12 0 0Z M0 0 Q0 -16 8 -26 Q10 -12 9 0Z" fill="#4caf50"/><path d="M0 0 V-10" stroke="#2e7d32" stroke-width="2"/>' + (k % 2 ? '<circle cx="8" cy="-27" r="3.2" fill="#ff6b6b"/>' : '') + '</g></g>'; }).join('')
      + '</g>';
    s += '<g class="vhl">'
      + '<ellipse class="hl" data-part="crater" cx="200" cy="102" rx="40" ry="15"/>'
      + '<rect class="hl" data-part="vent" x="183" y="106" width="34" height="162" rx="9"/>'
      + '<ellipse class="hl" data-part="chamber" cx="200" cy="290" rx="72" ry="33"/>'
      + '<path class="hl lv" data-part="lava" d="' + FLOW_R + '"/><path class="hl lv" data-part="lava" d="' + FLOW_L + '"/>'
      + '<ellipse class="hl" data-part="ash" cx="200" cy="30" rx="100" ry="58"/>'
      + '<rect class="hl" data-part="crust" x="3" y="238" width="394" height="79" rx="6"/></g>';
    s += '<g class="ashfall">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (k) { return '<circle class="fall" cx="' + (24 + k * 32 + (k % 3) * 7) + '" cy="40" r="' + (1.6 + (k % 3) * 0.5) + '" fill="#4a4550"/>'; }).join('') + '</g>';
    s += '<g class="bombs" transform="translate(200 100)">' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function () { return '<circle class="bomb" r="4.5" fill="#ff7a1c" stroke="#ffd36a" stroke-width="1.5"/>'; }).join('') + '</g>';
    s += '<g class="plumeWrap" transform="translate(200 100) scale(0.001)"><g class="plume">'
      + PUFFS.map(function (p) { return '<circle class="puff" cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="url(#vkAsh)"/>'; }).join('') + '</g></g>';
    s += '<circle class="flash" cx="200" cy="98" r="30" fill="url(#vkGlow)" opacity="0"/>';
    s += svgText(labels);
    if (labels) s += '<text class="stepname" x="14" y="26"></text>';
    return s;
  }

  // ---- Mounting ----
  function mount(host, opts) {
    var labels = !!opts.labels, svg = document.createElementNS(NS, 'svg'), anims = [], token = 0, dead = false, raf = 0, mode = null, flowLen = [];
    var st = { rise: 0, glow: 0.6, plume: 0, bombs: 0, flow: 0, cool: 0, plants: 0, dark: 0, shake: 0 }, from = null, stepNow = -1;
    svg.setAttribute('class', 'scene volcano'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.setProperty('--ar', (W / H).toFixed(3));
    if (labels) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'A volcano'); } else svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = volcanoSvg(labels);
    host.textContent = ''; host.appendChild(svg);
    var q = function (sel) { return svg.querySelectorAll(sel); }, one = function (sel) { return svg.querySelector(sel); };
    q('.flow').forEach(function (p, i) { flowLen[i] = p.getTotalLength(); });
    var mix = function (a, b, t) { return Math.round(a + (b - a) * t); };

    function render() {
      raf = 0;
      if (dead) return;
      var cool = st.cool, hot = [255, 106, 26], cold = [74, 64, 64], col = 'rgb(' + mix(hot[0], cold[0], cool) + ',' + mix(hot[1], cold[1], cool) + ',' + mix(hot[2], cold[2], cool) + ')';
      one('.rise').style.transform = 'translateY(' + ((1 - st.rise) * 160).toFixed(1) + 'px)';
      one('.gl').setAttribute('opacity', (st.glow * 0.9).toFixed(2));
      one('.vb').setAttribute('opacity', (st.rise * st.rise).toFixed(2));
      one('.dark').setAttribute('opacity', (st.dark * 0.55).toFixed(2));
      one('.sun').setAttribute('opacity', (1 - st.dark).toFixed(2));
      var pk = st.plume, wrap = one('.plumeWrap');
      wrap.setAttribute('transform', 'translate(200 100) scale(' + Math.max(0.001, 0.2 + 0.42 * pk).toFixed(3) + ')'); wrap.setAttribute('opacity', pk.toFixed(2));
      one('.ashfall').setAttribute('opacity', Math.min(1, pk * 1.2).toFixed(2));
      one('.bombs').setAttribute('opacity', st.bombs.toFixed(2));
      one('.flash').setAttribute('opacity', (st.bombs * 0.55).toFixed(2));
      q('.flow').forEach(function (p, i) { p.setAttribute('stroke', col); p.style.strokeDasharray = flowLen[i]; p.style.strokeDashoffset = (flowLen[i] * (1 - st.flow)).toFixed(1); });
      q('.core').forEach(function (p, i) { p.style.strokeDasharray = flowLen[i]; p.style.strokeDashoffset = (flowLen[i] * (1 - st.flow)).toFixed(1); p.setAttribute('opacity', (1 - cool).toFixed(2)); });
      q('.plant').forEach(function (g) { g.style.transform = 'scale(' + Math.max(0.001, st.plants).toFixed(3) + ')'; });
      var t = performance.now() / 1000, a = st.shake;
      one('.shake').setAttribute('transform', 'translate(' + (Math.sin(t * 61) * a).toFixed(2) + ' ' + (Math.cos(t * 47) * a * 0.6).toFixed(2) + ')');
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(render); }

    function ambient(a) {
      var o = [], go = function (sel, props) { var els = q(sel); if (els.length) o.push(a.animate(els, Object.assign({ loop: true, onUpdate: schedule }, props))); };
      go('.gl', { scale: [1, 1.08], duration: 1100, alternate: true, ease: 'inOutSine' });
      go('.bub', { translateY: [0, -44], opacity: [0, 0.9, 0], duration: 1700, delay: a.stagger(230), ease: 'linear' });
      go('.vbub', { translateY: [0, -150], opacity: [0, 1, 0.6], duration: 1100, delay: a.stagger(220), ease: 'linear' });
      go('.puff', { scale: [0.92, 1.14], translateY: [0, -4], duration: 1500, alternate: true, delay: a.stagger(110), ease: 'inOutSine' });
      go('.fall', { translateY: [0, 190], opacity: [0, 1, 1, 0], duration: 2400, delay: a.stagger(170), ease: 'linear' });
      go('.hl', { opacity: [0.35, 1], duration: 650, alternate: true, ease: 'inOutSine' });
      q('.bomb').forEach(function (el, i) {
        o.push(a.animate(el, {
          translateX: (i % 2 ? 1 : -1) * (16 + i * 7),
          translateY: [{ to: -(70 + (i * 17) % 60), duration: 700, ease: 'outQuad' }, { to: 70, duration: 800, ease: 'inQuad' }],
          opacity: [{ to: 1, duration: 1300 }, { to: 0, duration: 200 }],
          duration: 1500, loop: true, delay: i * 160, ease: 'linear', onUpdate: schedule
        }));
      });
      return o;
    }
    function tween(a, to, ms) {
      anims = anims.filter(function (x) { if (x.__tw) { x.pause(); return false; } return true; });
      var tw = a.animate(st, Object.assign({ duration: ms, ease: 'inOutCubic', onUpdate: schedule }, to));
      tw.__tw = true; anims.push(tw);
    }
    function setLook(a, look, ms) { if (!a || reduce.matches) { Object.keys(look).forEach(function (k) { st[k] = look[k]; }); render(); } else tween(a, look, ms); }

    function outline(part) {
      q('.hl').forEach(function (e) { var on = e.dataset.part === part; e.classList.toggle('on', on); });
    }
    function name(text) { var t = one('.stepname'); if (t) t.textContent = text || ''; }
    function show(view) {
      var m = view.mode, at = view.at === undefined || view.at === null ? -1 : view.at, t = ++token;
      mode = m;
      anims.forEach(function (x) { x.pause(); }); anims = [];
      var look = m === 'parts' ? CALM : at >= 0 ? LOOK[at] : LOOK[0];
      outline(m === 'parts' && at >= 0 ? PARTS[at].id : null);
      name(m === 'erupt' && at >= 0 ? (at + 1) + '. ' + STEPS[at].name : '');
      if (reduce.matches) { setLook(null, look, 0); return; }
      load().then(function (a) {
        if (!a || dead || t !== token) return;
        anims = ambient(a);
        setLook(a, look, m === 'erupt' && at === 2 ? 700 : 1500);
        // with names on, an eruption that is not stopped goes through its steps one after another
        if (labels && m === 'erupt' && at < 0) {
          var clock = { k: 0 }; stepNow = -1;
          anims.push(a.animate(clock, { k: [0, 5], duration: 5 * 4200, loop: true, ease: 'linear', onUpdate: function () {
            var i = Math.min(4, Math.floor(clock.k));
            if (i !== stepNow && t === token) { stepNow = i; name((i + 1) + '. ' + STEPS[i].name); tween(a, LOOK[i], i === 2 ? 700 : 1500); }
          } }));
        }
      });
    }
    return { show: show, stop: function () { dead = true; token++; anims.forEach(function (x) { x.pause(); }); cancelAnimationFrame(raf); svg.remove(); } };
  }
  S.scenes.volcano = mount;

  // ---- The watch screen ----
  var tabInfo = S.tabInfo, esc = S.esc;
  S.kinds.volcano = {
    title: 'Watch a volcano erupt',
    tabs: [{ id: 'erupt', pic: '💥', label: 'Eruption' }, { id: 'parts', pic: '🌋', label: 'Parts of a volcano' }],
    intro: tabInfo('🌋', 'Inside a volcano', 'Watch a volcano erupt, step by step, or look at its parts. Pick a step or a part to stop there.'),
    view: function (id) { return { mode: id }; },
    info: function (id, at) {
      if (at === undefined || at === null) {
        return id === 'erupt' ? tabInfo('💥', 'An eruption', 'It happens in five steps: magma builds up, rises, the volcano erupts, lava flows and everything calms down again.')
          : tabInfo('🌋', 'The parts of a volcano', 'Under the volcano is the crust. The magma collects in the magma chamber, rises up the vent and comes out of the crater as lava, ash and gas.');
      }
      return id === 'erupt' ? tabInfo('💥', (at + 1) + '. ' + STEPS[at].name, esc(STEPS[at].text)) : tabInfo('🌋', PARTS[at].name, esc(PARTS[at].text));
    },
    picks: function (id) {
      return id === 'erupt' ? [{ id: null, label: '▶ Keep going' }].concat(STEPS.map(function (s, k) { return { id: k, label: s.name }; }))
        : [{ id: null, label: 'All' }].concat(PARTS.map(function (p, k) { return { id: k, label: p.name }; }));
    }
  };

  // ---- Questions ----
  var ask = S.ask, shuffle = S.shuffle;
  function partQuestions() {
    var names = PARTS.map(function (p) { return p.name; }), out = [];
    PARTS.forEach(function (p, i) {
      var rest = shuffle(names.filter(function (n) { return n !== p.name; })).slice(0, 3), note = p.name + ': ' + p.text;
      out.push(ask(p.name, 'Which part of the volcano is lit up?', p.name, rest, note, { mode: 'parts', at: i }));
      out.push(ask(p.name + ' clue', p.clue + ' What is it called?', p.name, rest, note, { mode: 'parts' }));
    });
    return out;
  }
  function stepQuestions() {
    var names = STEPS.map(function (s) { return s.name; }), out = [], n = STEPS.length;
    STEPS.forEach(function (s, i) {
      var rest = shuffle(names.filter(function (x) { return x !== s.name; })).slice(0, 3), note = s.name + ': ' + s.text;
      out.push(ask(s.name, 'Which step of an eruption is this?', s.name, rest, note, { mode: 'erupt', at: i }));
      out.push(ask(s.name + ' clue', s.clue + ' Which step is this?', s.name, rest, note, { mode: 'erupt' }));
      if (i < n - 1) out.push(ask('After ' + s.name, 'What comes right after "' + s.name.toLowerCase() + '"?', STEPS[i + 1].name, shuffle(names.filter(function (x) { return x !== STEPS[i + 1].name; })).slice(0, 3),
        s.name + ' comes before ' + STEPS[i + 1].name.toLowerCase() + '. ' + STEPS[i + 1].text, { mode: 'erupt', at: i }));
      if (i > 0) out.push(ask('Before ' + s.name, 'What comes right before "' + s.name.toLowerCase() + '"?', STEPS[i - 1].name, shuffle(names.filter(function (x) { return x !== STEPS[i - 1].name; })).slice(0, 3),
        STEPS[i - 1].name + ' comes before ' + s.name.toLowerCase() + '. ' + s.text, { mode: 'erupt', at: i }));
    });
    return out;
  }
  var FACTS = [
    ['Magma', 'What do we call melted rock inside the Earth?', 'Magma', ['Lava', 'Ash', 'Mud'], 'Melted rock under the ground is magma. When it comes out of a volcano, it is called lava.', { mode: 'parts' }],
    ['Lava', 'What do we call melted rock after it comes out of a volcano?', 'Lava', ['Magma', 'Ash', 'Crust'], 'Magma that reaches the surface is called lava.', { mode: 'erupt' }],
    ['Ash', 'What is volcanic ash made of?', 'Tiny pieces of rock', ['Burnt wood', 'Snow', 'Beach sand'], 'Ash is not like the ash of a fire. It is rock that was blown into tiny pieces.', { mode: 'erupt', at: 2 }],
    ['Fertile soil', 'Why is the soil near a volcano good for farming?', 'The ash makes it rich', ['It is always wet', 'It is very cold', 'It is full of salt'], 'Ash has minerals that plants love, which is why many farms and rice fields are on the slopes of volcanoes.', { mode: 'erupt', at: 4 }],
    ['Warnings', 'What can warn people that a volcano may erupt soon?', 'Small earthquakes and smoke', ['Strong winds', 'A rainbow', 'Cold weather'], 'Scientists watch for small earthquakes, swelling ground and gas, so that people can leave in time.', { mode: 'erupt', at: 1 }],
    ['Ring of Fire', 'Why does Indonesia have so many volcanoes?', 'It lies on the Ring of Fire', ['It is very hot', 'It has many rivers', 'It is a big country'], 'Indonesia has more than 120 active volcanoes because it lies where the plates of the Earth\'s crust meet, in the Ring of Fire.', { mode: 'parts' }],
    ['Krakatoa', 'Which volcano in Indonesia erupted in 1883 with a bang heard thousands of kilometres away?', 'Krakatoa', ['Mount Bromo', 'Mount Merapi', 'Mount Rinjani'], 'Krakatoa erupted in 1883 and was one of the loudest sounds in history.', { mode: 'erupt' }],
    ['Cooling lava', 'What happens to lava when it cools?', 'It turns into hard rock', ['It turns into water', 'It turns into soft soil at once', 'It disappears'], 'Cooled lava becomes hard rock. After a long time it slowly turns into soil.', { mode: 'erupt', at: 4 }]
  ].map(function (f) { return ask(f[0], f[1], f[2], f[3], f[4], f[5]); });

  S.questions['ve.parts'] = function () { return partQuestions(); };
  S.questions['ve.erupt'] = function () { return stepQuestions(); };
  S.questions['ve.facts'] = function () { return FACTS.slice(); };
  S.questions['ve.all'] = function () { return partQuestions().concat(stepQuestions(), FACTS); };
})();
