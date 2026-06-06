// ----------------------------------------------------------------------------
//  TRAILS — Ortisei / Val Gardena (Dolomites)
// ----------------------------------------------------------------------------
//  Each trail:
//    id          unique slug
//    name        display name
//    area        nature park / massif it sits in
//    trail       trail number(s) or type, shown as a small tag
//    difficulty  'easy' | 'medium' | 'hard'  -> green / yellow / red
//    lengthKm    route length (km)
//    ascentM     total ascent (m)
//    durationH   walking time (hours, decimal)
//    peakM       HIGHEST POINT YOU REACH on the route (m) — honest "peak height"
//    peakName    name of that high point
//    massif      the big peaks you walk under / see
//    access      how you get to the trailhead from a valley base
//    start       [lat, lng] of the trailhead
//    peak        [lat, lng] of the high point (where the map marker sits)
//    path        [[lat,lng], ...] route polyline
//    blurb       one-paragraph description
//
//  NOTE ON GEOMETRY:  trailhead / high-point / cable-car coordinates are real
//  and accurate to a few metres. The `path` polylines, however, are SCHEMATIC
//  sketches between those anchors — they do NOT follow every switchback. For a
//  production map, replace each `path` with a real GPX/GeoJSON track (see
//  README -> "Swapping in real trail geometry"). Distances and ascents come
//  from public trail data (Outdooractive / AllTrails / val-gardena.com etc.).
// ----------------------------------------------------------------------------

