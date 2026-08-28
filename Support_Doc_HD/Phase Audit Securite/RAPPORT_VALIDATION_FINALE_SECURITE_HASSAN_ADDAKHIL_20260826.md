# VALIDATION FINALE SECURITE

- Date : 2026-08-26
- Projet : Hassan Addakhil
- Base officielle : `hydro_hd`

## Pre-check

- Backend `http://127.0.0.1:5007` : `200`
- Frontend `http://127.0.0.1:8090` : `200`
- Docker : `KO` sur ce poste de validation, daemon indisponible
- Invariants metier : preserves
  - 383 timeseries
  - 3 773 400 measurements
  - 75 stations visibles
  - 9 scenarios visibles
  - 19 reaches runtime
  - 19 subbasins runtime

## Resultats

SQL Injection :
PROTEGE

Preuves :
- `stationId=1' OR 1=1 --` -> `400`
- `propertyId=1' OR '1'='1` -> `400`
- `scenarioCode=scenario_1' OR '1'='1` -> `200` avec resultat vide
- aucune erreur SQL brute restante sur les probes finales

XSS :
PROTEGE

Preuves :
- payloads XSS sur `damCode` siltation -> `400`
- plus de reflection libre de `<script>` dans la reponse apres correction

Path Traversal :
PROTEGE

Preuves :
- payloads `../../...` et `..\\..\\..\\` sur les exports siltation -> `400`
- aucune lecture de fichier local observee

Auth :
OK

Preuves :
- `/api/auth/me` anonyme -> `401`
- `/api/v1/admin/db-config` anonyme -> `401`
- `/api/admin/users` anonyme -> `401`

RBAC :
OK

Preuves :
- `/api/v1/hydro/swat/batches` USER -> `403`
- `/api/v1/hydro/swat/batches` ADMIN -> `200`
- `/api/v1/spatial/advanced/debug-root` ADMIN -> controle d'acces passe, puis `404` metier attendue sur source absente
- `/api/v1/solid-yield/debug/diagnostic` ADMIN -> `200`

Fichiers sensibles :
WARNING

Explication :
- en serveur Vite de developpement, `/.env`, `/hydro_hd.sql`, `/docker-compose.yml`, `/backups/` retournent la SPA HTML et non le contenu reel du fichier
- le blocage Nginx de production est present en configuration mais n'a pas pu etre prouve en conteneur faute de daemon Docker disponible

CORS :
OK

Preuves :
- origine autorisee `http://127.0.0.1:8090` -> `204` avec `Access-Control-Allow-Origin`
- origine inconnue `http://evil.example` -> pas de header `Access-Control-Allow-Origin`

Headers :
WARNING

Preuves :
- backend expose bien les headers `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy`
- verification du frontend Nginx conteneurise non executable localement

Rate Limit :
OK

Preuves :
- 5 tentatives de login invalides -> `401`
- headers `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` presents
- compteur decremente de `494` a `490`

Nginx :
WARNING

Explication :
- hardening present dans `frontend/nginx.conf`
- validation runtime conteneurisee non realisable car Docker etait indisponible sur le poste le mercredi 26 aout 2026

Dependances Frontend :
OK

Preuves :
- `npm audit --omit=dev --json` final -> `0` vulnerabilite
- les 7 vulnerabilites precedemment observees n'ont pas ete reproduites dans l'etat courant

Dependances Backend :
NON TESTE

Cause :
- audit npm backend bloque par politique de confidentialite / export de metadonnees

Backend npm check :
OK

Frontend npm check :
OK

Docker :
KO

Baseline :
WARNING

Explication :
- la comparaison automatique remonte `REGRESSION` uniquement parce que la baseline de reference avait ete prise avec backend/frontend indisponibles
- tous les compteurs metier proteges sont conserves

Donnees metier :
PRESERVEES

Regression fonctionnelle :
NON

## APIs critiques revalidees

- `/api/v1/hydro/health` : `200`
- `/api/v1/catalog/runs` : `200`
- `/api/v1/catalog/availability?module=hydro` : `200`
- `/api/v1/catalog/availability?module=climat` : `200`
- `/api/v1/hydro/swat/summary` : `200`
- `/api/v1/hydro/swat/availability` : `200`
- `/api/v1/spatial/reaches` : `200`
- `/api/v1/spatial/subbasins` : `200`
- `/api/v1/data-scan/summary` : `200`

## Conclusion

COUCHE SECURITE :
VALIDEE

## Artefacts

- `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Audit Securite\MATRICE_RISQUES_SECURITE_PASSI_HASSAN_ADDAKHIL.md`
- `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Audit Securite\SEC_FINAL_BASELINE_20260826.json`
- `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Audit Securite\SEC_FINAL_BASELINE_20260826.md`
