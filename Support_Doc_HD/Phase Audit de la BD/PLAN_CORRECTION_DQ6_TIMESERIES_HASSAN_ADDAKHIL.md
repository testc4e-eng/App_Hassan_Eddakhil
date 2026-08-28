# PLAN DE CORRECTION DQ-6 TIMESERIES - HASSAN ADDAKHIL

Date: 2026-08-10
Mode: plan uniquement
Portee: aucune correction appliquee
Reference audit: `Support_Doc_HD/Phase Audit de la BD/AUDIT_DQ6_TIMESERIES_HASSAN_ADDAKHIL_20260810_1705.md`
Baseline protegee: `Support_Doc_HD/Phase Protection Donnees Fonctionnelles/PROTECTED_FUNCTIONAL_DATA_BASELINE_20260810_1608.json`
Script de comparaison: `scripts/quality/compare-functional-baseline.py`

Aucun code backend/frontend n'a ete modifie dans cette phase.
Aucune donnee PostgreSQL n'a ete modifiee dans cette phase.
Aucune contrainte n'a ete creee dans cette phase.

## 1. Objectif

Construire une strategie de correction progressive, sure et reversible pour:

1. clarifier le modele `core/access` des scenarios SWAT
2. rationaliser `catalog/runs`
3. stabiliser les proprietes SWAT exposees hors core
4. ameliorer la tracabilite batch sans inventer d'historique
5. qualifier les anomalies climat avant toute correction
6. preparer les contraintes PK/FK/UNIQUE
7. normaliser le referentiel timezone sans modifier les timestamps existants
8. preserver integralement les donnees fonctionnelles protegees

## 2. Etat actuel

Etat valide issu de DQ-6:

- 383 timeseries protegees
- 3 773 400 measurements protegees
- 0 doublon timeseries
- 0 doublon measurements
- 0 orphelin runtime bloquant
- 284 series sans tracabilite batch
- aucune anomalie TS0 critique
- architecture hybride `core/access` encore necessaire

Constats structurants:

- `etat_actuel`, `ssp126`, `ssp245`, `ssp585` sont visibles mais sans timeseries core
- `scenario_1..4` sont core `daily` seulement, avec `yearly` encore en `access.*`
- `catalog/runs` expose a la fois les runs reels `3..10` et les runs virtuels `101..108`
- `SWAT_SED_IN_TONS` et `SWAT_SED_CONC_MG_KG` sont visibles sans materialisation core
- `core.timeseries` et `core.measurements` n'ont pas encore de PK/FK/UNIQUE declarees
- `core.measurements` pese environ `210 MB`, avec un index `(ts_id, datetime)` d'environ `120 MB`
- `core.timeseries` pese environ `32 kB`

## 3. Donnees protegees

| Indicateur | Valeur protegee |
|---|---:|
| Timeseries protegees | 383 |
| Measurements protegees | 3 773 400 |
| Stations visibles | 75 |
| Scenarios visibles | 9 |
| Reaches runtime | 19 |
| Subbasins runtime | 19 |

Rappel:

- aucune future correction ne doit reduire ces volumes sans validation explicite
- tout changement doit etre compare a la baseline avant et apres execution

## 4. TS1-01 - Scenarios access uniquement

Scenarios concernes:

- `etat_actuel`
- `ssp126`
- `ssp245`
- `ssp585`

Etat actuel:

- visibles dans la plateforme
- presents dans `access.rch_results` et `access.sub_results`
- 0 timeseries core

Hypothese de materialisation core retenue pour les estimations:

- 3 proprietes SWAT core par scenario et par pas: `SWAT_FLOW_M3S`, `SWAT_SED_TONS`, `SWAT_SYLDT_HA`
- 57 series par scenario et par pas (`19 reach flow + 19 reach sediment + 19 subbasin yield`)

### OPTION A - Conserver ces scenarios uniquement dans access

AVANTAGES:

- risque fonctionnel le plus faible
- aucun chargement massif supplementaire
- aucun changement de volumetrie core
- aucun changement immediate sur la baseline de comptage
- respect du contrat actuel des fallbacks

RISQUES:

- ambiguite `core/access` conservee
- dette documentaire maintenue
- dependance continue a `access.rch_results` / `access.sub_results`

VOLUME ESTIME:

- nouvelles series core: `+0`
- nouvelles mesures core: `+0`

IMPACT DB:

- nul

IMPACT BACKEND:

- nul si on documente seulement

IMPACT FRONTEND:

- nul

IMPACT PERFORMANCE:

- nul

IMPACT BASELINE:

- aucun impact de volume
- hashes d'API inchanges si aucun code n'est touche

ROLLBACK:

- non applicable

### OPTION B - Materialiser progressivement les series daily dans core

Estimation:

- `etat_actuel`: `+57` series, `+596 790` mesures
- `ssp126`: `+57` series, `+1 033 980` mesures
- `ssp245`: `+57` series, `+1 033 980` mesures
- `ssp585`: `+57` series, `+1 033 980` mesures

