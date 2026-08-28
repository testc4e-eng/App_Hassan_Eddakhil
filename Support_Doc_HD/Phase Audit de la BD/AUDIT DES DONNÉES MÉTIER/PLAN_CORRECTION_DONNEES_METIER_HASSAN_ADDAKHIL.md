# PLAN DE CORRECTION DES DONNEES METIER - HASSAN ADDAKHIL

Plan redige le 2026-08-10 apres l'audit metier de `hydro_hd`.

Rapport de reference : `D:\3- Projets\App_Hassan_Addakhil\AUDIT_DONNEES_METIER_HASSAN_ADDAKHIL_20260810_1318.md`

Base officielle : `hydro_hd`

## 0. Garde-fous

Cette etape est un plan uniquement.

- Aucune donnee ne doit etre modifiee a ce stade.
- Aucun `UPDATE`, `DELETE`, `INSERT`, `ALTER`, `DROP`, migration ou contrainte ne doit etre lance.
- Aucune geometrie ne doit etre creee, deplacee ou corrigee maintenant.
- Toute correction future devra passer par : backup, dry run, transaction, verification avant/apres et rollback teste.

## 1. Priorites issues de l'audit

### DQ0

1. `SWAT_OUTPUT` vs `SWAT_OUTPUT_01`
2. `etat_actuel`, `ssp126`, `ssp245`, `ssp585` presents dans `access.*` mais absents du core simule

### DQ1

3. 68 stations de `core.stations` sans geometrie
4. `access.rch_results.reach_id` NULL a 100 % et `access.rch_results.reach_code` NULL a 100 %
5. `hydro.siltation_evolution` vide alors que le service legacy reste actif

### Doublons SWAT

- Aucun doublon significatif n'a ete confirme sur les cles testees.
- Aucune deduplication destructive ne doit etre planifiee a ce stade.

## 2. Contexte applicatif confirme

Le plan doit tenir compte du comportement actuel de l'application.

- Le backend expose deja des scenarios SWAT normalises virtuels pour `etat_actuel`, `ssp126`, `ssp245`, `ssp585`, `scenario_1`, `scenario_2`, `scenario_3`, `scenario_4`.
- Les services spatiaux et sedimentaires lisent deja directement `access.rch_results` et `access.sub_results` pour une partie des usages runtime.
- Le module siltation utilise deja `hydro.bathymetry_campaigns` et `core.reservoir_bathymetry` comme source reelle pour une partie des calculs.
- `hydro.siltation_evolution` reste le point legacy direct pour l'evolution annuelle.
- Le pipeline SWAT d'ingestion sait deja construire des mappings via `core.swat_entity_map`, `gis.reach_shapes` et `gis.subbasin_shapes`.

Conclusion immediate :

- il faut privilegier une correction qui stabilise la semantique et le pipeline, plutot qu'une correction manuelle massive des donnees historiques ;
- les scenarios `access.*` ne doivent pas etre consideres comme morts, car ils sont deja consommes par la plateforme.

## 3. DQ0-01 - SWAT_OUTPUT / SWAT_OUTPUT_01

### 3.1 Objectif

Determiner le role exact de chaque code, fixer une nomenclature canonique et choisir une strategie de correction a faible risque.

### 3.2 Perimetre d'analyse future

- `core.model_runs`
- `core.data_batches`
- `core.timeseries`
- `core.measurements`
- `access.import_runs`
- `staging.swat_mdb_imports`

### 3.3 Faits deja etablis

- `SWAT_OUTPUT` apparait cote import/batch.
- `SWAT_OUTPUT_01` apparait cote `core.model_runs`, `core.timeseries`, `core.measurements`.
- `core.data_batches` contient un batch `SWAT_MANUAL_20260422_02` lie a `SWAT_OUTPUT`.
- Le core simule expose aujourd'hui le run `run_id = 2` sous `SWAT_OUTPUT_01`.
- Le backend masque deja `SWAT_OUTPUT` et `SWAT_OUTPUT_01` comme codes legacy, au profit de scenarios normalises visibles.

