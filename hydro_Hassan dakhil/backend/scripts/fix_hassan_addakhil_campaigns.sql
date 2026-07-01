BEGIN;

WITH updated AS (
  SELECT
    evolution_id,
    year,
    CASE
      WHEN year BETWEEN 1990 AND 1998 THEN 2.223937
      WHEN year BETWEEN 1999 AND 2003 THEN 1.854416
      WHEN year BETWEEN 2004 AND 2007 THEN 1.888193
      WHEN year BETWEEN 2008 AND 2013 THEN 1.587628
      WHEN year BETWEEN 2014 AND 2021 THEN 1.850395
      WHEN year >= 2022 THEN 1.850395
      ELSE annual_rate_mhm3
    END::double precision AS annual_value
  FROM hydro.siltation_evolution
  WHERE dam_code = 'HASSAN_ADDAKHIL'
),
recalc AS (
  SELECT
    evolution_id,
    annual_value,
    SUM(annual_value) OVER (ORDER BY year ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_value
  FROM updated
)
UPDATE hydro.siltation_evolution e
SET annual_rate_mhm3 = r.annual_value,
    annual_silted_mhm3 = r.annual_value,
    cumulative_silted_mhm3 = r.cumulative_value,
    updated_at = now()
FROM recalc r
WHERE e.evolution_id = r.evolution_id;

COMMIT;