export const trails = [
  {
    id: 'seceda-ridge',
    name: 'Seceda Ridge Viewpoint',
    area: 'Puez-Odle Nature Park',
    trail: 'Ridge loop',
    difficulty: 'easy',
    lengthKm: 1.3,
    ascentM: 110,
    durationH: 0.75,
    peakM: 2519,
    peakName: 'Seceda',
    massif: 'Odle / Geisler',
    access: 'Seceda cable car from Ortisei',
    start: [46.6064, 11.6536],
    peak: [46.6086, 11.65],
    path: [
      [46.6064, 11.6536],
      [46.6072, 11.6521],
      [46.6082, 11.6508],
      [46.6086, 11.65],
      [46.6076, 11.6489],
    ],
    blurb:
      'The postcard of the Dolomites: the knife-edge Seceda ridge tilting up to the jagged Odle spires. A short, easy stroll from the top of the cable car to the famous viewpoint, with the Sella and Sassolungo on the horizon.',
  },
  {
    id: 'panascharte',
    name: 'Panascharte (Forcella Pana)',
    area: 'Puez-Odle Nature Park',
    trail: 'No. 35 / 1',
    difficulty: 'medium',
    lengthKm: 8,
    ascentM: 480,
    durationH: 3,
    peakM: 2447,
    peakName: 'Forcella Pana',
    massif: 'Odle / Geisler',
    access: 'Resciesa funicular from Ortisei',
    start: [46.5899, 11.6852],
    peak: [46.6033, 11.6586],
    path: [
      [46.5899, 11.6852],
      [46.5955, 11.674],
      [46.6011, 11.6662],
      [46.6033, 11.6586],
      [46.6062, 11.6541],
    ],
    blurb:
      'One of the most popular ridge traverses in the valley. From the Resciesa plateau the path runs west under the full sawtooth wall of the Odle to the Pana saddle, then drops onto the Seceda alp. Start early — it gets busy by mid-morning.',
  },
  {
    id: 'adolf-munkel',
    name: 'Adolf Munkel Trail (Via delle Odle)',
    area: 'Puez-Odle Nature Park',
    trail: 'No. 35 / 36',
    difficulty: 'medium',
    lengthKm: 9.2,
    ascentM: 428,
    durationH: 3.5,
    peakM: 2006,
    peakName: 'Gschnagenhardt Alm',
    massif: 'Odle / Geisler (Sass Rigais 3025 m)',
    access: 'Zans trailhead, Val di Funes',
    start: [46.6353, 11.7045],
    peak: [46.6125, 11.6822],
    path: [
      [46.6353, 11.7045],
      [46.625, 11.6961],
      [46.6171, 11.6889],
      [46.6125, 11.6822],
      [46.6112, 11.674],
    ],
    blurb:
      'A near-level forest-and-meadow circuit along the northern base of the Geisler/Odle group, named after the Dresden alpinist who founded it in 1905. The sawtooth peaks rise straight overhead from the Geisler Alm "cinema" — manageable for most and even doable with kids.',
  },
  {
    id: 'raschoetz-promenade',
    name: 'Raschötz High Promenade',
    area: 'Resciesa / Raschötz',
    trail: 'No. 31 / 1 / 10',
    difficulty: 'easy',
    lengthKm: 5,
    ascentM: 200,
    durationH: 2,
    peakM: 2281,
    peakName: 'Außerraschötz cross',
    massif: 'Puez-Geisler panorama',
    access: 'Resciesa funicular from Ortisei',
    start: [46.5899, 11.6852],
    peak: [46.5972, 11.6928],
    path: [
      [46.5899, 11.6852],
      [46.5931, 11.6889],
      [46.5972, 11.6928],
      [46.5958, 11.6961],
      [46.5919, 11.6925],
    ],
    blurb:
      'Sunny, gentle high-level walking on the Raschötz ridge with a 360° sweep over the Puez-Geisler park to the summit cross at 2,281 m, then down past the Heilig-Kreuz chapel. A relaxed family favourite straight off the funicular.',
  },
  {
    id: 'col-raiser-firenze',
    name: 'Col Raiser → Rifugio Firenze',
    area: 'Puez-Odle Nature Park',
    trail: 'No. 1',
    difficulty: 'easy',
    lengthKm: 5,
    ascentM: 160,
    durationH: 2,
    peakM: 2090,
    peakName: 'Rifugio Firenze',
    massif: 'Fermeda / Odle',
    access: 'Col Raiser gondola from S. Cristina',
    start: [46.5887, 11.7047],
    peak: [46.6056, 11.6647],
    path: [
      [46.5887, 11.7047],
      [46.595, 11.6922],
      [46.6005, 11.6788],
      [46.6056, 11.6647],
    ],
    blurb:
      'An easy, gradual walk across open alp from the top of the Col Raiser gondola to the Regensburger Hütte (Rifugio Firenze, 2,037 m), tucked right beneath the Fermeda towers. Big-mountain scenery with very little effort.',
  },
  {
    id: 'alpe-di-siusi',
    name: 'Alpe di Siusi Meadow Walk',
    area: 'Seiser Alm / Sciliar',
    trail: 'Meadow paths',
    difficulty: 'easy',
    lengthKm: 6,
    ascentM: 150,
    durationH: 2.5,
    peakM: 2005,
    peakName: 'Mont Sëuc',
    massif: 'Sassolungo & Sciliar views',
    access: 'Mont Sëuc cable car from Ortisei',
    start: [46.5497, 11.6436],
    peak: [46.5419, 11.6147],
    path: [
      [46.5497, 11.6436],
      [46.5468, 11.6331],
      [46.5441, 11.6238],
      [46.5419, 11.6147],
    ],
    blurb:
      'Europe’s largest high-altitude alpine meadow, rolling green under the Sassolungo and Sciliar. Wide, almost flat paths make this the easiest big-view day from Ortisei — perfect for a slow afternoon or a picnic.',
  },
  {
    id: 'sassolungo-circuit',
    name: 'Sassolungo Circuit (Friedrich-August-Weg)',
    area: 'Sassolungo / Langkofel',
    trail: 'No. 557 / 4',
    difficulty: 'medium',
    lengthKm: 11,
    ascentM: 600,
    durationH: 5.5,
    peakM: 2300,
    peakName: 'Rif. Friedrich August',
    massif: 'Sassolungo 3181 m',
    access: 'Passo Sella (bus/drive via Selva)',
    start: [46.5099, 11.7556],
    peak: [46.5125, 11.7361],
    path: [
      [46.5099, 11.7556],
      [46.5111, 11.7459],
      [46.5125, 11.7361],
      [46.5172, 11.7301],
      [46.5219, 11.736],
    ],
    blurb:
      'A grand loop right around the base of the Sassolungo/Langkofel massif, weaving between rock towers, scree and high pasture with the Friedrich-August hut along the way. A proper full day of moderate alpine walking.',
  },
  {
    id: 'sass-rigais',
    name: 'Sass Rigais Summit (via ferrata)',
    area: 'Puez-Odle Nature Park',
    trail: 'No. 2 / via ferrata',
    difficulty: 'hard',
    lengthKm: 9,
    ascentM: 900,
    durationH: 6,
    peakM: 3025,
    peakName: 'Sass Rigais',
    massif: 'Odle / Geisler',
    access: 'Col Raiser gondola from S. Cristina',
    start: [46.5887, 11.7047],
    peak: [46.6131, 11.6917],
    path: [
      [46.5887, 11.7047],
      [46.5972, 11.6986],
      [46.6048, 11.6948],
      [46.6131, 11.6917],
    ],
    blurb:
      'The roof of the Odle group at 3,025 m, reached by a cabled via-ferrata line through the heart of the massif. Exposed, steep and serious — for experienced scramblers with a helmet, harness and a head for heights only.',
  },
  {
    id: 'resciesa-seceda-traverse',
    name: 'Resciesa → Brogles → Seceda Traverse',
    area: 'Puez-Odle Nature Park',
    trail: 'No. 35 / 29',
    difficulty: 'hard',
    lengthKm: 14.4,
    ascentM: 1087,
    durationH: 6.25,
    peakM: 2519,
    peakName: 'Seceda ridge',
    massif: 'Odle / Geisler',
    access: 'Resciesa funicular → Seceda cableway',
    start: [46.5899, 11.6852],
    peak: [46.6075, 11.6533],
    path: [
      [46.5899, 11.6852],
      [46.6051, 11.6884],
      [46.6142, 11.6803],
      [46.6125, 11.6685],
      [46.6075, 11.6533],
    ],
    blurb:
      'A big point-to-point that links the two Ortisei high plateaus: up onto Resciesa, along the Adolf Munkel base, over the steep Furcela de Mesdi scree, then up to the Seceda ridge. Over 1,000 m of climbing and the most demanding day here.',
  },
];