### 3.4 Informations a produire avant correction

Pour `SWAT_OUTPUT` :

- role fonctionnel ;
- source reelle ;
- batch(s) source ;
- plage de dates ;
- tables alimentees ;
- lien avec `source_file`, `import_batch_id`, `core.data_batches`.

Pour `SWAT_OUTPUT_01` :

- role fonctionnel ;
- `run_id` ;
- nombre de series ;
- nombre de mesures ;
- proprietes concernees ;
- station codes synthetiques utilises ;
- lien avec les batches et imports d'origine.

### 3.5 Options de correction

#### Option A - Conserver `SWAT_OUTPUT_01` comme run canonique

AVANTAGES :

- Aligne la correction sur le core reel deja materialise.
- Evite de toucher immediatement aux lignes de `core.timeseries` et `core.measurements`.
- Risque faible cote runtime core.

RISQUES :

- Le code `SWAT_OUTPUT` continue a exister cote import et batch.
- La dualite reste peu lisible si elle n'est pas documentee.

IMPACT BACKEND :

- Faible si les services continuent d'exposer les scenarios normalises.

IMPACT FRONTEND :

- Faible si le frontend n'affiche pas les codes techniques legacy.

IMPACT DONNEES :

- Faible si aucune re-ecriture de scenario n'est lancee.

ROLLBACK :

- Purement documentaire tant qu'aucune ecriture n'est faite.

#### Option B - Renommer `SWAT_OUTPUT_01` vers `SWAT_OUTPUT`

AVANTAGES :

- Unifie le nom technique et le nom core.

RISQUES :

- Risque eleve sur `core.model_runs`, `core.timeseries`, `core.measurements`, scripts d'import, historisation et services.
- Peut casser les filtres legacy, les comparaisons historiques et les endpoints qui supposent encore `SWAT_OUTPUT_01`.

IMPACT BACKEND :

- Moyen a eleve.

IMPACT FRONTEND :

- Moyen si certains composants ou catalogues ont memorise le nom.

IMPACT DONNEES :

- Eleve car la re-ecriture toucherait des donnees de reference et des dependances logiques.

ROLLBACK :

- Difficile sans sauvegarde et scripts de retour explicites.

#### Option C - Conserver les deux mais expliciter leurs roles

Definition proposee :

- `SWAT_OUTPUT` = code technique d'import/batch/provenance ;
- `SWAT_OUTPUT_01` = run core simule historique ;
- scenarios metier exposes a la plateforme = scenarios normalises visibles, pas les codes legacy.

AVANTAGES :

- Strategie la plus sure pour l'etat actuel du projet.
- Ne casse pas l'historique.
- N'impose aucune re-ecriture massive immediate.
- Rend explicite la separation entre provenance technique et run materialise.

RISQUES :

- La dette de nommage reste presente si elle n'est pas documentee et testee.

IMPACT BACKEND :

- Faible a moyen ; surtout documentation, aliasing explicite et eventuelle validation supplementaire dans le pipeline.

IMPACT FRONTEND :

- Faible si les codes techniques restent caches.

IMPACT DONNEES :

- Faible.

ROLLBACK :

- Simple, car la phase initiale peut rester non destructive.

#### Option D - Refonte complete vers une nomenclature nouvelle

Exemple : renommer les codes techniques en `SWAT_IMPORT_*` et les runs core en `SWAT_RUN_*`.

AVANTAGES :

- Semantique propre a long terme.

RISQUES :

- Risque eleve et cout de migration fort.
- Non adapte a une correction progressive immediate.

IMPACT BACKEND :

- Eleve.

IMPACT FRONTEND :

- Moyen a eleve.

IMPACT DONNEES :

- Eleve.

ROLLBACK :

- Complexe.

### 3.6 Recommandation

Option recommandee : **Option C**

Pourquoi :

- c'est la plus stable pour l'etat actuel ;
- elle respecte les donnees existantes ;
- elle permet de corriger d'abord la documentation, les alias logiques et les controles d'import ;
- elle remet a plus tard toute re-ecriture lourde de `scenario_code`.

