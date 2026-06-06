# hike-trip

Hiking-trail finder for Dolomites day trips (base: Ortisei / Val Gardena).
Astro static shell + one Leaflet island, deployed as a single Cloudflare Worker
(static assets + `/api/*` from D1/SQLite).

## Commands

```bash
npm run dev              # Astro dev only — API absent, client falls back to bundled data
npm run preview:cf       # build + wrangler dev → full stack with LOCAL D1 (:8787)
npm run deploy           # build + wrangler deploy (needs database_id in wrangler.toml)
npm run db:seed:gen      # regenerate db/seed.sql from src/data/trails.js
npm run db:apply         # schema + seed → LOCAL D1
npm run db:apply:remote  # schema + seed → PRODUCTION D1 (destructive: drops + reseeds)
```

## Architecture / data flow

- `src/data/trails.js` is the **single source of truth**: it seeds D1 (via
  `db/generate-seed.mjs` → `db/seed.sql`) *and* ships in the client bundle as the
  offline/API-missing fallback. After editing it: `npm run db:seed:gen && npm run db:apply`.
- `worker/index.js` answers `GET /api/trails?origin=<slug>` from D1 (tables:
  `origins` 1──< `trails`) and serves `./dist` for everything else. Response rows are
  mapped back to the exact `trails.js` object shape — keep the two in sync.
- `db/seed.sql` is generated — never edit by hand.
- Basemap: standard OSM tiles (user preference: default OSM look, tiles washed ~20%
  via `.leaflet-tile-pane{filter:saturate(.8)}`); Terrain toggle = OpenTopoMap.
- `ortisei-trails-preview.html` is a standalone single-file mirror of the app —
  apply map/UI changes there too, or delete it once obsolete.

## Trail data conventions

- `difficulty`: easy | medium | hard *relative to this app's mix* — short cabled
  via-ferrata sections or ≥800 m ascent ⇒ at least `medium`; full via ferrata
  (helmet/harness) ⇒ `hard`.
- `peakM` = highest point actually reached on the route, NOT the massif summit.
- `path` polylines are schematic (anchored at real trailhead/hut/summit coords,
  but not switchback-accurate). Don't navigate by them; see README for GPX import.
- All trails currently hang under the single `ortisei` origin (origin_id 1),
  including far-east day trips (Giau/Falzarego/Tre Cime ~25–70 km away) — distances
  shown are straight-line from the chosen base, that's expected.

## Known issues

- The ORIGINAL 9 Val Gardena entries (from the first dataset) have suspect
  coordinates in the Odle/Seceda area: `seceda-ridge` sits at lng ~11.65 but the
  real Seceda station is [46.598, 11.724] (OSM node 296550944). Likely also
  affected: `panascharte`, `resciesa-seceda-traverse`, `sass-rigais`, Munkel path
  waypoints. The 11 trails added later (2026-06) are OSM-verified. Fix = re-verify
  each against OSM and update `trails.js`, then reseed.

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
