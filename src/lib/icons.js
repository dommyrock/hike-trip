// Inline SVG glyph strings shared by the SSR card (TrailCard.astro), the client
// card/tooltip builders (src/lib/card.js) and the map markers (index.astro), so
// each path is defined exactly once. String-based (divIcon / set:html) — no
// image assets, nothing the bundler can break.
export const ICON = {
  // filled mountain — the card's leading icon and the trail map markers
  mountain:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 20h18L14.5 7l-3 5.2L9 8.4 3 20Z"/></svg>',
  // "must visit" heart
  heart:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  // trail-marker / waymark plate (the trail-number tag)
  trail:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 17V7l8-3 8 3v10M4 17l8 3 8-3M4 17V7"/></svg>',
  // cable-car / access tag
  access:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11h18M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M5 11v6m14-6v6M8 17v2m8-2v2"/></svg>',
  // map pin — the distance line on a card
  pin:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  // GPX download arrow
  gpx:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 19h14"/></svg>',
  // "show on map" up chevron
  map:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 12l6-6 6 6"/></svg>',
  // popup "Details" — scroll down to the card
  down:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v13M6 12l6 6 6-6"/></svg>',
  // opens in a new tab (OpenStreetMap)
  external:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  // "More details" disclosure chevron (rotates when open)
  chevron:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  // access note (fee / closure / booking)
  info:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg>',
  // share a trail link (Web Share sheet, else copy)
  share:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 13.2 7.6 4.1M15.8 6.7l-7.6 4.1"/></svg>',
  // saved trails — a bookmark, NOT a heart (the heart means "must visit");
  // CSS fills it when saved (.is-saved)
  bookmark:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 3.5h10a1 1 0 0 1 1 1v16l-6-4.2-6 4.2v-16a1 1 0 0 1 1-1Z"/></svg>',
  // season — the "In season" tag and the "In season now" filter chip
  season:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/></svg>',
};