### 3.7 Plan de correction futur pour DQ0-01

1. Produire un inventaire complet `SWAT_OUTPUT` / `SWAT_OUTPUT_01`.
2. Documenter la separation provenance technique / run core.
3. Verifier tous les points d'entree backend qui manipulent ces codes.
4. Ajouter un controle d'import qui interdit de creer un nouveau code legacy non documente.
5. Ne planifier un renommage physique que si un besoin metier impose une convergence stricte.

## 4. DQ0-02 - Scenarios access sans core simule

### 4.1 Question a resoudre

Pourquoi `etat_actuel`, `ssp126`, `ssp245`, `ssp585` existent dans :

- `access.rch_results`
- `access.sub_results`

mais pas dans :

- `core.timeseries`
- `core.measurements`

### 4.2 Hypotheses a verifier

- design volontaire : les modules reach/subbasin consomment `access.*` directement ;
- import incomplet vers le core ;
- materialisation core reservee a certains usages station-level ;
- scenarios historiques gardes en fallback seulement ;
- absence de besoin fonctionnel pour les materialiser en `core.*` jusqu'ici.

### 4.3 Tableau de decision initial

| Scenario | Access rch | Access sub | Core series | Core mesures | Utilise par plateforme | Action recommandee |
|---|---:|---:|---:|---:|---|---|
| etat_actuel | 596790 | 596790 | 0 | 0 | OUI - scenario par defaut et fallback access | CONSERVER ACCESS UNIQUEMENT |
| ssp126 | 747707 | 747707 | 0 | 0 | OUI - scenario normalise visible cote SWAT/spatial | CONSERVER ACCESS UNIQUEMENT |
| ssp245 | 747707 | 747707 | 0 | 0 | OUI - scenario normalise visible cote SWAT/spatial | CONSERVER ACCESS UNIQUEMENT |
| ssp585 | 747707 | 747707 | 0 | 0 | OUI - scenario normalise visible cote SWAT/spatial | CONSERVER ACCESS UNIQUEMENT |

### 4.4 Recommandation

Ne rien propager immediatement.

Raison :

- la plateforme semble deja savoir exploiter ces scenarios depuis `access.*` ;
- une propagation prematuree vers `core.*` risque d'introduire des doublons logiques ou de fausser les usages station-level ;
- la propagation ne doit etre decidee qu'apres validation metier du besoin fonctionnel exact.

### 4.5 Conditions qui justifieraient une future propagation

- besoin explicite d'exposer ces scenarios dans les APIs basees uniquement sur `core.timeseries` / `core.measurements` ;
- besoin d'unifier tous les modules sur une seule source `core.*` ;
- besoin d'analyses station-level qui n'existent pas aujourd'hui via le fallback access ;
- validation metier que les proprietes 31/32/33 doivent exister pour ces 4 scenarios dans le core.

## 5. Plan de propagation access -> core

Cette section ne doit etre activee que si la decision de propager est validee.

### 5.1 Source access

- `access.rch_results` pour les proprietes reach :
  - debit SWAT
  - sediment SWAT
- `access.sub_results` pour la degradation specifique / production sedimentaire par sous-bassin

### 5.2 Cibles core

- `core.model_runs`
- `core.timeseries`
- `core.measurements`
- `core.data_batches`

### 5.3 Model run cible

Utiliser de preference les `run_id` deja existants dans `core.model_runs` :

- `etat_actuel` -> `run_id = 3`
- `ssp126` -> `run_id = 4`
- `ssp245` -> `run_id = 5`
- `ssp585` -> `run_id = 6`

Pas de creation de nouveau `run_id` si les runs existants couvrent deja la semantique validee.

### 5.4 Proprietes cibles

- `property_id = 31` : debit SWAT
- `property_id = 32` : sediment SWAT
- `property_id = 33` : degradation specifique SWAT

### 5.5 Entites cibles

- reaches : station codes synthetiques de type `swat_rch_<id_resolu>`
- subbasins : station codes synthetiques de type `swat_sub_<sub_code>`
- station ids : reutiliser les stations synthetiques existantes si elles existent deja, ne pas en dupliquer

