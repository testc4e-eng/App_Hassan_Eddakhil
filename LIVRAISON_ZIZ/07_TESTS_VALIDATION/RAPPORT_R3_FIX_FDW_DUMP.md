# RAPPORT R3-FIX - ASSAINISSEMENT DU DUMP FDW

Date : 2026-08-28

Projet : Hassan Addakhil

Release cible : Ziz v1.0.0

## 1. Erreur R3

Le test R3 d'installation isole a echoue pendant `pg_restore` du dump `hydro_hd_v1.0.0.dump`.

Cause confirme :

- presence de l'extension `postgres_fdw` ;
- presence du serveur `old_hd_srv` ;
- presence d'un `USER MAPPING` legacy lie au role `postgres` ;
- dependance legacy non portable vers un environnement source historique.

Effet observe en R3 :

- echec de restauration sur une cible neuve avec un utilisateur PostgreSQL different de `postgres`.

## 2. Objets FDW detectes

Inventaire confirme dans la base source active en lecture seule :

- extensions FDW : `postgres_fdw`
- foreign server : `old_hd_srv`
- user mapping : `postgres -> old_hd_srv`
- schema legacy : `old_hd`
- foreign tables legacy : `13`

Foreign tables detectees :

- `old_hd.adm_communes_abhgzr`
- `old_hd.barrages_abhgzr`
- `old_hd.bassin_abhgzr`
- `old_hd.bathymetries_barrages_abhgzr`
- `old_hd.mesures_debits_jr`
- `old_hd.mesures_evaporation_m`
- `old_hd.mesures_humidite_relative_m`
- `old_hd.mesures_lachers_barrages`
- `old_hd.mesures_precipitations_jr`
- `old_hd.mesures_temperature_jr_pn`
- `old_hd.mesures_temperature_m`
- `old_hd.mesures_vitesse_vent_m`
- `old_hd.stations_abhgzr`

Controle sensibilite source :

- `PASSWORD FDW DETECTE : OUI`
- options FDW source : `***REDACTED***`

## 3. Analyse runtime

Question : l'application de production a-t-elle besoin de `old_hd_srv` pour fonctionner ?

Reponse basee sur preuves : `NON`

Preuves croisees :

- recherche dans le code actif `hydro_Hassan dakhil` : aucune reference runtime a `old_hd_srv`, `postgres_fdw` ou au schema `old_hd` ;
- aucune vue active ne reference `old_hd` ou `old_hd_srv` ;
- aucune vue materialisee active ne reference `old_hd` ou `old_hd_srv` ;
- aucune fonction stockee active ne reference `old_hd` ou `old_hd_srv` ;
- aucune dependance SQL catalogable n'a ete detectee sur les foreign tables `old_hd.*`.

Point particulier verifie :

- le backend contient un fallback sur `public.bathymetries_barrages_abhgzr` ;
- la methode `relationExists()` teste `to_regclass(...)` ;
- la relation `public.bathymetries_barrages_abhgzr` est absente dans la base active ;
- le chemin runtime prioritaire utilise des relations locales : `public.v_values_bathymetry`, `core.reservoir_bathymetry`, `public.reservoir_bathymetry`, `core.reservoirs`, `public.reservoirs`.

## 4. Dependances

Resultat des audits de dependances :

- dependances de vues vers `old_hd.*` : aucune
- dependances de vues materialisees vers `old_hd.*` : aucune
- dependances de fonctions vers `old_hd.*` : aucune
- dependances d'objets applicatifs vers `old_hd_srv` : aucune

Matrice de decision :

