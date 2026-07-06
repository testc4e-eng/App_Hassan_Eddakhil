-- ============================================================
-- Script : regénération des mappings stations / entités
-- ============================================================
-- Source : colonne "Station" de audit.nv_stream (shapefile NV-Stream)
-- Principe : tronçon n° = sous-bassin n°
-- À exécuter UNIQUEMENT après validation métier et backup complet.

BEGIN;

-- 1. Sauvegardes
DROP TABLE IF EXISTS audit.station_subbasin_map_backup_2026;
CREATE TABLE audit.station_subbasin_map_backup_2026 AS
SELECT * FROM core.station_subbasin_map;

DROP TABLE IF EXISTS audit.station_reach_map_backup_2026;
CREATE TABLE audit.station_reach_map_backup_2026 AS
SELECT * FROM core.station_reach_map;

-- 2. Table de correspondance explicite basée sur la colonne Station du shapefile
CREATE TEMP TABLE tmp_station_match (
  nv_station_name text PRIMARY KEY,
  station_id bigint,
  station_code text,
  station_name text
);

INSERT INTO tmp_station_match (nv_station_name, station_id, station_code, station_name) VALUES
  ('Zaouia sidi hamza',  3,  '31/38',   'Zaouiet Sidi Hamza'),
  ('M''zizel',           24, '1585/38', 'MZIZEL'),
  ('Foum Tillicht',       2,  '1508/38', 'FOUM TILLICHT'),
  ('Foum Zaabel',        29, '867/48',  'FOUM ZAABEL'),
  ('Bge hassan addakhil', 35, '1940/48', 'AVAL BARAGE HASSAN ADDAKHEL');

-- 3. Regénérer station_subbasin_map depuis audit.nv_stream
-- (tronçon n = sous-bassin n)
TRUNCATE core.station_subbasin_map;
INSERT INTO core.station_subbasin_map (
  station_id, station_code, station_name, nv_station_name,
  subbasin_id, hydro_id, outlet_id, source_layer, mapping_method,
  confidence_score, is_primary, is_active, notes, created_at, updated_at
)
SELECT
  m.station_id,
  m.station_code,
  m.station_name,
  nv.station AS nv_station_name,
  nv.subbasin::int AS subbasin_id,
  nv.hydroid::int AS hydro_id,
  nv.outletid::int AS outlet_id,
  'NV-Stream' AS source_layer,
  'nv_stream_station_name' AS mapping_method,
  1.00 AS confidence_score,
  true AS is_primary,
  true AS is_active,
  'Auto-seeded from NV-Stream layer' AS notes,
  NOW() AS created_at,
  NOW() AS updated_at
FROM audit.nv_stream nv
JOIN tmp_station_match m ON m.nv_station_name = nv.station
WHERE nv.station IS NOT NULL AND nv.station <> '';

-- 4. Regénérer station_reach_map depuis audit.nv_stream
-- (tronçon n = sous-bassin n)
TRUNCATE core.station_reach_map;
INSERT INTO core.station_reach_map (
  station_id, reach_id, station_code, reach_code, mapping_method,
  distance_m, confidence_score, is_primary, is_active, notes, created_at, updated_at
)
SELECT
  m.station_id,
  nv.subbasin::int AS reach_id,
  m.station_code,
  nv.subbasin::text AS reach_code,
  'nv_stream_station_name' AS mapping_method,
  0::numeric AS distance_m,
  1.00 AS confidence_score,
  true AS is_primary,
  true AS is_active,
  'Auto-seeded from NV-Stream layer' AS notes,
  NOW() AS created_at,
  NOW() AS updated_at
FROM audit.nv_stream nv
JOIN tmp_station_match m ON m.nv_station_name = nv.station
WHERE nv.station IS NOT NULL AND nv.station <> '';

-- 5. Vérification
SELECT 'station_subbasin_map' AS map, COUNT(*) AS n,
       array_agg(DISTINCT subbasin_id ORDER BY subbasin_id) AS ids
FROM core.station_subbasin_map
UNION ALL
SELECT 'station_reach_map', COUNT(*),
       array_agg(DISTINCT reach_id ORDER BY reach_id)
FROM core.station_reach_map;

COMMIT;
