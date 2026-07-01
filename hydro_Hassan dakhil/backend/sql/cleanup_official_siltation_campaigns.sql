-- Conserver uniquement les campagnes officielles Hassan Addakhil
-- 1990, 1999, 2004, 2008, 2014, 2022

DELETE FROM hydro.siltation_hsv
WHERE dam_code = 'HASSAN_ADDAKHIL'
  AND campaign_year NOT IN (1990, 1999, 2004, 2008, 2014, 2022);

SELECT campaign_year, COUNT(*) AS hsv_points
FROM hydro.siltation_hsv
WHERE dam_code = 'HASSAN_ADDAKHIL'
GROUP BY campaign_year
ORDER BY campaign_year;
