// Regenerate src/data/trails-explore.js from the research CSVs.
// Run after editing data/explore/*.csv or data/photos.csv:
//   npm run explore:gen && npm run db:seed:gen && npm run db:apply
//
// data/explore/<group>.csv — one curated "Explore the Alps" trail per row.
//   in_app=no   -> a NEW trail, added to the origin GROUP_ORIGIN[group]
//   in_app=yes  -> the trail already lives in trails-<origin>.js (its verified
//                  figures win); only the explore metadata (photo, buzz, access
//                  note, group) is overlaid onto it
// data/photos.csv — photos for the app's own trails that aren't in the explore set.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { trails as ortisei } from '../src/data/trails-ortisei.js';
import { trails as kranjskaGora } from '../src/data/trails-kranjska-gora.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// explore CSV -> origin slug in src/data/trails.js (the Dolomites set joins Val Gardena's)
const GROUP_ORIGIN = { dolomites: 'ortisei', austria: 'austria', switzerland: 'switzerland', germany: 'germany' };

// RFC 4180-ish: quoted fields, "" escapes, commas/newlines inside quotes
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') row.push(cell), (cell = '');
    else if (ch === '\n') row.push(cell), rows.push(row), (row = []), (cell = '');
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  const [head, ...body] = rows;
  // a blank line (e.g. an extra newline at EOF) is not a trail
  return body.filter((r) => r.some((c) => c.trim() !== '')).map((r) => Object.fromEntries(head.map((k, i) => [k, r[i] ?? ''])));
}
const read = (rel) => parseCSV(readFileSync(join(root, rel), 'utf8'));

// blank = unknown -> the key is left out, never guessed
const num = (v) => (v === '' ? undefined : Number(v));
const str = (v) => (v === '' ? undefined : v);
const photoOf = (r) =>
  r.photo ? { src: r.photo, credit: r.photo_credit, license: r.photo_license, source: r.photo_source } : undefined;
const prune = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

const appIds = new Set([...ortisei, ...kranjskaGora].map((t) => t.id));
const added = [];
const overlays = {};
const problems = [];

for (const group of Object.keys(GROUP_ORIGIN)) {
  for (const r of read(`data/explore/${group}.csv`)) {
    const meta = {
      exploreGroup: group,
      regionName: r.region,
      country: r.country,
      buzz: str(r.buzz),
      why: str(r.trending_reason),
      accessNote: str(r.access_note),
      photo: photoOf(r),
    };
    if (r.in_app === 'yes') {
      if (!appIds.has(r.slug)) problems.push(`${group}/${r.slug}: in_app=yes but no such trail in trails-*.js`);
      overlays[r.slug] = prune(meta);
      continue;
    }
    if (appIds.has(r.slug)) problems.push(`${group}/${r.slug}: in_app=no but the id is already an app trail`);
    added.push(
      prune({
        id: r.slug,
        origin: GROUP_ORIGIN[group],
        name: r.name,
        area: r.area,
        difficulty: r.difficulty,
        mustVisit: r.must_visit === '1',
        type: r.type,
        season: r.season,
        days: str(r.days),
        lengthKm: num(r.length_km),
        ascentM: num(r.ascent_m),
        descentM: num(r.descent_m),
        durationH: num(r.duration_h),
        peakM: num(r.peak_m),
        peakName: str(r.peak_name),
        massif: r.region,
        access: r.access,
        start: [num(r.start_lat), num(r.start_lng)],
        // the explore pin (the iconic spot) is where the map marker sits
        peak: [num(r.pin_lat), num(r.pin_lng)],
        path: [], // no route geometry yet — drawn as a pin only
        blurb: r.blurb, // short teaser (explore postcards, card preview)
        description: str(r.description), // the full paragraph (card "More details")
        ...meta,
      })
    );
    // fail here, not later at `db:apply` (schema CHECK / NOT NULL) or as NaN on the map
    const t = added.at(-1);
    if (!['easy', 'medium', 'hard'].includes(t.difficulty))
      problems.push(`${group}/${r.slug}: difficulty '${t.difficulty}' is not easy|medium|hard`);
    if (![...t.start, ...t.peak].every(Number.isFinite))
      problems.push(`${group}/${r.slug}: start_* / pin_* coordinates must all be numbers`);
    for (const k of ['lengthKm', 'ascentM', 'descentM', 'durationH', 'peakM'])
      if (k in t && !Number.isFinite(t[k])) problems.push(`${group}/${r.slug}: ${k} is not a number`);
  }
}

for (const r of read('data/photos.csv')) {
  if (!appIds.has(r.slug)) problems.push(`photos.csv/${r.slug}: no such app trail`);
  else if (overlays[r.slug]) problems.push(`photos.csv/${r.slug}: already has an explore photo`);
  else overlays[r.slug] = { photo: photoOf(r) };
}

const ids = added.map((t) => t.id);
if (new Set(ids).size !== ids.length) problems.push('duplicate ids among new trails');
if (problems.length) {
  console.error('explore data problems:\n  ' + problems.join('\n  '));
  process.exit(1);
}

const out = join(root, 'src/data/trails-explore.js');
writeFileSync(
  out,
  `// AUTO-GENERATED by db/generate-explore.mjs from data/explore/*.csv + data/photos.csv
// — edit the CSVs and re-run (npm run explore:gen). Never edit by hand.

// New trails, tagged with their origin (see GROUP_ORIGIN in the generator).
export const exploreTrails = ${JSON.stringify(added, null, 1)};

// Extra fields merged onto the app's own trails, by id.
export const overlays = ${JSON.stringify(overlays, null, 1)};
`
);
const byOrigin = added.reduce((m, t) => ((m[t.origin] = (m[t.origin] ?? 0) + 1), m), {});
console.log(
  `Wrote ${out} — ${added.length} new trails (${Object.entries(byOrigin)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')}), ${Object.keys(overlays).length} overlays.`
);