### 5.6 Timeseries a creer

Une future propagation devra creer uniquement les series manquantes, sur la cle candidate :

`(station_id, property_id, run_id, source_type, time_step)`

Regles :

- `source_type = simulated`
- `time_step = daily` sauf validation contraire
- anti-join obligatoire contre `core.timeseries`

### 5.7 Measurements a creer

Une future propagation devra inserer uniquement les mesures absentes sur la cle candidate :

`(ts_id, datetime)`

Regles :

- staging intermediaire obligatoire ;
- anti-join ou `ON CONFLICT` si contrainte future disponible ;
- controle de volumes avant/apres.

### 5.8 Batch a enregistrer

Chaque scenario propage devra produire :

- un `batch_id` dedie ;
- une trace `core.data_batches` ;
- le lien vers `source_file`, `import_batch_id`, `scenario_code`, `run_id`, volume source, volume cible ;
- une note explicite indiquant qu'il s'agit d'une propagation access -> core controlee.

### 5.9 Controles d'unicite

Avant toute ecriture future :

- verifier absence de doublons sur la cle candidate de `core.timeseries` ;
- verifier absence de doublons sur `(ts_id, datetime)` dans `core.measurements` ;
- verifier qu'une meme date n'entre pas deux fois pour une meme serie ;
- verifier qu'un meme `station_code` synthetique ne pointe pas vers deux stations core differentes.

### 5.10 Strategie operationnelle

- DRY RUN sur tables temporaires
- BACKUP logique avant execution
- TRANSACTION par scenario
- COMMIT par unite minimale
- ROLLBACK teste
- VALIDATION avant/apres sur volumes, dates, min/max, echantillons

## 6. DQ1-01 - 68 stations sans geometrie

### 6.1 Objectif

Qualifier chaque station sans geometrie avant toute correction, sans jamais inventer de coordonnees.

### 6.2 Sources potentielles a investiguer

- `gis.meteo_stations`
- `staging.norm_stations`
- tables raw historiques de stations
- anciens CSV ou referentiels importes
- mappings existants
- documentation historique de l'import

### 6.3 Inventaire a produire

| Station | Code | Geometrie core | Geometrie disponible ailleurs | Source proposee | Confiance |
|---|---|---|---|---|---|
| station_id | station_code | NULL | geom / non | nom de la source | SOURCE FIABLE / SOURCE PROBABLE / SOURCE AMBIGUE / AUCUNE SOURCE |

### 6.4 Regles de confiance

SOURCE FIABLE :

- meme `station_id`, ou
- `station_code` normalise unique + nom coherent + geometrie non nulle

SOURCE PROBABLE :

- code ou nom suffisamment proches, plus au moins un critere secondaire coherent : commune, altitude, type station

SOURCE AMBIGUE :

- plusieurs sources candidates ;
- conflits de code ou de nom ;
- geometries contradictoires

AUCUNE SOURCE :

- aucun match exploitable

## 7. Plan de correction des stations

### Phase A - stations avec geometrie exacte disponible ailleurs

METHODE :

- correction uniquement si le match est exact et unique ;
- source privilegiee : `gis.meteo_stations`, puis `staging.norm_stations`, puis referentiel historique valide.

RISQUE :

- faible.

CONTROLE :

- verifier unicite du match ;
- verifier coherence `station_code`, nom, type, commune.

ROLLBACK :

- backup de la liste des stations cibles et de leurs valeurs initiales avant toute future mise a jour.

### Phase B - stations avec source probable mais a validation metier

METHODE :

- produire un fichier d'arbitrage metier ;
- aucune mise a jour tant que la validation n'est pas explicite.

RISQUE :

- moyen.

CONTROLE :

- double verification humaine ;
- echantillonnage cartographique ;
- validation par lot restreint.

ROLLBACK :

- transaction par lot ;
- journal des correspondances appliquees.

### Phase C - stations sans source

METHODE :

