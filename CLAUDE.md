# hike-trip

Hiking-trail finder with multiple "origins" (base regions): Ortisei / Val
Gardena (Dolomites) and Kranjska Gora (Julian Alps · Triglav NP).
Astro static shell + one Leaflet island, deployed as a single Cloudflare Worker
(static assets + `/api/*` from D1/SQLite).

## Commands

```bash
npm run dev              # Astro dev only — API absent, client falls back to bundled data
npm run preview:cf       # build + wrangler dev → full stack with LOCAL D1 (:8787)
npm run deploy           # build + wrangler deploy (needs database_id in wrangler.toml)
npm run bake:geo         # detailed OSM-routed paths + public/gpx/*.gpx via BRouter (see below)
npm run db:seed:gen      # regenerate db/seed.sql from src/data/trails.js
npm run db:apply         # schema + seed → LOCAL D1
npm run db:apply:remote  # schema + seed → PRODUCTION D1 (destructive: drops + reseeds)
```

## Architecture / data flow

- `src/data/trails.js` is the **single source of truth**: it defines the
  `origins` registry (slug, title, region, home coords, per-origin "From" bases,
  Nominatim search bias) and merges per-origin trail files
  (`trails-ortisei.js`, `trails-kranjska-gora.js`), tagging each entry with
  `origin`. It seeds D1 (via `db/generate-seed.mjs` → `db/seed.sql`) *and* ships
  in the client bundle as the offline/API-missing fallback. After editing:
  `npm run db:seed:gen && npm run db:apply`.
- `worker/index.js` answers `GET /api/trails?origin=<slug>` from D1 (tables:
  `origins` 1──< `trails`) and serves `./dist` for everything else. Response rows are
  mapped back to the exact `trails.js` object shape — keep the two in sync.
- The client region switcher (`#origin` select in `index.astro`) calls
  `loadOrigin(slug)`: bundled data renders instantly, then the D1 response
  replaces it. SSR/no-JS shows `origins[0]` (Ortisei) only.
- `db/seed.sql` is generated — never edit by hand.
- **Baked geometry / GPX** (`npm run bake:geo`, `db/bake-geometry.mjs`): routes each
  trail's schematic anchor points through BRouter (`hiking-mountain` profile, OSM
  path graph, public brouter.de — throttled, responses cached in `db/geo-cache/`),
  then writes a ~7 m-simplified polyline into the **generated**
  `src/data/paths-baked.js` and a full-resolution GPX (with elevation, ODbL
  attribution) into `public/gpx/<id>.gpx`. `trails.js` merges baked paths over
  schematic ones and sets `gpx: '/gpx/<id>.gpx'` — which is what makes the
  light-blue GPX button render on a card. A length sanity-gate (vs `lengthKm`,
  half-length allowed for 'Out & back') rejects bad routings: those trails keep
  the schematic path and get no GPX. Currently rejected: `sassolungo-circuit`,
  `prisojnik-okno` (router picked wrong variants), `triglav-krma` (BRouter
  watchdog timeout) — fix by adding more intermediate anchor points to the
  schematic `path` and re-running `npm run bake:geo <id>`. After any bake:
  `npm run db:seed:gen && npm run db:apply`.
- Basemap: standard OSM tiles (user preference: default OSM look, tiles washed ~20%
  via `.leaflet-tile-pane{filter:saturate(.8)}`); Terrain toggle = OpenTopoMap.
- PWA: `public/manifest.webmanifest` + `public/icons/` + `public/sw.js`
  (registered in `Base.astro` — PROD builds only; `astro dev` unregisters any
  leftover SW, since cache-first on un-hashed dev URLs serves stale assets). SW is hand-rolled: navigations and `/api/trails`
  network-first with cache fallback; `/_astro/` and fonts cache-first; map tiles
  cache-first capped at 400. Bump `VERSION` in sw.js only on strategy changes.

## Trail data conventions

- `difficulty`: easy | medium | hard *relative to this app's mix* — short cabled
  via-ferrata sections or ≥800 m ascent ⇒ at least `medium`; full via ferrata
  (helmet/harness) ⇒ `hard`.
