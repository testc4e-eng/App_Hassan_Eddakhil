-- Verification Access raw tables (Etat actuel only)
SELECT scenario_code, COUNT(*) AS sub_rows
FROM access.sub_results
WHERE scenario_code IN ('etat_actuel', 'etat_actuel_monthly', 'etat_actuel_annual')
GROUP BY scenario_code
ORDER BY scenario_code;

SELECT scenario_code, COUNT(*) AS rch_rows
FROM access.rch_results
WHERE scenario_code IN ('etat_actuel', 'etat_actuel_monthly', 'etat_actuel_annual')
GROUP BY scenario_code
ORDER BY scenario_code;

SELECT scenario_code,
       MIN(period_date) AS min_date,
       MAX(period_date) AS max_date,
       MIN(syld_t_ha) AS min_syldt,
       MAX(syld_t_ha) AS max_syldt
FROM access.sub_results
WHERE scenario_code = 'etat_actuel'
GROUP BY scenario_code;

SELECT scenario_code,
       MIN(period_date) AS min_date,
       MAX(period_date) AS max_date,
       MIN(flow_out_cms) AS min_flow_out,
       MAX(flow_out_cms) AS max_flow_out,
       MIN(sed_out_tons) AS min_sed_out,
       MAX(sed_out_tons) AS max_sed_out
FROM access.rch_results
WHERE scenario_code = 'etat_actuel'
GROUP BY scenario_code;

-- Verification in timeseries catalog (core simulated data for etat_actuel)
SELECT scenario_code, standard_name, time_step, COUNT(*) AS series_count, SUM(n_points) AS points
FROM public.v_ts_catalog_enriched
WHERE source_type = 'simulated'
  AND scenario_code = 'etat_actuel'
  AND standard_name IN ('SWAT_SYLDT_HA', 'SWAT_SED_TONS', 'SWAT_FLOW_M3S')
GROUP BY scenario_code, standard_name, time_step
ORDER BY standard_name, time_step;
