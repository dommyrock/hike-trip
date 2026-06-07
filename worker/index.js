// hike-trip Worker — /api/* answered from D1, everything else served as
// static assets (the built Astro site in ./dist).

// DB row -> the exact trail shape the client expects (same as src/data/trails.js)
function toTrail(r) {
  return {
    id: r.slug,
    name: r.name,
    area: r.area,
    trail: r.trail_no,
    difficulty: r.difficulty,
    mustVisit: !!r.must_visit,
    type: r.type,
    season: r.season,
    lengthKm: r.length_km,
    ascentM: r.ascent_m,
    durationH: r.duration_h,
    peakM: r.peak_m,
    peakName: r.peak_name,
    massif: r.massif,
    access: r.access,
    start: [r.start_lat, r.start_lng],
    peak: [r.peak_lat, r.peak_lng],
    path: JSON.parse(r.path),
    waypoints: JSON.parse(r.waypoints || '[]'),
    gpx: r.gpx,
    blurb: r.blurb,
  };
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // tiny dataset, cheap to cache at the edge; tune as the data grows
      'Cache-Control': 'public, max-age=300',
    },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/trails') {
      const slug = (url.searchParams.get('origin') || 'ortisei').toLowerCase();

      const origin = await env.DB.prepare(
        'SELECT slug, name, region, lat, lng FROM origins WHERE slug = ?1'
      )
        .bind(slug)
        .first();
      if (!origin) return json({ error: `unknown origin '${slug}'` }, 404);

      const { results } = await env.DB.prepare(
        `SELECT t.slug, t.name, t.area, t.trail_no, t.difficulty,
                t.must_visit, t.type, t.season,
                t.length_km, t.ascent_m, t.duration_h,
                t.peak_m, t.peak_name, t.massif, t.access,
                t.start_lat, t.start_lng, t.peak_lat, t.peak_lng,
                t.path, t.waypoints, t.gpx, t.blurb
           FROM trails t
           JOIN origins o ON o.id = t.origin_id
          WHERE o.slug = ?1
          ORDER BY t.name`
      )
        .bind(slug)
        .all();

      return json({
        origin: { ...origin, coords: [origin.lat, origin.lng] },
        trails: results.map(toTrail),
      });
    }

    if (url.pathname.startsWith('/api/')) return json({ error: 'not found' }, 404);

    // anything else: the static Astro site
    return env.ASSETS.fetch(request);
  },
};
