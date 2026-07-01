-- Verification des campagnes officielles Hassan Addakhil
-- Campagnes attendues: 1990, 1999, 2004, 2008, 2014, 2022

SELECT
  campaign_year,
  COUNT(*) AS hsv_points,
  MIN(level_m) AS cote_min,
  MAX(level_m) AS cote_max,
  MAX(volume_mhm3) AS volume_max_mhm3
FROM hydro.siltation_hsv
WHERE dam_code = 'HASSAN_ADDAKHIL'
GROUP BY campaign_year
ORDER BY campaign_year;

SELECT
  CASE
    WHEN campaign_year = 2014 THEN 'OK - campagne 2014 presente'
    ELSE 'autre campagne'
  END AS statut_2014,
  COUNT(*) AS points
FROM hydro.siltation_hsv
WHERE dam_code = 'HASSAN_ADDAKHIL'
  AND campaign_year = 2014
GROUP BY campaign_year;

SELECT year, annual_silted_mhm3, cumulative_silted_mhm3
FROM hydro.siltation_evolution
WHERE dam_code = 'HASSAN_ADDAKHIL'
  AND year IN (1990, 1999, 2004, 2008, 2014, 2022, 2000, 2005, 2009)
ORDER BY year;
