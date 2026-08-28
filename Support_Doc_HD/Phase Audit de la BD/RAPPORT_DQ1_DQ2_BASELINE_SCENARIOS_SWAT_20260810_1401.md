# RAPPORT DQ-1 / DQ-2 — BASELINE ET STABILISATION DES SCENARIOS SWAT

Date : 2026-08-10  
Heure debut : 13:39  
Heure fin : 14:01

## 1. Securisation

- Base officielle confirmee : `hydro_hd`
- Backend confirme sur `hydro_hd` :
  - `.env` racine -> `DB_HOST=host.docker.internal`, `DB_PORT=5432`, `HDI_DB_NAME=hydro_hd`
  - `hydro_Hassan dakhil/backend/.env` -> `DB_HOST=localhost`, `DB_PORT=5432`, `DB_NAME=hydro_hd`
  - conteneur backend inspecte -> `DB_NAME=hydro_hd`, `DB_HOST=host.docker.internal`
- Branche Git : `ilh_dev_20-07`
- Commit de reference : `99c1089e9f0588fdbd8e8872302295cb88bbdaf6`
- Conteneurs actifs constates :
  - `hydro-hassan-ilh0107-backend` healthy
  - `hydro-hassan-ilh0107-frontend` healthy
  - `hydro-hassan-ilh0107-db` healthy
- Interdits respectes :
  - aucun `DELETE`
  - aucun `UPDATE` metier massif
  - aucun `DROP`
  - aucun `TRUNCATE`
  - aucun `ALTER` destructif
  - aucun renommage de `scenario_code`
  - aucune propagation `access -> core`

## 2. Backup logique

Backup : OK

- Fichier cree : `backups/hydro_hd_before_dq_corrections_20260810_1339.dump`
- Taille constatee : `533241661` octets
- Validation format : `pg_restore --list` OK
- Type confirme : dump PostgreSQL custom
- `hydro_hd.sql` n'a pas ete ecrase

## 3. Baseline DB

Baseline : OK

- Fichier cree : `BASELINE_DONNEES_METIER_AVANT_CORRECTION_20260810_1344.md`
- Snapshot de comparaison utilise : `C:\Users\ILHAM\AppData\Local\Temp\baseline_donnees_metier_avant_correction_20260810_1344.json`
- Tables figees :
  - `core.model_runs`
  - `core.data_batches`
  - `core.timeseries`
  - `core.measurements`
  - `access.import_runs`
  - `access.rch_results`
  - `access.sub_results`
  - `staging.swat_mdb_imports`

## 4. Analyse definitive `SWAT_OUTPUT`

ROLE : provenance technique / code d'import historique

SOURCE :
- `access.import_runs`
- `core.data_batches`
- `scripts/swat-import/mapping.config.json`

BATCH :
- `SWAT_MANUAL_20260422_02`

SOURCE_FILE :
- `SWATOutput.mdb`

DATES :
- import runs observes :
  - `2026-04-20 04:24:21.600013-07:00` -> `2026-07-03 09:12:54.823818-07:00`
  - `2026-04-22 09:29:59.032278-07:00` -> `2026-07-03 08:26:12.718520-07:00`
- batch core :
  - `2026-04-22 11:24:24.400992-07:00`

TABLES ALIMENTEES :
- `access.import_runs` : OUI
- `core.data_batches` : OUI
- `staging.swat_mdb_imports` : NON
- `access.rch_results` : NON pour le scenario `SWAT_OUTPUT`
- `access.sub_results` : NON pour le scenario `SWAT_OUTPUT`

RUN_ID ASSOCIE :
- `run_id = 2` via `core.data_batches`

UTILISE DIRECTEMENT PAR API :
- NON

UTILISE COMME PROVENANCE :
- OUI

Conclusion courte :
`SWAT_OUTPUT` ne porte pas le run metier expose. Il sert de trace technique d'import / batch / source MDB.

