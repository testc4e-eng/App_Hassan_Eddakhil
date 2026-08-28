# BASELINE AVANT AUDIT SECURITE - HASSAN ADDAKHIL

Date : 2026-08-26  
Heure : 08:34 UTC  
Phase : `0 - Preparation et zone de test securite`

## 1. Objectif

Cette baseline fige l'etat technique et fonctionnel de reference avant les audits PASSI.

Elle sert a :

- proteger l'existant ;
- identifier les invariants a ne pas casser ;
- distinguer la base officielle, les services exposes et les modules critiques ;
- cadrer ce qui est interdit de modifier pendant les audits.

Travail realise :

- en lecture seule sur le depot ;
- sans modification PostgreSQL ;
- sans modification Docker ;
- sans correction backend/frontend.

## 2. Etat Git fige

| Champ | Valeur |
| --- | --- |
| Branche active | `ilh_dev_20-07` |
| Commit de reference | `ef62eae98af1c9991ee2287b969cf53f2051db88` |
| Etat du worktree | `sale / deja modifie` |
| Nombre d'entrees modifiees | `207` |

Important :

- le depot contient deja de nombreuses modifications utilisateur ;
- aucune future phase de securite ne devra ecraser ces changements ;
- tout test ou correction devra etre compare a cette baseline avant validation.

## 3. Sauvegarde de protection

### 3.1 Sauvegarde reelle disponible

| Champ | Valeur |
| --- | --- |
| Fichier | `D:\3- Projets\App_Hassan_Addakhil\hydro_hd.sql` |
| Type reel | `dump PostgreSQL custom` |
| Taille | `533241663` octets |
| Date archive | `2026-08-04 09:09:49` |
| `pg_restore --list` | `OK` |
| Base source du dump | `hydro_hd` |
| Version dumpee | `PostgreSQL 17.8` |

Conclusion :

- la sauvegarde exploitable de reference existe ;
- la source de backup a reutiliser avant audit est `hydro_hd.sql`.

### 3.2 Ancien chemin de backup attendu par le script

Le script `scripts/quality/compare-functional-baseline.py` pointe encore vers :

- `D:\3- Projets\App_Hassan_Addakhil\backups\hydro_hd_before_dq_corrections_20260810_1339.dump`

Etat constate :

- chemin absent ;
- dossier `backups\` absent a la racine ;
- ce chemin ne doit donc pas etre traite comme backup actif.

Conclusion :

- backup officiel utilisable : `hydro_hd.sql`
- backup historique reference par le script : `obsolete / non present`

## 4. Base officielle et connectivite

| Champ | Valeur |
| --- | --- |
| Base officielle | `hydro_hd` |
| Hote DB officiel | `127.0.0.1` |
| Port DB officiel | `5432` |
| Taille actuelle de la base | `5374 MB` |
| Version PostgreSQL | `17.8` |

Variables projet visibles dans `.env` :

- `HDI_DB_NAME=hydro_hd`
- `DB_HOST=host.docker.internal`
- `DB_PORT=5432`
- `BACKEND_EXPOSE_PORT=5007`
- `FRONTEND_EXPOSE_PORT=8090`
- `HYDRO_HD_DUMP_PATH=./hydro_hd.sql`

Interpretation :

- la base officielle reste la base host `hydro_hd` ;
- le compose Docker est configure pour viser cette base officielle ;
- `hydro_hd.sql` est le dump canonique de restauration optionnelle.

## 5. Etat Docker / services

### 5.1 Docker

Commande constatee :

- `docker compose ps`

Resultat :

- Docker Desktop non disponible au moment du gel ;
- aucun etat conteneur exploitable n'a pu etre releve.

Erreur constatee :

- `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`

Statut baseline Docker :

- `NON DISPONIBLE AU MOMENT DU GEL`

### 5.2 Backend / Frontend

Tests locaux realises :

- `http://127.0.0.1:5007/api/v1/hydro/health`
- `http://127.0.0.1:8090`

Resultat :

- backend `5007` : connexion refusee ;
- frontend `8090` : connexion refusee.

Statut au moment du gel :

- backend actif : `NON`
- frontend actif : `NON`

Important :

- cette baseline fige l'etat des donnees et de l'architecture, mais pas un etat de service en cours d'execution ;
- avant les tests de securite actifs, il faudra remettre backend/frontend/Docker dans un etat demarre et reverifier les endpoints.

## 6. Invariants metier proteges

Baseline metier relevee via `scripts/quality/compare-functional-baseline.py` avec connexion directe a `hydro_hd`.

