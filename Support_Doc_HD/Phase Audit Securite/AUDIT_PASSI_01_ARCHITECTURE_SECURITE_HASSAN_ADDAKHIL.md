# AUDIT PASSI 01 — ARCHITECTURE SECURITE — HASSAN ADDAKHIL

- Date : 2026-08-26
- Portee : architecture applicative, exposition reseau, routage, separation frontend/backend/base
- Mode : lecture + verification technique en local

## Resume executif

L'architecture reste globalement exploitable, mais l'etat initial presentait quatre faiblesses majeures : exposition reseau trop large via `docker-compose.yml`, routes debug publiques, endpoints SWAT sensibles publics, et fuite d'information sur l'endpoint racine / health. La couche PASSI appliquee corrige ces points sans modifier la logique metier ni la base `hydro_hd`.

## Perimetre audite

- `D:\3- Projets\App_Hassan_Addakhil\docker-compose.yml`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\src\app.ts`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\src\routes\swatRoutes.ts`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\src\routes\spatialRoutes.ts`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\src\routes\solidYieldRoutes.ts`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\nginx.conf`

## Constats avant correction

### Critique

1. `POST /api/v1/hydro/swat/import`, `GET /api/v1/hydro/swat/batches` et `DELETE /api/v1/hydro/swat/delete-by-filter` etaient accessibles sans authentification.
2. La surface d'administration technique etait exposee via des routes debug non protegees.

### High

1. `docker-compose.yml` publiait base, backend et frontend sans restriction d'interface.
2. L'endpoint `/` exposait la liste des endpoints et la configuration CORS.
3. `GET /api/v1/hydro/health` exposait des details de structure.
4. Le preflight CORS utilisait un handler trop permissif par rapport a la whitelist principale.

## Corrections appliquees

1. Ports Docker lies a `127.0.0.1` pour limiter l'exposition locale.
2. Activation systematique du meme `corsOptions` pour `app.use()` et `app.options()`.
3. Desactivation de `x-powered-by`.
4. Endpoint racine reduit a une reponse minimale.
5. Protection `verifyToken + requireRole("ADMIN")` sur :
   - `/api/v1/hydro/swat/import`
   - `/api/v1/hydro/swat/batches`
   - `/api/v1/hydro/swat/delete-by-filter`
   - `/api/v1/spatial/advanced/debug-root`
   - `/api/v1/solid-yield/debug/diagnostic`
6. Hardening Nginx sur les headers, fichiers caches et chemins sensibles.

## Preuves techniques

- `GET /api/auth/me` sans token : `401`
- `GET /api/v1/admin/db-config` sans token : `401`
- `GET /api/v1/admin/db-config` avec token USER : `403`
- `POST /api/v1/hydro/swat/import` sans token : `401`
- `POST /api/v1/hydro/swat/import` avec token USER : `403`
- `GET /api/v1/spatial/advanced/debug-root` sans token : `401`
- `GET /api/v1/solid-yield/debug/diagnostic` sans token : `401`
- `GET /api/v1/hydro/health` : `200`, payload minimal sans structure interne

## Risque residuel

1. Le frontend verifie en dev Vite ne permet pas de prouver runtime les regles Nginx de blocage de fichiers, seulement leur presence en configuration.
2. Le service SWAT admin reste dependant de la source MDB et du contexte local d'import, ce qui est normal mais doit rester reserve a l'administration.

## Verdict

- Architecture apres correction : `ACCEPTABLE SOUS CONTRAINTE`
- Regressions metier detectees : `NON`
- Changement PostgreSQL : `NON`
