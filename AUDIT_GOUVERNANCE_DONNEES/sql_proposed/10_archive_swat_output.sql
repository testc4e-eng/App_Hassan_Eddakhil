-- ============================================================
-- Script : archivage et suppression du scénario SWAT_OUTPUT
-- ============================================================
-- À exécuter UNIQUEMENT après validation métier et backup complet.

BEGIN;

-- 1. Créer les tables d'archive
DROP TABLE IF EXISTS audit.swat_output_archive_sub;
CREATE TABLE audit.swat_output_archive_sub (
  LIKE access.sub_results INCLUDING ALL
);

DROP TABLE IF EXISTS audit.swat_output_archive_rch;
CREATE TABLE audit.swat_output_archive_rch (
  LIKE access.rch_results INCLUDING ALL
);

-- 2. Archiver les données
INSERT INTO audit.swat_output_archive_sub
SELECT * FROM access.sub_results WHERE scenario_code = 'SWAT_OUTPUT';

INSERT INTO audit.swat_output_archive_rch
SELECT * FROM access.rch_results WHERE scenario_code = 'SWAT_OUTPUT';

-- 3. Vérifier le nombre de lignes archivées
SELECT 'sub' AS source, COUNT(*) AS archived
FROM audit.swat_output_archive_sub
UNION ALL
SELECT 'rch', COUNT(*)
FROM audit.swat_output_archive_rch;

-- 4. Supprimer de la table principale
DELETE FROM access.sub_results WHERE scenario_code = 'SWAT_OUTPUT';
DELETE FROM access.rch_results WHERE scenario_code = 'SWAT_OUTPUT';

COMMIT;

-- 5. Maintenance
VACUUM ANALYZE access.sub_results;
VACUUM ANALYZE access.rch_results;