| Foreign table | Dependances | Consommee par backend | Donnees deja materialisees ailleurs | Decision |
|---|---|---|---|---|
| `old_hd.adm_communes_abhgzr` | Aucune detectee | Non detectee | Non requise au runtime constate | Exclure |
| `old_hd.barrages_abhgzr` | Aucune detectee | Non detectee | Oui, domaine barrage servi par objets locaux/cataloques runtime | Exclure |
| `old_hd.bassin_abhgzr` | Aucune detectee | Non detectee | Oui, domaine bassin servi par objets locaux/cataloques runtime | Exclure |
| `old_hd.bathymetries_barrages_abhgzr` | Aucune detectee | Non detectee directement | Oui, bathymetrie servie par relations locales prioritaires | Exclure |
| `old_hd.mesures_debits_jr` | Aucune detectee | Non detectee | Oui, timeseries runtime servies par vues/tables locales | Exclure |
| `old_hd.mesures_evaporation_m` | Aucune detectee | Non detectee | Oui, timeseries runtime servies par vues/tables locales | Exclure |
| `old_hd.mesures_humidite_relative_m` | Aucune detectee | Non detectee | Oui, timeseries runtime servies par vues/tables locales | Exclure |
| `old_hd.mesures_lachers_barrages` | Aucune detectee | Non detectee | Oui, objets reservoir/barrage locaux disponibles | Exclure |
| `old_hd.mesures_precipitations_jr` | Aucune detectee | Non detectee | Oui, timeseries runtime servies par vues/tables locales | Exclure |
| `old_hd.mesures_temperature_jr_pn` | Aucune detectee | Non detectee | Oui, timeseries runtime servies par vues/tables locales | Exclure |
| `old_hd.mesures_temperature_m` | Aucune detectee | Non detectee | Oui, timeseries runtime servies par vues/tables locales | Exclure |
| `old_hd.mesures_vitesse_vent_m` | Aucune detectee | Non detectee | Oui, timeseries runtime servies par vues/tables locales | Exclure |
| `old_hd.stations_abhgzr` | Aucune detectee | Non detectee | Oui, stations runtime servies par `core.stations`, `public.stations` et catalogues API | Exclure |

## 5. Decision suppression / conservation

Scenario retenu : `SCENARIO A - FDW LEGACY NON NECESSAIRE AU RUNTIME`

Decision :

- conserver tous les objets metier locaux ;
- exclure uniquement les objets FDW legacy non utilises ;
- ne pas recreer de role `postgres` artificiel ;
- ne pas demander a Ziz de recreer `old_hd_srv`.

## 6. Methode d'assainissement

Methode appliquee :

1. lecture de la TOC historique via `pg_restore --list` ;
2. creation d'une liste filtree excluant :
   - `old_hd`
   - `postgres_fdw`
   - `old_hd_srv`
   - `USER MAPPING` legacy
   - les `13` foreign tables `old_hd.*`
3. restauration dans une base temporaire isolee via `pg_restore -L <liste filtree> --no-owner --no-privileges --exit-on-error` ;
4. verification structurelle ;
5. generation d'un nouveau dump avec `pg_dump -Fc --no-owner --no-privileges` ;
6. second restore obligatoire dans une autre base neuve avec un utilisateur non `postgres`.

## 7. Objets exclus

Nombre total d'entrees TOC exclues : `18`

Elements exclus :

- `1` schema
- `1` extension
- `1` commentaire d'extension
- `1` serveur FDW
- `1` user mapping
- `13` foreign tables

Inventaire detaille : `LIVRAISON_ZIZ/03_DATABASE/rapports/OBJETS_FDW_EXCLUS_RELEASE_V1.0.0.md`

## 8. Verifications metier

Base assainie :

- schemas applicatifs : `access`, `api`, `audit`, `auth`, `core`, `geo`, `gis`, `hydro`, `public`, `ref`, `staging`, `swat_setup`
- tables : `79`
- vues : `104`
- vues materialisees : `1`

Objets essentiels confirmes :

- `access.rch_results`
- `access.sub_results`
- `core.reaches`
- `core.stations`
- `core.subbasins`
- `public.stations`
- `public.timeseries`
- `api.mv_scenario_catalog`
- `api.v_catalog_properties`
- `api.v_catalog_stations`
- `api.v_timeseries_enriched`

