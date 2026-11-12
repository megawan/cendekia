// "Meet <mascot>" button for the home screen of each app. A hero marked data-mascot="<app>" gets a small pill
// under its subtitle; hovering it, focusing it or tapping it shows where the mascot's name comes from.
// The texts are also written out in MASCOTS.md: keep the two in step.
(function () {
  var MASCOTS = {
    hijaiyah: {
      name: 'Sada',
      text: 'Sada comes from the Arabic word ṣadā (⁨صدى⁩), meaning “echo”. Just like an echo, Sada repeats every letter sound back to you, so you can listen, say it, and hear it again until it feels easy.'
    },
    aksara: {
      name: 'Renjana',
      text: 'Renjana is an Indonesian word for a strong feeling of the heart: a deep passion, a longing for something you love. For Renjana, that something is stories. Renjana is the little reader who cannot wait to turn the next page, and who cheers you on as the letters turn into words and the words into stories.'
    },
    logica: {
      name: 'Poka',
      text: 'Poka is short for poka-yoke (ポカヨケ), a Japanese idea meaning “mistake-proofing”: designing things so that a mistake is noticed and fixed before it causes trouble. Poka the robot does the same. It follows your program step by step, so you can see where a mistake hides, and then fix it.'
    },
    lexica: {
      name: 'Pochi',
      text: 'Pochi is short for pochemuchka (почемучка), a Russian word for a person who keeps asking “why?” (почему). Pochi is curious about every word: what it means, how it sounds, and where it comes from.'
    },
    numeria: {
      name: 'Myria',
      text: 'Myria comes from the Greek word myrias (μυριάς), which means “ten thousand”, the biggest number the ancient Greeks had a single word for. It later gave English the word “myriad”, meaning too many to count. Myria is the friendly owl who loves numbers of every size, from counting apples in the kitchen to working out discounts in the shop.'
    }
  };

  var hero = document.querySelector('.hero[data-mascot]');
  var info = hero && MASCOTS[hero.getAttribute('data-mascot')];
  if (!info) return;

  var host = hero.lastElementChild || hero;
  var chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'mascot-chip';
  chip.textContent = 'Meet ' + info.name;
  chip.setAttribute('aria-expanded', 'false');

  var tip = document.createElement('div');
  tip.className = 'mascot-tip';
  tip.id = 'mascotTip';
  tip.setAttribute('role', 'dialog');
  tip.setAttribute('aria-label', 'About ' + info.name);
  tip.hidden = true;
  var title = document.createElement('b');
  title.textContent = info.name;
  var body = document.createElement('p');
  body.textContent = info.text;
  tip.appendChild(title);
  tip.appendChild(body);
  chip.setAttribute('aria-controls', tip.id);

  host.appendChild(chip);
  document.body.appendChild(tip);

  // Shown while hovered (mouse) or pinned (tap, click or keyboard).
  var hovered = false, pinned = false;
  function place() {
    var r = chip.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 24);
    tip.style.width = w + 'px';
    var left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 12));
    tip.style.left = left + 'px';
    tip.style.top = (r.bottom + 8) + 'px';
  }
  function render() {
    var show = hovered || pinned;
    if (show) place();
    tip.hidden = !show;
    chip.setAttribute('aria-expanded', show ? 'true' : 'false');
  }

  chip.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovered = true; render(); } });
  chip.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovered = false; render(); } });
  chip.addEventListener('click', function () { pinned = !pinned; render(); });
  document.addEventListener('pointerdown', function (e) {
    if (pinned && e.target !== chip && !tip.contains(e.target)) { pinned = false; render(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && (pinned || hovered)) { pinned = false; hovered = false; render(); chip.focus(); }
  });
  window.addEventListener('resize', function () { if (!tip.hidden) place(); });
  window.addEventListener('scroll', function () { if (pinned || hovered) { pinned = false; hovered = false; render(); } }, { passive: true });
})();
