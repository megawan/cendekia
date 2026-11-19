// Mascot name on the home screen of each app. A hero marked data-mascot="<app>" gets a one-line note under its
// subtitle ("Sada · Arabic for “echo” ›"). Tapping the note or the mascot opens a bottom sheet with the story
// of the name. The longer texts are also written out in MASCOTS.md.
(function () {
  var MASCOTS = {
    iqra: {
      name: 'Sada',
      origin: 'Arabic for “echo”',
      story: 'I am a little lion, and my name comes from the Arabic word ṣadā (⁨صدى⁩), which means “echo”. Like an echo, I repeat every letter sound back to you, so you can listen, say it and hear it again until it feels easy.'
    },
    aksara: {
      name: 'Renjana',
      origin: 'Indonesian for a heartfelt longing',
      story: 'Renjana is an Indonesian word for a strong feeling of the heart: a deep wish for something you love. Mine is stories! I cannot wait to turn the next page, and I cheer you on as letters turn into words and words into stories.'
    },
    logica: {
      name: 'Poka',
      origin: 'from the Japanese “poka-yoke”',
      story: 'I am a little beaver, and my name is short for poka-yoke (ポカヨケ), a Japanese idea meaning “mistake-proofing”: making mistakes easy to spot and fix. I follow your program step by step, so you can see where a mistake hides and then fix it.'
    },
    lexica: {
      name: 'Pochi',
      origin: 'from the Russian “pochemuchka”',
      story: 'I am a little parrot, and my name is short for pochemuchka (почемучка), a Russian word for a person who keeps asking “why?” (почему). I love every word: what it means, how it sounds and where it comes from.'
    },
    numeria: {
      name: 'Myria',
      origin: 'Greek for “ten thousand”',
      story: 'I am a little squirrel who counts every nut I save, and my name comes from the Greek word myrias (μυριάς), “ten thousand”, the biggest number the ancient Greeks had a word for. It gave English “myriad”: too many to count. I love numbers of every size, from apples in the kitchen to discounts in the shop.'
    },
    omnia: {
      name: 'Pacha',
      origin: 'Quechua for “world”',
      story: 'I am a little llama with a pack on my back, and my name is the Quechua word pacha, which means “world”. My family has carried things over the mountains of the Andes for thousands of years, so I have seen a lot of places. Come along, and I will show you what I know!'
    }
  };

  // Indonesian texts (the names stay the same).
  var ID = {
    iqra: { origin: 'bahasa Arab untuk “gema”', story: 'Aku singa kecil, dan namaku berasal dari kata Arab ṣadā (⁨صدى⁩) yang artinya “gema”. Seperti gema, aku mengulang setiap bunyi huruf untukmu, jadi kamu bisa mendengar, mengucapkannya, dan mendengarnya lagi sampai terasa mudah.' },
    aksara: { origin: 'bahasa Indonesia untuk kerinduan hati', story: 'Renjana adalah kata bahasa Indonesia untuk perasaan hati yang kuat: keinginan mendalam pada sesuatu yang kamu cintai. Punyaku adalah cerita! Aku tidak sabar membuka halaman berikutnya, dan aku menyemangatimu saat huruf menjadi kata dan kata menjadi cerita.' },
    logica: { origin: 'dari kata Jepang “poka-yoke”', story: 'Aku berang-berang kecil, dan namaku singkatan dari poka-yoke (ポカヨケ), gagasan Jepang yang artinya “pencegah kesalahan”: membuat kesalahan mudah terlihat dan diperbaiki. Aku mengikuti programmu langkah demi langkah, jadi kamu bisa melihat di mana kesalahan bersembunyi lalu memperbaikinya.' },
    lexica: { origin: 'dari kata Rusia “pochemuchka”', story: 'Aku burung beo kecil, dan namaku singkatan dari pochemuchka (почемучка), kata Rusia untuk orang yang selalu bertanya “kenapa?” (почему). Aku suka setiap kata: artinya, bunyinya, dan dari mana asalnya.' },
    numeria: { origin: 'bahasa Yunani untuk “sepuluh ribu”', story: 'Aku tupai kecil yang menghitung setiap kacang yang kusimpan, dan namaku berasal dari kata Yunani myrias (μυριάς), “sepuluh ribu”, bilangan terbesar yang punya nama bagi orang Yunani kuno. Dari sana muncul kata “myriad” dalam bahasa Inggris: terlalu banyak untuk dihitung. Aku suka bilangan segala ukuran, dari apel di dapur sampai diskon di toko.' },
    omnia: { origin: 'bahasa Quechua untuk “dunia”', story: 'Aku llama kecil dengan bungkusan di punggung, dan namaku adalah kata Quechua pacha, yang artinya “dunia”. Keluargaku sudah membawa barang melintasi pegunungan Andes selama ribuan tahun, jadi aku sudah melihat banyak tempat. Ayo ikut, akan kutunjukkan apa yang kutahu!' }
  };
  var id = window.Cendekia && Cendekia.lang === 'id';

  var hero = document.querySelector('.hero[data-mascot]');
  var info = hero && MASCOTS[hero.getAttribute('data-mascot')];
  if (!info || typeof HTMLDialogElement !== 'function') return;
  if (id) info = { name: info.name, origin: ID[hero.getAttribute('data-mascot')].origin, story: ID[hero.getAttribute('data-mascot')].story };

  var picture = hero.firstElementChild;
  var host = hero.lastElementChild || hero;

  var line = document.createElement('button');
  line.type = 'button';
  line.className = 'mascot-line';
  var strong = document.createElement('b');
  strong.textContent = info.name;
  line.appendChild(strong);
  line.appendChild(document.createTextNode(' · ' + info.origin + ' ›'));
  line.setAttribute('aria-haspopup', 'dialog');
  host.appendChild(line);

  var sheet = document.createElement('dialog');
  sheet.className = 'mascot-sheet';
  sheet.setAttribute('aria-labelledby', 'mascotSheetTitle');
  var title = document.createElement('h2');
  title.id = 'mascotSheetTitle';
  title.textContent = id ? 'Hai, aku ' + info.name + '!' : 'Hi, I’m ' + info.name + '!';
  var from = document.createElement('p');
  from.className = 'mascot-sheet-from';
  from.textContent = info.name + ': ' + info.origin;
  var story = document.createElement('p');
  story.className = 'mascot-sheet-story';
  story.textContent = info.story;
  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'mascot-sheet-close';
  close.textContent = id ? 'Tutup' : 'Close';
  sheet.appendChild(title);
  sheet.appendChild(from);
  sheet.appendChild(story);
  sheet.appendChild(close);
  document.body.appendChild(sheet);

  function open() { sheet.showModal(); }
  line.addEventListener('click', open);
  if (picture) {
    picture.classList.add('mascot-tap');
    picture.addEventListener('click', open);
  }
  close.addEventListener('click', function () { sheet.close(); });
  // A tap on the dimmed area outside the sheet closes it.
  sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });
})();
