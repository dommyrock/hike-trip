// ----------------------------------------------------------------------------
//  TRAILS — aggregator + origin registry (single source of truth)
// ----------------------------------------------------------------------------
//  Trail entries live in one file per origin (trails-<origin>.js) and share the
//  field shape documented in trails-ortisei.js. The "Explore the Alps" set is
//  GENERATED from data/explore/*.csv into trails-explore.js (npm run
//  explore:gen): new trails tagged with their origin, plus overlays (photo,
//  buzz, access note, explore group) for app trails that are also in it.
//  This file:
//    - defines `origins`  (the region chips; drives the DB origins table, the
//      per-origin "From" bases and the Nominatim search bias)
//    - exports `trails`   (all origins merged, each entry tagged with `origin`)
//    - exports `decorate` (display fields derived from the registry — applied
//      to the bundled trails here and to /api/trails rows in the client)
//  After editing any data file:  npm run db:seed:gen && npm run db:apply
// ----------------------------------------------------------------------------

import { trails as ortisei } from './trails-ortisei.js';
import { trails as kranjskaGora } from './trails-kranjska-gora.js';
import { exploreTrails, overlays } from './trails-explore.js';
import { baked } from './paths-baked.js';

export const origins = [
  {
    slug: 'ortisei',
    label: 'Dolomites', // region chip
    country: 'Italy',
    name: 'Ortisei',
    title: 'Val Gardena Trails',
    region: 'Dolomites · Val Gardena & beyond',
    coords: [46.5747, 11.6717],
    // appended to free-text "From" lookups so Nominatim resolves locally
    searchBias: 'Italy',
    // known base towns with exact coords — resolve instantly, no network call
    bases: {
      Ortisei: [46.5747, 11.6717],
      'Santa Cristina': [46.5616, 11.7233],
      'Selva di Val Gardena': [46.5546, 11.7607],
      'Val di Funes (Zans)': [46.6353, 11.7045],
      Castelrotto: [46.5667, 11.5594],
      "Cortina d'Ampezzo": [46.5405, 12.1357],
    },
  },
  {
    slug: 'kranjska_gora',
    label: 'Julian Alps',
    country: 'Slovenia',
    name: 'Kranjska Gora',
    title: 'Julian Alps Trails',
    region: 'Julian Alps · Triglav National Park',
    coords: [46.4851, 13.7844],
    searchBias: 'Slovenia',
    bases: {
      'Kranjska Gora': [46.4851, 13.7844],
      Podkoren: [46.4938, 13.7567],
      Rateče: [46.4977, 13.7158],
      'Gozd Martuljek': [46.4841, 13.8387],
      Mojstrana: [46.461, 13.9394],
      'Vršič Pass': [46.4348, 13.7437],
    },
  },
  {
    slug: 'austria',
    label: 'Austria',
    country: 'Austria',
    name: 'Innsbruck',
    title: 'Austrian Alps Trails',
    region: 'Austrian Alps · Tyrol, Salzburg, Salzkammergut',
    coords: [47.2654, 11.3928],
    searchBias: 'Austria',
    bases: {
      Innsbruck: [47.2654, 11.3928],
      Salzburg: [47.7981, 13.0465],
      'Zell am See': [47.324, 12.7963],
      Hallstatt: [47.5622, 13.6493],
      Mayrhofen: [47.1671, 11.8642],
    },
  },
  {
    slug: 'switzerland',
    label: 'Switzerland',
    country: 'Switzerland',
    name: 'Interlaken',
    title: 'Swiss Alps Trails',
    region: 'Swiss Alps · Bernese Oberland, Valais, Central',
    coords: [46.6855, 7.8585],
    searchBias: 'Switzerland',
    bases: {
      Interlaken: [46.6855, 7.8585],
      Grindelwald: [46.6243, 8.0367],
      Zermatt: [46.0212, 7.7493],
      Lucerne: [47.0521, 8.3058],
      Kandersteg: [46.4976, 7.6757],
    },
  },
  {
    slug: 'germany',
    label: 'Germany',
    country: 'Germany',
    name: 'Garmisch-Partenkirchen',
    title: 'Bavarian Alps Trails',
    region: 'Bavarian Alps · Allgäu, Berchtesgaden',
    coords: [47.4924, 11.0963],
    searchBias: 'Germany',
    bases: {
      'Garmisch-Partenkirchen': [47.4924, 11.0963],
      Berchtesgaden: [47.633, 13.002],
      Füssen: [47.5676, 10.6993],
      Oberstdorf: [47.4097, 10.2792],
    },
  },
];

const originBySlug = Object.fromEntries(origins.map((o) => [o.slug, o]));

// Display fields derived from the registry (not stored per trail):
//   place  photo chip text, e.g. "Bernese Oberland · Switzerland"
export const decorate = (t) => {
  const o = originBySlug[t.origin];
  return { ...t, place: `${t.regionName ?? o?.label ?? ''} · ${t.country ?? o?.country ?? ''}` };
};

// Baked (OSM-routed) geometry overrides the schematic path where available,
// and brings a self-hosted GPX download with it (npm run bake:geo).
const enrich = (t, origin) =>
  decorate({
    ...t,
    origin,
    ...overlays[t.id],
    ...(baked[t.id]
      ? {
          path: baked[t.id].path,
          waypoints: baked[t.id].anchors ?? [], // komoot-style dots along the route
          gpx: `/gpx/${t.id}.gpx`,
        }
      : {}),
  });

export const trails = [
  ...ortisei.map((t) => enrich(t, 'ortisei')),
  ...kranjskaGora.map((t) => enrich(t, 'kranjska_gora')),
  ...exploreTrails.map((t) => enrich(t, t.origin)),
];
