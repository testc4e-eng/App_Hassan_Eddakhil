# VALIDATION MANUELLE DES OBJETS LEGACY RESTANTS - LOT 2 - HYDRO_HD

Date : 2026-08-11  
Heure : 13:07

## Contexte

Base officielle :

- `hydro_hd`

Objet de cette validation manuelle :

- trancher si les `5` objets legacy restants doivent encore rester dans PostgreSQL ;
- verifier si leur valeur est encore utile au runtime actuel ;
- verifier si leur dump valide suffit desormais comme archive ;
- ne faire **aucun DROP** et **aucune modification PostgreSQL**.

PostgreSQL modifie :

- `NON`

## 1. Verification des exports

Dossier d'exports valide :

- `D:\3- Projets\App_Hassan_Addakhil\backups\lot2_legacy_20260811_1241`

| Objet | Dump | Taille | pg_restore --list | Objet present |
| --- | --- | ---: | --- | --- |
| `audit.gis_reach_shapes_backup_2026` | `audit.gis_reach_shapes_backup_2026.dump` | `558522` octets | `OK` | `OUI` |
| `audit.gis_subbasin_shapes_backup_2026` | `audit.gis_subbasin_shapes_backup_2026.dump` | `809343` octets | `OK` | `OUI` |
| `audit.nv_limite` | `audit.nv_limite.dump` | `1834993` octets | `OK` | `OUI` |
| `audit.swat_entity_map_backup_2026` | `audit.swat_entity_map_backup_2026.dump` | `2560` octets | `OK` | `OUI` |
| `gis.reach_shapes_backup_20260422_144537` | `gis.reach_shapes_backup_20260422_144537.dump` | `558905` octets | `OK` | `OUI` |

Conclusion export :

- les `5` objets ont un dump exploitable ;
- chaque dump a une taille `> 0` ;
- chaque dump passe `pg_restore --list` ;
- chaque objet est bien present dans son dump.

## 2. Verification usage runtime

Verification code/depot actif :

- recherche `rg` hors `*.md`, `backups/**`, `archive/**`, `*.dump`, `node_modules/**`, `dist/**`, `build/**`
- resultat : **aucune reference active** aux `5` objets

Verification PostgreSQL :

- dependances SQL entrantes = `0`
- FK = `0`
- triggers = `0`
- vues dependantes = `0`
- fonctions dependantes = `0`

Conclusion runtime :

- aucun des `5` objets n'est necessaire au runtime actuel ;
- leur valeur restante est uniquement `historique`, `audit`, ou `comparaison legacy`.

## 3. Analyse par objet

### A. `audit.gis_reach_shapes_backup_2026`

Etat :

- `33` lignes
- codification `200001..200033`
- `14` reaches absents du runtime actif :
  - `200020..200033`

Valeur unique :

- conserve un jeu legacy de `33` reaches non utilise par l'application ;
- preserve une ancienne codification `200001..200033` qui n'existe pas dans le runtime actif `1..19`.

Comparaison avec le runtime :

- runtime `gis.reach_shapes` = `19` lignes
- aucune reference backend/frontend/scripts
- `19` jointures possibles par `subbasin_id`, mais :
  - `0` `reach_code` identique
  - `0` `length_m` identique
  - `0` `slope_pct` identique
  - `0` `source_attrs` identique

Comparaison avec `gis.reach_shapes_backup_20260422_144537` :

- `33/33` geometries exactes communes
- meme geometrie legacy, mais autre codification :
  - ici `200001..200033`
  - snapshot GIS `112..284`

Valeur pour l'application actuelle :

- `AUCUNE`

Valeur historique :

- `OUI`, mais entierement preservable par le dump dedie.

Decision :

- `SUPPRIMABLE APRES EXPORT`

Justification :

- aucune utilisation runtime ;
- aucune dependance SQL ;
- la valeur restante est purement historique ;
- le dump conserve deja cette version de codification et permet une restauration ciblee si besoin.

### B. `audit.gis_subbasin_shapes_backup_2026`

Etat :

- `33` lignes
- `14` subbasins absents du runtime actif :
  - `20..33`

Valeur unique :

- conserve une ancienne delimitation a `33` subbasins ;
- le runtime actif n'en utilise que `19`.

Comparaison avec le runtime :

- runtime `gis.subbasin_shapes` = `19` lignes
- `19` codes communs, mais :
  - `0` geometrie exacte identique
  - `0` `area_m2` identique
  - `0` `source_attrs` identique

Valeur pour l'application actuelle :

- `AUCUNE`

Valeur historique :

- `OUI`, comme couche legacy de comparaison spatiale ;
- cette valeur est preservable par le dump dedie.

Decision :

- `SUPPRIMABLE APRES EXPORT`

Justification :

- non utilise par le runtime ;
- aucun backend, script, FK ou vue dependante ;
- le seul apport est historique ;
- la conservation dans la base active n'apporte pas de valeur supplementaire une fois le dump valide stocke.

### C. `audit.nv_limite`

Etat :

- `19` lignes
- couche source legacy des subbasins

Comparaison avec le runtime :

- correspondance `19/19` avec `gis.subbasin_shapes`
- les attributs suivants sont preserves `19/19` dans `gis.subbasin_shapes.source_attrs` :
  - `area`
  - `slo1`
  - `len1`
  - `sll`
  - `csl`
  - `wid1`
  - `dep1`
  - `lat`
  - `long_`
  - `elev`
  - `elevmin`
  - `elevmax`
  - `hydroid`
  - `outletid`

