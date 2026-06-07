// ----------------------------------------------------------------------------
//  bake-geometry — detailed route geometry + self-hosted GPX, one-time bake
// ----------------------------------------------------------------------------
//  For each trail, routes through its schematic anchor points (the hand-placed
//  `path` in trails-<origin>.js) with BRouter's hiking-mountain profile, which
//  snaps to the real OSM path graph (sac_scale-aware — follows actual
//  switchbacks). Then:
//    - simplifies (~7 m Douglas-Peucker)  -> src/data/paths-baked.js  (map line)
//    - writes the full-resolution track   -> public/gpx/<id>.gpx      (download)
//  trails.js merges paths-baked.js over the schematic paths and sets the
//  per-trail `gpx` link, so seed-gen / D1 / the client pick everything up
//  automatically. After baking:  npm run db:seed:gen && npm run db:apply
//
//  Raw BRouter responses are cached in db/geo-cache/<id>.json — delete a file
//  (or the dir) to re-fetch. Live calls are throttled to be polite to the
//  public brouter.de instance (fair use, no API key).
//
//  Sanity gate: the routed length is compared against the trusted lengthKm
//  (for 'Out & back' also against lengthKm/2 — the anchors usually trace one
//  direction only). deviation <= 35% accepts, 35–60% accepts with a WARN,
//  > 60% (or routing failure) rejects -> trail keeps its schematic path and
//  gets no GPX; fix the anchors and re-run.
//
//  Run: node db/bake-geometry.mjs [trail-id ...]    (no args = all trails)
// ----------------------------------------------------------------------------
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { trails as ortisei } from '../src/data/trails-ortisei.js';
import { trails as kranjskaGora } from '../src/data/trails-kranjska-gora.js';

const here = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(here, 'geo-cache');
const GPX_DIR = join(here, '..', 'public', 'gpx');
const BAKED_OUT = join(here, '..', 'src', 'data', 'paths-baked.js');
const BROUTER = 'https://brouter.de/brouter';
const PROFILE = 'hiking-mountain';
const TOLERANCE_DEG = 0.00007; // ~7 m — keeps switchbacks, drops collinear runs
const THROTTLE_MS = 1100;

const all = [...ortisei, ...kranjskaGora];
const only = process.argv.slice(2);
const todo = only.length ? all.filter((t) => only.includes(t.id)) : all;
if (only.length && todo.length !== only.length) {
  const known = new Set(all.map((t) => t.id));
  throw new Error(`unknown trail id(s): ${only.filter((id) => !known.has(id)).join(', ')}`);
}

mkdirSync(CACHE_DIR, { recursive: true });
mkdirSync(GPX_DIR, { recursive: true });

