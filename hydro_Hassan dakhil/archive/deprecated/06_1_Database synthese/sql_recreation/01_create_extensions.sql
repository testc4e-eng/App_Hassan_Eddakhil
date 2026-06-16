-- Extensions and FDW setup
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgres_fdw";

CREATE SERVER "old_hd_srv" FOREIGN DATA WRAPPER "postgres_fdw" OPTIONS (dbname 'bd_hassdakh', host 'localhost', port '5432');
CREATE USER MAPPING FOR "postgres" SERVER "old_hd_srv" OPTIONS (password '<redacted>', user 'postgres');
