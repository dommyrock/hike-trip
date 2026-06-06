/* hike-trip service worker
 *
 * Offline strategy:
 *   navigations   network-first, fall back to the cached shell ('/')
 *   /api/trails   network-first, fall back to last good response (stale > none)
 *   /_astro/*     cache-first (content-hashed, immutable)
 *   map tiles     cache-first, capped — offline you keep the areas you browsed
 *   fonts         cache-first (immutable woff2 from gstatic)
 *
 * Bump VERSION when changing strategies to evict old caches on activate.
 * (The app shell itself updates without a bump: HTML is network-first and new
 * builds reference new hashed asset URLs.)
 */
const VERSION = 'v1';
const SHELL = `shell-${VERSION}`;   // '/', manifest, icons
const ASSETS = `assets-${VERSION}`; // hashed bundles + fonts
const DATA = `data-${VERSION}`;     // /api/trails responses
const TILES = `tiles-${VERSION}`;   // basemap tiles (capped)
const TILE_LIMIT = 400;

const PRECACHE = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL, ASSETS, DATA, TILES]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const hit =
      (await cache.match(request)) || (fallbackUrl && (await caches.match(fallbackUrl)));
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
    event.respondWith(networkFirst(request, SHELL, '/'));
    return;
  }

  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirst(request, DATA));
    } else if (url.pathname.startsWith('/_astro/')) {
      event.respondWith(cacheFirst(request, ASSETS));
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
