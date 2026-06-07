// ----------------------------------------------------------------------------
//  Trail card markup — the SINGLE source of truth.
// ----------------------------------------------------------------------------
//  Used by both the SSR first paint (src/components/TrailCard.astro) and the
//  client re-render (src/pages/index.astro). Before, the two were hand-mirrored
//  template strings and had silently drifted (locale, null fallbacks); keep all
//  card/stat markup here so they can't diverge again.
// ----------------------------------------------------------------------------

import { fmtDurationShort, DIFF_LABEL } from './geo.js';
import { ICON } from './icons.js';

// Difficulty pill — shared by cards and the map tooltip/popup.
export const badgeHTML = (d) => `<span class="badge badge--${d}">${DIFF_LABEL[d]}</span>`;

// One stat cell. The card grid (`stat`) spaces the unit via a CSS margin; the
// map tooltip/popup (`tip-stat`) has no such margin, so it needs a literal
// space before the unit. That's the only difference between the two.
const statCell = (k, v, unit, cls = 'stat') =>
  `<div class="${cls}"><div class="k">${k}</div><div class="v">${v}${
    unit ? `${cls === 'tip-stat' ? ' ' : ''}<small>${unit}</small>` : ''
  }</div></div>`;

// The six stats every card and detail widget shows, in display order. Peak is
// pinned to en-US so the SSR string and the client re-render produce the same
// number (a locale-formatted value would differ between server and visitor).
const trailStats = (t) => [
  { k: 'Peak', v: t.peakM.toLocaleString('en-US'), unit: 'm' },
  { k: 'Length', v: t.lengthKm, unit: 'km' },
  { k: 'Ascent', v: '+' + t.ascentM, unit: 'm' },
  { k: 'Time', v: fmtDurationShort(t.durationH) },
  { k: 'Type', v: t.type ?? '—' },
  { k: 'Season', v: t.season ?? '—' },
];

// The six stats as a row of cells for the given wrapper class (`stat` on cards,
// `tip-stat` in the map tooltip/popup).
export const statsRow = (t, cls = 'stat') =>
  trailStats(t)
    .map((s) => statCell(s.k, s.v, s.unit, cls))
    .join('');

// The full trail card markup.
//   distKm    straight-line distance from the active base
//   baseName  active "From" base (its first word is shown next to the distance)
//   index     grid position — drives only the staggered rise-in animation delay
export function cardHTML(t, { distKm, baseName, index = 0 }) {
  return `<article class="card" data-id="${t.id}" data-d="${t.difficulty}" style="animation-delay:${Math.min(
    index * 45,
    320
  )}ms">
    <div class="head">
      <div class="ico">${ICON.mountain}</div>
      <div><h3>${t.name}</h3><div class="area">${t.area}</div></div>
      ${t.mustVisit ? `<span class="must" title="Must visit">${ICON.heart}</span>` : ''}
      ${badgeHTML(t.difficulty)}
    </div>
    <p class="blurb">${t.blurb}</p>
    <div class="stats">${statsRow(t, 'stat')}</div>
    <div class="tags">
      <span class="tag tag--trail" title="Trail marker — the route number on signposts along the way">${ICON.trail}${t.trail}</span>
      <span class="tag">${ICON.access}${t.access}</span>
    </div>
    <div class="foot">
      <span class="dist">${ICON.pin}${distKm.toFixed(1)} km from ${baseName.split(' ')[0]}</span>
      <span class="acts">${
        t.gpx
          ? `<a class="gpxdl" href="${t.gpx}" download title="Download GPX route" aria-label="Download GPX route">${ICON.gpx}GPX</a>`
          : ''
      }<button class="seemap" type="button" title="Show on the map" aria-label="Show on the map">${ICON.map}MAP</button></span>
    </div>
  </article>`;
}