## 5. Analyse definitive `SWAT_OUTPUT_01`

ROLE : run core historique materialise a partir du lot `SWAT_OUTPUT`

RUN_ID :
- `2`

NOMBRE SERIES :
- `99`

NOMBRE MESURES :
- `1036530`

PROPRIETES :
- `SWAT_FLOW_M3S` (`33` series)
- `SWAT_SED_TONS` (`33` series)
- `SWAT_SYLDT_HA` (`33` series)

STATIONS :
- `66` stations distinctes
- premiere : `swat_rch_1`
- derniere : `swat_sub_9`
- repartition :
  - reach : `66` series
  - subbasin : `33` series

DATES :
- min : `1994-12-31 16:00:00-08:00`
- max : `2023-08-30 17:00:00-07:00`

SOURCE_TYPE :
- `simulated`

TIME_STEP :
- `daily`

BATCH D'ORIGINE PROBABLE :
- `SWAT_MANUAL_20260422_02`

UTILISE DIRECTEMENT PAR API :
- OUI

Nuance :
- l'endpoint brut `GET /api/v1/hydro/swat/availability` retourne encore `SWAT_OUTPUT_01`
- la couche catalog / frontend masque ce code technique au profit des scenarios normalises

## 6. Relation entre les deux

Relation entre les deux : **CONFIRME**

Preuves :

1. `core.data_batches.batch_id = SWAT_MANUAL_20260422_02`
2. ce batch porte `scenario_code = SWAT_OUTPUT`
3. ce batch pointe `run_id = 2`
4. `core.model_runs.run_id = 2` porte `scenario_code = SWAT_OUTPUT_01`
5. la description du run indique `SWAT simulated run (SWAT_OUTPUT)`
6. le volume de donnees du batch et du run concorde :
   - `row_count = 1036530`
   - `measure_count = 1036530`

Chaine historique retenue :

`SWATOutput.mdb`  
-> import technique `SWAT_OUTPUT`  
-> batch `SWAT_MANUAL_20260422_02`  
-> `run_id = 2`  
-> run core `SWAT_OUTPUT_01`

## 7. Cartographie des scenarios

| Code technique | Code core | Code visible plateforme | Role |
|---|---|---|---|
| `SWAT_OUTPUT` | `SWAT_OUTPUT_01` via `run_id=2` | aucun | provenance technique / import MDB / batch |
| `SWAT_OUTPUT_01` | `SWAT_OUTPUT_01` | masque dans le frontend | run core legacy historique |
| `etat_actuel` | `etat_actuel` | `etat_actuel` | scenario metier visible |
| `ssp126` | `ssp126` | `ssp126` | scenario metier visible |
| `ssp245` | `ssp245` | `ssp245` | scenario metier visible |
| `ssp585` | `ssp585` | `ssp585` | scenario metier visible |
| `scenario_1` | `scenario_1` | `scenario_1` | scenario metier visible |
| `scenario_2` | `scenario_2` | `scenario_2` | scenario metier visible |
| `scenario_3` | `scenario_3` | `scenario_3` | scenario metier visible |
| `scenario_4` | `scenario_4` | `scenario_4` | scenario metier visible |

Note importante :
- le backend injecte aussi des alias catalog virtuels `run_id 101..108` pour exposer proprement les scenarios SWAT normalises
- `GET /api/v1/catalog/runs` confirme la visibilite de `etat_actuel`, `ssp126`, `ssp245`, `ssp585`, `scenario_1`, `scenario_2`, `scenario_3`, `scenario_4`
- `SWAT_OUTPUT` n'apparait pas dans cette liste visible

## 8. References actives trouvees

