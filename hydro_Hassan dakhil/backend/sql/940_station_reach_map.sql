BEGIN;

CREATE TABLE IF NOT EXISTS core.station_reach_map (
  id bigserial PRIMARY KEY,
  station_id integer NOT NULL REFERENCES core.stations(station_id),
  reach_id integer NOT NULL,
  station_code text,
  reach_code text,
  mapping_method text NOT NULL,
  distance_m double precision,
  confidence_score numeric(5,4),
  is_primary boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  simulated_station_id integer REFERENCES core.stations(station_id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT station_reach_map_confidence_chk
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  CONSTRAINT station_reach_map_station_reach_uq UNIQUE (station_id, reach_id)
);

CREATE INDEX IF NOT EXISTS idx_station_reach_map_station ON core.station_reach_map(station_id);
CREATE INDEX IF NOT EXISTS idx_station_reach_map_reach ON core.station_reach_map(reach_id);
CREATE INDEX IF NOT EXISTS idx_station_reach_map_active ON core.station_reach_map(is_active, is_primary);

WITH observed_stations AS (
  SELECT
    s.station_id,
    s.station_code,
    s.name AS station_name,
    s.geom
  FROM core.stations s
  WHERE s.station_code NOT LIKE 'swat_%'
    AND s.geom IS NOT NULL
),
nearest_reach AS (
  SELECT
    os.station_id,
    os.station_code,
    rs.reach_id,
    rs.reach_code::text AS reach_code,
    ST_Distance(os.geom::geography, rs.geom::geography) AS distance_m,
    row_number() OVER (
      PARTITION BY os.station_id
      ORDER BY ST_Distance(os.geom::geography, rs.geom::geography)
    ) AS rn
  FROM observed_stations os
  CROSS JOIN gis.reach_shapes rs
),
selected AS (
  SELECT
    nr.station_id,
    nr.station_code,
    nr.reach_id,
    nr.reach_code,
    nr.distance_m,
    CASE
      WHEN nr.distance_m <= 1000 THEN 0.98
      WHEN nr.distance_m <= 5000 THEN 0.92
      WHEN nr.distance_m <= 10000 THEN 0.85
      WHEN nr.distance_m <= 25000 THEN 0.70
      ELSE 0.35
    END::numeric(5,4) AS confidence_score
  FROM nearest_reach nr
  WHERE nr.rn = 1
    AND nr.distance_m <= 25000
)
INSERT INTO core.station_reach_map (
  station_id,
  reach_id,
  station_code,
  reach_code,
  mapping_method,
  distance_m,
  confidence_score,
  is_primary,
  is_active,
  simulated_station_id,
  notes
)
SELECT
  s.station_id,
  s.reach_id,
  s.station_code,
  s.reach_code,
  'nearest_spatial' AS mapping_method,
  s.distance_m,
  s.confidence_score,
  true AS is_primary,
  true AS is_active,
  sw.station_id AS simulated_station_id,
  CASE
    WHEN sw.station_id IS NULL THEN 'No swat_rch_* station found for mapped reach'
    ELSE 'Auto-linked by nearest station->reach (<=25km)'
  END AS notes
FROM selected s
LEFT JOIN core.stations sw
  ON sw.station_code = ('swat_rch_' || s.reach_id::text)
ON CONFLICT (station_id, reach_id) DO UPDATE
SET
  station_code = EXCLUDED.station_code,
  reach_code = EXCLUDED.reach_code,
  mapping_method = EXCLUDED.mapping_method,
  distance_m = EXCLUDED.distance_m,
  confidence_score = EXCLUDED.confidence_score,
  is_primary = EXCLUDED.is_primary,
  is_active = EXCLUDED.is_active,
  simulated_station_id = EXCLUDED.simulated_station_id,
  notes = EXCLUDED.notes,
  updated_at = now();

COMMIT;

