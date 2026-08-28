# Rapport R3-RETEST Installation ZIZ v1.0.0

Date : 2026-08-28  
Projet testé : `D:\3- Projets\App_Hassan_Addakhil`  
Dossier de préparation : `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ`  
Projet Docker isolé : `hassan-ziz-r3-retest-20260828`

## 1. Contexte du premier échec R3

Le premier test R3 avait échoué à cause d'objets FDW legacy encore présents dans le dump de livraison. Les éléments bloquants identifiés étaient :

- `old_hd_srv`
- `USER MAPPING postgres -> old_hd_srv`
- des foreign tables legacy du schéma `old_hd`
- des références FDW sensibles associées

## 2. Correctif R3-FIX

Le correctif R3-FIX a produit un nouveau dump officiel assaini :

- dump retenu : `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump`
- taille : `528313425` octets
- SHA256 officiel : `1f33e0e4295c74edf0ae4dcfaa82196e589e7029db985ecb1e1459ba55f2cbd1`
- ancien dump `hydro_hd_v1.0.0.blocked_fdw.dump` conservé uniquement comme historique, non utilisé

Le contrôle `pg_restore --list` du dump assaini confirme l'absence de `old_hd_srv`, `USER MAPPING`, `FOREIGN TABLE old_hd`, `postgres_fdw` et `SCHEMA - old_hd`.

## 3. Artefacts testés

- Compose officiel : `LIVRAISON_ZIZ/02_DOCKER/compose/docker-compose.ziz.yml`
- Configuration de référence : `LIVRAISON_ZIZ/04_CONFIGURATION/env/env.ziz.example`
- Image backend : `hassan-addakhil-backend:1.0.0` -> `sha256:57b8003501fe797d3420112206c620fedf31ea7bab85173c8751b2efe87fb63d`
- Image frontend : `hassan-addakhil-frontend:1.0.0` -> `sha256:134dc3d6b72b00d0404f4271fb46d6149d1059063b795a11bed84c398f2df9b1`
- Image base de données : `postgis/postgis:17-3.5` -> `sha256:71f7e60358fb03d3f157b9ea34516e8152394752ec7a01b3f9eb293d3aead29e`

Le Compose officiel a été utilisé tel quel. Aucune copie temporaire n'a été nécessaire, car il ne contient pas de `container_name` fixe bloquant l'isolation parallèle.

## 4. Checksum

Le SHA256 recalculé du dump `hydro_hd_v1.0.0.dump` correspond exactement à la valeur officielle attendue :

`1f33e0e4295c74edf0ae4dcfaa82196e589e7029db985ecb1e1459ba55f2cbd1`

## 5. DB

Le test a été exécuté avec :

- un project name dédié : `hassan-ziz-r3-retest-20260828`
- un nouveau volume : `hassan-ziz-r3-retest-20260828_hydro_hd_pgdata`
- un port frontend libre : `18090`
- un `.env` temporaire spécifique au test, supprimé en fin d'exécution

La DB a été démarrée seule, puis validée `healthy` avant toute restauration.

Versions observées :

- PostgreSQL : `17.5 (Debian 17.5-1.pgdg110+1)`
- PostGIS : `POSTGIS="3.5.2 dea6d0a" [EXTENSION] PGSQL="170" ...`

## 6. Restore

La restauration a été faite exclusivement depuis `hydro_hd_v1.0.0.dump` avec la méthode portable validée :

- `--clean`
- `--if-exists`
- `--no-owner`
- `--no-privileges`
- `--exit-on-error`

Le restore a poursuivi jusqu'aux vérifications post-restore et aux tests applicatifs, ce qui valide un résultat exploitable sans erreur bloquante.

## 7. Structure

Après restauration :

- `79` tables
- `104` vues
- `1` vue matérialisée

Objets essentiels confirmés :