- ne pas corriger ;
- laisser la geometrie NULL ;
- documenter le manque.

RISQUE :

- faible a moyen selon les usages cartographiques.

CONTROLE :

- liste finale des stations non resolues.

ROLLBACK :

- sans objet tant qu'aucune ecriture n'est faite.

## 8. DQ1-02 - reach_id / reach_code NULL

### 8.1 Constat

`access.rch_results` ne semble pas avoir besoin aujourd'hui de `reach_id` et `reach_code` pour tous les usages runtime, car une partie du code exploite deja `sub_code` et des tables de mapping.

### 8.2 Sources de mapping a verifier

- `access.rch_results.sub_code`
- `core.reaches`
- `gis.reach_shapes`
- `core.swat_entity_map`
- `core.station_reach_map`
- `core.station_subbasin_map`
- autres mappings ou vues de resolution existantes

### 8.3 Inventaire a produire

| sub_code | Reach candidat | reach_id | reach_code | Source mapping | Confiance |
|---|---|---|---|---|---|
| valeur access | reach trouve | id | code | swat_entity_map / gis / station_reach_map / autre | 1:1 FIABLE / 1:N AMBIGU / AUCUN MATCH |

### 8.4 Regles de confiance

1:1 FIABLE :

- un seul reach coherent pour un `sub_code` ;
- correspondance stable entre `sub_code`, `reach_id`, `reach_code`, `subbasin_id`.

1:N AMBIGU :

- plusieurs reaches plausibles ;
- correspondances divergentes selon la source.

AUCUN MATCH :

- aucun reach coherent trouve.

## 9. Plan de remplissage reach

Ne pas remplir maintenant.

### Strategie recommandee

1. **Conserver `sub_code` comme cle technique historique de `access.rch_results`**.
2. **Utiliser `core.swat_entity_map` comme source de verite de resolution**.
3. **Corriger le pipeline d'import futur** pour alimenter le mapping de facon fiable des l'ingestion.
4. **Eviter en premier choix un backfill massif des 3.6 M lignes historiques**.
5. **Si un besoin API impose `reach_id` / `reach_code` partout**, preferer une vue resolue ou une table de mapping dediee avant de toucher aux lignes brutes.

### Pourquoi cette strategie est la meilleure

- elle evite de re-corriger les donnees a chaque nouvel import ;
- elle limite les ecritures massives sur des tables volumineuses ;
- elle s'aligne sur la logique d'ingestion et de fallback deja presente dans le backend ;
- elle permet un backfill historique plus tard, seulement si le mapping est stabilise.

### Strategie future possible

- etape 1 : fiabiliser `core.swat_entity_map` ;
- etape 2 : corriger l'import pour peupler `reach_id` / `reach_code` de facon deterministic ;
- etape 3 : si necessaire, backfill transactionnel de l'historique avec seuil de confiance ;
- etape 4 : ajouter une validation d'import qui refuse les cas ambigus.

## 10. DQ1-03 - Siltation legacy

### 10.1 Objectif

Choisir entre un mode dynamique assume et un maintien des tables legacy `hydro.siltation_*`.

### 10.2 Donnees reelement utilisees aujourd'hui

- `hydro.bathymetry_campaigns` : source metier reelle active
- `core.reservoir_bathymetry` : source reelle active pour interpolations HSV
- `hydro.siltation_hsv` : fallback legacy
- `hydro.siltation_indicators` : fallback / support legacy
- `hydro.siltation_evolution` : legacy direct encore consulte

### 10.3 Option A - Abandonner le legacy vide et utiliser les calculs dynamiques

AVANTAGES :

- S'aligne avec les donnees vraiment presentes.
- Evite de maintenir deux verites.
- Reduit le risque de divergence entre tables derivees et calcul dynamique.

RISQUES :

- Les endpoints legacy devront etre adaptes pour ne plus dependre d'une table vide.

IMPACT API :

- Moyen ; il faut garantir que les contrats API restent stables.

IMPACT FRONTEND :

- Faible a moyen si la structure de reponse est conservee.

MAINTENANCE :

- Plus simple a long terme.

