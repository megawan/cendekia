// Children's profiles, shared by every Cendekia app (they all live on the same origin, so they share localStorage).
//
//   Cendekia.key('baca.v1')        the storage key of the current child for an app's progress
//   Cendekia.chip(element)         shows the current child and lets the child switch
//   Cendekia.round({...})          records a finished round (time, stars, right answers) for the parent page
//   Cendekia.weak(app, label)      counts one wrong first answer on an item, for the parent page
//   Cendekia.gate()                false, and a message, when the child's daily time limit is used up
//   Cendekia.select(id)            makes another child the current one (for apps with their own child picker)
//
// Everything stays in this browser. The first time the script runs it creates one child, "Anak 1", and copies the
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
    var p = { id: newId(), name: String(name || '').trim().slice(0, 16) || 'Anak ' + (data.list.length + 1), avatar: avatar || AVATARS[data.list.length % AVATARS.length], limit: 0 };
    data.list.push(p);
    save(PROFILES, data);
    return p;
  }
  if (!data.list.length) {
    var first = add('Anak 1', AVATARS[0]);
    data.cur = first.id; save(PROFILES, data);
    // Progress saved before profiles existed becomes this child's.
    APP_KEYS.forEach(function (base) { var old = get(base); if (old !== null) set(base + '.' + first.id, old); });
  }
  if (!data.list.some(function (p) { return p.id === data.cur; })) { data.cur = data.list[0].id; save(PROFILES, data); }

  function current() { return data.list.filter(function (p) { return p.id === data.cur; })[0]; }
  function find(id) { return data.list.filter(function (p) { return p.id === id; })[0]; }
  var logKey = function (id) { return 'cendekia.log.v1.' + id; };
  var weakKey = function (id) { return 'cendekia.weak.v1.' + id; };

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
      '.cd-chip{display:inline-flex;align-items:center;gap:6px;font:inherit;font-weight:700;color:inherit;background:rgba(255,255,255,.85);border:2px solid rgba(0,0,0,.12);border-radius:999px;padding:4px 12px 4px 6px;cursor:pointer;min-height:44px}' +
      '.cd-chip .cd-av{font-size:1.5rem;line-height:1}' +
      '.cd-modal{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(20,24,40,.55);font-family:inherit;color:#1f2a44}' +
      '.cd-card{background:#fff;border-radius:20px;padding:18px;width:min(420px,100%);max-height:90vh;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.3)}' +
      '.cd-card h2{margin:0 0 10px;font-size:1.4rem;line-height:1.2;text-align:center;white-space:normal}' +
      '.cd-card p{margin:6px 0;text-align:center}' +
      '.cd-list{display:grid;gap:8px;margin-bottom:10px}' +
      '.cd-kid,.cd-btn{font:inherit;font-weight:700;font-size:1.1rem;color:inherit;background:#f4f6fb;border:2px solid #d9e0ee;border-radius:16px;padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;min-height:52px;width:100%}' +
      '.cd-kid.on{border-color:#2e90fa;background:#e6f1ff}' +
      '.cd-kid .cd-av{font-size:1.8rem;line-height:1}' +
      '.cd-btn{justify-content:center}' +
      '.cd-btn.main{background:#2e90fa;border-color:#1b6fd1;color:#fff}' +
      '.cd-card input[type=text]{font:inherit;font-size:1.2rem;width:100%;padding:10px 12px;border:2px solid #d9e0ee;border-radius:14px;margin:6px 0}' +
      '.cd-avs{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0 10px}' +
      '.cd-avs button{font-size:1.7rem;line-height:1;background:#f4f6fb;border:2px solid #d9e0ee;border-radius:14px;width:48px;height:48px;cursor:pointer}' +
      '.cd-avs button.on{border-color:#2e90fa;background:#e6f1ff}' +
      '.cd-row{display:flex;gap:8px;margin-top:8px}' +
      '.cd-big{font-size:3.5rem;text-align:center;line-height:1.1}';
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
      card.setAttribute('aria-label', 'Pilih anak');
      card.appendChild(el('h2', '', 'Siapa yang belajar?'));
      var list = el('div', 'cd-list'); card.appendChild(list);
      data.list.forEach(function (p) {
        var b = el('button', 'cd-kid' + (p.id === data.cur ? ' on' : '')); b.type = 'button';
        b.appendChild(el('span', 'cd-av', p.avatar)); b.appendChild(el('span', '', p.name));
        b.addEventListener('click', function () { if (p.id !== data.cur) { data.cur = p.id; save(PROFILES, data); location.reload(); } else close(); });
        list.appendChild(b);
      });
      var addBtn = el('button', 'cd-btn', '＋ Tambah anak'); addBtn.type = 'button'; card.appendChild(addBtn);
      var form = el('div'); form.hidden = true; card.appendChild(form);
      var name = el('input'); name.type = 'text'; name.maxLength = 16; name.placeholder = 'Nama anak'; name.setAttribute('aria-label', 'Nama anak');
      var chosen = AVATARS[data.list.length % AVATARS.length];
      var avs = el('div', 'cd-avs');
      AVATARS.forEach(function (a) {
        var b = el('button', a === chosen ? 'on' : '', a); b.type = 'button'; b.setAttribute('aria-label', 'Gambar ' + a);
        b.addEventListener('click', function () { chosen = a; Array.prototype.forEach.call(avs.children, function (x) { x.classList.toggle('on', x === b); }); });
        avs.appendChild(b);
      });
      var row = el('div', 'cd-row');
      var ok = el('button', 'cd-btn main', 'Simpan'); ok.type = 'button';
      var no = el('button', 'cd-btn', 'Batal'); no.type = 'button';
      row.append(ok, no); form.append(name, avs, row);
      addBtn.addEventListener('click', function () { addBtn.hidden = true; form.hidden = false; name.focus(); });
      no.addEventListener('click', function () { form.hidden = true; addBtn.hidden = false; });
      ok.addEventListener('click', function () {
        if (!name.value.trim()) { name.focus(); return; }
        var p = add(name.value, chosen); data.cur = p.id; save(PROFILES, data); location.reload();
      });
      var shut = el('button', 'cd-btn', 'Tutup'); shut.type = 'button'; shut.style.marginTop = '10px';
      shut.addEventListener('click', close); card.appendChild(shut);
    });
  }
  // Shows the current child; tapping it opens the picker.
  function chip(target) {
    style();
    var p = current();
    target.innerHTML = '';
    var b = el('button', 'cd-chip'); b.type = 'button';
    b.setAttribute('aria-label', 'Yang belajar: ' + p.name + '. Ketuk untuk mengganti anak.');
    b.appendChild(el('span', 'cd-av', p.avatar)); b.appendChild(el('span', '', p.name)); b.appendChild(el('span', '', '▾'));
    b.lastChild.setAttribute('aria-hidden', 'true');
    b.addEventListener('click', picker);
    target.appendChild(b);
  }

  // Returns false, and says so, when the child has used up the daily time the parent set.
  function gate() {
    var p = current();
    if (!p || !(p.limit > 0) || minutesOn(p.id, dayStr(new Date())) < p.limit) return true;
    modal(function (card, close) {
      card.appendChild(el('div', 'cd-big', '🌙'));
      card.appendChild(el('h2', '', 'Waktu bermain hari ini sudah habis'));
      card.appendChild(el('p', '', 'Sampai jumpa besok, ' + p.name + '!'));
      var b = el('button', 'cd-btn main', 'Tutup'); b.type = 'button'; b.addEventListener('click', close); card.appendChild(b);
    });
    return false;
  }

  // ---- For the parent page ----
  function remove(id) {
    data.list = data.list.filter(function (p) { return p.id !== id; });
    var suffix = '.' + id;
    try {
      Object.keys(localStorage).forEach(function (k) { if (k.slice(-suffix.length) === suffix && /^(baca|phonics|kosakata|hijaiyah|logika|cendekia)\./.test(k)) del(k); });
    } catch (e) { /* private mode */ }
    if (!data.list.length) { var p = add('Anak 1', AVATARS[0]); data.cur = p.id; } else if (data.cur === id) data.cur = data.list[0].id;
    save(PROFILES, data);
  }

  window.Cendekia = {
    AVATARS: AVATARS,
    profile: function () { return current(); },
    profiles: function () { return data.list.slice(); },
    key: function (base) { return base + '.' + data.cur; },
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