// ---------------------------------------------------------------- helpers --
const R = 6371;
function haversineKm([lat1, lng1], [lat2, lng2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const lineKm = (pts) =>
  pts.reduce((s, p, i) => (i ? s + haversineKm(pts[i - 1], p) : 0), 0);

// Douglas-Peucker on [lat,lng] — lng scaled by cos(lat) so tolerance is
// isotropic in ground metres at alpine latitudes.
function simplify(pts, tol) {
  if (pts.length <= 2) return pts;
  const cos = Math.cos((pts[0][0] * Math.PI) / 180);
  const xy = pts.map(([lat, lng]) => [lat, lng * cos]);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ay, ax] = xy[a];
    const [by, bx] = xy[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-12;
    let maxD = 0;
    let maxI = -1;
    for (let i = a + 1; i < b; i++) {
      const [py, px] = xy[i];
      // perpendicular distance to segment a-b (clamped to endpoints)
      const u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const d = Math.hypot(px - (ax + u * dx), py - (ay + u * dy));
      if (d > maxD) {
        maxD = d;
        maxI = i;
      }
    }
    if (maxD > tol) {
      keep[maxI] = 1;
      stack.push([a, maxI], [maxI, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function gpxXML(t, coords) {
  // coords: [[lon,lat,ele?],...] straight from BRouter GeoJSON
  const pts = coords
    .map(([lon, lat, ele]) => {
      const e = ele != null ? `<ele>${Math.round(ele)}</ele>` : '';
      return `      <trkpt lat="${lat}" lon="${lon}">${e}</trkpt>`;
    })
    .join('\n');
  const lats = coords.map((c) => c[1]);
  const lons = coords.map((c) => c[0]);
  const outBack = t.type === 'Out & back' ? ' Track traces one direction — return the same way.' : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="hike-trip" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${esc(t.name)}</name>
    <desc>Routed with BRouter (${PROFILE}) over OpenStreetMap data through hand-verified anchor points. Schematic in places — verify against signage on the ground.${outBack}</desc>
    <copyright author="OpenStreetMap contributors"><license>https://www.openstreetmap.org/copyright</license></copyright>
    <bounds minlat="${Math.min(...lats)}" minlon="${Math.min(...lons)}" maxlat="${Math.max(...lats)}" maxlon="${Math.max(...lons)}"/>
  </metadata>
  <wpt lat="${t.start[0]}" lon="${t.start[1]}"><name>Trailhead — ${esc(t.name)}</name><sym>Trail Head</sym></wpt>
  <wpt lat="${t.peak[0]}" lon="${t.peak[1]}"><ele>${t.peakM}</ele><name>${esc(t.peakName || 'High point')}</name><sym>Summit</sym></wpt>
  <trk>
    <name>${esc(t.name)}${t.trail ? ` (${esc(t.trail)})` : ''}</name>
    <type>hiking</type>
    <trkseg>
${pts}
    </trkseg>
  </trk>
</gpx>
`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRoute(t) {
  const cacheFile = join(CACHE_DIR, `${t.id}.json`);
  if (existsSync(cacheFile)) {
    return { geo: JSON.parse(readFileSync(cacheFile, 'utf8')), cached: true };
  }
  const anchors = t.path && t.path.length >= 2 ? t.path : [t.start, t.peak];
  const lonlats = anchors.map(([lat, lng]) => `${lng},${lat}`).join('|');
  const url = `${BROUTER}?lonlats=${lonlats}&profile=${PROFILE}&alternativeidx=0&format=geojson`;
  const r = await fetch(url, { headers: { 'User-Agent': 'hike-trip-bake/1.0 (one-time geometry bake)' } });
  const body = await r.text();
  if (!r.ok || !body.startsWith('{')) {
    throw new Error(`BRouter ${r.status}: ${body.slice(0, 120)}`);
  }
  const geo = JSON.parse(body);
  writeFileSync(cacheFile, JSON.stringify(geo));
  await sleep(THROTTLE_MS);
  return { geo, cached: false };
}

// ------------------------------------------------------------------- bake --
const baked = {};
const report = [];

for (const t of todo) {
  let row = { id: t.id, src: '-', routed: null, expected: t.lengthKm, dev: null, pts: '-', verdict: '' };
  try {
    const { geo, cached } = await fetchRoute(t);
    row.src = cached ? 'cache' : 'live';
    const coords = geo.features?.[0]?.geometry?.coordinates;
    if (!coords?.length) throw new Error('no coordinates in response');

    const latlng = coords.map(([lon, lat]) => [lat, lon]);
    const routedKm = lineKm(latlng);
    row.routed = routedKm;

    // anchors usually trace one direction of an out-and-back; accept whichever
    // of full / half length the routed line matches best
    const targets = t.type === 'Out & back' ? [t.lengthKm / 2, t.lengthKm] : [t.lengthKm];
    const dev = Math.min(...targets.map((x) => Math.abs(routedKm - x) / x));
    row.dev = dev;

    if (dev > 0.6) {
      row.verdict = 'REJECT (length mismatch) — schematic kept';
    } else {
      const slim = simplify(latlng, TOLERANCE_DEG).map(([lat, lng]) => [
        +lat.toFixed(5),
        +lng.toFixed(5),
      ]);
      // anchors double as the client's numbered waypoint dots. Each is snapped
      // onto the routed line and enriched to [lat, lng, ele, kmFromStart] so
      // the web tooltip can show real info (komoot-style numbering by order).
      const cum = [0];
      for (let i = 1; i < latlng.length; i++)
        cum.push(cum[i - 1] + haversineKm(latlng[i - 1], latlng[i]));
      const anchorsRaw = t.path && t.path.length >= 2 ? t.path : [t.start, t.peak];
      const anchors = anchorsRaw.map((a) => {
        let bi = 0;
        let bd = Infinity;
        latlng.forEach((p, i) => {
          const d = haversineKm(p, a);
          if (d < bd) {
            bd = d;
            bi = i;
          }
        });
        const ele = coords[bi][2];
        return [
          +latlng[bi][0].toFixed(5),
          +latlng[bi][1].toFixed(5),
          ele != null ? Math.round(ele) : null,
          +cum[bi].toFixed(1),
        ];
      });
      baked[t.id] = { path: slim, anchors };
      writeFileSync(join(GPX_DIR, `${t.id}.gpx`), gpxXML(t, coords));
      row.pts = `${latlng.length}->${slim.length}`;
      row.verdict = dev > 0.35 ? 'WARN (check variant)' : 'ok';
    }
  } catch (err) {
    row.verdict = `FAIL: ${err.message.split('\n')[0].slice(0, 90)} — schematic kept`;
  }
  report.push(row);
  console.log(
    `${row.verdict.startsWith('ok') ? '✓' : row.verdict.startsWith('WARN') ? '⚠' : '✗'} ${t.id.padEnd(32)} ${row.src.padEnd(6)} ${
      row.routed != null ? row.routed.toFixed(1).padStart(5) + ' km' : '     -  '
    } vs ${String(row.expected).padStart(4)} km  ${row.dev != null ? (row.dev * 100).toFixed(0).padStart(3) + '%' : '  -'}  ${row.pts.padEnd(10)} ${row.verdict}`
  );
}

// When baking a subset, keep previously baked entries for the others.
if (only.length) {
  try {
    const prev = (await import('../src/data/paths-baked.js')).baked;
    for (const [id, v] of Object.entries(prev)) if (!(id in baked) && !only.includes(id)) baked[id] = v;
  } catch {
    /* first run — nothing to merge */
  }
}

const ids = Object.keys(baked).sort();
const body = ids
  .map(
    (id) =>
      `  '${id}': { path: ${JSON.stringify(baked[id].path)}, anchors: ${JSON.stringify(baked[id].anchors ?? [])} },`
  )
  .join('\n');
writeFileSync(
  BAKED_OUT,
  `// AUTO-GENERATED by db/bake-geometry.mjs — do not edit by hand.
// Maps trail id -> detailed OSM-routed polyline (simplified for the map).
// A matching full-resolution GPX lives at public/gpx/<id>.gpx.
// Regenerate: npm run bake:geo   (then npm run db:seed:gen && npm run db:apply)
export const baked = {
${body}
};
`
);

const ok = report.filter((r) => r.verdict.startsWith('ok')).length;
const warn = report.filter((r) => r.verdict.startsWith('WARN')).length;
const bad = report.length - ok - warn;
console.log(
  `\nBaked ${ok + warn}/${report.length} trails (${warn} warnings, ${bad} kept schematic) -> ${BAKED_OUT}\nGPX files in ${GPX_DIR}\nNext: npm run db:seed:gen && npm run db:apply`
);
