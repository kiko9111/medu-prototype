// Medu on-site edition: offline support.
// The app shell is cached on install (network first, so updates show on the next open).
// The play's files (../play/...) are stored by the page's "Download for the visit" button in MEDIA_CACHE and served
// from there first. Audio is served with Range support (206), which Safari needs to play cached files.
const SHELL_CACHE = 'medu-site-shell-v4';
const MEDIA_CACHE = 'medu-site-media';
const SHELL = ['./', 'index.html', 'wave1.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL.map((p) => new Request(p, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('medu-site-shell') && k !== SHELL_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function ranged(req, res) {
  const range = req.headers.get('range');
  if (!range) return res;
  const m = /bytes=(\d*)-(\d*)/.exec(range); if (!m) return res;
  const buf = await res.arrayBuffer(); const size = buf.byteLength;
  let start = m[1] === '' ? size - (+m[2]) : +m[1];
  let end = m[1] !== '' && m[2] !== '' ? +m[2] : size - 1;
  start = Math.max(0, start); end = Math.min(size - 1, end);
  if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
    'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  // fonts: cache, refresh in the background
  if (/(^|\.)(googleapis|gstatic)\.com$/.test(u.hostname) || (u.hostname === "cdn.jsdelivr.net" && u.pathname.startsWith("/npm/three@"))) {
    e.respondWith(caches.open(SHELL_CACHE).then(async (c) => { const hit = await c.match(req); const net = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; }));
    return;
  }
  if (u.origin !== location.origin) return;
  const scope = new URL(self.registration.scope);
  const inShell = u.pathname.startsWith(scope.pathname);
  e.respondWith((async () => {
    const key = u.origin + u.pathname;
    // the play's files: the downloaded copy first (JSON: network first when online, so text fixes arrive)
    if (!inShell || /\.(mp3|m4a|mp4|jpg|jpeg|png|webp)$/i.test(u.pathname) && !u.pathname.startsWith(scope.pathname + 'icons/')) {
      const media = await caches.open(MEDIA_CACHE);
      const hit = await media.match(key);
      if (hit && !/\.json$/i.test(u.pathname)) return ranged(req, hit);
      try { const r = await fetch(req); if (r.ok && hit && /\.json$/i.test(u.pathname)) media.put(key, r.clone()); return r; }
      catch (err) { if (hit) return hit; throw err; }
    }
    // the app shell: network first, cache when offline
    const shell = await caches.open(SHELL_CACHE);
    try { const r = await fetch(req, { cache: 'no-store' }); if (r.ok) shell.put(req.mode === 'navigate' ? 'index.html' : req, r.clone()); return r; }
    catch (err) { return (await shell.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? shell.match('index.html') : Response.error()); }
  })());
});
