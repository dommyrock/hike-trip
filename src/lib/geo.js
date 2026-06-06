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

// Format a duration in hours as e.g. "3 h 30 min".
export function fmtDuration(h) {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  if (hours === 0) return `${mins} min`;
  return mins === 0 ? `${hours} h` : `${hours} h ${mins} min`;
}

// Compact variant for tight stat cells: "45 min", "~3 h", "~6.3 h".
export function fmtDurationShort(h) {
  if (h < 1) return `${Math.round(h * 60)} min`;
  const v = Math.round(h * 10) / 10;
  return `~${v} h`;
}

// Base towns with exact coordinates live per-origin in src/data/trails.js
// (origins[].bases) so the "From" field resolves instantly per region.