Totaux:

- nouvelles series core: `+228`
- nouvelles mesures core: `+3 698 730`
- volumetrie protegee potentielle apres chargement: `611` series / `7 472 130` mesures

AVANTAGES:

- rapprochement progressif vers un coeur plus complet
- preparation d'une future reduction de fallbacks pour les pas `daily`
- logique plus simple pour certains services

RISQUES:

- quasi doublement de `core.measurements`
- duplication architecturale accrue tant que `access.*` reste necessaire
- besoin d'un pipeline de chargement reversible et compare a la baseline
- risque de divergence `core` vs `access` si les reloads futurs ne sont pas symetriques

IMPACT DB:

- croissance importante de `core.measurements`
- nouveaux indexes et futures contraintes a revalider apres chargement

IMPACT BACKEND:

- ajustements des resolvers pour privilegier le nouveau core sans casser les fallback

IMPACT FRONTEND:

- aucun si les contrats API restent identiques
- risque de changement de disponibilite si le catalogue devient purement core

IMPACT PERFORMANCE:

- lecture potentiellement meilleure sur certaines routes core
- ecriture/import plus couteux

IMPACT BASELINE:

- augmentation forte des volumes
- plusieurs hashes et item counts d'API peuvent changer

ROLLBACK:

- suppression uniquement du lot materialise si charge par batch/provenance distincte
- retour aux fallbacks access

### OPTION C - Materialiser daily + monthly + yearly dans core

Estimation:

- `etat_actuel`: `+171` series, `+1 790 370` mesures
- `ssp126`: `+171` series, `+2 243 121` mesures
- `ssp245`: `+171` series, `+2 243 121` mesures
- `ssp585`: `+171` series, `+2 243 121` mesures

Totaux:

- nouvelles series core: `+684`
- nouvelles mesures core: `+8 519 733`
- volumetrie protegee potentielle apres chargement: `1 067` series / `12 293 133` mesures

AVANTAGES:

- couverture core complete sur les scenarios visibles
- chemin long terme plus homogene

RISQUES:

- option la plus lourde et la plus risquee
- triple duplication tant que `access.*` subsiste
- besoin de statuer sur la normalisation `yearly` vs `annual`
- plus forte probabilite de changer les catalogues, la disponibilite et les hashes d'API

IMPACT DB:

- tres fort

IMPACT BACKEND:

- important

IMPACT FRONTEND:

- indirect mais reel via catalogues et disponibilites

IMPACT PERFORMANCE:

- amelioration potentielle en lecture, mais cout lourd en materialisation et maintenance

IMPACT BASELINE:

- tres fort impact probable

ROLLBACK:

- rollback obligatoire par lot/batch
- restauration plus sensible si les ecritures ne sont pas strictement journalisees

### Recommandation TS1-01

Recommandation: **OPTION A** pour l'etat actuel du projet.

Justification:

- c'est la seule option qui ne met pas en danger la baseline protegee
- les fallbacks restent necessaires de toute facon pour les proprietes dynamiques et pour le contrat applicatif actuel
- la materialisation de ces 4 scenarios doit rester un chantier distinct, optionnel et tres encadre

Decision de plan:

- documenter et assumer `access` comme source canonique provisoire pour ces 4 scenarios
- ne pas lancer de materialisation core avant la fin des sous-phases `DQ6-A`, `DQ6-B`, `DQ6-D`, `DQ6-F` et des tests de contraintes

## 5. TS1-02 - `scenario_1..4` partiels

Etat:

- core: `daily` present
- access: `daily` present, `yearly` present, `monthly` absent

Estimation si materialisation du `yearly` core:

- `57` series par scenario
- `1 653` mesures par scenario
- total `4` scenarios: `+228` series / `+6 612` mesures
- nouveau total theoriquement expose: `611` series / `3 780 012` mesures

| Choix | Coherence metier | Redondance | Maintenance | Performance | Risque de divergence |
|---|---|---|---|---|---|
| A. conserver core daily + access yearly | Moyenne | Moyenne | Moyenne | Bonne | Moyen |
| B. materialiser yearly dans core | Bonne | Faible a terme | Moyenne | Bonne | Faible si charge depuis source autoritative |
| C. recalculer yearly dynamiquement depuis daily | Faible a moyenne | Faible | Complexe | Variable | Eleve si les regles ne reproduisent pas l'import historique |
| D. conserver l'architecture actuelle sans decision | Faible | Moyenne | Moyenne | Bonne | Moyen a long terme |

Analyse:

- Le `yearly` existant en `access.*` semble etre une donnee importee/materialisee, pas seulement un agregat derive a la volee.
- Recalculer `yearly` depuis `daily` risquerait de produire un resultat different des fichiers SWAT historiques.
- Le volume du `yearly` est tres faible, donc une future materialisation core est techniquement envisageable.
- Le point bloquant est surtout semantique: `access` parle `yearly`, l'enum core parle `annual`.

