# Rapport R4 Validation Fonctionnelle v1.0.0

Date : 2026-08-28  
Projet : `D:\3- Projets\App_Hassan_Addakhil`  
Dossier de livraison : `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ`  
Projet Docker R4 : `hassan-ziz-r4-validation-20260828`

## 1. Environnement

R4 a été exécuté sur un stack Docker complètement isolé, distinct du stack principal, avec :

- le compose officiel `LIVRAISON_ZIZ/02_DOCKER/compose/docker-compose.ziz.yml`
- les images officielles `1.0.0`
- le dump officiel assaini `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump`
- un `.env` temporaire R4 supprimé en fin de mission
- un volume PostgreSQL R4 dédié

Le stack principal n’a pas été arrêté ni modifié.

## 2. Images

- backend `hassan-addakhil-backend:1.0.0` = `sha256:57b8003501fe797d3420112206c620fedf31ea7bab85173c8751b2efe87fb63d`
- frontend `hassan-addakhil-frontend:1.0.0` = `sha256:134dc3d6b72b00d0404f4271fb46d6149d1059063b795a11bed84c398f2df9b1`
- DB `postgis/postgis:17-3.5` = `sha256:71f7e60358fb03d3f157b9ea34516e8152394752ec7a01b3f9eb293d3aead29e`

## 3. Dump

Le SHA256 recalculé du dump officiel est conforme :

`1f33e0e4295c74edf0ae4dcfaa82196e589e7029db985ecb1e1459ba55f2cbd1`

La restauration R4 a été réalisée avec la méthode portable validée :

- `--no-owner`
- `--no-privileges`
- `--exit-on-error`

Vérifications post-restore :

- `79` tables
- `104` vues
- `1` vue matérialisée
- indicateurs R1/R3 cohérents : `core.stations=102`, `core.reaches=33`, `core.subbasins=33`, `public.stations=102`, `public.timeseries=383`
- FDW legacy absent
- runtime DB = `db:5432` uniquement

## 4. Auth

Authentification testée avec un compte temporaire créé uniquement dans la base R4 :

- login valide : `HTTP 200`
- login invalide : `HTTP 401`, message contrôlé `Email ou mot de passe invalide`
- `/api/auth/me` sans token : `HTTP 401`, `Non autorisé`
- `/api/admin/users` sans token : `HTTP 401`
- `/api/admin/users` avec token admin R4 : `HTTP 200`

Aucun mot de passe, token, cookie ou header `Authorization` n’a été conservé dans les preuves.

## 5. Dashboard

Le dashboard principal s’appuie correctement sur les routes métier suivantes :

- `/api/v1/hydro/stats` -> `HTTP 200`
- `/api/v1/catalog/modules` -> `HTTP 200`, `3` modules
- `/api/v1/catalog/runs` -> `HTTP 200`, `9` runs
- `/api/v1/catalog/availability?module=hydro` -> `HTTP 200`, `45` entrées

La cohérence backend + base est correcte et aucun endpoint central du dashboard n’a retourné `500`.

## 6. Climat

Validation en lecture :

- `/api/v1/spatial/stations` -> `HTTP 200`, `34` stations spatiales
- `/api/v1/spatial/stations/1/climate?variable=precipitation&aggregation=year` -> `HTTP 200`
- série annuelle non vide sur `2023`, `2024`, `2025`
- disponibilité d’agrégation : quotidienne, mensuelle et annuelle présentes

Verdict Climat : fonctionnel sur l’environnement de release.

## 7. Hydrologie

Validation en lecture :

- `/api/v1/hydro/stations?limit=5` -> `HTTP 200`
- `/api/v1/stations/2/simulations?scenarioCode=etat_actuel&view=paired` -> `HTTP 200`
- station mappée testée : `1508/38` `FOUM TILLICHT`
- observé = `17897` points
- simulé = `10470` points
- overlap observé/simulé = `10470` points
- warnings métier retournés = `0`

