// "What's new" popup on the landing page. It opens by itself once for each release, for a device that has
// visited before (a first visit only records the release), and opens again from the "What’s new" link
// in the footer. To announce a new week, change RELEASE.id and the items.
(function () {
  var KEY = 'cendekia.whatsnew.v1';
  var RELEASE = {
    id: '2026-11-18',
    title: 'What’s new this week',
    items: [
      { title: 'Night colours and easier reading', text: 'The Aa button now has a Night mode, plus bigger text, high contrast, easy-to-read letters and a calm mode with no animation.' },
      { title: 'Omnia has a lot more to explore', text: 'The solar system, the water cycle, food chains, day, night and seasons, life cycles, flags, volcanoes, landmarks, and new games on the map.' },
      { title: 'Poka’s Parking Lot', text: 'Slide the cars out of the lot. Poka’s Backpack also has Repeat and Mixed up levels now.' },
      { title: 'Hijaiyah is now Iqra', text: 'The same 28 letters with a new name, and a new prayer to learn: the prayer for rain.' },
      { title: 'Everything moves a little', text: 'Mascots blink and cheer, stars pop in, cards flip, and letters sparkle when you trace them.' }
    ]
  };

  var button = document.getElementById('whatsNew');
  if (!button || typeof HTMLDialogElement !== 'function') return;
  document.getElementById('whatsNewWrap').hidden = false;

  var sheet = document.createElement('dialog');
  sheet.className = 'new-sheet';
  sheet.setAttribute('aria-labelledby', 'newSheetTitle');
  var title = document.createElement('h2');
  title.id = 'newSheetTitle';
  title.textContent = RELEASE.title;
  var list = document.createElement('ul');
  RELEASE.items.forEach(function (item) {
    var li = document.createElement('li');
    var strong = document.createElement('b');
    strong.textContent = item.title;
    li.appendChild(strong);
    li.appendChild(document.createTextNode(item.text));
    list.appendChild(li);
  });
  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'new-sheet-close';
  close.textContent = 'Got it';
  sheet.appendChild(title);
  sheet.appendChild(list);
  sheet.appendChild(close);
  document.body.appendChild(sheet);

  function seen() { try { localStorage.setItem(KEY, RELEASE.id); } catch (e) {} }
  function open() { sheet.showModal(); close.focus(); seen(); }
  button.addEventListener('click', open);
  close.addEventListener('click', function () { sheet.close(); });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });

  var last = null;
  try { last = localStorage.getItem(KEY); } catch (e) {}
  if (last === null) seen();
  else if (last !== RELEASE.id) open();
})();