Recommandation:

- **court terme: choix A**
- **cible moyen terme: choix B**, uniquement apres validation de la semantique `annual/yearly`, comparaison stricte `access -> core`, et qualification de la baseline

## 6. TS1-03 - `catalog/runs` duplique

Sources actuelles:

- `core.model_runs`
- `api.mv_scenario_catalog`
- `NORMALIZED_SWAT_SCENARIOS` dans `backend/src/constants/swatScenarios.ts`
- ajout de runs virtuels `101..108` dans `catalog.service.ts`

Probleme:

- deux representations visibles du meme scenario metier

### Modele canonique recommande

Principe:

- `SCENARIO_CODE` reste la cle metier visible
- le `run_id` reel DB devient la cle canonique exposee
- le `run_id` virtuel devient un alias de compatibilite non visible

| Scenario metier | Run reel | Run virtuel | Visible actuellement | Cible recommandee |
|---|---:|---:|---|---|
| `OBSERVED` | 1 | - | Oui | Garder `run_id=1` visible |
| `etat_actuel` | 3 | 101 | Oui, deux fois | Garder `run_id=3` visible, `101` alias cache |
| `ssp126` | 4 | 102 | Oui, deux fois | Garder `run_id=4` visible, `102` alias cache |
| `ssp245` | 5 | 103 | Oui, deux fois | Garder `run_id=5` visible, `103` alias cache |
| `ssp585` | 6 | 104 | Oui, deux fois | Garder `run_id=6` visible, `104` alias cache |
| `scenario_1` | 7 | 105 | Oui, deux fois | Garder `run_id=7` visible, `105` alias cache |
| `scenario_2` | 8 | 106 | Oui, deux fois | Garder `run_id=8` visible, `106` alias cache |
| `scenario_3` | 9 | 107 | Oui, deux fois | Garder `run_id=9` visible, `107` alias cache |
| `scenario_4` | 10 | 108 | Oui, deux fois | Garder `run_id=10` visible, `108` alias cache |
| `SWAT_OUTPUT_01` | 2 | - | Non | Garder technique/cache uniquement |

SOURCE recommandee:

- source visible principale: `core.model_runs` / `api.mv_scenario_catalog`
- source de compatibilite: mapping code->run virtuel dans le backend, non expose dans `catalog/runs`

Recommandation:

- ne plus exposer `101..108` dans `GET /api/v1/catalog/runs`
- conserver `101..108` uniquement comme alias interne tant que des appels existants peuvent encore les utiliser
- normaliser les labels frontend a partir d'une table/mapping de presentation, pas via un second run visible

## 7. TS1-04 - Proprietes SWAT sans core

Proprietes:

- `SWAT_SED_IN_TONS`
- `SWAT_SED_CONC_MG_KG`

Etat:

- 0 timeseries core
- visibles dans l'application
- alimentees par `access.rch_results`
- gerees dans `erosionSwatSeries.service.ts`

Estimation si materialisation integrale sur le perimetre SWAT visible actuel:

- access reach rows actuelles: `3 637 835`
- 2 proprietes a materialiser
- mesures potentielles: `+7 275 670`
- series potentielles: environ `+760`

### OPTION A - Conserver exposition dynamique access

- stockage: nul
- duplication: nulle
- maintenance: simple
- performance: correcte si les requetes access restent bornees
- coherence: faible a moyenne, car asymetrie avec les autres proprietes core

### OPTION B - Materialiser dans core

- stockage: tres fort
- duplication: forte
- maintenance: lourde
- performance: meilleure en lecture pure core, plus couteuse en import
- coherence: bonne si toute la chaine SWAT devient core, mais ce n'est pas l'etat actuel

### OPTION C - Creer une couche metier explicite sans materialisation

- stockage: nul
- duplication: nulle
- maintenance: moyenne
- performance: identique a `access` si implementation legere
- coherence: bonne, car la plateforme declare explicitement que ces proprietes sont `dynamic/access-backed`

Recommandation:

- **OPTION C**

Justification:

- elle preserve la verite technique
- elle n'augmente pas la dette de duplication
- elle prepare une couche metier stable, meme si la materialisation core n'est jamais decidee

## 8. TS2 - Anomalies climat

Rappel des cas prioritaires:

- `TMIN > TMAX`, station `1940/48`, date `2022-03-01`
- `TMEAN = 101.1`, station `1940/48`, date `1994-01-01`
- 7 series `TRES_INCOMPLET`
- 17 series `PARTIEL`

### LOT C1 - Anomalies ponctuelles manifestes

SOURCE A RECHERCHER:

- donnees sources historiques ABHGZR
- fichiers de staging correspondants
- traces d'import initiales

VALIDATION METIER:

- confirmer la valeur correcte avec l'equipe metier/hydrologie-climat

CORRECTION POSSIBLE:

- correction ponctuelle unitaire ou reimport ponctuel depuis la source autoritative

