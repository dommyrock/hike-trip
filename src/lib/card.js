// ----------------------------------------------------------------------------
//  Trail card + map widget markup — the SINGLE source of truth.
// ----------------------------------------------------------------------------
//  Used by both the SSR first paint (src/components/TrailCard.astro) and the
//  client re-render (src/pages/index.astro). Before, the two were hand-mirrored
//  template strings and had silently drifted (locale, null fallbacks); keep all
//  card/stat markup here so they can't diverge again.
//
//  Fields from the explore CSVs (lengthKm, ascentM, peakM, …) can be missing —
//  blank means unknown there — so every stat renders "—" rather than throwing.
// ----------------------------------------------------------------------------

import { fmtDurationShort, DIFF_LABEL, inSeason, fmtMonth } from './geo.js';
import { ICON } from './icons.js';

// Text from the data files and D1 goes into HTML strings — escape it.
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Pinned to en-US so the SSR string and the client re-render produce the same
// number (a locale-formatted value would differ between server and visitor).
const num = (v) => v.toLocaleString('en-US');

// Editorial "how much people talk about it" level (explore trails only).
export const BUZZ_RANK = { low: 1, medium: 2, high: 3, 'very-high': 4 };
const BUZZ_LABEL = { low: 'Quiet', medium: 'Some buzz', high: 'High buzz', 'very-high': 'Very high buzz' };

// Difficulty pill — shared by cards and the map tooltip/popup.
export const badgeHTML = (d) => `<span class="badge badge--${d}">${DIFF_LABEL[d]}</span>`;

// Multi-day routes show their days ("8–12 days", "33 stages") instead of hours.
export const timeOf = (t) =>
  t.days
    ? /stage/.test(t.days)
      ? t.days
      : `${t.days} days`
    : t.durationH != null
      ? fmtDurationShort(t.durationH)
      : '—';

// "4.2 km" near the base, "312 km" across the Alps
export const fmtDist = (km) => (km < 100 ? km.toFixed(1) : String(Math.round(km)));

// The four stats every card and map widget shows, in display order.
const trailStats = (t) => [
  { k: 'Length', v: t.lengthKm != null ? t.lengthKm : '—', unit: t.lengthKm != null ? 'km' : '' },
  {
    k: 'Ascent',
    v: t.ascentM != null ? '+' + num(t.ascentM) : '—',
    // traverses that mostly go down also show the descent
    unit: t.ascentM == null ? '' : t.descentM ? `m ↓${num(t.descentM)}` : 'm',
  },
  { k: 'Time', v: timeOf(t) },
  { k: 'High point', v: t.peakM != null ? num(t.peakM) : '—', unit: t.peakM != null ? 'm' : '' },
];

// One stat cell. The card grid (`stat`) spaces the unit via a CSS margin; the
// map tooltip/popup (`tip-stat`) has no such margin, so it needs a literal
// space before the unit. That's the only difference between the two.
const statCell = (k, v, unit, cls = 'stat') =>
  `<div class="${cls}"><div class="k">${k}</div><div class="v">${v}${
    unit ? `${cls === 'tip-stat' ? ' ' : ''}<small>${unit}</small>` : ''
  }</div></div>`;

export const statsRow = (t, cls = 'stat') =>
  trailStats(t)
    .map((s) => statCell(s.k, s.v, s.unit, cls))
    .join('');

const photoImg = (t, eager = false) =>
  t.photo
    ? `<img src="${esc(t.photo.src)}" alt="${esc(t.name)}" width="720" height="480" decoding="async"${
        eager ? '' : ' loading="lazy"'
      }>`
    : '';

// Every photo is CC BY / BY-SA / CC0 / PD — the credit line is a licence term.
const creditLink = (t) =>
  t.photo
    ? `<a class="credit" href="${esc(t.photo.source)}" target="_blank" rel="noopener">Photo: ${esc(
        t.photo.credit
      )} · ${esc(t.photo.license)}</a>`
    : '';

