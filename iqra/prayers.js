/* The prayers (doa) of Iqra. One definition shared by the page (index.html), the service worker (sw.js) and the
 * recording script (tools/make-audio.mjs), so the text, the meanings and the sound file come from the same place.
 *
 *   IqraPrayers.LIST  entries with:
 *     id        used for the sound file: audio/doa-<id>.mp3
 *     title     English title (the page is in English)
 *     titleId   Indonesian title
 *     ar        the prayer with its harakat, shown and read aloud
 *     say       what the voice is asked to say (same as ar)
 *     read      how it is read, in Latin letters
 *     meaningId meaning in Indonesian
 *     meaningEn meaning in English
 *     source    where the prayer is reported from
 */
(function (root) {
  'use strict';
  var LIST = [
    {
      id: 'rain',
      title: 'When it rains',
      titleId: 'Doa ketika turun hujan',
      ar: 'اللَّهُمَّ صَيِّبًا نَافِعًا',
      read: "Allahumma shayyiban nafi'a",
      meaningId: 'Ya Allah, turunkanlah hujan yang bermanfaat.',
      meaningEn: 'O Allah, let it be a beneficial rain.',
      source: 'HR. Bukhari'
    }
  ];
  LIST.forEach(function (p) { p.say = p.ar; p.file = 'doa-' + p.id + '.mp3'; });

  var api = { LIST: LIST };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IqraPrayers = api;
})(typeof self !== 'undefined' ? self : this);