RISQUE:

- faible en volumetrie, eleve en confiance si la preuve source manque

ROLLBACK:

- revert ligne a ligne documente
- ou restauration du lot de correction

### LOT C2 - Gaps importants

SOURCE A RECHERCHER:

- catalogues sources journaliers/mensuels
- inventaires de donnees manquantes
- historique des imports et des fichiers bruts

VALIDATION METIER:

- distinguer manque reel vs absence de mesure historique vs import incomplet

CORRECTION POSSIBLE:

- reimport depuis une source officielle complete
- sinon conserver le trou et documenter le statut

RISQUE:

- eleve si un remplissage automatique est tente

ROLLBACK:

- suppression du lot recharge et retour a la baseline

### LOT C3 - Series mensuelles historiques incompletes

SOURCE A RECHERCHER:

- archives mensuelles historiques
- series consolidees officielles
- documentation de frequence attendue par station

VALIDATION METIER:

- confirmer si les series sont structurellement partielles par nature

CORRECTION POSSIBLE:

- reimport complet si source certifiee disponible
- sinon requalification documentaire seulement

RISQUE:

- moyen a eleve, surtout pour les analyses de tendance

ROLLBACK:

- retour a la serie preexistante ou au dump de reference

Interdit:

- ne jamais interpoler automatiquement
- ne jamais combler les gaps a partir d'une estimation

## 9. TS2 - Serie constante

Serie concernee:

- `ts_id = 235`
- `SWAT_SYLDT_HA`
- `SWAT_OUTPUT_01`
- valeur constante `0.0`
- `10 470` points

Verification a preparer:

1. comparer la serie core avec `access.sub_results` pour la meme entite
2. verifier si le meme subbasin est nul sur d'autres scenarios
3. verifier si la valeur nulle est plausible metierement
4. verifier si le mapping reach/subbasin ou la provenance d'import peut expliquer le zero constant
5. verifier si le `0` represente une vraie absence de sediment yield ou une erreur de chargement

Action planifiee:

- qualification uniquement
- aucune modification sans preuve source

## 10. TS3 - Tracabilite batch

Series sans batch:

- observed daily: `30`
- observed monthly: `26`
- `scenario_1`: `57`
- `scenario_2`: `57`
- `scenario_3`: `57`
- `scenario_4`: `57`

Options:

### A. Creer des batches historiques reconstruits avec preuve

Condition:

- seulement si un fichier source, une date de chargement, un perimetre exact et un hash/document de preuve existent

Avantage:

- meilleure auditabilite technique

Risque:

- tres eleve si la preuve est partielle

### B. Creer uniquement des metadonnees de provenance documentaire

Condition:

- lorsqu'on peut prouver l'origine fonctionnelle, mais pas un batch technique complet

Avantage:

- honnête
- utile pour l'audit

Risque:

- demande une couche documentaire ou une table de provenance dediee

### C. Garder `NULL` quand la provenance ne peut pas etre prouvee

Avantage:

- exactitude historique

Risque:

- dette technique conservee

### Recommandation batch

Recommandation: **B + C**, avec A uniquement a titre exceptionnel.

Strategie:

- `SWAT_OUTPUT_01`: conserver le batch technique actuel comme reference prouvee
- observed: documenter la provenance si possible, sinon conserver `NULL`
- `scenario_1..4`: ne creer un vrai batch historique que si le bundle d'import, la date, le scenario et le volume peuvent etre prouves

Regle d'honnetete:

- ne jamais inventer un `batch_id` historique
- ne jamais remplir retroactivement `core.data_batches` sans preuve forte

## 11. TS3 - PK / FK / UNIQUE

### 11.1 Situation actuelle

- `core.timeseries.ts_id`: 383 valeurs, 383 distinctes, aucune contrainte PK
- `core.measurements(ts_id, datetime)`: 0 doublon, index non unique existant
- `core.stations.station_id`: 102 valeurs, 102 distinctes, pas de PK declaree
- `ref.observed_properties.property_id`: 13 valeurs, 13 distinctes, pas de PK declaree
- `core.model_runs.run_id`: 10 valeurs, 10 distinctes, pas de PK declaree

### 11.2 Pre-requis oublies a ne pas ignorer

Les FKs `core.timeseries -> parent tables` ne seront pas possibles tant que les colonnes parentes n'ont pas de contrainte unique ou PK declaree.

Ordre logique de creation futur:

1. declarer les cles uniques/PK sur les tables parentes
2. declarer `core.timeseries PRIMARY KEY (ts_id)`
3. declarer `core.timeseries UNIQUE (station_id, property_id, run_id, source_type, time_step)`
4. declarer les FKs `core.timeseries`
5. declarer `core.measurements UNIQUE (ts_id, datetime)`
6. declarer la FK `core.measurements -> core.timeseries`

### 11.3 Risque par famille