Le premier essai sur une station non mappée a échoué, ce qui reflète un comportement normal de filtrage métier et non une panne globale du module.

Verdict Hydrologie : fonctionnel.

## 8. Sédiments

Validation en lecture :

- `/api/v1/solid-yield/subbasins` -> `HTTP 200`, `19` sous-bassins SWAT consultables
- `/api/v1/solid-yield/availability?subbasinStationId=73` -> `HTTP 200`, `152` disponibilités
- `/api/v1/solid-yield/timeseries?subbasinStationId=73&runId=3&interval=day` -> `HTTP 200`, `10470` points
- `/api/v1/solid-yield/stats?subbasinStationId=73&runId=3` -> `HTTP 200`

Statistiques observées :

- min = `0`
- max = `33.067`
- moyenne = `0.03584868388075996`
- somme = `1126.0071606946703`

Verdict Sédiments : fonctionnel.

## 9. Transport solide Reach

Validation spécifique :

- `/api/v1/spatial/reaches/1/timeseries?scenarioCode=etat_actuel&interval=year` -> `HTTP 200`, `29` points
- `/api/v1/spatial/reaches/1/scenarios-availability?variable=SED_OUT&aggregation=year` -> `HTTP 200`, `8` scénarios disponibles
- `/api/v1/maps/thematic/reaches/sediment?scenario=etat_actuel` -> `HTTP 200`, `19` features

Contrôle du graphe :

- le maximum réel de la série de transport solide est `33.067`
- le composant [ReachSedimentDashboard.tsx](</D:/3- Projets/App_Hassan_Addakhil/hydro_Hassan dakhil/frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx>) laisse le `YAxis` en domaine `auto`
- le composant [TimeSeriesChart.tsx](</D:/3- Projets/App_Hassan_Addakhil/hydro_Hassan dakhil/frontend/src/components/charts/TimeSeriesChart.tsx>) calcule explicitement un domaine basé sur les maxima/minima réels avec marge

Aucune incohérence du type `max réel 33` / `axe plafonné à 12` n’a été trouvée dans la logique livrée.

Verdict Transport solide Reach : fonctionnel.

## 10. Envasement

Résultats R4 :

- `/api/v1/siltation/summary?damCode=HASSAN_ADDAKHIL` -> `HTTP 200`
- `/api/v1/siltation/hsv?damCode=HASSAN_ADDAKHIL` -> `HTTP 200`, `26406` lignes
- `/api/v1/siltation/bathymetry-campaigns?damCode=HASSAN_ADDAKHIL` -> `HTTP 200`, `6` campagnes, `5` périodes
- `/api/v1/siltation/period-volumes?damCode=HASSAN_ADDAKHIL` -> `HTTP 200`, `5` lignes
- `data_source = bathy_had`

Point bloquant fonctionnel pour R4 :

- `/api/v1/siltation/indicators?damCode=HASSAN_ADDAKHIL` retourne `0` ligne
- `summary.indicators` est `null`
- le composant [RecapitulatifEnvasement.tsx](</D:/3- Projets/App_Hassan_Addakhil/hydro_Hassan dakhil/frontend/src/components/dashboard/modules/RecapitulatifEnvasement.tsx>) affiche pourtant les KPI `Vi`, `Vf`, `Ve`, `% perte`, `TEA`, `TER`, `Durée` à partir de `summary.indicators`

Conclusion :

La bathymétrie brute, les courbes HSV, la mini-carte et les exports existent, mais les KPI métier clés du module Envasement ne sont pas alimentés. La fonctionnalité est donc seulement partiellement valide.

## 11. Dégradation

Validation :

- `/api/v1/maps/thematic/subbasins/vulnerability?scenario=etat_actuel` -> `HTTP 200`, `19` features
- asset `/data/hassan/degradation-maps/manifest.json` -> `HTTP 200`
- asset image thématique -> `HTTP 200`

Le tableau de bord de dégradation spécifique repose sur des ressources présentes dans l’image frontend.

