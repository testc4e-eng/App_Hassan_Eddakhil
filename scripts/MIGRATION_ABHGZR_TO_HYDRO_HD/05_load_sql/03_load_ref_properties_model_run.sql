-- 03_load_ref_properties_model_run.sql
-- Prepare observed properties/domains and default model run.
-- Non-destructive, idempotent.

BEGIN;

-- Domains (if absent)
INSERT INTO ref.property_domains (domain_code, label, description)
SELECT x.domain_code, x.label, x.description
FROM (
  VALUES
    ('CLIMATE', 'Climate', 'Climate variables'),
    ('HYDROLOGY', 'Hydrology', 'Hydrology variables'),
    ('RESERVOIR', 'Reservoir', 'Reservoir operation variables')
) AS x(domain_code, label, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM ref.property_domains d
  WHERE d.domain_code = x.domain_code
);

-- Properties (standard_name carries stable code)
INSERT INTO ref.observed_properties (name, unit, standard_name, description)
SELECT x.name, x.unit, x.standard_name, x.description
FROM (
  VALUES
    ('Precipitation', 'mm', 'PRECIPITATION', 'Daily or monthly precipitation'),
    ('Streamflow', 'm3/s', 'STREAMFLOW', 'Observed discharge'),
    ('Temperature Max', 'degC', 'TMAX', 'Maximum temperature'),
    ('Temperature Min', 'degC', 'TMIN', 'Minimum temperature'),
    ('Temperature Mean', 'degC', 'TMEAN', 'Mean temperature'),
    ('Humidity Relative', '%', 'HUMIDITY_REL', 'Relative humidity'),
    ('Evaporation', 'mm', 'EVAPORATION', 'Evaporation'),
    ('Wind Speed', 'm/s', 'WIND_SPEED', 'Mean wind speed'),
    ('Reservoir Inflow', 'm3', 'INFLOW_M3', 'Reservoir inflow'),
    ('Reservoir Restitution', 'm3', 'RESTITUTION_M3', 'Reservoir restitution')
) AS x(name, unit, standard_name, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM ref.observed_properties p
  WHERE upper(p.standard_name) = upper(x.standard_name)
);

-- Domain membership
INSERT INTO ref.property_domain_membership (
  property_id, domain_code, display_order, is_enabled, allow_observed, allow_simulated, default_agg
)
SELECT p.property_id,
       CASE
         WHEN p.standard_name IN ('PRECIPITATION','TMAX','TMIN','TMEAN','HUMIDITY_REL','EVAPORATION','WIND_SPEED') THEN 'CLIMATE'
         WHEN p.standard_name IN ('STREAMFLOW') THEN 'HYDROLOGY'
         WHEN p.standard_name IN ('INFLOW_M3','RESTITUTION_M3') THEN 'RESERVOIR'
         ELSE 'HYDROLOGY'
       END AS domain_code,
       100,
       true,
       true,
       true,
       'daily'
FROM ref.observed_properties p
WHERE p.standard_name IN (
  'PRECIPITATION','STREAMFLOW','TMAX','TMIN','TMEAN','HUMIDITY_REL',
  'EVAPORATION','WIND_SPEED','INFLOW_M3','RESTITUTION_M3'
)
AND NOT EXISTS (
  SELECT 1
  FROM ref.property_domain_membership m
  WHERE m.property_id = p.property_id
);

-- Default observed model run
INSERT INTO core.model_runs (scenario_code, scenario_name, description, is_observed)
SELECT 'OBSERVED', 'Observed', 'Observed data imported from bdd_erosion_abhgzr_20-04-26', true
WHERE NOT EXISTS (
  SELECT 1
  FROM core.model_runs r
  WHERE upper(r.scenario_code) = 'OBSERVED'
);

COMMIT;
