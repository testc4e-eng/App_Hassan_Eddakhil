-- ============================================================
-- Script de correction du mapping SWAT ↔ entités métier
-- ============================================================
-- Hypothèse : les codes SWAT 1..19 correspondent directement aux IDs 1..19.

BEGIN;

-- Sauvegarde
DROP TABLE IF EXISTS audit.swat_entity_map_backup_2026;
CREATE TABLE audit.swat_entity_map_backup_2026 AS
SELECT * FROM core.swat_entity_map;

-- Réinitialiser le mapping (mode identité)
TRUNCATE core.swat_entity_map;

INSERT INTO core.swat_entity_map (entity_type, swat_code, subbasin_id, reach_id, created_at, updated_at)
SELECT 'sub', s.swat_code, s.swat_code, NULL, NOW(), NOW()
FROM generate_series(1, 19) AS s(swat_code);

INSERT INTO core.swat_entity_map (entity_type, swat_code, subbasin_id, reach_id, created_at, updated_at)
SELECT 'rch', r.swat_code, r.swat_code, r.swat_code, NOW(), NOW()
FROM generate_series(1, 19) AS r(swat_code);

-- Vérification
SELECT entity_type, COUNT(*), MIN(swat_code), MAX(swat_code),
       COUNT(DISTINCT subbasin_id) AS distinct_sub, COUNT(DISTINCT reach_id) AS distinct_rch
FROM core.swat_entity_map
GROUP BY entity_type;

COMMIT;
