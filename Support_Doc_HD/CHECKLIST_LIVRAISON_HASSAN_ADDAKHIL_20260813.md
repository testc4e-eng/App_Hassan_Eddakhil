# CHECKLIST DE LIVRAISON — HASSAN ADDAKHIL

Date : 2026-08-13  
Contrôle runtime : backend 5007 HTTP 200, frontend 8090 HTTP 200, `database_name=hydro_hd`  
Backup : `backups/hydro_hd_FINAL_STABLE_20260812_1521.dump` (504,3 Mo)

Les cases sont pré-cochées uniquement si le contrôle a déjà été observé.  
**Réserve** : test authentifié ADMIN/USER non exécutable (pas de mot de passe de test).

## ENVIRONNEMENT

- [x] Backend 5007 healthy
- [x] Frontend 8090 healthy
- [x] Base active = hydro_hd
- [x] Docker compose cohérent (`hydro-hassan-ilh0107-*` uniquement)

## QUALITÉ

- [x] Backend npm run check = OK
- [x] Frontend npm run check = OK
- [x] Backend tests = 31
- [x] Frontend tests = 16
- [x] Backend build = OK
- [x] Frontend build = OK

## DONNÉES

- [x] Timeseries = 383
- [x] Measurements = 3 773 400
- [x] Stations visibles = 75
- [x] Scénarios = 9
- [x] Reaches runtime = 19
- [x] Subbasins runtime = 19
- [x] Core reaches = 33
- [x] Core subbasins = 33
- [x] SWAT entity map = 38

## SÉCURITÉ

- [x] db-config protégé JWT + ADMIN
- [x] routes admin protégées
- [x] aucune stack trace HTTP
- [x] CORS OK
- [x] Helmet OK
- [x] rate limiting OK
- [x] secrets hors Git (`.env` ignoré)
- [x] npm audit documenté (pas de `--force`)

## BACKUP

- [x] backup final présent
- [x] pg_restore --list = OK (TOC 540)

## RECETTE

- [x] APIs critiques HTTP 200
- [x] aucune régression
- [x] données préservées
- [x] réserve test authentifié documentée

## ÉCART LIVRAISON

- [ ] Test login ADMIN / USER / dashboard connecté — **NON EXÉCUTÉ** (absence de credentials de test)
