/* The second stage of hijaiyah: tanwin, long vowels (mad), sukun and tasydid.
 * One definition shared by the page (index.html), the service worker (sw.js) and the recording script
 * (tools/make-audio.mjs), so the shape, the reading and the sound file of every form come from the same place.
 *
 *   HijaiyahMore.form(kind, letter, vowel) -> { ch, say, name, file }
 *     kind    key of an entry in HijaiyahMore.KINDS
 *     letter  0..27 (alif, ba, ta ...)
 *     vowel   0 fathah/a, 1 kasrah/i, 2 dammah/u
 */
(function (root) {
  'use strict';
  var CH = 'ابتثجحخدذرزسشصضطظعغفقكلمنوهي'.split('');
  // How each letter is read, as in SYL in index.html (alif has no consonant).
  var SYL = ['', 'b', 't', 'ts', 'j', 'h', 'kh', 'd', 'dz', 'r', 'z', 's', 'sy', 'sh', 'dh', 'th', 'zh',
             "'", 'gh', 'f', 'q', 'k', 'l', 'm', 'n', 'w', 'h', 'y'];
  var V = ['a', 'i', 'u'];
  // Carrier of the first vowel in sukun and tasydid: a hamza on an alif, with the vowel under test.
  var CARRY = ['أَ', 'إِ', 'أُ'];
  var FATHAH_KASRAH_DAMMAH = ['َ', 'ِ', 'ُ'];

  var KINDS = [
    { key: 'tanwin', title: 'Tanwin', example: 'بً', skipAlif: false,
      info: 'Two marks instead of one: the vowel is read and then an n is added. Ba becomes ban, bin, bun.' },
    { key: 'mad', title: 'Long vowels', example: 'بَا', skipAlif: false,
      info: 'An alif, ya or wau after the vowel makes it long: baa, bii, buu. Hold the sound for two beats.' },
    { key: 'sukun', title: 'Sukun', example: 'أَبْ', skipAlif: true,
      info: 'A little circle means no vowel: the letter closes the syllable. Read the first vowel, then stop on the letter: ab, ib, ub.' },
    { key: 'tasydid', title: 'Tasydid', example: 'أَبَّ', skipAlif: true,
      info: 'A mark like a small w means the letter is doubled: abba, ibbi, ubbu. Press the letter twice.' }
  ];

  function form(kind, i, v) {
    var c = CH[i], s = SYL[i], ch, name;
    if (kind === 'tanwin') {
      ch = (i === 0 ? (v === 1 ? 'إ' : 'أ') : c) + ['ً', 'ٍ', 'ٌ'][v];
      name = s + V[v] + 'n';
    } else if (kind === 'mad') {
      ch = i === 0 ? ['آ', 'إِي', 'أُو'][v] : c + FATHAH_KASRAH_DAMMAH[v] + ['ا', 'ي', 'و'][v];
      name = s + V[v] + V[v];
    } else if (kind === 'sukun') {
      ch = CARRY[v] + c + 'ْ';
      name = V[v] + s;
    } else {
      ch = CARRY[v] + c + 'ّ' + FATHAH_KASRAH_DAMMAH[v];
      name = V[v] + s + s + V[v];
    }
    return { ch: ch, say: ch, name: name, file: String(i + 1).padStart(2, '0') + '-' + kind + '-' + V[v] + '.mp3' };
  }

  var api = { KINDS: KINDS, form: form, LETTER_COUNT: CH.length };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HijaiyahMore = api;
})(typeof self !== 'undefined' ? self : this);
