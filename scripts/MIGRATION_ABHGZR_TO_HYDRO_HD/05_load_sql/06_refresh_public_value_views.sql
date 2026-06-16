-- 06_refresh_public_value_views.sql
-- Rebind public thematic value views to observed_properties.standard_name
-- instead of hard-coded property_id values.
-- Non-destructive: CREATE OR REPLACE VIEW only.

CREATE OR REPLACE VIEW public.v_values_precipitation_annual AS
SELECT * FROM public.v_values_annual
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'PRECIPITATION'
);

CREATE OR REPLACE VIEW public.v_values_precipitation_monthly AS
SELECT * FROM public.v_values_monthly
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'PRECIPITATION'
);

CREATE OR REPLACE VIEW public.v_values_precipitation_obs AS
SELECT * FROM public.v_values_measurements
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'PRECIPITATION'
)
  AND is_observed = true
  AND source_type = 'observed';

CREATE OR REPLACE VIEW public.v_values_streamflow_annual AS
SELECT * FROM public.v_values_annual
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'STREAMFLOW'
);

CREATE OR REPLACE VIEW public.v_values_streamflow_monthly AS
SELECT * FROM public.v_values_monthly
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'STREAMFLOW'
);

CREATE OR REPLACE VIEW public.v_values_streamflow_obs AS
SELECT * FROM public.v_values_measurements
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'STREAMFLOW'
)
  AND is_observed = true
  AND source_type = 'observed';

CREATE OR REPLACE VIEW public.v_values_temperature_max_annual AS
SELECT * FROM public.v_values_annual
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'TMAX'
);

CREATE OR REPLACE VIEW public.v_values_temperature_max_monthly AS
SELECT * FROM public.v_values_monthly
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'TMAX'
);

CREATE OR REPLACE VIEW public.v_values_temperature_max_obs AS
SELECT * FROM public.v_values_measurements
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'TMAX'
)
  AND is_observed = true
  AND source_type = 'observed';

CREATE OR REPLACE VIEW public.v_values_temperature_min_annual AS
SELECT * FROM public.v_values_annual
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'TMIN'
);

CREATE OR REPLACE VIEW public.v_values_temperature_min_monthly AS
SELECT * FROM public.v_values_monthly
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'TMIN'
);

CREATE OR REPLACE VIEW public.v_values_temperature_min_obs AS
SELECT * FROM public.v_values_measurements
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'TMIN'
)
  AND is_observed = true
  AND source_type = 'observed';

CREATE OR REPLACE VIEW public.v_values_temperature_mean_annual AS
SELECT * FROM public.v_values_annual
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'TMEAN'
);

CREATE OR REPLACE VIEW public.v_values_temperature_mean_monthly AS
SELECT * FROM public.v_values_monthly
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'TMEAN'
);

CREATE OR REPLACE VIEW public.v_values_temperature_mean_obs AS
SELECT * FROM public.v_values_measurements
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'TMEAN'
)
  AND is_observed = true
  AND source_type = 'observed';

CREATE OR REPLACE VIEW public.v_values_temperature_all_obs AS
SELECT * FROM public.v_values_measurements
WHERE property_id IN (
  SELECT property_id
  FROM ref.observed_properties
  WHERE upper(standard_name) IN ('TMAX', 'TMIN', 'TMEAN')
)
  AND is_observed = true
  AND source_type = 'observed';

CREATE OR REPLACE VIEW public.v_values_wind_speed_annual AS
SELECT * FROM public.v_values_annual
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'WIND_SPEED'
);

CREATE OR REPLACE VIEW public.v_values_wind_speed_monthly AS
SELECT * FROM public.v_values_monthly
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'WIND_SPEED'
);

CREATE OR REPLACE VIEW public.v_values_wind_speed_obs AS
SELECT * FROM public.v_values_measurements
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'WIND_SPEED'
)
  AND is_observed = true
  AND source_type = 'observed';

CREATE OR REPLACE VIEW public.v_values_humidity_annual AS
SELECT * FROM public.v_values_annual
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'HUMIDITY_REL'
);

CREATE OR REPLACE VIEW public.v_values_humidity_monthly AS
SELECT * FROM public.v_values_monthly
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'HUMIDITY_REL'
);

CREATE OR REPLACE VIEW public.v_values_humidity_obs AS
SELECT * FROM public.v_values_measurements
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'HUMIDITY_REL'
)
  AND is_observed = true
  AND source_type = 'observed';

CREATE OR REPLACE VIEW public.v_values_evaporation_annual AS
SELECT * FROM public.v_values_annual
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'EVAPORATION'
);

CREATE OR REPLACE VIEW public.v_values_evaporation_monthly AS
SELECT * FROM public.v_values_monthly
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'EVAPORATION'
);

CREATE OR REPLACE VIEW public.v_values_evaporation_obs AS
SELECT * FROM public.v_values_measurements
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'EVAPORATION'
)
  AND is_observed = true
  AND source_type = 'observed';

CREATE OR REPLACE VIEW public.v_values_lachers_annual AS
SELECT * FROM public.v_values_annual
WHERE property_id IN (
  SELECT property_id
  FROM ref.observed_properties
  WHERE upper(standard_name) IN ('INFLOW_M3', 'RESTITUTION_M3')
);

CREATE OR REPLACE VIEW public.v_values_lachers_monthly AS
SELECT * FROM public.v_values_monthly
WHERE property_id IN (
  SELECT property_id
  FROM ref.observed_properties
  WHERE upper(standard_name) IN ('INFLOW_M3', 'RESTITUTION_M3')
);

CREATE OR REPLACE VIEW public.v_values_lachers_obs AS
SELECT * FROM public.v_values_measurements
WHERE property_id IN (
  SELECT property_id
  FROM ref.observed_properties
  WHERE upper(standard_name) IN ('INFLOW_M3', 'RESTITUTION_M3')
)
  AND is_observed = true
  AND source_type = 'observed';

CREATE OR REPLACE VIEW public.v_values_sediment_load_annual AS
SELECT * FROM public.v_values_annual
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'SEDIMENT_LOAD'
);

CREATE OR REPLACE VIEW public.v_values_sediment_load_monthly AS
SELECT * FROM public.v_values_monthly
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'SEDIMENT_LOAD'
);

CREATE OR REPLACE VIEW public.v_values_sediment_load_obs AS
SELECT * FROM public.v_values_measurements
WHERE property_id IN (
  SELECT property_id FROM ref.observed_properties WHERE upper(standard_name) = 'SEDIMENT_LOAD'
)
  AND is_observed = true
  AND source_type = 'observed';
