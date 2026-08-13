# TEST GLOBAL APPLICATION — HASSAN ADDAKHIL

Date : 2026-08-12  
Base : `hydro_hd` (5374 MB, confirmé par `/api/v1/data-scan/summary`)  
Backend : `http://127.0.0.1:5007` — `hydro-hassan-ilh0107-backend` **HEALTHY**  
Frontend : `http://127.0.0.1:8090` — `hydro-hassan-ilh0107-frontend` **HEALTHY**

Mode : lecture seule. Aucune écriture code / PostgreSQL.

## Résultat global

Application : **WARNING**  
Régression : **NON**

Le WARNING vient surtout de la recette UI authentifiée incomplète (pas de mot de passe de test utilisable dans le runtime) et des hash Data Scan / spatial déjà connus. Aucun compteur métier n’a bougé. Aucune API critique n’est KO.

## Tests

| Module | Résultat | Remarque |
|---|---|---|
| Docker | OK | Uniquement `hydro-hassan-ilh0107-*` (backend 5007, frontend 8090, db compose 5436). Autres stacks (chatbot, DGM) ignorées. |
| Backend | OK | Health 200. Logs `❌ Error` = 401 attendus (LOG NORMAL). |
| Frontend | OK | SPA 200. Navbar / FR-EN / login OK. |
| PostgreSQL | OK | Runtime = `hydro_hd` hôte (pas un autre projet). |
| Authentification | WARNING | Login page OK. Login invalide → message « Email ou mot de passe invalide ». `/api/auth/me` et admin sans JWT → **401**, sans stack. `/dashboard` et `/admin` anonymes → redirection `/login`. Login ADMIN/USER valide **non exercé** (pas de mot de passe clair runtime ; hash seed non utilisable). USER→403 non prouvé en live. |
| Dashboard | WARNING | Guard login OK. Sidebar/KPI/cartes **non vus connecté**. APIs dashboard 200. |
| Climat | OK | `availability?module=climat` 200. Stations `runId=1` : 8. Propriétés : 7. Climate station 2 : 200. |
| Hydrologie | OK | `availability?module=hydro` 200. Stations hydro : 5. TS 115 mesures+stats 200. Simulations station 2 : 200. |
| Sédiments | OK | SWAT summary/availability 200. Solid-yield : 19 subbasins, 152 dispo, série annuelle station 73 / run 3 : 29 pts, stats 200. |
| SWAT | OK | `skipAccess` 200. Alias runId **3≡101** et **7≡105** : mêmes tailles de payload. Pas de doublon dans `/catalog/runs`. |
| Cartographie | OK | Thematic reaches sediment 19. Subbasins vulnerability ~3,5 Mo 200. `stations-values` precipitation/discharge 200. Projet spatial ~5,7 Mo 200. |
| Spatial | OK | Reaches **19** MultiLineString. Subbasins **19** MultiPolygon. 34 stations spatiales. |
| Data Scan | OK | `database_name=hydro_hd`. Tables 196, anomalies 248, periods/global 200, relations 5. Consultation seule. |
| Scénarios | OK | **9** visibles exactes : OBSERVED, etat_actuel, ssp126, ssp245, ssp585, scenario_1..4. Plus de 17. `model-runs` = 9, IDs 1,3–10. 101/105 absents du catalogue (alias internes). |
| Programme intervention | WARNING | Assets figure priorité 200. Route dashboard protégée (redirige login). Listing dossier nginx **403** (normal, autoindex off). UI budget/calendrier **non vue connectée**. |
| Exports/Rapports | OK | Excel siltation 200 (~8,4 Mo). PDF Mission I 200 (~5,2 Mo). Export PDF API 200. |
| Administration | WARNING | Anonyme : `/api/v1/admin/db-config`, `/test`, `/api/admin/users` = **401** sans stack. ADMIN/USER avec token **non exercé**. |
| Sécurité API | OK | Pas de stack HTTP. Pas de 500/502/503/504 observé. |
| Backend npm check | OK | lint / type-check / **31** tests / build. |
| Frontend npm check | OK | lint 0 erreur **34 warnings** (Q0) / type-check / **16** tests / build. |

## Données

| Invariant | Avant | Après |
|---|---|---|
| Timeseries | 383 | 383 |
| Measurements | 3 773 400 | 3 773 400 |
| Stations | 75 | 75 |
| Scénarios | 9 | 9 |
| Reaches runtime | 19 | 19 |
| Subbasins runtime | 19 | 19 |
| Core reaches | 33 | 33 |
| Core subbasins | 33 | 33 |
| SWAT entity map | 38 | 38 |

Baseline vs `backups/FINAL_DB_BASELINE_20260812_1555.json` : **WARNING** hash `spatial_reaches` + `data_scan_periods_global` (déjà connus). **0 REGRESSION**. Compteurs identiques avant/après.

## Problèmes détectés

- Bloquants : **aucun**
- Importants :
  - Recette UI post-login incomplète : aucun mot de passe de test disponible dans le conteneur (pas de `SEED_USER_PASSWORD` ; hash seed inutilisable). Login ADMIN, `/api/auth/me` avec token, USER→403, logout, dashboard/sidebar/KPI, Q→Qs UI, calendrier intervention **non validés visuellement**.
- Mineurs :
  - `GET /catalog/modules/{climat\|hydro}/stations` sans `runId` → 400 (contrat existant, pas une régression).
  - `GET /maps/layers` et `.../thematic/subbasins/sediment` → 404 (routes réelles : `stations-values`, `.../vulnerability`).
  - `GET /siltation/indicators` → 200, **0** ligne.
  - `GET .../intervention-program/` (dossier) → 403 nginx.
  - Hash spatial / Data Scan inchangés vs LOT 3A (acceptable).
  - 34 warnings lint frontend déjà connus.

## Test authentifié 2026-08-13

Contrôle des identifiants existants uniquement (aucune création / reset / lecture de secret) :

- `SEED_USER_PASSWORD` : **ABSENT** (`.env` racine et backend)
- `SEED_USER_PASSWORD_HASH` : **placeholder** (inutilisable)
- emails ADMIN / USER : présents, mais inutilisables sans mot de passe

Parcours connectés **non exécutés**. Aucune modification code / PostgreSQL / utilisateur.

TEST ADMIN : **NON TESTÉ**

TEST USER : **NON TESTÉ**

ADMIN 401/403/200 :
- Anonyme → admin : **401** (validé le 2026-08-12, sans stack)
- USER → admin : **NON TESTÉ**
- ADMIN → admin : **NON TESTÉ**

DASHBOARD CONNECTÉ : **NON TESTÉ**

MODULES CONNECTÉS : **NON TESTÉ**

RÉGRESSION : **NON**

PRÊTE POUR LIVRAISON : **NON**

## Conclusion

APPLICATION TESTÉE DE A À Z : **NON** (couche API + login + checks : oui ; modules connectés : non)

APPLICATION FONCTIONNELLE : **OUI**

DONNÉES PRÉSERVÉES : **OUI**

RÉGRESSION : **NON**

PRÊTE POUR LIVRAISON : **NON** — test authentifié non exécutable (absence de credentials de test).