Verdict Dégradation spécifique : fonctionnel.

## 12. SWAT

Consultation uniquement, sans import MDB ni PowerShell :

- `/api/v1/hydro/swat/summary` -> `HTTP 200`
- `/api/v1/hydro/swat/availability` -> `HTTP 200`, `383` entrées
- `/api/v1/hydro/swat/reaches` -> `HTTP 200`, `19`
- `/api/v1/hydro/swat/subbasins` -> `HTTP 200`, `19`
- `/api/v1/hydro/swat/data?scenarioCode=etat_actuel&limit=5` -> `HTTP 200`, `5` lignes

Le hook frontend `useSwatDataManagement` exploite surtout `summary`, `availability` et `data`. Le retour vide de `/variables` n’a pas été confirmé comme bloquant pour l’UI livrée.

Mention obligatoire :

`IMPORT SWAT NON TESTÉ — OUTIL ADMINISTRATION WINDOWS`

## 13. Cartographie

Validation des couches :

- `/api/v1/spatial/project-hassan-addakhil` -> `HTTP 200`
- projet filtré : `5` stations, `1` bassin, `19` sous-bassins, `19` reaches, `1` barrage
- `/api/v1/spatial/basins` -> `33` features
- `/api/v1/spatial/subbasins` -> `19` features
- `/api/v1/spatial/reaches` -> `19` features
- `/api/v1/spatial/barrages` -> `12` features

L’écart `33` en base vs `19` en UI est cohérent avec le mode projet/catchment utilisé par la release, notamment visible dans [SpatialModule.tsx](</D:/3- Projets/App_Hassan_Addakhil/hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SpatialModule.tsx>) et [ReachSedimentDashboard.tsx](</D:/3- Projets/App_Hassan_Addakhil/hydro_Hassan dakhil/frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx>).

Verdict Cartographie : fonctionnelle.

## 14. Spatial

Validation :

- `/api/v1/spatial/subbasins/1/scenarios-availability?variable=SYLD&aggregation=year` -> `HTTP 200`, `8` scénarios
- `/api/v1/spatial/subbasins/1/timeseries?variable=SYLD&scenario=etat_actuel&aggregation=year` -> `HTTP 200`, série vide mais route saine
- assets `/data/hassan/nv_stream.geojson` et `/data/hassan/subbasin_hru_summary.geojson` -> `HTTP 200`

Verdict Analyse spatiale : fonctionnelle sur la surface exposée par la release.

## 15. Programme intervention

Le module est majoritairement statique et s’appuie sur les données embarquées du frontend :

- PDF programme -> `HTTP 200`, fichier non vide
- figure intervention -> `HTTP 200`, fichier non vide
- le composant [InterventionProgramDashboard.tsx](</D:/3- Projets/App_Hassan_Addakhil/hydro_Hassan dakhil/frontend/src/features/intervention-program/pages/InterventionProgramDashboard.tsx>) assemble KPI, tableaux, cartes, calendrier et budget à partir de données internes

Verdict Programme d’intervention : fonctionnel.

## 16. Rapports

Validation des exports réellement exposés :

- export Excel sédimentation -> fichier généré non vide, `8397044` octets
- export PDF sédimentation -> fichier généré non vide, `1850` octets
- PDF rapport mission -> `HTTP 200`
- carte de rapport -> `HTTP 200`

L’acceptation de risque `xlsx@0.18.5` reste inchangée et documentée dans `R2-S`.

Verdict Rapports / Exports : fonctionnel.

## 17. Administration

Fonctions Linux testées sans action destructive :

- `/api/admin/users` avec token admin R4 -> `HTTP 200`
- `/api/v1/admin/db-config` avec token admin R4 -> `HTTP 200`

Les routes admin restent protégées et aucune opération de purge/import/restore n’a été exécutée.

Verdict Administration utile à Ziz : fonctionnelle.

## 18. Comparaison DB/API

Comparaisons de cohérence :