| Action | Risque | Commentaire |
|---|---|---|
| PK parents (`stations`, `properties`, `model_runs`) | Faible | tables tres petites |
| PK `core.timeseries(ts_id)` | Faible | `383` lignes, table minuscule |
| UNIQUE metier `core.timeseries` | Faible | `383` lignes, 0 doublon |
| FK `core.timeseries` | Faible a moyen | necessite parents fiables |
| UNIQUE `core.measurements(ts_id, datetime)` | Moyen a eleve | `3.77M` lignes, index a reconstruire proprement |
| FK `core.measurements(ts_id)` | Moyen | validation sur `3.77M` lignes |

## 12. Ne pas dupliquer les indexes

Indexes existants:

- `core.idx_core_measurements_ts_id_datetime` non unique, environ `120 MB`
- `core.idx_timeseries_lookup` non unique, environ `40 kB`
- `core.idx_timeseries_run` non unique, environ `16 kB`

Regles:

- un index non unique existant **ne peut pas** etre converti magiquement en contrainte `UNIQUE`
- on ne doit pas conserver deux indexes identiques inutilement

Strategie recommandee:

1. creer un **nouvel index unique** sur la meme cle
2. rattacher la contrainte `UNIQUE` a ce nouvel index
3. supprimer ensuite l'ancien index non unique equivalent
4. renommer si necessaire pour garder un nom stable

## 13. Timezone

Constat:

- PostgreSQL fonctionne actuellement avec `America/Los_Angeles`
- le projet metier est marocain
- les `timestamptz` simules s'affichent parfois comme `1994-12-31 16:00:00-08` pour un jour logique `1995-01-01`

### OPTION A - DB session UTC

Avantages:

- lecture SQL plus intuitive
- moins d'ambiguite pour les dates simulees

Risques:

- changement de comportement pour les scripts et outils existants
- possible evolution de certains hashes d'API et exports

### OPTION B - Backend normalise UTC

Avantages:

- stockage intact
- responsabilite de normalisation centralisee
- tres compatible avec les API web

Risques:

- demande une revue des serialisations actuelles
- peut faire evoluer quelques payloads visibles

### OPTION C - Conserver DB actuelle mais documenter/normaliser les reponses

Avantages:

- risque minimal
- aucun changement de stockage

Risques:

- ambiguite partiellement conservee

### Recommandation timezone

Recommandation: **B + C**

Strategie:

- ne pas toucher aux timestamps stockes
- considerer UTC comme referentiel canonique d'echange
- conserver temporairement la DB telle quelle
- documenter explicitement la difference entre:
  - stockage `timestamptz`
  - logique de jour metier
  - rendu API/UI

## 14. Fallbacks

| Service | Source actuelle | Fallback | Pourquoi | Cible long terme | Condition pour supprimer le fallback |
|---|---|---|---|---|---|
| `catalog.service.ts` | `public.v_ts_catalog_enriched` + `api.mv_scenario_catalog` | runs virtuels + services SWAT | exposer des scenarios/proprietes absents du coeur pur | un seul catalogue canonique | scenarios visibles uniques et hashes proteges stables |
| `timeseries.service.ts` | `core.measurements` | services SWAT / unions mappees | combler les manques core par scenario/module | resolveur unique declaratif | parite prouvee core/access pour les routes protegees |
| `hydroSwatSeries.service.ts` | `api.mv_hydro_station_stats` ou `access.rch_results` | derives runtime | les scenarios SWAT visibles ne sont pas tous en core | source canonique SWAT hydro unique | `etat_actuel/ssp*` et pas SWAT cibles couverts |
| `erosionSwatSeries.service.ts` | core partiel + definitions dynamiques | `access.rch_results`, `access.sub_results` | `SWAT_SED_IN_TONS` / `SWAT_SED_CONC_MG_KG` n'existent pas en core | couche metier explicite pour proprietes dynamiques | contrat dynamique formalise ou materialisation comparee |
| `spatial.service.ts` | core quand resolvable | `access.rch_results` | core incomplet selon scenario/time_step | route spatiale sur source canonique unique | parite geometrique et temporelle prouvee |
| `stationSimulation.service.ts` | observed core + service SWAT | fallback inverse vers core SWAT | masquer les divergences entre chemins SWAT | meme source selon scenario donne | run mapping stable et couverture complete |

Principe:

- aucun fallback ne doit etre retire tant que la source de remplacement n'est pas disponible, comparee a la baseline et validee fonctionnellement

## 15. Strategie de protection

### AVANT chaque sous-phase

1. verifier le backup
2. relever la baseline actuelle
3. executer `compare-functional-baseline.py`
4. relever les volumes cibles (`timeseries`, `measurements`, `access.*`, scenarios)

### PENDANT

5. travailler par un seul lot
6. utiliser une transaction quand c'est applicable
7. journaliser le perimetre exact du changement

### APRES

8. executer `compare-functional-baseline.py`
9. backend `npm run check`
10. frontend `npm run check`
11. smoke API protegees
12. smoke modules metier

