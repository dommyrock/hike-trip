// Great-circle ("as the crow flies") distance between two [lat, lng] points.
// Returns kilometres. Good enough for ranking trailheads by distance from a base.
export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371; // Earth radius (km)
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Rank used for sorting / colour mapping.
export const DIFF_RANK = { easy: 1, medium: 2, hard: 3 };

export const DIFF_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

// Compact duration for the tight stat cells: "45 min", "~3 h", "~6.3 h".
export function fmtDurationShort(h) {
  if (h < 1) return `${Math.round(h * 60)} min`;
  const v = Math.round(h * 10) / 10;
  return `~${v} h`;
}

// Is `season` open in `month` (0 = Jan, the visitor's month by default)?
// "Jun – Oct" is an inclusive month range and wraps over New Year ("Dec – Mar");
// "Year-round" is always open. Missing / unparsable → null (no verdict).
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export function inSeason(season, month = new Date().getMonth()) {
  if (!season) return null;
  if (/year[\s-]*round/i.test(season)) return true;
  const m = season.toLowerCase().match(/([a-z]{3})[a-z]*\.?\s*[–—-]\s*([a-z]{3})/);
  const from = m ? MONTHS.indexOf(m[1]) : -1;
  const to = m ? MONTHS.indexOf(m[2]) : -1;
  if (from < 0 || to < 0) return null;
  return from <= to ? month >= from && month <= to : month >= from || month <= to;
}

// "2026-10" -> "Oct 2026" (the as-of month on access notes)
export function fmtMonth(ym) {
  const [y, m] = String(ym).split('-');
  const name = MONTHS[+m - 1];
  return name ? `${name[0].toUpperCase() + name.slice(1)} ${y}` : String(ym);
}

// Base towns with exact coordinates live per-origin in src/data/trails.js
// (origins[].bases) so the "From" field resolves instantly per region.
