# Baseline Database Avant Dump Final

Date : 2026-08-27
Horodatage baseline : 2026-08-27 17:02:00
Projet source : `D:\3- Projets\App_Hassan_Addakhil`
Base de reference release : `hydro_hd`

## 1. Source active retenue

- Hote applicatif effectivement utilise : `host.docker.internal`
- Port applicatif effectif : `5432`
- Base : `hydro_hd`
- Utilisateur : `postgres`
- Mot de passe : `***REDACTED***`
- Preuve applicative :
  - le conteneur backend actif `hydro-hassan-ilh0107-backend` expose `DB_HOST=host.docker.internal`
  - le backend actif ne pointe donc pas vers le service Compose `db`
  - la resolution DNS observee depuis le backend est `192.168.65.254`

## 2. Versions source

- PostgreSQL : `17.8`
- PostGIS : `3.5.3`
- Adresse serveur retournee par PostgreSQL : `127.0.0.1/32`
- Port serveur retourne par PostgreSQL : `5432`

## 3. Cohérence avec la baseline C4

Valeurs attendues avant generation du dump final :

- PostgreSQL `17.8`
- PostGIS `3.5.3`
- environ `79` tables
- environ `104` vues
- environ `1` vue materialisee

Valeurs relevees sur la vraie source active :

- tables : `79`
- vues : `104`
- vues materialisees : `1`

Conclusion : la source active retenue est coherente avec la baseline validee C4.

## 4. Schemas non systeme

- `access`
- `api`
- `audit`
- `auth`
- `core`
- `geo`
- `gis`
- `hydro`
- `old_hd`
- `public`
- `ref`
- `staging`
- `swat_setup`

## 5. Structure globale

- Tables : `79`
- Vues : `104`
- Vues materialisees : `1`
- Sequences : `50`
- Foreign tables : `13`

## 6. Extensions principales

- `pgcrypto` `1.3`
- `plpgsql` `1.0`
- `postgis` `3.5.3`
- `postgres_fdw` `1.1`

## 7. Tables et vues structurantes confirmees

Relations confirmees :

- `access.rch_results`
- `access.sub_results`
- `core.reaches`
- `core.stations`
- `core.subbasins`
- `public.stations` `VIEW`
- `public.timeseries` `VIEW`

Vues API principales confirmees :

- `api.mv_scenario_catalog` `MATERIALIZED VIEW`
- `api.v_catalog_properties`
- `api.v_catalog_stations`
- `api.v_timeseries_enriched`

## 8. Indicateurs non sensibles

- `core.stations` : `102`
- `core.reaches` : `33`
- `core.subbasins` : `33`
- `public.stations` : `102`
- `public.timeseries` : `383`

Observation :

- `core.scenarios` n'a pas ete trouvee sur la source active au moment du controle (`42P01`) ;
- cela n'empeche pas la coherence de la baseline structurelle, mais reste un point a signaler dans le rapport R1.

## 9. Point d'attention release

- le service Compose `db` existe localement, mais n'est pas la source active retenue pour R1 ;
- le dump final doit etre genere depuis la vraie base applicative active ci-dessus, et non depuis `hydro_hd.sql` ni automatiquement depuis le conteneur Compose `db`.
