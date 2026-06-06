// ----------------------------------------------------------------------------
//  TRAILS — aggregator + origin registry (single source of truth)
// ----------------------------------------------------------------------------
//  Trail entries live in one file per origin (trails-<origin>.js) and share the
//  field shape documented in trails-ortisei.js. This file:
//    - defines `origins`  (drives the DB origins table, the region switcher,
//      the per-origin "From" bases and the Nominatim search bias)
//    - exports `trails`   (all origins merged, each entry tagged with `origin`)
//  After editing any data file:  npm run db:seed:gen && npm run db:apply
// ----------------------------------------------------------------------------

import { trails as ortisei } from './trails-ortisei.js';
import { trails as kranjskaGora } from './trails-kranjska-gora.js';

export const origins = [
  {
    slug: 'ortisei',
    name: 'Ortisei',
    title: 'Val Gardena Trails',
    region: 'Val Gardena · Dolomites',
    coords: [46.5747, 11.6717],
    // appended to free-text "From" lookups so Nominatim resolves locally
    searchBias: 'South Tyrol, Italy',
    // known base towns with exact coords — resolve instantly, no network call
    bases: {
      Ortisei: [46.5747, 11.6717],
      'Santa Cristina': [46.5616, 11.7233],
      'Selva di Val Gardena': [46.5546, 11.7607],
      'Val di Funes (Zans)': [46.6353, 11.7045],
      Castelrotto: [46.5667, 11.5594],
    },
  },
  {
    slug: 'kranjska_gora',
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
];

export const trails = [
  ...ortisei.map((t) => ({ ...t, origin: 'ortisei' })),
  ...kranjskaGora.map((t) => ({ ...t, origin: 'kranjska_gora' })),
];
