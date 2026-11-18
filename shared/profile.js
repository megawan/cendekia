// Children's profiles, shared by every Cendekia app (they all live on the same origin, so they share localStorage).
//
//   Cendekia.key('baca.v1')        the storage key of the current child for an app's progress
//   Cendekia.chip(element)         shows the current child and lets the child switch
//   Cendekia.round({...})          records a finished round (time, stars, right answers) for the parent page
//   Cendekia.weak(app, label)      counts one wrong first answer on an item, for the parent page
//   Cendekia.gate()                false, and a message, when the child's daily time limit is used up
//   Cendekia.select(id)            makes another child the current one (for apps with their own child picker)
//   Cendekia.calm()                true when animation should be off (the device asks for it, or Accessibility has "Calm")
//   Cendekia.access()              opens the Accessibility panel (text size, contrast, readable letters, calm)
//
// Everything stays in this browser. The first time the script runs it creates one child, "Child 1", and copies the
// progress the apps saved before profiles existed into it, so nothing is lost.
(function () {
  'use strict';

  var PROFILES = 'cendekia.profiles.v1';
  var APP_KEYS = ['baca.v1', 'phonics.v1', 'kosakata.v1', 'hijaiyah.progress.v1', 'hijaiyah.stars.v1']; // saved per child
  var AVATARS = ['🦁', '🐯', '🐼', '🐨', '🦊', '🐸', '🐵', '🐰', '🦄', '🐙', '🐢', '🦋'];
  var LOG_MAX = 600;

  // ---- Storage (falls back to memory when the browser refuses to store) ----
  var memory = {};
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return memory[k] === undefined ? null : memory[k]; } }
  function set(k, v) { memory[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  function del(k) { delete memory[k]; try { localStorage.removeItem(k); } catch (e) { /* private mode */ } }
  function load(k, fallback) { try { var v = JSON.parse(get(k)); return v === null || v === undefined ? fallback : v; } catch (e) { return fallback; } }
  function save(k, v) { set(k, JSON.stringify(v)); }

  var data = load(PROFILES, null);
  if (!data || !Array.isArray(data.list)) data = { list: [], cur: null };
  function newId() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function add(name, avatar) {
    var p = { id: newId(), name: String(name || '').trim().slice(0, 16) || 'Child ' + (data.list.length + 1), avatar: avatar || AVATARS[data.list.length % AVATARS.length], limit: 0 };
    data.list.push(p);
    save(PROFILES, data);
    return p;
  }
  if (!data.list.length) {
    var first = add('Child 1', AVATARS[0]);
    data.cur = first.id; save(PROFILES, data);
    // Progress saved before profiles existed becomes this child's.
    APP_KEYS.forEach(function (base) { var old = get(base); if (old !== null) set(base + '.' + first.id, old); });
  }
  // Children who still have the old Indonesian default name ("Anak 2") get the English one ("Child 2").
  if (data.list.some(function (p) { return /^Anak \d+$/.test(p.name); })) {
    data.list.forEach(function (p) { p.name = p.name.replace(/^Anak (\d+)$/, 'Child $1'); });
    save(PROFILES, data);
  }
  if (!data.list.some(function (p) { return p.id === data.cur; })) { data.cur = data.list[0].id; save(PROFILES, data); }

  function current() { return data.list.filter(function (p) { return p.id === data.cur; })[0]; }
  function find(id) { return data.list.filter(function (p) { return p.id === id; })[0]; }
  var logKey = function (id) { return 'cendekia.log.v1.' + id; };
  var weakKey = function (id) { return 'cendekia.weak.v1.' + id; };

  // ---- Accessibility ----
  // Settings belong to the device, not to a child, and are applied as data-a11y-* attributes on <html>.
  var A11Y = 'cendekia.a11y.v1';
  var access = load(A11Y, {});
  function applyAccess() {
    var root = document.documentElement;
    ['size', 'contrast', 'font', 'calm'].forEach(function (k) {
      if (access[k]) root.setAttribute('data-a11y-' + k, access[k]); else root.removeAttribute('data-a11y-' + k);
    });
  }
  applyAccess();
  var reducedQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function calm() { return access.calm === 'on' || reducedQuery.matches; }
  var accessCss =
    'html[data-a11y-size="large"]{font-size:118%}html[data-a11y-size="xl"]{font-size:136%}' +
    'html[data-a11y-font="clear"],html[data-a11y-font="clear"] body,html[data-a11y-font="clear"] button,html[data-a11y-font="clear"] input,html[data-a11y-font="clear"] select,html[data-a11y-font="clear"] textarea{font-family:Verdana,"Atkinson Hyperlegible",system-ui,sans-serif!important;letter-spacing:.04em!important;word-spacing:.12em}' +
    'html[data-a11y-font="clear"] p,html[data-a11y-font="clear"] li{line-height:1.7}' +
    'html[data-a11y-contrast="high"]{--ink:#000;--arc-hair:rgba(0,0,0,.65);background-image:none!important}' +
    'html[data-a11y-contrast="high"] body{background:#fff!important;color:#000!important}' +
    'html[data-a11y-contrast="high"] .card,html[data-a11y-contrast="high"] .tile,html[data-a11y-contrast="high"] .tab,html[data-a11y-contrast="high"] .opt,html[data-a11y-contrast="high"] .btn,html[data-a11y-contrast="high"] .key,html[data-a11y-contrast="high"] .app,html[data-a11y-contrast="high"] .stage,html[data-a11y-contrast="high"] .mcard,html[data-a11y-contrast="high"] .fcard,html[data-a11y-contrast="high"] .pcard,html[data-a11y-contrast="high"] .bubble{border:2px solid #000!important}' +
    'html[data-a11y-contrast="high"] a{text-decoration:underline}' +
    'html[data-a11y-contrast="high"] :focus-visible{outline:4px solid #000!important;outline-offset:3px!important}' +
    'html[data-a11y-calm="on"] *,html[data-a11y-calm="on"] *::before,html[data-a11y-calm="on"] *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}';
  var accessStyled = false;
  function accessStyle() {
    if (accessStyled) return; accessStyled = true;
    var css = document.createElement('style'); css.textContent = accessCss; document.head.appendChild(css);
  }
  accessStyle();

  // ---- Days ----
  function dayStr(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function minutesOn(id, day) {
    return load(logKey(id), []).reduce(function (sum, e) { return sum + (dayStr(new Date(e.t)) === day ? (e.ms || 0) : 0); }, 0) / 60000;
  }

  // ---- Recording ----
  function round(e) {
    var p = current(); if (!p) return;
    var log = load(logKey(p.id), []);
    log.push({ t: Date.now(), app: e.app, stage: String(e.stage || '').slice(0, 40), stars: e.stars | 0, right: e.right | 0, total: e.total | 0, ms: Math.min(Math.max(e.ms | 0, 0), 20 * 60000) });
    if (log.length > LOG_MAX) log = log.slice(log.length - LOG_MAX);
    save(logKey(p.id), log);
  }
  function weak(app, label) {
    var p = current(); if (!p || !label) return;
    var w = load(weakKey(p.id), {});
    var k = app + '|' + String(label).slice(0, 40);
    w[k] = (w[k] || 0) + 1;
    save(weakKey(p.id), w);
  }

  // ---- Interface ----
  var styled = false;
  function style() {
    if (styled) return; styled = true;
    var css = document.createElement('style');
    css.textContent =
      '.cd-chip{display:inline-flex;align-items:center;gap:6px;font:inherit;font-weight:700;color:inherit;background:rgba(255,255,255,.75);border:1px solid rgba(28,32,56,.1);box-shadow:0 2px 6px -2px rgba(28,32,56,.14);border-radius:999px;padding:4px 12px 4px 6px;cursor:pointer;min-height:44px}' +
      '.cd-access{font:inherit;font-weight:800;color:inherit;background:rgba(255,255,255,.75);border:1px solid rgba(28,32,56,.1);box-shadow:0 2px 6px -2px rgba(28,32,56,.14);border-radius:999px;cursor:pointer;min-height:44px;min-width:44px}' +
      '.cd-chip .cd-av{font-size:1.5rem;line-height:1}' +
      '.cd-modal{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(20,24,40,.4);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-family:inherit;color:#1c2038}' +
      '.cd-card{background:#fff;border-radius:26px;padding:20px;width:min(420px,100%);max-height:90vh;overflow:auto;box-shadow:0 30px 60px -20px rgba(20,24,40,.45)}' +
      '.cd-card h2{margin:0 0 10px;font-size:1.4rem;line-height:1.2;text-align:center;white-space:normal}' +
      '.cd-card p{margin:6px 0;text-align:center}' +
      '.cd-list{display:grid;gap:8px;margin-bottom:10px}' +
      '.cd-kid,.cd-btn{font:inherit;font-weight:700;font-size:1.1rem;color:inherit;background:#fff;border:1px solid rgba(28,32,56,.1);border-radius:999px;padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;min-height:52px;width:100%}' +
      '.cd-kid.on{border-color:#2e90fa;background:#eaf3ff;box-shadow:0 0 0 3px rgba(46,144,250,.18)}' +
      '.cd-kid .cd-av{font-size:1.8rem;line-height:1}' +
      '.cd-btn{justify-content:center}' +
      '.cd-btn.main{background:linear-gradient(180deg,#5aa7ff,#2e90fa);border-color:transparent;color:#fff}' +
      '.cd-card input[type=text]{font:inherit;font-size:1.2rem;width:100%;padding:10px 12px;border:1px solid rgba(28,32,56,.14);border-radius:14px;margin:6px 0}' +
      '.cd-avs{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0 10px}' +
      '.cd-avs button{font-size:1.7rem;line-height:1;background:#fff;border:1px solid rgba(28,32,56,.1);border-radius:50%;width:48px;height:48px;cursor:pointer}' +
      '.cd-avs button.on{border-color:#2e90fa;background:#eaf3ff;box-shadow:0 0 0 3px rgba(46,144,250,.18)}' +
      '.cd-row{display:flex;gap:8px;margin-top:8px}' +
      '.cd-big{font-size:3.5rem;text-align:center;line-height:1.1}' +
      '.cd-opt-label{font-weight:800;margin:12px 0 4px!important;text-align:left!important}' +
      '.cd-seg{display:flex;flex-wrap:wrap;gap:6px}.cd-seg .cd-btn{flex:1 1 90px;width:auto;font-size:1rem;padding:8px 10px}' +
      '.cd-note{font-size:.9rem;opacity:.75}';
    document.head.appendChild(css);
  }
  function modal(build) {
    style();
    var back = document.createElement('div'); back.className = 'cd-modal'; back.setAttribute('role', 'dialog'); back.setAttribute('aria-modal', 'true');
    var card = document.createElement('div'); card.className = 'cd-card'; back.appendChild(card);
    function close() { document.removeEventListener('keydown', onKey); back.remove(); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    build(card, close);
    document.body.appendChild(back);
    var first = card.querySelector('button, input'); if (first) first.focus();
    return close;
  }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }

  function picker() {
    modal(function (card, close) {
      card.setAttribute('aria-label', 'Choose a child');
      card.appendChild(el('h2', '', 'Who is learning?'));
      var list = el('div', 'cd-list'); card.appendChild(list);
      data.list.forEach(function (p) {
        var b = el('button', 'cd-kid' + (p.id === data.cur ? ' on' : '')); b.type = 'button';
        b.appendChild(el('span', 'cd-av', p.avatar)); b.appendChild(el('span', '', p.name));
        b.addEventListener('click', function () { if (p.id !== data.cur) { data.cur = p.id; save(PROFILES, data); location.reload(); } else close(); });
        list.appendChild(b);
      });
      var addBtn = el('button', 'cd-btn', '＋ Add a child'); addBtn.type = 'button'; card.appendChild(addBtn);
      var form = el('div'); form.hidden = true; card.appendChild(form);
      var name = el('input'); name.type = 'text'; name.maxLength = 16; name.placeholder = 'Name'; name.setAttribute('aria-label', 'Child\'s name');
      var chosen = AVATARS[data.list.length % AVATARS.length];
      var avs = el('div', 'cd-avs');
      AVATARS.forEach(function (a) {
        var b = el('button', a === chosen ? 'on' : '', a); b.type = 'button'; b.setAttribute('aria-label', 'Picture ' + a);
        b.addEventListener('click', function () { chosen = a; Array.prototype.forEach.call(avs.children, function (x) { x.classList.toggle('on', x === b); }); });
        avs.appendChild(b);
      });
      var row = el('div', 'cd-row');
      var ok = el('button', 'cd-btn main', 'Save'); ok.type = 'button';
      var no = el('button', 'cd-btn', 'Cancel'); no.type = 'button';
      row.append(ok, no); form.append(name, avs, row);
      addBtn.addEventListener('click', function () { addBtn.hidden = true; form.hidden = false; name.focus(); });
      no.addEventListener('click', function () { form.hidden = true; addBtn.hidden = false; });
      ok.addEventListener('click', function () {
        if (!name.value.trim()) { name.focus(); return; }
        var p = add(name.value, chosen); data.cur = p.id; save(PROFILES, data); location.reload();
      });
      var shut = el('button', 'cd-btn', 'Close'); shut.type = 'button'; shut.style.marginTop = '10px';
      shut.addEventListener('click', close); card.appendChild(shut);
    });
  }
  // Shows the current child; tapping it opens the picker.
  function chip(target) {
    style();
    var p = current();
    target.innerHTML = '';
    var b = el('button', 'cd-chip'); b.type = 'button';
    b.setAttribute('aria-label', 'Learning now: ' + p.name + '. Tap to change the child.');
    b.appendChild(el('span', 'cd-av', p.avatar)); b.appendChild(el('span', '', p.name)); b.appendChild(el('span', '', '▾'));
    b.lastChild.setAttribute('aria-hidden', 'true');
    b.addEventListener('click', picker);
    target.appendChild(b);
    var a = el('button', 'cd-access', 'Aa'); a.type = 'button';
    a.setAttribute('aria-label', 'Accessibility settings');
    a.style.marginLeft = '8px';
    a.addEventListener('click', accessPanel);
    target.appendChild(a);
  }

  var ACCESS_OPTIONS = [
    { key: 'size', label: 'Text size', choices: [['', 'Normal'], ['large', 'Large'], ['xl', 'Extra large']] },
    { key: 'contrast', label: 'Colours', choices: [['', 'Normal'], ['high', 'High contrast']] },
    { key: 'font', label: 'Letters', choices: [['', 'Normal'], ['clear', 'Easy to read']] },
    { key: 'calm', label: 'Animations', choices: [['', 'Normal'], ['on', 'Calm (off)']] }
  ];
  function accessPanel() {
    modal(function (card, close) {
      card.setAttribute('aria-label', 'Accessibility');
      card.appendChild(el('h2', '', 'Accessibility'));
      ACCESS_OPTIONS.forEach(function (o) {
        var group = el('div'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', o.label);
        group.appendChild(el('p', 'cd-opt-label', o.label));
        var row = el('div', 'cd-seg');
        o.choices.forEach(function (c) {
          var b = el('button', 'cd-btn' + ((access[o.key] || '') === c[0] ? ' main' : ''), c[1]); b.type = 'button';
          b.setAttribute('aria-pressed', (access[o.key] || '') === c[0] ? 'true' : 'false');
          b.addEventListener('click', function () {
            if (c[0]) access[o.key] = c[0]; else delete access[o.key];
            save(A11Y, access); applyAccess();
            Array.prototype.forEach.call(row.children, function (x) { var on = x === b; x.classList.toggle('main', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
          });
          row.appendChild(b);
        });
        group.appendChild(row); card.appendChild(group);
      });
      card.appendChild(el('p', 'cd-note', 'These settings stay on this device and apply to every child.'));
      var shut = el('button', 'cd-btn', 'Close'); shut.type = 'button'; shut.style.marginTop = '10px';
      shut.addEventListener('click', close); card.appendChild(shut);
    });
  }

  // Returns false, and says so, when the child has used up the daily time the parent set.
  function gate() {
    var p = current();
    if (!p || !(p.limit > 0) || minutesOn(p.id, dayStr(new Date())) < p.limit) return true;
    modal(function (card, close) {
      card.appendChild(el('div', 'cd-big', '🌙'));
      card.appendChild(el('h2', '', 'That is all the play time for today'));
      card.appendChild(el('p', '', 'See you tomorrow, ' + p.name + '!'));
      var b = el('button', 'cd-btn main', 'Close'); b.type = 'button'; b.addEventListener('click', close); card.appendChild(b);
    });
    return false;
  }

  // ---- For the parent page ----
  function remove(id) {
    data.list = data.list.filter(function (p) { return p.id !== id; });
    var suffix = '.' + id;
    try {
      Object.keys(localStorage).forEach(function (k) { if (k.slice(-suffix.length) === suffix && /^(baca|phonics|kosakata|hijaiyah|logika|numeria|omnia|cendekia)\./.test(k)) del(k); });
    } catch (e) { /* private mode */ }
    if (!data.list.length) { var p = add('Child 1', AVATARS[0]); data.cur = p.id; } else if (data.cur === id) data.cur = data.list[0].id;
    save(PROFILES, data);
  }

  window.Cendekia = {
    AVATARS: AVATARS,
    profile: function () { return current(); },
    profiles: function () { return data.list.slice(); },
    key: function (base) { return base + '.' + data.cur; },
    calm: calm, access: accessPanel,
    chip: chip, gate: gate, round: round, weak: weak,
    select: function (id) { if (find(id)) { data.cur = id; save(PROFILES, data); } },
    add: function (name, avatar) { var p = add(name, avatar); save(PROFILES, data); return p; },
    update: function (id, fields) { var p = find(id); if (p) { Object.keys(fields).forEach(function (k) { p[k] = fields[k]; }); save(PROFILES, data); } },
    remove: remove,
    dayStr: dayStr,
    minutesOn: minutesOn,
    log: function (id) { return load(logKey(id), []); },
    weakItems: function (id) { return load(weakKey(id), {}); },
    state: function (base, id) { return load(base + '.' + id, null); }
  };
})();
