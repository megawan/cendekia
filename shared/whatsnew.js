// "What's new" popup on the landing page. It opens by itself the first time a device loads the page after
// each release (including a first visit), and opens again from the "What’s new" link in the footer. To announce a new week, change RELEASE.id and the items.
(function () {
  var KEY = 'cendekia.whatsnew.v1';
  var RELEASE = {
    id: '2026-11-27',
    title: 'What’s new this week',
    items: [
      { title: 'First Arabic words in Iqra', text: 'Mufradat: 77 Arabic words in eight themes, from animals and fruit to family and colours, each with a picture and its sound. Then practise them in a short quiz.' },
      { title: 'Night colours and easier reading', text: 'The Aa button now has a Night mode, plus bigger text, high contrast, easy-to-read letters and a calm mode with no animation.' },
      { title: 'Omnia has a lot more to explore', text: 'The solar system, the water cycle, food chains, day, night and seasons, life cycles, flags, volcanoes, landmarks, and new games on the map.' },
      { title: 'Poka’s Parking Lot and Poka’s Maze', text: 'Slide the cars out of the lot, and help Poka find the way home through a maze. Poka’s Backpack also has Repeat and Mixed up levels now.' },
      { title: 'Hijaiyah is now Iqra', text: 'The same 28 letters with a new name, and a new prayer to learn: the prayer for rain.' },
      { title: 'Everything moves a little', text: 'Mascots blink and cheer, stars pop in, cards flip, and letters sparkle when you trace them.' }
    ]
  };
  // Indonesian, in the same order as the items above.
  var ID = {
    title: 'Yang baru minggu ini',
    close: 'Siap',
    items: [
      { title: 'Kosakata bahasa Arab pertama di Iqra', text: 'Mufradat: 77 kata bahasa Arab dalam delapan tema, dari hewan dan buah sampai keluarga dan warna, masing-masing dengan gambar dan suaranya. Lalu latih dengan kuis singkat.' },
      { title: 'Warna malam dan huruf yang lebih mudah dibaca', text: 'Tombol Aa kini punya mode Malam, juga huruf lebih besar, kontras tinggi, huruf mudah dibaca, dan mode tenang tanpa animasi.' },
      { title: 'Omnia punya lebih banyak untuk dijelajahi', text: 'Tata surya, siklus air, rantai makanan, siang, malam dan musim, daur hidup, bendera, gunung berapi, tempat terkenal, dan permainan baru di peta.' },
      { title: 'Tempat Parkir Poka', text: 'Geser mobil keluar dari tempat parkir. Ransel Poka juga punya level Ulangi dan Campur aduk.' },
      { title: 'Hijaiyah kini bernama Iqra', text: 'Tetap 28 huruf yang sama dengan nama baru, dan doa baru untuk dipelajari: doa meminta hujan.' },
      { title: 'Semuanya bergerak sedikit', text: 'Maskot berkedip dan bersorak, bintang muncul, kartu berputar, dan huruf berkilau saat kamu menelusurinya.' }
    ]
  };
  if (window.Cendekia && Cendekia.lang === 'id') { RELEASE.title = ID.title; RELEASE.items = ID.items; }

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
  close.textContent = window.Cendekia && Cendekia.lang === 'id' ? ID.close : 'Got it';
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
  if (last !== RELEASE.id) open();
})();
