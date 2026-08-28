# CLOTURE PERFORMANCE / CONFIG-SEC

- Date : 2026-08-26
- Base officielle : `hydro_hd`
- Backend Docker : `http://127.0.0.1:5007`
- Frontend Docker : `http://127.0.0.1:8090`

JWT :
OK

Notes JWT :
- `JWT_SECRET` local renforce dans `.env` racine
- longueur finale : `64`
- placeholder-like : `NON`
- non present dans le frontend : `OUI`
- non versionne Git : `OUI`
- duplication recreee dans `backend/.env` : `NON`

Secrets Git :
0

Secrets frontend :
0

Warmup :
OK

Details warmup :
- warmup backend non bloquant : `OUI`
- cold start `solid-yield` dans cette cloture : `274.79 ms`
- warm `solid-yield` dans cette cloture : `29.60 ms` puis `13.99 ms`
- profil runtime chaud : `OK`

Solid-yield cold :
`274.79 ms`

Solid-yield warm :
`29.60 ms` / `13.99 ms`

Backend check :
OK

Detail backend check :
- `npm run type-check` : `OK`
- `npm run lint` : `OK`
- `npm run test:run` : `OK`
- `npm run build` : `OK`
- `npm run check` : `OK`

Frontend check :
OK

Detail frontend check :
- `npm run type-check` : `OK`
- `npm run lint` : `0 erreur`, `34 warnings` existants
- `npm run test:run` : `OK`
- `npm run build` : `OK`
- `npm run check` : `OK`

Docker :
HEALTHY

Detail Docker :
- `hydro-hassan-ilh0107-db` : `healthy`
- `hydro-hassan-ilh0107-backend` : `healthy`
- `hydro-hassan-ilh0107-frontend` : `healthy`

Backend 5007 :
OK

Frontend 8090 :
OK

Recette finale API :
- `/api/v1/hydro/health` : `200`
- `/api/v1/catalog/runs` : `200`
- `/api/v1/catalog/availability?module=hydro` : `200`
- `/api/v1/catalog/availability?module=climat` : `200`
- `/api/v1/hydro/swat/summary` : `200`
- `/api/v1/hydro/swat/availability` : `200`
- `/api/v1/solid-yield/availability` : `200`
- `/api/v1/spatial/reaches` : `200`
- `/api/v1/spatial/subbasins` : `200`
- `/api/v1/data-scan/summary` : `200`
- `/api/auth/me` sans token : `401` attendu

Baseline :
OK

Invariants confirmes :
- `383` timeseries
- `3 773 400` measurements
- `75` stations visibles
- `9` scenarios visibles
- `19` reaches runtime
- `19` subbasins runtime

Données métier :
PRÉSERVÉES

Régression :
NON

Performance :
VALIDÉE

Mesures sensibles :
- `solid-yield/availability` : `274.79 ms`, `29.60 ms`, `13.99 ms`
- `spatial/project-hassan-addakhil` : `4072.85 ms`, `2423.51 ms`, `2058.05 ms`

Credentials :
SÉCURISÉS

Diagnostic spawn EPERM :
- cause initiale observee : `spawn EPERM` sur `npm rebuild esbuild`, `vitest`, et `npm run check`
- binaire concerne : `esbuild` / processus enfants npm
- action efficace : relancer `npm rebuild esbuild` avec permissions elevees
- resultat apres correction :
  - backend `npm run check` = `OK`
  - frontend `npm run check` = `OK`

Phase :
CLÔTURÉE

PostgreSQL modifié :
NON

Commit :
NON

Push :
NON