- `access.rch_results`
- `access.sub_results`
- `core.reaches`
- `core.stations`
- `core.subbasins`
- `public.stations`
- `public.timeseries`
- `api.mv_scenario_catalog`
- `api.v_catalog_properties`
- `api.v_catalog_stations`
- `api.v_timeseries_enriched`

## 8. FDW

Contrôle après restore dans la DB R3-RETEST :

- `old_hd_srv` absent
- `USER MAPPING` legacy : `0`
- schéma `old_hd` legacy absent
- foreign tables legacy : `0`

Aucune dépendance runtime vers l'ancien serveur n'a été observée.

## 9. Backend

Le backend a été démarré après restauration et est devenu `healthy` en `6.43 s`.

Contrôles runtime non sensibles :

- `NODE_ENV=production`
- `DB_HOST=db`
- `DB_PORT=5432`
- `DB_NAME=hydro_hd`
- `HDI_DB_NAME=hydro_hd`
- `HASSAN_DATA_ROOT=`

Contrôle d'isolation :

- verdict runtime : `db:5432`
- hits interdits : `0` pour `host.docker.internal`, `192.168.65.254`, `127.0.0.1:5432`

## 10. API

Le health backend a confirmé `database=connected`.

| Endpoint | HTTP | Données | Verdict |
| --- | ---: | --- | --- |
| `/api/v1/hydro/health` | 200 | `database:connected` | OK |
| `/api/v1/hydro/test/stations?limit=5` | 200 | `data:5` | OK |
| `/api/v1/spatial/reaches` | 200 | `keys:success,data` | OK |
| `/api/v1/spatial/subbasins` | 200 | `keys:success,data` | OK |
| `/api/v1/catalog/availability?module=hydro` | 200 | `data:45` | OK |

## 11. Frontend

Le frontend a été démarré après backend et est devenu `healthy` en `6.42 s`.

Contrôles HTTP :

- `http://127.0.0.1:18090/` -> HTTP `200`
- asset JS principal servi : `/assets/index-jl-zTVVL.js` -> HTTP `200`, `977093` octets
- asset CSS principal servi : `/assets/index-Ci8kVJMB.css` -> HTTP `200`, `116619` octets

## 12. Proxy

Le proxy Nginx frontend a correctement relayé l'API :

- `/api/v1/hydro/health` via frontend -> HTTP `200`, `database=connected`
- `/api/v1/hydro/test/stations?limit=5` via frontend -> HTTP `200`, `5` enregistrements

Le chemin de bout en bout navigateur -> frontend nginx -> `/api` -> backend -> DB est validé.

## 13. Restart

Restart DB uniquement :

- DB `healthy` en `6.42 s`
- backend reconnecté en `0.48 s`
- proxy final `database=connected`

Restart backend uniquement :

- backend `healthy` en `6.48 s`
- backend reconnecté en `0.48 s`
- proxy final `database=connected`

Restart frontend uniquement :

- frontend `healthy` en `6.52 s`
- HTTP revenu immédiatement
- proxy final `database=connected`

Restart stack complet :

- frontend `healthy` en `5.30 s`
- DB `healthy` en `7.40 s`
- backend `healthy` en `7.51 s`
- proxy final `database=connected`

Aucune intervention manuelle n'a été nécessaire.

Réserve observée :

- l'ordre strict `db -> backend -> frontend` n'est pas reflété par les healthchecks Docker
- le frontend passe `healthy` avant la DB et le backend car son healthcheck ne valide que la page statique Nginx
- le chemin applicatif complet redevient néanmoins opérationnel une fois DB et backend revenus, ce que confirme le proxy final `database=connected`

## 14. Persistance

Le test de persistance a été exécuté avec `docker compose down` sans `-v`, puis `docker compose up -d`.

Résultats :

- DB revenue `healthy`
- backend revenu `healthy`
- frontend revenu `healthy` en `6.41 s`
- backend reconnecté en `0.51 s`
- proxy final `database=connected`

Compteurs métier après redémarrage complet :

