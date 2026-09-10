/* Kjuge Circuits — the part of "offline" that only a served page can do.
 *
 * The page itself keeps map tiles in IndexedDB, which works whether it was
 * opened from a disk or from a web address. Two things it cannot do on its own:
 *
 *   1. Hold on to itself. index.html pulls Leaflet from a CDN at start-up, so
 *      with no signal the page could open and draw nothing.
 *   2. Hold on to the photographs. The 27crags storage host sends no CORS
 *      header, so the page may show a picture but may not read its bytes. A
 *      worker never has to read them: it stores the reply as it stands and
 *      hands the same reply back to the <img>.
 *
 * There is no version to bump. The shell is fetched from the network first and
 * falls back to the copy, so a new deploy is picked up on the next load with
 * signal, and the copy is only ever used when the network is gone.
 */
const SHELL = 'kjuge-shell-v1';
const PHOTOS = 'kjuge-photos-v1';
const LIB = 'kjuge-lib-v1';

const LEAFLET = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];
const SHELL_URLS = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'];

const isPhoto = (url) => url.hostname.endsWith('upcloudobjects.com');
const isLib = (url) => url.hostname === 'unpkg.com';
const isTile = (url) => url.hostname.endsWith('tile.opentopomap.org');

self.addEventListener('install', (ev) => {
  ev.waitUntil((async () => {
    await caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).catch(() => {});
    // Cross-origin, so the replies are opaque. A worker can still serve them.
    const lib = await caches.open(LIB);
    await Promise.all(LEAFLET.map((u) =>
      fetch(u, { mode: 'no-cors' }).then((r) => lib.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil((async () => {
    const keep = [SHELL, PHOTOS, LIB];
    for (const name of await caches.keys()) {
      if (!keep.includes(name)) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

// Cache first: the address never changes what it points at.
async function fromCacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
  return res;
}

// Network first: the page is rebuilt on every deploy, so the copy is a fallback.
async function fromNetworkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    const hit = await cache.match(req, { ignoreVary: true })
      || await cache.match('./index.html', { ignoreVary: true });
    if (hit) return hit;
    throw e;
  }
}

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Tiles belong to the page's own store in IndexedDB; let them pass.
  if (isTile(url)) return;

  if (isPhoto(url)) { ev.respondWith(fromCacheFirst(req, PHOTOS)); return; }
  if (isLib(url)) { ev.respondWith(fromCacheFirst(req, LIB)); return; }
  if (url.origin === self.location.origin) { ev.respondWith(fromNetworkFirst(req, SHELL)); return; }
});

/* The page asks for the photographs of a circuit when somebody taps "Save this
 * walk for offline". It cannot store them itself - it may not read them - so it
 * sends the list here and gets a count back. */
self.addEventListener('message', (ev) => {
  const msg = ev.data || {};
  if (msg.type !== 'cache-photos' || !Array.isArray(msg.urls)) return;
  ev.waitUntil((async () => {
    const cache = await caches.open(PHOTOS);
    let kept = 0, had = 0;
    const queue = msg.urls.slice();
    async function worker() {
      while (queue.length) {
        const u = queue.shift();
        if (await cache.match(u, { ignoreVary: true })) { had++; continue; }
        try {
          const r = await fetch(u, { mode: 'no-cors' });
          if (r && (r.ok || r.type === 'opaque')) { await cache.put(u, r); kept++; }
        } catch (e) { /* no signal, or the host said no */ }
      }
    }
    // Four at a time, the same as the tiles.
    await Promise.all([worker(), worker(), worker(), worker()]);
    if (ev.source) ev.source.postMessage({ type: 'photos-cached', kept, had, of: msg.urls.length });
  })());
});
