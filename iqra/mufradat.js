/* Mufradat: first Arabic words, in themes. One definition shared by the page (index.html), the service worker (sw.js)
 * and the recording script (tools/make-audio.mjs), so the word, its reading and its sound file come from the same place.
 *
 *   IqraWords.THEMES  entries with:
 *     id, title (English), titleId (Indonesian), words
 *   A word is [arabic, reading, indonesian, english, art]:
 *     arabic   the word with its harakat, shown and read aloud
 *     reading  how it is read, in Latin letters (the same spelling as the letter names: sy, sh, th, dh, zh, ts, dz, kh, ')
 *     art      key of its drawing in shared/art.js, also its sound file: audio/mufradat-<art>.mp3
 *   IqraWords.LIST    every word as { key, ar, say, read, id, en, art, file, theme }
 */
(function (root) {
  'use strict';
  var THEMES = [
    { id: 'animals', title: 'Animals', titleId: 'Hewan', words: [
      ['قِطٌّ', 'qiththun', 'kucing', 'cat', 'cat'],
      ['بَقَرَةٌ', 'baqaratun', 'sapi', 'cow', 'cow'],
      ['حِصَانٌ', 'hishaanun', 'kuda', 'horse', 'horse'],
      ['دَجَاجَةٌ', 'dajaajatun', 'ayam', 'chicken', 'chicken'],
      ['أَرْنَبٌ', 'arnabun', 'kelinci', 'rabbit', 'rabbit'],
      ['جَمَلٌ', 'jamalun', 'unta', 'camel', 'camel'],
      ['فِيلٌ', 'fiilun', 'gajah', 'elephant', 'elephant'],
      ['أَسَدٌ', 'asadun', 'singa', 'lion', 'lion'],
      ['سَمَكَةٌ', 'samakatun', 'ikan', 'fish', 'fish'],
      ['طَائِرٌ', "thaa-irun", 'burung', 'bird', 'bird']
    ] },
    { id: 'fruit', title: 'Fruit', titleId: 'Buah', words: [
      ['تُفَّاحٌ', 'tuffaahun', 'apel', 'apple', 'apple'],
      ['مَوْزٌ', 'mauzun', 'pisang', 'banana', 'banana'],
      ['بُرْتُقَالٌ', 'burtuqaalun', 'jeruk', 'orange', 'orange'],
      ['عِنَبٌ', "'inabun", 'anggur', 'grapes', 'grapes'],
      ['بِطِّيخٌ', 'biththiikhun', 'semangka', 'watermelon', 'watermelon'],
      ['رُمَّانٌ', 'rummaanun', 'delima', 'pomegranate', 'pomegranate'],
      ['مَانْجُو', 'maanjuu', 'mangga', 'mango', 'mango'],
      ['لَيْمُونٌ', 'laimuunun', 'lemon', 'lemon', 'lemon'],
      ['جَوْزُ الْهِنْدِ', 'jauzul hindi', 'kelapa', 'coconut', 'coconut'],
      ['فَرَاوِلَةٌ', 'faraawilatun', 'stroberi', 'strawberry', 'strawberry']
    ] },
    { id: 'food', title: 'Food & drinks', titleId: 'Makanan & minuman', words: [
      ['خُبْزٌ', 'khubzun', 'roti', 'bread', 'bread'],
      ['أَرُزٌّ', 'aruzzun', 'nasi', 'rice', 'rice'],
      ['بَيْضَةٌ', 'baidhatun', 'telur', 'egg', 'egg'],
      ['حَلِيبٌ', 'haliibun', 'susu', 'milk', 'milk'],
      ['مَاءٌ', "maa-un", 'air', 'water', 'water'],
      ['عَسَلٌ', "'asalun", 'madu', 'honey', 'honey'],
      ['جُبْنٌ', 'jubnun', 'keju', 'cheese', 'cheese'],
      ['شَايٌ', 'syaayun', 'teh', 'tea', 'tea'],
      ['عَصِيرٌ', "'ashiirun", 'jus', 'juice', 'juice'],
      ['كَعْكَةٌ', "ka'katun", 'kue', 'cake', 'cake']
    ] },
    { id: 'home', title: 'At home', titleId: 'Di rumah', words: [
      ['بَيْتٌ', 'baitun', 'rumah', 'house', 'house'],
      ['بَابٌ', 'baabun', 'pintu', 'door', 'door'],
      ['نَافِذَةٌ', 'naafidzatun', 'jendela', 'window', 'window'],
      ['سَرِيرٌ', 'sariirun', 'tempat tidur', 'bed', 'bed'],
      ['كُرْسِيٌّ', 'kursiyyun', 'kursi', 'chair', 'chair'],
      ['طَاوِلَةٌ', 'thaawilatun', 'meja', 'table', 'table'],
      ['مِفْتَاحٌ', 'miftaahun', 'kunci', 'key', 'key'],
      ['مِصْبَاحٌ', 'mishbaahun', 'lampu', 'lamp', 'lamp'],
      ['سَاعَةٌ', "saa'atun", 'jam', 'clock', 'clock'],
      ['مِرْآةٌ', "mir-aatun", 'cermin', 'mirror', 'mirror']
    ] },
    { id: 'school', title: 'At school', titleId: 'Di sekolah', words: [
      ['مَدْرَسَةٌ', 'madrasatun', 'sekolah', 'school', 'school'],
      ['مُعَلِّمٌ', "mu'allimun", 'guru', 'teacher', 'teacher'],
      ['كِتَابٌ', 'kitaabun', 'buku', 'book', 'book'],
      ['قَلَمٌ', 'qalamun', 'pena', 'pen', 'pen'],
      ['دَفْتَرٌ', 'daftarun', 'buku tulis', 'notebook', 'notebook'],
      ['حَقِيبَةٌ', 'haqiibatun', 'tas sekolah', 'school bag', 'school-bag'],
      ['مِسْطَرَةٌ', 'mistharatun', 'penggaris', 'ruler', 'ruler'],
      ['مِمْحَاةٌ', 'mimhaatun', 'penghapus', 'eraser', 'eraser'],
      ['مِقَصٌّ', 'miqashshun', 'gunting', 'scissors', 'scissors'],
      ['مَكْتَبٌ', 'maktabun', 'meja belajar', 'desk', 'desk']
    ] },
    { id: 'nature', title: 'Nature', titleId: 'Alam', words: [
      ['شَمْسٌ', 'syamsun', 'matahari', 'sun', 'sun'],
      ['قَمَرٌ', 'qamarun', 'bulan', 'moon', 'moon'],
      ['نَجْمٌ', 'najmun', 'bintang', 'star', 'star'],
      ['سَحَابَةٌ', 'sahaabatun', 'awan', 'cloud', 'cloud'],
      ['مَطَرٌ', 'matharun', 'hujan', 'rain', 'rain'],
      ['شَجَرَةٌ', 'syajaratun', 'pohon', 'tree', 'tree'],
      ['زَهْرَةٌ', 'zahratun', 'bunga', 'flower', 'flower'],
      ['جَبَلٌ', 'jabalun', 'gunung', 'mountain', 'mountain'],
      ['بَحْرٌ', 'bahrun', 'laut', 'sea', 'sea'],
      ['نَارٌ', 'naarun', 'api', 'fire', 'fire']
    ] },
    { id: 'family', title: 'Family', titleId: 'Keluarga', words: [
      ['أَبٌ', 'abun', 'ayah', 'father', 'father'],
      ['أُمٌّ', 'ummun', 'ibu', 'mother', 'mother'],
      ['جَدٌّ', 'jaddun', 'kakek', 'grandfather', 'grandfather'],
      ['جَدَّةٌ', 'jaddatun', 'nenek', 'grandmother', 'grandmother'],
      ['وَلَدٌ', 'waladun', 'anak laki-laki', 'boy', 'boy'],
      ['بِنْتٌ', 'bintun', 'anak perempuan', 'girl', 'girl'],
      ['رَضِيعٌ', "radhii'un", 'bayi', 'baby', 'baby'],
      ['أُسْرَةٌ', 'usratun', 'keluarga', 'family', 'family']
    ] },
    { id: 'colors', title: 'Colours', titleId: 'Warna', words: [
      ['أَحْمَرُ', 'ahmaru', 'merah', 'red', 'red'],
      ['أَزْرَقُ', 'azraqu', 'biru', 'blue', 'blue'],
      ['أَخْضَرُ', 'akhdharu', 'hijau', 'green', 'green'],
      ['أَصْفَرُ', 'ashfaru', 'kuning', 'yellow', 'yellow'],
      ['أَبْيَضُ', 'abyadhu', 'putih', 'white', 'white'],
      ['أَسْوَدُ', 'aswadu', 'hitam', 'black', 'black'],
      ['بُنِّيٌّ', 'bunniyyun', 'cokelat', 'brown', 'brown'],
      ['بُرْتُقَالِيٌّ', 'burtuqaaliyyun', 'oranye', 'orange', 'orange-color'],
      ['بَنَفْسَجِيٌّ', 'banafsajiyyun', 'ungu', 'purple', 'purple']
    ] }
  ];

  var LIST = [];
  THEMES.forEach(function (t) {
    t.list = t.words.map(function (w) {
      var word = { key: 'word:' + w[4], ar: w[0], say: w[0], read: w[1], id: w[2], en: w[3], art: w[4],
        file: 'mufradat-' + w[4] + '.mp3', theme: t.id };
      LIST.push(word);
      return word;
    });
  });

  var api = { THEMES: THEMES, LIST: LIST };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IqraWords = api;
})(typeof self !== 'undefined' ? self : this);