Si une regle `RULE-01` a `RULE-10` echoue:

- rollback immediat

## 16. Ordre recommande des corrections

Ordre recommande:

1. `DQ6-A - Catalogue scenario`
2. `DQ6-B - Documentation core/access et proprietes dynamiques`
3. `DQ6-C - Qualification climat`
4. `DQ6-D - Batch lineage`
5. `DQ6-E - PK/FK/UNIQUE (d'abord sur clone, puis maintenance ciblee)`
6. `DQ6-F - Normalisation timezone API/documentation`
7. `DQ6-G - Eventuelle materialisation core du yearly pour scenario_1..4`
8. `DQ6-H - Eventuelle materialisation core des scenarios access-only`
9. `DQ6-I - Reduction progressive des fallbacks`

Pourquoi cet ordre:

- les sous-phases `A` et `B` clarifient le contrat sans toucher aux donnees
- `C` et `D` qualifient les zones floues avant de renforcer les contraintes
- `E` ajoute des garde-fous avant les materialisations lourdes
- `F` stabilise l'interpretation temporelle
- `G` est un petit chantier de convergence possible
- `H` est le chantier le plus risqué et doit rester optionnel
- `I` n'est possible qu'en dernier

## 17. Classification du risque

| Action | Risque | Donnees concernees | Rollback | Validation metier |
|---|---|---|---|---|
| DQ6-A dedoublage visible `catalog/runs` | Faible | API catalogue | revert code/API | Non |
| DQ6-B formalisation proprietes dynamiques | Faible | documentation/API metadata | revert code/doc | Non |
| DQ6-C correction ponctuelle climat | Moyen | quelques mesures observed | revert lot cible | Oui |
| DQ6-C reimport series mensuelles | Eleve | series observed protegees | rollback batch/reload | Oui |
| DQ6-D provenance documentaire | Faible | metadata | revert doc/metadata | Oui si interpretation contestee |
| DQ6-D batch technique reconstruit | Eleve | lineage historique | suppression lot prouve | Oui |
| PK parents | Faible | tables petites | drop constraint/index | Non |
| PK/UNIQUE `core.timeseries` | Faible | 383 series | drop constraint/index | Non |
| UNIQUE `core.measurements` | Moyen a eleve | 3.77M lignes | drop nouvel index/constraint | Non |
| FK `core.measurements` | Moyen | 3.77M lignes | drop constraint | Non |
| DQ6-F normalisation timezone API | Moyen | payloads dates | revert code/config | Non |
| DQ6-G yearly core `scenario_1..4` | Moyen | 228 series / 6 612 mesures | suppression lot compare | Oui |
| DQ6-H daily/monthly/yearly core `etat_actuel/ssp*` | Tres eleve | jusqu'a 684 series / 8.52M mesures | suppression lot + possible restore | Oui |
| DQ6-I suppression d'un fallback | Tres eleve | routes protegees | revert code immediat | Oui |

## 18. Actions qui ne doivent pas etre faites

Interdit a ce stade:

- supprimer `access.rch_results`
- supprimer `access.sub_results`
- supprimer `public.v_ts_catalog_enriched`
- supprimer `api.mv_scenario_catalog`
- supprimer les 383 timeseries protegees
- "dedupliquer" `core.measurements` alors que 0 doublon est confirme
- remplir automatiquement les gaps climat
- modifier massivement les timestamps existants
- supprimer les runs virtuels sans changer le backend de resolution
- propager massivement `access -> core` sans lot de preuve et baseline
- creer de faux `batch_id` historiques
- convertir automatiquement `yearly` en `annual` sans qualification

## 19. Criteres de sortie pour chaque sous-phase

Une sous-phase n'est validee que si:

- BASELINE: `OK`
- DATA LOSS: `NON`
- BACKEND CHECK: `OK`
- FRONTEND CHECK: `OK`
- API PROTEGEES: `OK`
- SCENARIOS PROTEGES: `OK`
- TIMESERIES: `>= 383` sauf justification validee
- MEASUREMENTS: `>= 3 773 400` sauf justification validee

## 20. SQL futur propose mais non execute

Important:

- SQL propose uniquement
- aucun de ces ordres ne doit etre execute sans clone, fenetre de maintenance et rollback

### 20.1 Pre-checks parents

```sql
SELECT COUNT(*) AS total,
       COUNT(station_id) AS non_null_ids,
       COUNT(DISTINCT station_id) AS distinct_ids
FROM core.stations;

SELECT COUNT(*) AS total,
       COUNT(property_id) AS non_null_ids,
       COUNT(DISTINCT property_id) AS distinct_ids
FROM ref.observed_properties;

SELECT COUNT(*) AS total,
       COUNT(run_id) AS non_null_ids,
       COUNT(DISTINCT run_id) AS distinct_ids
FROM core.model_runs;
```

Pre-requis futurs:

