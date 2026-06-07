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
};
