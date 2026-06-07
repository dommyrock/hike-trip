# Alpine Trails — Val Gardena & Julian Alps

**Live:** <https://hike-trip.dominik-polzer.workers.dev>

A clean, fast hiking-trail finder with two base regions: **Ortisei / Val Gardena**
(Dolomites) and **Kranjska Gora** (Julian Alps · Triglav National Park) — switch
between them with the region selector above the trail list.
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
│  ├─ favicon.svg
│  └─ gpx/                   # generated — downloadable per-trail GPX tracks
├─ src/
│  ├─ components/
│  │  └─ TrailCard.astro     # one trail card (server-rendered first paint)
│  ├─ data/
│  │  ├─ trails.js           # ← the trail dataset (build-time snapshot + seed source)
│  │  └─ paths-baked.js      # generated — detailed OSM-routed polylines + waypoints
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
│  ├─ bake-geometry.mjs      # BRouter bake: paths-baked.js + public/gpx/*.gpx
│  ├─ geo-cache/             # cached BRouter responses (re-runs are offline)
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

> **Installing on Android (Chrome):** there is NO automatic install popup —
> Chrome dropped it. Open the site, then **⋮ menu → "Add to Home screen" →
> choose "Install"** (newer Chrome: "Install app" directly in the menu). That
> installs a real WebAPK: app drawer entry, fullscreen, no browser chrome. If
> you only see "Create shortcut", reload once (SW must finish activating on
> first visit) and try again.

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
npm run bake:geo         # OSM-routed paths + public/gpx/*.gpx (see below)
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

## Route geometry & GPX (baked from OSM)

The `path` arrays in `trails-*.js` are **schematic anchor points** (trailhead,
huts, passes, summit — accurate coords). `npm run bake:geo` routes those anchors
through **[BRouter](https://brouter.de)** (`hiking-mountain` profile over the
OpenStreetMap path graph) and generates:

- `src/data/paths-baked.js` — detailed, simplified polylines the map actually
  draws (the dashed route line + numbered waypoint dots), and
- `public/gpx/<id>.gpx` — full-resolution downloadable tracks with elevation and
  named trailhead/summit waypoints (ODbL attribution included).

A length sanity-gate compares each routed line against the researched `lengthKm`
and rejects bad routings — those trails keep their schematic line and get no GPX
button. Fix = add a few more intermediate anchors to `path`, then
`npm run bake:geo <id>` and `npm run db:seed:gen && npm run db:apply`.
BRouter responses are cached in `db/geo-cache/`, so re-runs are instant.

### Offline navigation on your phone (GPX)

Every baked trail card shows a light-blue **GPX** button — one tap downloads the
route, no account or login. Two free apps turn it into real-time offline tracking:

| | [Organic Maps](https://play.google.com/store/apps/details?id=app.organicmaps) | [OsmAnd](https://play.google.com/store/apps/details?id=net.osmand) |
|---|---|---|
| Best for | Simple "am I on the path?" — fast, minimal | Follow-track navigation + **off-route warnings** |
| Free tier | Everything | 7 map regions (plenty); contours are paid on Play Store (free via F-Droid "OsmAnd~") |

**Setup (once, on WiFi):**

1. Install the app and download the offline map regions:
   *Italy → Trentino-Alto Adige* and *Slovenia*.
2. On the site, tap **GPX** on a trail card, then open the downloaded file with
   the app (Organic Maps: stored under *Bookmarks & Tracks*; OsmAnd: *My Places →
   Tracks*). The track is copied into the app — once per trail and you're set.
3. On the trail: your live GPS position shows against the route — **airplane mode
   is fine**, GPS needs no signal or SIM. In OsmAnd you can additionally
   long-press the track → *Navigation* for voice prompts and drift-off alerts.

Tips: install both for redundancy; out-and-back tracks trace one direction —
return the same way; the screen drains the battery, not the GPS.

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