- `core.stations = 102`
- `core.reaches = 33`
- `core.subbasins = 33`
- `public.stations = 102`
- `public.timeseries = 383`

La base n'a pas été réinitialisée.

## 15. Logs

Contrôle des politiques :

- `db` -> `RestartPolicy=unless-stopped`, logs `json-file`, `max-size=10m`, `max-file=3`
- `backend` -> `RestartPolicy=unless-stopped`, logs `json-file`, `max-size=10m`, `max-file=3`
- `frontend` -> `RestartPolicy=unless-stopped`, logs `json-file`, `max-size=10m`, `max-file=3`

Analyse des logs sur les motifs `FATAL`, `ERROR`, `Unhandled`, `panic`, `permission denied`, `connection refused`, `old_hd_srv`, `USER MAPPING`, `host.docker.internal`, `192.168.65.254` :

- DB : `0` hit
- Backend : `0` hit
- Frontend : `0` hit

## 16. Isolation

Le test confirme :

- aucune utilisation du vrai `.env`
- aucune utilisation de `host.docker.internal`
- aucune utilisation de `192.168.65.254`
- aucune dépendance à `127.0.0.1:5432`
- runtime DB = `db:5432` uniquement
- aucun bind mount applicatif côté backend
- aucun bind mount applicatif côté frontend
- DB attachée uniquement à un volume Docker nommé

Conclusion d'isolation :

`INSTALLATION POSSIBLE SANS CODE SOURCE : OUI`

## 17. Nettoyage

Ressources temporaires observées avant nettoyage :

- conteneurs :
  - `3cd65042fe1c` `hassan-ziz-r3-retest-20260828-frontend-1`
  - `5ff50b417e35` `hassan-ziz-r3-retest-20260828-backend-1`
  - `5f647c7261e1` `hassan-ziz-r3-retest-20260828-db-1`
- réseau : `4962af6feecb` `hassan-ziz-r3-retest-20260828_default`
- volume : `hassan-ziz-r3-retest-20260828_hydro_hd_pgdata`
- fichiers temporaires :
  - `R3_RETEST/work/.env.r3.retest`
  - `R3_RETEST/work/pg_restore_r3_retest.log`
  - `R3_RETEST/work/r3_retest_summary.json`

Nettoyage effectué :

- `docker compose down` sur le projet `hassan-ziz-r3-retest-20260828`
- suppression du volume `hassan-ziz-r3-retest-20260828_hydro_hd_pgdata`
- suppression des trois fichiers temporaires du dossier `work`

État final :

- plus aucun conteneur `R3-RETEST`
- plus aucun réseau `R3-RETEST`
- plus aucun volume `R3-RETEST`
- dossier `LIVRAISON_ZIZ/07_TESTS_VALIDATION/R3_RETEST/work/` vide

## 18. Verdict

Contrôles finaux :

- branche Git inchangée : `ilh_dev_20-07`
- HEAD inchangé : `ef62eae98af1c9991ee2287b969cf53f2051db88`
- aucun `git add`, `git commit`, `git push`, `git reset`, `git clean`
- stack principal observé avant/après avec les mêmes IDs :
  - backend `db56353b99da1204288a20d2db6cf69b66b6a1050249794a5942d8d2c561506a`
  - frontend `3434b071d1d1d1dbff352737503c1484f990a4e0bdd7f82afac07ee040e2e2eb`
  - DB `1deca1cd7fbc353099dba03e341b77df9eaff1824696d6928f1502ea9b51f3a4`

Verdict :

`R3-RETEST VALIDÉ`

La release Ziz v1.0.0 est installable dans un environnement Docker neuf, isolé, sans dépendance au code source local, en utilisant uniquement les images officielles, le Compose officiel, une configuration dédiée et le dump assaini `hydro_hd_v1.0.0.dump`.

Point d'attention non bloquant :

- le healthcheck frontend actuel valide la disponibilité de Nginx avant la disponibilité complète de la chaîne `DB -> backend -> proxy`
