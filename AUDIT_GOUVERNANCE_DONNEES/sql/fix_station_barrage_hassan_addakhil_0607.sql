-- Migration : correction de la station "Aval Barrage Hassan Addakhil"
-- Objectif : renommer la station et la positionner exactement sur le barrage Hassan Addakhil
-- Date : 2026-06-19
-- Auteur : C4E Africa

BEGIN;

-- 1. Identifier la station cible (code 1940/48)
DO $$
DECLARE
    v_station_id INTEGER;
    v_reservoir_geom GEOMETRY(Point, 4326);
BEGIN
    SELECT station_id INTO v_station_id
    FROM core.stations
    WHERE station_code = '1940/48'
      AND lower(name) LIKE '%aval%addak%'
    LIMIT 1;

    IF v_station_id IS NULL THEN
        RAISE EXCEPTION 'Station cible non trouvée (code 1940/48, nom contenant AVAL ADDAK)';
    END IF;

    -- 2. Récupérer la géométrie de référence du barrage depuis core.reservoirs
    SELECT geom INTO v_reservoir_geom
    FROM core.reservoirs
    WHERE reservoir_code = '1940/48'
      AND lower(name) LIKE '%hassan%addak%'
    LIMIT 1;

    IF v_reservoir_geom IS NULL THEN
        RAISE EXCEPTION 'Géométrie du barrage non trouvée dans core.reservoirs (code 1940/48)';
    END IF;

    -- 3. Mettre à jour la station : nom + coordonnées + éventuellement le bassin versant
    UPDATE core.stations
    SET name   = 'Barrage Hassan Addakhil',
        geom   = v_reservoir_geom,
        catchment_id = COALESCE(catchment_id, 1)  -- préserver/valoriser le bassin versant principal
    WHERE station_id = v_station_id;

    RAISE NOTICE 'Station % mise à jour : nom = %, geom = %', v_station_id, 'Barrage Hassan Addakhil', ST_AsText(v_reservoir_geom);
END $$;

-- 4. Vérification post-migration
SELECT station_id,
       station_code,
       name,
       ST_AsText(geom) AS geom_wkt,
       ST_X(geom) AS longitude,
       ST_Y(geom) AS latitude,
       catchment_id,
       reach_id
FROM core.stations
WHERE station_code = '1940/48'
  AND lower(name) LIKE '%hassan%addak%';

COMMIT;
