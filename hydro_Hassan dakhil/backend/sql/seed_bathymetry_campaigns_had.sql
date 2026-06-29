BEGIN;

DELETE FROM hydro.bathymetry_campaigns WHERE dam_code = 'HASSAN_ADDAKHIL';

INSERT INTO hydro.bathymetry_campaigns (
  dam_code, dam_name, measurement_year, campaign_year, normal_level_m,
  volume_mhm3, silted_since_previous_mhm3, annual_siltation_rate_mhm3,
  cumulative_silted_mhm3, source_file, source_sheet, source_row, metadata
) VALUES
  ('HASSAN_ADDAKHIL', 'HASSAN ADDAKHIL', 1990, 1990, 1122.2, 346.77904973333403, NULL, NULL, NULL, 'D:/3- Projets/hassanAddakhil/bathy_HAD.xlsx', 'Sheet1', 8, '{}'::jsonb),
  ('HASSAN_ADDAKHIL', 'HASSAN ADDAKHIL', 1999, 1999, 1122.2, 326.76361640000067, 20.015433333333362, 2.2239370370370404, 20.015433333333362, 'D:/3- Projets/hassanAddakhil/bathy_HAD.xlsx', 'Sheet1', 9, '{}'::jsonb),
  ('HASSAN_ADDAKHIL', 'HASSAN ADDAKHIL', 2004, 2004, 1122.2, 320.81722473333406, 5.946391666666614, 1.1892783333333228, 25.961824999999976, 'D:/3- Projets/hassanAddakhil/bathy_HAD.xlsx', 'Sheet1', 10, '{}'::jsonb),
  ('HASSAN_ADDAKHIL', 'HASSAN ADDAKHIL', 2008, 2008, 1122.2, 312.79157193333407, 8.025652799999989, 2.0064131999999972, 33.987477799999965, 'D:/3- Projets/hassanAddakhil/bathy_HAD.xlsx', 'Sheet1', 11, '{}'::jsonb),
  ('HASSAN_ADDAKHIL', 'HASSAN ADDAKHIL', 2013, 2014, 1122.2, 310.263595800001, 2.527976133333084, 0.5055952266666168, 36.51545393333305, 'D:/3- Projets/hassanAddakhil/bathy_HAD.xlsx', 'Sheet1', 12, '{"measurement_year_excel":2013,"campaign_year_display":2014,"mapping_note":"Excel year 2013 mapped to campaign 2014"}'::jsonb),
  ('HASSAN_ADDAKHIL', 'HASSAN ADDAKHIL', 2022, 2022, 1122.2, 287.5664121607314, 22.69718363926961, 2.521909293252179, 59.21263757260266, 'D:/3- Projets/hassanAddakhil/bathy_HAD.xlsx', 'Sheet1', 13, '{}'::jsonb);

COMMIT;