// fees and closures go stale, so the note says when it was last checked
const noteHTML = (t) =>
  t.accessNote
    ? `<div class="note">${ICON.info}<span>${esc(t.accessNote)}${
        t.accessNoteAsOf ? ` <span class="note-asof">As of ${fmtMonth(t.accessNoteAsOf)}</span>` : ''
      }</span></div>`
    : '';

const buzzHTML = (t) =>
  t.buzz
    ? `<span class="buzz" title="${esc(t.why)}"><span class="buzz-bars" aria-hidden="true">${[1, 2, 3, 4]
        .map((i) => `<i${i <= BUZZ_RANK[t.buzz] ? ' class="on"' : ''}></i>`)
        .join('')}</span>${BUZZ_LABEL[t.buzz]}</span>`
    : '';

// In / out of season at the visitor's current month — SSR renders the build
// date's verdict, the client re-render on load corrects it. No chip when the
// season can't be parsed.
const seasonHTML = (t) => {
  const now = inSeason(t.season);
  if (now == null) return '';
  return now
    ? `<span class="tag tag--season is-in" title="In season now · ${esc(t.season)}">${ICON.season}In season</span>`
    : `<span class="tag tag--season" title="Season: ${esc(t.season)}">Out of season</span>`;
};

// Share (Web Share sheet, else copy the /?trail= link) and Save (bookmark —
// kept in localStorage by index.astro). Same two buttons on the card footer,
// the map popup and the phone trail sheet; `cls` picks the container's look.
export const shareBtn = (t, cls) =>
  `<button class="${cls} share" type="button" data-id="${esc(t.id)}" title="Share this trail" aria-label="Share ${esc(
    t.name
  )}">${ICON.share}</button>`;
export const saveTitle = (saved) => (saved ? 'Saved — click to remove' : 'Save this trail');
export const saveBtn = (t, saved, cls) =>
  `<button class="${cls} save${saved ? ' is-saved' : ''}" type="button" data-id="${esc(t.id)}" aria-pressed="${
    saved ? 'true' : 'false'
  }" title="${saveTitle(saved)}" aria-label="Save ${esc(t.name)}">${ICON.bookmark}</button>`;

const osmUrl = ([lat, lng]) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;

// "More details" — everything the card preview shortens or leaves out: the
// full description (the preview clamps it to three lines) and the facts list.
function moreHTML(t, open) {
  const high = [t.peakName, t.peakM != null ? `${num(t.peakM)} m` : null].filter(Boolean).join(' · ');
  const facts = [
    ['High point', high],
    ['Massif · views', t.massif],
    ['Trail markers', t.trail],
    ['Route', [t.type, t.days ? timeOf(t) : null, t.season].filter(Boolean).join(' · ')],
    ['Getting there', t.access],
    ['Why it’s popular', t.why],
  ].filter(([, v]) => v);
  return `<details class="more"${open ? ' open' : ''}>
    <summary><span class="more-open">More details</span><span class="more-close">Less</span>${ICON.chevron}</summary>
    <div class="more-body">
      <p class="desc">${esc(t.description ?? t.blurb)}</p>
      <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <a class="trailhead" href="${osmUrl(t.start)}" target="_blank" rel="noopener">${ICON.pin}Trailhead on OpenStreetMap</a>
    </div>
  </details>`;
}

