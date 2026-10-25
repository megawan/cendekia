// Offline support for the hijaiyah game. Bump CACHE when the precached files change.
const CACHE = 'hijaiyah-v6';
const FONTS = 'hijaiyah-fonts-v1';

const BASES = ['alif', 'ba', 'ta', 'tsa', 'jim', 'ha', 'kho', 'dal', 'dzal', 'ra', 'zai', 'sin', 'syin', 'shad',
  'dhad', 'tho', 'zho', 'ain', 'ghain', 'fa', 'qaf', 'kaf', 'lam', 'mim', 'nun', 'wau', 'ha2', 'ya'];
const audio = [];
BASES.forEach((b, i) => {
  const n = String(i + 1).padStart(2, '0');
  [b, 'fathah', 'kasrah', 'dammah'].forEach((v) => audio.push('audio/' + n + '-' + v + '.mp3'));
});
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', '../shared/profile.js', '../shared/trace.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE.concat(audio))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // Only this app's old caches: other apps on the same origin keep theirs.
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hijaiyah-') && k !== CACHE && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve from cache and refresh it in the background, so the next visit gets updates.
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((hit) => {
      const net = fetch(request).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req, CACHE));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req, FONTS));
  }
});
