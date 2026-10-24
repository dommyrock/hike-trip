# Explore the Alps — research data

One CSV per region (`dolomites`, `austria`, `switzerland`, `germany`), one row per
trail, feeding the planned "Explore the Alps" view. Thumbnails are
`public/photos/<slug>.webp` (720×480, centre-cropped 3:2).

- **Blank = unknown**, never guessed (e.g. no published high point for a gorge walk).
- `start_*` / `pin_*`: trailhead and map-pin coordinates from OpenStreetMap
  (Nominatim / Overpass). Rows with `in_app=yes` reuse the verified coordinates and
  figures from `src/data/trails-ortisei.js`.
- `peak_m` / `peak_name`: the highest point actually reached, as in the main app.
- `days`: set only for `type=Multi-day`, as text (`8–12`, `33 stages`).
- `descent_m`: only where it differs a lot from the ascent (traverses that mostly go down).
- `stats_status`: `verified` = two or more independent sources agree; `partly` = one
  source, or sources give a range; `unconfirmed` = route variants disagree.
  `stats_sources` lists them.
- `blurb` is the short teaser (explore postcards, card preview); `description` is the
  full paragraph shown under "More details" on a trail card, in the same register as
  the app's own trail texts. Rows with `in_app=yes` leave it blank — the app's text wins.
- `access_note_as_of`: the month (`YYYY-MM`) the access note was last checked —
  required whenever `access_note` is set (the generator refuses a note without it)
  and shown as "as of Oct 2026" next to the note. A scheduled workflow
  (`.github/workflows/access-notes-recheck.yml`, 1 April and 1 October) opens a
  `maintenance` issue with the checklist from `node db/access-notes-report.mjs`.
- `access_note`: 2025–26 changes (fees, closures, bookings) worth showing on a card.
- `buzz` / `crowd`: editorial estimates (low · medium · high · very-high), not measured counts.
- `photo_*`: Wikimedia Commons file, author and licence. Every photo is CC BY,
  CC BY-SA, CC0 or public domain, so the credit line must be shown with it.