RECOMMANDATION :

- **Option recommandee**

### 10.4 Option B - Alimenter correctement les tables `hydro.siltation_*`

AVANTAGES :

- Conserve la compatibilite legacy sans adaptation majeure du service.

RISQUES :

- Cree une chaine ETL supplementaire ;
- risque de desynchronisation avec `hydro.bathymetry_campaigns` et `core.reservoir_bathymetry`.

IMPACT API :

- Faible a moyen.

IMPACT FRONTEND :

- Faible si les endpoints restent identiques.

MAINTENANCE :

- Plus lourde.

RECOMMANDATION :

- A retenir seulement si une contrainte fonctionnelle impose absolument les tables legacy.

## 11. Doublons SWAT

L'audit ne justifie aucun `DELETE`.

### A prevoir seulement

- cle metier candidate ;
- controle futur a l'import ;
- strategie anti-reimport ;
- eventuelle contrainte ou index futur apres validation.

### Cles candidates a garder comme base de travail

`access.rch_results`

- `(scenario_code, time_step, period_date, COALESCE(reach_id, reach_code, sub_code), table_source, import_batch_id)`

`access.sub_results`

- `(scenario_code, time_step, period_date, sub_code, table_source, import_batch_id)`

### Strategie anti-reimport

- hash du source file ;
- journal de batch ;
- refus d'un batch deja importe si meme scenario, meme pas de temps, meme source, meme fenetre temporelle ;
- comparaison de volumes et d'empreintes avant insertion.

## 12. Contraintes futures a proposer

| Table | Contrainte | Donnees actuelles compatibles | Risque | Interet |
|---|---|---|---|---|
| `core.timeseries` | UNIQUE `(station_id, property_id, run_id, source_type, time_step)` | OUI | faible | tres eleve |
| `core.measurements` | UNIQUE `(ts_id, datetime)` | OUI | faible | tres eleve |
| `core.model_runs` | UNIQUE `scenario_code` si nomenclature validee | OUI | moyen | eleve |
| `access.rch_results` | cle metier candidate | A TESTER | moyen a eleve | eleve |
| `access.sub_results` | cle metier candidate | A TESTER | moyen a eleve | eleve |

## 13. Plan par phase

### Phase DQ-1 - Backup et baseline

OBJECTIF :

- figer une baseline avant toute future correction.

TABLES :

- toutes les tables ciblees par une future correction.

RISQUE :

- faible.

MODIFICATIONS FUTURES :

- aucune sur les donnees ; seulement sauvegardes et inventaires.

TESTS :

- verifier hash, volumes, date de backup, liste des tables.

ROLLBACK :

- restauration depuis backup logique.

CRITERE DE VALIDATION :

- backup disponible et baseline signee.

### Phase DQ-2 - Normalisation scenarios

OBJECTIF :

- fixer la semantique `SWAT_OUTPUT` / `SWAT_OUTPUT_01`.

TABLES :

- `core.model_runs`
- `core.data_batches`
- `access.import_runs`
- `staging.swat_mdb_imports`

RISQUE :

- moyen.

MODIFICATIONS FUTURES :

- documentation, alias logique, eventuelles corrections controlees de metadonnees.

TESTS :

- coherence scenario -> batch -> run ;
- absence de rupture backend/frontend.

ROLLBACK :

- retour aux metadonnees precedentes.

CRITERE DE VALIDATION :

- role de chaque code documente et accepte.

### Phase DQ-3 - Coherence access/core

OBJECTIF :

- decider si `etat_actuel` et les `ssp*` restent en access only ou sont propages.

TABLES :

- `access.rch_results`
- `access.sub_results`
- `core.timeseries`
- `core.measurements`
- `core.model_runs`

RISQUE :

- moyen a eleve.

MODIFICATIONS FUTURES :

- eventuelle propagation par scenario.

TESTS :

- comparaison des volumes ;
- validation fonctionnelle par module ;
- absence de doublons core.

ROLLBACK :

- transaction par scenario ;
- suppression du batch cree si propagation annulee.

