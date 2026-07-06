-- ============================================================
-- Script de remplacement des couches SIG par le découpage 19 entités
-- ============================================================
-- Hypothèse : les nouveaux shapefiles ont été importés dans :
--   audit.nv_limite (EPSG:4326, 19 polygones)
--   audit.nv_stream (EPSG:4326, 19 lignes)
-- À exécuter UNIQUEMENT après validation métier et backup complet.

BEGIN;

-- 1. Sauvegardes des couches actives
DROP TABLE IF EXISTS audit.gis_subbasin_shapes_backup_2026;
CREATE TABLE audit.gis_subbasin_shapes_backup_2026 AS
SELECT * FROM gis.subbasin_shapes;

DROP TABLE IF EXISTS audit.gis_reach_shapes_backup_2026;
CREATE TABLE audit.gis_reach_shapes_backup_2026 AS
SELECT * FROM gis.reach_shapes;

-- 2. Vider et recharger les couches actives depuis audit.nv_limite
TRUNCATE gis.subbasin_shapes;
INSERT INTO gis.subbasin_shapes (subbasin_id, catchment_id, subbasin_code, name, area_m2, source_attrs, geom, created_at)
SELECT
  subbasin::int AS subbasin_id,
  1 AS catchment_id,
  subbasin::int AS subbasin_code,
  COALESCE(NULLIF(bname, ''), 'Sous-bassin ' || subbasin::int) AS name,
  (shape_area * 10000)::double precision AS area_m2,
  jsonb_build_object(
    'source', 'NV-limite.shp',
    'area', area,
    'slo1', slo1,
    'len1', len1,
    'sll', sll,
    'csl', csl,
    'wid1', wid1,
    'dep1', dep1,
    'lat', lat,
    'long_', long_,
    'elev', elev,
    'elevmin', elevmin,
    'elevmax', elevmax,
    'hydroid', hydroid,
    'outletid', outletid
  ) AS source_attrs,
  ST_MakeValid(wkb_geometry) AS geom,
  NOW() AS created_at
FROM audit.nv_limite;

-- 3. Vider et recharger les couches actives depuis audit.nv_stream
TRUNCATE gis.reach_shapes;
INSERT INTO gis.reach_shapes (reach_id, reach_code, subbasin_id, catchment_id, length_m, slope_pct, source_attrs, geom, created_at)
SELECT
  subbasin::int AS reach_id,
  subbasin::int AS reach_code,
  subbasin::int AS subbasin_id,
  1 AS catchment_id,
  (shape_len * 1000)::double precision AS length_m,
  slo2::double precision AS slope_pct,
  jsonb_build_object(
    'source', 'NV-Stream.shp',
    'areac', areac,
    'len2', len2,
    'wid2', wid2,
    'dep2', dep2,
    'minel', minel,
    'maxel', maxel,
    'hydroid', hydroid,
    'outletid', outletid,
    'station', station
  ) AS source_attrs,
  ST_MakeValid(wkb_geometry) AS geom,
  NOW() AS created_at
FROM audit.nv_stream;

-- 4. Vérification
SELECT 'subbasin_shapes' AS layer, COUNT(*) AS n, COUNT(*) FILTER (WHERE ST_IsValid(geom)) AS valid
FROM gis.subbasin_shapes
UNION ALL
SELECT 'reach_shapes', COUNT(*), COUNT(*) FILTER (WHERE ST_IsValid(geom))
FROM gis.reach_shapes;

COMMIT;
