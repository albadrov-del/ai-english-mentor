// Service worker: precache the app shell, serve cache-first, work offline.
const CACHE = 'aem-shell-v1';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/profiles.js',
  './js/storage.js',
  './js/conversation.js',
  './js/api.js',
  './js/speech.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // never cache POSTs (e.g. /api/chat, /api/summary)

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // ignore cross-origin
  if (url.pathname.startsWith('/api/')) return; // always hit the network for the API

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).catch(() => {
        // Offline fallback: serve the cached shell for navigations.
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    }),
  );
});