CRITERE DE VALIDATION :

- decision explicite scenario par scenario.

### Phase DQ-4 - Geometries stations

OBJECTIF :

- corriger uniquement les stations avec source fiable.

TABLES :

- `core.stations`
- sources de reference candidates

RISQUE :

- moyen.

MODIFICATIONS FUTURES :

- mise a jour selective des geometries.

TESTS :

- comptage des NULL avant/apres ;
- verification cartographique ;
- controle de coherence par station.

ROLLBACK :

- backup des lignes avant correction ;
- transaction par lot.

CRITERE DE VALIDATION :

- aucune geometrie corrigee sans preuve.

### Phase DQ-5 - Mapping reaches

OBJECTIF :

- stabiliser la resolution `sub_code` -> reach.

TABLES :

- `core.swat_entity_map`
- `gis.reach_shapes`
- `core.reaches`
- `core.station_reach_map`
- `core.station_subbasin_map`

RISQUE :

- moyen.

MODIFICATIONS FUTURES :

- correction du mapping et du pipeline d'import, pas de backfill massif en premier.

TESTS :

- taux de match ;
- taux d'ambiguite ;
- verification par echantillons.

ROLLBACK :

- restauration du mapping precedent.

CRITERE DE VALIDATION :

- couverture fiable suffisante pour l'usage cible.

### Phase DQ-6 - Siltation

OBJECTIF :

- trancher entre dynamique assume et alimentation legacy.

TABLES :

- `hydro.siltation_evolution`
- `hydro.siltation_hsv`
- `hydro.siltation_indicators`
- `hydro.bathymetry_campaigns`
- `core.reservoir_bathymetry`

RISQUE :

- moyen.

MODIFICATIONS FUTURES :

- service backend ou alimentation ETL legacy.

TESTS :

- endpoints siltation ;
- coherence des annees, volumes, indicateurs.

ROLLBACK :

- retour au comportement precedent du service.

CRITERE DE VALIDATION :

- source officielle unique et documentee.

### Phase DQ-7 - Contraintes qualite

OBJECTIF :

- securiser les tables saines avec des contraintes ou validations.

TABLES :

- `core.timeseries`
- `core.measurements`
- `core.model_runs`
- `access.rch_results`
- `access.sub_results`

RISQUE :

- moyen a eleve sur grosses tables.

MODIFICATIONS FUTURES :

- contraintes, index, controles d'import.

TESTS :

- verification prealable sur donnees reelles ;
- test de perf ;
- test de compatibilite applicative.

ROLLBACK :

- suppression de contrainte / index si necessaire.

CRITERE DE VALIDATION :

- aucune rupture d'ecriture ou de lecture.

### Phase DQ-8 - Validation applicative

OBJECTIF :

- valider que la plateforme reste fonctionnelle.

TABLES :

- impact indirect uniquement.

RISQUE :

- moyen.

MODIFICATIONS FUTURES :

- aucune donnee ; validation applicative.

TESTS :

- backend ;
- frontend ;
- parcours fonctionnels.

ROLLBACK :

- retour a l'etat precedent si regression.

CRITERE DE VALIDATION :

- zero regression bloquante.

### Phase DQ-9 - Rapport final

OBJECTIF :

- cloturer la correction par un rapport de preuve.

TABLES :

- toutes celles modifiees.

RISQUE :

- faible.

MODIFICATIONS FUTURES :

- aucune ; documentation seulement.

TESTS :

- comparaison avant/apres ;
- checklist complete.

ROLLBACK :

- sans objet.

CRITERE DE VALIDATION :

- rapport complet, tracable et approuve.

## 14. Tests a prevoir apres chaque future correction

### DB

- volumes avant/apres
- doublons
- orphelins
- contraintes candidates
- min/max et echantillons de dates
- verification des lignes touchees uniquement

### BACKEND

- `npm run check`
- endpoint health
- endpoints hydro
- endpoints SWAT
- endpoints spatial
- endpoints siltation

### FRONTEND

- `npm run check`
- verification des vues qui consomment scenarios, cartographie, sediment, siltation

