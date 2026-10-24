# Alpine Trails — hiking finder across the Alps

**Live:** <https://hike-trip.dominik-polzer.workers.dev>

<img width="2382" height="1640" alt="image" src="https://github.com/user-attachments/assets/63044bd2-2641-4619-ab25-b76960f3b1fc" />

A clean, fast hiking-trail finder across five regions — the **Dolomites** (base
Ortisei / Val Gardena), the **Julian Alps** (Kranjska Gora · Triglav National
Park), **Austria**, **Switzerland** and **Germany** — all on one map. Region chips
filter the map and the cards together. Trails are dots colour-coded by difficulty
(🟢 easy · 🟡 medium · 🔴 hard, a magenta ring for must-visits), and every trail gets
a photo card with distance from your base, high point, length, ascent and time,
plus a "More details" panel with the full description and facts.

Two pages, two tabs in the header:

- **Trail finder** (`/`) — the map, the filter bar and the trail cards.
- **Explore the Alps** (`/explore/`) — the curated, most talked-about trails as
  postcards grouped by region; each opens on the finder map (`/?trail=<id>`).

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

- The page itself is **static HTML** — the header, controls and the first page of
  trail cards are server-rendered for fast first paint and so it works without JS.
- On load, a single bundled `<script>` boots Leaflet, draws every trail (a coloured
  polyline where there is route geometry + a dot at the high point), and **takes
  over** the cards so that searching, filtering, sorting and changing your base
  update the map and the list together. Filtered-out trails stay on the map as
  dimmed dots; the cards page in 24 at a time ("Show more").
- Zoomed out, the dots of the trails that pass the filters merge into **count
  bubbles** ([Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster);
  the ring shows the easy / medium / hard mix). Click one to zoom in; from zoom 10
  every dot stands alone. Route lines and the dimmed filtered-out dots never cluster.
- Filter bar: row 1 = region chips · difficulty · search; row 2 = From base ·
  Within slider (5 / 10 / 25 / 50 / 100 / 250 km / Any) · trip length · must visit ·
  in season · saved · sort. Picking a region flies the map there and measures
  distances from its home town.
- **The filters live in the URL**, so a filtered view can be reloaded, bookmarked
  and shared, and Back undoes a chip click: `region=<slug>`, `diff=easy,hard`,
  `trip=day|multi`, `within=<km>`, `must=1`, `season=1`, `saved=1`, `q=<text>`,
  `sort=<key>` (defaults are left out, so a clean page has a clean URL).
  `/?trail=<id>` opens one trail's popup — that's the link the Share button hands
  out.
- **In season**: each card says whether the trail's season (e.g. "Jun – Oct",
  "Year-round") includes the visitor's current month; "In season" in row 2 filters
  to those.