- `peakM` = highest point actually reached on the route, NOT the massif summit.
- `path` polylines in `trails-*.js` are schematic (anchored at real
  trailhead/hut/summit coords) and double as the **via-points for the geometry
  bake** — at render time most trails use the OSM-routed detailed line from
  `paths-baked.js` instead. Suspect anchor coords ⇒ suspect baked route.
- Trails belong to one of two origins: `ortisei` (incl. far-east day trips
  Giau/Falzarego/Tre Cime ~25–70 km away) and `kranjska_gora` (incl. Triglav via
  Krma ~20 km away) — distances shown are straight-line from the chosen base,
  that's expected.
- Kranjska Gora set (2026-06) is OSM-verified, ≥2 sources per figure (sources:
  hribi.net, outdooractive, komoot, summitpost, tnp.si). **Martuljek Waterfalls
  deliberately excluded** — gorge landslide damage, upper-falls route officially
  closed, lower falls has cabled sections; re-evaluate if reopened.
  kranjska-gora.si blocks scrapers (403) — cross-check its figures indirectly.

## Known issues

- ~~The ORIGINAL 9 Val Gardena entries had suspect coordinates in the
  Odle/Seceda area.~~ **Fixed 2026-06**: all 9 (`seceda-ridge`, `panascharte`,
  `adolf-munkel`, `raschoetz-promenade`, `col-raiser-firenze`, `alpe-di-siusi`,
  `sassolungo-circuit`, `sass-rigais`, `resciesa-seceda-traverse`) had their
  start/peak/path anchors re-derived from OSM (Nominatim) — every Odle-ridge
  feature was ~0.07° (≈5–6 km) too far west, dropping markers into the wrong
  terrain (e.g. `sass-rigais` peak was 11.6917 vs the real 11.7668; Alpe di Siusi
  ~4 km off too). `peakM` elevations were always correct; only lat/lng was wrong.
  Re-verified against PeakVisor/SummitPost/outdooractive. Reseeded + re-baked.
  Two keep a (now-correct) schematic path with **no GPX** because BRouter's
  length gate rejects them: `sassolungo-circuit` (the Langkofelscharte scramble
  isn't in the hiking graph) and `alpe-di-siusi` (sparse Seiser Alm cart tracks
  force a ~12 km loop vs the 6 km trail).

## Go-to sources for hike research (Dolomites / Alps / Europe)

Verified workflow from building this dataset — always cross-check **≥2 independent
sources** per figure; when sources disagree, OSM wins for coordinates and official
tourism sites win for access/closures.

| Need | Best source | Notes |
|---|---|---|
| Coordinates + elevations of peaks, huts, passes, lifts | **OpenStreetMap** (node data / Nominatim) | Most reliable; caught a 6 km coord error here. Nominatim is rate-limited. |
| Peak elevation cross-check | **PeakVisor**, **Wikipedia** (en/it/de) | Usually agree with OSM within metres; prefer the cluster of 2–3 agreeing values. |
| Route stats (length / ascent / time) | **outdooractive**, **komoot**, **bergfex** | Komoot lengths are GPS-measured (trustworthy); watch for loop-vs-out-and-back variants being conflated. bergfex strongest in German-speaking Alps. |
| Popularity-grade stats, reviews | **AllTrails** | Good sanity check; difficulty ratings and lengths vary by mapped variant — never use as sole source. |
| Trail numbers, lift hours, access rules, closures | **Official tourism sites**: val-gardena.com, suedtirolerland.it, pustertal.org, prags.bz, cortina.dolomiti.org | Authoritative for CAI trail numbers and regulations (e.g. Braies 9–16h summer road closure, Tre Cime toll road). |
| Serious scrambles / via normale / via ferrata detail | **SummitPost**, **vienormali.it**, **abcdolomiti.com** | Italian sites use CAI grades (T/E/EE/EEA) — EEA ⇒ at least `medium` here. |
| Trip-report practicalities (parking, crowds, season) | Blogs: moonhoneytravel, earthtrekkers, fullsuitcase, dolomitireview, hiwio, northabroad | Great for "what it's actually like"; verify all numbers elsewhere. |
| Real route geometry (GPX) | OSM, outdooractive, AllTrails exports; geojson.io to hand-draw | GeoJSON is [lng,lat] — swap to [lat,lng] for Leaflet. |
