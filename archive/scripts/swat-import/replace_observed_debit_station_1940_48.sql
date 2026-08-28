BEGIN;

CREATE TEMP TABLE tmp_apport_hassan (
  date date NOT NULL,
  value double precision NOT NULL
);

\copy tmp_apport_hassan(date, value) FROM 'D:/3- Projets/hassanAddakhil/scripts/swat-import/work/apport_hassan_addakhil_observed.csv' WITH (FORMAT csv, HEADER true)

DELETE FROM core.measurements
WHERE ts_id = 151
  AND datetime::date BETWEEN DATE '1995-01-01' AND DATE '2023-08-31';

INSERT INTO core.measurements (ts_id, datetime, value, quality_flag)
SELECT
  151 AS ts_id,
  (t.date::timestamp AT TIME ZONE 'UTC') AS datetime,
  t.value,
  NULL::smallint AS quality_flag
FROM tmp_apport_hassan t
WHERE t.date BETWEEN DATE '1995-01-01' AND DATE '2023-08-31'
ON CONFLICT (ts_id, datetime) DO UPDATE
SET value = EXCLUDED.value;

COMMIT;

