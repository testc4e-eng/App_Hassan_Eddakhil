-- Controle des campagnes bathy_HAD.xlsx importees

SELECT
  measurement_year,
  campaign_year,
  ROUND(normal_level_m::numeric, 2) AS cote_normale_m,
  ROUND(volume_mhm3::numeric, 2) AS volume_mhm3,
  ROUND(silted_since_previous_mhm3::numeric, 2) AS envasement_periode_mhm3,
  ROUND(cumulative_silted_mhm3::numeric, 2) AS envasement_total_mhm3,
  source_file,
  metadata
FROM hydro.bathymetry_campaigns
WHERE dam_code = 'HASSAN_ADDAKHIL'
ORDER BY campaign_year;

SELECT
  bc.campaign_year AS fin_campagne,
  CONCAT(
    LAG(bc.campaign_year) OVER (ORDER BY bc.campaign_year),
    ' - ',
    bc.campaign_year
  ) AS periode,
  ROUND(bc.silted_since_previous_mhm3::numeric, 2) AS volume_barre_mhm3
FROM hydro.bathymetry_campaigns bc
WHERE dam_code = 'HASSAN_ADDAKHIL'
ORDER BY bc.campaign_year;