- stations : DB `102`, API projet filtrée `5`, API échantillon hydro `5`
- reaches : DB `33`, API projet/release `19`
- subbasins : DB `33`, API projet/release `19`

Interprétation :

- les compteurs DB bruts restent ceux validés par R1/R3
- les compteurs exposés par certaines vues/cartes frontend sont filtrés sur le périmètre projet Hassan Addakhil
- aucun écart incohérent n’a été trouvé sur les routes métier testées

## 19. Erreurs HTTP

Section `ERREURS HTTP 500` :

Aucun endpoint métier essentiel testé n’a retourné `HTTP 500`.

Les seuls échecs vus pendant R4 proviennent :

- d’un premier échantillon station non mappé
- d’un premier script de seed SQL générique utilisé uniquement pour préparer le compte temporaire R4
- de requêtes d’échantillonnage internes incorrectes pendant la validation

Ces erreurs proviennent du protocole de test et non de la release livrée elle-même.

## 20. Erreurs frontend

Constats frontend :

- page racine `/` -> `HTTP 200`
- assets JS/CSS principaux -> `HTTP 200`
- référence `/assets/og-hassan-addakhil.png` -> `HTTP 404`

Classification :

- `MINEUR` : asset social/OG manquant, sans impact métier direct

Limite de validation :

- le runtime d’automatisation navigateur local n’était pas exploitable (`failed to write kernel assets`)
- la validation visuelle détaillée a donc été remplacée par des tests API, assets, routes protégées et inspection de code

Cette limite de poste de test n’est pas considérée comme un défaut de la release.

## 21. Logs

Contrôle des logs backend/frontend/DB :

- aucun retour `old_hd_srv`
- aucune dépendance `host.docker.internal`
- aucun `HTTP 500` métier

Les lignes `ERROR` relevées sur la DB correspondent aux essais de validation eux-mêmes :

- autovacuum interrompu pendant les manipulations de restore
- seed SQL générique initial non applicable sur `public.users`
- premières requêtes d’échantillonnage avec colonnes/vues incorrectes

Les suites automatisées backend génèrent aussi des traces `Non autorisé` attendues pour des tests `401`.

## 22. Sécurité

Validation minimale conforme :

- frontend seul port publié : `0.0.0.0:18091->80/tcp`
- backend non publié : `5000/tcp` interne uniquement
- DB non publiée : `5432/tcp` interne uniquement
- CORS autorise l’origine frontend R4 configurée
- aucun wildcard `*` utilisé pour contourner CORS
- aucune fuite de secret dans le healthcheck
- routes protégées bien refusées sans token

## 23. Anomalies

### BLOQUANT

Aucune anomalie bloquante détectée.

### IMPORTANT

- Module Envasement partiellement non fonctionnel : les KPI `Vi`, `Vf`, `Ve`, `% perte`, `TEA`, `TER`, `Durée` ne sont pas alimentés, car `/api/v1/siltation/indicators` retourne vide et `summary.indicators` est `null`, alors que l’UI les affiche.

### MINEUR

- `/assets/og-hassan-addakhil.png` absent (`404`) sans impact métier direct.
- L’automatisation navigateur du poste de validation n’a pas pu être utilisée ; la couverture UI détaillée a été remplacée par une validation API/assets/code.

## 24. Verdict

R4 confirme :

- l’authentification fonctionne
- le dashboard fonctionne
- climat, hydrologie, sédiments, transport solide Reach, cartographie, spatial, programme d’intervention, rapports/export et administration sûre fonctionnent
- aucune erreur `HTTP 500` essentielle n’a été trouvée
- la cohérence DB/API est globalement bonne
- aucune dépendance host ni FDW legacy n’a été observée

Cependant, R4 n’est pas validé globalement car le module Envasement ne livre pas complètement les indicateurs métier attendus dans la release actuelle.

Conclusion :

`R4 NON VALIDÉ`

Un `R4-FIX` dédié est requis avant de pouvoir considérer la release Ziz v1.0.0 comme entièrement validée fonctionnellement.