| Chemin | Ligne / fonction | Role | Doit rester |
|---|---|---|---|
| `scripts/swat-import/mapping.config.json` | ligne 3 | code technique par defaut du pipeline d'import SWAT | OUI |
| `scripts/swat-import/sync_syldt_scenarios_from_legacy.sql` | lignes 15 et 20 | synchronisation legacy basee sur `SWAT_OUTPUT_01` | OUI |
| `hydro_Hassan dakhil/backend/src/constants/swatScenarios.ts` | constantes SWAT | centralisation des codes techniques / mapping / validation | OUI |
| `hydro_Hassan dakhil/backend/src/services/catalog.service.ts` | `getRuns()` | cache les codes techniques et expose les scenarios normalises | OUI |
| `hydro_Hassan dakhil/frontend/src/constants/swatScenarios.ts` | constantes SWAT frontend | masque les codes techniques et resout les labels | OUI |
| `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx` | valeurs par defaut du formulaire | utilise les constantes techniques centralisees | OUI |

Constat complementaire :
- aucune reference active trouvee dans `docker-compose.yml`
- aucune reference active trouvee dans `.env` / `.env.example`
- aucune reference active trouvee dans une documentation active du depot

## 9. Stabilisation de code appliquee

Code modifie : OUI

Corrections non destructives appliquees :

1. centralisation des codes legacy dans des constantes backend/frontend
2. mapping explicite `SWAT_OUTPUT -> SWAT_OUTPUT_01`
3. resolution de `runCode` par defaut sans generer de nouveau code legacy implicite
4. validation bloquant tout nouveau code technique `SWAT_*` non documente
5. preservation du masquage frontend des codes techniques

Fichiers modifies :

- `hydro_Hassan dakhil/backend/src/constants/swatScenarios.ts`
- `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts`
- `hydro_Hassan dakhil/frontend/src/constants/swatScenarios.ts`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx`

Fichiers crees :

- `backups/hydro_hd_before_dq_corrections_20260810_1339.dump`
- `BASELINE_DONNEES_METIER_AVANT_CORRECTION_20260810_1344.md`
- `RAPPORT_DQ1_DQ2_BASELINE_SCENARIOS_SWAT_20260810_1401.md`

## 10. Tests

Backend check :
- `npm run check` -> OK

Frontend check :
- `npm run check` -> OK
- lint : `34` warnings existantes, `0` erreur

SWAT :
- `GET /api/v1/hydro/swat/summary` -> OK
- `GET /api/v1/hydro/swat/availability` -> OK
- `skipAccess` dry-run via service source -> OK
- `preview` sans MDB -> comportement attendu (`412`, source MDB absente)

Visibilite scenarios metier :
- `GET /api/v1/catalog/runs` confirme la presence de :
  - `etat_actuel`
  - `ssp126`
  - `ssp245`
  - `ssp585`
  - `scenario_1`
  - `scenario_2`
  - `scenario_3`
  - `scenario_4`

## 11. Validation DB apres

Scenario_code DB modifie :
- NON

Donnees DB modifiees :
- NON

Comparaison baseline avant / apres :
- `diff_count = 0`
- aucune difference constatee sur :
  - `core.model_runs`
  - `core.data_batches`
  - `core.timeseries`
  - `core.measurements`
  - `access.import_runs`
  - `access.rch_results`
  - `access.sub_results`
  - `staging.swat_mdb_imports`

## 12. Resultat final

Backup :
- OK

Baseline :
- OK

SWAT_OUTPUT role :
- provenance technique / import MDB / batch historique

SWAT_OUTPUT_01 role :
- run core legacy historique materialise

Relation entre les deux :
- CONFIRME

Scenario_code DB modifie :
- NON

Donnees DB modifiees :
- NON

Code modifie :
- OUI

Backend check :
- OK

Frontend check :
- OK

Regression :
- NON constatee

## 13. Prochaine phase recommandee

PROCHAINE PHASE RECOMMANDEE :
- `DQ-4 STATIONS`

Justification courte :
- la baseline et la nomenclature SWAT sont maintenant stabilisees
- la prochaine etape la plus sure consiste a verifier la coherence des stations avant d'attaquer un mapping Reach plus large