// The full trail card (design A: photo on top, glass body).
//   distKm    straight-line distance from the active base
//   baseName  active "From" base (its first word is shown next to the distance)
//   index     grid position — drives the staggered rise-in delay and eager
//             loading of the first row of photos
//   open      "More details" starts expanded (kept across client re-renders)
//   saved     the visitor saved (bookmarked) it — client only, SSR can't know
export function cardHTML(t, { distKm, baseName, index = 0, open = false, saved = false }) {
  return `<article class="card" data-id="${esc(t.id)}" data-d="${t.difficulty}" style="animation-delay:${Math.min(
    index * 45,
    320
  )}ms">
    <div class="card-photo">
      ${photoImg(t, index < 3)}
      <span class="card-place">${esc(t.place)}</span>
      ${t.mustVisit ? `<span class="must" title="Must visit">${ICON.heart}</span>` : ''}
      ${creditLink(t)}
    </div>
    <div class="card-body">
      <div class="head">
        <div class="ico">${ICON.mountain}</div>
        <div class="ttl"><h3>${esc(t.name)}</h3><div class="area">${esc(t.area)}</div></div>
        ${badgeHTML(t.difficulty)}
      </div>
      <p class="blurb">${esc(t.blurb)}</p>
      <div class="stats">${statsRow(t, 'stat')}</div>
      <div class="tags">
        <span class="tag tag--trail" title="${
          t.trail ? 'Trail marker — the route number on signposts along the way' : 'Route type'
        }">${ICON.trail}${esc(t.trail ?? t.type)}</span>
        ${t.trail ? `<span class="tag">${esc(t.type)}</span>` : ''}
        <span class="tag">${esc(t.season)}</span>
        ${seasonHTML(t)}
        <span class="tag">${ICON.access}${esc(t.access)}</span>
        ${buzzHTML(t)}
      </div>
      ${noteHTML(t)}
      ${moreHTML(t, open)}
      <div class="foot">
        <span class="dist">${ICON.pin}${fmtDist(distKm)}&nbsp;km from&nbsp;${esc(baseName.split(' ')[0])}</span>
        <span class="acts">${shareBtn(t, 'cbtn')}${saveBtn(t, saved, 'cbtn')}${
          t.gpx
            ? `<a class="gpxdl" href="${esc(t.gpx)}" download title="Download GPX route" aria-label="Download GPX route">${ICON.gpx}GPX</a>`
            : ''
        }<button class="seemap" type="button" title="Show on the map" aria-label="Show on the map">${ICON.map}MAP</button></span>
      </div>
    </div>
  </article>`;
}

// Map hover tooltip: name, difficulty, distance and the four stats (no photo).
export function tipHTML(t, { distKm, baseName }) {
  return (
    `<div class="tip-in">` +
    `<div class="tip-head"><span class="tip-name">${esc(t.name)}</span>${badgeHTML(t.difficulty)}</div>` +
    `<div class="tip-dist">${fmtDist(distKm)} km from ${esc(baseName)}</div>` +
    `<div class="tip-stats">${statsRow(t, 'tip-stat')}</div>` +
    `</div>`
  );
}

// Map popup and mobile trail sheet (design C): photo, name, stats, access and
// actions. withGo adds the "Details" button that scrolls to the trail's card
// (left out when the card is filtered out of the grid). Share / Save sit on the
// photo (the action row is full at popup width), in the action row without one.
export function popupHTML(t, { distKm, baseName, withGo = false, saved = false }) {
  const quick = shareBtn(t, 'pop-ic') + saveBtn(t, saved, 'pop-ic');
  return (
    `<div class="pop">` +
    (t.photo
      ? `<div class="pop-photo">${photoImg(t, true)}${creditLink(t)}<div class="pop-quick">${quick}</div></div>`
      : '') +
    `<div class="tip-in">` +
    `<div class="tip-head"><span class="tip-name">${esc(t.name)}</span>${badgeHTML(t.difficulty)}</div>` +
    `<div class="tip-dist">${esc(t.place)} · ${fmtDist(distKm)} km from ${esc(baseName)}</div>` +
    `<div class="tip-stats">${statsRow(t, 'tip-stat')}</div>` +
    `<div class="pop-access">${ICON.access}<span>${esc(t.access)}</span></div>` +
    noteHTML(t) +
    `<div class="pop-acts">` +
    (withGo
      ? `<button class="pop-go" type="button" data-id="${esc(t.id)}" title="Scroll to the trail card">${ICON.down}Details</button>`
      : '') +
    (t.gpx ? `<a class="pop-btn" href="${esc(t.gpx)}" download>${ICON.gpx}GPX</a>` : '') +
    `<a class="pop-btn" href="${osmUrl(t.peak)}" target="_blank" rel="noopener">${ICON.external}OSM</a>` +
    (t.photo ? '' : quick) +
    `</div></div></div>`
  );
}