### FONCTIONNEL

- Hydrologie
- Sediments
- Cartographie
- Scenarios
- Siltation
- Data Scan

## 15. Ordre de risque

### Risque faible

- baseline et backups
- inventaire `SWAT_OUTPUT` / `SWAT_OUTPUT_01`
- decision de nomenclature sans re-ecriture de donnees
- inventaire des stations sans geometrie
- decision sur la strategie siltation
- definition des contraintes candidates

### Risque moyen

- propagation access -> core en dry run
- correction selective des geometries avec source fiable
- fiabilisation de `core.swat_entity_map`
- adaptation du service siltation vers le mode dynamique assume

### Risque eleve

- renommage physique massif des `scenario_code`
- backfill massif de `reach_id` / `reach_code` dans `access.rch_results`
- alimentation des tables legacy `hydro.siltation_*` avec ETL durable
- ajout direct de contraintes sur grosses tables sans rehearsal

## 16. Tableau final

| ID | Priorite | Domaine | Anomalie | Action proposee | Risque | Validation necessaire |
|---|---|---|---|---|---|---|
| DQ0-01 | DQ0 | Scenarios SWAT | `SWAT_OUTPUT` vs `SWAT_OUTPUT_01` | Conserver les deux avec roles explicites, documenter et verrouiller le pipeline | faible a moyen | OUI |
| DQ0-02 | DQ0 | Access/Core | `etat_actuel`, `ssp126`, `ssp245`, `ssp585` absents du core simule | Conserver access only tant que le besoin de propagation n'est pas valide | moyen | OUI |
| DQ1-01 | DQ1 | Stations | 68 geometries NULL | Inventaire par source et correction par confiance | moyen | OUI |
| DQ1-02 | DQ1 | Reaches | `reach_id` / `reach_code` NULL | Stabiliser un mapping et corriger d'abord le pipeline, pas l'historique massif | moyen | OUI |
| DQ1-03 | DQ1 | Siltation | `hydro.siltation_evolution` vide | Basculer vers un mode dynamique assume ou alimenter le legacy apres arbitrage | moyen | OUI |
| DQ2-01 | DQ2 | SWAT | doublons non confirmes | Aucun delete, seulement controles futurs | faible | NON |
| DQ2-02 | DQ2 | Contraintes | cles candidates non materialisees | Ajouter plus tard apres validation et rehearsal | moyen a eleve | OUI |

## 17. Decision simple

### A corriger en premier

- Clarifier `SWAT_OUTPUT` / `SWAT_OUTPUT_01`
- Statuer sur `etat_actuel` et les `ssp*` en access only vs propagation
- Inventorier les 68 stations sans geometrie
- Stabiliser la strategie de mapping reach
- Decider la strategie siltation dynamique vs legacy

### A corriger apres validation metier

- Propagation eventuelle access -> core
- Correction des geometries de confiance probable
- Backfill historique reach si vraiment necessaire

### A ne pas toucher pour l'instant

- deduplication destructive SWAT
- renommage physique massif des scenarios
- remplissage manuel massif de `reach_id` / `reach_code`
- alimentation forcée des tables legacy siltation sans arbitrage

### Contraintes a ajouter plus tard

- UNIQUE sur `core.timeseries`
- UNIQUE sur `core.measurements(ts_id, datetime)`
- UNIQUE sur `core.model_runs.scenario_code` si la nomenclature finale est validee
- validation / contrainte candidate sur `access.rch_results`
- validation / contrainte candidate sur `access.sub_results`

### Donnees considerees saines

- `core.timeseries`
- `core.measurements`
- `ref.observed_properties`
- `hydro.bathymetry_campaigns`
- `core.reservoir_bathymetry`

## 18. Point d'arret

Ce document est un plan detaille uniquement.

- aucune correction appliquee ;
- aucune donnee modifiee ;
- aucune contrainte creee ;
- aucune geometrie corrigee ;
- aucune propagation access -> core lancee.

La suite devra se faire correction par correction, avec backup, transaction, dry run et tests de non-regression.