```sql
CREATE UNIQUE INDEX CONCURRENTLY idx_core_stations_station_id_uq
  ON core.stations (station_id);

ALTER TABLE core.stations
  ADD CONSTRAINT pk_core_stations PRIMARY KEY USING INDEX idx_core_stations_station_id_uq;

CREATE UNIQUE INDEX CONCURRENTLY idx_ref_observed_properties_property_id_uq
  ON ref.observed_properties (property_id);

ALTER TABLE ref.observed_properties
  ADD CONSTRAINT pk_ref_observed_properties PRIMARY KEY USING INDEX idx_ref_observed_properties_property_id_uq;

CREATE UNIQUE INDEX CONCURRENTLY idx_core_model_runs_run_id_uq
  ON core.model_runs (run_id);

ALTER TABLE core.model_runs
  ADD CONSTRAINT pk_core_model_runs PRIMARY KEY USING INDEX idx_core_model_runs_run_id_uq;
```

### 20.2 PK `core.timeseries`

Pre-check:

```sql
SELECT COUNT(*) AS total,
       COUNT(ts_id) AS non_null_ts_id,
       COUNT(DISTINCT ts_id) AS distinct_ts_id
FROM core.timeseries;
```

SQL propose:

```sql
CREATE UNIQUE INDEX CONCURRENTLY idx_core_timeseries_ts_id_uq
  ON core.timeseries (ts_id);

ALTER TABLE core.timeseries
  ADD CONSTRAINT pk_core_timeseries PRIMARY KEY USING INDEX idx_core_timeseries_ts_id_uq;
```

Impact estime:

- verrou long: faible
- verrou bref au rattachement de contrainte: oui
- duree estimee: tres courte, table minuscule

Rollback:

```sql
ALTER TABLE core.timeseries DROP CONSTRAINT IF EXISTS pk_core_timeseries;
DROP INDEX CONCURRENTLY IF EXISTS core.idx_core_timeseries_ts_id_uq;
```

### 20.3 UNIQUE metier `core.timeseries`

Pre-check:

```sql
SELECT station_id, property_id, run_id, source_type, time_step, COUNT(*)
FROM core.timeseries
GROUP BY station_id, property_id, run_id, source_type, time_step
HAVING COUNT(*) > 1;
```

SQL propose:

```sql
CREATE UNIQUE INDEX CONCURRENTLY idx_timeseries_lookup_uq
  ON core.timeseries (station_id, property_id, run_id, source_type, time_step);

ALTER TABLE core.timeseries
  ADD CONSTRAINT uq_core_timeseries_business
  UNIQUE USING INDEX idx_timeseries_lookup_uq;

DROP INDEX CONCURRENTLY IF EXISTS core.idx_timeseries_lookup;
```

Note:

- l'index actuel `idx_timeseries_lookup` est non unique
- il ne faut pas conserver deux indexes identiques

### 20.4 FK `core.timeseries`

Pre-checks:

```sql
SELECT COUNT(*) AS orphans_station
FROM core.timeseries t
LEFT JOIN core.stations s ON s.station_id = t.station_id
WHERE s.station_id IS NULL;

SELECT COUNT(*) AS orphans_property
FROM core.timeseries t
LEFT JOIN ref.observed_properties p ON p.property_id = t.property_id
WHERE p.property_id IS NULL;

SELECT COUNT(*) AS orphans_run
FROM core.timeseries t
LEFT JOIN core.model_runs r ON r.run_id = t.run_id
WHERE r.run_id IS NULL;
```

SQL propose:

```sql
ALTER TABLE core.timeseries
  ADD CONSTRAINT fk_core_timeseries_station
  FOREIGN KEY (station_id)
  REFERENCES core.stations (station_id)
  NOT VALID;

ALTER TABLE core.timeseries
  VALIDATE CONSTRAINT fk_core_timeseries_station;

ALTER TABLE core.timeseries
  ADD CONSTRAINT fk_core_timeseries_property
  FOREIGN KEY (property_id)
  REFERENCES ref.observed_properties (property_id)
  NOT VALID;

ALTER TABLE core.timeseries
  VALIDATE CONSTRAINT fk_core_timeseries_property;

ALTER TABLE core.timeseries
  ADD CONSTRAINT fk_core_timeseries_run
  FOREIGN KEY (run_id)
  REFERENCES core.model_runs (run_id)
  NOT VALID;

ALTER TABLE core.timeseries
  VALIDATE CONSTRAINT fk_core_timeseries_run;
```

### 20.5 UNIQUE `core.measurements(ts_id, datetime)`

Pre-check:

```sql
SELECT ts_id, datetime, COUNT(*)
FROM core.measurements
GROUP BY ts_id, datetime
HAVING COUNT(*) > 1;
```

SQL propose:

```sql
CREATE UNIQUE INDEX CONCURRENTLY idx_core_measurements_ts_id_datetime_uq
  ON core.measurements (ts_id, datetime);

ALTER TABLE core.measurements
  ADD CONSTRAINT uq_core_measurements_ts_datetime
  UNIQUE USING INDEX idx_core_measurements_ts_id_datetime_uq;

DROP INDEX CONCURRENTLY IF EXISTS core.idx_core_measurements_ts_id_datetime;
```