Verification des `2` geometries precedemment signalees comme differentes :

- codes concernes : `4` et `7`
- `symdiff_area = 0`
- distance entre centroïdes de l'ordre de `1e-13`
- meme type geometrique : `MULTIPOLYGON`

Interpretation :

- il ne s'agit pas d'une difference metier utile ;
- il s'agit d'une difference de representation geometrique, pas d'un ecart spatial reel exploitable.

Valeur pour l'application actuelle :

- `AUCUNE`

Valeur historique :

- simple copie brute de la source ;
- le dump suffit comme archive de preuve.

Decision :

- `SUPPRIMABLE APRES EXPORT`

Justification :

- le runtime actif preserve deja les geometries utiles et tous les attributs metier controles ;
- les `2` ecarts detectes ne portent pas de difference spatiale reelle ;
- garder cette table dans PostgreSQL n'apporte plus de valeur applicative.

### D. `audit.swat_entity_map_backup_2026`

Etat :

- `38` lignes
- meme schema que `core.swat_entity_map`

Comparaison avec la table active :

- archive = `38` lignes
- actif = `38` lignes
- meme couverture de codes SWAT `38/38`
- mais seulement `2/38` couples cible reelle identiques

Caracterisation du mapping archive :

- `rch` : `19` lignes, mais les lignes archive pointent massivement vers `subbasin_id = 1` et `reach_id = 1`
- `sub` : `19` lignes, pointent massivement vers `subbasin_id = 1`
- `mapping_method = gis_match`
- `confidence = 0.90 / 0.95`

Caracterisation du mapping actif :

- `rch` : `19` lignes avec `19` `reach_id` distincts et `19` `subbasin_id` distincts
- `sub` : `19` lignes avec `19` `subbasin_id` distincts
- `mapping_method = manual`
- `confidence = 1.00`

Valeur pour l'application actuelle :

- `AUCUNE` pour la table backup
- la table active runtime est `core.swat_entity_map`

Valeur historique :

- `OUI`, comme preuve de l'ancien mapping avant correction ;
- le dump dedie suffit pour conserver cette trace d'audit.

Decision :

- `SUPPRIMABLE APRES EXPORT`

Justification :

- le backend utilise la table active `core.swat_entity_map` ;
- la copie `audit` ne sert qu'a documenter l'ancien etat pre-correction ;
- aucune raison technique de la garder dans la base active une fois son dump valide.

### E. `gis.reach_shapes_backup_20260422_144537`

Etat :

- `33` lignes
- codification `112..284`
- aucune correspondance directe avec le runtime `1..19`

Valeur unique :

- preserve une ancienne codification GIS des `33` reaches legacy ;
- permet d'expliquer une etape historique intermediaire de recodification.

Comparaison avec `audit.gis_reach_shapes_backup_2026` :

- `33/33` geometries exactes communes
- meme emprise geometrique legacy
- mais identifiants, codes et metadonnees differents

Valeur pour l'application actuelle :

- `AUCUNE`

Valeur historique :

- `OUI`, mais deja entierement conservable par son dump specifique.

Decision :

- `SUPPRIMABLE APRES EXPORT`

Justification :

- aucune utilisation runtime ou code ;
- aucun lien SQL ;
- sa seule valeur restante est de documenter une ancienne codification ;
- cette valeur est deja securisee par le dump dedie.

## 4. Tableau final

| Objet | Valeur unique | Runtime | Export valide | Decision | Justification |
| --- | --- | --- | --- | --- | --- |
| `audit.gis_reach_shapes_backup_2026` | Ancienne couche reach a `33` entites avec codification `200001..200033` | `NON` | `OUI` | `SUPPRIMABLE APRES EXPORT` | Historique seulement ; pas de runtime ; dump dedie suffisant |
| `audit.gis_subbasin_shapes_backup_2026` | Ancienne couche subbasin a `33` entites dont `14` absentes du runtime | `NON` | `OUI` | `SUPPRIMABLE APRES EXPORT` | Delimitation legacy non utilisee ; dump dedie suffisant |
| `audit.nv_limite` | Copie brute source des `19` subbasins | `NON` | `OUI` | `SUPPRIMABLE APRES EXPORT` | Attributs preserves `19/19` dans le runtime ; ecarts geometriques non metier |
| `audit.swat_entity_map_backup_2026` | Trace de l'ancien mapping SWAT avant correction | `NON` | `OUI` | `SUPPRIMABLE APRES EXPORT` | Le runtime utilise `core.swat_entity_map` ; la copie `audit` est historique |
| `gis.reach_shapes_backup_20260422_144537` | Snapshot GIS legacy a `33` reaches avec codification `112..284` | `NON` | `OUI` | `SUPPRIMABLE APRES EXPORT` | Historique seulement ; dump dedie suffisant |

## 5. Conclusion

Verdict global :

- les `5` objets restants n'apportent plus de valeur au runtime actuel ;
- leur valeur residuelle est exclusivement `historique` ou `audit` ;
- cette valeur est desormais correctement preservee par les dumps valides du dossier :
  - `D:\3- Projets\App_Hassan_Addakhil\backups\lot2_legacy_20260811_1241`

Conclusion de validation manuelle :

- `0` objet a conserver obligatoirement dans PostgreSQL pour faire fonctionner l'application ;
- `0` objet necessitant encore une validation metier supplementaire ;
- `5` objets sont candidats a une suppression controlee **apres validation utilisateur**.

PostgreSQL modifie :

- `NON`