- **Share + save**: every card, map popup and phone trail sheet has a Share button
  (the phone's share sheet, else it copies the link) and a Save bookmark. Saved
  trails are kept in this browser only (`localStorage` key `hike-trip:saved`) and
  the "Saved" chip filters to them.
- **Phones** get their own components: below 640px the difficulty group and row 2
  move into a **filter bottom sheet** (`BottomSheet.astro` + `src/lib/mobile.js` —
  the same elements, moved, not copied), tapping a dot opens the trail in a
  **trail sheet** instead of a map popup, and the Explore regions become
  swipeable carousels.
- The basemap is **standard OpenStreetMap** (the default OSM style, untouched);
  a **Terrain** toggle switches to **OpenTopoMap** for contour/hiking detail.
  No API keys needed.

### Project structure

```
hike-trip/
├─ data/
│  ├─ explore/<region>.csv   # ← research data for the Explore set (README inside)
│  └─ photos.csv             # photo credits for the app's own trails
├─ public/
│  ├─ favicon.svg
│  ├─ og.jpg                 # 1200×630 link-preview image (see Notes & caveats)
│  ├─ photos/<id>.webp       # one 720×480 Wikimedia Commons photo per trail
│  └─ gpx/                   # generated — downloadable per-trail GPX tracks
├─ src/
│  ├─ components/
│  │  ├─ SiteHeader.astro    # header + the two tabs (both pages)
│  │  ├─ FilterBar.astro     # trail-finder filter bar (two rows)
│  │  ├─ BottomSheet.astro   # phone bottom sheet (filters, trail details)
│  │  ├─ TrailCard.astro     # one trail card (server-rendered first paint)
│  │  └─ Postcard.astro      # one Explore postcard
│  ├─ data/
│  │  ├─ trails.js           # ← origins registry + all trails merged (seed source)
│  │  ├─ trails-<origin>.js  # hand-curated trails per origin
│  │  ├─ trails-explore.js   # generated from data/explore/*.csv + data/photos.csv
│  │  └─ paths-baked.js      # generated — detailed OSM-routed polylines + waypoints
│  ├─ layouts/
│  │  └─ Base.astro          # <head>, fonts, global CSS
│  ├─ lib/
│  │  ├─ card.js             # card, map tooltip and popup markup (SSR + client)
│  │  ├─ mobile.js           # phone sheet controller + control relocation
│  │  └─ geo.js              # haversine distance, formatting helpers
│  ├─ pages/
│  │  ├─ index.astro         # trail finder + the Leaflet client island
│  │  └─ explore.astro       # Explore the Alps
│  └─ styles/
│     ├─ global.css          # the whole glass / light-grey design system
│     └─ explore.css         # Explore postcards
├─ db/
│  ├─ schema.sql             # D1 (SQLite): origins ──< trails
│  ├─ generate-explore.mjs   # data/explore/*.csv -> src/data/trails-explore.js
│  ├─ generate-seed.mjs      # trails.js -> seed.sql
│  ├─ bake-geometry.mjs      # BRouter bake: paths-baked.js + public/gpx/*.gpx
│  ├─ geo-cache/             # cached BRouter responses (re-runs are offline)
│  └─ seed.sql               # generated — don't edit by hand
├─ worker/
│  └─ index.js               # /api/trails from D1, static assets for the rest
├─ wrangler.toml.template    # copy -> wrangler.toml (git-ignored), add your D1 id
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

- **`origins`** (1) ──< (n) **`trails`**: one row per region (`ortisei`,
  `kranjska_gora`, `austria`, `switzerland`, `germany`), trails reference it by
  `origin_id`. Add a new area = 1 origin row + its trails.
- The client island calls `/api/trails?origin=all` (every region at once;
  `?origin=<slug>` still returns one); if the API is missing (plain `astro dev`,
  offline) it falls back to the build-time snapshot in `src/data/trails.js`, so
  the site never breaks.
- The seed is one `INSERT` per trail — a single multi-row statement outgrew D1's
  statement size limit (`SQLITE_TOOBIG`) once the Explore set was in.
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
  (cache-first, immutable), up to ~400 map tiles you've already viewed, and up to
  200 trail photos (cache-first — a changed photo gets a new file name).
- Offline you get: the full trail list, cards and stats, plus whatever map areas
  you browsed while online. Fresh tiles need a connection.
- To regenerate icons after editing `public/icons/icon.svg` (macOS):
  `qlmanage -t -s 512 -o public/icons public/icons/icon.svg`, rename the
  produced `icon.svg.png` to `icon-512.png`, then
  `sips -z 192 192 icon-512.png --out icon-192.png` and
  `sips -z 180 180 icon-512.png --out apple-touch-icon.png`.
- Bump `VERSION` in `sw.js` only when changing caching strategy — normal site
  updates flow through automatically (HTML is network-first). Pages are cached by
  path, not by query string, so filter URLs don't pile up copies of the same page.

### Setup (one-time)

```bash
cp wrangler.toml.template wrangler.toml   # wrangler.toml is git-ignored
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
npm run explore:gen      # regenerate trails-explore.js after editing data/*.csv
npm run db:seed:gen      # regenerate db/seed.sql after editing trails.js
```

> **Deploying a schema change** (new `trails` columns, as in the Explore release):
> run `npm run db:apply:remote` *before* `npm run deploy`. Until the remote D1 has
> the new columns, the new Worker's `/api/trails` errors and the client quietly
> keeps the bundled data — the site still works, but D1 edits won't show.

To edit data in production directly (no redeploy needed):

```bash
npx wrangler d1 execute hike_trip --remote \
  --command "UPDATE trails SET length_km = 10.2 WHERE slug = 'adolf-munkel'"
```

---

## Add a trail

**To the Explore set** (and so to the finder): add a row to the region's
`data/explore/<region>.csv` (columns and conventions in `data/explore/README.md`)
and a 720×480 photo at `public/photos/<id>.webp`, then
`npm run explore:gen && npm run db:seed:gen && npm run db:apply`.

**To an origin's hand-curated set**: append an object to the `trails` array in
**`src/data/trails-<origin>.js`** (and its photo credit to `data/photos.csv`):

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
- **Link previews**: `astro.config.mjs` sets `site:` to the production URL, and
  `Base.astro` builds the absolute Open Graph / X card tags from it (`og:url`,
  `og:image`). Change `site` if the site moves. `public/og.jpg` is a 1200×630 crop of
  [File:Lagazuoi1.JPG](https://commons.wikimedia.org/wiki/File:Lagazuoi1.JPG) by
  Clemens Stockner (Wikimedia Commons, public domain). Previews are site-wide for
  now; per-trail previews would need per-trail pages.

Trail figures are drawn from public sources (val-gardena.com, Outdooractive,
AllTrails and others). Always check current conditions, signage and via-ferrata
requirements locally before heading out.