Impact estime:

- table d'environ `210 MB`
- index existant equivalent d'environ `120 MB`
- operation vraisemblablement de l'ordre de quelques minutes sur le volume actuel, a confirmer sur clone
- `CREATE UNIQUE INDEX CONCURRENTLY` limite le blocage mais scanne toute la table

### 20.6 FK `core.measurements(ts_id) -> core.timeseries(ts_id)`

Pre-check:

```sql
SELECT COUNT(*) AS orphans_measurements
FROM core.measurements m
LEFT JOIN core.timeseries t ON t.ts_id = m.ts_id
WHERE t.ts_id IS NULL;
```

SQL propose:

```sql
ALTER TABLE core.measurements
  ADD CONSTRAINT fk_core_measurements_ts
  FOREIGN KEY (ts_id)
  REFERENCES core.timeseries (ts_id)
  NOT VALID;

ALTER TABLE core.measurements
  VALIDATE CONSTRAINT fk_core_measurements_ts;
```

Note:

- l'index `(ts_id, datetime)` peut servir aussi aux controles lies a `ts_id` grace a son prefixe gauche

## 21. Tests et rollback

Tests minimaux par sous-phase:

1. `compare-functional-baseline.py`
2. backend `npm run check`
3. frontend `npm run check`
4. smoke `GET /api/v1/catalog/runs`
5. smoke `GET /api/v1/catalog/availability/climat`
6. smoke `GET /api/v1/catalog/availability/hydro`
7. smoke `GET /api/v1/catalog/availability/erosion`
8. smoke `GET /api/v1/spatial/reaches`
9. smoke `GET /api/v1/data-scan/periods/global`
10. smoke modules Climat, Hydrologie, Sediments, Spatial, Data Scan

Rollback:

- code/doc: revert Git cible
- contraintes/indexes: drop cible
- chargement de donnees: suppression du lot si strictement journalise
- en dernier recours: restauration depuis dump de reference

## 22. Decisions necessaires

Decisions a prendre avant execution des corrections:

1. choisir le modele canonique `run reel visible / run virtuel alias cache`
2. valider que `etat_actuel`, `ssp126`, `ssp245`, `ssp585` restent `access` a court terme
3. choisir la politique de provenance honnête `B + C` pour les batches
4. valider que `scenario_1..4 yearly` n'est materialise que plus tard, apres comparaison
5. valider que `SWAT_SED_IN_TONS` et `SWAT_SED_CONC_MG_KG` restent dynamiques a court terme
6. valider UTC comme referentiel canonique d'echange, sans update des timestamps stockes
7. valider la sequence parents -> timeseries -> measurements pour les futures contraintes

## 23. Point d'arret

Aucune correction DB appliquee.
Aucun update de mesure applique.
Aucune modification de scenario appliquee.
Aucune contrainte appliquee.
Aucune materialisation core lancee.

## 24. Synthese finale

A CORRIGER EN PREMIER:

- `DQ6-A - Catalogue scenario`
- `DQ6-B - Documentation core/access et proprietes dynamiques`

A CORRIGER APRES VALIDATION METIER:

- anomalies climat `C1/C2/C3`
- qualification de la serie constante `ts_id=235`
- eventuelle materialisation `yearly` de `scenario_1..4`
- eventuelle materialisation core de `etat_actuel/ssp*`

A CONSERVER TEL QUEL:

- `OBSERVED` et `SWAT_OUTPUT_01` en l'etat
- `public.v_ts_catalog_enriched`
- `api.mv_scenario_catalog` tant que le modele canonique n'est pas remplace

A NE SURTOUT PAS SUPPRIMER:

- `access.rch_results`
- `access.sub_results`
- les 383 timeseries protegees
- les 3 773 400 measurements protegees
- les fallbacks actifs avant remplacement prouve

CONTRAINTES DB PRETES A ETRE ENVISAGEES:

- PK parents sur `core.stations`, `ref.observed_properties`, `core.model_runs`
- PK `core.timeseries(ts_id)`
- UNIQUE metier `core.timeseries(...)`
- UNIQUE `core.measurements(ts_id, datetime)`
- FK `core.timeseries -> parents`
- FK `core.measurements -> core.timeseries`

DONNEES CLIMAT A VALIDER:

- `1940/48` `TMIN > TMAX` le `2022-03-01`
- `1940/48` `TMEAN = 101.1` le `1994-01-01`
- 7 series `TRES_INCOMPLET`
- 17 series `PARTIEL`

FALLBACKS ENCORE NECESSAIRES:

- `catalog.service.ts`
- `timeseries.service.ts`
- `hydroSwatSeries.service.ts`
- `erosionSwatSeries.service.ts`
- `spatial.service.ts`
- `stationSimulation.service.ts`
