(() => {
  'use strict';
  const C = JSON.parse(document.getElementById('content').textContent);
  // Very hard and Extreme play the Hard levels with fewer blocks allowed (see startRobot): the maps are the same.
  const robotLevels = (id, diff) => C[id][diff] || C[id].hard;
  const $ = (id) => document.getElementById(id);
  const tx = Cendekia.t; // tx(English, Indonesian): the interface text in the page's language
  const IDL = Cendekia.lang === 'id';
  const SECTIONS = ['home', 'players', 'pform', 'world', 'robot', 'quiz', 'result', 'stickers', 'parents', 'maker'];
  let runToken = 0; // bumped whenever a screen changes, so running animations stop
  function show(id) {
    SECTIONS.forEach((s) => { $(s).hidden = s !== id; });
    runToken++; window.scrollTo(0, 0);
    if (id === 'home') renderHome();
    if (id === 'players') renderPlayers();
    if (id === 'world') renderWorld();
    if (id === 'stickers') renderStickers();
    if (id === 'maker') renderMaker();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) show(b.dataset.go);
  });

  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clone = (x) => JSON.parse(JSON.stringify(x));

  // ---- Poka ----
  const POKA = '<ellipse cx="50" cy="90" rx="26" ry="11" fill="#8a5329"/>'
    + '<g class="ear-l"><circle cx="21" cy="36" r="11" fill="#8a5329"/><circle cx="21" cy="36" r="5.5" fill="#e9b98a"/></g>'
    + '<g class="ear-r"><circle cx="79" cy="36" r="11" fill="#8a5329"/><circle cx="79" cy="36" r="5.5" fill="#e9b98a"/></g>'
    + '<ellipse cx="50" cy="58" rx="35" ry="32" fill="#b5733c"/>'
    + '<ellipse cx="50" cy="66" rx="21" ry="15" fill="#f0d3ac"/>'
    + '<rect x="44" y="66" width="12" height="11" rx="2.5" fill="#fff" stroke="#d9c3a6" stroke-width="1.5"/><path d="M50 66 V77" stroke="#d9c3a6" stroke-width="1.5"/>'
    + '<ellipse cx="50" cy="55" rx="7" ry="5" fill="#3b2a1a"/>'
    + '<circle class="eye" cx="36" cy="44" r="6"/><circle class="eye" cx="64" cy="44" r="6"/>'
    + '<path class="mouth m-happy" d="M42 63 Q50 68 58 63"/><path class="mouth m-cheer" d="M40 62 Q50 72 60 62"/><path class="mouth m-oops" d="M43 67 Q46.5 63 50 67 T57 67"/>'
    + '<path d="M26 32 Q50 2 74 32z" fill="#f2c230"/><rect x="22" y="30" width="56" height="7" rx="3.5" fill="#e3a91b"/>';
  const pokaSvg = (mood) => '<svg class="poka" data-mood="' + (mood || 'happy') + '" viewBox="0 0 100 100" aria-hidden="true">' + POKA + '</svg>';
  function fillPokas(root) { root.querySelectorAll('svg.poka:empty').forEach((s) => { s.innerHTML = POKA; Cendekia.fx.mascot(s); }); }
  fillPokas(document);

  // ---- Shapes, drawn as small SVGs ----
  const COLORS = { red: '#ef4444', blue: '#3b82f6', yellow: '#facc15', green: '#22c55e', purple: '#a855f7', gray: '#94a3b8' };
  const CK = ['red', 'blue', 'yellow', 'green', 'purple'];
  const SK = ['circle', 'square', 'triangle', 'star', 'heart'];
  // Names of the colors and shapes, for rules and labels.
  const CNAME = { red: 'merah', blue: 'biru', yellow: 'kuning', green: 'hijau', purple: 'ungu', gray: 'abu-abu' };
  const SNAME = { circle: 'lingkaran', square: 'persegi', triangle: 'segitiga', star: 'bintang', heart: 'hati', arrow: 'panah', diamond: 'belah ketupat' };
  const cName = (c) => (IDL && CNAME[c]) || c;
  const sName = (s) => (IDL && SNAME[s]) || s;
  const PATH = {
    circle: '<circle cx="50" cy="50" r="40"/>',
    square: '<rect x="12" y="12" width="76" height="76" rx="12"/>',
    triangle: '<path d="M50 10 L92 86 L8 86 Z" stroke-linejoin="round"/>',
    star: '<path d="M50 6 L62 36 L94 38 L69 59 L77 91 L50 73 L23 91 L31 59 L6 38 L38 36 Z" stroke-linejoin="round"/>',
    heart: '<path d="M50 90 C18 66 6 48 12 30 C18 12 42 10 50 28 C58 10 82 12 88 30 C94 48 82 66 50 90 Z"/>',
    arrow: '<path d="M50 6 L88 46 L64 46 L64 92 L36 92 L36 46 L12 46 Z" stroke-linejoin="round"/>',
    diamond: '<path d="M50 6 L90 50 L50 94 L10 50 Z" stroke-linejoin="round"/>'
  };
  // Dot layouts for 1 to 10, like dice.
  const DOTS = [[], [[50, 50]], [[30, 30], [70, 70]], [[26, 26], [50, 50], [74, 74]], [[30, 30], [70, 30], [30, 70], [70, 70]],
    [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], [[30, 24], [70, 24], [30, 50], [70, 50], [30, 76], [70, 76]],
    [[30, 24], [70, 24], [30, 50], [50, 50], [70, 50], [30, 76], [70, 76]],
    [[26, 24], [50, 24], [74, 24], [34, 50], [66, 50], [26, 76], [50, 76], [74, 76]],
    [[26, 24], [50, 24], [74, 24], [26, 50], [50, 50], [74, 50], [26, 76], [50, 76], [74, 76]],
    [[22, 22], [41, 22], [59, 22], [78, 22], [32, 50], [68, 50], [22, 78], [41, 78], [59, 78], [78, 78]]];
  const it = (s, c, extra) => Object.assign({ s, c }, extra);
  const key = (x) => [x.s, x.c, x.z || 1, x.r || 0, x.n || 0, x.v === undefined ? '' : x.v].join('|');
  function itemSvg(x) {
    const fill = COLORS[x.c] || x.c;
    let body;
    if (x.s === 'dots') {
      const r = x.n > 6 ? 8 : 10;
      body = '<rect x="6" y="6" width="88" height="88" rx="16" fill="#fff" stroke="' + fill + '" stroke-width="6"/>'
        + DOTS[x.n].map(([cx, cy]) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"/>').join('');
    } else if (x.s === 'number') {
      body = '<rect x="6" y="6" width="88" height="88" rx="18" fill="' + fill + '"/>'
        + '<text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-weight="800" font-size="' + (x.v > 9 ? 46 : 58) + '" fill="#fff">' + x.v + '</text>';
    } else {
      const z = x.z || 1, r = x.r || 0;
      body = '<g transform="translate(50 50) scale(' + z + ') rotate(' + r + ') translate(-50 -50)">'
        + '<g fill="' + fill + '" stroke="rgba(0,0,0,.18)" stroke-width="4">' + PATH[x.s] + '</g>'
        + (x.s === 'arrow' ? '' : '<ellipse cx="36" cy="32" rx="10" ry="6" fill="#fff" opacity=".35" transform="rotate(-30 36 32)"/>') + '</g>';
    }
    return '<svg class="it" viewBox="0 0 100 100" aria-hidden="true">' + body + '</svg>';
  }
  const arrowSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#arrowPath"/></svg>';

  // ---- Sound effects, made with the Web Audio API ----
  let ac = null;
  function audioCtx() {
    if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (A) ac = new A(); }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freqs, dur, type, vol) {
    const c = audioCtx(); if (!c) return;
    freqs.forEach((f, i) => {
      const t0 = c.currentTime + i * dur, o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(vol || 0.18, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur);
    });
  }
  const sfx = {
    good() { tone([660, 880], 0.12); }, bad() { tone([220], 0.25, 'triangle'); }, tap() { tone([520], 0.06); },
    win() { tone([523, 659, 784, 1047], 0.14); }, step() { tone([330 + Math.random() * 40], 0.07, 'square', 0.05); },
    bump() { tone([140, 90], 0.12, 'sawtooth', 0.12); }, gem() { tone([988, 1319, 1568], 0.07, 'triangle', 0.14); },
    whir() { tone([200, 260, 320, 260, 200], 0.09, 'sawtooth', 0.04); }, drop() { tone([700, 500], 0.08, 'sine', 0.1); }
  };
  const P = C.phrases;
  // Poka's phrases and the robot level names in Indonesian (the English ones are in the content above).
  const PHRASES_ID = {
    robot: 'Susun perintahnya, lalu tekan Jalankan. Bawa Poka ke bendera.',
    robotGem: 'Kumpulkan semua permata, lalu bawa Poka ke bendera.',
    robotLoop: 'Pakai balok ulang supaya programnya tetap pendek.',
    bump: 'Aduh, Poka menabrak sesuatu!',
    short: 'Poka belum sampai di bendera.',
    gems: 'Masih ada permata yang tersisa.',
    full: 'Tempat balok sudah penuh. Coba balok ulang.',
    debug: 'Satu perintah salah. Jalankan dulu, lalu ketuk perintah yang salah.',
    fix: 'Seharusnya apa?',
    next: 'Apa yang berikutnya?',
    missing: 'Apa yang hilang?',
    machine: 'Perhatikan mesinnya. Apa yang akan keluar?',
    heavier: 'Mana yang lebih berat?',
    lighter: 'Mana yang lebih ringan?',
    heaviest: 'Mana yang paling berat?',
    lightest: 'Mana yang paling ringan?',
    count: 'Berapa yang membuat timbangan seimbang?',
    again: 'Coba lagi.',
    robotFn: 'Buat fungsi ★ satu kali, lalu pakai ★ sebanyak yang kamu mau.',
    robotIf: 'Balok jika melihat petak: di petak kuning Poka memakai panah pertama, di tempat lain panah kedua.',
    noFnInFn: 'Fungsi tidak bisa memakai ★ di dalam dirinya sendiri.',
    noLoopInLoop: 'Balok ulang tidak bisa dimasukkan ke balok ulang lain.',
    hintFoot: 'Ikuti jejak kakinya!',
    hintProg: 'Ini program yang berhasil. Coba!',
    hintBug: 'Perhatikan balok yang bersinar.',
    random: 'Peta baru! Bawa Poka ke bendera.',
    robotUntil: 'Balok 🔁 hijau toska mengulang sampai Poka tiba di bendera. Ketuk 🚩-nya supaya menghitung permata.',
    custom: 'Petamu sendiri! Bawa Poka ke bendera.'
  };
  if (IDL) Object.assign(P, PHRASES_ID);
  const LEVEL_ID = {
    'Forward': 'Maju', 'Down the hill': 'Menuruni bukit', 'Up': 'Naik', 'A rock': 'Sebuah batu', 'A gem': 'Sebuah permata',
    'Go left': 'Ke kiri', 'Corner': 'Tikungan', 'Two gems': 'Dua permata', 'Repeat': 'Ulang', 'Repeat twice': 'Ulang dua kali',
    'Until the flag': 'Sampai bendera', 'Turn': 'Belok', 'Gems': 'Permata', 'Maze': 'Labirin', 'Little lake': 'Danau kecil',
    'Stairs': 'Tangga', 'Hills': 'Bukit-bukit', 'Around the lake': 'Mengitari danau', 'Snake': 'Ular', 'Gem stairs': 'Tangga permata',
    'My function': 'Fungsiku', 'Yellow tiles': 'Petak kuning', 'Count the gems': 'Hitung permata', 'Long road': 'Jalan panjang',
    'Gem hunt': 'Berburu permata', 'Mountain': 'Gunung', 'Gem snake': 'Ular permata', 'Function stairs': 'Tangga fungsi',
    'Yellow column': 'Kolom kuning', 'Function gems': 'Permata fungsi', 'Yellow maze': 'Labirin kuning', 'Big steps': 'Langkah besar',
    'Long snake': 'Ular panjang', 'Gem counter': 'Penghitung permata', 'Until and if': 'Sampai dan jika'
  };
  const lvName = (n) => (IDL && LEVEL_ID[n]) || n;

  // ---- Children and saved state ----
  // The children are shared by every Cendekia app (shared/profile.js). Logica keeps, per child, the
  // difficulty, the stars for every difficulty, days in a row, which guides were seen, and the details for the
  // parents' summary, under logika.v3.<child id>.
  const CD = window.Cendekia, BASE = 'logika.v3';
  const DIFFS = {
    easy: { name: tx('Easy', 'Mudah'), age: tx('Ages 4–5', 'Usia 4–5'), icon: '🌱', note: tx('Small maps, fewer choices', 'Peta kecil, pilihan lebih sedikit') },
    medium: { name: tx('Medium', 'Sedang'), age: tx('Ages 6–7', 'Usia 6–7'), icon: '🌿', note: tx('Repeat blocks, longer patterns', 'Balok ulang, pola lebih panjang') },
    hard: { name: tx('Hard', 'Sulit'), age: tx('Ages 8–10', 'Usia 8–10'), icon: '🌳', note: tx('Functions, if blocks, bigger puzzles', 'Fungsi, balok jika, teka-teki lebih besar') },
    veryhard: { name: tx('Very hard', 'Sangat sulit'), age: tx('Ages 10+', 'Usia 10+'), icon: '🏔️', note: tx('Long puzzles, fewer helpers', 'Teka-teki panjang, bantuan lebih sedikit') },
    extreme: { name: tx('Extreme', 'Ekstrem'), age: tx('Expert puzzlers', 'Jagoan teka-teki'), icon: '🔥', note: tx('The biggest puzzles of all', 'Teka-teki terbesar dari semuanya') }
  };
  // The difficulties from easiest to hardest. A rule that begins at Hard goes on in the two above it.
  const TIERS = Object.keys(DIFFS);
  const hardUp = (d) => TIERS.indexOf(d) >= TIERS.indexOf('hard');
  const AVATARS = CD.AVATARS;
  const fresh = () => ({ diff: '', best: { easy: {}, medium: {}, hard: {}, veryhard: {}, extreme: {} }, day: '', streak: 0, seen: {}, log: {}, days: {} });
  // The quiz worlds had Indonesian ids before (pola, mesin, timbang, saring, kode). Saved stars, logs and seen
  // guides under the old ids move to the new ones the first time a child's state is read.
  const OLD_IDS = { pola: 'patterns', mesin: 'machine', timbang: 'balance', saring: 'filter', kode: 'code' };
  function renameWorlds(st) {
    Object.values(st.best || {}).forEach((byW) => Object.keys(OLD_IDS).forEach((o) => { if (byW[o]) { byW[OLD_IDS[o]] = byW[OLD_IDS[o]] || byW[o]; delete byW[o]; } }));
    Object.keys(OLD_IDS).forEach((o) => { if (st.seen && st.seen[o]) { st.seen[OLD_IDS[o]] = true; delete st.seen[o]; } });
    Object.keys(st.log || {}).forEach((k) => {
      const [d, w, i] = k.split('/');
      if (OLD_IDS[w]) { const nk = d + '/' + OLD_IDS[w] + '/' + i; st.log[nk] = st.log[nk] || st.log[k]; delete st.log[k]; }
    });
    return st;
  }
  const stateOf = (id) => renameWorlds(Object.assign(fresh(), CD.state(BASE, id) || {}));
  // Logica had its own players before (logika.v2, and logika.v1 before that). Each one moves to the shared
  // child with the same name, the player who was playing moves to the current child, and the others become new children.
  (function moveOldPlayers() {
    const get = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
    const put = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) { /* private mode */ } };
    if (get('logika.moved')) return;
    let db = get('logika.v2');
    const v1 = get('logika.v1');
    if ((!db || !db.players || !db.players.length) && v1 && v1.best) {
      db = { cur: 'old', players: [{ id: 'old', name: CD.profile().name, av: '', diff: 'medium', best: { medium: v1.best }, day: v1.day, streak: v1.streak }] };
    }
    const used = new Set();
    ((db && db.players) || []).slice().sort((a) => (a.id === db.cur ? -1 : 1)).forEach((pl) => {
      let kid = CD.profiles().find((q) => !used.has(q.id) && q.name.toLowerCase() === String(pl.name).toLowerCase());
      if (!kid && pl.id === db.cur && !used.has(CD.profile().id)) kid = CD.profile();
      if (!kid) kid = CD.add(pl.name, pl.av);
      used.add(kid.id);
      if (!CD.state(BASE, kid.id)) put(BASE + '.' + kid.id, { diff: pl.diff, best: pl.best, day: pl.day || '', streak: pl.streak || 0, seen: pl.seen || {}, log: pl.log || {}, days: pl.days || {} });
    });
    put('logika.moved', '1');
  })();
  let S = stateOf(CD.profile().id);
  const me = () => CD.profile();
  function save() { try { localStorage.setItem(CD.key(BASE), JSON.stringify(S)); } catch (e) { /* private mode */ } }
  const dayStr = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function streakNow() {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return S.day === dayStr(new Date()) || S.day === dayStr(y) ? S.streak : 0;
  }
  // Counts today as a learning day; the streak grows when yesterday was one too.
  function markDay() {
    const today = dayStr(new Date());
    if (S.day === today) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    S.streak = S.day === dayStr(y) ? S.streak + 1 : 1;
    S.day = today;
  }
  // What a player did in each level, for the parents' summary: q questions with ok right on the first try,
  // runs of a robot program with wins reaching the flag and fails not, and hints. slips counts the kind of mistake behind
  // wrong answers, for the worlds whose wrong answers stand for a known slip. days counts puzzles solved per day.
  function logOf(w, i) {
    S.log = S.log || {};
    const k = S.diff + '/' + w + '/' + i;
    return S.log[k] || (S.log[k] = { q: 0, ok: 0, runs: 0, wins: 0, fails: 0, hints: 0 });
  }
  function solvedOne() {
    S.days = S.days || {};
    const today = dayStr(new Date());
    S.days[today] = (S.days[today] || 0) + 1;
    const keys = Object.keys(S.days).sort();
    keys.slice(0, Math.max(0, keys.length - 60)).forEach((k) => { delete S.days[k]; });
  }
  const bestOf = (diff) => S.best[diff] || (S.best[diff] = {});
  const best = (w, i) => (bestOf(S.diff)[w] || [])[i] || 0;
  const sum = (a) => (a || []).reduce((x, y) => x + (y || 0), 0);
  const worldStars = (w) => sum(bestOf(S.diff)[w.id]);
  // Stickers count the stars from every difficulty.
  const totalStars = () => Object.keys(DIFFS).reduce((a, d) => a + WORLDS.reduce((b, w) => b + sum(bestOf(d)[w.id]), 0), 0);

  // ---- Worlds ----
  const WORLDS = [
    { id: 'robot', name: tx('Robot Path', 'Jalan Robot'), skill: tx('Algorithms', 'Algoritma'), icon: '🤖', c: 'var(--c-orange)', kind: 'robot',
      desc: tx('Line up commands step by step to get Poka to the flag. Later come repeat, function and if blocks.', 'Susun perintah langkah demi langkah untuk membawa Poka ke bendera. Nanti ada balok ulang, fungsi, dan jika.') },
    { id: 'patterns', name: tx('Patterns', 'Pola'), skill: tx('Pattern recognition', 'Mengenali pola'), icon: '🔷', c: 'var(--c-blue)', kind: 'quiz', total: 5,
      desc: tx('Spot the rule that repeats, then find what comes next or what is missing.', 'Temukan aturan yang berulang, lalu cari apa yang berikutnya atau apa yang hilang.'),
      levels: [tx('Colors', 'Warna'), tx('Shapes', 'Bentuk'), tx('Repeats', 'Pengulangan'), tx('Colors and shapes', 'Warna dan bentuk'), tx('Growing', 'Bertambah'), tx('Turning', 'Berputar'), tx('Two rules', 'Dua aturan'), tx('Mixed', 'Campuran')] },
    { id: 'machine', name: tx('Magic Machine', 'Mesin Ajaib'), skill: tx('Abstraction', 'Abstraksi'), icon: '⚙️', c: 'var(--c-purple)', kind: 'quiz', total: 4,
      desc: tx('Watch what goes in and what comes out of the machine. Find its rule!', 'Perhatikan apa yang masuk dan apa yang keluar dari mesin. Temukan aturannya!'),
      levels: [tx('New color', 'Warna baru'), tx('New shape', 'Bentuk baru'), tx('Add one', 'Tambah satu'), tx('Turn', 'Putar'), tx('Double', 'Dua kali lipat'), tx('Two changes', 'Dua perubahan'), tx('Add two', 'Tambah dua'), tx('Number machine', 'Mesin angka')] },
    { id: 'balance', name: tx('Balance', 'Timbangan'), skill: tx('Logical reasoning', 'Penalaran logis'), icon: '⚖️', c: 'var(--c-teal)', kind: 'quiz', total: 5,
      desc: tx('Read the scales, then find the heaviest or the lightest ball.', 'Baca timbangannya, lalu cari bola yang paling berat atau paling ringan.'),
      levels: [tx('Heavier', 'Lebih berat'), tx('Lighter', 'Lebih ringan'), tx('Heaviest', 'Paling berat'), tx('Lightest', 'Paling ringan'), tx('Many balls', 'Banyak bola'), tx('Balanced', 'Seimbang')] },
    { id: 'debug', name: tx('Fix the Code', 'Perbaiki Kodenya'), skill: tx('Debugging', 'Mencari kesalahan'), icon: '🐞', c: 'var(--c-pink)', kind: 'robot',
      desc: tx('Poka\'s program has one mistake. Run it, find the wrong block and fix it.', 'Program Poka ada satu kesalahan. Jalankan, temukan balok yang salah, lalu perbaiki.') },
    { id: 'filter', name: tx('Logic Filter', 'Saringan Logika'), skill: tx('AND, OR, NOT logic', 'Logika DAN, ATAU, BUKAN'), icon: '🔍', c: 'var(--c-green)', kind: 'quiz', total: 4,
      desc: tx('Pick every item that fits the rule. Watch out for AND, OR and NOT.', 'Pilih semua benda yang cocok dengan aturan. Hati-hati dengan DAN, ATAU, dan BUKAN.'),
      levels: [tx('Colors', 'Warna'), tx('Shapes', 'Bentuk'), tx('AND', 'DAN'), tx('NOT', 'BUKAN'), tx('OR', 'ATAU'), tx('But not', 'Tapi bukan'), tx('Mixed', 'Campuran')] },
    { id: 'code', name: tx('Secret Code', 'Kode Rahasia'), skill: tx('Codes and binary', 'Kode dan biner'), icon: '🔐', c: 'var(--c-indigo)', kind: 'quiz', total: 4,
      desc: tx('Turn 0 and 1 into pictures, read numbers from light bulbs and crack secret messages.', 'Ubah 0 dan 1 jadi gambar, baca angka dari lampu, dan pecahkan pesan rahasia.'),
      levels: [tx('Read the picture', 'Baca gambarnya'), tx('Paint by code', 'Warnai dengan kode'), tx('Short code', 'Kode singkat'), tx('Light bulbs', 'Lampu'), tx('Make a number', 'Buat angka'), tx('Secret message', 'Pesan rahasia'), tx('Write in code', 'Tulis dengan kode')] },
    { id: 'sudoku', name: tx('Mini Sudoku', 'Sudoku Mini'), skill: tx('Deduction', 'Menyimpulkan'), icon: '🧩', c: 'var(--c-red)', kind: 'quiz', total: 3,
      desc: tx('Fill the gaps so every row and column, and every box in the bigger grids, has each shape once.', 'Isi yang kosong supaya setiap baris dan kolom, serta setiap kotak di petak yang lebih besar, berisi tiap bentuk satu kali.'),
      levels: [tx('Warm up', 'Pemanasan'), tx('A few gaps', 'Sedikit kosong'), tx('Half empty', 'Setengah kosong'), tx('Think ahead', 'Pikir ke depan'), tx('Boxes', 'Kotak'), tx('Big grid', 'Petak besar'), tx('Master', 'Ahli')] },
    { id: 'clues', name: tx('Who Is It?', 'Siapa Dia?'), skill: tx('Reasoning with clues', 'Bernalar dengan petunjuk'), icon: '🕵️', c: 'var(--c-sky)', kind: 'quiz', total: 3,
      desc: tx('Read the clues and work out which pet belongs to which friend.', 'Baca petunjuknya dan cari tahu hewan peliharaan milik teman yang mana.'),
      levels: [tx('Two friends', 'Dua teman'), tx('Three friends', 'Tiga teman'), tx('Not this one', 'Bukan yang ini'), tx('Clever pets', 'Hewan pintar'), tx('This or that', 'Ini atau itu'), tx('Big group', 'Kelompok besar'), tx('Detective', 'Detektif')] },
    { id: 'train', name: tx('Sort the Train', 'Urutkan Kereta'), skill: tx('Sorting', 'Mengurutkan'), icon: '🚂', c: 'var(--c-lime)', kind: 'quiz', total: 4,
      desc: tx('Swap wagons that stand side by side until the whole train is in order, with as few swaps as you can.', 'Tukar gerbong yang bersebelahan sampai seluruh kereta berurutan, dengan sesedikit mungkin tukaran.'),
      levels: [tx('Three wagons', 'Tiga gerbong'), tx('Four wagons', 'Empat gerbong'), tx('Five wagons', 'Lima gerbong'), tx('Biggest first', 'Terbesar dulu'), tx('Letters', 'Huruf'), tx('Long train', 'Kereta panjang'), tx('Mixed up', 'Campur aduk')] },
    { id: 'hanoi', name: tx('Tower of Poka', 'Menara Poka'), skill: tx('Planning ahead', 'Merencanakan ke depan'), icon: '🗼', c: 'var(--c-brown)', kind: 'quiz', total: 3,
      desc: tx('Move the tower of disks to another peg, one disk at a time. A big disk never sits on a small one.', 'Pindahkan menara cakram ke tiang lain, satu cakram setiap kali. Cakram besar tidak boleh di atas cakram kecil.'),
      levels: [tx('Small tower', 'Menara kecil'), tx('Taller tower', 'Menara lebih tinggi'), tx('Middle peg', 'Tiang tengah'), tx('Messy start', 'Awal berantakan'), tx('Rebuild', 'Bangun ulang'), tx('Big tower', 'Menara besar'), tx('Mixed up', 'Campur aduk')] },
    { id: 'park', name: tx("Poka's Parking Lot", 'Parkiran Poka'), skill: tx('Planning ahead', 'Merencanakan ke depan'), icon: '🚓', c: 'var(--c-orange)', kind: 'quiz', total: 3,
      desc: tx('The police car is stuck in a full parking lot. Slide the other cars out of the way and drive it out of the exit.', 'Mobil polisi terjebak di parkiran yang penuh. Geser mobil lain dari jalannya, lalu keluarkan lewat pintu keluar.'),
      levels: [tx('Few cars', 'Sedikit mobil'), tx('More cars', 'Lebih banyak mobil'), tx('Trucks', 'Truk'), tx('Tight spot', 'Sempit'), tx('Busy lot', 'Parkiran ramai'), tx('Rush hour', 'Jam sibuk'), tx('Mixed up', 'Campur aduk')] },
    { id: 'maze', name: tx("Poka's Maze", 'Labirin Poka'), skill: tx('Finding a way', 'Mencari jalan'), icon: '🧭', c: 'var(--c-teal)', kind: 'quiz', total: 3,
      desc: tx('Poka is lost in a maze. Walk to the house, and back up when you reach a dead end.', 'Poka tersesat di labirin. Berjalanlah ke rumah, dan mundur kalau sampai di jalan buntu.'),
      levels: [tx('Small maze', 'Labirin kecil'), tx('Bigger maze', 'Labirin lebih besar'), tx('Shortcuts', 'Jalan pintas'), tx('Big maze', 'Labirin besar'), tx('Many ways', 'Banyak jalan'), tx('Huge maze', 'Labirin raksasa'), tx('Mixed up', 'Campur aduk')] },
    { id: 'pack', name: tx('Poka\'s Backpack', 'Ransel Poka'), skill: tx('Variables', 'Variabel'), icon: '🎒', c: 'var(--c-rose)', kind: 'quiz', total: 3,
      desc: tx('Follow the steps and work out what is in each pocket of the backpack.', 'Ikuti langkahnya dan cari tahu isi setiap kantong ransel.'),
      levels: [tx('Put in, take out', 'Masukkan, keluarkan'), tx('Two pockets', 'Dua kantong'), tx('Copy', 'Salin'), tx('Build it', 'Susun'), tx('Swap', 'Tukar'), tx('Repeat', 'Ulang'), tx('Mixed up', 'Campur aduk')] },
    { id: 'circuit', name: tx("Poka's Workshop", 'Bengkel Poka'), skill: tx('Logic gates', 'Gerbang logika'), icon: '🔌', c: 'var(--c-amber)', kind: 'quiz', total: 3,
      desc: tx('Follow the wires through switches and gates, and light the lamp.', 'Ikuti kabelnya melewati saklar dan gerbang, lalu nyalakan lampunya.'),
      levels: [tx('Switch and flip', 'Saklar dan balik'), tx('Both keys', 'Kedua kunci'), tx('Either key', 'Salah satu kunci'), tx('Mixed wires', 'Kabel campur'), tx('Fill the gate', 'Isi gerbangnya'), tx('Build a circuit', 'Buat rangkaian')] }
  ];
  // Robot and fixing levels are different for each difficulty; quiz levels are the same, with harder questions.
  const levelsOf = (w) => (w.kind === 'robot' ? robotLevels(w.id, S.diff).map((l) => lvName(l.name)) : w.levels);
  const maxStars = (w) => levelsOf(w).length * 3;
  const isOpen = (w, i) => i === 0 || best(w.id, i - 1) > 0;
  const starSvg = (on, cls) => '<svg class="' + (cls || '') + (on ? ' on' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#starPath"/></svg>';

  // ---- Stickers: space friends, unlocked by the total star count ----
  const STICKERS = [
    { at: 3, name: tx('Rocket', 'Roket'), pic: '🚀', c: '#ffe3c2' }, { at: 8, name: tx('Satellite', 'Satelit'), pic: '🛰️', c: '#d6ebff' },
    { at: 14, name: tx('Alien', 'Alien'), pic: '👽', c: '#d9f5e8' }, { at: 21, name: tx('Planet', 'Planet'), pic: '🪐', c: '#ece6ff' },
    { at: 29, name: tx('Moon', 'Bulan'), pic: '🌙', c: '#fff1c2' }, { at: 38, name: tx('UFO', 'UFO'), pic: '🛸', c: '#e6ecf5' },
    { at: 48, name: tx('Astronaut', 'Astronaut'), pic: '🧑‍🚀', c: '#d6ebff' }, { at: 59, name: tx('Telescope', 'Teleskop'), pic: '🔭', c: '#ffe0ec' },
    { at: 71, name: tx('Comet', 'Komet'), pic: '☄️', c: '#ffe3c2' }, { at: 85, name: tx('Earth', 'Bumi'), pic: '🌍', c: '#d9f5e8' },
    { at: 100, name: tx('Shooting star', 'Bintang jatuh'), pic: '🌠', c: '#ece6ff' }, { at: 120, name: tx('Super robot', 'Robot super'), pic: '🦾', c: '#fff1c2' }
  ];
  const unlocked = (stars) => STICKERS.filter((k) => k.at <= stars).length;
  const face = (k) => '<span class="face" style="--c:' + k.c + '" aria-hidden="true">' + k.pic + '</span>';

  // Floating shapes behind the home screen.
  (function floaters() {
    const f = $('floaters');
    const spots = [[6, 18], [86, 12], [14, 70], [90, 62], [50, 88], [70, 36], [28, 40]];
    f.innerHTML = spots.map(([x, y], k) => itemSvg(it(SK[k % 5], CK[(k + 2) % 5]))
      .replace('<svg class="it"', '<svg style="left:' + x + '%;top:' + y + '%;animation-delay:-' + k * 0.9 + 's"')).join('');
  })();

  // Arc UI (logica/ui) gives the star counts a rolling counter and shows toasts. The bundle loads deferred, so
  // plain text stands in until it is there; if it never loads, the text stays.
  const UI = {
    count(el, n, suffix) { if (window.LogicaUI) window.LogicaUI.counter(el, n, suffix); else el.textContent = n + suffix; },
    toast(o) { if (window.LogicaUI) window.LogicaUI.toast(o); },
  };
  function paintStars(stars) {
    UI.count($('homeStars'), stars, tx(stars === 1 ? '\u00a0star' : '\u00a0stars', '\u00a0bintang'));
  }
  // The bundle is fetched on first use, so its size never delays the first paint. Resolves true when it is there.
  let uiLoad = null;
  function loadUI() {
    if (!uiLoad) uiLoad = new Promise((done) => {
      // The counter's digit wheels are clipped by the stylesheet, so nothing paints until both files are in.
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = 'ui-dist/logica-ui.css';
      const js = document.createElement('script');
      js.src = 'ui-dist/logica-ui.js';
      const styled = new Promise((ok, fail) => { css.onload = ok; css.onerror = fail; });
      const scripted = new Promise((ok, fail) => { js.onload = ok; js.onerror = fail; });
      Promise.all([styled, scripted]).then(() => { paintStars(totalStars()); renderStickers(); done(true); }, () => {
        // The script defines window.LogicaUI by itself, but without its stylesheet every component renders as raw markup.
        delete window.LogicaUI;
        done(false);
      });
      document.head.append(css, js);
    });
    return uiLoad;
  }
  // Started by the first touch or key, so a page that is only looked at never pays for it.
  ['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, loadUI, { once: true, passive: true }));

  function renderHome() {
    const stars = totalStars();
    const days = streakNow();
    $('who').innerHTML = '<span class="av" aria-hidden="true">' + me().avatar + '</span>' + esc(me().name) + ' <span aria-hidden="true">▾</span>';
    $('diffBadge').innerHTML = DIFFS[S.diff].icon + ' ' + DIFFS[S.diff].name + ' <span aria-hidden="true">▾</span>';
    paintStars(stars);
    $('homeDays').textContent = days + tx(days === 1 ? ' day' : ' days', ' hari');
    $('homeStk').textContent = unlocked(stars) + '/' + STICKERS.length;
    const box = $('worlds');
    box.innerHTML = '';
    WORLDS.forEach((w, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'card'; b.style.setProperty('--c', w.c); b.style.animationDelay = k * 0.05 + 's';
      b.innerHTML = '<span class="badge" aria-hidden="true">' + w.icon + '</span><b>' + w.name + '</b>'
        + '<span class="topic">' + w.skill + '</span>'
        + '<span class="meter" aria-hidden="true"><i style="width:' + Math.round(100 * worldStars(w) / maxStars(w)) + '%"></i></span>'
        + '<small>' + worldStars(w) + ' / ' + maxStars(w) + ' ⭐</small>';
      b.addEventListener('click', () => { sfx.tap(); curWorld = w; show('world'); });
      box.appendChild(b);
    });
    const mk = document.createElement('button');
    mk.type = 'button'; mk.className = 'card wide'; mk.style.setProperty('--c', 'var(--c-orange)');
    mk.style.animationDelay = '.25s';
    mk.innerHTML = '<span class="badge" aria-hidden="true">🛠️</span><span><b>' + tx('Map Maker', 'Pembuat Peta') + '</b><br><small>' + tx('Build a map for Poka and share it', 'Buat peta untuk Poka dan bagikan') + '</small></span>';
    mk.addEventListener('click', () => { sfx.tap(); show('maker'); });
    box.appendChild(mk);
    const s = document.createElement('button');
    s.type = 'button'; s.className = 'card wide'; s.style.setProperty('--c', 'var(--c-purple)');
    s.style.animationDelay = '.3s';
    s.innerHTML = '<span class="badge" aria-hidden="true">🛸</span><span><b>' + tx('Space Stickers', 'Stiker Luar Angkasa') + '</b><br><small>' + tx('Collect stars to unlock stickers', 'Kumpulkan bintang untuk membuka stiker') + '</small></span>';
    s.addEventListener('click', () => show('stickers'));
    box.appendChild(s);
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  $('who').addEventListener('click', () => show('players'));
  const langBtn = CD.langButton();
  langBtn.className = 'cd-lang'; langBtn.style.margin = '0';
  $('who').after(langBtn);

  // ---- Choosing and editing children ----
  // Children are added, renamed and switched here; removing a child is on the parents' page, since it removes
  // them from every Cendekia app.
  const starsOf = (st) => Object.values(st.best).reduce((a, byW) => a + Object.values(byW).reduce((b, l) => b + sum(l), 0), 0);
  function useChild(id) { CD.select(id); S = stateOf(id); ensureDiff(); }
  // A child who has not played Logica yet starts on medium and is asked to choose.
  function ensureDiff() { if (!S.diff) { S.diff = 'medium'; save(); setTimeout(() => chooseDiff(true), 0); } }
  function renderPlayers() {
    const box = $('plist');
    box.innerHTML = '';
    CD.profiles().forEach((p) => {
      const st = stateOf(p.id), d = document.createElement('div');
      d.className = 'pcard' + (p.id === me().id ? ' cur' : '');
      const lvl = st.diff ? DIFFS[st.diff].icon + ' ' + DIFFS[st.diff].name : tx('New here', 'Baru di sini');
      d.innerHTML = '<button type="button" class="pick"><span class="av" aria-hidden="true">' + p.avatar + '</span><span><b>' + esc(p.name) + '</b>'
        + '<small>' + lvl + ' · ⭐ ' + starsOf(st) + '</small></span></button>'
        + '<button type="button" class="edit" aria-label="' + tx('Change ', 'Ubah ') + esc(p.name) + '">✎</button>';
      d.querySelector('.pick').addEventListener('click', () => { sfx.tap(); useChild(p.id); show('home'); });
      d.querySelector('.edit').addEventListener('click', () => openForm(p.id));
      box.appendChild(d);
    });
  }
  $('plBack').addEventListener('click', () => show('home'));
  $('plAdd').addEventListener('click', () => openForm(null));
  let editing = null, formAv = AVATARS[0], formDiff = 'medium';
  function openForm(id) {
    const p = id ? CD.profiles().find((q) => q.id === id) : null;
    editing = p ? p.id : null;
    formAv = p ? p.avatar : pick(AVATARS);
    formDiff = (p && stateOf(p.id).diff) || 'medium';
    $('pfTitle').textContent = p ? tx('Change player', 'Ubah pemain') : tx('New player', 'Pemain baru');
    $('pfName').value = p ? p.name : '';
    renderForm();
    show('pform');
  }
  function renderForm() {
    $('pfAvs').innerHTML = AVATARS.map((a) => '<button type="button" aria-pressed="' + (a === formAv) + '" data-av="' + a + '">' + a + '</button>').join('');
    $('pfDiffs').innerHTML = diffButtons(formDiff);
  }
  const diffButtons = (cur) => Object.entries(DIFFS).map(([k, d]) => '<button type="button" aria-pressed="' + (k === cur) + '" data-diff="' + k + '">'
    + '<span class="ic" aria-hidden="true">' + d.icon + '</span><span><b>' + d.name + '</b> · ' + d.age + '<small>' + d.note + '</small></span></button>').join('');
  $('pfAvs').addEventListener('click', (e) => { const b = e.target.closest('[data-av]'); if (b) { formAv = b.dataset.av; sfx.tap(); renderForm(); } });
  $('pfDiffs').addEventListener('click', (e) => { const b = e.target.closest('[data-diff]'); if (b) { formDiff = b.dataset.diff; sfx.tap(); renderForm(); } });
  $('pfBack').addEventListener('click', () => show('players'));
  $('pfSave').addEventListener('click', () => {
    const name = $('pfName').value.trim().slice(0, 16) || tx('Player ', 'Pemain ') + (CD.profiles().length + (editing ? 0 : 1));
    const id = editing ? (CD.update(editing, { name, avatar: formAv }), editing) : CD.add(name, formAv).id;
    const st = stateOf(id);
    st.diff = formDiff;
    try { localStorage.setItem(BASE + '.' + id, JSON.stringify(st)); } catch (e) { /* private mode */ }
    useChild(id); sfx.good();
    show('home');
  });

  // ---- Choosing the difficulty: from the badge on the home screen, and on a child's first visit ----
  function chooseDiff(first) {
    $('dfTitle').textContent = first ? tx('Hi ' + me().name + '! How hard should it be?', 'Hai ' + me().name + '! Seberapa sulit yang kamu mau?') : tx('How hard should it be?', 'Seberapa sulit yang kamu mau?');
    $('dfList').innerHTML = diffButtons(S.diff);
    $('dfNote').textContent = tx('Stars are kept for each difficulty, so you can switch any time.', 'Bintang disimpan untuk setiap tingkat, jadi kamu bisa berganti kapan saja.');
    // The Arc bottom sheet when the bundle is loaded; the plain dialog otherwise.
    const html = '<div class="diffs">' + $('dfList').innerHTML + '</div><p class="note">' + $('dfNote').textContent + '</p>';
    // A child's very first visit uses the plain dialog, so the page does not wait for the bundle before it can be used.
    const plain = () => { $('diffPick').hidden = false; $('dfList').querySelector('[aria-pressed="true"], button').focus(); };
    if (first) { plain(); return; }
    loadUI().then((ok) => {
      if (ok) window.LogicaUI.sheet({ title: $('dfTitle').textContent, html, closeText: tx('Not now', 'Nanti saja') });
      else plain();
    });
  }
  function pickDiff(b) {
    S.diff = b.dataset.diff; save(); sfx.good();
    $('diffPick').hidden = true;
    if (window.LogicaUI) window.LogicaUI.sheet(null);
    show('home');
  }
  $('dfList').addEventListener('click', (e) => { const b = e.target.closest('[data-diff]'); if (b) pickDiff(b); });
  // The sheet's buttons live in the React tree, outside #dfList.
  document.addEventListener('click', (e) => { const b = e.target.closest('#arc-ui-host [data-diff]'); if (b) pickDiff(b); });
  $('diffBadge').addEventListener('click', () => chooseDiff(false));
  $('diffPick').addEventListener('click', (e) => { if (e.target === $('diffPick')) $('diffPick').hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { $('diffPick').hidden = true; $('tutor').hidden = true; } });

  let curWorld = WORLDS[0];
  function renderWorld() {
    const w = curWorld, names = levelsOf(w);
    $('wTitle').textContent = w.name;
    $('wStars').textContent = worldStars(w) + '/' + maxStars(w);
    const ab = $('wAbout');
    const ref = { circuit: [tx('📖 Gates', '📖 Gerbang'), gateGuide, 'wGates'], pack: [tx('📖 Steps', '📖 Langkah'), packGuide, 'wSteps'] }[w.id]; // a guide to the kinds of block or gate
    ab.style.setProperty('--c', w.c);
    ab.innerHTML = '<span class="badge" aria-hidden="true">' + w.icon + '</span><p><small>' + w.skill + ' · ' + DIFFS[S.diff].name + '</small><br>' + w.desc + '</p>'
      + (ref ? '<span class="helps"><button type="button" class="help" id="wHelp">' + tx('❓ How', '❓ Cara') + '</button><button type="button" class="help" id="' + ref[2] + '">' + ref[0] + '</button></span>'
        : '<button type="button" class="help" id="wHelp">' + tx('❓ How', '❓ Cara') + '</button>');
    ab.classList.toggle('twoHelp', !!ref); // two buttons: they go on a row of their own
    $('wHelp').addEventListener('click', () => tutorial(w));
    if (ref) $(ref[2]).addEventListener('click', ref[1]);
    const box = $('wLevels');
    box.innerHTML = '';
    const next = names.findIndex((_, i) => !best(w.id, i));
    names.forEach((name, i) => {
      const open = isOpen(w, i), st = best(w.id, i);
      const d = document.createElement('div');
      d.className = 'lv' + (open ? '' : ' locked') + (i === next && open ? ' next' : '');
      d.style.setProperty('--c', w.c);
      d.innerHTML = '<button type="button" aria-label="' + tx('Level ', 'Level ') + (i + 1) + ': ' + name + (open ? '' : tx(' (locked)', ' (terkunci)')) + '" style="animation-delay:' + i * 0.04 + 's">'
        + (open ? i + 1 : '🔒') + '</button><span class="st">' + [0, 1, 2].map((k) => starSvg(k < st)).join('') + '</span><small>' + name + '</small>';
      d.querySelector('button').addEventListener('click', () => {
        if (!open) { sfx.bad(); return; }
        sfx.tap(); play(w, i);
      });
      box.appendChild(d);
    });
    const ex = $('wExtra');
    ex.innerHTML = '';
    if (w.id === 'robot') {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'card wide'; b.style.setProperty('--c', w.c);
      b.innerHTML = '<span class="badge" aria-hidden="true">🎲</span><span><b>' + tx('Random map', 'Peta acak') + '</b><br><small>' + tx('A new map every time, just for practice', 'Peta baru setiap kali, untuk berlatih saja') + '</small></span>';
      b.addEventListener('click', () => { if (!CD.gate()) return; sfx.tap(); markDay(); save(); startRobot(w, -1, randomLevel(S.diff)); });
      ex.appendChild(b);
      const m = document.createElement('button');
      m.type = 'button'; m.className = 'card wide'; m.style.setProperty('--c', w.c);
      m.innerHTML = '<span class="badge" aria-hidden="true">🛠️</span><span><b>' + tx('Map Maker', 'Pembuat Peta') + '</b><br><small>' + tx('Build your own map and share it', 'Buat petamu sendiri dan bagikan') + '</small></span>';
      m.addEventListener('click', () => { sfx.tap(); show('maker'); });
      ex.appendChild(m);
    }
    if (!S.seen[w.id]) tutorial(w);
  }

  // =====================================================================
  // For parents: what each player has done, per skill, with the levels to practice
  // =====================================================================
  const SKILL_INFO = {
    robot: tx('Planning steps in the right order. Later: repeating steps, reusing a group of steps (a function) and making a choice (if).', 'Merencanakan langkah dengan urutan yang benar. Nanti: mengulang langkah, memakai ulang sekelompok langkah (fungsi), dan membuat pilihan (jika).'),
    patterns: tx('Spotting a rule that repeats and using it to predict.', 'Menemukan aturan yang berulang dan memakainya untuk menebak.'),
    machine: tx('Finding the general rule behind a few examples, and applying it to something new.', 'Menemukan aturan umum dari beberapa contoh, lalu memakainya pada hal baru.'),
    balance: tx('Combining facts to reach a conclusion: if red is heavier than blue and blue is heavier than green, red is the heaviest.', 'Menggabungkan fakta untuk menarik kesimpulan: kalau merah lebih berat dari biru dan biru lebih berat dari hijau, merah yang paling berat.'),
    debug: tx('Finding where a plan goes wrong and fixing just that part, calmly.', 'Menemukan di mana rencana salah dan memperbaiki bagian itu saja, dengan tenang.'),
    filter: tx('Combining conditions with AND, OR and NOT, as in searches and programming.', 'Menggabungkan syarat dengan DAN, ATAU, dan BUKAN, seperti dalam pencarian dan pemrograman.'),
    code: tx('How computers keep pictures and numbers as 0 and 1, write data in a shorter way, and hide a message with a code.', 'Cara komputer menyimpan gambar dan angka sebagai 0 dan 1, menulis data dengan lebih singkat, dan menyembunyikan pesan dengan kode.'),
    sudoku: tx('Ruling out what cannot fit, one step at a time, until only one answer is left.', 'Mencoret yang tidak mungkin, selangkah demi selangkah, sampai tinggal satu jawaban.'),
    clues: tx('Combining several clues, including "not", "or" and facts about things, to find the only answer that fits them all.', 'Menggabungkan beberapa petunjuk, termasuk "bukan", "atau", dan fakta tentang benda, untuk menemukan satu-satunya jawaban yang cocok dengan semuanya.'),
    train: tx('Putting things in order step by step, the way a computer sorts: every swap of two neighbours should fix something.', 'Mengurutkan langkah demi langkah, seperti komputer mengurutkan: setiap tukar dua tetangga harus memperbaiki sesuatu.'),
    hanoi: tx('Planning several moves ahead, and solving a big job by solving smaller copies of it first: to move the biggest disk, the smaller tower has to get out of the way.', 'Merencanakan beberapa gerakan ke depan, dan menyelesaikan pekerjaan besar dengan menyelesaikan salinan yang lebih kecil dulu: untuk memindahkan cakram terbesar, menara yang lebih kecil harus menyingkir.'),
    park: tx('Planning a way out backwards: to free the police car, first ask which car is in the way, then which car blocks that one. Every move changes what other cars can do, so thinking a few moves ahead beats pushing cars at random.', 'Merencanakan jalan keluar dari belakang: untuk membebaskan mobil polisi, tanyakan dulu mobil mana yang menghalangi, lalu mobil mana yang menghalangi mobil itu. Setiap gerakan mengubah apa yang bisa dilakukan mobil lain, jadi berpikir beberapa gerakan ke depan lebih baik daripada menggeser mobil sembarangan.'),
    maze: tx('Finding a way through: looking ahead to spot a dead end before walking into it, backing up when one is reached, and comparing routes to find the shortest, the way a computer searches a map.', 'Mencari jalan: melihat ke depan untuk menemukan jalan buntu sebelum masuk, mundur kalau sudah sampai, dan membandingkan rute untuk menemukan yang terpendek, seperti komputer mencari di peta.'),
    pack: tx('Variables: a named pocket holds a number that changes as the steps run. Following a program line by line, and knowing that a copy stays a copy when the original changes later. Later, building the steps to reach a number, swapping two pockets with a spare one, repeating steps instead of writing them again and again, and finding the one wrong step in a program.', 'Variabel: kantong bernama menyimpan angka yang berubah saat langkah dijalankan. Mengikuti program baris demi baris, dan tahu bahwa salinan tetap salinan walau yang asli berubah kemudian. Nanti: menyusun langkah untuk mencapai sebuah angka, menukar dua kantong dengan kantong cadangan, mengulang langkah daripada menulisnya berkali-kali, dan menemukan satu langkah yang salah dalam program.'),
    circuit: tx('Logic gates: AND, OR and NOT decide whether power gets through, the way computers combine simple yes-or-no decisions. Tracing a circuit from the switches to the lamp, and working back from the lamp to the switches. Later, choosing the gates that make a circuit match a table.', 'Gerbang logika: DAN, ATAU, dan BUKAN menentukan apakah listrik lewat, seperti cara komputer menggabungkan keputusan ya atau tidak yang sederhana. Menelusuri rangkaian dari saklar ke lampu, dan menghitung mundur dari lampu ke saklar. Nanti: memilih gerbang yang membuat rangkaian cocok dengan tabel.')
  };
  let viewed = null, gateAns = 0;
  $('toParents').addEventListener('click', () => {
    const a = rnd(4, 9), b = rnd(4, 9);
    gateAns = a * b;
    $('gateQ').textContent = a + ' × ' + b + ' = ?';
    $('gateA').value = ''; $('gateErr').textContent = '';
    $('gate').hidden = false; $('rep').hidden = true;
    show('parents');
    $('gateA').focus();
  });
  $('gate').addEventListener('submit', (e) => {
    e.preventDefault();
    if (+$('gateA').value !== gateAns) { $('gateErr').textContent = tx('Not quite. Please try again.', 'Belum tepat. Silakan coba lagi.'); return; }
    $('gate').hidden = true; $('rep').hidden = false;
    viewed = me().id; renderReport();
  });

  // Accuracy: questions right on the first try, or robot runs that reached the flag.
  const tries = (L) => L.q + L.runs;
  // What each kind of slip means, in words for a grown-up, with something to try. Only the worlds listed here record slips.
  const SLIPS = {
    pack: {
      'put-add': tx('Mixes up Put and Add. Put makes the pocket exactly that number, while Add keeps what is already there. The 📖 Steps guide shows the difference.', 'Tertukar antara Taruh dan Tambah. Taruh membuat kantong persis berisi angka itu, sedangkan Tambah mempertahankan isi yang sudah ada. Panduan 📖 Langkah menunjukkan bedanya.'),
      'skip-step': tx('Skips a step while following the program. Pointing at each step with a finger, one at a time, helps.', 'Melewatkan satu langkah saat mengikuti program. Menunjuk tiap langkah dengan jari, satu per satu, membantu.'),
      'other-pocket': tx('Answers with the number from the other pocket. Check which pocket the ? is on before answering.', 'Menjawab dengan angka dari kantong yang lain. Periksa dulu ? ada di kantong mana sebelum menjawab.'),
      start: tx('Answers with the number the pocket started with, as if no step had changed it.', 'Menjawab dengan angka awal kantong, seolah tidak ada langkah yang mengubahnya.'),
      'copy-reverse': tx('Copies the wrong way round. In Copy A into B, it is B that gets the number from A.', 'Menyalin terbalik. Di Salin A ke B, yang mendapat angka dari A adalah B.'),
      'off-by-one': tx('Is often one or two away from the answer. Counting each step aloud can help.', 'Sering meleset satu atau dua dari jawaban. Menghitung tiap langkah dengan suara keras bisa membantu.'),
      'repeat-once': tx('Does the steps inside a repeat only once. Saying each round aloud ("one... two... three...") helps.', 'Hanya mengerjakan langkah di dalam ulang satu kali. Menyebut tiap putaran dengan suara keras ("satu... dua... tiga...") membantu.'),
      'repeat-count': tx('Repeats the wrong number of times, often one too many or too few. Tick off each round on the screen.', 'Mengulang dengan jumlah yang salah, sering kelebihan atau kekurangan satu. Centang tiap putaran di layar.'),
      'loop-first-only': tx('Repeats only the first step inside a repeat, not all of them. Everything inside the repeat is done again each round.', 'Hanya mengulang langkah pertama di dalam ulang, bukan semuanya. Semua yang ada di dalam ulang dikerjakan lagi tiap putaran.'),
      'wrong-step': tx('Changes a step that was fine. Following the program one step at a time shows where the numbers go wrong.', 'Mengubah langkah yang sebenarnya sudah benar. Mengikuti program selangkah demi selangkah menunjukkan di mana angkanya mulai salah.'),
      'wrong-value': tx('Finds the wrong step but fixes it the wrong way. Ask what the step should do to the pocket.', 'Menemukan langkah yang salah tetapi memperbaikinya dengan cara yang salah. Tanyakan apa yang seharusnya dilakukan langkah itu pada kantong.')
    }
  };
  const goodOnes = (L) => L.ok + L.wins;
  function statusOf(n, rate, got) {
    if (n < 3) return { cls: 'none', text: n || got ? tx('🌱 Just started', '🌱 Baru mulai') : tx('○ Not started', '○ Belum mulai') };
    if (rate >= 0.8) return { cls: 'good', text: tx('💪 Strong', '💪 Kuat') };
    if (rate >= 0.5) return { cls: 'grow', text: tx('📈 Growing', '📈 Berkembang') };
    return { cls: 'low', text: tx('🎯 Needs practice', '🎯 Perlu latihan') };
  }
  function renderReport() {
    const kid = CD.profiles().find((q) => q.id === viewed) || me();
    const p = Object.assign(kid.id === me().id ? S : stateOf(kid.id), {});
    p.diff = p.diff || 'medium';
    const log = p.log || {}, days = p.days || {};
    const pct = (x) => Math.round(x * 100) + '%';
    const levelName = (w, diff, i) => (w.kind === 'robot' ? lvName(robotLevels(w.id, diff)[i].name) : w.levels[i]);
    // Totals over every level the player has tried.
    const all = Object.values(log).reduce((a, L) => ({ n: a.n + tries(L), g: a.g + goodOnes(L), h: a.h + L.hints }), { n: 0, g: 0, h: 0 });
    const stars = Object.values(p.best).reduce((a, byW) => a + Object.values(byW).reduce((b, l) => b + sum(l), 0), 0);
    const y = new Date(); y.setDate(y.getDate() - 1);
    const streak = p.day === dayStr(new Date()) || p.day === dayStr(y) ? p.streak : 0;
    const last14 = Array.from({ length: 14 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - 13 + k); return { d, n: days[dayStr(d)] || 0 }; });
    const week = last14.slice(7).reduce((a, x) => a + x.n, 0);

    let h = '';
    if (CD.profiles().length > 1) {
      h += '<div class="pchips" role="group" aria-label="' + tx('Player', 'Pemain') + '">' + CD.profiles().map((q) => '<button type="button" data-id="' + q.id + '" aria-pressed="' + (q.id === kid.id) + '">'
        + q.avatar + ' ' + esc(q.name) + '</button>').join('') + '</div>';
    }
    h += '<div class="box phead"><span class="av" aria-hidden="true">' + kid.avatar + '</span><span><b>' + esc(kid.name) + '</b><span class="muted">'
      + DIFFS[p.diff].icon + ' ' + DIFFS[p.diff].name + ' · ' + DIFFS[p.diff].age + '</span></span>'
      + '<button type="button" class="btn ghost" id="repEdit">' + tx('Change difficulty', 'Ubah tingkat') + '</button></div>';
    h += '<div class="tiles">'
      + '<div class="tile"><b>' + stars + '</b><span>' + tx('stars in all', 'bintang seluruhnya') + '</span></div>'
      + '<div class="tile"><b>' + streak + '</b><span>' + tx((streak === 1 ? 'day' : 'days') + ' in a row', 'hari berturut-turut') + '</span></div>'
      + '<div class="tile"><b>' + week + '</b><span>' + tx('puzzles solved this week', 'teka-teki selesai minggu ini') + '</span></div>'
      + '<div class="tile"><b>' + (all.n ? pct(all.g / all.n) : '–') + '</b><span>' + tx('right on the first try', 'benar di percobaan pertama') + '</span></div></div>';

    // Puzzles solved per day, last 14 days.
    const max = Math.max(1, ...last14.map((x) => x.n));
    const peak = last14.reduce((a, x, k) => (x.n > last14[a].n ? k : a), 0);
    const dname = (d) => d.toLocaleDateString(IDL ? 'id-ID' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    h += '<div class="box"><h3>' + tx('Puzzles solved, last 14 days', 'Teka-teki selesai, 14 hari terakhir') + '</h3><div class="chart" aria-hidden="true">'
      + last14.map((x, k) => '<span class="col' + (x.n ? '' : ' zero') + '" tabindex="0"><span class="tip">' + dname(x.d) + ': ' + x.n + '</span>'
        + (k === peak && x.n ? '<span class="val" style="bottom:' + (100 * x.n / max) + '%">' + x.n + '</span>' : '')
        + '<span class="bar" style="height:' + (100 * x.n / max) + '%"></span></span>').join('')
      + '</div><div class="days" aria-hidden="true">' + last14.map((x) => '<span>' + x.d.toLocaleDateString(IDL ? 'id-ID' : 'en-GB', { weekday: 'narrow' }) + '</span>').join('') + '</div>'
      + '<table class="sr"><caption>' + tx('Puzzles solved per day', 'Teka-teki selesai per hari') + '</caption><tr><th>' + tx('Day', 'Hari') + '</th><th>' + tx('Puzzles', 'Teka-teki') + '</th></tr>'
      + last14.map((x) => '<tr><td>' + dname(x.d) + '</td><td>' + x.n + '</td></tr>').join('') + '</table></div>';

    // Skills: stars at the current difficulty and accuracy over all difficulties.
    const perWorld = WORLDS.map((w) => {
      const Ls = Object.entries(log).filter(([k]) => k.split('/')[1] === w.id).map(([, L]) => L);
      const n = Ls.reduce((a, L) => a + tries(L), 0), g = Ls.reduce((a, L) => a + goodOnes(L), 0), hints = Ls.reduce((a, L) => a + L.hints, 0);
      const names = w.kind === 'robot' ? robotLevels(w.id, p.diff) : w.levels, got = sum((p.best[p.diff] || {})[w.id]);
      return { w, n, g, hints, rate: n ? g / n : 0, got, max: names.length * 3, st: statusOf(n, n ? g / n : 0, got) };
    });
    h += '<div class="box"><h3>' + tx('Skills', 'Keterampilan') + '</h3><div class="skills">' + perWorld.map((x) => '<div class="skill"><span class="ic" aria-hidden="true">' + x.w.icon + '</span>'
      + '<span><b>' + x.w.skill + '</b><br><small>' + x.w.name + ' · ⭐ ' + x.got + '/' + x.max + (x.n ? ' · ' + pct(x.rate) + tx(' first try of ', ' percobaan pertama dari ') + x.n : '') + (x.hints ? ' · ' + x.hints + tx(' hints', ' petunjuk') : '') + '</small></span>'
      + '<span class="stat ' + x.st.cls + '">' + x.st.text + '</span>'
      + '<span class="meter" aria-hidden="true"><i style="width:' + Math.round(100 * x.got / x.max) + '%"></i></span></div>').join('') + '</div>'
      + '<p class="muted" style="margin-top:10px">' + tx('Stars are for the ' + DIFFS[p.diff].name.toLowerCase() + ' levels. The first-try rate counts every difficulty.', 'Bintang untuk level ' + DIFFS[p.diff].name.toLowerCase() + '. Persentase percobaan pertama menghitung semua tingkat.') + '</p></div>';

    // The levels with the most mistakes.
    const hard = Object.entries(log).map(([k, L]) => { const [diff, wid, i] = k.split('/'); return { diff, w: WORLDS.find((w) => w.id === wid), i: +i, n: tries(L), rate: tries(L) ? goodOnes(L) / tries(L) : 1 }; })
      .filter((x) => x.w && x.n >= 3 && x.rate < 0.7).sort((a, b) => a.rate - b.rate).slice(0, 4);
    h += '<div class="box"><h3>' + tx('Worth practicing', 'Perlu dilatih') + '</h3>' + (hard.length
      ? '<ul class="plist2">' + hard.map((x) => '<li><b>' + x.w.name + ', level ' + (x.i + 1) + '</b> (' + levelName(x.w, x.diff, x.i) + ', ' + DIFFS[x.diff].name + '): '
        + tx(pct(x.rate) + ' right on the first try in ' + x.n + ' tries', pct(x.rate) + ' benar di percobaan pertama dalam ' + x.n + ' percobaan') + '</li>').join('') + '</ul>'
      : '<p class="muted">' + tx('Nothing stands out yet. Levels show up here after a few tries with many mistakes.', 'Belum ada yang menonjol. Level muncul di sini setelah beberapa percobaan dengan banyak kesalahan.') + '</p>') + '</div>';

    // The slips behind wrong answers, for the worlds that record them: the two seen most often, at least three times.
    const slipRows = WORLDS.filter((w) => SLIPS[w.id]).map((w) => {
      const seen = {};
      Object.entries(log).filter(([k]) => k.split('/')[1] === w.id).forEach(([, L]) => Object.entries(L.slips || {}).forEach(([t, n]) => { seen[t] = (seen[t] || 0) + n; }));
      return { w, top: Object.entries(seen).filter(([t, n]) => n >= 3 && SLIPS[w.id][t]).sort((a, b) => b[1] - a[1]).slice(0, 2) };
    }).filter((x) => x.top.length);
    if (slipRows.length) {
      h += '<div class="box"><h3>' + tx('Common slips', 'Kesalahan yang sering') + '</h3><ul class="plist2">' + slipRows.map((x) => x.top.map(([t, n]) => '<li><b>' + x.w.name + '</b>: ' + SLIPS[x.w.id][t]
        + ' <span class="muted">(' + n + tx(' times', ' kali') + ')</span></li>').join('')).join('') + '</ul></div>';
    }

    // Suggestions.
    const tips = [];
    const curGot = perWorld.reduce((a, x) => a + x.got, 0), curMax = perWorld.reduce((a, x) => a + x.max, 0);
    const up = DIFFS[TIERS[TIERS.indexOf(p.diff) + 1]] ? DIFFS[TIERS[TIERS.indexOf(p.diff) + 1]].name : '';
    if (up && all.n >= 20 && all.g / all.n >= 0.85 && curGot >= curMax * 0.6) tips.push(tx('Most answers are right the first time and many stars are collected. ' + up + ' may be a good next step.', 'Sebagian besar jawaban benar di percobaan pertama dan banyak bintang terkumpul. ' + up + ' mungkin langkah berikutnya yang bagus.'));
    if (p.diff !== 'easy' && all.n >= 15 && all.g / all.n < 0.5) tips.push(tx('Many puzzles need several tries. A lower difficulty can keep it fun while the ideas settle.', 'Banyak teka-teki butuh beberapa percobaan. Tingkat yang lebih rendah bisa menjaga keseruan sambil ide-idenya mengendap.'));
    const notYet = perWorld.filter((x) => !x.n && !x.got).map((x) => x.w.name);
    if (notYet.length && notYet.length < WORLDS.length) tips.push(tx('Not tried yet: ' + notYet.join(', ') + '. Each world trains a different thinking skill.', 'Belum dicoba: ' + notYet.join(', ') + '. Setiap dunia melatih keterampilan berpikir yang berbeda.'));
    const weak = perWorld.filter((x) => x.st.cls === 'low');
    weak.forEach((x) => tips.push(x.w.kind === 'robot'
      ? x.w.name + tx(': plan the path together before pressing Run. Tracing it with a finger on the screen helps.', ': rencanakan jalannya bersama sebelum menekan Jalankan. Menelusurinya dengan jari di layar membantu.')
      : x.w.name + tx(': play it together and ask "what do you notice?" before choosing.', ': mainkan bersama dan tanyakan "apa yang kamu lihat?" sebelum memilih.')));
    if (all.h >= 5 && all.h > all.n * 0.2) tips.push(tx('Hints are used often. Encourage one more try before tapping 💡.', 'Petunjuk sering dipakai. Ajak mencoba sekali lagi sebelum mengetuk 💡.'));
    if (!week && all.n) tips.push(tx('No puzzles this week. Five to ten minutes a day works better than one long session.', 'Tidak ada teka-teki minggu ini. Lima sampai sepuluh menit sehari lebih baik daripada satu sesi panjang.'));
    if (!all.n) tips.push(tx('No games played since this summary was added. Details appear here as ' + esc(kid.name) + ' plays.', 'Belum ada permainan sejak ringkasan ini ditambahkan. Rinciannya muncul di sini saat ' + esc(kid.name) + ' bermain.'));
    h += '<div class="box"><h3>' + tx('Tips', 'Saran') + '</h3>' + (tips.length ? '<ul class="tips">' + tips.map((t) => '<li>' + t + '</li>').join('') + '</ul>' : '<p class="muted">' + tx('All good! Keep playing a little every day.', 'Semua baik! Teruslah bermain sedikit setiap hari.') + '</p>') + '</div>';

    h += '<div class="box about2"><details><summary>' + tx('What each world trains', 'Apa yang dilatih tiap dunia') + '</summary><dl>'
      + WORLDS.map((w) => '<dt>' + w.icon + ' ' + w.name + ' · ' + w.skill + '</dt><dd>' + SKILL_INFO[w.id] + '</dd>').join('') + '</dl></details></div>';
    h += '<div class="box"><p class="muted">' + tx('Time played, the daily time limit and the other Cendekia apps are on the <a href="../parents/">parents\' page for all apps</a>.', 'Waktu bermain, batas waktu harian, dan aplikasi Cendekia lainnya ada di <a href="../parents/">halaman orang tua untuk semua aplikasi</a>.') + '</p></div>';
    h += '<p class="muted">' + tx('Everything stays on this device. Details are counted from the first game after this summary was added; earlier stars are included.', 'Semuanya tersimpan di perangkat ini. Rincian dihitung sejak permainan pertama setelah ringkasan ini ditambahkan; bintang sebelumnya ikut dihitung.') + '</p>';

    const rep = $('rep');
    rep.innerHTML = h;
    rep.querySelectorAll('.pchips button').forEach((b) => b.addEventListener('click', () => { viewed = b.dataset.id; renderReport(); }));
    $('repEdit').addEventListener('click', () => openForm(kid.id));
  }

  function play(w, i) {
    if (!CD.gate()) return; // the parent's daily time limit
    curWorld = w; markDay(); save();
    if (w.kind === 'robot') startRobot(w, i); else startQuiz(w, i);
  }

  // ---- How to play: three short animated steps for each world ----
  const blkD = (d) => '<span class="blk ' + d + '">' + arrowSvg + '</span>';
  const TUTOR = () => ({
    robot: [
      ['<div class="demo d-pop">' + blkD('R') + blkD('R') + blkD('D') + '</div>', tx('Tap the arrows to build a program.', 'Ketuk panah untuk menyusun program.')],
      ['<div class="demo d-tap"><span class="btn go">' + tx('▶ Run', '▶ Jalankan') + '</span><span class="hand">👆</span></div>', tx('Press ▶ Run.', 'Tekan ▶ Jalankan.')],
      ['<div class="demo d-walk"><span class="track"></span>' + pokaSvg('happy') + '<span class="flagd">🚩</span></div>', tx('Poka follows your program. Reach the flag!', 'Poka mengikuti programmu. Capai benderanya!')],
      ['<div class="demo d-pop"><span class="blk loopBtn" style="--c:var(--loop)">🔁</span><span class="blk F">★</span><span class="blk ifBtn" style="--c:#f59e0b"><span class="ytile"></span></span></div>',
        tx('Later: 🔁 repeats blocks, the teal 🔁 repeats until the flag or a number of gems, ★ is a function you build once and use again, and the yellow block checks the tile.', 'Nanti: 🔁 mengulang balok, 🔁 hijau toska mengulang sampai bendera atau sejumlah permata, ★ adalah fungsi yang kamu buat sekali dan dipakai lagi, dan balok kuning memeriksa petak.')]
    ],
    patterns: [
      ['<div class="demo"><span class="seqd">' + [0, 1, 0].map((k) => itemSvg(it('circle', k ? 'blue' : 'red'))).join('') + '<span class="q">?</span></span></div>', tx('Look at the row. What repeats?', 'Lihat barisnya. Apa yang berulang?')],
      ['<div class="demo d-fly"><span class="flyme">' + itemSvg(it('circle', 'blue')) + '</span></div>', tx('Tap the one that comes next or fills the gap.', 'Ketuk yang berikutnya atau yang mengisi bagian kosong.')]
    ],
    machine: [
      ['<div class="demo d-machine"><span class="in">' + itemSvg(it('star', 'red')) + '</span>' + MACHINE.replace('class="machine"', 'class="machine on"') + '<span class="out">' + itemSvg(it('star', 'blue')) + '</span></div>',
        tx('Watch what the machine does to each thing.', 'Perhatikan apa yang dilakukan mesin pada tiap benda.')],
      ['<div class="demo"><span class="seqd">' + itemSvg(it('heart', 'red')) + '<b>→</b><span class="q">?</span></span></div>', tx('Use the same rule: what comes out next?', 'Pakai aturan yang sama: apa yang keluar berikutnya?')]
    ],
    balance: [
      ['<div class="demo d-tilt"><span class="beam2"><span class="l">' + itemSvg(it('circle', 'red')) + '</span><span class="r">' + itemSvg(it('circle', 'blue')) + '</span></span></div>', tx('The side that goes down is heavier.', 'Sisi yang turun lebih berat.')],
      ['<div class="demo d-tilt level"><span class="beam2"><span class="l">' + itemSvg(it('circle', 'green')) + '</span><span class="r">' + itemSvg(it('circle', 'yellow')) + '</span></span></div>', tx('A level scale means the same weight.', 'Timbangan yang datar berarti beratnya sama.')],
      ['<div class="demo">⚖️⚖️⚖️</div>', tx('Put all the scales together to find the heaviest or lightest.', 'Gabungkan semua timbangan untuk mencari yang paling berat atau paling ringan.')]
    ],
    debug: [
      ['<div class="demo">' + blkD('R') + '<span class="blk R bad">' + arrowSvg + '</span>' + blkD('D') + '</div>', tx('One block in the program is wrong.', 'Satu balok di program itu salah.')],
      ['<div class="demo d-tap"><span class="btn go">' + tx('▶ Run', '▶ Jalankan') + '</span><span class="hand">👆</span></div>', tx('Run it and see where Poka goes wrong.', 'Jalankan dan lihat di mana Poka salah jalan.')],
      ['<div class="demo d-pop">' + blkD('U') + blkD('L') + blkD('R') + blkD('D') + '</div>', tx('Tap the wrong block, then pick the right one.', 'Ketuk balok yang salah, lalu pilih yang benar.')]
    ],
    filter: [
      ['<div class="demo"><span class="chip"><i class="sw" style="background:#ef4444"></i>' + tx('red', 'merah') + '</span></div>', tx('Read the rule.', 'Baca aturannya.')],
      ['<div class="demo d-sel"><span class="thingd on">' + itemSvg(it('circle', 'red')) + '</span><span class="thingd">' + itemSvg(it('star', 'blue')) + '</span><span class="thingd on">' + itemSvg(it('heart', 'red')) + '</span></div>',
        tx('Tap every item that fits.', 'Ketuk semua benda yang cocok.')],
      ['<div class="demo"><span class="btn go">' + tx('✓ Check', '✓ Periksa') + '</span></div>', tx('Then press ✓ Check.', 'Lalu tekan ✓ Periksa.')]
    ],
    code: [
      ['<div class="demo"><div class="bits"><div>0110</div><div>1001</div></div>' + pixHtml([[0, 1, 1, 0], [1, 0, 0, 1]], 'small') + '</div>', tx('In a picture code, 1 is a filled square and 0 an empty one.', 'Dalam kode gambar, 1 adalah kotak terisi dan 0 kotak kosong.')],
      ['<div class="demo">' + bulbHtml(4, 1) + bulbHtml(2, 0) + bulbHtml(1, 1) + '</div>', tx('Add the numbers under the lit bulbs: 4 + 1 = 5.', 'Jumlahkan angka di bawah lampu yang menyala: 4 + 1 = 5.')],
      ['<div class="demo"><span class="secret">DBU</span><b>→</b><span class="secret plain">CAT</span></div>', tx('In a secret message, every letter moves along the alphabet. Move it back to read it.', 'Dalam pesan rahasia, setiap huruf bergeser di alfabet. Geser balik untuk membacanya.')]
    ],
    sudoku: [
      ['<div class="demo"><div class="sdk" style="--n:3">' + [0, 1, 2, 1, 2, 0, 2, 0, -1].map((v) => '<span' + (v < 0 ? ' class="q">?' : '>' + itemSvg(SYMS[v])) + '</span>').join('') + '</div></div>',
        tx('Every row and every column has each shape once. Which one is missing?', 'Setiap baris dan kolom berisi tiap bentuk satu kali. Mana yang hilang?')],
      ['<div class="demo"><div class="sdkPal"><button type="button" tabindex="-1">' + itemSvg(SYMS[1]) + '</button><button type="button" tabindex="-1">' + itemSvg(SYMS[2]) + '</button></div></div>',
        tx('Tap a gap, then tap the shape that goes there.', 'Ketuk bagian kosong, lalu ketuk bentuk yang cocok di sana.')],
      ['<div class="demo"><span class="btn go">' + tx('✓ Check', '✓ Periksa') + '</span></div>', tx('When every gap is full, press ✓ Check.', 'Kalau semua bagian kosong sudah terisi, tekan ✓ Periksa.')]
    ],
    clues: [
      ['<div class="demo"><span class="clue"><span class="n">1</span>' + tx('Leo does not have the 🐱', 'Leo tidak punya 🐱') + '</span></div>', tx('Read every clue.', 'Baca setiap petunjuk.')],
      ['<div class="demo">👧<b>→</b>🐶</div>', tx('Tap a friend, then the pet that belongs to them.', 'Ketuk seorang teman, lalu hewan peliharaan miliknya.')],
      ['<div class="demo"><span class="btn go">' + tx('✓ Check', '✓ Periksa') + '</span></div>', tx('When everyone has a pet, press ✓ Check.', 'Kalau semua sudah punya hewan peliharaan, tekan ✓ Periksa.')]
    ],
    train: [
      ['<div class="demo"><div class="train" style="--n:4"><span class="engine">🚂</span><span class="wagon">3</span><span class="wagon">1</span><span class="wagon">2</span></div></div>', tx('The wagons are mixed up.', 'Gerbongnya tercampur.')],
      ['<div class="demo"><div class="train" style="--n:3"><span class="wagon sel">3</span><span class="wagon">1</span></div><b>⇄</b></div>', tx('Tap two wagons side by side to swap them.', 'Ketuk dua gerbong yang bersebelahan untuk menukarnya.')],
      ['<div class="demo"><div class="train" style="--n:4"><span class="engine">🚂</span><span class="wagon done">1</span><span class="wagon done">2</span><span class="wagon done">3</span></div></div>', tx('Every swap should fix the order. Use as few swaps as you can.', 'Setiap tukar harus memperbaiki urutan. Pakai tukaran sesedikit mungkin.')]
    ],
    hanoi: [
      ['<div class="demo">' + miniTower([[0, 1], [], []], 2) + '<b>→</b>' + miniTower([[], [], [0, 1]], 2) + '</div>', tx('Move the whole tower to the 🏁 peg, one disk at a time.', 'Pindahkan seluruh menara ke tiang 🏁, satu cakram setiap kali.')],
      ['<div class="demo">' + miniTower([[1], [0], []], 2) + '</div>', tx('Tap a peg to lift its top disk, then tap the peg to put it on.', 'Ketuk tiang untuk mengangkat cakram teratasnya, lalu ketuk tiang tujuan untuk menaruhnya.')],
      ['<div class="demo">' + miniTower([[], [0], [1]], 2) + '</div>', tx('A big disk never sits on a small one. Use the middle peg to make room!', 'Cakram besar tidak boleh di atas cakram kecil. Pakai tiang tengah untuk memberi ruang!')]
    ],
    park: [
      ['<div class="demo">' + parkMini(4, [{ v: true, f: 1, len: 2 }, { v: false, f: 2, len: 2 }], [0, 0]) + '</div>', tx('The 🚓 police car wants to drive out of the exit at the bottom. But another car is in the way.', 'Mobil polisi 🚓 ingin keluar lewat pintu di bawah. Tapi ada mobil lain yang menghalangi.'), 'stack'],
      ['<div class="demo">' + parkMini(4, [{ v: true, f: 1, len: 2 }, { v: false, f: 2, len: 2 }], [0, 0], 1, [[2, 2], [3, 2]]) + '</div>', tx('Tap a car, then tap a dot to slide it there. A car only goes straight, forward or back.', 'Ketuk mobil, lalu ketuk titik untuk menggesernya ke sana. Mobil hanya jalan lurus, maju atau mundur.'), 'stack'],
      ['<div class="demo">' + parkMini(4, [{ v: true, f: 1, len: 2 }, { v: false, f: 2, len: 2 }], [2, 2]) + '</div>', tx('Clear the way and the police car drives out. The fewer moves, the better!', 'Bersihkan jalannya dan mobil polisi keluar. Makin sedikit gerakan, makin bagus!'), 'stack']
    ],
    maze: [
      ['<div class="demo">' + mzMini(MZ_DEMO, 0, [0], 8) + '</div>', tx('Poka wants to go home 🏠. The brown lines are walls. Poka cannot walk through them.', 'Poka ingin pulang 🏠. Garis cokelat adalah dinding. Poka tidak bisa menembusnya.'), 'stack'],
      ['<div class="demo">' + mzMini(MZ_DEMO, 4, [0, 1, 4], 8) + '</div>', tx('Tap the arrows, or the next square, to walk. This way ends at a wall: a dead end. Walk back and try another way!', 'Ketuk panah, atau kotak berikutnya, untuk berjalan. Jalan ini berakhir di dinding: jalan buntu. Jalan mundur dan coba jalan lain!'), 'stack'],
      ['<div class="demo">' + mzMini(MZ_DEMO, 8, [0, 1, 2, 5], 8) + '</div>', tx('Poka is home! Look ahead before you step: fewer steps is better.', 'Poka sudah di rumah! Lihat ke depan sebelum melangkah: makin sedikit langkah, makin bagus.'), 'stack']
    ],
    pack: [
      ['<div class="demo"><div class="pouches">' + pouchHtml(0, 3) + pouchHtml(1, 1) + '</div></div>', tx('The backpack has pockets, and each pocket holds a number of things. Here: 3 🍎 and 1 🍪.', 'Ransel punya kantong, dan tiap kantong berisi sejumlah benda. Di sini: 3 🍎 dan 1 🍪.')],
      ['<div class="demo">' + progHtml([{ op: 'add', p: 0, v: 2 }, { op: 'take', p: 1, v: 1 }]) + '</div>', tx('A program is a list of steps. Do them from the top, one at a time. Tap a step to hear what it does.', 'Program adalah daftar langkah. Kerjakan dari atas, satu per satu. Ketuk langkah untuk mendengar apa yang dilakukannya.')],
      ['<div class="demo"><div class="pouches">' + pouchHtml(0, 5) + pouchHtml(1, 0) + '</div></div>', tx('After every step the numbers change. What is in the pocket at the end? 📖 Steps explains Put, Add, Take and Copy.', 'Setelah tiap langkah angkanya berubah. Apa isi kantong di akhir? 📖 Langkah menjelaskan Taruh, Tambah, Ambil, dan Salin.')],
      ['<div class="demo"><span class="pb pbtn add">' + tx('➕ Add 1 to 🍎', '➕ Tambah 1 ke 🍎') + '</span> <span class="pb pbtn take">' + tx('➖ Take 1 from 🍎', '➖ Ambil 1 dari 🍎') + '</span></div>', tx('Later you build the steps yourself: tap blocks, then press ▶ Run.', 'Nanti kamu menyusun langkahnya sendiri: ketuk balok, lalu tekan ▶ Jalankan.')],
      ['<div class="demo"><span class="pb pbtn take">' + tx('➖ Take 5 from 🍎', '➖ Ambil 5 dari 🍎') + '</span></div>', tx('Sometimes a program has one wrong step. Pick the change that makes it come out right.', 'Kadang program punya satu langkah yang salah. Pilih perubahan yang membuat hasilnya benar.')]
    ],
    circuit: [
      ['<div class="demo circ">' + cDemo({ t: 'in', i: 0 }, [true], true) + '</div>', tx('A switch is ON or OFF. When it is ON, power flows along the wire.', 'Saklar bisa MENYALA atau MATI. Kalau MENYALA, listrik mengalir lewat kabel.')],
      ['<div class="demo circ">' + cDemo({ t: 'and', a: { t: 'in', i: 0 }, b: { t: 'in', i: 1 } }, [true, false], true) + '</div>',
        tx('A gate decides. AND needs both wires to have power, OR needs at least one, and NOT flips it.', 'Gerbang menentukan. DAN butuh kedua kabel berlistrik, ATAU butuh paling sedikit satu, dan BUKAN membaliknya.')],
      ['<div class="demo circ">' + cDemo({ t: 'or', a: { t: 'in', i: 0 }, b: { t: 'in', i: 1 } }, [true, false], false) + '</div>', tx('Will the lamp shine? Follow the wires, then press ✓ Check.', 'Akankah lampunya menyala? Ikuti kabelnya, lalu tekan ✓ Periksa.')],
      ['<div class="demo circ">' + cDemo({ t: 'blank', slot: 0, a: { t: 'in', i: 0 }, b: { t: 'in', i: 1 } }, [false, false], false, true) + '</div>',
        tx('Later a gate is missing. Tap the ? box to choose a gate that makes the lamp shine just like the table says. 📖 Gates tells you about each one.', 'Nanti ada gerbang yang hilang. Ketuk kotak ? untuk memilih gerbang yang membuat lampu menyala sesuai tabel. 📖 Gerbang menjelaskan tiap gerbang.')]
    ]
  });
  function tutorial(w) {
    S.seen[w.id] = true; save();
    const steps = TUTOR()[w.id].filter((st, k) => !(w.id === 'robot' && k === 3 && S.diff === 'easy'));
    openSheet(tx('How to play: ', 'Cara bermain: ') + w.name, steps);
  }
  // Numbered steps, each with a picture and a sentence: the Arc bottom sheet when the bundle is loaded, the plain dialog otherwise.
  function openSheet(title, steps) {
    $('tuTitle').textContent = title;
    const list = steps.map(([demo, text, cls], k) => '<li' + (cls ? ' class="' + cls + '"' : '') + '><span class="n">' + (k + 1) + '</span>' + demo + '<p>' + text + '</p></li>').join('');
    loadUI().then((ok) => {
      if (ok) {
        window.LogicaUI.sheet({ title, html: '<ol class="tsteps">' + list + '</ol>', closeText: tx("Let's play!", 'Ayo bermain!'), onClose: () => sfx.tap() });
        return;
      }
      $('tuSteps').innerHTML = list;
      $('tutor').hidden = false;
      $('tuGo').focus();
    });
  }
  $('tuGo').addEventListener('click', () => { $('tutor').hidden = true; sfx.tap(); });

  function mood(svg, m) {
    svg.dataset.mood = '';
    void svg.getBoundingClientRect();
    svg.dataset.mood = m;
    // The robot on the board has its own CSS animations and is flipped with scaleX(-1), so only the coaches hop here.
    if (!svg.closest('.bot')) Cendekia.fx.react(svg, m);
  }

  // =====================================================================
  // Robot: programs on a grid
  // =====================================================================
  // A program is a list of blocks: an arrow {t: 'U'}, a repeat {t: 'loop', n, body}, an if {t: 'if', a, b}
  // (Poka goes a on a yellow tile and b anywhere else) or a call of the function {t: 'F'}. The function is a
  // second list. A repeat cannot hold another repeat, and the function cannot call itself.
  const DIR = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const ARROWS = ['U', 'L', 'R', 'D'], COUNTS = [2, 3, 4, 5, 6, 7, 8, 9];
  function parseMap(rows) {
    const lv = { w: rows[0].length, h: rows.length, cells: rows.map((r) => [...r]), gems: [] };
    rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === 'R') lv.start = { x, y };
      if (ch === 'F') lv.goal = { x, y };
      if (ch === '*') lv.gems.push(x + ',' + y);
    }));
    return lv;
  }
  function parseList(s) {
    const out = [];
    for (let i = 0; i < s.length;) {
      const ch = s[i];
      if (/\d/.test(ch)) {
        const end = s.indexOf(')', i);
        out.push({ t: 'loop', n: +ch, body: parseList(s.slice(i + 2, end)) });
        i = end + 1;
      } else if (ch === '{') {
        // {F}(RD) repeats R D until Poka is at the flag; {2}(R) repeats R until two gems are collected.
        const close = s.indexOf('}', i), cond = s.slice(i + 1, close), end = s.indexOf(')', close);
        out.push({ t: 'until', c: cond === 'F' ? 'F' : +cond, body: parseList(s.slice(close + 2, end)) });
        i = end + 1;
      } else if (ch === '?') { out.push({ t: 'if', a: s[i + 1], b: s[i + 2] }); i += 3; }
      else { out.push({ t: ch }); i++; }
    }
    return out;
  }
  const parseProg = (s) => { const [main, fn] = s.split('|'); return { prog: parseList(main), fn: parseList(fn || '') }; };
  const hasBody = (b) => b.t === 'loop' || b.t === 'until';
  const count = (list) => list.reduce((n, b) => n + (hasBody(b) ? 1 + count(b.body) : 1), 0);
  const blocks = () => count(R.prog) + count(R.fn);
  const blocked = (lv, x, y) => x < 0 || y < 0 || x >= lv.w || y >= lv.h || lv.cells[y][x] === '#' || lv.cells[y][x] === '~';
  // Runs a program without drawing it. Each step lists the ids of the blocks to light up:
  // m3 is the fourth block of the program, m3.1 the second block inside it, f0 the first block of the function,
  // and m2a / m2b the arrow an if block took.
  function execute(lv, prog, fn) {
    let x = lv.start.x, y = lv.start.y, end = null;
    const got = new Set(), trace = [];
    const move = (d, hl) => {
      if (!d) return false;
      if (trace.length >= 300) { end = 'short'; return true; }
      const nx = x + DIR[d][0], ny = y + DIR[d][1];
      if (blocked(lv, nx, ny)) { trace.push({ d, x, y, bump: true, hl }); end = 'bump'; return true; }
      x = nx; y = ny;
      const k = x + ',' + y, gem = lv.gems.includes(k) && !got.has(k);
      if (gem) got.add(k);
      trace.push({ d, x, y, gem, hl });
      if (x === lv.goal.x && y === lv.goal.y && got.size === lv.gems.length) { end = 'win'; return true; }
      return false;
    };
    const run = (list, pre, hl) => {
      for (let i = 0; i < list.length; i++) {
        const b = list[i], id = pre + i, h = hl.concat(id);
        if (b.t === 'loop') { for (let r = 0; r < b.n; r++) if (run(b.body, id + '.', h)) return true; }
        else if (b.t === 'until') {
          const done = () => (b.c === 'F' ? x === lv.goal.x && y === lv.goal.y : got.size >= b.c);
          for (let r = 0; r < 60 && b.body.length && !done(); r++) if (run(b.body, id + '.', h)) return true;
        }
        else if (b.t === 'F') { if (run(fn, 'f', h)) return true; }
        else if (b.t === 'if') { const yes = lv.cells[y][x] === 'y'; if (move(yes ? b.a : b.b, h.concat(id + (yes ? 'a' : 'b')))) return true; }
        else if (move(b.t, h)) return true;
      }
      return false;
    };
    run(prog, 'm', []);
    if (!end) end = x === lv.goal.x && y === lv.goal.y ? 'gems' : 'short';
    return { trace, end };
  }
  // Fewest moves to collect every gem and reach the flag, as a string of arrows (breadth-first search).
  function shortestPath(lv) {
    const all = (1 << lv.gems.length) - 1, seen = new Set([lv.start.x + ',' + lv.start.y + ',0']);
    let frontier = [[lv.start.x, lv.start.y, 0, '']];
    while (frontier.length) {
      const next = [];
      for (const [x, y, m, path] of frontier) {
        if (x === lv.goal.x && y === lv.goal.y && m === all) return path;
        for (const d of ARROWS) {
          const nx = x + DIR[d][0], ny = y + DIR[d][1];
          if (blocked(lv, nx, ny)) continue;
          const g = lv.gems.indexOf(nx + ',' + ny), nm = g < 0 ? m : m | (1 << g), k = nx + ',' + ny + ',' + nm;
          if (!seen.has(k)) { seen.add(k); next.push([nx, ny, nm, path + d]); }
        }
      }
      frontier = next;
    }
    return null;
  }
  // A random walk becomes the road; the cells around it turn into rocks and water.
  function randomLevel(diff) {
    const [w, h, lmin, lmax, ngems] = { easy: [4, 3, 3, 5, 0], medium: [5, 4, 5, 8, 1], hard: [6, 5, 8, 12, 2], veryhard: [7, 6, 12, 18, 3], extreme: [8, 7, 16, 24, 4] }[diff];
    for (;;) {
      let x = rnd(0, w - 1), y = rnd(0, h - 1);
      const L = rnd(lmin, lmax), road = [[x, y]], seen = new Set([x + ',' + y]);
      while (road.length <= L) {
        const opts = Object.values(DIR).map(([dx, dy]) => [x + dx, y + dy])
          .filter(([a, b]) => a >= 0 && b >= 0 && a < w && b < h && !seen.has(a + ',' + b));
        if (!opts.length) break;
        [x, y] = pick(opts); seen.add(x + ',' + y); road.push([x, y]);
      }
      if (road.length <= L) continue;
      const cells = Array.from({ length: h }, () => Array(w).fill('.'));
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (!seen.has(xx + ',' + yy) && Math.random() < 0.5) cells[yy][xx] = pick(['#', '~']);
      shuffle(road.slice(1, -1)).slice(0, ngems).forEach(([a, b]) => { cells[b][a] = '*'; });
      cells[road[0][1]][road[0][0]] = 'R';
      cells[y][x] = 'F';
      const map = cells.map((r) => r.join('')), sol = shortestPath(parseMap(map));
      if (sol && sol.length >= lmin) return { name: tx('Random map', 'Peta acak'), map, sol, tools: diff === 'easy' ? '' : 'loop' };
    }
  }
  // Changes one block of a working program so that it fails, and marks it for the hint.
  function makeBug(lv, prog, fn) {
    for (let tries = 0; tries < 100; tries++) {
      const p = clone(prog), f = clone(fn), slots = [];
      const collect = (list) => list.forEach((b) => {
        if (b.t === 'loop') { slots.push({ loop: b }); collect(b.body); }
        else if (b.t === 'until') collect(b.body);
        else if (b.t === 'if') slots.push({ iff: b, slot: 'a' }, { iff: b, slot: 'b' });
        else if (b.t !== 'F') slots.push({ cmd: b });
      });
      collect(p); collect(f);
      const s = pick(slots);
      if (s.loop) { s.loop.n = pick(COUNTS.filter((n) => n !== s.loop.n)); s.loop.bug = 'n'; }
      else if (s.iff) { s.iff[s.slot] = pick(ARROWS.filter((d) => d !== s.iff[s.slot])); s.iff.bug = s.slot; }
      else { s.cmd.t = pick(ARROWS.filter((d) => d !== s.cmd.t)); s.cmd.bug = true; }
      if (execute(lv, p, f).end !== 'win') return { prog: p, fn: f };
    }
    return { prog: clone(prog), fn: clone(fn) };
  }

  let R = null;
  // i is the level number, or -1 for a random map, which comes as `def`.
  function startRobot(w, i, def) {
    def = def || robotLevels(w.id, S.diff)[i];
    const sol = parseProg(def.sol), tools = def.tools || '';
    R = { t0: Date.now(), w, i, def, lv: parseMap(def.map), debug: w.id === 'debug', prog: [], fn: [], target: null, fails: 0, edits: 0,
          runs: 0, hints: 0, running: false, max: def.max || 0, sol, tools, sel: null, showBug: false };
    R.par = count(sol.prog) + count(sol.fn);
    if (R.max && S.diff === 'veryhard') R.max = Math.max(R.par, R.max - 1);
    if (R.max && S.diff === 'extreme') R.max = R.par;
    if (R.debug) { const b = makeBug(R.lv, sol.prog, sol.fn); R.prog = b.prog; R.fn = b.fn; R.orig = clone(b); }
    $('rTitle').textContent = w.name;
    $('rLevel').textContent = def.custom ? '🛠️' : i < 0 ? '🎲' : tx('Level ', 'Level ') + (i + 1);
    $('rBack').textContent = def.custom ? tx('← Map Maker', '← Pembuat Peta') : tx('← Levels', '← Level');
    $('rUndo').hidden = $('rClear').hidden = R.debug;
    $('rReset').hidden = !R.debug;
    $('rHint').hidden = true;
    $('fixbar').hidden = true; $('ghost').hidden = true;
    show('robot');
    buildBoard(); renderTray(); renderPalette();
    mood($('rCoach'), 'happy');
    robotIntro();
  }
  function robotIntro() {
    const t = R.tools;
    const p = R.debug ? P.debug : R.def.custom ? P.custom : R.i < 0 ? P.random : t.includes('until') ? P.robotUntil : t.includes('if') ? P.robotIf : t.includes('fn') ? P.robotFn
      : t.includes('loop') && R.max ? P.robotLoop : R.lv.gems.length ? P.robotGem : P.robot;
    $('rSay').textContent = p + (R.max ? tx(' (' + R.max + ' blocks at most)', ' (paling banyak ' + R.max + ' balok)') : '');
  }
  function rSay(text, m) {
    $('rSay').textContent = text;
    if (m) mood($('rCoach'), m);
  }
  $('rBack').addEventListener('click', () => show(R && R.def.custom ? 'maker' : 'world'));

  const TILE = {
    rock: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M14 78 Q8 56 24 42 Q30 22 52 22 Q74 20 82 40 Q96 54 88 76 Q82 88 50 88 Q20 88 14 78Z" fill="#9aa3b2"/><path d="M28 46 Q36 34 50 34" stroke="#c6ccd6" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M14 78 Q50 92 88 76 Q82 88 50 88 Q20 88 14 78Z" fill="#7c8596"/></svg>',
    gem: '<svg class="gem" viewBox="0 0 100 100" aria-hidden="true"><path d="M30 18 L70 18 L90 40 L50 88 L10 40 Z" fill="#2fd1c5"/><path d="M10 40 L90 40 L70 18 L30 18Z" fill="#7ff0e6"/><path d="M38 40 L50 88 L62 40Z" fill="#1fb3a8"/><circle cx="72" cy="14" r="5" fill="#fff"/></svg>',
    flag: '<svg class="flag" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="88" rx="26" ry="7" fill="rgba(0,0,0,.15)"/><rect x="30" y="10" width="7" height="80" rx="3" fill="#6b4f2a"/><path class="cloth" d="M37 12 L84 26 L37 42 Z" fill="#ef4444"/></svg>'
  };
  let botEl = null, gemEls = {};
  function buildBoard() {
    const lv = R.lv, b = $('board');
    b.style.setProperty('--w', lv.w);
    b.innerHTML = ''; gemEls = {};
    for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
      const ch = lv.cells[y][x], c = document.createElement('div');
      c.className = 'cell' + ((x + y) % 2 ? ' alt' : '') + (ch === '~' ? ' water' : '') + (ch === 'y' ? ' yellow' : '');
      c.dataset.k = x + ',' + y;
      if (ch === '#') c.innerHTML = TILE.rock;
      if (ch === '*') { c.innerHTML = TILE.gem; gemEls[x + ',' + y] = c.firstChild; }
      if (ch === 'F') c.innerHTML = TILE.flag;
      b.appendChild(c);
    }
    botEl = document.createElement('div');
    botEl.className = 'bot';
    botEl.innerHTML = pokaSvg('happy');
    b.appendChild(botEl);
    Cendekia.fx.mascot(botEl.firstChild); // its ears sway; the body is moved by the board's CSS
    resetBot();
  }
  function placeBot(x, y) { botEl.style.setProperty('--x', x); botEl.style.setProperty('--y', y); }
  // Gems collected so far, under the board, for maps with gems.
  function gemCount(n) {
    const g = $('gemCount'), total = R.lv.gems.length;
    g.hidden = !total;
    const sp = g.firstChild;
    sp.textContent = '💎 ' + n + ' / ' + total;
    sp.setAttribute('aria-label', n + ' of ' + total + ' gems');
    if (n) { sp.classList.remove('pop'); void sp.offsetWidth; sp.classList.add('pop'); }
  }
  function resetBot() {
    gemCount(0);
    placeBot(R.lv.start.x, R.lv.start.y);
    botEl.className = 'bot';
    mood(botEl.firstChild, 'happy');
    Object.values(gemEls).forEach((g) => g.classList.remove('got'));
    $('board').querySelectorAll('.trail').forEach((c) => c.classList.remove('trail'));
  }

  // =====================================================================
  // Map Maker
  // =====================================================================
  // The child places Poka, the flag, rocks, water and gems. Poka checks the map with the same search the levels
  // use, so only a map that can be done can be played, saved or shared. Saved maps belong to the child (S.maps,
  // twelve at most). A shared link carries the map in the address: #map=40010-01105 is one digit per square
  // (0 grass, 1 rock, 2 water, 3 gem, 4 Poka, 5 flag) and a dash between rows.
  const MK_SIZES = { small: [4, 3], medium: [5, 4], big: [6, 5] };
  const MK_CODE = '.#~*RF', MK_GEMS = 3, MK_MAX = 12;
  const MK_TOOLS = [
    { ch: 'R', name: 'Poka', pic: () => pokaSvg('happy') }, { ch: 'F', name: tx('Flag', 'Bendera'), pic: () => TILE.flag },
    { ch: '#', name: tx('Rock', 'Batu'), pic: () => TILE.rock }, { ch: '~', name: tx('Water', 'Air'), pic: () => '<span class="sw water"></span>' },
    { ch: '*', name: tx('Gem', 'Permata'), pic: () => TILE.gem }, { ch: '.', name: tx('Grass', 'Rumput'), pic: () => '<span class="sw grass"></span>' }
  ];
  const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
  const M = { cells: null, tool: 'R', editing: null };
  const mkRows = () => M.cells.map((r) => r.join(''));
  const mkCount = (ch) => M.cells.flat().filter((c) => c === ch).length;
  const mkSay = (t, m) => { $('mkSay').textContent = t; if (m) mood($('mkCoach'), m); };
  // The fewest moves for the map as it is, or null.
  function mkCheck() {
    if (!mkCount('R') || !mkCount('F')) return null;
    return shortestPath(parseMap(mkRows()));
  }
  function mkStatus() {
    const sol = mkCheck();
    ['mkPlay', 'mkSave', 'mkShare'].forEach((id) => { $(id).disabled = !sol; });
    if (!mkCount('R')) mkSay(tx('Pick 🤖 Poka, then tap a square to put Poka on the map.', 'Pilih 🤖 Poka, lalu ketuk kotak untuk menaruh Poka di peta.'));
    else if (!mkCount('F')) mkSay(tx('Now pick 🚩 the flag and put it somewhere.', 'Sekarang pilih 🚩 bendera dan taruh di suatu tempat.'));
    else if (!sol) mkSay(mkCount('*') ? tx('Poka cannot reach the flag and every gem. Clear a way!', 'Poka tidak bisa mencapai bendera dan semua permata. Buka jalan!') : tx('Poka cannot reach the flag. Clear a way!', 'Poka tidak bisa mencapai bendera. Buka jalan!'), 'oops');
    else mkSay(tx('Poka can do it in ' + sol.length + (sol.length === 1 ? ' move' : ' moves') + '! Press ▶ Play, or keep building.', 'Poka bisa melakukannya dalam ' + sol.length + ' langkah! Tekan ▶ Main, atau lanjut membangun.'), 'happy');
    return sol;
  }
  function renderMaker() {
    if (!M.cells) { const [w, h] = MK_SIZES[{ easy: 'small', medium: 'medium' }[S.diff] || 'big']; M.cells = blank(w, h); }
    const w = M.cells[0].length, h = M.cells.length;
    $('mkSizes').innerHTML = Object.entries(MK_SIZES).map(([k, [sw, sh]]) => '<button type="button" data-size="' + k + '" aria-pressed="' + (sw === w && sh === h) + '">'
      + tx(k[0].toUpperCase() + k.slice(1), { small: 'Kecil', medium: 'Sedang', big: 'Besar' }[k]) + ' ' + sw + '×' + sh + '</button>').join('');
    $('mkTools').innerHTML = MK_TOOLS.map((t) => '<button type="button" data-tool="' + esc(t.ch) + '" aria-pressed="' + (t.ch === M.tool) + '">' + t.pic() + t.name + '</button>').join('');
    renderMkBoard();
    renderMkList();
    $('mkLink').hidden = true;
    mkStatus();
  }
  function renderMkBoard() {
    const b = $('mkBoard'), w = M.cells[0].length;
    b.style.setProperty('--w', w);
    b.innerHTML = '';
    M.cells.forEach((row, y) => row.forEach((ch, x) => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'cell' + ((x + y) % 2 ? ' alt' : '') + (ch === '~' ? ' water' : '');
      c.dataset.x = x; c.dataset.y = y;
      c.innerHTML = ch === 'R' ? pokaSvg('happy') : ch === '#' ? TILE.rock : ch === '*' ? TILE.gem : ch === 'F' ? TILE.flag : '';
      c.setAttribute('aria-label', tx('Row ', 'Baris ') + (y + 1) + tx(', square ', ', kotak ') + (x + 1) + ': ' + MK_TOOLS.find((t) => t.ch === ch).name);
      b.appendChild(c);
    }));
  }
  $('mkSizes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-size]'); if (!b) return;
    const [w, h] = MK_SIZES[b.dataset.size], old = M.cells;
    // Squares that still fit keep what is on them.
    M.cells = blank(w, h).map((row, y) => row.map((ch, x) => (old[y] && old[y][x]) || ch));
    sfx.tap(); renderMaker();
  });
  $('mkTools').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tool]'); if (!b) return;
    M.tool = b.dataset.tool; sfx.tap();
    $('mkTools').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  $('mkBoard').addEventListener('click', (e) => {
    const c = e.target.closest('.cell'); if (!c) return;
    const x = +c.dataset.x, y = +c.dataset.y, t = M.tool;
    if (t === '*' && M.cells[y][x] !== '*' && mkCount('*') >= MK_GEMS) { mkSay(tx('Three gems at most. Take one away first.', 'Paling banyak tiga permata. Ambil satu dulu.'), 'oops'); sfx.bad(); return; }
    // There is one Poka and one flag: putting one down moves it.
    if (t === 'R' || t === 'F') M.cells.forEach((row) => row.forEach((ch, xx) => { if (ch === t) row[xx] = '.'; }));
    M.cells[y][x] = M.cells[y][x] === t && t !== '.' ? '.' : t;
    $('mkLink').hidden = true;
    sfx.tap(); renderMkBoard();
    $('mkBoard').children[y * M.cells[0].length + x].classList.add('put');
    mkStatus();
  });
  $('mkClear').addEventListener('click', () => {
    M.cells = blank(M.cells[0].length, M.cells.length); M.editing = null; M.tool = 'R';
    sfx.tap(); renderMaker();
  });
  function mkPlay(rows) {
    const sol = shortestPath(parseMap(rows));
    if (!sol || !CD.gate()) return;
    markDay(); save();
    startRobot(WORLDS[0], -1, { name: tx('My map', 'Petaku'), map: rows, sol, tools: S.diff === 'easy' ? '' : 'loop', custom: true });
  }
  $('mkPlay').addEventListener('click', () => { sfx.tap(); mkPlay(mkRows()); });
  $('mkSave').addEventListener('click', () => {
    if (!mkCheck()) return;
    S.maps = S.maps || [];
    const old = S.maps.find((m) => m.id === M.editing);
    if (old) old.map = mkRows();
    else {
      if (S.maps.length >= MK_MAX) { mkSay(tx('You have ' + MK_MAX + ' maps. Delete one to save a new one.', 'Kamu punya ' + MK_MAX + ' peta. Hapus satu untuk menyimpan yang baru.'), 'oops'); sfx.bad(); return; }
      M.editing = Date.now().toString(36);
      S.maps.push({ id: M.editing, map: mkRows() });
    }
    save(); sfx.good(); renderMkList();
    mkSay(old ? tx('Map saved again!', 'Peta disimpan lagi!') : tx('Saved in My maps!', 'Tersimpan di Peta saya!'), 'cheer');
  });
  const mkCode = (rows) => rows.map((r) => [...r].map((ch) => MK_CODE.indexOf(ch)).join('')).join('-');
  $('mkShare').addEventListener('click', async () => {
    if (!mkCheck()) return;
    const url = location.href.split('#')[0] + '#map=' + mkCode(mkRows());
    const box = $('mkLink');
    box.textContent = url; box.hidden = false;
    sfx.tap();
    if (navigator.share) {
      try { await navigator.share({ title: tx('A Logica map', 'Peta Logica'), text: tx('Can you get Poka to the flag?', 'Bisakah kamu membawa Poka ke bendera?'), url }); return; } catch (e) { /* closed, or not allowed */ }
    }
    try { await navigator.clipboard.writeText(url); mkSay(tx('Link copied! Send it to a friend.', 'Tautan disalin! Kirim ke temanmu.'), 'cheer'); } catch (e) { mkSay(tx('Here is the link. Send it to a friend.', 'Ini tautannya. Kirim ke temanmu.'), 'happy'); }
  });
  function renderMkList() {
    const list = $('mkList'), maps = S.maps || [];
    list.innerHTML = maps.length ? '' : '<p class="mkEmpty">' + tx('No maps yet. Build one and press 💾 Save.', 'Belum ada peta. Buat satu dan tekan 💾 Simpan.') + '</p>';
    maps.forEach((m, k) => {
      const d = document.createElement('div');
      d.className = 'mkItem';
      d.innerHTML = '<div class="mini" style="--w:' + m.map[0].length + '" aria-hidden="true">' + m.map.join('').split('').map((ch) => '<span' + (ch === '~' ? ' class="water"' : '') + '>'
        + ({ R: '🤖', F: '🚩', '#': '🪨', '*': '💎' }[ch] || '') + '</span>').join('') + '</div>'
        + '<div class="row"><button type="button" data-a="play" aria-label="' + tx('Play map ', 'Mainkan peta ') + (k + 1) + '">▶</button>'
        + '<button type="button" data-a="edit" aria-label="' + tx('Change map ', 'Ubah peta ') + (k + 1) + '">✎</button>'
        + '<button type="button" data-a="del" aria-label="' + tx('Delete map ', 'Hapus peta ') + (k + 1) + '">🗑</button></div>';
      d.addEventListener('click', (e) => {
        const a = e.target.closest('[data-a]'); if (!a) return;
        sfx.tap();
        if (a.dataset.a === 'play') mkPlay(m.map);
        if (a.dataset.a === 'edit') { M.cells = m.map.map((r) => [...r]); M.editing = m.id; renderMaker(); window.scrollTo(0, 0); mkSay(tx('Change the map, then press 💾 Save.', 'Ubah petanya, lalu tekan 💾 Simpan.')); }
        if (a.dataset.a === 'del' && confirm(tx('Delete this map?', 'Hapus peta ini?'))) {
          S.maps = maps.filter((x) => x.id !== m.id); if (M.editing === m.id) M.editing = null;
          save(); renderMkList();
        }
      });
      list.appendChild(d);
    });
  }
  // A map from a shared link. Anything that is not a valid map that can be done is ignored.
  function mapFromLink() {
    const m = /^#map=([0-5]{4,6}(?:-[0-5]{4,6}){2,4})$/.exec(location.hash);
    if (!m) return null;
    const rows = m[1].split('-').map((r) => [...r].map((d) => MK_CODE[d]).join(''));
    const all = rows.join(''), n = (ch) => all.split(ch).length - 1;
    if (!Object.values(MK_SIZES).some(([w, h]) => rows.length === h && rows.every((r) => r.length === w))) return null;
    if (n('R') !== 1 || n('F') !== 1 || n('*') > MK_GEMS || !shortestPath(parseMap(rows))) return null;
    return rows;
  }

  // ---- The editor ----
  // R.target says where the next block goes: null for the program, {kind: 'fn'} for the function,
  // {kind: 'loop', b, home} for inside a repeat, or {kind: 'if', b, slot, back} for an arrow of an if block.
  const NAMES = { U: tx('Up', 'Atas'), D: tx('Down', 'Bawah'), L: tx('Left', 'Kiri'), R: tx('Right', 'Kanan') };
  const homeList = (home) => (home === 'fn' ? R.fn : R.prog);
  function container(t) {
    if (!t) return { list: R.prog, home: 'main', inLoop: false };
    if (t.kind === 'fn') return { list: R.fn, home: 'fn', inLoop: false };
    return { list: t.b.body, home: t.home, inLoop: true };
  }
  function renderTray() {
    renderList($('tray'), R.prog, 'm', 'main');
    $('fnWrap').hidden = !(R.tools.includes('fn') || R.fn.length);
    renderList($('fnTray'), R.fn, 'f', 'fn');
    const t = R.target;
    $('tray').classList.toggle('target', !R.debug && !t);
    $('fnTray').classList.toggle('target', !R.debug && !!t && t.kind === 'fn');
    if (R.max) {
      const n = blocks();
      $('tray').insertAdjacentHTML('afterbegin', '<span class="count' + (n >= R.max ? ' full' : '') + '">' + n + ' / ' + R.max + '</span>');
    }
    if (!R.prog.length) $('tray').insertAdjacentHTML('beforeend', '<span class="empty">' + tx('The program is empty. Tap the arrows below.', 'Programnya kosong. Ketuk panah di bawah.') + '</span>');
    if (!R.fn.length) $('fnTray').insertAdjacentHTML('beforeend', '<span class="empty">' + tx('Tap here, then add blocks to build ★.', 'Ketuk di sini, lalu tambah balok untuk membuat ★.') + '</span>');
  }
  // Draws a list of blocks. With ro (read only), taps do nothing; it is used for the hint.
  function renderList(el, list, pre, home, ro) {
    el.innerHTML = '';
    list.forEach((b, i) => el.appendChild(blockEl(b, list, i, pre + i, home, ro)));
  }
  function arrowBtn(d, cls) {
    const e = document.createElement('button');
    e.type = 'button'; e.className = 'blk ' + d + (cls || '');
    e.innerHTML = d === 'F' ? '★' : arrowSvg;
    e.setAttribute('aria-label', d === 'F' ? tx('Function', 'Fungsi') : NAMES[d]);
    return e;
  }
  function blockEl(b, list, i, id, home, ro) {
    const hint = R.showBug && b.bug ? ' hintme' : '';
    if (hasBody(b)) {
      const until = b.t === 'until';
      const L = document.createElement('div');
      L.className = 'loop' + (until ? ' until' : '') + (R.target && R.target.b === b ? ' target' : '');
      L.dataset.id = id;
      L.innerHTML = '<span class="head"><span class="ic" aria-hidden="true">🔁</span></span><span class="body"></span>';
      const times = document.createElement('button');
      times.type = 'button'; times.className = 'times' + (R.sel && R.sel.loop === b ? ' pick' : '') + (hint && b.bug === 'n' ? ' hintme' : '');
      times.textContent = until ? (b.c === 'F' ? '🚩' : '💎×' + b.c) : '×' + b.n;
      times.setAttribute('aria-label', until ? (b.c === 'F' ? tx('Repeat until at the flag', 'Ulang sampai di bendera') : tx('Repeat until ' + b.c + (b.c === 1 ? ' gem' : ' gems'), 'Ulang sampai ' + b.c + ' permata')) : tx('Repeat ' + b.n + ' times', 'Ulang ' + b.n + ' kali'));
      L.querySelector('.head').appendChild(times);
      const body = L.querySelector('.body');
      b.body.forEach((c, j) => body.appendChild(blockEl(c, b.body, j, id + '.' + j, home, ro)));
      if (!b.body.length) body.insertAdjacentHTML('beforeend', '<span class="hole"></span>');
      if (ro) return L;
      times.addEventListener('click', (e) => {
        e.stopPropagation(); if (R.running) return;
        if (R.debug) { if (!until) selectFix({ loop: b }); return; }
        // The until block counts: the flag, then one gem, two gems … up to the gems on the map.
        if (until) { const opts = ['F'].concat(Array.from({ length: R.lv.gems.length }, (_, k) => k + 1)); b.c = opts[(opts.indexOf(b.c) + 1) % opts.length]; }
        else b.n = b.n >= 9 ? 2 : b.n + 1;
        sfx.tap(); afterEdit();
      });
      if (!R.debug) {
        const del = document.createElement('button');
        del.type = 'button'; del.className = 'del'; del.textContent = '✕'; del.setAttribute('aria-label', until ? tx('Remove the repeat-until block', 'Hapus balok ulang-sampai') : tx('Remove the repeat block', 'Hapus balok ulang'));
        del.addEventListener('click', (e) => { e.stopPropagation(); if (R.running) return; list.splice(i, 1); R.target = null; afterEdit(); });
        L.appendChild(del);
        L.addEventListener('click', (e) => {
          e.stopPropagation(); if (R.running) return;
          R.target = R.target && R.target.b === b ? (home === 'fn' ? { kind: 'fn' } : null) : { kind: 'loop', b, home };
          sfx.tap(); renderTray();
        });
      }
      return L;
    }
    if (b.t === 'if') {
      const E = document.createElement('div');
      E.className = 'ifb'; E.dataset.id = id;
      E.innerHTML = '<span class="cond" aria-label="' + tx('If on yellow', 'Jika di petak kuning') + '"><span class="ytile"></span>?</span>';
      ['a', 'b'].forEach((slot, k) => {
        if (k) E.insertAdjacentHTML('beforeend', '<span class="els">' + tx('else', 'selain itu') + '</span>');
        const sb = document.createElement('button');
        sb.type = 'button'; sb.dataset.id = id + slot;
        const on = R.target && R.target.kind === 'if' && R.target.b === b && R.target.slot === slot;
        sb.className = 'slot' + (b[slot] ? ' full' : '') + (on ? ' target' : '');
        sb.setAttribute('aria-label', (slot === 'a' ? tx('On yellow: ', 'Di petak kuning: ') : tx('Otherwise: ', 'Selain itu: ')) + (b[slot] ? NAMES[b[slot]] : tx('empty', 'kosong')));
        if (b[slot]) sb.appendChild(arrowBtn(b[slot], (R.sel && R.sel.iff === b && R.sel.slot === slot ? ' pick' : '') + (R.showBug && b.bug === slot ? ' hintme' : '')));
        if (!ro) sb.addEventListener('click', (e) => {
          e.stopPropagation(); if (R.running) return; sfx.tap();
          if (R.debug) { selectFix({ iff: b, slot }); return; }
          const back = R.target && R.target.kind === 'if' ? R.target.back : R.target;
          R.target = { kind: 'if', b, slot, back }; renderTray();
        });
        E.appendChild(sb);
      });
      if (!ro && !R.debug) {
        const del = document.createElement('button');
        del.type = 'button'; del.className = 'del'; del.textContent = '✕'; del.setAttribute('aria-label', tx('Remove the if block', 'Hapus balok jika'));
        del.addEventListener('click', (e) => {
          e.stopPropagation(); if (R.running) return;
          list.splice(i, 1);
          if (R.target && R.target.kind === 'if' && R.target.b === b) R.target = R.target.back;
          afterEdit();
        });
        E.appendChild(del);
      }
      return E;
    }
    const e = arrowBtn(b.t, (R.sel && R.sel.cmd === b ? ' pick' : '') + (b.fixed ? ' fixed' : '') + hint);
    e.dataset.id = id;
    if (!ro) e.addEventListener('click', (ev) => {
      ev.stopPropagation(); if (R.running) return; sfx.tap();
      if (R.debug) { if (b.t !== 'F') selectFix({ cmd: b }); return; }
      list.splice(i, 1); afterEdit();
    });
    return e;
  }
  $('tray').addEventListener('click', () => { if (R.running || R.debug || !R.target) return; R.target = null; renderTray(); });
  $('fnTray').addEventListener('click', () => { if (R.running || R.debug) return; R.target = { kind: 'fn' }; sfx.tap(); renderTray(); });
  function afterEdit() {
    resetBot(); renderTray();
    $('palette').classList.toggle('nudge', !R.debug && R.i === 0 && R.w.id === 'robot' && !R.prog.length);
  }
  function renderPalette() {
    const p = $('palette');
    p.innerHTML = '';
    p.hidden = R.debug;
    if (R.debug) return;
    ARROWS.forEach((d) => {
      const b = arrowBtn(d);
      b.setAttribute('aria-label', tx('Add: ', 'Tambah: ') + NAMES[d]);
      b.addEventListener('click', () => addBlock({ t: d }));
      p.appendChild(b);
    });
    const extra = (cls, html, label, make) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'blk ' + cls; b.innerHTML = html; b.setAttribute('aria-label', label);
      b.addEventListener('click', () => addBlock(make()));
      p.appendChild(b);
    };
    if (R.tools.includes('loop')) extra('loopBtn', '🔁', tx('Add a repeat block', 'Tambah balok ulang'), () => ({ t: 'loop', n: 2, body: [] }));
    if (R.tools.includes('until')) extra('untilBtn', '🔁🚩', tx('Add a repeat-until block', 'Tambah balok ulang-sampai'), () => ({ t: 'until', c: 'F', body: [] }));
    if (R.tools.includes('if')) extra('ifBtn', '<span class="ytile"></span>?', tx('Add an if block', 'Tambah balok jika'), () => ({ t: 'if', a: null, b: null }));
    if (R.tools.includes('fn')) extra('F', '★', tx('Add a call of the function', 'Tambah pemanggilan fungsi'), () => ({ t: 'F' }));
    p.classList.toggle('nudge', R.i === 0 && R.w.id === 'robot' && !R.prog.length);
  }
  function addBlock(b) {
    if (R.running) return;
    const t = R.target;
    // An arrow while an if block waits for one fills it; then the other arrow, then back to where it was.
    if (t && t.kind === 'if' && ARROWS.includes(b.t)) {
      t.b[t.slot] = b.t; sfx.tap();
      const other = t.slot === 'a' ? 'b' : 'a';
      R.target = !t.b[other] ? { kind: 'if', b: t.b, slot: other, back: t.back } : t.back;
      afterEdit(); return;
    }
    if (t && t.kind === 'if') R.target = t.back;
    if (R.max && blocks() >= R.max) { sfx.bad(); rSay(P.full, 'oops'); return; }
    if (blocks() >= 40) { sfx.bad(); return; }
    let c = container(R.target);
    if (hasBody(b) && c.inLoop) { sfx.bad(); rSay(P.noLoopInLoop, 'oops'); return; }
    if (b.t === 'F' && c.home === 'fn') { sfx.bad(); rSay(P.noFnInFn, 'oops'); return; }
    sfx.tap();
    c.list.push(b);
    if (hasBody(b)) R.target = { kind: 'loop', b, home: c.home };
    if (b.t === 'if') R.target = { kind: 'if', b, slot: 'a', back: R.target };
    afterEdit();
  }
  $('rUndo').addEventListener('click', () => {
    if (R.running) return;
    if (R.target && R.target.kind === 'if') R.target = R.target.back;
    const c = container(R.target);
    if (c.list.length) c.list.pop();
    else if (R.target && R.target.kind === 'loop') { const L = homeList(R.target.home); L.splice(L.indexOf(R.target.b), 1); R.target = null; }
    else if (R.target) R.target = null;
    sfx.tap(); afterEdit();
  });
  $('rClear').addEventListener('click', () => { if (R.running) return; R.prog = []; R.fn = []; R.target = null; sfx.tap(); afterEdit(); });
  $('rReset').addEventListener('click', () => {
    if (R.running) return;
    R.prog = clone(R.orig.prog); R.fn = clone(R.orig.fn); R.sel = null; $('fixbar').hidden = true; sfx.tap(); afterEdit(); robotIntro();
  });

  // Fixing: pick a block, then choose what it should be.
  function selectFix(sel) {
    R.sel = sel; renderTray();
    const f = $('fixbar');
    f.hidden = false; f.innerHTML = '<span class="lbl">' + P.fix + '</span>';
    const choices = sel.loop ? COUNTS : ARROWS;
    choices.forEach((v) => {
      let b;
      if (sel.loop) { b = document.createElement('button'); b.type = 'button'; b.className = 'blk num'; b.textContent = '×' + v; b.setAttribute('aria-label', tx('Repeat ' + v + ' times', 'Ulang ' + v + ' kali')); }
      else b = arrowBtn(v);
      b.addEventListener('click', () => {
        const obj = sel.loop || sel.iff || sel.cmd, field = sel.loop ? 'n' : sel.iff ? sel.slot : 't';
        if (obj[field] !== v) { R.edits++; obj[field] = v; obj.fixed = true; }
        R.sel = null; f.hidden = true; sfx.tap(); afterEdit();
      });
      f.appendChild(b);
    });
  }

  // ---- Hints ----
  // First the footprints of a working path, then a working program. A hint keeps the stars at two at most.
  // When fixing, the hint makes the wrong block glow.
  $('rHint').addEventListener('click', () => {
    if (R.running) return;
    R.hints++; sfx.tap();
    if (R.hints === 1) UI.toast({ type: 'info', title: tx('Hint used', 'Petunjuk dipakai'), description: tx('With a hint you can earn two stars at most.', 'Dengan petunjuk, kamu paling banyak mendapat dua bintang.') });
    if (R.i >= 0) { logOf(R.w.id, R.i).hints++; save(); }
    if (R.debug) { R.showBug = true; renderTray(); rSay(P.hintBug, 'happy'); return; }
    if (R.hints === 1) {
      const res = execute(R.lv, R.sol.prog, R.sol.fn);
      res.trace.forEach((st, k) => {
        const c = $('board').querySelector('.cell[data-k="' + st.x + ',' + st.y + '"]');
        if (c && !c.querySelector('.foot')) c.insertAdjacentHTML('beforeend', '<i class="foot" style="--k:' + k + '">' + (k + 1) + '</i>');
      });
      rSay(P.hintFoot, 'happy');
      return;
    }
    const g = $('ghost');
    g.hidden = false;
    g.innerHTML = '<div class="lbl">💡 ' + P.hintProg + '</div><div class="prog-ro"></div>';
    renderList(g.querySelector('.prog-ro'), clone(R.sol.prog), 'g', 'main', true);
    if (R.sol.fn.length) {
      g.insertAdjacentHTML('beforeend', '<div class="fnline"><span class="blk F" aria-hidden="true">★</span> =</div>');
      const fl = g.querySelector('.fnline');
      clone(R.sol.fn).forEach((b, i) => fl.appendChild(blockEl(b, [], i, 'h' + i, 'fn', true)));
    }
    rSay(P.hintProg, 'happy');
  });

  const STEP = 420;
  async function runProgram() {
    if (R.running) return;
    if (!blocks()) { sfx.bad(); rSay(tx('Add some commands first.', 'Tambahkan beberapa perintah dulu.'), 'oops'); return; }
    R.sel = null; $('fixbar').hidden = true;
    resetBot(); renderTray();
    const my = ++runToken;
    R.running = true; R.runs++;
    const ctl = ['rRun', 'rUndo', 'rClear', 'rReset', 'rHint'];
    ctl.forEach((id) => { $(id).disabled = true; });
    $('palette').querySelectorAll('button').forEach((b) => { b.disabled = true; });
    rSay(tx('Poka is on the move…', 'Poka sedang berjalan…'), 'happy');
    await sleep(250);
    const res = execute(R.lv, R.prog, R.fn);
    const sec = $('robot');
    for (const st of res.trace) {
      if (my !== runToken) return;
      sec.querySelectorAll('.run').forEach((e) => e.classList.remove('run'));
      st.hl.forEach((id) => { const e = sec.querySelector('#tray [data-id="' + id + '"], #fnTray [data-id="' + id + '"]'); if (e) e.classList.add('run'); });
      botEl.classList.toggle('face-L', st.d === 'L' || (st.d !== 'R' && botEl.classList.contains('face-L')));
      if (st.bump) {
        botEl.style.setProperty('--bx', DIR[st.d][0] * 30 + '%'); botEl.style.setProperty('--by', DIR[st.d][1] * 30 + '%');
        botEl.classList.remove('walk'); void botEl.offsetWidth; botEl.classList.add('bump');
        sfx.bump();
        await sleep(500);
        break;
      }
      $('board').querySelector('.cell[data-k="' + botEl.style.getPropertyValue('--x') + ',' + botEl.style.getPropertyValue('--y') + '"]').classList.add('trail');
      placeBot(st.x, st.y);
      botEl.classList.remove('walk'); void botEl.offsetWidth; botEl.classList.add('walk');
      sfx.step();
      if (st.gem) setTimeout(() => { if (my === runToken) { Cendekia.fx.burst(gemEls[st.x + ',' + st.y]); gemEls[st.x + ',' + st.y].classList.add('got'); sfx.gem(); gemCount($('board').querySelectorAll('.gem.got').length); } }, 220);
      await sleep(STEP);
    }
    if (my !== runToken) return;
    sec.querySelectorAll('.run').forEach((e) => e.classList.remove('run'));
    R.running = false;
    ctl.forEach((id) => { $(id).disabled = false; });
    $('palette').querySelectorAll('button').forEach((b) => { b.disabled = false; });
    // In fixing mode the first run, before any change, is to see the bug, so it does not count.
    const counts = !R.debug || R.edits > 0;
    if (R.i >= 0 && counts) { const L = logOf(R.w.id, R.i); L.runs++; if (res.end === 'win') L.wins++; else L.fails++; }
    if (res.end === 'win') solvedOne();
    save();
    if (res.end === 'win') {
      botEl.classList.add('dance'); mood(botEl.firstChild, 'cheer'); mood($('rCoach'), 'cheer');
      rSay(tx('Hooray, Poka made it!', 'Hore, Poka berhasil!')); sfx.win(); Cendekia.fx.confetti(40);
      let stars;
      if (R.debug) stars = 3 - (R.edits > 1 ? 1 : 0) - (R.fails >= 2 ? 1 : 0);
      else stars = 3 - (blocks() > R.par ? 1 : 0) - (R.fails >= 2 ? 1 : 0);
      if (R.hints) stars = Math.min(stars, 2);
      const text = R.debug ? (R.edits <= 1 ? tx('Fixed with a single change!', 'Beres dengan satu perubahan!') : tx('The program works now!', 'Programnya sudah jalan!'))
        : (blocks() > R.par ? tx('Can it be shorter? Try ' + R.par + ' blocks.', 'Bisa lebih pendek? Coba ' + R.par + ' balok.') : tx('A perfect program: ' + blocks() + ' blocks!', 'Program sempurna: ' + blocks() + ' balok!'));
      setTimeout(() => { if (my === runToken) finish(R.w, R.i, Math.max(1, stars), text); }, 1700);
    } else {
      if (counts && !R.fails && R.i >= 0) CD.weak('logika', R.w.name + ' · ' + lvName(R.def.name));
      if (counts) R.fails++;
      $('rHint').hidden = R.debug ? false : R.fails < 1;
      mood(botEl.firstChild, 'oops');
      rSay(res.end === 'bump' ? P.bump : res.end === 'gems' ? P.gems : P.short, 'oops');
      sfx.bad();
    }
  }
  $('rRun').addEventListener('click', runProgram);

  // =====================================================================
  // Quiz worlds
  // =====================================================================
  let Q = null;
  function startQuiz(w, i) {
    Q = { t0: Date.now(), w, i, n: 0, total: w.total - (S.diff === 'easy' ? 1 : 0), missedQ: 0, combo: 0, missed: false, tries: 0 };
    paintProg();
    $('combo').textContent = '';
    show('quiz');
    nextQ();
  }
  // Progress through the questions: the Arc stepper, or plain pips if the bundle did not load.
  function paintProg() {
    if (window.LogicaUI) { window.LogicaUI.progress($('prog'), Q.total, Q.n); return; }
    $('prog').innerHTML = '<i></i>'.repeat(Q.total);
    [...$('prog').children].forEach((pip, k) => pip.classList.toggle('done', k < Q.n));
  }
  $('qBack').addEventListener('click', () => show('world'));
  function qSay(text, m) { $('qSay').textContent = text; if (m) mood($('qCoach'), m); }
  function nextQ() {
    if (Q.n >= Q.total) {
      const stars = Q.missedQ === 0 ? 3 : Q.missedQ <= 2 ? 2 : 1;
      finish(Q.w, Q.i, stars, tx((Q.total - Q.missedQ) + ' of ' + Q.total + ' right on the first try.', (Q.total - Q.missedQ) + ' dari ' + Q.total + ' benar di percobaan pertama.'));
      return;
    }
    Q.missed = false; Q.tries = 0;
    mood($('qCoach'), 'happy');
    $('ask').innerHTML = ''; $('answers').innerHTML = '';
    GEN[Q.w.id](Q.i);
  }
  const CHEERS = IDL ? ['Hebat!', 'Pintar!', 'Benar!', 'Keren!', 'Super!', 'Luar biasa!'] : ['Great!', 'Clever!', 'Right!', 'Cool!', 'Super!', 'Amazing!'];
  function solved(delay) {
    const L = logOf(Q.w.id, Q.i);
    L.q++; if (!Q.missed) L.ok++;
    solvedOne(); save();
    if (!Q.missed) { Q.combo++; } else { Q.combo = 0; Q.missedQ++; }
    $('combo').textContent = Q.combo >= 2 ? '×' + Q.combo + ' 🔥' : '';
    if (Q.combo >= 3) Cendekia.fx.confetti(14);
    sfx.good(); qSay(pick(CHEERS), 'cheer');
    Q.n++; paintProg();
    const my = runToken;
    setTimeout(() => { if (my === runToken) nextQ(); }, delay || 1300);
  }
  // A wrong answer. After two, onHint shows the right one.
  // slip names the kind of mistake behind this answer, for the parents' summary.
  function wrong(onHint, slip) {
    if (!Q.missed) CD.weak('logika', Q.w.name + ' · ' + Q.w.levels[Q.i]);
    if (slip) { const L = logOf(Q.w.id, Q.i); L.slips = L.slips || {}; L.slips[slip] = (L.slips[slip] || 0) + 1; save(); }
    Q.missed = true; Q.tries++; Q.combo = 0; $('combo').textContent = '';
    sfx.bad(); qSay(P.again, 'oops');
    if (Q.tries >= 2 && onHint) onHint();
  }
  // Option buttons. Each option is {html, ok, label, slip, data}.
  // After two wrong answers, onHint runs; without it the right option glows.
  function options(list, onOk, onHint) {
    const box = document.createElement('div');
    box.className = 'opts';
    box.style.setProperty('--n', list.length);
    list.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.innerHTML = o.html;
      if (o.data) Object.assign(b.dataset, o.data);
      b.setAttribute('aria-label', o.label || tx('Choice', 'Pilihan'));
      b.addEventListener('click', () => {
        if (b.disabled || box.classList.contains('done') || b.classList.contains('wait')) return;
        if (o.ok) {
          box.classList.add('done'); b.classList.add('ok');
          [...box.children].forEach((x) => { if (x !== b) x.classList.add('fade'); });
          onOk(b);
        } else {
          b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); b.disabled = true;
          wrong(onHint || (() => { const right = [...box.children][list.findIndex((x) => x.ok)]; right.classList.add('hint'); }), o.slip);
        }
      });
      box.appendChild(b);
    });
    $('answers').appendChild(box);
    return box;
  }
  // Moves a copy of `html` from one element to another.
  function fly(from, to, html) {
    return new Promise((done) => {
      const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      const f = document.createElement('div');
      f.className = 'flyer'; f.innerHTML = html;
      Object.assign(f.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
      document.body.appendChild(f);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        f.style.transform = 'translate(' + (b.left - a.left + (b.width - a.width) / 2) + 'px,' + (b.top - a.top + (b.height - a.height) / 2) + 'px) scale(.85)';
      }));
      setTimeout(() => { f.remove(); done(); }, 520);
    });
  }
  // Wrong choices near an item: other colors, shapes, counts or turns.
  function variantsOf(x) {
    if (x.s === 'dots') return [x.n + 1, x.n - 1, x.n + 2, x.n - 2].filter((n) => n >= 1 && n <= 10).map((n) => it('dots', x.c, { n }));
    if (x.s === 'number') return [x.v + 1, x.v - 1, x.v + 2, x.v - 2, x.v * 2, x.v + 10].filter((v) => v >= 0 && v !== x.v).map((v) => it('number', x.c, { v }));
    if (x.s === 'arrow') { const st = x.r % 90 ? 45 : 90; return Array.from({ length: 360 / st }, (_, k) => k * st).filter((r) => r !== x.r).map((r) => it('arrow', x.c, { r })); }
    return shuffle([...CK.filter((c) => c !== x.c).map((c) => it(x.s, c, { z: x.z })), ...SK.filter((s) => s !== x.s).map((s) => it(s, x.c, { z: x.z }))]);
  }
  // The answer plus distinct wrong items: first from `prefer`, then near variants.
  function choices(ans, prefer, n) {
    const m = new Map([[key(ans), ans]]);
    [...shuffle(prefer.slice()), ...shuffle(variantsOf(ans))].forEach((x) => { if (m.size < n && !m.has(key(x))) m.set(key(x), x); });
    return shuffle([...m.values()]);
  }

  // ---- Pattern ----
  // Easy: three choices and the gap is always at the end. Hard: four choices, the gap is often in the
  // middle, dots grow by two and arrows turn by 45 degrees.
  function genPatterns(lvl) {
    const d = S.diff, cs = shuffle(CK.slice()), ss = shuffle(SK.slice());
    const fam = lvl < 7 ? lvl : d === 'easy' ? rnd(0, 4) : hardUp(d) ? rnd(3, 6) : rnd(2, 6);
    let seq, unit;
    if (fam === 0) unit = [it(ss[0], cs[0]), it(ss[0], cs[1])];
    if (fam === 1) unit = [0, 1, 2].map((k) => it(ss[k], cs[0]));
    if (fam === 2) { const A = it(ss[0], cs[0]), B = it(ss[1], cs[1]), D = it(ss[2], cs[2]); unit = pick([[A, A, B], [A, B, B], [A, A, B, B], [A, B, A, D]]); }
    if (fam === 3) unit = [0, 1, 2].map((k) => it(ss[k], cs[k]));
    if (fam === 4) { const step = hardUp(d) || (lvl === 7 && d === 'medium') ? pick([1, 2]) : 1, n0 = step === 2 ? 1 : rnd(1, 2); seq = [0, 1, 2, 3, 4].map((k) => it('dots', cs[0], { n: n0 + step * k })); }
    if (fam === 5) { const r0 = pick([0, 90, 180, 270]), dir = hardUp(d) ? pick([45, 90, 270, 315]) : pick([90, 270]); seq = [0, 1, 2, 3, 4, 5].map((k) => it('arrow', cs[0], { r: (r0 + dir * k) % 360 })); }
    if (fam === 6) { seq = [0, 1, 2, 3, 4, 5, 6].map((k) => it(ss[k % 2], cs[k % 3])); }
    if (!seq) { const len = unit.length * 2 + (unit.length <= 2 ? 2 : unit.length === 3 ? 1 : 0); seq = Array.from({ length: len }, (_, k) => unit[k % unit.length]); }
    let miss = seq.length - 1;
    if ((d === 'medium' && lvl >= 6 && Math.random() < 0.6) || (d === 'hard' && lvl >= 3 && Math.random() < 0.5) || (d === 'veryhard' && lvl >= 2 && Math.random() < 0.8) || (d === 'extreme' && lvl >= 1)) miss = rnd(2, seq.length - 2);
    const ans = seq[miss];
    const opts = choices(ans, seq, { easy: 3, hard: 4, veryhard: 5, extreme: 6 }[d] || (lvl < 3 ? 3 : 4));
    const phrase = miss === seq.length - 1 ? P.next : P.missing;
    qSay(phrase);

    const row = document.createElement('div');
    row.className = 'seq';
    seq.forEach((x, k) => {
      const s = document.createElement('span');
      s.className = 'slot' + (k === miss ? ' q' : '');
      s.style.setProperty('--d', k * 0.08 + 's');
      s.innerHTML = k === miss ? '?' : itemSvg(x);
      row.appendChild(s);
    });
    $('ask').appendChild(row);
    const hole = row.children[miss];
    options(opts.map((x) => ({ html: itemSvg(x), ok: key(x) === key(ans) })), async (b) => {
      await fly(b, hole, itemSvg(ans));
      hole.className = 'slot'; hole.innerHTML = itemSvg(ans);
      row.classList.add('wave');
      solved(1400);
    });
  }

  // ---- Magic machine ----
  const MACHINE = '<svg class="machine" viewBox="0 0 130 130" aria-hidden="true">'
    + '<g class="body"><rect x="14" y="26" width="102" height="86" rx="16" fill="#7a5af8"/><rect x="14" y="26" width="102" height="18" rx="9" fill="#9b82ff"/>'
    + '<rect x="2" y="58" width="16" height="30" rx="5" fill="#5b3fd6"/><rect x="112" y="58" width="16" height="30" rx="5" fill="#5b3fd6"/>'
    + '<circle class="lamp" cx="34" cy="35" r="5"/><circle class="lamp" cx="50" cy="35" r="5"/><circle class="lamp" cx="66" cy="35" r="5"/>'
    + '<rect x="28" y="52" width="74" height="50" rx="12" fill="#2a2150"/>'
    + '<g class="gear g1"><circle cx="52" cy="77" r="17" fill="#ffd27a"/>'
    + [0, 45, 90, 135].map((a) => '<rect x="48" y="56" width="8" height="42" rx="2" fill="#ffd27a" transform="rotate(' + a + ' 52 77)"/>').join('')
    + '<circle cx="52" cy="77" r="6" fill="#2a2150"/></g>'
    + '<g class="gear g2"><circle cx="82" cy="70" r="11" fill="#5ef2d6"/>'
    + [0, 60, 120].map((a) => '<rect x="79" y="56" width="6" height="28" rx="2" fill="#5ef2d6" transform="rotate(' + a + ' 82 70)"/>').join('')
    + '<circle cx="82" cy="70" r="4" fill="#2a2150"/></g>'
    + '<rect x="40" y="10" width="50" height="18" rx="6" fill="#5b3fd6"/><text x="65" y="23" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" font-family="Plus Jakarta Sans, system-ui, sans-serif">?</text></g></svg>';
  // Easy: three examples and three choices. Hard: two examples, four choices and harder number rules.
  function genMachine(lvl) {
    const d = S.diff, T = pick(CK), Sh = pick(SK);
    let rule, input, nEx = d === 'easy' ? 3 : hardUp(d) ? 2 : lvl < 4 ? 2 : 3, prefer = (x) => [x];
    if (lvl === 0) { rule = (x) => it(x.s, T); input = () => it(pick(SK), pick(CK.filter((c) => c !== T))); }
    if (lvl === 1) { rule = (x) => it(Sh, x.c); input = () => it(pick(SK.filter((s) => s !== Sh)), pick(CK)); }
    if (lvl === 2) { rule = (x) => it('dots', x.c, { n: x.n + 1 }); input = () => it('dots', pick(CK), { n: rnd(1, 6) }); }
    if (lvl === 3) { rule = (x) => it('arrow', x.c, { r: (x.r + 90) % 360 }); input = () => it('arrow', pick(CK), { r: pick([0, 90, 180, 270]) }); }
    if (lvl === 4) { rule = (x) => it('dots', x.c, { n: x.n * 2 }); input = () => it('dots', pick(CK), { n: rnd(1, 5) }); }
    if (lvl === 5) {
      rule = (x) => it(Sh, T); input = () => it(pick(SK.filter((s) => s !== Sh)), pick(CK.filter((c) => c !== T)));
      prefer = (x) => [x, it(Sh, x.c), it(x.s, T)];
    }
    if (lvl === 6) { rule = (x) => it('dots', x.c, { n: x.n + 2 }); input = () => it('dots', pick(CK), { n: rnd(1, 7) }); prefer = (x) => [x, it('dots', x.c, { n: x.n + 1 })]; }
    if (lvl === 7) {
      const [op, k] = pick({ easy: [['+', 1], ['+', 2]], medium: [['+', 2], ['+', 3], ['×', 2], ['−', 1], ['+', 10]],
        hard: [['×', 3], ['+', 5], ['−', 2], ['×', 2], ['+', 9]],
        veryhard: [['×', 4], ['+', 7], ['−', 3], ['×', 3], ['+', 12]], extreme: [['×', 5], ['+', 14], ['−', 6], ['×', 4], ['+', 19]] }[d]);
      const f = (v) => op === '+' ? v + k : op === '×' ? v * k : v - k;
      rule = (x) => it('number', 'purple', { v: f(x.v) }); input = () => it('number', 'blue', { v: rnd(op === '−' ? k + 1 : 1, d === 'easy' ? 5 : d === 'extreme' ? 12 : 9) });
      prefer = (x) => [it('number', 'purple', { v: x.v })];
    }
    // Different inputs for the examples and the question.
    const seen = new Set(), ins = [];
    while (ins.length < nEx + 1) { const x = input(); if (!seen.has(key(x))) { seen.add(key(x)); ins.push(x); } }
    const test = ins.pop(), ans = rule(test);
    const opts = choices(ans, prefer(test), { easy: 3, hard: 4, veryhard: 5, extreme: 6 }[d] || (lvl < 2 ? 3 : 4));
    qSay(P.machine);

    $('ask').innerHTML = '<div class="lab"><div class="tray2" id="mIn"></div>' + MACHINE + '<div class="tray2" id="mOut"></div></div><div class="history" id="mHist"></div>';
    const box = options(opts.map((x) => ({ html: itemSvg(x), ok: key(x) === key(ans) })), async (b) => {
      const out = $('mOut'), q = out.firstChild;
      await fly(b, q, itemSvg(ans));
      out.innerHTML = '<span class="out">' + itemSvg(ans) + '</span>';
      solved(1400);
    });
    [...box.children].forEach((b) => b.classList.add('wait'));
    runMachine(ins.map((x) => [x, rule(x)]), test).then((ok) => { if (ok) [...box.children].forEach((b) => b.classList.remove('wait')); });
  }
  // Plays each example through the machine, then feeds in the question.
  async function runMachine(pairs, test) {
    const my = runToken, alive = () => my === runToken && !$('quiz').hidden;
    const inEl = $('mIn'), outEl = $('mOut'), m = $('ask').querySelector('.machine'), hist = $('mHist');
    const feed = async (x) => {
      inEl.innerHTML = '<span>' + itemSvg(x) + '</span>';
      inEl.firstChild.style.animation = 'popIn .3s both';
      await sleep(300); if (!alive()) return false;
      inEl.firstChild.classList.add('feed'); sfx.whir();
      await sleep(250); m.classList.add('on');
      await sleep(550); m.classList.remove('on');
      inEl.innerHTML = '';
      return alive();
    };
    for (const [a, b] of pairs) {
      if (!(await feed(a))) return false;
      outEl.innerHTML = '<span class="out">' + itemSvg(b) + '</span>'; sfx.drop();
      await sleep(550); if (!alive()) return false;
      outEl.innerHTML = '';
      hist.insertAdjacentHTML('beforeend', '<div class="ex">' + itemSvg(a) + '<span class="arrow">→</span>' + itemSvg(b) + '</div>');
      await sleep(150);
    }
    if (!(await feed(test))) return false;
    hist.insertAdjacentHTML('beforeend', '<div class="ex">' + itemSvg(test) + '<span class="arrow">→</span><span class="arrow">?</span></div>');
    outEl.innerHTML = '<span class="q">?</span>';
    return true;
  }

  // ---- Balance ----
  // One balance as SVG. left/right are lists of items; tilt > 0 means the right side is heavier.
  function scaleSvg(left, right) {
    const pan = (cx, items) => {
      const per = Math.min(items.length, 3), size = items.length > 1 ? 30 : 50;
      const parts = items.map((x, k) => {
        const row = Math.floor(k / 3), col = k % 3, inRow = Math.min(per, items.length - row * 3);
        const px = cx - (inRow * size) / 2 + col * size, py = 92 - size - row * (size - 6);
        return typeof x === 'string'
          ? '<text x="' + cx + '" y="78" text-anchor="middle" font-size="36" font-weight="800" fill="#f2891f" font-family="Plus Jakarta Sans, system-ui, sans-serif">' + x + '</text>'
          : itemSvg(x).replace('<svg class="it"', '<svg x="' + px + '" y="' + py + '" width="' + size + '" height="' + size + '"');
      }).join('');
      return '<g class="pan"><line x1="' + cx + '" y1="40" x2="' + (cx - 30) + '" y2="92" stroke="#8a94a8" stroke-width="2"/>'
        + '<line x1="' + cx + '" y1="40" x2="' + (cx + 30) + '" y2="92" stroke="#8a94a8" stroke-width="2"/>' + parts
        + '<path d="M' + (cx - 40) + ' 92 Q' + cx + ' 112 ' + (cx + 40) + ' 92 Z" fill="#c3cde0" stroke="#8a94a8" stroke-width="2"/></g>';
    };
    return '<svg class="scale" viewBox="0 0 260 170" aria-hidden="true">'
      + '<rect x="90" y="156" width="80" height="12" rx="6" fill="#6b7280"/><rect x="125" y="40" width="10" height="118" rx="4" fill="#8a94a8"/>'
      + pan(40, left) + pan(220, right)
      + '<g class="beam"><rect x="30" y="35" width="200" height="10" rx="5" fill="#475569"/></g>'
      + '<circle cx="130" cy="40" r="9" fill="#f2891f"/></svg>';
  }
  function tilt(svg, dir) {
    const th = 11 * dir, dy = 90 * Math.sin(th * Math.PI / 180);
    svg.querySelector('.beam').style.transform = 'rotate(' + th + 'deg)';
    const pans = svg.querySelectorAll('.pan');
    pans[0].style.transform = 'translateY(' + (-dy) + 'px)';
    pans[1].style.transform = 'translateY(' + dy + 'px)';
  }
  function genBalance(lvl) {
    $('ask').innerHTML = '<div class="scales" id="scales"></div>';
    const box = $('scales');
    const my = runToken;
    const d = S.diff;
    if (lvl === 5) {
      // How many light balls weigh the same as some heavy ones? On hard there is sometimes a chain:
      // one X is k Y, one Y is j Z, so one X is k × j Z.
      const [cx, cy, cz] = shuffle(CK.slice()), X = it('circle', cx), Y = it('circle', cy, { z: 0.8 }), Z = it('circle', cz, { z: 0.65 });
      let shown, ask, unit, ans;
      if (hardUp(d) && Math.random() < { hard: 0.5, veryhard: 0.8, extreme: 1 }[d]) {
        const k = pick(d === 'extreme' ? [2, 3, 4] : [2, 3]), j = pick(d === 'extreme' ? [2, 3, 4] : [2, 3]);
        shown = scaleSvg([X], Array(k).fill(Y)) + scaleSvg([Y], Array(j).fill(Z)); ask = [X]; unit = Z; ans = k * j;
      } else {
        const k = d === 'easy' ? 2 : pick([2, 3]), m = d === 'easy' ? 2 : k === 3 ? 2 : pick([2, 3]);
        shown = scaleSvg([X], Array(k).fill(Y)); ask = Array(m).fill(X); unit = Y; ans = m * k;
      }
      box.classList.toggle('one', !shown.includes('</svg><svg'));
      box.innerHTML = shown + scaleSvg(ask, ['?']);
      const nums = new Set([ans]);
      shuffle([ans + 1, ans - 1, ans + 2, ans - 2].filter((v) => v > 0)).forEach((v) => { if (nums.size < (d === 'easy' ? 3 : hardUp(d) && d !== 'hard' ? 5 : 4)) nums.add(v); });
      qSay(P.count);
      setTimeout(() => { if (my === runToken) [...box.children].slice(0, -1).forEach((sc) => sc.classList.add('wob')); }, 300);
      options(shuffle([...nums]).map((v) => ({ html: '<span class="numopt">' + v + ' ' + itemSvg(unit) + '</span>', ok: v === ans, label: String(v) })), () => {
        box.lastChild.outerHTML = scaleSvg(ask, Array(ans).fill(unit));
        box.lastChild.classList.add('wob');
        solved(1700);
      });
      return;
    }
    const n = { easy: [2, 2, 3, 3, 3], medium: [2, 2, 3, 3, 4], hard: [3, 3, 4, 4, 5], veryhard: [3, 4, 4, 5, 5], extreme: [4, 4, 5, 5, 5] }[d][lvl];
    const order = shuffle(CK.slice()).slice(0, n); // lightest first
    const ask = lvl === 4 ? pick(['heaviest', 'lightest']) : lvl % 2 ? (n > 2 ? 'lightest' : 'lighter') : (n > 2 ? 'heaviest' : 'heavier');
    const ans = /heav/.test(ask) ? order[n - 1] : order[0];
    const pairs = shuffle(order.slice(1).map((c, k) => (Math.random() < 0.5 ? [order[k], c, 1] : [c, order[k], -1])));
    if (n === 2) box.classList.add('one');
    box.innerHTML = pairs.map(([a, b]) => scaleSvg([it('circle', a)], [it('circle', b)])).join('');
    pairs.forEach((p, k) => setTimeout(() => { if (my === runToken) { tilt(box.children[k], p[2]); sfx.drop(); } }, 400 + k * 500));
    qSay(P[ask]);
    options(shuffle(order.slice()).map((c) => ({ html: itemSvg(it('circle', c)), ok: c === ans, label: c })), () => solved());
  }

  // ---- Logic filter ----
  const WORD = (a) => a.k === 'z' ? (a.v === 1 ? tx('big', 'besar') : tx('small', 'kecil')) : a.k === 'c' ? cName(a.v) : sName(a.v);
  const test = (a, x) => (a.k === 'c' ? x.c : a.k === 's' ? x.s : x.z) === a.v;
  function passes(r, x) {
    if (r.op === 'is') return test(r.a, x);
    if (r.op === 'and') return test(r.a, x) && test(r.b, x);
    if (r.op === 'or') return test(r.a, x) || test(r.b, x);
    if (r.op === 'not') return !test(r.a, x);
    return test(r.a, x) && !test(r.b, x); // andnot
  }
  function chip(a, not) {
    let ic;
    if (a.k === 'c') ic = '<i class="sw" style="background:' + COLORS[a.v] + '"></i>';
    else if (a.k === 's') ic = itemSvg(it(a.v, 'gray'));
    else ic = itemSvg(it('circle', 'gray', { z: a.v }));
    return '<span class="chip' + (not ? ' not' : '') + '">' + ic + WORD(a) + '</span>';
  }
  function ruleHtml(r) {
    if (r.op === 'is') return chip(r.a);
    if (r.op === 'and') return chip(r.a) + '<span class="op">' + tx('and', 'dan') + '</span>' + chip(r.b);
    if (r.op === 'or') return chip(r.a) + '<span class="op or">' + tx('or', 'atau') + '</span>' + chip(r.b);
    if (r.op === 'not') return '<span class="op no">' + tx('not', 'bukan') + '</span>' + chip(r.a, true);
    return chip(r.a) + '<span class="op no">' + tx('but not', 'tapi bukan') + '</span>' + chip(r.b, true);
  }
  // Words for the rule sentence: shapes get an article ("red and a circle").
  function ruleWords(r) {
    const word = (a) => a.k === 's' ? tx('a ', '') + sName(a.v) : WORD(a);
    if (r.op === 'is') return [word(r.a)];
    if (r.op === 'and') return [word(r.a), tx('and', 'dan'), word(r.b)];
    if (r.op === 'or') return [word(r.a), tx('or', 'atau'), word(r.b)];
    if (r.op === 'not') return [tx('not', 'bukan'), word(r.a)];
    return [word(r.a), tx('but not', 'tapi bukan'), word(r.b)];
  }
  // Easy: six items. Medium: eight. Hard: ten items from four colors and four shapes. Very hard: twelve and Extreme: fourteen, from all five.
  function genFilter(lvl) {
    const d = S.diff, many = { easy: 6, medium: 8, hard: 10, veryhard: 12, extreme: 14 }[d], kinds = d === 'hard' ? 4 : hardUp(d) ? 5 : 3;
    let rule, items;
    for (let tries = 0; tries < 300; tries++) {
      const cs = shuffle(CK.slice()).slice(0, kinds), ss = shuffle(SK.slice()).slice(0, kinds);
      const c = (k) => ({ k: 'c', v: cs[k] }), s = (k) => ({ k: 's', v: ss[k] }), z = { k: 'z', v: pick([1, 0.6]) };
      const fam = lvl < 6 ? lvl : rnd(2, 8);
      rule = [{ op: 'is', a: c(0) }, { op: 'is', a: s(0) }, { op: 'and', a: c(0), b: s(0) }, { op: 'not', a: c(0) },
        pick([{ op: 'or', a: c(0), b: c(1) }, { op: 'or', a: s(0), b: s(1) }]), { op: 'andnot', a: s(0), b: c(0) },
        { op: 'and', a: z, b: c(0) }, { op: 'or', a: c(0), b: s(0) }, { op: 'andnot', a: z, b: s(0) }][fam];
      const all = [];
      cs.forEach((cc) => ss.forEach((sh) => [1, 0.6].forEach((zz) => all.push(it(sh, cc, { z: zz })))));
      // Sizes vary only when the rule is about size, or for AND, where one color and one shape fit just one item of each size.
      const pool = rule.a.k === 'z' || rule.op === 'and' ? all : all.filter((x) => x.z === 1);
      items = shuffle(pool).slice(0, many);
      const n = items.filter((x) => passes(rule, x)).length;
      if (n >= 2 && n <= Math.ceil(many * 0.6)) break;
    }
    qSay(tx('Pick everything that is ' + ruleWords(rule).join(' ') + '.', 'Pilih semua yang ' + ruleWords(rule).join(' ') + '.'));
    $('ask').innerHTML = '<div class="rule">' + ruleHtml(rule) + '</div><div class="pool" id="pool"></div>';
    const pool = $('pool');
    items.forEach((x, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'thing'; b.innerHTML = itemSvg(x);
      b.style.animationDelay = k * 0.04 + 's';
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', IDL ? sName(x.s) + ' ' + cName(x.c) + (x.z === 1 ? '' : ' kecil') : (x.z === 1 ? '' : 'small ') + x.c + ' ' + x.s);
      b.addEventListener('click', () => {
        if (pool.classList.contains('done')) return;
        b.classList.remove('no', 'hint');
        b.classList.toggle('sel'); b.setAttribute('aria-pressed', b.classList.contains('sel'));
        sfx.tap();
      });
      pool.appendChild(b);
    });
    const wrap = document.createElement('div');
    wrap.className = 'check';
    const go = document.createElement('button');
    go.type = 'button'; go.className = 'btn go'; go.textContent = tx('✓ Check', '✓ Periksa');
    go.addEventListener('click', () => {
      if (pool.classList.contains('done')) return;
      const els = [...pool.children];
      const bad = els.filter((b, k) => b.classList.contains('sel') !== passes(rule, items[k]));
      if (!bad.length) {
        pool.classList.add('done'); go.disabled = true;
        els.forEach((b, k) => {
          b.style.animationDelay = '0s';
          if (passes(rule, items[k])) { b.classList.remove('sel'); setTimeout(() => b.classList.add('pass'), k * 60); }
          else b.classList.add('drop');
        });
        solved(1600);
        return;
      }
      els.forEach((b, k) => {
        if (b.classList.contains('sel') && !passes(rule, items[k])) {
          b.classList.remove('sel', 'no'); void b.offsetWidth; b.classList.add('no'); b.setAttribute('aria-pressed', 'false');
        }
      });
      wrong(() => els.forEach((b, k) => { if (passes(rule, items[k]) && !b.classList.contains('sel')) b.classList.add('hint'); }));
    });
    wrap.appendChild(go);
    $('answers').appendChild(wrap);
  }

  // A ✓ Check button under the answers. onCheck returns true when the puzzle is solved.
  function checkBtn(onCheck) {
    const wrap = document.createElement('div');
    wrap.className = 'check';
    const go = document.createElement('button');
    go.type = 'button'; go.className = 'btn go'; go.textContent = tx('✓ Check', '✓ Periksa');
    go.addEventListener('click', () => { if (!go.disabled && onCheck() === true) go.disabled = true; });
    wrap.appendChild(go);
    $('answers').appendChild(wrap);
  }

  // ---- Secret code ----
  // Pictures are random and mirrored left to right, like little space invaders. Easy: 4×4, medium: 5×5, hard: 6×6, very hard: 7×7, extreme: 8×8.
  function pixelArt(n) {
    for (;;) {
      const half = Math.ceil(n / 2);
      const g = Array.from({ length: n }, () => { const l = Array.from({ length: half }, () => rnd(0, 1)); return l.concat(l.slice(0, n - half).reverse()); });
      const on = g.flat().filter(Boolean).length;
      if (on >= n * n * 0.35 && on <= n * n * 0.65) return g;
    }
  }
  const gk = (g) => g.map((r) => r.join('')).join('/');
  function pixHtml(g, cls) {
    return '<div class="pix' + (cls ? ' ' + cls : '') + '" style="--n:' + g[0].length + '" aria-hidden="true">'
      + g.flat().map((b) => '<span' + (b ? ' class="on"' : '') + '></span>').join('') + '</div>';
  }
  const bitsHtml = (g) => '<div class="bits" aria-label="' + tx('Code: ', 'Kode: ') + g.map((r) => r.join(' ')).join(', ') + '">' + g.map((r) => '<div>' + r.join('') + '</div>').join('') + '</div>';
  const LEGEND = '<p class="legend"><span><i class="px"></i>0 = ' + tx('empty', 'kosong') + '</span><span><i class="px on"></i>1 = ' + tx('filled', 'terisi') + '</span></p>';
  // Pictures close to g: one row turned around, a mirrored pair of squares changed, or upside down.
  function pixVariants(g) {
    const n = g.length, copy = () => g.map((r) => r.slice()), out = [g.slice().reverse()];
    for (let k = 0; k < 8; k++) {
      const v = copy(), r = rnd(0, n - 1), c = rnd(0, Math.ceil(n / 2) - 1);
      v[r][c] = 1 - v[r][c]; v[r][n - 1 - c] = v[r][c];
      out.push(v);
    }
    for (let k = 0; k < 4; k++) { const v = copy(), r = rnd(0, n - 1); v[r] = v[r].map((b) => 1 - b); out.push(v); }
    return out;
  }
  // A row of squares as runs: [[1, 3], [0, 2]] is three filled, then two empty.
  const runsOf = (row) => row.reduce((a, b) => { if (a.length && a[a.length - 1][0] === b) a[a.length - 1][1]++; else a.push([b, 1]); return a; }, []);
  const runsKey = (rs) => rs.map(([b, c]) => c + (b ? 'F' : 'E')).join(' ');
  const runsHtml = (rs) => '<span class="rl">' + rs.map(([b, c]) => '<span class="run">' + c + '<i class="px' + (b ? ' on' : '') + '"></i></span>').join('') + '</span>';
  const runsLabel = (rs) => rs.map(([b, c]) => c + (b ? tx(' filled', ' terisi') : tx(' empty', ' kosong'))).join(', ');
  function bulbHtml(v, on, tag) {
    tag = tag || 'span';
    return '<' + tag + (tag === 'button' ? ' type="button"' : '') + ' class="bulb' + (on ? ' on' : '') + '" data-v="' + v + '"><span class="glass"></span><span class="base"></span>'
      + '<span class="val">' + v + '</span><span class="bit">' + (on ? 1 : 0) + '</span></' + tag + '>';
  }
  const BULBS = { easy: [4, 2, 1], medium: [8, 4, 2, 1], hard: [16, 8, 4, 2, 1], veryhard: [32, 16, 8, 4, 2, 1], extreme: [64, 32, 16, 8, 4, 2, 1] };
  const WORDS = {
    easy: ['CAT', 'DOG', 'SUN', 'BUS', 'HAT', 'PIG', 'BED', 'CUP', 'FOX', 'EGG', 'BOX', 'MAP', 'JAM', 'BEE', 'OWL', 'ANT', 'COW', 'HEN', 'KEY', 'PEN'],
    medium: ['FISH', 'BIRD', 'CAKE', 'STAR', 'MOON', 'TREE', 'FROG', 'BOAT', 'SHIP', 'LION', 'BEAR', 'DUCK', 'KITE', 'RAIN', 'SNOW', 'MILK'],
    hard: ['APPLE', 'HOUSE', 'ROBOT', 'TIGER', 'PLANT', 'TRAIN', 'CLOUD', 'SNAKE', 'HORSE', 'LEMON', 'PIZZA', 'MOUSE', 'RIVER', 'SMILE', 'CHAIR'],
    veryhard: ['BANANA', 'ORANGE', 'FLOWER', 'GARDEN', 'ROCKET', 'PLANET', 'BRIDGE', 'CASTLE', 'DRAGON', 'SILVER', 'WINTER', 'JUNGLE', 'MARKET', 'PENCIL', 'TURTLE'],
    extreme: ['BALLOON', 'CAPTAIN', 'DOLPHIN', 'KITCHEN', 'LANTERN', 'MONSTER', 'PICTURE', 'RAINBOW', 'SUNRISE', 'TEACHER', 'VILLAGE', 'WEATHER', 'CRAYONS', 'PUZZLES', 'THUNDER']
  };
  const shiftWord = (w, k) => w.replace(/[A-Z]/g, (ch) => String.fromCharCode((ch.charCodeAt(0) - 65 + k + 260) % 26 + 65));
  const alphaHtml = (hl) => '<div class="alpha" aria-hidden="true">' + Array.from({ length: 26 }, (_, k) => String.fromCharCode(65 + k))
    .map((ch) => '<span' + (hl.includes(ch) ? ' class="hl"' : '') + '>' + ch + '</span>').join('') + '</div>';
  const steps = (k) => k + tx(k === 1 ? ' step' : ' steps', ' langkah');

  function genCode(lvl) {
    const d = S.diff, n = { easy: 4, medium: 5, hard: 6, veryhard: 7, extreme: 8 }[d], many = d === 'easy' ? 3 : 4;
    if (lvl === 0) {
      const g = pixelArt(n), m = new Map([[gk(g), g]]);
      shuffle(pixVariants(g)).forEach((v) => { if (m.size < many && !m.has(gk(v))) m.set(gk(v), v); });
      qSay(tx('Read the code row by row. Which picture does it make?', 'Baca kodenya baris demi baris. Gambar apa yang terbentuk?'));
      $('ask').innerHTML = LEGEND + '<div class="codebox">' + bitsHtml(g) + '</div>';
      options(shuffle([...m.values()]).map((v) => ({ html: pixHtml(v, 'small'), ok: gk(v) === gk(g), label: tx('Picture ', 'Gambar ') + gk(v).replace(/\//g, ' ') })), () => solved());
      return;
    }
    if (lvl === 1) {
      const g = pixelArt(n), want = g.flat();
      qSay(tx('Paint every square that is 1 in the code.', 'Warnai setiap kotak yang berkode 1.'));
      $('ask').innerHTML = LEGEND + '<div class="codebox">' + bitsHtml(g) + '<div class="pix" id="paint" style="--n:' + n + '"></div></div>';
      const box = $('paint');
      const cells = want.map((_, k) => {
        const b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', tx('Row ', 'Baris ') + (((k / n) | 0) + 1) + tx(', square ', ', kotak ') + (k % n + 1));
        b.addEventListener('click', () => {
          if (box.classList.contains('done')) return;
          b.classList.remove('no', 'hint'); b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on')); sfx.tap();
        });
        box.appendChild(b);
        return b;
      });
      checkBtn(() => {
        const bad = cells.filter((b, k) => b.classList.contains('on') !== !!want[k]);
        if (!bad.length) { box.classList.add('done'); solved(1500); return true; }
        bad.forEach((b) => { if (b.classList.contains('on')) { b.classList.remove('on', 'no'); void b.offsetWidth; b.classList.add('no'); b.setAttribute('aria-pressed', 'false'); } });
        wrong(() => cells.forEach((b, k) => { if (want[k] && !b.classList.contains('on')) b.classList.add('hint'); }));
        return false;
      });
      return;
    }
    if (lvl === 2) {
      // Run-length code: "3 filled, 2 empty" is shorter than writing every square.
      const len = { easy: 6, medium: 8, hard: 10, veryhard: 12, extreme: 14 }[d], lo = d === 'easy' ? 2 : 3, hi = { hard: 5, veryhard: 6, extreme: 7 }[d] || 4;
      let row; do { row = Array.from({ length: len }, () => rnd(0, 1)); } while (runsOf(row).length < lo || runsOf(row).length > hi);
      const ans = runsOf(row), wrongs = [];
      ans.forEach((_, k) => [1, -1].forEach((dd) => { const v = ans.map((x) => x.slice()); v[k][1] += dd; if (v[k][1] > 0) wrongs.push(v); }));
      wrongs.push(ans.map(([b, c]) => [1 - b, c]));
      if (ans.length > 1) { const v = ans.map((x) => x.slice()); const k = rnd(0, ans.length - 2); [v[k][1], v[k + 1][1]] = [v[k + 1][1], v[k][1]]; wrongs.push(v); }
      const m = new Map([[runsKey(ans), ans]]);
      shuffle(wrongs).forEach((v) => { if (m.size < many && !m.has(runsKey(v))) m.set(runsKey(v), v); });
      const opts = shuffle([...m.values()]);
      if (hardUp(d) && Math.random() < 0.5) {
        // The other way round: read the short code and pick the row.
        qSay(tx('Each number counts squares of one kind. Which row does this short code make?', 'Setiap angka menghitung kotak sejenis. Baris mana yang dibuat kode singkat ini?'));
        $('ask').innerHTML = '<div class="codebox">' + runsHtml(ans) + '</div>';
        options(opts.map((v) => ({ html: pixHtml([v.flatMap(([b, c]) => Array(c).fill(b))], 'small'), ok: runsKey(v) === runsKey(ans), label: runsLabel(v) })), () => solved()).style.setProperty('--n', 2);
        return;
      }
      qSay(tx('Count the squares of each kind, from left to right. Which short code fits the row?', 'Hitung kotak sejenis dari kiri ke kanan. Kode singkat mana yang cocok dengan baris ini?'));
      $('ask').innerHTML = pixHtml([row], 'row');
      options(opts.map((v) => ({ html: runsHtml(v), ok: runsKey(v) === runsKey(ans), label: runsLabel(v) })), () => solved()).style.setProperty('--n', 2);
      return;
    }
    if (lvl === 3 || lvl === 4) {
      const vals = BULBS[d], max = vals.reduce((a, v) => a + v, 0);
      if (lvl === 3) {
        let bits; do { bits = vals.map(() => rnd(0, 1)); } while (!bits.some(Boolean));
        const ans = vals.reduce((a, v, k) => a + v * bits[k], 0), nums = new Set([ans]);
        shuffle([ans + 1, ans - 1, ans + 2, ans - 2, ans + vals[vals.length - 2], max - ans].filter((v) => v > 0 && v <= max)).forEach((v) => { if (nums.size < many) nums.add(v); });
        qSay(tx('Add the numbers under the lit bulbs. Which number do they make?', 'Jumlahkan angka di bawah lampu yang menyala. Angka berapa jadinya?'));
        $('ask').innerHTML = '<div class="bulbs">' + vals.map((v, k) => bulbHtml(v, bits[k])).join('') + '</div>';
        options(shuffle([...nums]).map((v) => ({ html: '<span class="numopt">' + v + '</span>', ok: v === ans, label: String(v) })), () => solved());
        return;
      }
      const target = rnd(d === 'easy' ? 2 : 3, max), live = !hardUp(d);
      qSay(tx('Turn on bulbs to make ' + target + '.', 'Nyalakan lampu untuk membuat ' + target + '.'));
      $('ask').innerHTML = '<div class="bulbs" id="bulbs">' + vals.map((v) => bulbHtml(v, 0, 'button')).join('') + '</div>'
        + '<div class="total" id="btotal" aria-live="polite"></div>';
      const bulbs = [...$('bulbs').children], lit = () => bulbs.filter((b) => b.classList.contains('on')).reduce((a, b) => a + +b.dataset.v, 0);
      const showTotal = () => { $('btotal').textContent = live ? tx('Lit: ', 'Menyala: ') + (lit() || 0) + tx(' · Goal: ', ' · Tujuan: ') + target : tx('Goal: ', 'Tujuan: ') + target; };
      showTotal();
      bulbs.forEach((b) => {
        b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', tx('Bulb ', 'Lampu ') + b.dataset.v);
        b.addEventListener('click', () => {
          if ($('bulbs').classList.contains('done')) return;
          b.classList.toggle('on'); b.classList.remove('hint');
          b.setAttribute('aria-pressed', b.classList.contains('on')); b.querySelector('.bit').textContent = b.classList.contains('on') ? 1 : 0;
          sfx.tap(); showTotal();
        });
      });
      checkBtn(() => {
        if (lit() === target) { $('bulbs').classList.add('done'); solved(1500); return true; }
        // Only one set of bulbs makes each number: the binary digits of the target.
        wrong(() => bulbs.forEach((b) => { if (((target & +b.dataset.v) > 0) !== b.classList.contains('on')) b.classList.add('hint'); }));
        return false;
      });
      return;
    }
    // Shifted letters, like a Caesar cipher. Easy moves 1 step, medium 1 or 2, hard up to 3, very hard 2 to 4, extreme 3 to 7.
    const k = d === 'easy' ? 1 : d === 'medium' ? rnd(1, 2) : d === 'hard' ? rnd(1, 3) : d === 'veryhard' ? rnd(2, 4) : rnd(3, 7), pool = WORDS[d], word = pick(pool), coded = shiftWord(word, k);
    if (lvl === 5) {
      const others = shuffle(pool.filter((w) => w !== word)).slice(0, many - 2);
      qSay(tx('Every letter of this message moved ' + steps(k) + ' forward. Move each one ' + steps(k) + ' back to read it.', 'Setiap huruf pesan ini bergeser maju ' + steps(k) + '. Geser tiap huruf mundur ' + steps(k) + ' untuk membacanya.'));
      $('ask').innerHTML = '<span class="secret" aria-label="' + tx('Secret message: ', 'Pesan rahasia: ') + coded.split('').join(' ') + '">' + coded + '</span>'
        + '<p class="shift">' + tx('Each letter moved ' + steps(k) + ' forward.', 'Setiap huruf bergeser maju ' + steps(k) + '.') + '</p>' + alphaHtml(d === 'easy' ? coded : '');
      const opts = [word, ...others, shiftWord(coded, k)];
      options(shuffle([...new Set(opts)].slice(0, many)).map((w) => ({ html: '<span class="wordopt">' + w + '</span>', ok: w === word, label: w.toLowerCase() })), () => solved())
        .style.setProperty('--n', word.length > 4 ? 2 : many);
      return;
    }
    const opts = new Set([coded, shiftWord(word, -k), shiftWord(word, k + 1), coded.slice(0, -1) + shiftWord(word.slice(-1), k + 1)]);
    if (k > 1) opts.add(shiftWord(word, k - 1));
    qSay(tx('Write ' + word + ' in code: move each letter ' + steps(k) + ' forward.', 'Tulis ' + word + ' dengan kode: geser tiap huruf maju ' + steps(k) + '.'));
    $('ask').innerHTML = '<span class="secret plain" aria-label="' + tx('Word: ', 'Kata: ') + word.split('').join(' ') + '">' + word + '</span>'
      + '<p class="shift">' + tx('Move each letter ' + steps(k) + ' forward.', 'Geser tiap huruf maju ' + steps(k) + '.') + '</p>' + alphaHtml(d === 'easy' ? word : '');
    const list = [coded, ...shuffle([...opts].filter((w) => w !== coded))].slice(0, many);
    options(shuffle(list).map((w) => ({ html: '<span class="wordopt">' + w + '</span>', ok: w === coded, label: w.split('').join(' ') })), () => solved())
      .style.setProperty('--n', word.length > 4 ? 2 : many);
  }

  // ---- Mini Sudoku ----
  // [size, gaps] for each level. A 3×3 grid has no boxes; 4×4 has boxes of 2×2 and 6×6 boxes of 2 rows × 3 columns.
  // Every puzzle has exactly one solution, so it can always be worked out without guessing.
  const SUDOKU = {
    easy: [[3, 2], [3, 3], [3, 4], [4, 4], [4, 6], [4, 7], [4, 8]],
    medium: [[4, 3], [4, 5], [4, 7], [4, 8], [4, 10], [6, 12], [6, 16]],
    hard: [[4, 6], [4, 8], [4, 10], [6, 14], [6, 17], [6, 20], [6, 22]],
    // A puzzle takes out as many squares as it can while staying unique, so the 36 on Extreme means "as few clues as possible".
    veryhard: [[4, 10], [6, 18], [6, 20], [6, 22], [6, 24], [6, 26], [6, 28]],
    extreme: [[6, 22], [6, 24], [6, 26], [6, 30], [6, 36], [6, 36], [6, 36]]
  };
  const SYMS = [it('circle', 'red'), it('square', 'blue'), it('triangle', 'green'), it('star', 'yellow'), it('heart', 'purple'), it('diamond', '#f2891f')];
  const symName = (x) => (IDL ? sName(x.s) + ' ' + (x.c[0] === '#' ? 'oranye' : cName(x.c)) : (x.c[0] === '#' ? 'orange' : x.c) + ' ' + x.s);
  const boxOf = (n) => (n === 4 ? [2, 2] : n === 6 ? [2, 3] : null);
  function sdkFits(g, n, r, c, v) {
    for (let k = 0; k < n; k++) if (g[r * n + k] === v || g[k * n + c] === v) return false;
    const b = boxOf(n);
    if (b) {
      const r0 = r - r % b[0], c0 = c - c % b[1];
      for (let i = 0; i < b[0]; i++) for (let j = 0; j < b[1]; j++) if (g[(r0 + i) * n + c0 + j] === v) return false;
    }
    return true;
  }
  function sdkFill(g, n) {
    const k = g.indexOf(-1);
    if (k < 0) return true;
    for (const v of shuffle([...Array(n).keys()])) {
      if (sdkFits(g, n, (k / n) | 0, k % n, v)) { g[k] = v; if (sdkFill(g, n)) return true; g[k] = -1; }
    }
    return false;
  }
  // Counts solutions, stopping at `limit`.
  function sdkCount(g, n, limit) {
    const k = g.indexOf(-1);
    if (k < 0) return 1;
    let c = 0;
    for (let v = 0; v < n && c < limit; v++) {
      if (sdkFits(g, n, (k / n) | 0, k % n, v)) { g[k] = v; c += sdkCount(g, n, limit - c); g[k] = -1; }
    }
    return c;
  }
  function makeSudoku(n, gaps) {
    const sol = Array(n * n).fill(-1);
    sdkFill(sol, n);
    const puz = sol.slice();
    let gone = 0;
    for (const k of shuffle([...sol.keys()])) {
      if (gone >= gaps) break;
      const v = puz[k];
      puz[k] = -1;
      if (sdkCount(puz.slice(), n, 2) === 1) gone++; else puz[k] = v;
    }
    return { sol, puz };
  }
  function genSudoku(lvl) {
    const [n, gaps] = SUDOKU[S.diff][lvl], { sol, puz } = makeSudoku(n, gaps), b = boxOf(n), syms = SYMS.slice(0, n), cur = puz.slice();
    let sel = -1;
    qSay(b ? tx('Fill the gaps. Every row, column and box has each shape once.', 'Isi yang kosong. Setiap baris, kolom, dan kotak berisi tiap bentuk satu kali.') : tx('Fill the gaps. Every row and column has each shape once.', 'Isi yang kosong. Setiap baris dan kolom berisi tiap bentuk satu kali.'));
    $('ask').innerHTML = '<div class="sdk" id="sdk" style="--n:' + n + '"></div>';
    const grid = $('sdk');
    const label = (k) => tx('Row ', 'Baris ') + (((k / n) | 0) + 1) + tx(', column ', ', kolom ') + (k % n + 1) + ': ' + (cur[k] >= 0 ? symName(syms[cur[k]]) : tx('empty', 'kosong'));
    const paint = (k) => { cells[k].innerHTML = cur[k] >= 0 ? itemSvg(syms[cur[k]]) : ''; cells[k].setAttribute('aria-label', label(k)); };
    const select = (k) => { sel = k; cells.forEach((c, j) => c.classList.toggle('sel', j === k)); };
    const cells = cur.map((v, k) => {
      const c = document.createElement('button'), r = (k / n) | 0, col = k % n;
      c.type = 'button';
      c.className = (puz[k] >= 0 ? 'given' : '') + (b && col % b[1] === b[1] - 1 && col < n - 1 ? ' bR' : '') + (b && r % b[0] === b[0] - 1 && r < n - 1 ? ' bB' : '');
      if (puz[k] >= 0) c.setAttribute('aria-disabled', 'true');
      c.addEventListener('click', () => { if (puz[k] < 0 && !grid.classList.contains('done')) { select(k); sfx.tap(); } });
      grid.appendChild(c);
      return c;
    });
    cells.forEach((_, k) => paint(k));
    select(cur.indexOf(-1));
    function put(v) {
      if (sel < 0 || grid.classList.contains('done')) return;
      cur[sel] = v; cells[sel].classList.remove('no', 'hint'); paint(sel); sfx.tap();
      if (v < 0) return;
      const after = cur.findIndex((x, j) => x < 0 && j > sel), first = cur.indexOf(-1);
      if (after >= 0 || first >= 0) select(after >= 0 ? after : first);
    }
    const pal = document.createElement('div');
    pal.className = 'sdkPal';
    syms.forEach((x, v) => {
      const p = document.createElement('button');
      p.type = 'button'; p.innerHTML = itemSvg(x); p.setAttribute('aria-label', tx('Put a ', 'Taruh ') + symName(x));
      p.addEventListener('click', () => put(v));
      pal.appendChild(p);
    });
    const er = document.createElement('button');
    er.type = 'button'; er.textContent = '⌫'; er.setAttribute('aria-label', tx('Clear the square', 'Kosongkan kotak'));
    er.addEventListener('click', () => put(-1));
    pal.appendChild(er);
    $('answers').appendChild(pal);
    checkBtn(() => {
      if (grid.classList.contains('done')) return true;
      if (cur.includes(-1)) { qSay(tx('Fill every gap first, then press ✓ Check.', 'Isi semua yang kosong dulu, lalu tekan ✓ Periksa.')); select(cur.indexOf(-1)); return false; }
      const bad = cur.map((v, k) => (v !== sol[k] ? k : -1)).filter((k) => k >= 0);
      if (!bad.length) {
        grid.classList.add('done'); select(-1);
        cells.forEach((c, k) => setTimeout(() => c.classList.add('win'), k * 30));
        solved(1800);
        return true;
      }
      bad.forEach((k) => { cells[k].classList.remove('no'); void cells[k].offsetWidth; cells[k].classList.add('no'); });
      select(bad[0]);
      // After two tries, one wrong square is filled in for the child.
      wrong(() => { const k = bad[0]; cur[k] = sol[k]; paint(k); cells[k].classList.remove('no'); cells[k].classList.add('hint'); select(bad[1] === undefined ? -1 : bad[1]); });
      return false;
    });
  }

  // ---- Who Is It? ----
  // Each friend has one pet and no two have the same. The clues are picked at random from true ones until only
  // one way to hand out the pets fits them all, then any clue that is not needed is dropped.
  const FRIENDS = [['Mia', '👧'], ['Leo', '👦'], ['Sara', '👧🏽'], ['Omar', '👦🏾'], ['Rina', '👧🏻'], ['Budi', '👦🏻']];
  const PETS = [
    { e: '🐱', n: tx('cat', 'kucing'), says: tx('says meow', 'mengeong'), no: tx('does not say meow', 'tidak mengeong') }, { e: '🐶', n: tx('dog', 'anjing'), says: tx('barks', 'menggonggong'), no: tx('does not bark', 'tidak menggonggong') },
    { e: '🐟', n: tx('fish', 'ikan'), says: tx('lives in water', 'hidup di air'), no: tx('does not live in water', 'tidak hidup di air') }, { e: '🐦', n: tx('bird', 'burung'), says: tx('can fly', 'bisa terbang'), no: tx('cannot fly', 'tidak bisa terbang') },
    { e: '🐢', n: tx('turtle', 'kura-kura'), says: tx('has a shell', 'punya cangkang'), no: tx('has no shell', 'tidak punya cangkang') }, { e: '🐰', n: tx('rabbit', 'kelinci'), says: tx('has long ears', 'punya telinga panjang'), no: tx('does not have long ears', 'tidak punya telinga panjang') }
  ];
  // [friends, clue kinds] for each level and difficulty.
  const CLUES = {
    easy: [[2, 'not'], [2, 'is,not'], [3, 'not'], [3, 'pet,not'], [3, 'either,not,pet'], [3, 'either,not,pet,nopet'], [4, 'not,pet,nopet,either']],
    medium: [[2, 'not'], [3, 'is,not'], [3, 'not'], [4, 'pet,not'], [4, 'either,not,pet'], [4, 'either,not,pet,nopet,neither'], [5, 'not,pet,nopet,either,neither']],
    hard: [[3, 'not'], [3, 'not,pet'], [4, 'not'], [4, 'pet,nopet,not'], [5, 'either,not,pet,nopet'], [5, 'either,not,pet,nopet,neither'], [5, 'not,nopet,either,neither']],
    veryhard: [[4, 'not,pet'], [5, 'either,not,pet'], [5, 'not,pet,nopet,either,neither'], [6, 'is,not,pet'], [6, 'either,not,pet,nopet'], [6, 'either,not,pet,nopet,neither'], [6, 'not,nopet,either,neither']],
    extreme: [[5, 'not,nopet,either,neither'], [6, 'pet,not,nopet'], [6, 'either,not,pet,nopet'], [6, 'either,neither,not,nopet'], [6, 'either,neither,not,nopet,pet'], [6, 'not,nopet,either,neither'], [6, 'not,nopet,neither']]
  };
  function perms(n) {
    if (n === 1) return [[0]];
    return perms(n - 1).flatMap((p) => Array.from({ length: n }, (_, k) => [...p.slice(0, k), n - 1, ...p.slice(k)]));
  }
  // A clue as a test on a way of handing out the pets (a[i] is the pet of friend i), and as words.
  function clueOf(kind, i, j, k, friends, pets) {
    const F = (x) => friends[x][0], Pn = (x) => tx('the ', '') + pets[x].e + ' ' + pets[x].n;
    if (kind === 'is') return { ok: (a) => a[i] === j, text: F(i) + tx(' has ', ' punya ') + Pn(j) + '.' };
    if (kind === 'not') return { ok: (a) => a[i] !== j, text: F(i) + tx(' does not have ', ' tidak punya ') + Pn(j) + '.' };
    if (kind === 'pet') return { ok: (a) => a[i] === j, text: tx(F(i) + '’s pet ', 'Hewan peliharaan ' + F(i) + ' ') + pets[j].says + '.' };
    if (kind === 'nopet') return { ok: (a) => a[i] !== j, text: tx(F(i) + '’s pet ', 'Hewan peliharaan ' + F(i) + ' ') + pets[j].no + '.' };
    if (kind === 'either') return { ok: (a) => a[i] === j || a[k] === j, text: tx(Pn(j)[0].toUpperCase() + Pn(j).slice(1) + ' belongs to ' + F(i) + ' or ' + F(k) + '.', Pn(j) + ' milik ' + F(i) + ' atau ' + F(k) + '.') };
    return { ok: (a) => a[i] !== j && a[k] !== j, text: tx('Neither ' + F(i) + ' nor ' + F(k) + ' has ' + Pn(j) + '.', 'Baik ' + F(i) + ' maupun ' + F(k) + ' tidak punya ' + Pn(j) + '.') };
  }
  function makeClues(n, kinds, friends, pets) {
    const all = perms(n), sol = pick(all), pool = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      for (const kind of kinds) {
        if ((kind === 'is' || kind === 'pet') && sol[i] === j) pool.push(clueOf(kind, i, j, 0, friends, pets));
        if ((kind === 'not' || kind === 'nopet') && sol[i] !== j) pool.push(clueOf(kind, i, j, 0, friends, pets));
        for (let k = i + 1; k < n; k++) {
          if (kind === 'either' && (sol[i] === j || sol[k] === j)) pool.push(clueOf(kind, i, j, k, friends, pets));
          if (kind === 'neither' && sol[i] !== j && sol[k] !== j) pool.push(clueOf(kind, i, j, k, friends, pets));
        }
      }
    }
    const fits = (cs) => all.filter((a) => cs.every((c) => c.ok(a))).length;
    let chosen = [];
    for (const c of shuffle(pool)) {
      if (fits(chosen) === 1) break;
      if (fits(chosen.concat(c)) < fits(chosen)) chosen.push(c);
    }
    for (const c of shuffle(chosen.slice())) { const rest = chosen.filter((x) => x !== c); if (fits(rest) === 1) chosen = rest; }
    return { sol, clues: shuffle(chosen) };
  }
  function genClues(lvl) {
    const [n, kinds] = CLUES[S.diff][lvl], friends = shuffle(FRIENDS.slice()).slice(0, n), pets = shuffle(PETS.slice()).slice(0, n);
    const { sol, clues } = makeClues(n, kinds.split(','), friends, pets), cur = Array(n).fill(-1);
    let sel = 0;
    qSay(tx('Read the clues. Which pet belongs to which friend?', 'Baca petunjuknya. Hewan peliharaan mana milik teman yang mana?'));
    $('ask').innerHTML = '<div class="clues" id="clueList"></div><div class="people" id="people" style="--n:' + n + '"></div>';
    clues.forEach((c, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'clue'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<span class="n" aria-hidden="true">' + (k + 1) + '</span><span></span>';
      b.lastChild.textContent = c.text;
      // Tapping a clue crosses it out, to keep track of the ones already used.
      b.addEventListener('click', () => { b.classList.toggle('used'); b.setAttribute('aria-pressed', b.classList.contains('used')); sfx.tap(); });
      $('clueList').appendChild(b);
    });
    const people = friends.map(([name, av], i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'person';
      b.innerHTML = '<span class="av" aria-hidden="true">' + av + '</span><span class="nm"></span><span class="has" aria-hidden="true"></span>';
      b.querySelector('.nm').textContent = name;
      b.addEventListener('click', () => { if (!$('people').classList.contains('done')) { select(i); sfx.tap(); } });
      $('people').appendChild(b);
      return b;
    });
    const pal = document.createElement('div');
    pal.className = 'pets';
    const petBtns = pets.map((x, j) => {
      const b = document.createElement('button');
      b.type = 'button'; b.innerHTML = '<span class="e" aria-hidden="true">' + x.e + '</span>' + x.n;
      b.setAttribute('aria-label', tx('Give the ', 'Beri ') + x.n);
      b.addEventListener('click', () => give(j));
      pal.appendChild(b);
      return b;
    });
    $('answers').appendChild(pal);
    function paint() {
      people.forEach((b, i) => {
        b.querySelector('.has').textContent = cur[i] >= 0 ? pets[cur[i]].e : '?';
        b.classList.toggle('sel', i === sel);
        b.setAttribute('aria-label', friends[i][0] + ': ' + (cur[i] >= 0 ? tx('the ', '') + pets[cur[i]].n : tx('no pet yet', 'belum punya hewan')));
      });
      petBtns.forEach((b, j) => b.classList.toggle('taken', cur.includes(j)));
    }
    function select(i) { sel = i; paint(); }
    function give(j) {
      if (sel < 0 || $('people').classList.contains('done')) return;
      const had = cur.indexOf(j);
      if (had >= 0) { cur[had] = -1; people[had].classList.remove('no'); }
      cur[sel] = j; people[sel].classList.remove('no', 'hint'); sfx.tap();
      const next = cur.findIndex((x, i) => x < 0 && i > sel), first = cur.indexOf(-1);
      sel = next >= 0 ? next : first;
      paint();
    }
    paint();
    checkBtn(() => {
      if (cur.includes(-1)) { qSay(tx('Give every friend a pet first, then press ✓ Check.', 'Beri setiap teman hewan peliharaan dulu, lalu tekan ✓ Periksa.')); select(cur.indexOf(-1)); return false; }
      const bad = cur.map((v, i) => (v !== sol[i] ? i : -1)).filter((i) => i >= 0);
      if (!bad.length) {
        $('people').classList.add('done'); sel = -1; paint();
        people.forEach((b, i) => setTimeout(() => b.classList.add('win'), i * 80));
        solved(1700);
        return true;
      }
      bad.forEach((i) => { people[i].classList.remove('no'); void people[i].offsetWidth; people[i].classList.add('no'); });
      select(bad[0]);
      // After two tries, one friend gets the right pet.
      wrong(() => {
        const i = bad[0], j = sol[i], had = cur.indexOf(j);
        if (had >= 0) cur[had] = -1;
        cur[i] = j; people[i].classList.remove('no'); people[i].classList.add('hint');
        select(cur.indexOf(-1));
      });
      return false;
    });
  }

  // ---- Sort the Train ----
  // Swapping two neighbours that are in the wrong order fixes exactly one "pair the wrong way round", so the fewest
  // swaps is the number of such pairs. A swap of two neighbours already in order is a wasted move and counts as a miss.
  const TRAIN = { easy: [3, 3, 4, 4, 4, 5, 5], medium: [3, 4, 5, 5, 5, 6, 6], hard: [4, 5, 6, 6, 6, 7, 7], veryhard: [5, 6, 7, 8, 8, 9, 9], extreme: [6, 7, 8, 9, 10, 10, 10] };
  const inversions = (a, before) => a.reduce((n, x, i) => n + a.slice(i + 1).filter((y) => before(y, x)).length, 0);
  function genTrain(lvl) {
    const n = TRAIN[S.diff][lvl];
    const kind = lvl === 3 ? 'down' : lvl === 4 ? 'abc' : lvl === 6 ? pick(['up', 'down', 'abc']) : 'up';
    const top = S.diff === 'easy' ? 9 : S.diff === 'medium' ? 20 : 99;
    let vals;
    if (kind === 'abc') vals = shuffle('ABCDEFGHIJKLMNOPRSTUW'.split('')).slice(0, n);
    else { const set = new Set(); while (set.size < n) set.add(rnd(1, Math.max(top, n + 2))); vals = [...set]; }
    const before = kind === 'down' ? (x, y) => x > y : (x, y) => x < y;
    do shuffle(vals); while (inversions(vals, before) < Math.min(2, n - 1));
    const par = inversions(vals, before);
    let swaps = 0, sel = -1;
    const how = window.LogicaUI ? tx('Drag a wagon to move it.', 'Seret gerbong untuk memindahkannya.') : tx('Tap two wagons side by side to swap them.', 'Ketuk dua gerbong yang bersebelahan untuk menukarnya.');
    qSay(kind === 'down' ? tx('Put the wagons in order, biggest first. ', 'Urutkan gerbong, terbesar dulu. ') + how
      : kind === 'abc' ? tx('Put the wagons in ABC order. ', 'Urutkan gerbong menurut abjad. ') + how
        : tx('Put the wagons in order, smallest first. ', 'Urutkan gerbong, terkecil dulu. ') + how);
    // With the Arc bundle the wagons are a list to drag (or move with the arrow keys); without it, tap two wagons.
    const list = !!window.LogicaUI;
    $('ask').innerHTML = (list ? '<div class="trainlist" id="train"></div>' : '<div class="train" id="train" style="--n:' + (n + 1) + '"></div><div class="rails" aria-hidden="true"></div>')
      + '<p class="swaps" id="swaps" aria-live="polite"></p>';
    const train = $('train');
    let hinted = [];
    function paint(swapped) {
      if (list) {
        window.LogicaUI.reorder(train, { items: vals.map(String), hinted, label: tx('Wagons, in train order', 'Gerbong, menurut urutan kereta'), onReorder: reorder });
      } else {
        train.innerHTML = '<span class="engine" aria-hidden="true">🚂</span>';
        vals.forEach((v, i) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'wagon' + (i === sel ? ' sel' : '') + (swapped && swapped.includes(i) ? ' swap' : '') + (hinted.includes(String(v)) ? ' hint' : '');
          b.textContent = v; b.setAttribute('aria-label', tx('Wagon ', 'Gerbong ') + (i + 1) + ': ' + v + (i === sel ? tx(', picked', ', dipilih') : ''));
          b.addEventListener('click', () => tap(i));
          train.appendChild(b);
        });
      }
      $('swaps').textContent = tx('Swaps: ', 'Tukar: ') + swaps + tx(' · Fewest: ', ' · Paling sedikit: ') + par;
    }
    // Swaps the wagons at a and a + 1; true if that moved the train closer to the order.
    function swapAt(a) {
      const fixes = before(vals[a + 1], vals[a]);
      [vals[a], vals[a + 1]] = [vals[a + 1], vals[a]];
      swaps++;
      return fixes;
    }
    // After one or more swaps. A wasted swap is a miss; after two, a pair in the wrong order glows.
    function settle(wasted, swapped) {
      sel = -1; hinted = []; sfx.drop();
      paint(swapped);
      if (!inversions(vals, before)) {
        train.classList.add('done');
        [...train.querySelectorAll('.wagon')].forEach((w, k) => setTimeout(() => w.classList.add('done'), k * 70));
        sfx.whir(); solved(1600);
        return;
      }
      if (wasted) wrong(() => {
        const k = vals.findIndex((v, j) => j + 1 < vals.length && before(vals[j + 1], v));
        hinted = [String(vals[k]), String(vals[k + 1])];
        paint();
      });
    }
    function tap(i) {
      if (train.classList.contains('done')) return;
      if (sel < 0 || sel === i || Math.abs(sel - i) > 1) { sel = sel === i ? -1 : i; sfx.tap(); paint(); return; }
      const a = Math.min(sel, i);
      settle(!swapAt(a), [a, a + 1]);
    }
    // The list reports the whole new order. One wagon moved: count it as the side-by-side swaps it takes to get there,
    // so the fewest swaps and the wasted swaps mean the same as when tapping.
    function reorder(order) {
      if (train.classList.contains('done')) return;
      const cur = vals.map(String);
      const i = cur.findIndex((v, k) => v !== order[k]);
      if (i < 0) return;
      const from = cur.indexOf(order[i]);
      const up = cur.slice(); up.splice(i, 0, up.splice(from, 1)[0]);
      let steps;
      if (up.every((v, k) => v === order[k])) steps = Array.from({ length: from - i }, (_, k) => from - 1 - k);
      else { const to = order.indexOf(cur[i]); steps = Array.from({ length: to - i }, (_, k) => i + k); }
      let wasted = false;
      steps.forEach((a) => { if (!swapAt(a)) wasted = true; });
      settle(wasted);
    }
    paint();
  }

  // ---- Tower of Poka ----
  // A state has one number per disk, smallest first: the peg (0, 1 or 2) the disk stands on. Every such list is a legal
  // position, because the order of a stack follows the sizes. A breadth-first search outward from the goal gives the
  // fewest moves from every position, which is the "fewest" shown, the check for a wrong turn and the hint.
  const HANOI = { easy: [2, 3, 3, 3, 3, 4, 4], medium: [3, 3, 4, 4, 4, 5, 5], hard: [3, 4, 4, 5, 5, 5, 6], veryhard: [4, 4, 5, 5, 5, 6, 6], extreme: [5, 5, 6, 6, 6, 6, 6] }; // six disks is the most: there are six colors
  const HANOI_CAP = { easy: 15, medium: 31, hard: 40, veryhard: 63, extreme: 63 }; // the most moves a random puzzle may need
  const HANOI_KIND = ['tower', 'tower', 'middle', 'messy', 'rebuild', 'tower', 'mixed'];
  const HANOI_COLORS = ['var(--c-red)', 'var(--c-orange)', '#ca8a04', 'var(--c-green)', 'var(--c-blue)', 'var(--c-purple)'];
  const PEG_NAMES = [tx('left', 'kiri'), tx('middle', 'tengah'), tx('right', 'kanan')];
  const diskHtml = (d, n) => '<i class="disk" style="--w:' + (d + 1) / n + ';--c:' + HANOI_COLORS[d] + '">' + (d + 1) + '</i>';
  // Each stack lists its disks from the top down. Used for the goal picture and the guide.
  const miniTower = (stacks, n) => '<span class="mtower" style="--n:' + n + '">'
    + stacks.map((st) => '<span class="mpeg">' + st.map((d) => diskHtml(d, n)).join('') + '</span>').join('') + '</span>';
  const hanoiStacks = (s) => [0, 1, 2].map((p) => s.flatMap((q, d) => (q === p ? [d] : [])));
  function hanoiMoves(s) {
    const out = [];
    s.forEach((from, d) => {
      const smaller = s.slice(0, d);
      if (smaller.includes(from)) return; // something smaller sits on it
      for (let to = 0; to < 3; to++) if (to !== from && !smaller.includes(to)) out.push({ from, to, next: s.map((q, k) => (k === d ? to : q)) });
    });
    return out;
  }
  function hanoiDist(goal) {
    const dist = new Map([[goal.join(''), 0]]), queue = [goal];
    for (let h = 0; h < queue.length; h++) {
      const d = dist.get(queue[h].join(''));
      hanoiMoves(queue[h]).forEach((m) => { const key = m.next.join(''); if (!dist.has(key)) { dist.set(key, d + 1); queue.push(m.next); } });
    }
    return dist;
  }
  function genHanoi(lvl) {
    const n = HANOI[S.diff][lvl], cap = HANOI_CAP[S.diff];
    let kind = HANOI_KIND[lvl];
    if (kind === 'mixed') kind = pick(['messy', 'rebuild']);
    const all = (p) => Array(n).fill(p), spread = (s) => new Set(s).size > 1, random = () => Array.from({ length: n }, () => rnd(0, 2));
    let start, goal, dist, par;
    for (let tries = 0; ; tries++) {
      if (tries === 300) kind = 'tower'; // cannot happen in practice; never loop forever
      if (kind === 'tower') { start = all(0); goal = all(2); }
      else if (kind === 'middle') { start = all(0); goal = all(1); }
      else if (kind === 'messy') { start = random(); goal = all(rnd(0, 2)); }
      else { start = random(); goal = random(); }
      dist = hanoiDist(goal); par = dist.get(start.join(''));
      if (kind === 'tower' || kind === 'middle' || (par >= 3 && par <= cap && spread(start) && (kind === 'messy' || spread(goal)))) break;
    }
    const standard = kind === 'tower' || kind === 'middle';
    const flagged = !spread(goal), goalPeg = goal[0], showPar = !hardUp(S.diff);
    let cur = start.slice(), moves = 0, sel = -1, flash = -1, hint = [], done = false;
    const history = [];
    qSay(flagged ? (standard ? tx('Move the whole tower to the 🏁 peg. ', 'Pindahkan seluruh menara ke tiang 🏁. ') : tx('Build the tower on the 🏁 peg. ', 'Bangun menara di tiang 🏁. ')) + tx('Tap a peg, then tap where the top disk goes.', 'Ketuk tiang, lalu ketuk tempat cakram teratas dipindahkan.')
      : tx('Make the picture, one disk at a time. Tap a peg, then tap where the top disk goes.', 'Buat gambarnya, satu cakram setiap kali. Ketuk tiang, lalu ketuk tempat cakram teratas dipindahkan.'));
    $('ask').innerHTML = (flagged ? '' : '<div class="goalpic">' + tx('Make this: ', 'Buat ini: ') + miniTower(hanoiStacks(goal), n) + '</div>')
      + '<div class="hanoi" id="hanoi" style="--n:' + n + '"></div><p class="swaps" id="moves" aria-live="polite"></p>'
      + '<button type="button" class="btn ghost hUndo" id="hUndo">' + tx('↩ Undo', '↩ Urungkan') + '</button>';
    const box = $('hanoi');
    function paint() {
      const had = box.contains(document.activeElement) ? [...box.children].indexOf(document.activeElement) : -1;
      box.innerHTML = '';
      hanoiStacks(cur).forEach((st, p) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'peg' + (p === sel ? ' sel' : '') + (hint.includes(p) ? ' hint' : '') + (p === flash ? ' no' : '');
        b.setAttribute('aria-label', tx('Peg ', 'Tiang ') + (p + 1) + ' (' + PEG_NAMES[p] + ')' + (flagged && p === goalPeg ? tx(', goal', ', tujuan') : '') + (p === sel ? tx(', picked', ', dipilih') : '') + ': '
          + (st.length ? tx('disks ' + st.map((d) => d + 1).reverse().join(', ') + ' from bottom to top', 'cakram ' + st.map((d) => d + 1).reverse().join(', ') + ' dari bawah ke atas') : tx('empty', 'kosong')));
        b.innerHTML = (flagged && p === goalPeg ? '<span class="flag" aria-hidden="true">🏁</span>' : '')
          + '<span class="stack" aria-hidden="true">' + st.map((d) => diskHtml(d, n)).join('') + '</span>';
        b.addEventListener('click', () => tap(p));
        box.appendChild(b);
      });
      if (had >= 0) box.children[had].focus();
      $('moves').textContent = tx('Moves: ', 'Gerakan: ') + moves + (showPar ? tx(' · Fewest: ', ' · Paling sedikit: ') + par : '');
      $('hUndo').disabled = done || !history.length;
    }
    function tap(p) {
      if (done) return;
      const top = (q) => cur.indexOf(q); // the smallest disk on a peg is its top; -1 for an empty peg
      if (sel < 0) { if (top(p) >= 0) { sel = p; sfx.tap(); paint(); } return; }
      if (sel === p) { sel = -1; sfx.tap(); paint(); return; }
      const d = top(sel), t = top(p);
      if (t >= 0 && t < d) { // a big disk on a small one: not a miss, just not allowed
        sel = -1; flash = p; sfx.bad(); qSay(tx('A big disk can\'t sit on a small one.', 'Cakram besar tidak boleh di atas cakram kecil.'), 'oops'); paint(); flash = -1;
        return;
      }
      const was = dist.get(cur.join(''));
      history.push(cur); cur = cur.map((q, k) => (k === d ? p : q)); moves++; sel = -1; hint = [];
      sfx.drop();
      const now = dist.get(cur.join(''));
      if (!now) {
        done = true; paint(); box.classList.add('done');
        sfx.whir(); solved(standard ? 3200 : 1600);
        if (standard) qSay(tx('The fewest for ' + n + ' disks is ' + par + ' moves. One more disk doubles that and adds one!', 'Paling sedikit untuk ' + n + ' cakram adalah ' + par + ' gerakan. Satu cakram lagi menggandakannya lalu menambah satu!'), 'cheer');
        return;
      }
      if (now > was) { // a wrong turn: the goal is now further away
        let hinted = false;
        wrong(() => {
          const best = hanoiMoves(cur).reduce((a, m) => (dist.get(m.next.join('')) < dist.get(a.next.join('')) ? m : a));
          hint = [best.from, best.to]; hinted = true;
        });
        qSay(hinted ? tx('That moved you further away. Look at the glowing pegs, or press ↩ Undo.', 'Itu membuatmu makin jauh. Lihat tiang yang bersinar, atau tekan ↩ Urungkan.') : tx('That moved you further away. Press ↩ Undo, or keep thinking!', 'Itu membuatmu makin jauh. Tekan ↩ Urungkan, atau pikir lagi!'), 'oops');
      }
      paint();
    }
    $('hUndo').addEventListener('click', () => {
      if (done || !history.length) return;
      cur = history.pop(); moves--; sel = -1; hint = []; sfx.tap(); paint();
    });
    paint();
  }

  // ---- Poka's Parking Lot ----
  // A car cannot leave its lane: v is true for a car that goes up and down, f is the column (or row) of its lane and len is
  // how many cells it covers. Where a car is, is one number, its place along the lane. Car 0 is the police car; it goes up
  // and down and the exit is under its lane. A state is the list of places. A move slides one car any number of free cells.
  // A search from the start finds every position the cars can reach, and a search outward from the positions where the
  // police car is at the exit gives the fewest moves from each one: the "fewest" shown, the check for a wrong turn and the hint.
  // Per difficulty: n is the size of the lot and each level is [cars, trucks allowed, fewest moves at least, at most].
  const PARK = {
    easy: { n: 5, lv: [[4, 0, 2, 3], [4, 0, 3, 4], [5, 1, 4, 5], [5, 1, 5, 6], [6, 1, 6, 7], [6, 1, 7, 8]] },
    medium: { n: 6, lv: [[5, 0, 3, 4], [6, 0, 4, 6], [6, 1, 5, 7], [7, 1, 6, 8], [7, 1, 7, 9], [8, 1, 8, 10]] },
    hard: { n: 6, lv: [[6, 0, 4, 6], [7, 1, 6, 8], [8, 1, 8, 10], [8, 1, 9, 11], [9, 1, 10, 12], [8, 1, 10, 13]] },
    veryhard: { n: 6, bank: true }, extreme: { n: 6, bank: true }
  };
  const PARK_COLORS = ['#1f2937', 'var(--c-red)', 'var(--c-orange)', '#ca8a04', 'var(--c-green)', 'var(--c-blue)', 'var(--c-purple)', 'var(--c-pink)', 'var(--c-teal)', 'var(--c-lime)', 'var(--c-rose)', 'var(--c-indigo)'];
  const PARK_STATES = 6000; // a lot with more positions than this is dropped: it would take too long to search
  // Very hard and Extreme come from a bank: lots this hard are far too slow to find while playing. Each level has 30 lots, and each
  // level's lots are a little further from the exit than the last level's. A lot is four digits per car, the police car first:
  // vertical (1) or not, lane, length, place along the lane. They were found by an offline search for lots with a long way out,
  // keeping the start furthest from the exit; the fewest moves of each is worked out when it is played. tools/check-park.mjs checks them.
  const PARK_BANK = {
    veryhard: [
      ['11211522052402221430032113331423', '112210330421142415301030132303240222052201211421', '15220532102313321021013104240520', '15200233022103220324103205300523', '1220132414230524023114210322102410220120',
       '102012231330012405320021052015240423122115221123', '102011201431133012200420033112240024', '1022023100240520142304220120132004201421', '152011220421042302220224012005331220', '132214200320153015230422112410210031143205231231',
       '15210120132412300332042410320223', '10201230002402201422132013320531152114241533', '122014211330102403241031152403220020112305210221', '12220032113004311520142402241523', '15211230022304241324033200201031',
       '1321153305220323112211241424122315211220', '12210120032205211023112305230324', '14200020022315230524112415300522043211220022', '132010220331013002310522042004221524052015210024', '1121102203321531122410201524042002221324',
       '1520002311240224052205241331123111220021012010241022', '10221131152403240432002105200322022304201320', '15210321022102231323042413201124', '10220332043013240120023205201220', '1122143313231330002411201421102110331521053112301533',
       '152011220224112405321222042301211331', '1021032212200430152405320020052003240223132004231131', '12200223132004201022043202210120', '12200324023013230521052313211430', '102313240231122403210520032315310524'],
      ['122013220420102100231423022101330320132405200020', '152204210223012412301323042405310330', '14200122052204220320022311210031052411241222', '1422052101201321122111320523042403220422', '10200220132305210523143002220324',
       '14230231002410331233102115320524002013201421', '112300241031002002321333152205201220012415241121', '142105230322022210241520032004210220052104231524', '10200324142104211424132205220220012205201222', '15200023132303240224132105210221112305231220',
       '102111210420032002240530052304220222152414230322', '1323112002231424112203240421052205200032', '13201123123002201523152104320024', '1320023103230523102205201524152100241233', '13200120002415230223043212311132',
       '14200223032112210031032304321124', '152202230133042404200330132310200230', '14211324053012231023032301311021', '15231020112005240033032304300521022411221324', '112004240322152002240520032412240032022010231221',
       '1520143013201322052211310524122212201124002004231033', '12210124052014221424002210320422133100241020', '1423042211331532023001330533002213221020', '1522102013200021052414310424042205221124032203200024', '152305310330023310240030032302210524',
       '1022042200201220032311210321142404200232', '14230322022105321124132102240320', '1221132113240224152311220023042110230322052414231120', '122202200421142105310323112014240122', '132100311122123303231520022415330520'],
      ['102310301224022214240321142211211320012405200021', '14221122012003221221053312240420', '1020002412200422053204201521122213221130032015331432', '132002320320002114230521052303221121', '11200431142414221033132201320220',
       '102201320520132315200221032412240233032101200032', '11200433002413201223142202211322', '142005211223032011211520023312211524132305230021', '102201231221152105240321002304301523132200201324', '1023112000230122043101240520142414220522132202201522',
       '1220152411230024103213200231002014241522053103230124', '15211033132302320324053102200524', '1120152014201333002213210221152205301432', '1322042301220324003303201223003015240532012410210221', '1420122202241224113211200523052000221321',
       '132003311531022211211224002400210433', '142011321222022401310533152304321520', '112103200030123214201021132002230323', '142313230523033000310224122413210221', '13210533112302240324032201211520',
       '132010331433103004210521012102221520022411220322', '14211020022010231521013111230222003203241333', '152205201333123304241131022301240122', '1521022012300324132313210321052304241124', '1420032205230324022012211321122400311123',
       '1522122004240221012402230530002413331223', '132002231033003015301221032403220524', '11211324102112211322122301230224052115201033', '102305230530002303331223152411200230102013211520', '14230220113313200024042212300532'],
      ['142002200021132011231232042302230532', '1521033211201033022011230024123013240424', '1420032113301523002111240224053312240323', '15200432012300311132123110321020022413220532', '10230331022014221320022212241532052001240524',
       '1520123013310321022411240023112005240522', '10210121132414210333023105301223', '142305230331122415240520022402211330', '1121022201240522002413201422032214240431', '112202321323032400230421153005310021',
       '102102210020052303200224142012331332', '10210022132112330424032013240221112014200323', '1021012405210320032202211423052302231320', '13200523112112220421142310320233053015231220', '1521133300220324002402220521142111300421',
       '112313240332102405210220022305241230', '13200524052200201230032214231024113315320223', '152013211120123313230324042402300023', '1320022411310531002410321424042102221220', '102013230420122403301321003114330224',
       '1422043200240031032203200121153111241030', '1123122410311420132400210223022101211524032203240520', '1321022103240033052110231123122003221521102114210523', '1221132404301420032100220323153111200223', '122102230520052413330421002114201520103210201532',
       '1522133301240222113114220424012200320521', '10230424033312240130023205240321022005201521', '102103200020123305231332022102241420', '1520013004231224133105201122022412221032', '112014300324022002221223152405321521'],
      ['122105230521113113201524102110331522043100240223', '1220133113241530152310201424112314220023103205300221', '1220152411220033032211201324013305300430022210311522', '122200210523152010230220152404210423152214300121', '1220143000200523132302220324022005211024',
       '1421002411220523013002221223112413200323', '14220222152404231233012410310121052013201522', '1520102100211323023303300533122411210520', '14210332002304240222042013241131', '132110300320032405320023122100210224042315241223',
       '1220002301201431023105220424052013231032', '15201323022003201020013203241224052312220224', '12231321142401240230053103330021', '13201420052202331533122310241130032014241221', '12201331023015311024032105321124',
       '142201210520012413310423123302211031', '1220052101200322022211231432022013240023', '122302321024052400200522032002200022153214230122', '112114240323122310211221052104200223003013200320', '1223132202240530022113201533102204230030',
       '142013310522022111241032052402240321', '13221030153102211223032005320423003215241431', '122005310232153104241130002413230321', '11221431042013230222122301210424', '15230122053302330420033202210320122410210124',
       '15200320122401321322052303241020122202240220', '142204230124023115321224112005241320', '122203230530032013200121023314241021', '14211133153104241223052205240231', '13211023053201200332122002300432'],
      ['1420122413321524052310300224102305201120002212221122', '152101221120032300240520023113240424002212331123', '1420133111240320022405221231052404230220', '112215300420012005241523122300321221052102231423', '12210032102203211024112415330233102013230523',
       '1321002304321524012002241220032410321222', '132203241124152112200230053301230321', '1122032212201324002010330222153213201021143204210524', '132215241120032400220024142402210132022405200522', '1023023000241321012014220520153201240423052303311224',
       '15211021022100221333022312330520052404200324', '1521102305230230032413200530033100240223', '11200520102012311424133102240522032402200421', '1222002414241522132103231024002201301524002010220531', '132105221223002111240230103303231532002314241520',
       '1220042414311024102205311323012002221132', '12200324002002221132053110311430153013231024', '14210131133302220220152412230530102000320324', '102012221420122402200022052303201432', '122313220423152015240120102401320224032405310022',
       '142000211131102015321221102211240223123305331320', '122002240024032314241022022204210520052213201131', '1523032305241132003313240224112005211030', '1120152415220520122314221331042301240024052302210022', '12211032053215241520043205200020003213220224',
       '112114241422053113200021022203210124', '112305220223153003331424103202210520', '1320003003201223022410210521143311210222', '142204200123022210220424122313231131', '1520032100320420012002240333102200200222122401220533']
    ],
    extreme: [
      ['142301241031022311211224033113200523', '142103231031112413201522042400301024132412240321', '112103201024153113330223123105210524', '152005331031142302241024002212241120133111240321', '112002200520133102240522032414241231',
       '1121142413300323032015230224122312210521', '1320103015310323152402321223142405210320', '15200233053312240330112113230021', '1021152401220223122302210030053115201522132314200320', '1220032414301124132102300522152401201323',
       '1021032000300524022213201431042013241233', '112214210421132402221220012003321531', '1523052102240323132402221122112005240024', '142004300531113112221522132301220223', '10200333023012231421002313240530',
       '12220121142304200422103113200223', '142212240433002105200322102100231131102315300132', '142010240121032005231021132105211222042102241323', '1423132005331322122202201220113300240422', '112003201323123200320224152004241321',
       '112005220324133114240220123102240520', '132014231224113105240232153203220520', '1021022205320121122304201520033300300023152402240520', '142202211220133010320024052313230321153312240120', '1221113102240523142315240431052100321520',
       '12200033033113210124043102210224052105231524', '152202320523042411210320122005211323103012230124', '112105211031102413240324122213221220152101230020', '1121032015240124012205201021022405220023132212221433', '112100221233032004241530133310240222'],
      ['1420133204301122112005311530032412310022', '102113330233042101220530032012220124', '1021042103201222053001220124023313330021', '1020043313221521032105310023032401230021122102200524', '152003301224022404231121132201230533',
       '1423112405330220132315320321022312241033', '132212200324152101230533032111240230', '152103241032112314210121023112240424052003221324', '1121153110240523003303200132132304210021052112220424', '12220224153305220323003211201424112213210520',
       '122204221431132105320121022004241023', '142111331320022012321322032405320423', '1020132005240222002402201421042303230321053115320421', '142302230521112300320524132411300322', '122005300023022214211433133304201031',
       '1421102405221523122303200423032315210220132002220130', '10220321132005241421132404200120122402310323', '102305200533022301221224032104240220132315210120', '112113220324042015240030052312241320032110310224', '122210240030102105220431032013201433153201210223',
       '11210122042110241323032015221524012405221222', '1521023201211122032413230532103104200520', '13200420033214240422022311310021', '1520042002240020012210221224012000320333053302220321', '122210320032052001220422052215200224132214331020',
       '1320052204220021152105200130122215230220102302231433', '132005330232122401241522042011310322', '1120132105300221142400220333122310320024', '1521032013201324002402310530122304241030', '11210224032400200222132303210523122415241220'],
      ['152213211120003310200221042305240322052214221133', '112313240030103104240221033205301430', '1220052010220532022401200324022215240322042013200422', '1121053014201220032100201333023215231521', '122102241423012000320431103203211322',
       '102103320524042002211523053104220020032002331220', '122010200532142103241323002302311032', '1323142400321524032405220520112011320223', '1220102000230324142113230531022203210220', '122100320331012310331422052305210220',
       '142103221524022015201230112305310324', '112102220531142200210124142403211320', '14210022002404201521123211200122133202200324', '1522132315200330052411240020023110210022042405221430', '1322123204230224002405300121102315241320052310211123',
       '15230122002403321224103205200233053310200022', '1522022305241120032214231132132400330521', '14201332123204200531153004241122112003240022', '1420102310211124002201310321002004320522052413221531', '13201124032115310222043200240323',
       '1121043003231324022212200321002015311031', '142011221022132402230530102015211523032300311232', '1020022300211532122105310220033100241320', '12200522143215200231153203210023132311240524', '1420132205301132112000221533132402241232',
       '102012320031142013210224132303200324', '1221152002240321003105200422132102200333102304240522', '152112231022013002211024132000240324052402230531', '11200224032415241331042112310220142405200522', '1121032310221024052403210522142010201523003102241321'],
      ['13200024102002311522053303301224', '15210022032412240232103113330520032101220424', '152300241231102310300224132400220530032305241120', '122215230323102415210223043100300320132014241121', '1222053204231530022001210421132110231431',
       '12200020102314301321102103210221032304321124', '14210522112105201020103200311524032401221332', '132012201430002004211423052102221122152015320523', '152102230033133310321424122002210520112001230324', '15200221122300320324133105231032112004330530',
       '14210322102003240523112312210521002302200021', '1320022315220323022101240424042212200024103210200530', '1323053202211223032002230123112415211021102412200424', '102103201332152003240020052102240123122012220421', '132215200123032410331221053302200032002003211124',
       '12221433053015210030152313200223103204310130', '122103221122132414230233052410230023012005210021', '1321142403241123032210231524012400210230002305201224', '11221221042005230521143013310031122303241030', '122002201324043003210323002414211521022215231020',
       '102013211232132300311420032002240324', '1220102200240333052315210231142101201123102405211524', '15211221052203241133132002201223142413230223', '11220420002005211220152005241223033313240232', '132111230424102012221531012104220220',
       '112010241422003210211322022114240320043105220132', '1123022105240322153010241422052114201324003115231022', '122002220322043011310524143113240020', '1220132303210023142405200224022111201032052213211524', '122113200320153203220223043002201020142300210520'],
      ['1022012015321423132004200531122302211323052402230024', '14211131102302221021132012240520033213240021', '132303200421122002231532003305331024012312221120', '1121042302231232052101220320152315300020002214200524', '12231130023210210022032005241532132405211024',
       '10210520022303210421152400331323153105321230', '132115231124032015201231022404320031', '1322152311241431042302301220103315300524052203210023', '11201024133201231222152305330421022015211220', '132105220121002315330421032202241122052000301433',
       '132215221524022110231021042201330321053211241220', '1120152001230220122205211323042115321220102314230524', '142105301130132402221223152311231030003215210323', '1522053303310420122401241423052002231320102202210030', '102302240023122100301324012005301520022005240332',
       '132011211424032015211223053110210222153314310020', '142315231221112403221024003215301021022305330320', '142313200223033105220524122100301124', '1120122414320132132403210222052410230220', '122103211332022404240032152010320123102005230520',
       '122003211520142310331121022405311021002013320023', '102103200123002004210324133212220521022412201520', '1420052312210021152013230233032115241032122411211020', '13201123153002221020032402200520123304240121', '14201524022403241323132110200531022000221232',
       '1420132405300223152303230031153011211030102311231222', '14220221122005200523102301331021042413321120', '1120153205241023152012201423042113231222052101230220', '1120003202221432102312240321022013240524', '132103241123122114210021022015241020002303220432'],
      ['122000200431032114240224133010320323', '122204241123002204220333022010201430', '1320122410211120052002230024153104240524022103311023', '1020122205240320143200221224132215301120142002201324', '122000200330143004200432022115301331102105220520',
       '12201131103113200223002003240531032214241521', '112112240024022212200322132415221431052403201320', '13230524052214300022153202311520112403201030', '13201524053211241030122300240324023103201521', '1523033202240521122110330422112000240124022005330022',
       '122105211423032213241023103011320524002302231120', '1321032311221120003302241222122015330531', '132014231220152312220422052205240223002011231530', '112110220223002005211230052303211531132310241524', '112100300223102410211521152413200523123103200521',
       '112013221021153300240321122410330523132015210221', '1423103112211124003005240522132003310223', '1123143105240221122415300322103115230032052000200121', '11200022022310231221032102200530152414201333', '152102221031113114210322132005230324002105201224',
       '122113230220032110331530112000221422142013210532', '12210224042205321031052015200123142313220420', '13200331022312241032002411200520022104241531', '1323052412211124033002231530003210300522', '1221153204200322022314231022053305210120042200321520',
       '1421032301200023053212200420122311220222', '1320002105321121022203241223152414300320', '11230524132403321230052100200223152104240220', '14210323003312230222012013240530122011221531', '1123143210311224002413200322023112200520']
    ]
  };

  const parkCell = (c, p, k) => (c.v ? [c.f, p + k] : [p + k, c.f]);
  const parkVars = (c, p) => ({ x: c.v ? c.f : p, y: c.v ? p : c.f, w: c.v ? 1 : c.len, h: c.v ? c.len : 1 });
  const parkName = (c, i) => (i === 0 ? tx('Police car', 'Mobil polisi') : c.len === 3 ? tx('Truck', 'Truk') : tx('Car', 'Mobil'));
  // The car that fills each cell, or -1.
  function parkOcc(cars, pos, n) {
    const g = new Int8Array(n * n).fill(-1);
    cars.forEach((c, i) => { for (let k = 0; k < c.len; k++) { const [x, y] = parkCell(c, pos[i], k); g[y * n + x] = i; } });
    return g;
  }
  // Every slide a car can make: {i: car, to: its new place}.
  function parkSlides(cars, pos, n, occ) {
    const out = [];
    cars.forEach((c, i) => {
      const empty = (p, k) => { const [x, y] = parkCell(c, p, k); return occ[y * n + x] < 0; };
      for (let p = pos[i] - 1; p >= 0 && empty(p, 0); p--) out.push({ i, to: p });
      for (let p = pos[i] + 1; p + c.len <= n && empty(p, c.len - 1); p++) out.push({ i, to: p });
    });
    return out;
  }
  const parkKey = (pos, n) => pos.reduce((a, p) => a * n + p, 0);
  // Every position reachable from start and the fewest moves from each to the exit; null when there are too many
  // positions or the police car can never get out.
  function parkSolve(cars, start, n, cap) {
    const index = new Map([[parkKey(start, n), 0]]), states = [start], edges = [];
    for (let h = 0; h < states.length; h++) {
      if (states.length > cap) return null;
      const s = states[h], list = [];
      parkSlides(cars, s, n, parkOcc(cars, s, n)).forEach((m) => {
        const next = s.slice(); next[m.i] = m.to;
        const key = parkKey(next, n);
        if (!index.has(key)) { index.set(key, states.length); states.push(next); }
        list.push(index.get(key));
      });
      edges.push(list);
    }
    const goalAt = n - cars[0].len, dist = new Int32Array(states.length).fill(-1), queue = [];
    states.forEach((s, k) => { if (s[0] === goalAt) { dist[k] = 0; queue.push(k); } });
    if (!queue.length) return null;
    // Every slide can be slid back, so the lot is one connected piece and every position gets a distance.
    for (let h = 0; h < queue.length; h++) edges[queue[h]].forEach((k) => { if (dist[k] < 0) { dist[k] = dist[queue[h]] + 1; queue.push(k); } });
    return { states, index, dist };
  }
  // A random lot with the police car and count - 1 other cars (up and down or left and right), none on top of another.
  function parkLayout(n, count, trucks) {
    const cars = [], pos = [], taken = new Uint8Array(n * n);
    const put = (c, p) => {
      const cells = Array.from({ length: c.len }, (_, k) => parkCell(c, p, k));
      if (cells.some(([x, y]) => taken[y * n + x])) return;
      cells.forEach(([x, y]) => { taken[y * n + x] = 1; });
      cars.push(c); pos.push(p);
    };
    put({ v: true, f: rnd(0, n - 1), len: 2 }, rnd(0, n - 2));
    for (let tries = 0; cars.length < count && tries < 80; tries++) {
      const len = trucks && rnd(1, 10) <= 3 ? 3 : 2;
      put({ v: rnd(0, 1) === 1, f: rnd(0, n - 1), len }, rnd(0, n - len));
    }
    return cars.length === count ? { cars, pos } : null;
  }
  // A car seen from above, as a small drawing. It is drawn upright (front at the top) in a box 60 wide and 60 per cell long, turned
  // sideways for a car that goes left and right, and turned the other way round for some, so not every car looks to the same side.
  // The police car (0) has a white roof and a flashing light bar; a car of three cells is a bus or a truck.
  function parkCarSvg(c, i) {
    const L = 60 * c.len, flip = i === 0 || i % 2 === 1, r = (k) => Math.round(k * 10) / 10;
    const shape = (j) => '<rect class="sh" x="10" y="9" width="46" height="' + (L - 8) + '" rx="16"/>'
      + [0.18, 1 - 0.18 - 16 / L].map((k) => '<rect class="wh" x="3" y="' + r(L * k) + '" width="6" height="16" rx="3"/><rect class="wh" x="51" y="' + r(L * k) + '" width="6" height="16" rx="3"/>').join('')
      + j;
    const lights = '<ellipse class="lt" cx="16" cy="9" rx="5" ry="3"/><ellipse class="lt" cx="44" cy="9" rx="5" ry="3"/>'
      + '<rect class="tl" x="11" y="' + (L - 11) + '" width="9" height="4" rx="2"/><rect class="tl" x="40" y="' + (L - 11) + '" width="9" height="4" rx="2"/>';
    const glass = (a) => '<path class="gl" d="M15 ' + r(a) + ' Q30 ' + r(a - 5) + ' 45 ' + r(a) + ' L41 ' + r(a + 15) + ' Q30 ' + r(a + 12) + ' 19 ' + r(a + 15) + ' Z"/>'
      + '<path class="gh" d="M19 ' + r(a + 3) + ' L26 ' + r(a + 3) + ' L24 ' + r(a + 10) + ' L20 ' + r(a + 10) + ' Z"/>';
    const mirrors = (a) => '<rect class="cb" x="1" y="' + r(a - 2) + '" width="7" height="9" rx="2.5"/><rect class="cb" x="52" y="' + r(a - 2) + '" width="7" height="9" rx="2.5"/>';
    let art;
    if (c.len === 2) {
      const a = 0.3 * L, roof = 0.17 * L, b = a + 15 + roof;
      art = shape('<rect class="cb" x="7" y="4" width="46" height="' + (L - 8) + '" rx="16"/>' + mirrors(a) + glass(a)
        + (i === 0 ? '<rect class="pw" x="16" y="' + r(a + 15) + '" width="28" height="' + r(roof + 4) + '" rx="6"/><rect class="lb1" x="19" y="' + r(a + 26) + '" width="11" height="6" rx="2"/><rect class="lb2" x="30" y="' + r(a + 26) + '" width="11" height="6" rx="2"/>'
          : '<rect class="cr" x="17" y="' + r(a + 15) + '" width="26" height="' + r(roof) + '" rx="5"/>')
        + '<path class="gl" d="M19 ' + r(b + 4) + ' L41 ' + r(b + 4) + ' L45 ' + r(b + 16) + ' L15 ' + r(b + 16) + ' Z"/>' + lights);
    } else if (i % 2 === 0) { // a bus: a long roof with windows along it
      const a = 0.08 * L;
      art = shape('<rect class="cb" x="7" y="4" width="46" height="' + (L - 8) + '" rx="12"/>' + glass(a) + mirrors(a + 2)
        + '<rect class="cr" x="13" y="' + r(a + 20) + '" width="34" height="' + r(L - a - 36) + '" rx="6"/>'
        + [0, 1, 2, 3].map((k) => '<rect class="gh" x="17" y="' + r(a + 26 + k * 30) + '" width="26" height="14" rx="3"/>').join('') + lights);
    } else { // a truck: a cab at the front and a box behind it
      art = shape('<rect class="cb" x="7" y="4" width="46" height="62" rx="14"/>' + glass(14) + mirrors(16)
        + '<rect class="cr" x="17" y="29" width="26" height="14" rx="4"/>'
        + '<rect class="cg" x="5" y="70" width="50" height="' + (L - 76) + '" rx="6"/>'
        + [0, 1, 2].map((k) => '<path class="ln" d="M12 ' + (82 + k * 28) + ' H48"/>').join('') + lights);
    }
    const turned = flip ? '<g transform="rotate(180 30 ' + L / 2 + ')">' + art + '</g>' : art;
    return c.v ? '<svg class="cs" viewBox="0 0 60 ' + L + '" preserveAspectRatio="none" aria-hidden="true">' + turned + '</svg>'
      : '<svg class="cs" viewBox="0 0 ' + L + ' 60" preserveAspectRatio="none" aria-hidden="true"><g transform="translate(0 60) rotate(-90)">' + turned + '</g></svg>';
  }
  // Small still picture of a lot for the guide. sel is a car to mark and dots are cells to show as places to slide to.
  const parkMini = (n, cars, pos, sel, dots) => '<div class="lot lotmini" style="--n:' + n + '">'
    + '<span class="lotexit" style="--x:' + cars[0].f + '" aria-hidden="true">⬇</span>'
    + cars.map((c, i) => { const v = parkVars(c, pos[i]); return '<span class="pcar' + (i === 0 ? ' t' : '') + (i === sel ? ' sel' : '') + '" style="--x:' + v.x + ';--y:' + v.y
      + ';--w:' + v.w + ';--h:' + v.h + ';--c:' + PARK_COLORS[i] + '">' + parkCarSvg(c, i) + '</span>'; }).join('')
    + (dots || []).map(([x, y]) => '<span class="pdest" style="--x:' + x + ';--y:' + y + '"></span>').join('') + '</div>';
  function genPark(lvl) {
    const { n, lv, bank } = PARK[S.diff], li = lvl === 6 ? rnd(2, 5) : lvl;
    let count, trucks, lo, hi, lay, sol, from = -1;
    if (bank) { // Very hard and Extreme: a puzzle from the bank, shown the other way round half of the time
      const mirror = Math.random() < 0.5, one = pick(PARK_BANK[S.diff][li]).match(/.{4}/g).map((car) => [...car].map(Number)).map(([v, f, len, at]) => [v, mirror && v ? n - 1 - f : f, len, mirror && !v ? n - len - at : at]);
      lay = { cars: one.map(([v, f, len]) => ({ v: !!v, f, len })), pos: one.map((c) => c[3]) };
      sol = parkSolve(lay.cars, lay.pos, n, PARK_STATES);
      from = 0;
    } else [count, trucks, lo, hi] = lv[li];
    for (let tries = 1; from < 0; tries++) {
      if (tries % 100 === 0) { count = Math.max(3, count - 1); lo = Math.max(1, lo - 1); hi++; } // cannot happen in practice; never loop forever
      lay = parkLayout(n, count, trucks);
      sol = lay && parkSolve(lay.cars, lay.pos, n, PARK_STATES);
      const fit = [];
      if (sol) sol.dist.forEach((d, k) => { if (d >= lo && d <= hi) fit.push(k); });
      if (fit.length) from = pick(fit);
    }
    const cars = lay.cars, par = sol.dist[from], showPar = !hardUp(S.diff);
    let cur = sol.states[from].slice(), moves = 0, sel = -1, hint = null, done = false;
    const history = [];
    const distOf = (s) => sol.dist[sol.index.get(parkKey(s, n))];
    const slidesNow = () => parkSlides(cars, cur, n, parkOcc(cars, cur, n));
    qSay(tx('Slide the cars out of the way and drive the 🚓 police car out of the exit. Tap a car, then tap where it should go.', 'Geser mobil-mobil dari jalannya dan keluarkan mobil polisi 🚓 lewat pintu keluar. Ketuk mobil, lalu ketuk tempat tujuannya.'));
    $('ask').innerHTML = '<div class="lotwrap"><div class="lot" id="lot" style="--n:' + n + '"><span class="lotexit" style="--x:' + cars[0].f
      + '" aria-hidden="true">⬇ 🏁</span></div></div><p class="swaps" id="moves" aria-live="polite"></p>'
      + '<button type="button" class="btn ghost hUndo" id="pUndo">' + tx('↩ Undo', '↩ Urungkan') + '</button>';
    const box = $('lot');
    const els = cars.map((c, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pcar' + (i === 0 ? ' t' : '');
      b.style.setProperty('--c', PARK_COLORS[i]); b.innerHTML = parkCarSvg(c, i);
      b.addEventListener('click', () => { if (done || dragged) return; sel = sel === i ? -1 : i; sfx.tap(); paint(); });
      box.appendChild(b);
      return b;
    });
    // Dragging: a car follows the finger along its lane, no further than it can go, and settles on a cell. That is one move.
    // The tap that ends a drag must not also pick the car, so `dragged` stays up until the next time a car is grabbed.
    let dragged = false;
    const cell = () => box.clientWidth / n;
    // An older cached motion.js has no drag: the lot then works by tapping alone instead of not drawing at all.
    const makeDrag = Cendekia.fx.drag || (() => ({ range() {}, reset() {}, enable() {} }));
    const drags = cars.map((c, i) => makeDrag(els[i], {
      axis: c.v ? 'y' : 'x', step: cell,
      onGrab: () => {
        dragged = false;
        const to = slidesNow().filter((m) => m.i === i).map((m) => m.to);
        drags[i].range((Math.min(cur[i], ...to) - cur[i]) * cell(), (Math.max(cur[i], ...to) - cur[i]) * cell());
      },
      onDrag: (px) => { if (Math.abs(px) > 4) dragged = true; },
      onSettle: (px) => {
        const k = Math.round(px / cell());
        // The drag's own shift always goes back to zero, even when it ended between cells or on a spot the car cannot take,
        // otherwise the car is drawn away from where it really is and looks stuck.
        els[i].classList.add('jump'); drags[i].reset();
        if (k && !done && slidesNow().some((m) => m.i === i && m.to === cur[i] + k)) move({ i, to: cur[i] + k });
        els[i].offsetWidth; els[i].classList.remove('jump');
      }
    }));
    function paint() {
      cars.forEach((c, i) => {
        const v = parkVars(c, cur[i]), b = els[i];
        Object.entries(v).forEach(([k, val]) => b.style.setProperty('--' + k, val));
        b.classList.toggle('sel', i === sel);
        b.classList.toggle('hint', !!hint && hint.i === i);
        b.setAttribute('aria-label', parkName(c, i) + (c.v ? tx(', goes up and down', ', bergerak atas bawah') : tx(', goes left and right', ', bergerak kiri kanan')) + tx(', row ', ', baris ') + (v.y + 1) + tx(', column ', ', kolom ') + (v.x + 1) + (i === sel ? tx(', picked', ', dipilih') : ''));
      });
      box.querySelectorAll('.pdest').forEach((d) => d.remove());
      if (sel >= 0 && !done) {
        slidesNow().filter((m) => m.i === sel).forEach((m) => {
          const c = cars[m.i], far = m.to > cur[m.i] ? m.to + c.len - 1 : m.to, [x, y] = c.v ? [c.f, far] : [far, c.f];
          const d = document.createElement('button');
          d.type = 'button'; d.className = 'pdest' + (hint && hint.i === m.i && hint.to === m.to ? ' hint' : '');
          d.style.setProperty('--x', x); d.style.setProperty('--y', y);
          d.setAttribute('aria-label', tx('Slide ', 'Geser ') + parkName(c, m.i).toLowerCase() + tx(' to row ', ' ke baris ') + (y + 1) + tx(', column ', ', kolom ') + (x + 1));
          d.addEventListener('click', () => move(m));
          box.appendChild(d);
        });
      }
      $('moves').textContent = tx('Moves: ', 'Gerakan: ') + moves + (showPar ? tx(' · Fewest: ', ' · Paling sedikit: ') + par : '');
      $('pUndo').disabled = done || !history.length;
    }
    function move(m) {
      if (done) return;
      const was = distOf(cur);
      history.push(cur); cur = cur.slice(); cur[m.i] = m.to; moves++; sel = -1; hint = null;
      sfx.drop();
      const now = distOf(cur);
      if (now === 0) { // the police car is at the exit: it drives out
        done = true; paint(); box.classList.add('done'); drags.forEach((d) => d.enable(false));
        els[0].style.setProperty('--y', n); els[0].classList.add('out');
        sfx.whir(); solved(2200);
        qSay(moves === par ? tx('Out in ' + moves + ' moves, the fewest there is!', 'Keluar dalam ' + moves + ' gerakan, yang paling sedikit!') : tx('Out in ' + moves + ' moves. The fewest is ' + par + '.', 'Keluar dalam ' + moves + ' gerakan. Yang paling sedikit adalah ' + par + '.'), 'cheer');
        return;
      }
      if (now > was) { // a wrong turn: the exit is now further away
        let hinted = false;
        wrong(() => {
          const best = slidesNow().reduce((a, s) => { const t = cur.slice(); t[s.i] = s.to; const u = cur.slice(); u[a.i] = a.to; return distOf(t) < distOf(u) ? s : a; });
          hint = best; sel = best.i; hinted = true;
        });
        qSay(hinted ? tx('That moved you further away. Look at the glowing car and the glowing spot, or press ↩ Undo.', 'Itu membuatmu makin jauh. Lihat mobil dan tempat yang bersinar, atau tekan ↩ Urungkan.') : tx('That moved you further away. Press ↩ Undo, or keep thinking!', 'Itu membuatmu makin jauh. Tekan ↩ Urungkan, atau pikir lagi!'), 'oops');
      }
      paint();
    }
    $('pUndo').addEventListener('click', () => {
      if (done || !history.length) return;
      cur = history.pop(); moves--; sel = -1; hint = null; sfx.tap(); paint();
    });
    paint();
  }

  // ---- Poka's Maze ----
  // The maze is n by n squares and open[c] says which sides of square c have no wall: bit d is set for d = 0 up, 1 right, 2 down,
  // 3 left. It is dug by a walk that never enters a square twice, so at first there is exactly one way between any two squares; then
  // a few walls are knocked down, which gives some mazes more than one way home. A search from the start and one from the house give
  // every square's distance from each. A square is on a shortest route when the two add up to the fewest steps. Stepping off a shortest
  // route is a wrong turn, counted once however far the child goes on; the hint is the next square toward the house.
  // Poka starts in one corner and the house is in the opposite one, so every maze runs from end to end.
  // Per difficulty and level: [n, walls knocked down, fewest steps at least, at most]; a shortest route longer than the straight
  // 2(n-1) steps has to wind, and the more walls are down, the more ways there are to choose between.
  const MAZE = {
    easy: [[4, 0, 8, 12], [5, 0, 12, 18], [5, 2, 10, 14], [6, 0, 16, 24], [6, 3, 12, 18], [6, 2, 14, 20]],
    medium: [[6, 0, 14, 22], [7, 0, 18, 28], [7, 3, 16, 22], [8, 0, 24, 34], [8, 4, 20, 26], [8, 3, 22, 30]],
    hard: [[8, 0, 24, 34], [9, 0, 30, 42], [9, 4, 24, 32], [10, 0, 38, 52], [10, 5, 28, 36], [10, 4, 30, 40]],
    veryhard: [[10, 0, 38, 52], [11, 0, 44, 60], [11, 5, 36, 48], [12, 0, 52, 70], [12, 6, 44, 56], [12, 5, 46, 60]],
    extreme: [[12, 0, 52, 70], [13, 0, 60, 80], [13, 6, 50, 64], [14, 0, 70, 96], [14, 7, 60, 76], [14, 6, 64, 84]]
  };
  const MZ = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // up, right, down, left
  const mzNext = (n, c, d) => { const x = (c % n) + MZ[d][0], y = Math.floor(c / n) + MZ[d][1]; return x < 0 || y < 0 || x >= n || y >= n ? -1 : y * n + x; };
  const mzLink = (open, n, c, d) => { open[c] |= 1 << d; open[mzNext(n, c, d)] |= 1 << ((d + 2) % 4); };
  function mzDig(n, loops) {
    const open = new Uint8Array(n * n), seen = new Uint8Array(n * n), walk = [rnd(0, n * n - 1)];
    seen[walk[0]] = 1;
    while (walk.length) {
      const c = walk[walk.length - 1], to = shuffle([0, 1, 2, 3]).filter((d) => { const b = mzNext(n, c, d); return b >= 0 && !seen[b]; });
      if (!to.length) { walk.pop(); continue; }
      const b = mzNext(n, c, to[0]);
      mzLink(open, n, c, to[0]); seen[b] = 1; walk.push(b);
    }
    for (let k = 0, made = 0; made < loops && k < 200; k++) {
      const c = rnd(0, n * n - 1), d = rnd(0, 3);
      if (mzNext(n, c, d) >= 0 && !(open[c] >> d & 1)) { mzLink(open, n, c, d); made++; }
    }
    return open;
  }
  // Fewest steps from `from` to every square.
  function mzDist(open, n, from) {
    const dist = new Int16Array(n * n).fill(-1), queue = [from];
    dist[from] = 0;
    for (let h = 0; h < queue.length; h++) {
      for (let d = 0; d < 4; d++) {
        const b = open[queue[h]] >> d & 1 ? mzNext(n, queue[h], d) : -1;
        if (b >= 0 && dist[b] < 0) { dist[b] = dist[queue[h]] + 1; queue.push(b); }
      }
    }
    return dist;
  }
  // The maze as a drawing: squares walked on (trail), one square to glow (hint), the walls and the house.
  function mzSvg(open, n, trail, goal, hint) {
    const sq = (c, cls) => '<rect class="' + cls + '" x="' + (c % n) + '" y="' + Math.floor(c / n) + '" width="1" height="1"/>';
    let walls = '';
    for (let c = 0; c < n * n; c++) {
      const x = c % n, y = Math.floor(c / n);
      if (!(open[c] & 1)) walls += 'M' + x + ' ' + y + 'h1';
      if (!(open[c] & 8)) walls += 'M' + x + ' ' + y + 'v1';
      if (x === n - 1) walls += 'M' + (x + 1) + ' ' + y + 'v1';
      if (y === n - 1) walls += 'M' + x + ' ' + (y + 1) + 'h1';
    }
    return '<svg viewBox="0 0 ' + n + ' ' + n + '" aria-hidden="true">' + trail.map((c) => sq(c, 'mzt')).join('') + (hint >= 0 ? sq(hint, 'mzh') : '')
      + '<path class="mzw" d="' + walls + '"/><text class="mzg" x="' + (goal % n + 0.5) + '" y="' + (Math.floor(goal / n) + 0.54) + '" text-anchor="middle" dominant-baseline="central">🏠</text></svg>';
  }
  const mzBot = (c, n) => '<div class="bot" style="--x:' + (c % n) + ';--y:' + Math.floor(c / n) + '">' + pokaSvg('happy') + '</div>';
  // A small fixed maze for the guide: the way home is 0, 1, 2, 5, 8 and square 4 is a dead end.
  const MZ_DEMO = (() => { const o = new Uint8Array(9); [[0, 1], [1, 1], [2, 2], [5, 2], [1, 2], [0, 2], [3, 2], [6, 1]].forEach(([c, d]) => mzLink(o, 3, c, d)); return o; })();
  const mzMini = (open, at, trail, goal) => '<div class="maze mini" style="--w:3">' + mzSvg(open, 3, trail, goal, -1) + mzBot(at, 3) + '</div>';
  function genMaze(lvl) {
    let [n, loops, lo, hi] = MAZE[S.diff][lvl === 6 ? rnd(1, 5) : lvl];
    const more = loops > 0;
    let open, from, goal, ds;
    for (let tries = 1; goal === undefined; tries++) {
      if (tries % 100 === 0) lo = Math.max(2 * (n - 1), lo - 2); // cannot happen in practice; never loop forever
      const sx = rnd(0, 1) * (n - 1), sy = rnd(0, 1) * (n - 1);
      open = mzDig(n, loops); from = sy * n + sx; ds = mzDist(open, n, from);
      const end = (n - 1 - sy) * n + (n - 1 - sx);
      if (ds[end] >= lo && ds[end] <= hi) goal = end;
    }
    const par = ds[goal], de = mzDist(open, n, goal), onRoute = (c) => ds[c] + de[c] === par, showPar = !hardUp(S.diff);
    let cur = from, hint = -1, done = false;
    const trail = [];
    qSay(more ? tx('There is more than one way home. Find the shortest!', 'Ada lebih dari satu jalan pulang. Temukan yang terpendek!') : tx('Walk Poka home to the 🏠. Use the arrows, or tap the next square.', 'Antarkan Poka pulang ke 🏠. Pakai panah, atau ketuk kotak berikutnya.'));
    $('ask').innerHTML = '<div class="mzwrap"><div class="maze" id="maze" style="--w:' + n + '" data-open="' + open.join(',') + '" data-goal="' + goal + '"><div class="bot" id="mzBot">'
      + pokaSvg('happy') + '</div></div></div><p class="swaps" id="moves" aria-live="polite"></p>'
      + '<div class="dpad">' + [tx('Up', 'Atas'), tx('Right', 'Kanan'), tx('Down', 'Bawah'), tx('Left', 'Kiri')].map((name, d) => '<button type="button" class="' + 'urdl'[d] + '" data-d="' + d + '" aria-label="' + name + '">' + '▲▶▼◀'[d] + '</button>').join('') + '</div>'
      + '<button type="button" class="btn ghost hUndo" id="mUndo">' + tx('↩ Undo', '↩ Urungkan') + '</button>';
    const box = $('maze'), bot = $('mzBot');
    Cendekia.fx.mascot(bot.firstChild);
    function paint() {
      const old = box.querySelector(':scope > svg');
      if (old) old.remove();
      box.insertAdjacentHTML('afterbegin', mzSvg(open, n, trail.concat(cur), goal, hint));
      bot.style.setProperty('--x', cur % n); bot.style.setProperty('--y', Math.floor(cur / n));
      box.setAttribute('aria-label', tx('Maze, ' + n + ' squares wide. Poka is in row ' + (Math.floor(cur / n) + 1) + ', column ' + (cur % n + 1) + '. The house is in row ' + (Math.floor(goal / n) + 1) + ', column ' + (goal % n + 1) + '.', 'Labirin, lebar ' + n + ' kotak. Poka di baris ' + (Math.floor(cur / n) + 1) + ', kolom ' + (cur % n + 1) + '. Rumah di baris ' + (Math.floor(goal / n) + 1) + ', kolom ' + (goal % n + 1) + '.'));
      $('moves').textContent = tx('Steps: ', 'Langkah: ') + trail.length + (showPar ? tx(' · Fewest: ', ' · Paling sedikit: ') + par : '');
      $('mUndo').disabled = done || !trail.length;
    }
    function step(d) {
      if (done) return;
      if (d === 1 || d === 3) bot.classList.toggle('face-L', d === 3);
      const b = open[cur] >> d & 1 ? mzNext(n, cur, d) : -1;
      if (b < 0) { // a wall: Poka bumps into it, and it does not count as a wrong turn
        bot.style.setProperty('--bx', MZ[d][0] * 30 + '%'); bot.style.setProperty('--by', MZ[d][1] * 30 + '%');
        bot.classList.remove('walk', 'bump'); void bot.offsetWidth; bot.classList.add('bump');
        sfx.bump();
        return;
      }
      const leaves = onRoute(cur) && !onRoute(b);
      trail.push(cur); cur = b; hint = -1;
      bot.classList.remove('walk', 'bump'); void bot.offsetWidth; bot.classList.add('walk');
      sfx.step();
      if (cur === goal) {
        done = true; paint(); box.classList.add('done'); bot.classList.add('dance');
        sfx.whir(); solved(2200);
        qSay(trail.length === par ? tx('Home in ' + par + ' steps, the fewest there is!', 'Sampai rumah dalam ' + par + ' langkah, yang paling sedikit!') : tx('Home in ' + trail.length + ' steps. The fewest is ' + par + '.', 'Sampai rumah dalam ' + trail.length + ' langkah. Yang paling sedikit adalah ' + par + '.'), 'cheer');
        return;
      }
      if (leaves) { // off every shortest route
        let hinted = false;
        wrong(() => { hint = mzNext(n, cur, [0, 1, 2, 3].find((k) => open[cur] >> k & 1 && de[mzNext(n, cur, k)] === de[cur] - 1)); hinted = true; });
        qSay(hinted ? tx('That is not the shortest way. Look at the glowing square, or press ↩ Undo.', 'Itu bukan jalan terpendek. Lihat kotak yang bersinar, atau tekan ↩ Urungkan.') : (more ? tx('That is a longer way, or a dead end. Press ↩ Undo, or walk back!', 'Itu jalan yang lebih panjang, atau jalan buntu. Tekan ↩ Urungkan, atau jalan mundur!') : tx('A dead end is coming. Press ↩ Undo, or walk back!', 'Di depan jalan buntu. Tekan ↩ Urungkan, atau jalan mundur!')), 'oops');
      }
      paint();
    }
    box.addEventListener('click', (e) => {
      const r = box.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * n), y = Math.floor((e.clientY - r.top) / r.height * n);
      const d = MZ.findIndex(([dx, dy]) => x === cur % n + dx && y === Math.floor(cur / n) + dy);
      if (d >= 0) step(d);
    });
    $('ask').querySelectorAll('.dpad button').forEach((b) => b.addEventListener('click', () => step(+b.dataset.d)));
    const onKey = (e) => {
      if (!box.isConnected) { document.removeEventListener('keydown', onKey); return; }
      const d = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(e.key);
      if (d < 0 || !box.offsetParent) return;
      e.preventDefault(); step(d);
    };
    document.addEventListener('keydown', onKey);
    $('mUndo').addEventListener('click', () => {
      if (done || !trail.length) return;
      cur = trail.pop(); hint = -1; sfx.tap(); paint();
    });
    paint();
  }

  // ---- Poka's Backpack ----
  // The pockets are variables and a program is a list of steps that change them. packRun follows the steps and gives
  // every state it passed through, or err when a step tried to take more than a pocket holds.
  const PACK_ITEMS = [{ e: '🍎', n: tx('Apples', 'Apel') }, { e: '🍪', n: tx('Cookies', 'Kue') }, { e: '⭐', n: tx('Stars', 'Bintang') }];
  // max: the most a pocket may hold; step: the biggest number in an add or take; len: steps for each level.
  const PACK = { easy: { max: 9, step: 3, len: [2, 3, 3] }, medium: { max: 20, step: 9, len: [3, 4, 4] }, hard: { max: 99, step: 20, len: [4, 5, 5] },
    // The keypad takes two digits, so the biggest number stays 99 and the programs get longer instead.
    veryhard: { max: 99, step: 25, len: [5, 6, 6] }, extreme: { max: 99, step: 30, len: [6, 7, 7] } };
  const PACK_ICON = { put: '📥', add: '➕', take: '➖', copy: '📋', loop: '🔁' };
  // One step on a copy of the pockets; null when a take wants more than the pocket holds (unless lenient).
  function packStep(s, o, lenient) {
    const n = s.slice();
    if (o.op === 'put') n[o.p] = o.v;
    else if (o.op === 'add') n[o.p] += o.v;
    else if (o.op === 'take') { if (n[o.p] < o.v && !lenient) return null; n[o.p] = Math.max(0, n[o.p] - o.v); }
    else n[o.to] = n[o.p];
    return n;
  }
  // A repeat {op: 'loop', n, body} does the steps in its body n times. packFlat lists the steps a program takes, in order:
  // o is the step, at the number of the block in the program, sub the number inside a repeat (-1 outside one) and round
  // which time round a repeat it is.
  function packFlat(prog) {
    const out = [];
    prog.forEach((o, at) => {
      if (o.op !== 'loop') out.push({ o, at, sub: -1, round: 0 });
      else for (let round = 0; round < o.n; round++) o.body.forEach((b, sub) => out.push({ o: b, at, sub, round }));
    });
    return out;
  }
  // The pockets after every step (trace[0] is the start), or err with at, the number of the step that took too much.
  function packRun(start, prog, lenient) {
    const flat = packFlat(prog);
    let s = start;
    const trace = [s];
    for (let i = 0; i < flat.length; i++) {
      s = packStep(s, flat[i].o, lenient);
      if (!s) return { trace, err: true, at: i, flat };
      trace.push(s);
    }
    return { trace, final: s, flat };
  }
  const packMap = (prog, f) => prog.map((o) => (o.op === 'loop' ? { ...o, body: o.body.map(f) } : f(o))); // f on every step, inside a repeat too
  const packCount = (prog) => prog.reduce((n, o) => n + (o.op === 'loop' ? 1 + o.body.length : 1), 0); // a repeat counts as a block, and so does each step in it
  const packLabel = (f) => (f.at + 1) + (f.sub < 0 ? '' : 'abc'[f.sub]) + (f.sub < 0 ? '' : tx(', round ', ', putaran ') + (f.round + 1));
  const packName = (p, long) => (long ? PACK_ITEMS[p].n : PACK_ITEMS[p].e);
  const packText = (o, long) => (o.op === 'put' ? tx('Put ' + o.v + ' in ' + packName(o.p, long), 'Taruh ' + o.v + ' di ' + packName(o.p, long))
    : o.op === 'add' ? tx('Add ' + o.v + ' to ' + packName(o.p, long), 'Tambah ' + o.v + ' ke ' + packName(o.p, long))
      : o.op === 'take' ? tx('Take ' + o.v + ' from ' + packName(o.p, long), 'Ambil ' + o.v + ' dari ' + packName(o.p, long))
        : o.op === 'loop' ? tx('Repeat ' + o.n + ' times', 'Ulang ' + o.n + ' kali') : tx('Copy ' + packName(o.p, long) + ' into ' + packName(o.to, long), 'Salin ' + packName(o.p, long) + ' ke ' + packName(o.to, long)));
  const attr = (v) => (v === undefined || v === null ? '' : v);
  const stepHtml = (o, num, inside) => '<li class="pb ' + o.op + '" data-op="' + o.op + '" data-p="' + attr(o.p) + '" data-v="' + attr(o.v) + '" data-to="' + attr(o.to) + '" data-n="' + attr(o.n)
    + '" aria-label="' + tx('Step ', 'Langkah ') + num + ': ' + packText(o, true) + '"><span class="n" aria-hidden="true">' + num + '</span><span aria-hidden="true">' + PACK_ICON[o.op] + ' ' + packText(o) + '</span>' + (inside || '') + '</li>';
  // The steps as cards; the steps inside a repeat are cards in the repeat's card, lettered a, b.
  const progHtml = (prog) => '<ol class="recipe" aria-label="' + tx('Steps', 'Langkah') + '">' + prog.map((o, k) => stepHtml(o, k + 1, o.op === 'loop'
    ? '<ol class="body">' + o.body.map((b, j) => stepHtml(b, (k + 1) + 'abc'[j])).join('') + '</ol>' : '')).join('') + '</ol>';
  const packThings = (p, v) => (v <= 10 ? PACK_ITEMS[p].e.repeat(v) : '');
  // goal is only given when the child builds the steps: a number to reach, or null for a pocket that may end with anything.
  const pouchHtml = (p, v, ask, goal) => '<div class="pouch' + (ask ? ' ask' : '') + '" data-p="' + p + '"' + (goal === undefined ? '' : ' data-goal="' + (goal === null ? '' : goal) + '"') + '>'
    + '<span class="pe" aria-hidden="true">' + PACK_ITEMS[p].e + '</span><b>' + PACK_ITEMS[p].n + '</b><span class="cnt">' + v + '</span>'
    + '<span class="things" aria-hidden="true">' + packThings(p, v) + '</span>'
    + (goal === undefined ? '' : '<span class="goal">' + (goal === null ? tx('free to use', 'bebas') : '🎯 ' + goal) + '</span>') + '</div>';
  const packPaint = (state) => document.querySelectorAll('.pouch').forEach((el, p) => {
    el.querySelector('.cnt').textContent = state[p];
    el.querySelector('.things').textContent = packThings(p, state[p]);
  });
  // The pockets after each step, as a table. ask marks the pocket being asked about.
  const packTable = (rows, ask, labels) => '<table class="trace"><caption>' + tx('What is in the pockets after each step', 'Isi kantong setelah tiap langkah') + '</caption><thead><tr><th scope="col">' + tx('Step', 'Langkah') + '</th>'
    + rows[0].map((_, p) => '<th scope="col">' + PACK_ITEMS[p].e + ' ' + PACK_ITEMS[p].n + '</th>').join('') + '</tr></thead><tbody>'
    + rows.map((s, k) => '<tr><th scope="row">' + (k ? (labels ? labels[k - 1] : k) : tx('Start', 'Awal')) + '</th>' + s.map((v, p) => '<td' + (p === ask ? ' class="ask"' : '') + '>' + v + '</td>').join('') + '</tr>').join('')
    + '</tbody></table>';
  // What a step does, in a sentence: said when a step or a block is tapped.
  const packHelp = (o) => {
    if (o.op === 'loop') return tx('Repeat ' + o.n + ' times: do the steps inside, then do them again, ' + o.n + ' times in all.', 'Ulang ' + o.n + ' kali: kerjakan langkah di dalamnya, lalu kerjakan lagi, ' + o.n + ' kali seluruhnya.');
    const a = PACK_ITEMS[o.p].n, b = o.to === undefined || o.to === null ? '' : PACK_ITEMS[o.to].n;
    return o.op === 'put' ? tx('Put ' + o.v + ' in ' + a + ': the ' + a + ' pocket now has exactly ' + o.v + ', whatever it had before.', 'Taruh ' + o.v + ' di ' + a + ': kantong ' + a + ' sekarang berisi tepat ' + o.v + ', apa pun isinya tadi.')
      : o.op === 'add' ? tx('Add ' + o.v + ' to ' + a + ': ' + o.v + ' more go into the ' + a + ' pocket, on top of what is already there.', 'Tambah ' + o.v + ' ke ' + a + ': ' + o.v + ' lagi masuk ke kantong ' + a + ', di atas isi yang sudah ada.')
        : o.op === 'take' ? tx('Take ' + o.v + ' from ' + a + ': ' + o.v + ' come out of the ' + a + ' pocket. You cannot take more than it holds.', 'Ambil ' + o.v + ' dari ' + a + ': ' + o.v + ' keluar dari kantong ' + a + '. Kamu tidak bisa mengambil lebih dari isinya.')
          : tx('Copy ' + a + ' into ' + b + ': the ' + b + ' pocket gets the same number as ' + a + '. ' + a + ' keeps its number, and the two are not linked afterwards.', 'Salin ' + a + ' ke ' + b + ': kantong ' + b + ' mendapat angka yang sama dengan ' + a + '. ' + a + ' tetap dengan angkanya, dan keduanya tidak terhubung setelahnya.');
  };
  // The step guide: each step with a before and an after, a sentence and an everyday example.
  function packGuide() {
    const pair = (before, after) => '<div class="demo"><div class="pouches">' + before + '</div><b aria-hidden="true">→</b><div class="pouches">' + after + '</div></div>';
    openSheet(tx('Backpack steps', 'Langkah-langkah ransel'), [
      ['<div class="demo">' + progHtml([{ op: 'add', p: 0, v: 2 }, { op: 'take', p: 0, v: 1 }]) + '</div>',
        tx('A program is a list of steps. Do them from the top, one at a time. After each step the numbers in the pockets change.', 'Program adalah daftar langkah. Kerjakan dari atas, satu per satu. Setelah tiap langkah, angka di kantong berubah.'), 'stack'],
      [pair(pouchHtml(0, 7), pouchHtml(0, 5)),
        tx('<b>Put 5 in 🍎</b>: the pocket becomes exactly 5, whatever was in it. Had 7? Now 5. Like emptying your bag and putting in exactly 5 apples. It is not the same as Add: Add 5 would make 12.', '<b>Taruh 5 di 🍎</b>: kantong jadi berisi tepat 5, apa pun isinya tadi. Tadi 7? Sekarang 5. Seperti mengosongkan tas lalu memasukkan tepat 5 apel. Ini tidak sama dengan Tambah: Tambah 5 akan jadi 12.'), 'stack'],
      [pair(pouchHtml(0, 2), pouchHtml(0, 5)),
        tx('<b>Add 3 to 🍎</b>: 3 more go in, on top of what is there. 2 and 3 more make 5. Like getting 3 more stickers when you already have 2.', '<b>Tambah 3 ke 🍎</b>: 3 lagi masuk, di atas isi yang ada. 2 ditambah 3 jadi 5. Seperti dapat 3 stiker lagi saat sudah punya 2.'), 'stack'],
      [pair(pouchHtml(0, 5), pouchHtml(0, 2)),
        tx('<b>Take 3 from 🍎</b>: 3 come out. You cannot take more than there is. Like eating 3 of your 5 cookies.', '<b>Ambil 3 dari 🍎</b>: 3 keluar. Kamu tidak bisa mengambil lebih dari yang ada. Seperti memakan 3 dari 5 kuemu.'), 'stack'],
      [pair(pouchHtml(0, 4) + pouchHtml(1, 1), pouchHtml(0, 4) + pouchHtml(1, 4)),
        tx('<b>Copy 🍎 into 🍪</b>: the second pocket gets the same number as the first, and the first keeps its number. Later steps change only the pocket they name. Like writing a number on a second piece of paper.', '<b>Salin 🍎 ke 🍪</b>: kantong kedua mendapat angka yang sama dengan yang pertama, dan yang pertama tetap dengan angkanya. Langkah berikutnya hanya mengubah kantong yang disebut. Seperti menulis angka di kertas kedua.'), 'stack'],
      ['<div class="demo">' + progHtml([{ op: 'loop', n: 3, body: [{ op: 'add', p: 0, v: 2 }] }]) + '</div>' + pair(pouchHtml(0, 1), pouchHtml(0, 7)),
        tx('<b>Repeat 3 times</b>: do the steps inside, then do them again, three times in all. Add 2, three times, is 6 more, so 1 becomes 7. Like clapping three times: the same thing again.', '<b>Ulang 3 kali</b>: kerjakan langkah di dalamnya, lalu kerjakan lagi, tiga kali seluruhnya. Tambah 2, tiga kali, jadi 6 lagi, sehingga 1 menjadi 7. Seperti bertepuk tiga kali: hal yang sama lagi.'), 'stack']
    ]);
  }
  // A number pad for the Hard answers: up to two digits, then ✓.
  function packKeypad(ans, onOk, onHint, tags) {
    let val = '';
    const wrap = document.createElement('div');
    wrap.className = 'keypad';
    wrap.innerHTML = '<output class="padAns">?</output><div class="padKeys">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map((k) => '<button type="button" class="key" data-k="' + k
      + '" aria-label="' + (k === '⌫' ? tx('Delete', 'Hapus') : k === '✓' ? tx('Check', 'Periksa') : k) + '">' + k + '</button>').join('') + '</div>';
    const out = wrap.querySelector('output');
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('.key');
      if (!b || wrap.classList.contains('done')) return;
      const k = b.dataset.k;
      if (k === '✓') {
        if (!val) return;
        if (+val === ans) { wrap.classList.add('done'); onOk(); return; }
        const typed = +val;
        val = ''; out.textContent = '?';
        wrap.classList.remove('no'); void wrap.offsetWidth; wrap.classList.add('no');
        wrong(onHint, tags[typed] || 'other');
        return;
      }
      if (k === '⌫') val = val.slice(0, -1); else if (val.length < 2) val += k;
      out.textContent = val || '?';
      sfx.tap();
    });
    $('answers').appendChild(wrap);
  }
  // What will be in a pocket at the end? Every puzzle is made fresh: no step takes more than a pocket holds, no pocket
  // overflows, and the pocket asked about really changes. The wrong answers are the slips a child makes: one step too
  // many or too few, the other pocket, the start, or a copy going the wrong way.
  function genPack(lvl) {
    if (lvl === 6) { genPackMixed(); return; }
    if (lvl === 5 && (S.diff === 'easy' || Q.n === 0)) { genPackRepeat(); return; } // Medium and Hard: one to read, then two to build
    if (lvl >= 3) { genPackBuild(lvl); return; }
    const cfg = PACK[S.diff], max = cfg.max, len = cfg.len[lvl], pockets = lvl === 0 ? 1 : 2;
    let start, prog, run, ask;
    for (let tries = 0; ; tries++) {
      if (tries === 500) { start = [1]; prog = [{ op: 'add', p: 0, v: 1 }]; run = packRun(start, prog); ask = 0; break; } // cannot happen in practice
      start = Array.from({ length: pockets }, () => rnd(0, Math.floor(max / 2)));
      prog = Array.from({ length: len }, () => {
        const p = rnd(0, pockets - 1), kind = pick(lvl === 2 ? ['add', 'take', 'copy', 'copy'] : ['add', 'take', 'put']);
        if (kind === 'copy') return { op: 'copy', p, to: 1 - p };
        return { op: kind, p, v: kind === 'put' ? rnd(0, Math.min(max, cfg.step * 2)) : rnd(1, cfg.step) };
      });
      run = packRun(start, prog);
      ask = rnd(0, pockets - 1);
      const k = prog.findIndex((o) => o.op === 'copy');
      // A copy only teaches something if a pocket changes after it.
      if (!run.err && run.trace.every((s) => s.every((v) => v <= max)) && run.final[ask] !== start[ask]
        && (pockets === 1 || [0, 1].every((p) => prog.some((o) => o.p === p || o.to === p)))
        && (lvl !== 2 || (k >= 0 && prog.slice(k + 1).some((o) => o.op !== 'copy')))) break;
    }
    packAsk({ lvl, start, prog, ask, run, max });
  }
  // Level 6, predict: a program with a repeat. The answer changes if the repeat is done once, so the count matters.
  function genPackRepeat() {
    const d = S.diff, max = PACK[d].max, pockets = d === 'easy' ? 1 : 2, nMax = { easy: 3, medium: 5, hard: 9, veryhard: 9, extreme: 9 }[d], vMax = { easy: 3, medium: 5, hard: 9, veryhard: 12, extreme: 15 }[d];
    let start, prog, run, ask;
    for (let tries = 0; ; tries++) {
      if (tries === 500) { start = [0]; prog = [{ op: 'loop', n: 2, body: [{ op: 'add', p: 0, v: 1 }] }]; run = packRun(start, prog); ask = 0; break; } // cannot happen in practice
      const step = () => ({ op: pick(['add', 'take']), p: rnd(0, pockets - 1), v: rnd(1, vMax) });
      const loop = { op: 'loop', n: rnd(2, nMax), body: Array.from({ length: d === 'easy' ? 1 : d === 'veryhard' || d === 'extreme' ? rnd(2, 3) : rnd(1, 2) }, step) };
      prog = [...Array.from({ length: d === 'easy' ? 0 : rnd(0, 1) }, step), loop, ...Array.from({ length: rnd(0, 1) }, step)];
      start = Array.from({ length: pockets }, () => rnd(0, Math.floor(max / 3)));
      run = packRun(start, prog);
      ask = rnd(0, pockets - 1);
      if (!run.err && run.trace.every((s) => s.every((v) => v <= max)) && run.final[ask] !== start[ask]
        && packRun(start, prog.map((o) => (o === loop ? { ...o, n: 1 } : o)), true).final[ask] !== run.final[ask]
        && (pockets === 1 || [0, 1].every((p) => packFlat(prog).some((f) => f.o.p === p)))) break;
    }
    packAsk({ lvl: 5, start, prog, ask, run, max });
  }
  // A tap on a step card (Enter and Space too) says what the step does.
  function packTap(recipe) {
    recipe.querySelectorAll('li').forEach((li) => { li.tabIndex = 0; li.setAttribute('role', 'button'); li.classList.add('tap'); });
    recipe.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li) { sfx.tap(); qSay(packHelp({ op: li.dataset.op, n: +li.dataset.n, p: +li.dataset.p, v: +li.dataset.v, to: li.dataset.to === '' ? null : +li.dataset.to }), 'happy'); }
    });
    recipe.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('li')) { e.preventDefault(); e.target.click(); }
    });
  }
  // The question for a program: how many are in the pocket asked about at the end? Easy and Medium offer choices, Hard a number pad.
  function packAsk({ lvl, start, prog, ask, run, max }) {
    const item = PACK_ITEMS[ask], ans = run.final[ask];
    qSay(tx('Follow the steps in order. How many ' + item.e + ' ' + item.n + ' will be in the pocket at the end?', 'Ikuti langkahnya berurutan. Berapa ' + item.e + ' ' + item.n + ' di kantong pada akhirnya?')
      + (lvl === 2 ? tx(' A copy stays a copy, even if the other pocket changes later.', ' Salinan tetap salinan, walau kantong yang lain berubah kemudian.') : '') + (prog.some((o) => o.op === 'loop') ? tx(' A repeat does the steps inside again and again.', ' Ulang mengerjakan langkah di dalamnya berkali-kali.') : '')
      + tx(' Tap a step to hear what it does.', ' Ketuk langkah untuk mendengar apa yang dilakukannya.'));
    $('ask').innerHTML = '<div class="pouches">' + start.map((v, p) => pouchHtml(p, v, p === ask)).join('') + '</div>' + progHtml(prog) + '<div id="traceBox"></div>'
      + '<div class="check"><button type="button" class="btn ghost" id="pGuide">' + tx('📖 Steps', '📖 Langkah') + '</button></div>';
    $('pGuide').addEventListener('click', packGuide);
    packTap($('ask').querySelector('.recipe'));
    // The hint after two wrong answers: the pockets after every step but the last.
    const showTrace = () => {
      const box = $('traceBox');
      if (box.firstChild) return;
      box.innerHTML = packTable(run.trace.slice(0, -1), ask, run.flat.map(packLabel));
      qSay(tx('Look at the table: it shows the pockets after the steps. Now do the last step!', 'Lihat tabelnya: isinya kantong setelah langkah-langkah. Sekarang kerjakan langkah terakhir!'), 'happy');
    };
    const done = () => { packPaint(run.final); solved(1500); };
    // The wrong answers are the slips a child makes. When two slips give the same number, the first one listed names it.
    const slips = new Map();
    const slip = (tag, v) => { if (v !== ans && v >= 0 && v <= max + 5 && !slips.has(v)) slips.set(v, tag); };
    slip('put-add', packRun(start, packMap(prog, (o) => (o.op === 'put' ? { op: 'add', p: o.p, v: o.v } : o)), true).final[ask]); // Put taken for Add
    slip('copy-reverse', packRun(start, packMap(prog, (o) => (o.op === 'copy' ? { op: 'copy', p: o.to, to: o.p } : o)), true).final[ask]);
    const loop = prog.find((o) => o.op === 'loop'), times = (n) => prog.map((o) => (o === loop ? { ...o, n } : o));
    if (loop) {
      slip('repeat-once', packRun(start, times(1), true).final[ask]); // the steps inside done once
      [loop.n + 1, loop.n - 1].forEach((n) => { if (n >= 1) slip('repeat-count', packRun(start, times(n), true).final[ask]); });
      if (loop.body.length > 1) slip('loop-first-only', packRun(start, prog.flatMap((o) => (o === loop ? [...Array(o.n).fill(o.body[0]), ...o.body.slice(1)] : [o])), true).final[ask]);
    }
    prog.forEach((_, k) => slip('skip-step', packRun(start, prog.filter((__, j) => j !== k), true).final[ask]));
    run.final.forEach((v, p) => { if (p !== ask) slip('other-pocket', v); });
    slip('start', start[ask]);
    [ans + 1, ans - 1, ans + 2, ans - 2].forEach((v) => slip('off-by-one', v));
    if (hardUp(S.diff)) { packKeypad(ans, done, showTrace, Object.fromEntries(slips)); return; }
    const need = S.diff === 'easy' ? 3 : 4;
    // A put taken for an add and a repeat done the wrong number of times are the slips worth showing, so they make the list first.
    const key = (v) => ['put-add', 'repeat-once', 'repeat-count'].includes(slips.get(v)), pool = shuffle([...slips.keys()]), mix = pool.filter(key).concat(pool.filter((v) => !key(v)));
    const bad = mix.slice(0, need - 1);
    for (let d = 3; bad.length < need - 1; d++) [ans + d, ans - d].forEach((v) => { if (v >= 0 && v !== ans && !bad.includes(v) && bad.length < need - 1) { bad.push(v); slips.set(v, 'off-by-one'); } });
    options(shuffle([ans, ...bad]).map((v) => ({ html: '<b>' + v + '</b>', ok: v === ans, label: String(v), slip: v === ans ? undefined : slips.get(v) })), done, showTrace);
  }

  // Level 7: the kinds of puzzle from the levels before, one after another. Medium and Hard end with one to debug.
  function genPackMixed() {
    const k = Q.n;
    const kind = S.diff === 'easy' ? (k === 0 ? pick(['two', 'copy']) : 'build')
      : k === 0 ? pick(['copy', 'repeat']) : k === 1 ? pick(['build', 'swap', 'repeatBuild']) : 'debug';
    ({ two: () => genPack(1), copy: () => genPack(2), repeat: genPackRepeat, build: () => genPackBuild(3), swap: () => genPackBuild(4), repeatBuild: () => genPackBuild(5), debug: genPackDebug })[kind]();
  }
  // Debug: Poka's program has one wrong step, so it ends with the wrong number. The child picks the change that fixes it. Every
  // puzzle is made fresh: a good program, then one step made a little wrong (a number off, an Add for a Take, a Put for an Add,
  // a copy the wrong way). Of the changes offered, exactly one makes the program end right (each was run to check).
  function genPackDebug() {
    const d = S.diff, cfg = PACK[d], max = cfg.max, need = d === 'medium' ? 3 : 4;
    const step = () => {
      const p = rnd(0, 1), kind = pick(['add', 'take', 'put', 'copy']);
      return kind === 'copy' ? { op: 'copy', p, to: 1 - p } : { op: kind, p, v: kind === 'put' ? rnd(0, Math.min(max, cfg.step * 2)) : rnd(1, cfg.step) };
    };
    // Steps a little different from o: a number off by a little, the other kind of step, a copy the other way.
    const near = (o) => (o.op === 'copy' ? [{ op: 'copy', p: o.to, to: o.p }]
      : [-2, -1, 1, 2, 3].map((x) => ({ ...o, v: o.v + x })).filter((x) => x.v >= (o.op === 'put' ? 0 : 1) && x.v <= max)
        .concat([{ op: o.op === 'add' ? 'take' : 'add', p: o.p, v: o.v }]));
    const key = (o) => packText(o, true), tooBig = (r) => r.trace.some((st) => st.some((v) => v > max));
    let start, good, bad, b, runGood, runBad, ask, fixes;
    for (let tries = 0; ; tries++) {
      if (tries === 800) { // cannot happen in practice
        start = [3, 0]; good = [{ op: 'add', p: 0, v: 2 }, { op: 'copy', p: 0, to: 1 }, { op: 'take', p: 1, v: 1 }]; b = 0; ask = 1;
        bad = [{ op: 'add', p: 0, v: 3 }, good[1], good[2]];
      } else {
        start = [rnd(0, Math.floor(max / 2)), rnd(0, Math.floor(max / 2))];
        good = Array.from({ length: d === 'medium' ? rnd(3, 4) : d === 'veryhard' ? rnd(5, 6) : d === 'extreme' ? rnd(6, 7) : rnd(4, 5) }, step);
        ask = rnd(0, 1); b = rnd(0, good.length - 1);
        bad = good.map((o, j) => (j === b ? pick(near(o)) : o));
      }
      runGood = packRun(start, good); runBad = packRun(start, bad);
      if (tries < 800 && (runGood.err || runBad.err || tooBig(runGood) || tooBig(runBad) || runGood.final[ask] === start[ask] || runBad.final[ask] === runGood.final[ask])) continue;
      const T = runGood.final[ask];
      const works = (at, o) => { const r = packRun(start, bad.map((x, j) => (j === at ? o : x))); return !r.err && r.final[ask] === T; };
      // The changes that do not work: another number or kind for the wrong step, and changes to steps that were fine.
      const pool = [...near(good[b]).map((o) => ({ at: b, step: o, slip: 'wrong-value' })),
        ...bad.flatMap((o, j) => (j === b ? [] : near(o).map((x) => ({ at: j, step: x, slip: 'wrong-step' }))))]
        .filter((f) => key(f.step) !== key(bad[f.at]) && !works(f.at, f.step));
      const byKind = (slip) => shuffle(pool.filter((f) => f.slip === slip));
      const first = [byKind('wrong-step')[0], byKind('wrong-value')[0]].filter(Boolean);
      fixes = first.concat(shuffle(pool.filter((f) => !first.includes(f)))).slice(0, need - 1);
      if (fixes.length === need - 1 || tries === 800) break;
    }
    const T = runGood.final[ask], item = PACK_ITEMS[ask], got = runBad.final[ask];
    qSay(tx('Poka made this program so that ' + item.e + ' ' + item.n + ' ends with ' + T + ', but it ends with ' + got + '. One step is not right. Which change fixes it? Tap a step to hear what it does.', 'Poka membuat program ini supaya ' + item.e + ' ' + item.n + ' berakhir dengan ' + T + ', tetapi hasilnya ' + got + '. Satu langkah tidak benar. Perubahan mana yang memperbaikinya? Ketuk langkah untuk mendengar apa yang dilakukannya.'));
    $('ask').innerHTML = '<div class="pouches">' + start.map((v, p) => pouchHtml(p, v, p === ask)).join('') + '</div>' + progHtml(bad)
      + '<p class="swaps" id="dbg" data-ask="' + ask + '" data-target="' + T + '">' + tx('🎯 It should end with ' + item.e + ' ' + T + '. It ends with ' + item.e + ' ' + got + '.', '🎯 Seharusnya berakhir dengan ' + item.e + ' ' + T + '. Hasilnya ' + item.e + ' ' + got + '.') + '</p><div id="traceBox"></div>'
      + '<div class="check"><button type="button" class="btn ghost" id="pGuide">' + tx('📖 Steps', '📖 Langkah') + '</button></div>';
    $('pGuide').addEventListener('click', packGuide);
    const recipe = $('ask').querySelector('.recipe');
    packTap(recipe);
    // The hint after two wrong answers: the pockets after every step of the wrong program.
    const showTrace = () => {
      const box = $('traceBox');
      if (box.firstChild) return;
      box.innerHTML = packTable(runBad.trace, ask, runBad.flat.map(packLabel));
      qSay(tx('The table shows the pockets after each step of this program. Where do the numbers stop being what they should be?', 'Tabel ini menunjukkan isi kantong setelah tiap langkah program ini. Di mana angkanya mulai tidak sesuai yang seharusnya?'), 'happy');
    };
    const right = { at: b, step: good[b] };
    const list = shuffle([right, ...fixes]).map((f) => ({
      html: '<span><b>' + tx('Step ', 'Langkah ') + (f.at + 1) + '</b> · ' + PACK_ICON[f.step.op] + ' ' + packText(f.step) + '</span>', ok: f === right, slip: f.slip,
      label: tx('Change step ' + (f.at + 1) + ' to ' + packText(f.step, true), 'Ubah langkah ' + (f.at + 1) + ' menjadi ' + packText(f.step, true)), data: { at: f.at, op: f.step.op, p: attr(f.step.p), v: attr(f.step.v), to: attr(f.step.to) }
    }));
    options(list, () => {
      recipe.children[b].outerHTML = stepHtml(good[b], b + 1);
      $('ask').querySelectorAll('.recipe > li')[b].classList.add('fixed');
      packPaint(runGood.final); solved(1800);
    }, showTrace).classList.add('stack');
  }

  // ---- Poka's Backpack: build the steps ----
  // The child taps fixed blocks into a tray and runs them. A breadth-first search over the pockets finds the fewest blocks
  // that reach the goal (a goal of null means that pocket may end with anything); that sets the block limit and the hints.
  // add / take: the numbers on the blocks; max: the most blocks a puzzle may need; extra: blocks to spare on top of that.
  const PACK_BLOCKS = { easy: { add: [1, 2], take: [1], max: 4, extra: 2 }, medium: { add: [1, 3, 5], take: [1, 2], max: 5, extra: 1 }, hard: { add: [1, 5, 10], take: [1, 5], max: 6, extra: 1 },
    // A bigger set of blocks would let any goal be reached in a few steps with no repeat, so these keep Hard's blocks and allow no spare ones.
    veryhard: { add: [1, 5, 10], take: [1, 5], max: 7, extra: 0 }, extreme: { add: [1, 5, 10], take: [1, 5], max: 8, extra: 0 } };
  function packSolve(start, goal, palette, depth, max) {
    const key = (s) => s.join(','), seen = new Map([[key(start), null]]);
    const fits = (s) => goal.every((g, p) => g === null || s[p] === g);
    if (fits(start)) return [];
    let frontier = [start];
    for (let d = 0; d < depth; d++) {
      const next = [];
      for (const s of frontier) {
        for (const o of palette) {
          const n = packStep(s, o);
          if (!n || n.some((v) => v > max) || seen.has(key(n))) continue;
          seen.set(key(n), { prev: s, o });
          if (fits(n)) {
            const path = [];
            for (let at = n, e = seen.get(key(at)); e; at = e.prev, e = seen.get(key(at))) path.unshift(e.o);
            return path;
          }
          next.push(n);
        }
      }
      frontier = next;
    }
    return null;
  }
  function genPackBuild(lvl) {
    const B = PACK_BLOCKS[S.diff], max = PACK[S.diff].max;
    let swap = lvl === 4, loops = lvl === 5, start, goal, palette, sol;
    for (let tries = 0; ; tries++) {
      if (tries === 500) { swap = false; loops = false; } // cannot happen in practice; the plain level always works
      if (loops) {
        // A repeat of one or two steps, maybe with one more step after it. It must be the repeat that makes the blocks fit: with
        // no repeat, even the fewest blocks do not stay within the limit.
        const plain = [...B.add.map((v) => ({ op: 'add', p: 0, v })), ...B.take.map((v) => ({ op: 'take', p: 0, v }))];
        start = [rnd(0, Math.floor(max / 4))];
        const answer = [{ op: 'loop', n: rnd(2, S.diff === 'medium' ? 5 : 9), body: Array.from({ length: rnd(1, 2) }, () => pick(plain)) }, ...(Math.random() < 0.5 ? [pick(plain)] : [])];
        const res = packRun(start, answer);
        if (res.err || res.trace.some((st) => st[0] > max) || res.final[0] === start[0]) continue;
        goal = [res.final[0]]; sol = answer;
        palette = [...plain, { op: 'loop', n: 2, body: [] }];
        const straight = packSolve(start, goal, plain, 12, max);
        if (straight && straight.length <= packCount(answer) + 1) continue;
        break;
      }
      if (swap) {
        const a = rnd(1, max);
        let b = rnd(1, max);
        while (b === a) b = rnd(1, max);
        start = [a, b, 0]; goal = [b, a, null];
        palette = [[0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1]].map(([p, to]) => ({ op: 'copy', p, to }));
      } else {
        start = [rnd(0, Math.floor(max / 2))]; goal = [rnd(0, max)];
        palette = [...B.add.map((v) => ({ op: 'add', p: 0, v })), ...B.take.map((v) => ({ op: 'take', p: 0, v }))];
      }
      sol = packSolve(start, goal, palette, B.max, max);
      if (sol && sol.length >= (swap ? 3 : 2)) break;
    }
    const limit = loops ? packCount(sol) + 1 : sol.length + (swap ? 1 : B.extra);
    qSay((loops ? tx('Make the pocket hold the 🎯 number. A 🔁 Repeat does the steps inside again and again, so it needs fewer blocks.', 'Buat kantong berisi angka 🎯. 🔁 Ulang mengerjakan langkah di dalamnya berkali-kali, jadi butuh lebih sedikit balok.') : swap ? tx('Swap the ' + PACK_ITEMS[0].e + ' and the ' + PACK_ITEMS[1].e + '! The ' + PACK_ITEMS[2].e + ' pocket is spare: use it to hold one for a moment.', 'Tukar ' + PACK_ITEMS[0].e + ' dan ' + PACK_ITEMS[1].e + '! Kantong ' + PACK_ITEMS[2].e + ' adalah cadangan: pakai untuk menyimpan salah satunya sebentar.')
      : tx('Make the pocket hold the 🎯 number.', 'Buat kantong berisi angka 🎯.')) + tx(' Tap blocks to build the steps, then press ▶ Run. You can use up to ' + limit + ' blocks.', ' Ketuk balok untuk menyusun langkah, lalu tekan ▶ Jalankan. Kamu boleh memakai sampai ' + limit + ' balok.'));
    $('ask').innerHTML = '<div class="pouches">' + start.map((v, p) => pouchHtml(p, v, false, goal[p])).join('') + '</div>'
      + '<ol class="recipe" id="bTray" aria-label="' + tx('Your steps', 'Langkahmu') + '"></ol><p class="swaps" id="blocks" aria-live="polite"></p>'
      + '<div class="palette2" id="bPal" role="group" aria-label="' + tx('Blocks', 'Balok') + '"></div>'
      + '<div class="pkTools"><button type="button" class="btn ghost" id="bGuide">' + tx('📖 Steps', '📖 Langkah') + '</button>'
      + '<button type="button" class="btn ghost" id="bUndo" aria-label="' + tx('Remove the last block', 'Hapus balok terakhir') + '">⌫</button>'
      + '<button type="button" class="btn ghost" id="bClear" aria-label="' + tx('Remove all blocks', 'Hapus semua balok') + '">🗑️</button>'
      + '<button type="button" class="btn go" id="bRun">' + tx('▶ Run', '▶ Jalankan') + '</button></div><div id="traceBox"></div>';
    $('bGuide').addEventListener('click', packGuide);
    let tray = [], target = null, running = false, hints = 0; // target: the repeat the next block goes into; null is the program itself
    const my = runToken;
    $('bPal').innerHTML = palette.map((o, k) => '<button type="button" class="pb pbtn ' + o.op + '" data-k="' + k + '" data-op="' + o.op + '" data-p="' + attr(o.p) + '" data-v="' + attr(o.v)
      + '" data-to="' + attr(o.to) + '" aria-label="' + (o.op === 'loop' ? tx('Repeat: do the steps inside again and again', 'Ulang: kerjakan langkah di dalamnya berkali-kali') : packText(o, true)) + '">'
      + PACK_ICON[o.op] + ' ' + (o.op === 'loop' ? tx('Repeat', 'Ulang') : packText(o)) + '</button>').join('');
    const rm = (what, at, sub) => '<button type="button" data-act="rm" data-at="' + at + '" data-sub="' + sub + '" aria-label="' + tx('Remove ', 'Hapus ') + what + '">';
    function paintTray() {
      const card = (o, id, num, at, sub) => '<li class="pb ' + o.op + '" data-op="' + o.op + '" data-id="' + id + '">' + rm(tx('step ' + num + ': ' + packText(o, true), 'langkah ' + num + ': ' + packText(o, true)), at, sub)
        + '<span class="n" aria-hidden="true">' + num + '</span><span aria-hidden="true">' + PACK_ICON[o.op] + ' ' + packText(o) + '</span></button></li>';
      $('bTray').innerHTML = tray.map((o, k) => (o.op !== 'loop' ? card(o, k, k + 1, k, -1)
        : '<li class="pb loop' + (o === target ? ' target' : '') + '" data-op="loop" data-id="' + k + '"><div class="lhead">'
          + '<button type="button" class="tg" data-act="target" data-at="' + k + '" aria-pressed="' + (o === target) + '" aria-label="' + tx('Repeat ' + o.n + ' times. Put the next blocks inside', 'Ulang ' + o.n + ' kali. Taruh balok berikutnya di dalam') + '">'
          + '<span class="n" aria-hidden="true">' + (k + 1) + '</span><span aria-hidden="true">' + tx('🔁 Repeat', '🔁 Ulang') + '</span></button>'
          + '<button type="button" data-act="dec" data-at="' + k + '" aria-label="' + tx('Fewer times', 'Lebih sedikit kali') + '">−</button><span class="rn" aria-live="polite">' + o.n + tx(' times', ' kali') + '</span>'
          + '<button type="button" data-act="inc" data-at="' + k + '" aria-label="' + tx('More times', 'Lebih banyak kali') + '">+</button>' + rm(tx('the repeat and the steps in it', 'ulang dan langkah di dalamnya'), k, -1) + '✕</button></div>'
          + '<ol class="body">' + o.body.map((b, j) => card(b, k + '.' + j, (k + 1) + 'abc'[j], k, j)).join('') + '</ol></li>')).join('');
      $('blocks').textContent = tx('Blocks: ', 'Balok: ') + packCount(tray) + ' / ' + limit;
      $('bRun').disabled = running || !tray.length;
      $('bUndo').disabled = $('bClear').disabled = running || !tray.length;
    }
    // Lights up the step being done, and the repeat around it.
    const mark = (f) => {
      $('bTray').querySelectorAll('li').forEach((li) => li.classList.remove('now', 'in'));
      if (!f) return;
      const at = (id) => $('bTray').querySelector('li[data-id="' + id + '"]');
      if (f.sub < 0) at(f.at).classList.add('now'); else { at(f.at).classList.add('in'); at(f.at + '.' + f.sub).classList.add('now'); }
    };
    $('bPal').addEventListener('click', (e) => {
      const b = e.target.closest('.pbtn');
      if (!b || running) return;
      if (packCount(tray) >= limit) { sfx.bad(); qSay(tx('You can use at most ' + limit + ' blocks here. Take one out, or think of a shorter way.', 'Di sini kamu boleh memakai paling banyak ' + limit + ' balok. Ambil satu, atau cari cara yang lebih pendek.'), 'oops'); return; }
      const block = palette[+b.dataset.k];
      if (block.op === 'loop') {
        const again = { op: 'loop', n: 2, body: [] };
        tray.push(again); target = again; sfx.tap(); paintTray();
        qSay(packHelp(again) + tx(' Tap blocks to put them inside.', ' Ketuk balok untuk menaruhnya di dalam.'), 'happy');
        return;
      }
      if (target) {
        if (target.body.length >= 2) { sfx.bad(); qSay(tx('A repeat holds two steps at most. Tap 🔁 Repeat to step out of it.', 'Ulang menampung paling banyak dua langkah. Ketuk 🔁 Ulang untuk keluar darinya.'), 'oops'); return; }
        target.body.push(block);
      } else tray.push(block);
      sfx.tap(); paintTray(); qSay(packHelp(block), 'happy');
    });
    $('bTray').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || running) return;
      const at = +b.dataset.at, sub = +b.dataset.sub, again = tray[at];
      if (b.dataset.act === 'rm') { if (sub >= 0) again.body.splice(sub, 1); else { if (again === target) target = null; tray.splice(at, 1); } }
      else if (b.dataset.act === 'target') target = target === again ? null : again; // tap the repeat again to step out of it
      else if (b.dataset.act === 'dec') again.n = Math.max(2, again.n - 1);
      else again.n = Math.min(9, again.n + 1);
      sfx.tap(); paintTray();
    });
    $('bUndo').addEventListener('click', () => {
      if (target && target.body.length) target.body.pop(); else if (tray.pop() === target) target = null;
      sfx.tap(); paintTray();
    });
    $('bClear').addEventListener('click', () => { tray = []; target = null; sfx.tap(); paintTray(); });
    $('bRun').addEventListener('click', () => {
      if (running || !tray.length) return;
      running = true; paintTray(); packPaint(start);
      const res = packRun(start, tray), rows = res.trace.length - 1;
      let k = 0;
      const step = () => {
        if (my !== runToken) return;
        if (k < rows) { mark(res.flat[k]); packPaint(res.trace[k + 1]); sfx.drop(); k++; setTimeout(step, 450); return; }
        mark(res.err ? res.flat[res.at] : null);
        const last = res.trace[rows], miss = goal.map((g, p) => (g !== null && last[p] !== g ? tx(PACK_ITEMS[p].e + ' ended with ' + last[p] + ', not ' + g, PACK_ITEMS[p].e + ' berakhir dengan ' + last[p] + ', bukan ' + g) : '')).filter(Boolean);
        if (!res.err && !miss.length) { solved(1500); return; } // the tray stays locked until the next puzzle
        let note = '';
        const o = res.err && res.flat[res.at].o; // before a hint changes the tray
        wrong(() => {
          hints++;
          if (hints === 1) { $('traceBox').innerHTML = packTable(res.trace, undefined, res.flat.map(packLabel)); note = tx(' Look at the table to see where it went wrong.', ' Lihat tabel untuk tahu di mana salahnya.'); }
          else { $('traceBox').innerHTML = ''; tray = JSON.parse(JSON.stringify(sol.slice(0, hints - 1))); target = null; note = tx(' Poka put the first ' + tray.length + ' block' + (tray.length > 1 ? 's' : '') + ' in for you.', ' Poka memasukkan ' + tray.length + ' balok pertama untukmu.'); }
        });
        qSay((res.err ? tx((last[o.p] ? 'There are only ' + last[o.p] : 'There is nothing') + ' in the ' + PACK_ITEMS[o.p].e + ' pocket to take!', (last[o.p] ? 'Hanya ada ' + last[o.p] : 'Tidak ada apa-apa') + ' di kantong ' + PACK_ITEMS[o.p].e + ' untuk diambil!') : tx('Not quite: ' + miss.join(', ') + '.', 'Belum tepat: ' + miss.join(', ') + '.')) + note, 'oops');
        running = false; paintTray();
        setTimeout(() => { if (my === runToken) { mark(null); packPaint(start); } }, 900);
      };
      step();
    });
    paintTray();
  }

  // ---- Poka's Workshop: logic circuits ----
  // A circuit is a tree: a switch {t: 'in', i}, a flip {t: 'not', a} or a gate {t: 'and' | 'or', a, b}. Every switch is
  // used once, so no two wires ever cross and the picture can be laid out by simple rules.
  // A wire passes power through; a blank box (not filled in yet) never has power.
  const cEval = (n, inp) => (n.t === 'in' ? inp[n.i] : n.t === 'not' ? !cEval(n.a, inp) : n.t === 'wire' ? cEval(n.a, inp) : n.t === 'blank' ? false
    : n.t === 'and' ? cEval(n.a, inp) && cEval(n.b, inp) : cEval(n.a, inp) || cEval(n.b, inp));
  const CGATE = { and: tx('AND', 'DAN'), or: tx('OR', 'ATAU'), not: tx('NOT', 'BUKAN'), wire: tx('WIRE', 'KABEL'), blank: '?' };
  const cLetter = (i) => 'ABCDEFGHIJKLMNOP'[i]; // Hard has up to three lamps of four switches each
  const cFormula = (n) => (n.t === 'in' ? cLetter(n.i) : !n.b ? (n.t === 'wire' ? cFormula(n.a) : (n.t === 'not' ? CGATE.not + ' ' : '[?] ') + cFormula(n.a))
    : '(' + cFormula(n.a) + ' ' + (n.t === 'blank' ? '[?]' : CGATE[n.t]) + ' ' + cFormula(n.b) + ')');
  const cNodes = (n) => [n, ...(n.a ? cNodes(n.a) : []), ...(n.b ? cNodes(n.b) : [])];
  const cInputs = (n) => Array.from({ length: 1 << n }, (_, m) => Array.from({ length: n }, (__, i) => !!((m >> i) & 1)));
  const CIRC_HELP = {
    and: tx('AND: power gets through only when both wires coming in have power.', 'DAN: listrik lewat hanya kalau kedua kabel yang masuk berlistrik.'),
    or: tx('OR: power gets through when at least one wire coming in has power.', 'ATAU: listrik lewat kalau paling sedikit satu kabel yang masuk berlistrik.'),
    not: tx('NOT flips it: power in means no power out, and no power in means power out.', 'BUKAN membaliknya: ada listrik masuk berarti tidak ada keluar, dan tidak ada listrik masuk berarti ada keluar.'),
    wire: tx('A plain wire: power goes straight through.', 'Kabel biasa: listrik langsung lewat.')
  };
  // Switches in the first column, then each gate one column after its inputs; a gate sits between its inputs.
  function cLayout(root) {
    let row = 0;
    const place = (n) => {
      if (n.t === 'in') { n.col = 0; n.row = row++; }
      else if (!n.b) { place(n.a); n.col = n.a.col + 1; n.row = n.a.row; } // NOT, a wire or an empty one-input box
      else { place(n.a); place(n.b); n.col = Math.max(n.a.col, n.b.col) + 1; n.row = (n.a.row + n.b.row) / 2; }
    };
    place(root);
    return root;
  }
  // o.vals: show the power in every wire; o.lamp: what the lamp shows (null is a question mark); o.edit: the switches can be
  // tapped; o.guess: the lamp can be tapped.
  function cSvg(root, inp, o) {
    const cols = root.col + 2, colW = Math.min(84, Math.floor(380 / cols)), RH = 58;
    const nodes = cNodes(root), lamp = { t: 'lamp', col: root.col + 1, row: root.row };
    const W = cols * colW, H = (Math.max(...nodes.map((n) => n.row)) + 1) * RH + 12;
    const X = (c) => c * colW + colW / 2, Y = (r) => r * RH + RH / 2 + 6;
    const known = (n) => !o.neutral && (n.t === 'in' || o.vals), half = (n) => (n.t === 'lamp' ? 18 : 27);
    let wires = '', boxes = '';
    const wire = (c, p, yIn) => {
      const x1 = X(c.col) + half(c), y1 = Y(c.row), x2 = X(p.col) - half(p), xm = (x1 + x2) / 2, on = cEval(c, inp);
      wires += '<path class="w ' + (known(c) ? (on ? 'on' : 'off') : 'unk') + '" d="M' + x1 + ' ' + y1 + 'H' + xm + 'V' + yIn + 'H' + x2 + '"/>'
        + (known(c) ? '<text class="bd" x="' + (x1 + 3) + '" y="' + (y1 - 5) + '">' + (on ? 1 : 0) + '</text>' : '');
    };
    nodes.forEach((n) => {
      const x = X(n.col), y = Y(n.row);
      if (n.t === 'in') {
        const v = !o.neutral && inp[n.i], name = tx('Switch ', 'Saklar ') + cLetter(n.i);
        boxes += '<g class="sw' + (v ? ' on' : '') + (o.edit ? ' tap' : '') + '" data-i="' + n.i + '" '
          + (o.edit ? 'role="switch" tabindex="0" aria-checked="' + v + '" aria-label="' + name + '"' : 'role="img" aria-label="' + name + (o.neutral ? '' : tx(' is ' + (v ? 'on' : 'off'), v ? ' menyala' : ' mati')) + '"') + '>'
          + '<rect x="' + (x - 27) + '" y="' + (y - 18) + '" width="54" height="36" rx="10"/><text x="' + x + '" y="' + (y - 2) + '">' + cLetter(n.i) + '</text>'
          + '<text class="st" x="' + x + '" y="' + (y + 12) + '">' + (o.neutral ? '' : v ? tx('ON', 'NYALA') : tx('OFF', 'MATI')) + '</text></g>';
        return;
      }
      (n.b ? [n.a, n.b] : [n.a]).forEach((c, k, all) => wire(c, n, Y(n.row) + (all.length === 1 ? 0 : k ? 9 : -9)));
      const word = CGATE[n.t], slot = n.slot !== undefined;
      boxes += '<g class="gate ' + n.t + (slot ? ' slot' : '') + '" data-t="' + n.t + '"' + (slot ? ' data-slot="' + n.slot + '"' : '') + ' role="button" tabindex="0" aria-label="'
        + (slot ? tx('Gate box ', 'Kotak gerbang ') + (n.slot + 1) + ': ' + (n.t === 'blank' ? tx('empty. Tap to choose a gate.', 'kosong. Ketuk untuk memilih gerbang.') : word + tx('. Tap to change it.', '. Ketuk untuk mengubahnya.')) : word + tx(' gate. Tap to hear what it does.', ' gerbang. Ketuk untuk mendengar fungsinya.')) + '">'
        + '<rect x="' + (x - 27) + '" y="' + (y - 17) + '" width="54" height="34" rx="9"/><text x="' + x + '" y="' + (y + 5) + '">' + word + '</text></g>';
    });
    wire(root, lamp, Y(lamp.row));
    const lit = o.lamp;
    boxes += '<g class="lamp' + (lit ? ' lit' : '') + (o.guess ? ' tap' : '') + '" data-lamp ' + (o.guess ? 'role="button" tabindex="0"' : 'role="img"')
      + ' aria-label="' + tx('Lamp: ', 'Lampu: ') + (lit === null ? (o.guess ? tx('tap to say if it shines', 'ketuk untuk bilang apakah menyala') : tx('not shown yet', 'belum ditampilkan')) : lit ? tx('on', 'menyala') : tx('off', 'mati')) + '">'
      + '<circle cx="' + X(lamp.col) + '" cy="' + Y(lamp.row) + '" r="19"/><text class="em" x="' + X(lamp.col) + '" y="' + (Y(lamp.row) + 7) + '">' + (lit === null ? '?' : '💡') + '</text></g>';
    return '<svg class="circuit" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + tx('Circuit: lamp = ', 'Rangkaian: lampu = ') + cFormula(root) + '">' + wires + boxes + '</svg>';
  }
  function cDemo(tree, inp, shown, neutral) {
    cLayout(tree);
    return cSvg(tree, inp, { vals: shown, lamp: shown ? cEval(tree, inp) : null, neutral });
  }
  // Enter and Space tap whatever has focus inside the drawing.
  const cKeys = (box) => box.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[tabindex]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  // The gate guide: each gate with a picture, a sentence, an everyday example and its table.
  function gateGuide() {
    const sw = (i) => ({ t: 'in', i }), word = (v) => (v ? tx('on', 'nyala') : tx('off', 'mati'));
    const table = (heads, rows) => '<table class="tt"><thead><tr>' + heads.map((h) => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>'
      + rows.map((r) => '<tr>' + r.map((v) => '<td class="' + word(v) + '">' + word(v) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
    const two = (f) => [[false, false], [false, true], [true, false], [true, true]].map(([a, b]) => [a, b, f(a, b)]);
    const demo = (tree, inp, rows, heads) => '<div class="demo circ">' + cDemo(tree, inp, true) + '</div>' + table(heads, rows);
    openSheet(tx('Logic gates', 'Gerbang logika'), [
      [demo({ t: 'and', a: sw(0), b: sw(1) }, [true, true], two((a, b) => a && b), ['A', 'B', tx('Lamp', 'Lampu')]),
        tx('<b>AND</b>: both wires need power. Like a door that opens only when you have the red key AND the blue key.', '<b>DAN</b>: kedua kabel butuh listrik. Seperti pintu yang terbuka hanya kalau kamu punya kunci merah DAN kunci biru.'), 'stack'],
      [demo({ t: 'or', a: sw(0), b: sw(1) }, [true, false], two((a, b) => a || b), ['A', 'B', tx('Lamp', 'Lampu')]),
        tx('<b>OR</b>: at least one wire needs power. Like a bell that rings when someone presses the front button OR the back button.', '<b>ATAU</b>: paling sedikit satu kabel butuh listrik. Seperti bel yang berbunyi kalau seseorang menekan tombol depan ATAU tombol belakang.'), 'stack'],
      [demo({ t: 'not', a: sw(0) }, [false], [[false, true], [true, false]], ['A', tx('Lamp', 'Lampu')]),
        tx('<b>NOT</b> flips it: power in, no power out; no power in, power out. Like a night light: it shines when it is NOT day.', '<b>BUKAN</b> membaliknya: ada listrik masuk, tidak ada keluar; tidak ada masuk, ada keluar. Seperti lampu tidur: menyala kalau BUKAN siang.'), 'stack'],
      [demo({ t: 'wire', a: sw(0) }, [true], [[false, false], [true, true]], ['A', tx('Lamp', 'Lampu')]),
        tx('<b>WIRE</b>: power goes straight through and nothing changes.', '<b>KABEL</b>: listrik langsung lewat dan tidak ada yang berubah.'), 'stack']
    ]);
  }
  function cBuild(lvl, n, ops, notP, next, d) {
    if (lvl === 0) { // one switch, flipped a few times
      let node = { t: 'in', i: next.i++ };
      for (let k = { easy: rnd(0, 1), medium: rnd(0, 2), hard: rnd(1, 3), veryhard: rnd(1, 3), extreme: rnd(2, 4) }[d]; k > 0; k--) node = { t: 'not', a: node };
      return node;
    }
    const tree = (m) => {
      let node;
      if (m === 1) node = { t: 'in', i: next.i++ };
      else { const k = rnd(1, m - 1); node = { t: pick(ops), a: tree(k), b: tree(m - k) }; }
      return Math.random() < notP ? { t: 'not', a: node } : node;
    };
    return tree(n);
  }
  // Levels 1 and 4 ask whether each lamp shines (every circuit has its own switches); levels 2 and 3 ask for the
  // switches that light one lamp. Every puzzle is made fresh and checked: no circuit is stuck on or off, the lamps
  // are a mix of on and off, and on Hard exactly one setting of the switches works.
  function genCircuit(lvl) {
    if (lvl >= 4) { genFill(lvl); return; }
    const d = S.diff, light = lvl === 1 || lvl === 2;
    const nSw = { easy: [1, 2, 2, 2], medium: [1, 2, 3, 3], hard: [1, 3, 3, 4], veryhard: [2, 3, 4, 5], extreme: [3, 4, 5, 5] }[d][lvl];
    const lamps = light ? 1 : { easy: 2, medium: 3, hard: 3, veryhard: 3, extreme: 4 }[d];
    const ops = lvl === 1 ? ['and'] : lvl === 2 ? ['or'] : ['and', 'or'];
    let roots, inp, target = true;
    for (let tries = 0; ; tries++) {
      const next = { i: 0 };
      roots = Array.from({ length: lamps }, () => cLayout(cBuild(lvl, nSw, ops, lvl === 3 ? 0.3 : 0, next, d)));
      if (roots.some((r) => r.col + 2 > 6)) continue; // too wide for the screen
      if (light) {
        target = hardUp(d) && Math.random() < 0.34 ? false : true;
        const all = cInputs(next.i), good = all.filter((x) => cEval(roots[0], x) === target), bad = all.filter((x) => cEval(roots[0], x) !== target);
        if (!good.length || !bad.length || (hardUp(d) && good.length !== 1 && tries < 300)) continue;
        inp = pick(bad).slice();
        break;
      }
      inp = Array.from({ length: next.i }, () => Math.random() < 0.5);
      const outs = roots.map((r) => cEval(r, inp));
      if (lamps > 1 && (!outs.some(Boolean) || outs.every(Boolean))) continue;
      break;
    }
    const live = d === 'easy' && light; // on Easy the lamp answers at once; otherwise it waits for ✓ Check
    let vals = live, final = false, shown = null;
    const guess = roots.map(() => null);
    qSay(light ? (live ? tx('Turn the switches on and off to make the lamp shine.', 'Nyalakan dan matikan saklar supaya lampunya menyala.') : tx('Set the switches so the lamp ' + (target ? 'shines' : 'stays dark') + ', then press ✓ Check.', 'Atur saklar supaya lampu ' + (target ? 'menyala' : 'tetap mati') + ', lalu tekan ✓ Periksa.'))
      : tx('Follow the wires. Will each lamp shine? Tap a lamp to say yes or no, then press ✓ Check.', 'Ikuti kabelnya. Akankah tiap lampu menyala? Ketuk lampu untuk menjawab ya atau tidak, lalu tekan ✓ Periksa.'));
    $('ask').innerHTML = '<div class="circs" id="circs"></div><div class="check"><button type="button" class="btn ghost" id="cGuide">' + tx('📖 Gates', '📖 Gerbang') + '</button>'
      + (live ? '' : '<button type="button" class="btn go" id="cCheck">' + tx('✓ Check', '✓ Periksa') + '</button>') + '</div>';
    $('cGuide').addEventListener('click', gateGuide);
    const box = $('circs');
    const lampOf = (k) => (light ? (live || vals || final ? cEval(roots[0], inp) : shown) : final ? cEval(roots[k], inp) : guess[k]);
    function paint() {
      const at = box.contains(document.activeElement) ? document.activeElement.closest('.sw') : null, i = at && at.dataset.i;
      box.innerHTML = roots.map((r, k) => '<figure class="circ" data-k="' + k + '" data-tree=\'' + JSON.stringify(r, ['t', 'i', 'a', 'b']) + '\'>'
        + cSvg(r, inp, { vals: vals || final, lamp: lampOf(k), edit: light && !final, guess: !light && !final }) + '</figure>').join('');
      if (i !== null && i !== undefined) { const el = box.querySelector('.sw[data-i="' + i + '"]'); if (el) el.focus(); }
    }
    const win = () => { final = true; paint(); sfx.whir(); solved(1500); };
    box.addEventListener('click', (e) => {
      const gate = e.target.closest('.gate'), sw = e.target.closest('.sw.tap'), lp = e.target.closest('.lamp.tap');
      if (gate) { sfx.tap(); qSay(CIRC_HELP[gate.dataset.t], 'happy'); return; }
      if (final) return;
      if (sw) {
        inp[+sw.dataset.i] = !inp[+sw.dataset.i]; shown = null; sfx.tap(); paint();
        if (live && cEval(roots[0], inp) === target) win();
      } else if (lp) {
        const k = +lp.closest('.circ').dataset.k;
        guess[k] = guess[k] === null ? true : !guess[k]; sfx.tap(); paint();
      }
    });
    cKeys(box);
    paint();
    if (live) return;
    $('cCheck').addEventListener('click', () => {
      if (final) return;
      let hinted = false;
      const hint = () => { vals = true; hinted = true; };
      if (light) {
        const out = cEval(roots[0], inp);
        if (out === target) { win(); return; }
        shown = out;
        wrong(hint); paint();
        qSay(tx('Not yet: the lamp is ' + (out ? 'on' : 'off') + '.' + (hinted ? ' Now you can see the power in the wires. Where does it stop?' : ''), 'Belum: lampunya ' + (out ? 'menyala' : 'mati') + '.' + (hinted ? ' Sekarang kamu bisa melihat listrik di kabel. Di mana berhentinya?' : '')), 'oops');
        return;
      }
      if (guess.includes(null)) { sfx.bad(); qSay(tx('Tell me about every lamp first: tap each lamp to say yes or no.', 'Ceritakan tiap lampu dulu: ketuk setiap lampu untuk menjawab ya atau tidak.'), 'oops'); return; }
      const bad = roots.map((r, k) => k).filter((k) => guess[k] !== cEval(roots[k], inp));
      if (!bad.length) { win(); return; }
      wrong(hint); paint();
      bad.forEach((k) => box.children[k].classList.add('no'));
      qSay(tx('Not quite: ' + (bad.length === 1 ? 'one lamp is' : bad.length + ' lamps are') + ' wrong.' + (hinted ? ' Now you can see the power in the wires.' : ''), 'Belum tepat: ' + (bad.length === 1 ? 'satu lampu' : bad.length + ' lampu') + ' salah.' + (hinted ? ' Sekarang kamu bisa melihat listrik di kabel.' : '')), 'oops');
    });
  }

  // ---- Poka's Workshop: fill the gates ----
  // Some gates are missing (a ? box). A box with two inputs is an AND or an OR; a box with one input is a NOT or a plain
  // wire. The table says when the lamp must shine, and any choice of gates that matches every row is right. Every puzzle is
  // made fresh from a hidden circuit and checked: the table is not always on or always off, not every choice of gates fits
  // it, and on Hard exactly one choice fits.
  const cChoices = (n) => (n.b ? ['and', 'or'] : ['not', 'wire']);
  function genFill(lvl) {
    const d = S.diff, nSw = lvl === 4 ? 2 : { easy: 2, medium: 3, hard: 3, veryhard: 3, extreme: 4 }[d];
    let root, list, inputs, rows;
    for (let tries = 0; ; tries++) {
      const next = { i: 0 };
      list = [];
      const box = (n) => { n.want = n.t; n.t = 'blank'; n.slot = list.length; list.push(n); return n; };
      const tree = (m) => {
        let n;
        if (m === 1) { n = { t: 'in', i: next.i++ }; if (lvl === 4 && d !== 'easy' && Math.random() < 0.5) n = { t: 'not', a: n }; } // a gate that is already there
        else { const k = rnd(1, m - 1); n = box({ t: pick(['and', 'or']), a: tree(k), b: tree(m - k) }); }
        return lvl === 5 && Math.random() < 0.4 ? box({ t: pick(['not', 'wire', 'not']), a: n }) : n;
      };
      root = cLayout(tree(nSw));
      const unary = list.filter((n) => !n.b).length;
      if (root.col + 2 > 6 || list.length > 4 || (lvl === 4 ? list.length !== 1 : unary < 1 || list.length < (d === 'easy' ? 2 : 3))) continue;
      inputs = cInputs(nSw);
      const run = (assign) => { list.forEach((n, j) => { n.t = assign[j]; }); return inputs.map((x) => cEval(root, x)); };
      rows = run(list.map((n) => n.want));
      let fit = 0;
      for (let m = 0; m < 1 << list.length; m++) if (run(list.map((n, j) => cChoices(n)[(m >> j) & 1])).every((v, k) => v === rows[k])) fit++;
      list.forEach((n) => { n.t = 'blank'; });
      if (!rows.some(Boolean) || rows.every(Boolean) || fit === 1 << list.length) continue;
      if (hardUp(d) && fit !== 1 && tries < 300) continue;
      break;
    }
    qSay(tx('Fill every ? box with a gate so the lamp shines just like the table says. Tap a box to choose a gate.', 'Isi setiap kotak ? dengan gerbang supaya lampu menyala sesuai tabel. Ketuk kotak untuk memilih gerbang.'));
    $('ask').innerHTML = '<div class="circs" id="circs"></div><table class="tt" id="tt"><caption>' + tx('When the lamp should shine', 'Kapan lampu harus menyala') + '</caption><thead><tr>'
      + inputs[0].map((_, i) => '<th scope="col" aria-label="' + tx('Switch ', 'Saklar ') + cLetter(i) + '">' + cLetter(i) + '</th>').join('') + '<th scope="col">' + tx('Lamp', 'Lampu') + '</th><th scope="col">' + tx('Yours', 'Milikmu') + '</th></tr></thead><tbody>'
      + inputs.map((x, k) => '<tr data-want="' + (rows[k] ? 1 : 0) + '">' + x.map((v) => '<td class="' + (v ? 'on' : 'off') + '">' + (v ? tx('on', 'nyala') : tx('off', 'mati')) + '</td>').join('')
        + '<td>' + (rows[k] ? tx('💡 on', '💡 nyala') : tx('dark', 'gelap')) + '</td><td class="mine"></td></tr>').join('')
      + '</tbody></table><div class="check"><button type="button" class="btn ghost" id="cGuide">' + tx('📖 Gates', '📖 Gerbang') + '</button><button type="button" class="btn go" id="cCheck">' + tx('✓ Check', '✓ Periksa') + '</button></div>';
    $('cGuide').addEventListener('click', gateGuide);
    const box = $('circs'), body = [...$('tt').tBodies[0].rows];
    let final = false;
    function paint() {
      const at = box.contains(document.activeElement) ? document.activeElement.closest('.slot') : null, k = at && at.dataset.slot;
      box.innerHTML = '<figure class="circ" data-k="0" data-tree=\'' + JSON.stringify(root, ['t', 'i', 'a', 'b', 'slot']) + '\'>'
        + cSvg(root, Array(inputs[0].length).fill(false), { neutral: true, lamp: null }) + '</figure>';
      if (k !== null && k !== undefined) { const el = box.querySelector('.slot[data-slot="' + k + '"]'); if (el) el.focus(); }
    }
    box.addEventListener('click', (e) => {
      const g = e.target.closest('.gate');
      if (!g) return;
      if (!g.classList.contains('slot')) { sfx.tap(); qSay(CIRC_HELP[g.dataset.t], 'happy'); return; }
      if (final) return;
      const n = list[+g.dataset.slot], opts = cChoices(n); // each tap shows the next gate; the first tap on an empty box shows the first
      n.t = opts[(opts.indexOf(n.t) + 1) % opts.length];
      body.forEach((r) => { r.className = ''; r.querySelector('.mine').textContent = ''; });
      sfx.tap(); paint(); qSay(CIRC_HELP[n.t], 'happy');
    });
    cKeys(box);
    paint();
    $('cCheck').addEventListener('click', () => {
      if (final) return;
      if (list.some((n) => n.t === 'blank')) { sfx.bad(); qSay(tx('Fill every ? box first: tap a box to choose a gate.', 'Isi semua kotak ? dulu: ketuk kotak untuk memilih gerbang.'), 'oops'); return; }
      const got = inputs.map((x) => cEval(root, x)), bad = got.filter((v, k) => v !== rows[k]).length;
      body.forEach((r, k) => { r.className = got[k] === rows[k] ? 'ok' : 'bad'; r.querySelector('.mine').textContent = (got[k] ? tx('💡 on', '💡 nyala') : tx('dark', 'gelap')) + (got[k] === rows[k] ? ' ✓' : ' ✗'); });
      if (!bad) { final = true; paint(); sfx.whir(); solved(1500); return; }
      let note = '';
      wrong(() => { const n = list.find((x) => x.t !== x.want); if (n) { n.t = n.want; note = tx(' Poka filled in a box for you.', ' Poka mengisi satu kotak untukmu.'); } });
      paint();
      qSay(tx('Not quite: ' + (bad === 1 ? 'one row does' : bad + ' rows do') + ' not match the table.', 'Belum tepat: ' + (bad === 1 ? 'satu baris tidak' : bad + ' baris tidak') + ' cocok dengan tabel.') + note, 'oops');
    });
  }

  const GEN = { patterns: genPatterns, machine: genMachine, balance: genBalance, filter: genFilter, code: genCode, sudoku: genSudoku, clues: genClues, train: genTrain, hanoi: genHanoi, park: genPark, maze: genMaze, pack: genPack, circuit: genCircuit };

  // =====================================================================
  // Result and stickers
  // =====================================================================
  let last = null;
  // i is -1 for a random map: it gives stars on screen but does not keep them.
  function finish(w, i, stars, text) {
    const before = totalStars();
    const quiz = w.kind === 'quiz';
    CD.round({ app: 'logika', stage: w.name + ' · ' + (i < 0 ? (R.def.custom ? tx('My map', 'Petaku') : tx('Random map', 'Peta acak')) : levelsOf(w)[i]) + ' (' + DIFFS[S.diff].name + ')', stars,
      right: quiz ? Q.total - Q.missedQ : 1, total: quiz ? Q.total : 1 + R.fails, ms: Date.now() - (quiz ? Q.t0 : R.t0) });
    if (i >= 0) {
      const b = bestOf(S.diff);
      b[w.id] = b[w.id] || [];
      b[w.id][i] = Math.max(best(w.id, i), stars);
    }
    markDay(); save();
    const after = totalStars();
    const gained = STICKERS.slice(unlocked(before), unlocked(after));
    last = { w, i, def: R && R.i < 0 ? R.def : null };
    $('resTitle').textContent = stars === 3 ? tx('Amazing!', 'Luar biasa!') : stars === 2 ? tx('Great!', 'Hebat!') : tx('Good, keep practicing!', 'Bagus, terus berlatih!');
    $('resStars').innerHTML = [0, 1, 2].map((k) => starSvg(k < stars, 'star')).join('');
    $('resText').textContent = text;
    const g = $('resGift');
    g.hidden = !gained.length;
    if (gained.length) g.innerHTML = '<b>' + tx('New sticker!', 'Stiker baru!') + '</b><div class="stk">' + gained.map(face).join('') + '</div>' + gained.map((k) => k.name).join(', ');
    $('resNext').hidden = i >= 0 && i + 1 >= levelsOf(w).length;
    $('resNext').textContent = last.def && last.def.custom ? tx('✎ Change the map', '✎ Ubah peta') : i < 0 ? tx('New map', 'Peta baru') : tx('Next level', 'Level berikutnya');
    show('result');
    sfx.win(); Cendekia.fx.confetti(stars * 25 + (gained.length ? 40 : 0)); Cendekia.fx.reveal($('resStars'), $('resGift'));
    if (gained.length) UI.toast({ type: 'success', title: tx('New sticker!', 'Stiker baru!'), description: gained.map((k) => k.name).join(', ') });
  }
  $('resNext').addEventListener('click', () => {
    if (last.def && last.def.custom) show('maker');
    else if (last.i >= 0) play(last.w, last.i + 1);
    else if (CD.gate()) startRobot(last.w, -1, randomLevel(S.diff));
  });
  $('resAgain').addEventListener('click', () => { if (last.i >= 0) play(last.w, last.i); else if (CD.gate()) startRobot(last.w, -1, last.def); });
  $('resWorld').addEventListener('click', () => { curWorld = last.w; show('world'); });

  function renderStickers() {
    const stars = totalStars();
    UI.count($('stkStars'), stars, '');
    const nx = STICKERS.find((k) => k.at > stars);
    $('stkNext').textContent = nx ? tx('Next sticker at ' + nx.at + ' stars.', 'Stiker berikutnya di ' + nx.at + ' bintang.') : tx('You have every sticker!', 'Kamu punya semua stiker!');
    $('sgrid').innerHTML = STICKERS.map((k) => '<div class="sticker' + (k.at <= stars ? '' : ' locked') + '">' + face(k)
      + '<b>' + (k.at <= stars ? k.name : '???') + '</b><small>⭐ ' + k.at + '</small></div>').join('');
  }

  ensureDiff();
  renderHome();
  // Opened from a shared map link: show that map in Map Maker, ready to play.
  if (location.hash.startsWith('#map=')) {
    const rows = mapFromLink();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file: pages */ }
    if (rows) {
      M.cells = rows.map((r) => [...r]); M.editing = null;
      show('maker');
      mkSay(tx('A friend made this map for you! Press ▶ Play.', 'Seorang teman membuat peta ini untukmu! Tekan ▶ Main.'), 'cheer');
    }
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
