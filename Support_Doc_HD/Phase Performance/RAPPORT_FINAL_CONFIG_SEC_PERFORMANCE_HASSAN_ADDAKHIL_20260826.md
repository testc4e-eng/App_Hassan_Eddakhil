# RAPPORT FINAL CONFIG-SEC / PERFORMANCE - HASSAN ADDAKHIL

- Date : 2026-08-26
- Base officielle : `hydro_hd`
- Backend : `http://127.0.0.1:5007`
- Frontend : `http://127.0.0.1:8090`

## 1. Verdict global

| Bloc | Verdict |
| --- | --- |
| Credentials | WARNING |
| Warmup | OK |
| Donnees metier | PRESERVEES |
| Regression | NON |

## 2. Credentials

- Source canonique : `.env` racine pour secrets partages et Docker ; `backend/.env` pour overrides locaux uniquement
- Secrets hardcodes code : `0`
- Secrets Git : `0`
- Secrets frontend : `0`
- Duplication sensible retiree de `backend/.env` : `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `SEED_USER_PASSWORD_HASH`
- JWT : `WARNING` (secret local encore faible / placeholder-like)

## 3. Warmup

- Warmup non bloquant : `OUI`
- Warmup post-listen : `OUI`
- Warmup total observe : `12458 ms`
- `solid-yield cold` : `7115.01 ms` sur instance compilee de validation
- `solid-yield warm` : entre `6.32 ms` et `16.75 ms`
- Profil : `COLD START / CACHE`

## 4. Checks

- Backend `npm run check` : `KO` a cause de `spawn EPERM` Vitest/esbuild
- Frontend `npm run check` : `KO` pour la meme raison, avec `34` warnings ESLint avant le blocage Vitest
- Backend health `5007` : `HTTP 200`
- Frontend `8090` : `HTTP 200`

## 5. APIs revalidees

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

## 6. Baseline

Baseline comparee via :
- `D:\3- Projets\App_Hassan_Addakhil\scripts\quality\compare-functional-baseline.py`

Invariants confirmes :
- `383` timeseries
- `3 773 400` measurements
- `75` stations visibles
- `9` scenarios visibles
- `19` reaches runtime
- `19` subbasins runtime

Statut baseline :
- `OK`

## 7. Artefacts

- `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Performance\RAPPORT_SECURISATION_ENV_CREDENTIALS_HASSAN_ADDAKHIL_20260826.md`
- `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Performance\RAPPORT_STABILISATION_WARMUP_HASSAN_ADDAKHIL_20260826.md`
- `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Performance\RAPPORT_FINAL_CONFIG_SEC_PERFORMANCE_HASSAN_ADDAKHIL_20260826.md`
- `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Performance\BASELINE_CONFIG_SEC_20260826_POST.json`
- `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Performance\BASELINE_CONFIG_SEC_20260826_POST.md`

## 8. Decision de phase

- PostgreSQL modifie : `NON`
- Commit : `NON`
- Push : `NON`
