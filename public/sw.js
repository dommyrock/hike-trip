/* hike-trip service worker
 *
 * Offline strategy:
 *   navigations   network-first, fall back to the cached shell ('/'); cached by
 *                 path — the finder's filters live in the query string, and the
 *                 static page is the same for every ?region=… / ?trail=…
 *   /api/trails   network-first, fall back to last good response (stale > none)
 *   /gpx/*        network-first — un-hashed files that change on re-bake; a
 *                 previously fetched track stays available offline
 *   /_astro/*     cache-first (content-hashed, immutable)
 *   /photos/*     cache-first, capped — trail photos never change in place (a new
 *                 photo gets a new file name), so the cards keep theirs offline
 *   map tiles     cache-first, capped — offline you keep the areas you browsed
 *   fonts         cache-first (immutable woff2 from gstatic)
 *
 * Bump VERSION when changing strategies to evict old caches on activate.
 * (The app shell itself updates without a bump: HTML is network-first and new
 * builds reference new hashed asset URLs.)
 */
const VERSION = 'v4'; // v4: navigations cached by path (drops v3's per-query-string copies)
const SHELL = `shell-${VERSION}`;   // '/', manifest, icons
const ASSETS = `assets-${VERSION}`; // hashed bundles + fonts
const DATA = `data-${VERSION}`;     // /api/trails responses
const TILES = `tiles-${VERSION}`;   // basemap tiles (capped)
const PHOTOS = `photos-${VERSION}`; // trail photos (capped)
const TILE_LIMIT = 400;
const PHOTO_LIMIT = 200;

const PRECACHE = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL, ASSETS, DATA, TILES, PHOTOS]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName, fallbackUrl, key = request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(key, response.clone());
    return response;
  } catch (err) {
    const hit =
      (await cache.match(key)) || (fallbackUrl && (await caches.match(fallbackUrl)));
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  // opaque (no-cors) responses — e.g. cross-origin tiles — report status 0 but are cacheable
  if (response.ok || response.type === 'opaque') {
    await cache.put(request, response.clone());
    if (limit) trim(cache, limit); // fire-and-forget
  }
  return response;
}

async function trim(cache, limit) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - limit; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL, '/', url.origin + url.pathname));
    return;
  }

  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/gpx/')) {
      event.respondWith(networkFirst(request, DATA));
    } else if (url.pathname.startsWith('/_astro/')) {
      event.respondWith(cacheFirst(request, ASSETS));
    } else if (url.pathname.startsWith('/photos/')) {
      event.respondWith(cacheFirst(request, PHOTOS, PHOTO_LIMIT));
    } else {
      event.respondWith(cacheFirst(request, SHELL)); // icons, favicon, manifest
    }
    return;
  }

  if (/(^|\.)tile\.(openstreetmap|opentopomap)\.org$/.test(url.hostname)) {
    event.respondWith(cacheFirst(request, TILES, TILE_LIMIT));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, ASSETS));
  }
  // anything else (e.g. Nominatim geocoding): straight to the network
});
