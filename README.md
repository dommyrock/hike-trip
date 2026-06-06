# Val Gardena Trails — Ortisei

**Live:** <https://hike-trip.dominik-polzer.workers.dev>

A clean, fast hiking-trail finder for the **Ortisei / Val Gardena** area in the Dolomites.
Trails are drawn on an open-source map, pinned and colour-coded by difficulty
(🟢 easy · 🟡 medium · 🔴 hard), with a search/filter bar and a card per trail
showing distance from your base, peak height, length, ascent and walking time.

Built with **[Astro](https://astro.build)** — a static, zero-framework shell that
renders instantly, plus a single client-side **[Leaflet](https://leafletjs.com)**
island for the interactive map.

---

## Run it

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:4321)
```

Build for production:

```bash
npm run build    # output to ./dist
npm run preview  # preview the production build locally
```

---

## How it works

- The page itself is **static HTML** — the header, controls and an initial set of
  trail cards are server-rendered for fast first paint and so it works without JS.
- On load, a single bundled `<script>` boots Leaflet, draws every trail (a coloured
  polyline + a mountain pin at the high point), and **takes over** the cards so that
  searching, filtering, sorting and changing your base update the map and the list
  together.
- The basemap is **standard OpenStreetMap** (the default OSM style, untouched);
  a **Terrain** toggle switches to **OpenTopoMap** for contour/hiking detail.
  No API keys needed.

### Project structure

```
hike-trip/
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ components/
│  │  └─ TrailCard.astro     # one trail card (server-rendered first paint)
│  ├─ data/
│  │  └─ trails.js           # ← the trail dataset (build-time snapshot + seed source)
│  ├─ layouts/
│  │  └─ Base.astro          # <head>, fonts, global CSS
│  ├─ lib/
│  │  └─ geo.js              # haversine distance, bases, formatting helpers
│  ├─ pages/
│  │  └─ index.astro         # the page + the Leaflet client island
│  └─ styles/
│     └─ global.css          # the whole glass / light-grey design system
├─ db/
│  ├─ schema.sql             # D1 (SQLite): origins ──< trails
│  ├─ generate-seed.mjs      # trails.js -> seed.sql
│  └─ seed.sql               # generated — don't edit by hand
├─ worker/
│  └─ index.js               # /api/trails from D1, static assets for the rest
├─ wrangler.toml             # Workers + assets + D1 bindings
├─ astro.config.mjs
└─ package.json
```

---

## Database + Cloudflare deployment

The site deploys as a single **Cloudflare Worker** with static assets: the built
Astro site is served from Cloudflare's edge cache (free, unmetered), and only
`/api/*` invokes the Worker, which reads trails from **D1** (Cloudflare's SQLite).

```
                                ┌─────────────────────────────────────────────┐
                                │            CLOUDFLARE EDGE (PoP)            │
                                │                                             │
  Browser                       │   ┌──────────────────────────────────────┐  │
  ┌──────────────┐   GET /      │   │  Static assets  (./dist, free)       │  │
  │ static shell │◄─────────────┼──►│  index.html · JS island · CSS        │  │
  │ + Leaflet    │              │   └──────────────────────────────────────┘  │
  │   island     │   GET /api/  │   ┌──────────────┐      ┌───────────────┐   │
  │              │   trails?    │   │  Worker      │ SQL  │  D1 (SQLite)  │   │
  │              │◄─────────────┼──►│  worker/     │─────►│  origins ──<  │   │
  └──────┬───────┘   JSON       │   │  index.js    │      │  trails       │   │
         │                      │   └──────────────┘      └───────────────┘  │
         │ map tiles            └─────────────────────────────────────────────┘
         ▼
  OpenStreetMap · OpenTopoMap   (third-party tile CDNs, no key)
```

- **`origins`** (1) ──< (n) **`trails`**: one row per base location (`ortisei`),
  trails reference it by `origin_id`. Add a new area = 1 origin row + its trails.
- The client island calls `/api/trails?origin=ortisei`; if the API is missing
  (plain `astro dev`, offline) it falls back to the build-time snapshot in
  `src/data/trails.js`, so the site never breaks.
- Free-tier math: static requests are unmetered; the Worker only runs on `/api/*`
  (100k req/day free); D1 free tier is 5M row reads/day — this app reads ~10
  rows per visit.

### PWA

The site is installable ("Add to Home Screen") and works offline:

- `public/manifest.webmanifest` + `public/icons/` (PNGs rendered from `icon.svg`)
  make it installable; `Base.astro` links them and registers the service worker.
- `public/sw.js` caches the app shell and the last `/api/trails` response
  (network-first, so you always get fresh data online), hashed bundles and fonts
  (cache-first, immutable), and up to ~400 map tiles you've already viewed.
- Offline you get: the full trail list, cards and stats, plus whatever map areas
  you browsed while online. Fresh tiles need a connection.
- To regenerate icons after editing `public/icons/icon.svg` (macOS):
  `qlmanage -t -s 512 -o public/icons public/icons/icon.svg`, rename the
  produced `icon.svg.png` to `icon-512.png`, then
  `sips -z 192 192 icon-512.png --out icon-192.png` and
  `sips -z 180 180 icon-512.png --out apple-touch-icon.png`.
- Bump `VERSION` in `sw.js` only when changing caching strategy — normal site
  updates flow through automatically (HTML is network-first).

### Setup (one-time)

```bash
npx wrangler login                  # connect your Cloudflare account
npx wrangler d1 create hike_trip    # prints a database_id
#   -> paste it into wrangler.toml  [[d1_databases]] database_id
npm run db:apply                    # schema + seed into the LOCAL dev DB
npm run db:apply:remote             # schema + seed into production D1
```

### Daily workflow

```bash
npm run dev              # plain Astro dev (uses the static fallback data)
npm run preview:cf       # build + wrangler dev → full stack w/ LOCAL D1 (:8787)
npm run deploy           # build + deploy Worker + assets to Cloudflare
npm run db:seed:gen      # regenerate db/seed.sql after editing trails.js
```

To edit data in production directly (no redeploy needed):

```bash
npx wrangler d1 execute hike_trip --remote \
  --command "UPDATE trails SET length_km = 10.2 WHERE slug = 'adolf-munkel'"
```

---

## Add a trail

Append an object to the `trails` array in **`src/data/trails.js`**:

```js
{
  id: 'my-trail',                 // unique slug
  name: 'My Trail',
  area: 'Puez-Odle Nature Park',
  trail: 'No. 12',                // shown as a small tag
  difficulty: 'medium',           // 'easy' | 'medium' | 'hard'
  lengthKm: 7.5,
  ascentM: 400,
  durationH: 3,                   // decimal hours (3.5 = 3 h 30 min)
  peakM: 2200,                    // highest point you actually reach
  peakName: 'Some Saddle',
  massif: 'Odle / Geisler',       // the big peaks you walk under
  access: 'Cable car from Ortisei',
  start: [46.60, 11.67],          // [lat, lng] trailhead
  peak:  [46.61, 11.66],          // [lat, lng] where the map pin sits
  path:  [[46.60, 11.67], [46.61, 11.66]], // route polyline (see below)
  blurb: 'One sentence about the walk.',
},
```

That's it — distances, the pin, the polyline, the card and the filters all update
automatically.

---

## Swapping in real trail geometry

> **Important:** the `path` polylines that ship with this project are **schematic** —
> sketched between real anchor points (trailheads, cable-car tops, summits, which
> *are* accurate). They do **not** follow every switchback, so do not navigate by
> them. Replace them with real tracks before relying on the map in the field.

To get a real route for a trail:

1. Find/record the route on [OpenStreetMap](https://www.openstreetmap.org),
   [Outdooractive](https://www.outdooractive.com) or
   [AllTrails](https://www.alltrails.com) and **export a GPX**, or draw it by hand at
   [geojson.io](https://geojson.io).
2. Convert the track to a list of `[lat, lng]` pairs.
3. Paste them into that trail's `path` array in `src/data/trails.js`.

(Leaflet expects `[lat, lng]`; GeoJSON stores coordinates as `[lng, lat]`, so swap
the order if you copy straight from a `.geojson` file.)

---

## Notes & caveats

- **Distances are straight-line** ("as the crow flies") from your chosen base to the
  *trailhead* — handy for ranking, not an on-trail distance.
- The **"From"** field resolves the preset valley bases instantly; any other place is
  looked up via OpenStreetMap's **Nominatim** geocoder, which is **rate-limited** and
  needs a network connection (it fails gracefully and keeps your previous base).
- **Tile attribution** for OpenStreetMap and OpenTopoMap is shown on the map and
  must be kept if you deploy this.
- Set your production URL in `astro.config.mjs` (`site:`) before building if you need
  absolute URLs.

Trail figures are drawn from public sources (val-gardena.com, Outdooractive,
AllTrails and others). Always check current conditions, signage and via-ferrata
requirements locally before heading out.