| Indicateur | Valeur |
| --- | --- |
| Timeseries | `383` |
| Points de mesure | `3773400` |
| Stations visibles | `75` |
| Stations totales | `102` |
| Stations protegees | `101` |
| Reaches runtime | `19` |
| Subbasins runtime | `19` |
| Scenarios visibles | `9` |
| Scenarios techniques SWAT | `2` |
| Campagnes bathymetrie | `6` |
| Points reservoir_bathymetry | `4401` |

Scenarios visibles proteges :

- `OBSERVED`
- `etat_actuel`
- `ssp126`
- `ssp245`
- `ssp585`
- `scenario_1`
- `scenario_2`
- `scenario_3`
- `scenario_4`

Scenarios techniques a ne pas casser :

- `SWAT_OUTPUT`
- `SWAT_OUTPUT_01`

Stations projet volontairement protegees :

- `2`
- `3`
- `24`
- `29`
- `35`

## 7. Modules fonctionnels a proteger

Modules identifies comme actifs dans la baseline :

- `Dashboard`
- `Climat`
- `Hydrologie`
- `Sediments`
- `Transport solide Reach`
- `Estimation Q -> Qs`
- `Cartographie`
- `Analyse spatiale`
- `SWAT`
- `Data Scan`
- `Programme d'intervention`
- `Siltation / Envasement`
- `Admin`
- `Rapports / Exports`

Tables / couches runtime critiques :

- `public.v_ts_catalog_enriched`
- `core.timeseries`
- `core.measurements`
- `core.stations`
- `core.model_runs`
- `core.swat_entity_map`
- `core.station_subbasin_map`
- `core.reservoir_bathymetry`
- `core.reservoirs`
- `access.rch_results`
- `access.sub_results`
- `gis.reach_shapes`
- `gis.subbasin_shapes`
- `gis.meteo_stations`
- `hydro.bathymetry_campaigns`

Fichiers runtime critiques cote frontend :

- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\public\data\hassan\nv_stream.geojson`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\public\data\hassan\subbasin_hru_summary.geojson`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\public\data\hassan\intervention-program\`

## 8. Architecture de reference a auditer

Chaine cible a auditer :

- `Utilisateur`
- `Frontend / Nginx`
- `Backend / API`
- `PostgreSQL hydro_hd`

Ports declares dans `.env` / `docker-compose.yml` :

- DB Docker exposee : `5436 -> 5432`
- Backend Docker expose : `5007 -> 5000`
- Frontend Docker expose : `8090 -> 80`

Constat important :

- le backend Docker est configure pour viser `host.docker.internal:5432` ;
- la base officielle est donc a considerer comme exterieure au conteneur backend ;
- Docker n'etait pas demarre au moment du gel, donc l'audit d'architecture reseau devra verifier cet etat en execution.

## 9. Ce qui est interdit de modifier pendant les audits

Interdictions de phase de preparation / audit :

- ne pas modifier les calculs hydrologiques ;
- ne pas modifier les resultats SWAT ;
- ne pas modifier les scenarios visibles ou techniques ;
- ne pas modifier les filtres fonctionnels projet ;
- ne pas modifier les cartes runtime ;
- ne pas modifier les donnees metier ;
- ne pas modifier la structure fonctionnelle deja validee ;
- ne pas lancer de migration destructive ;
- ne pas supprimer de table, vue, fonction ou donnees ;
- ne pas ecraser les changements utilisateur presents dans Git.

## 10. Zone de test securite

Principe retenu pour la suite :

- les audits doivent rester `non destructifs` ;
- les tests de securite ne doivent pas ecrire dans les donnees fonctionnelles ;
- la comparaison a la baseline JSON devra etre utilisee avant/apres toute correction.

Artefacts generes pour cette zone de test :

- baseline JSON :
  - `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Protection Donnees Fonctionnelles\BASELINE_SECURITE_20260826_01.json`
- baseline detaillee intermediaire :
  - `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Protection Donnees Fonctionnelles\BASELINE_SECURITE_20260826_01.md`

## 11. Conclusion

Etat de reference retenu avant audit securite :

- base officielle : `hydro_hd`
- sauvegarde de reference : `hydro_hd.sql`
- commit de reference : `ef62eae98af1c9991ee2287b969cf53f2051db88`
- baseline metier : `383 timeseries`, `3773400 mesures`, `75 stations visibles`, `19 reaches`, `19 subbasins`, `9 scenarios visibles`
- Docker : `indisponible au moment du gel`
- backend/frontend : `non demarres au moment du gel`

Decision de phase 0 :

- la base fonctionnelle est figee conceptuellement ;
- la prochaine etape peut demarrer sur `AUDIT_PASSI_01_ARCHITECTURE_SECURITE.md` ;
- avant les tests de securite actifs, il faudra simplement remettre les services dans un etat demarre pour auditer les flux reels.
