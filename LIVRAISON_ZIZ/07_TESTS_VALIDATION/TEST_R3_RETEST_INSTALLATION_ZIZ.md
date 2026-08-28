# Matrice de validation R3-RETEST Installation ZIZ

Date : 2026-08-28  
Projet Docker de test : `hassan-ziz-r3-retest-20260828`  
Compose utilisé : `LIVRAISON_ZIZ/02_DOCKER/compose/docker-compose.ziz.yml`  
Port frontend de test : `18090`

| Test | Résultat | Preuve |
| --- | --- | --- |
| Images v1.0.0 | OK | Backend `sha256:57b8003501fe797d3420112206c620fedf31ea7bab85173c8751b2efe87fb63d`, frontend `sha256:134dc3d6b72b00d0404f4271fb46d6149d1059063b795a11bed84c398f2df9b1`, DB `sha256:71f7e60358fb03d3f157b9ea34516e8152394752ec7a01b3f9eb293d3aead29e` |
| Nouveau SHA256 | OK | `hydro_hd_v1.0.0.dump` = `1f33e0e4295c74edf0ae4dcfaa82196e589e7029db985ecb1e1459ba55f2cbd1` |
| old_hd_srv absent dump | OK | Contrôle `pg_restore --list` assaini : `old_hd_srv`, `USER MAPPING`, `old_hd`, `postgres_fdw` absents |
| DB healthy | OK | Conteneur `hassan-ziz-r3-retest-20260828-db-1` démarré et `healthy` sur volume dédié `hassan-ziz-r3-retest-20260828_hydro_hd_pgdata` |
| Restore | OK | Restore du dump officiel avec `pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error`, exécution poursuivie jusqu'aux contrôles post-restore |
| Structure DB | OK | `79` tables, `104` vues, `1` vue matérialisée |
| Indicateurs métier | OK | `core.stations=102`, `core.reaches=33`, `core.subbasins=33`, `public.stations=102`, `public.timeseries=383` |
| FDW absent après restore | OK | `old_hd_srv` absent, `USER MAPPING` legacy = `0`, schéma `old_hd` absent, foreign tables legacy = `0` |
| Backend healthy | OK | Backend `healthy` en `6.43 s` |
| DB connected | OK | `/api/v1/hydro/health` retourne `database=connected` |
| API stations | OK | `GET /api/v1/hydro/test/stations?limit=5` = HTTP `200`, `data:5` |
| API reaches | OK | `GET /api/v1/spatial/reaches` = HTTP `200` |
| API subbasins | OK | `GET /api/v1/spatial/subbasins` = HTTP `200` |
| Frontend healthy | OK | Frontend `healthy` en `6.42 s` |
| HTTP frontend | OK | `http://127.0.0.1:18090/` = HTTP `200` |
| Proxy Nginx | OK | Proxy `/api/v1/hydro/health` et `/api/v1/hydro/test/stations?limit=5` = HTTP `200` |
| Restart DB | OK | DB `healthy` en `6.42 s`, backend reconnecté en `0.48 s`, proxy `database=connected` |
| Restart backend | OK | Backend `healthy` en `6.48 s`, reconnecté en `0.48 s`, proxy OK |
| Restart frontend | OK | Frontend `healthy` en `6.52 s`, HTTP de nouveau accessible, proxy OK |
| Restart stack | OK avec réserve | Reprise complète OK ; frontend `healthy` avant DB/backend (`5.30 s`, `7.40 s`, `7.51 s`) car son healthcheck valide la page statique, proxy final `database=connected` |
| Persistance | OK | `docker compose down` sans `-v` puis `up -d` : données conservées, compteurs inchangés |
| Restart policy | OK | `unless-stopped` sur `db`, `backend`, `frontend` |
| Logs rotation | OK | Driver `json-file`, `max-size=10m`, `max-file=3` sur les trois services |
| Aucune DB host | OK | Verdict runtime `db:5432`, aucun hit `host.docker.internal`, `192.168.65.254`, `127.0.0.1:5432` |
| Aucun bind mount source | OK | Backend `0` mount, frontend `0` mount, DB via volume Docker nommé uniquement |

Installation possible sans code source : **OUI**  
Nettoyage final effectué : **OUI**  
`R3_RETEST/work` vide après nettoyage : **OUI**