Indicateurs metier de reference conserves :

- `core.stations = 102`
- `core.reaches = 33`
- `core.subbasins = 33`
- `public.stations = 102`
- `public.timeseries = 383`

## 9. Controle securite

Source historique bloquee :

- `PASSWORD FDW DETECTE : OUI`

Nouveau dump officiel :

- `FDW LEGACY SENSITIVE DATA : ABSENT`

Controles confirmes sur le dump final :

- `old_hd_srv` absent
- `USER MAPPING` legacy absent
- `postgres_fdw` absent
- `old_hd` absent
- aucune foreign table legacy restante
- aucune valeur sensible reproduite dans les rapports

## 10. Nouveau dump

- fichier : `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump`
- format : `PostgreSQL custom dump (PGDMP)`
- source de generation : base temporaire assainie PostgreSQL/PostGIS isolee
- date archive : `2026-08-28 10:54:12`
- taille : `528313425` octets
- TOC Entries : `477`

Historique preserve :

- dump bloque conserve : `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.blocked_fdw.dump`
- statut : `NON LIVRABLE - BLOQUE PAR FDW LEGACY`

## 11. Nouveau SHA256

- nouveau SHA256 officiel : `1f33e0e4295c74edf0ae4dcfaa82196e589e7029db985ecb1e1459ba55f2cbd1`
- ancien SHA256 historique : `2b77870f109e081b7f6f4cb042502e047ed3533e4b175aa7371765334d93f255`

## 12. Second restore

Validation obligatoire executee dans un second environnement completement neuf :

- conteneur : `hassan-ziz-r3fix-validation-20260828104840`
- volume : `hassan_ziz_r3fix_validation_pgdata_20260828104840`
- reseau : `hassan-ziz-r3fix-validation-net-20260828104840`
- utilisateur PostgreSQL : non `postgres`

Resultat :

- `pg_restore` : `exit code 0`
- structure : conforme
- compteurs metier : conformes
- objets legacy FDW : absents

## 13. Comparaison

| Controle | DB assainie source | Second restore | Resultat |
|---|---:|---:|---|
| Tables | `79` | `79` | `OK` |
| Vues | `104` | `104` | `OK` |
| Vues materialisees | `1` | `1` | `OK` |
| `core.stations` | `102` | `102` | `OK` |
| `core.reaches` | `33` | `33` | `OK` |
| `core.subbasins` | `33` | `33` | `OK` |
| `public.stations` | `102` | `102` | `OK` |
| `public.timeseries` | `383` | `383` | `OK` |
| `old_hd_srv` present | `0` | `0` | `OK` |
| `USER MAPPING` legacy | `0` | `0` | `OK` |
| Foreign tables legacy | `0` | `0` | `OK` |
| `postgres_fdw` | `0` | `0` | `OK` |

## 14. Nettoyage

Ressources temporaires a supprimer apres conservation des preuves documentaires :

- conteneur assainissement : `hassan-ziz-r3fix-db-20260828104840`
- volume assainissement : `hassan_ziz_r3fix_pgdata_20260828104840`
- reseau assainissement : `hassan-ziz-r3fix-net-20260828104840`
- conteneur validation : `hassan-ziz-r3fix-validation-20260828104840`
- volume validation : `hassan_ziz_r3fix_validation_pgdata_20260828104840`
- reseau validation : `hassan-ziz-r3fix-validation-net-20260828104840`
- fichiers temporaires de travail R3-FIX

## 15. Verdict

Verdict : `R3-FIX VALIDE`

Le dump officiel Ziz `v1.0.0` est maintenant :

- assaini ;
- portable ;
- depourvu de dependance FDW legacy ;
- depourvu de `USER MAPPING` legacy ;
- depourvu de credentials FDW legacy ;
- restaure avec succes sur une instance PostgreSQL/PostGIS neuve ;
- coherent avec les indicateurs metier de reference ;
- pret pour rejouer R3 depuis zero.
