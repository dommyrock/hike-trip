-- hike-trip · D1 (SQLite) schema
-- Two tables: an origin (base location, e.g. Ortisei) has many trails.

DROP TABLE IF EXISTS trails;
DROP TABLE IF EXISTS origins;

CREATE TABLE origins (
  id   INTEGER PRIMARY KEY,
  slug TEXT    NOT NULL UNIQUE,          -- 'ortisei' — used in /api/trails?origin=
  name TEXT    NOT NULL,                 -- 'Ortisei'
  region TEXT,                           -- 'Val Gardena · Dolomites'
  lat  REAL    NOT NULL,
  lng  REAL    NOT NULL
);

CREATE TABLE trails (
  id         INTEGER PRIMARY KEY,
  origin_id  INTEGER NOT NULL REFERENCES origins(id) ON DELETE CASCADE,
  slug       TEXT    NOT NULL UNIQUE,    -- 'seceda-ridge' — the client card id
  name       TEXT    NOT NULL,
  area       TEXT,                       -- nature park / area label
  trail_no   TEXT,                       -- trail number(s), shown as a tag
  difficulty TEXT    NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  length_km  REAL,
  ascent_m   INTEGER,
  duration_h REAL,                       -- decimal hours (3.5 = 3 h 30 min)
  peak_m     INTEGER,                    -- highest point reached on the route
  peak_name  TEXT,
  massif     TEXT,
  access     TEXT,                       -- how to reach the trailhead
  start_lat  REAL    NOT NULL,           -- trailhead
  start_lng  REAL    NOT NULL,
  peak_lat   REAL    NOT NULL,           -- where the map pin sits
  peak_lng   REAL    NOT NULL,
  path       TEXT    NOT NULL DEFAULT '[]',  -- JSON [[lat,lng],...] polyline
  blurb      TEXT
);

CREATE INDEX idx_trails_origin ON trails(origin_id);
