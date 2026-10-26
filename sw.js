// Offline support: the app shell, photos and map are cached on first visit.
const CACHE = 'medu-a5899d54ea';
const PRECACHE = ["./", "index.html", "manifest.webmanifest", "img/qalawun-0.jpg", "img/qalawun-1.jpg", "img/qalawun-2.jpg", "img/azhar-0.jpg", "img/azhar-1.jpg", "img/azhar-2.jpg", "img/zuweila-0.jpg", "img/zuweila-1.jpg", "img/zuweila-2.jpg", "img/zuweila-then.jpg", "img/hassan-0.jpg", "img/hassan-1.jpg", "img/hassan-2.jpg", "img/hassan-then.jpg", "img/hassan-midan.jpg", "img/hassan-portal.jpg", "img/hassan-tomb.jpg", "img/ibntulun-0.jpg", "img/ibntulun-1.jpg", "img/ibntulun-2.jpg", "img/gayer-0.jpg", "img/gayer-1.jpg", "img/gayer-2.jpg", "img/rifai-0.jpg", "img/rifai-1.jpg", "img/rifai-2.jpg", "img/akhur-0.jpg", "img/akhur-1.jpg", "img/akhur-2.jpg", "img/citadel-0.jpg", "img/citadel-1.jpg", "img/citadel-2.jpg", "img/hassan-print-kitlv.jpg", "img/hassan-print-herz1899.jpg", "img/hassan-print-facchinelli.jpg", "img/hassan-print-sebah.jpg", "img/hassan-print-protain.jpg", "img/hassan-print-conte.jpg", "img/map.jpg", "audio/narr/qalawun-0.m4a", "audio/narr/qalawun-1.m4a", "audio/narr/qalawun-2.m4a", "audio/narr/azhar-0.m4a", "audio/narr/azhar-1.m4a", "audio/narr/azhar-2.m4a", "audio/narr/zuweila-0.m4a", "audio/narr/zuweila-1.m4a", "audio/narr/zuweila-2.m4a", "audio/narr/ibntulun-0.m4a", "audio/narr/ibntulun-1.m4a", "audio/narr/ibntulun-2.m4a", "audio/narr/gayer-0.m4a", "audio/narr/gayer-1.m4a", "audio/narr/gayer-2.m4a", "audio/narr/hassan-0.m4a", "audio/narr/hassan-1.m4a", "audio/narr/hassan-2.m4a", "audio/narr/hassan-3.m4a", "audio/narr/hassan-4.m4a", "audio/narr/hassan-5.m4a", "audio/narr/rifai-0.m4a", "audio/narr/rifai-1.m4a", "audio/narr/rifai-2.m4a", "audio/narr/akhur-0.m4a", "audio/narr/akhur-1.m4a", "audio/narr/akhur-2.m4a", "audio/narr/citadel-0.m4a", "audio/narr/citadel-1.m4a", "audio/narr/citadel-2.m4a", "audio/ambient-ney.m4a", "icons/apple-touch-icon.png", "icons/favicon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Google Fonts: serve from cache, refresh in the background.
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then((r) => { c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // The app page and manifest: network first, so a new version shows on the next open; cache when offline.
  if (e.request.mode === 'navigate' || /[/](index[.]html|manifest[.]webmanifest)?$/.test(url.pathname)) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request.mode === 'navigate' ? 'index.html' : e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match('index.html'))));
});
