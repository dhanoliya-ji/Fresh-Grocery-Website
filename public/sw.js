// Freshly service worker: makes the store work offline and lets it be installed as an app.
//  - pages: network first, falling back to the cached copy when offline
//  - everything else (hashed scripts, styles, photos, fonts): served from cache, refreshed in the background
const CACHE = 'freshly-v3';
const WARM = 'freshly-warm';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== WARM).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.host);
  if (!sameOrigin && !font) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./').then((r) => r || caches.match('./index.html'))),
    );
    return;
  }

  // stale-while-revalidate
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});

// the page sends the list of every product photo once it has settled; cache them for offline browsing
self.addEventListener('message', (e) => {
  if (e.data?.type !== 'warm') return;
  e.waitUntil(
    caches.open(WARM).then(async (c) => {
      await Promise.all(
        e.data.urls.map((u) =>
          c.match(u).then((hit) => hit || fetch(u).then((res) => res.ok && c.put(u, res)).catch(() => {})),
        ),
      );
      const clients = await self.clients.matchAll();
      clients.forEach((cl) => cl.postMessage({ type: 'warmed' }));
    }),
  );
});
