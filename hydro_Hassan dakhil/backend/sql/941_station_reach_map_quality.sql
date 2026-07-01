-- Quality checks for station <-> reach secondary mapping

-- 1) Global coverage
SELECT
  count(*) FILTER (WHERE s.station_code NOT LIKE 'swat_%') AS observed_stations_total,
  count(*) FILTER (WHERE s.station_code NOT LIKE 'swat_%' AND s.geom IS NOT NULL) AS observed_with_geom,
  count(*) FILTER (
    WHERE s.station_code NOT LIKE 'swat_%'
      AND EXISTS (
        SELECT 1
        FROM core.station_reach_map m
        WHERE m.station_id = s.station_id
          AND m.is_active = true
          AND m.is_primary = true
      )
  ) AS observed_mapped_primary
FROM core.stations s;

-- 2) Mapping quality bands
SELECT
  CASE
    WHEN m.distance_m <= 1000 THEN 'high(<=1km)'
    WHEN m.distance_m <= 5000 THEN 'good(<=5km)'
    WHEN m.distance_m <= 10000 THEN 'medium(<=10km)'
    WHEN m.distance_m <= 25000 THEN 'low(<=25km)'
    ELSE 'out_of_scope'
  END AS quality_band,
  count(*) AS n
FROM core.station_reach_map m
WHERE m.is_active = true
GROUP BY 1
ORDER BY 1;

-- 3) Stations still without mapping
SELECT
  s.station_id,
  s.station_code,
  s.name,
  s.geom IS NOT NULL AS has_geom
FROM core.stations s
WHERE s.station_code NOT LIKE 'swat_%'
  AND NOT EXISTS (
    SELECT 1
    FROM core.station_reach_map m
    WHERE m.station_id = s.station_id
      AND m.is_active = true
      AND m.is_primary = true
  )
ORDER BY s.station_code;

-- 4) Dashboard-ready simulated availability by mapped stations (hydro)
SELECT
  c.station_id,
  c.station_code,
  c.station_name,
  c.property_name,
  c.scenario_code,
  c.source_type,
  c.start_date,
  c.end_date,
  c.n_points
FROM (
  SELECT
    c.ts_id,
    m.station_id,
    rs.station_code,
    rs.name AS station_name,
    c.property_name,
    c.scenario_code,
    c.source_type,
    c.start_date,
    c.end_date,
    c.n_points
  FROM public.v_ts_catalog_enriched c
  JOIN core.stations sw
    ON sw.station_id = c.station_id
  JOIN core.station_reach_map m
    ON m.is_active = true
   AND m.is_primary = true
   AND (
     (m.simulated_station_id IS NOT NULL AND m.simulated_station_id = sw.station_id)
     OR sw.station_code = ('swat_rch_' || m.reach_id::text)
   )
  JOIN core.stations rs
    ON rs.station_id = m.station_id
  WHERE c.source_type = 'simulated'
    AND c.standard_name IN ('SWAT_FLOW_M3S', 'SWAT_SED_TONS')
) c
ORDER BY c.station_code, c.property_name;

