# RAPPORT APPLICATION LOT C4 - DATABASE

Date : 2026-08-27

Projet source : `D:\3- Projets\App_Hassan_Addakhil`

Baseline Git attendue :

- Branche : `ilh_dev_20-07`
- HEAD : `ef62eae98af1c9991ee2287b969cf53f2051db88`

## 1. Etat initial

- Le projet contient un fichier `D:\3- Projets\App_Hassan_Addakhil\hydro_hd.sql`.
- Le service `db` de `docker-compose.yml` utilise l'image `postgis/postgis:17-3.5`.
- Le service `db` monte :
  - le volume logique Compose `hydro_hd_pgdata_ilh0107` vers `/var/lib/postgresql/data` ;
  - `./docker/db/init` vers `/docker-entrypoint-initdb.d` en lecture seule ;
  - `${HYDRO_HD_DUMP_PATH:-./hydro_hd.sql}` vers `/backup/hydro_hd.dump` en lecture seule.
- L'application active ne consomme pas actuellement la base contenue dans le conteneur Compose `db`.
- Le backend actif pointe vers `host.docker.internal:5432` avec la base logique `hydro_hd`.
- Le conteneur Compose `db` contient actuellement des bases `hydro_hd_1714` et `hydro_hd_meta_20260727`, pas la base active `hydro_hd`.

## 2. Fichier dump detecte

- Chemin source : `D:\3- Projets\App_Hassan_Addakhil\hydro_hd.sql`
- Taille exacte : `533241663` octets
- Horodatage fichier : `2026-08-04 09:12:57`
- Signature binaire : `PGDMP`
- Conclusion : le fichier n'est pas un script SQL texte ; c'est une archive PostgreSQL lisible par `pg_restore`.

## 3. Format

Lecture de `pg_restore --list` :

- Format reel : `PostgreSQL custom dump`
- Compression : `gzip`
- Dump version : `1.16-0`
- Base source au moment du dump : `hydro_hd`
- Date de creation de l'archive : `2026-08-04 09:09:49`
- Version PostgreSQL source : `17.8`
- Version `pg_dump` source : `17.8`
- TOC : `610` entrees

Schemas identifies dans le dump :

- `access`
- `api`
- `audit`
- `auth`
- `core`
- `geo`
- `gis`
- `hydro`
- `old_hd`
- `ref`
- `staging`
- `swat_setup`

Extensions detectees dans le dump :

- `pgcrypto`
- `postgis`
- `postgres_fdw`

Point important :

- L'extension de fichier `.sql` est trompeuse.
- Le contenu reel correspond a une archive `pg_dump -Fc`.
- Pour la livraison finale, le nom recommande est `hydro_hd_v1.0.0.dump`.

## 4. Taille

- Taille binaire exacte : `533241663` octets
- Taille approximative : `~508.54 Mio`

## 5. SHA256

- Fichier : `hydro_hd.sql`
- SHA256 : `9A098B4AD33BBAD10B8B5B43E6CCC1D9D76A754DBE855D8DA7C56EDB6C300AE5`

## 6. Version PostgreSQL / PostGIS

Base active utilisee par l'application :

- PostgreSQL : `17.8`
- PostGIS : `3.5.3`
- Extensions relevees : `pgcrypto`, `plpgsql`, `postgis`, `postgres_fdw`

Plateforme Docker cible analysee :

- Image : `postgis/postgis:17-3.5`
- Test isole restaure avec succes sur :
  - PostgreSQL : `17.5`
  - PostGIS : `3.5.2`

Conclusion compatibilite :

- Compatibilite validee au niveau majeur PostgreSQL `17`.
- Compatibilite validee au niveau famille PostGIS `3.5.x`.
- Les extensions requises sont compatibles avec l'image `postgis/postgis:17-3.5`.

## 7. Analyse du script restore

Fichier analyse puis corrige :

- `D:\3- Projets\App_Hassan_Addakhil\docker\db\init\10-restore-dump.sh`

Constat avant correction C4 :

- chemin de dump fixe sur `/backup/hydro_hd.dump` ;
- aucun pre-controle `pg_restore --list` ;
- rafraichissement de `api.mv_scenario_catalog` execute sans verifier sa presence ;
- mode strict present (`set -eu`) mais comportement de validation insuffisant.

Correction appliquee pendant C4 :

- dump configurable via `HYDRO_HD_RESTORE_DUMP_PATH` ;
- verification de la lisibilite de l'archive avec `pg_restore --list` ;
- restauration avec `--exit-on-error` ;
- base cible et utilisateur obligatoires ;
- rafraichissement de `api.mv_scenario_catalog` uniquement si l'objet existe.

Important :

- L'incoherence ne vient pas du chemin dans le conteneur.
- Le montage Compose mappe bien `hydro_hd.sql` vers `/backup/hydro_hd.dump`.
- L'incoherence reelle est surtout documentaire : nom de fichier hote `.sql` pour un dump `PGDMP`.

Sauvegarde C4 creee avant modification :

- `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\01_AUDIT\backups_corrections\C4\10-restore-dump.sh.before_C4`

## 8. Analyse Compose

Points verifies sur `docker-compose.yml` :

- image `db` : `postgis/postgis:17-3.5` ;
- volume persistant present ;
- script d'init monte en lecture seule ;
- dump monte en lecture seule ;
- port expose via `127.0.0.1:${DB_EXPOSE_PORT:-5435}:5432`.

Verification effectuee :

- `docker compose config -q` : succes

Observation runtime actuelle :

- le service `db` est actuellement expose en `127.0.0.1:5436->5432/tcp`

## 9. Dump actuel vs base active

Comparaison en lecture seule uniquement.

### Base active utilisee par l'application

- Nom logique : `hydro_hd`
- Hote : `host.docker.internal`
- Port : `5432`
- Schemas : `access`, `api`, `audit`, `auth`, `core`, `geo`, `gis`, `hydro`, `old_hd`, `public`, `ref`, `staging`, `swat_setup`
- Extensions : `pgcrypto`, `plpgsql`, `postgis`, `postgres_fdw`
- Comptages structurants :
  - tables : `79`
  - vues : `104`
  - vues materialisees : `1`
- Vue materialisee observee : `api.mv_scenario_catalog`

### Dump restaure en environnement isole

- Base de test : `hydro_hd_c4_test`
- Schemas : `access`, `api`, `audit`, `auth`, `core`, `geo`, `gis`, `hydro`, `old_hd`, `public`, `ref`, `staging`, `swat_setup`
- Extensions : `pgcrypto`, `plpgsql`, `postgis`, `postgres_fdw`
- Comptages structurants :
  - tables : `89`
  - vues : `116`
  - vues materialisees : `3`
- Vues materialisees `api` detectees :
  - `api.mv_dashboard_catchment_counts`
  - `api.mv_dashboard_reservoir_counts`
  - `api.mv_scenario_catalog`

### Objets structurant le domaine hydro confirmes dans le dump

- `hydro.bathymetry_campaigns`
- `hydro.siltation_evolution`

Conclusion :

- Le dump est coherant avec la famille applicative attendue.
- Le dump n'est pas identique a la base active actuellement utilisee par l'application.
- Ecart majeur constate : `89/116/3` dans le dump restaure contre `79/104/1` dans la base active.
- Le dump actuel ne doit donc pas etre considere comme dump final de livraison sans regeneration controlee.

## 10. Decision dump final

Decision retenue :

- `OPTION B` - regenerer un nouveau dump final depuis la base `hydro_hd` validee

Justification :

- le fichier actuel est lisible et restaurable ;
- il differencie materiellement de la base active ;
- la livraison professionnelle doit s'appuyer sur un export fige, verifie et trace.

Nom recommande :

- `hydro_hd_v1.0.0.dump`

Format recommande :

- `pg_dump -Fc`

Commande a preparer pour l'etape controlee de generation finale :

```bash
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -Fc \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$HDI_DB_NAME" \
  -f "./LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump"
```

Le nouveau dump n'a pas ete genere pendant C4 afin d'eviter toute confusion tant que la source finale n'est pas explicitement gelee pour la release.

## 11. Test de restauration

Tests realises :

- identification binaire du fichier `hydro_hd.sql` ;
- `pg_restore --list hydro_hd.sql` ;
- calcul SHA256 ;
- verification `docker compose config -q` ;
- verification du volume PostgreSQL actif ;
- inspection du script init ;
- comparaison lecture seule dump vs base active ;
- test de restauration isole complet.

Environnement de test isole cree :

- conteneur temporaire : `hassan-c4-restore-test`
- volume temporaire : `hassan_c4_restore_test_pgdata`
- reseau : `none`
- base cible : `hydro_hd_c4_test`
- image : `postgis/postgis:17-3.5`

Verification post-restauration :

- base creee : oui
- PostGIS present : oui
- schemas attendus presents : oui
- restauration terminee sans erreur bloquante : oui

## 12. Resultat

Resultat principal :

- `DUMP RESTAURABLE : OUI`

Preuves observees :

- `pg_restore --list` lisible sur Windows ;
- restauration isolee terminee avec succes ;
- `api.mv_scenario_catalog` rafraichie a la fin ;
- schemas et extensions attendus presents apres restauration.

Ressources temporaires C4 ensuite supprimees :

- conteneur `hassan-c4-restore-test` : supprime
- volume `hassan_c4_restore_test_pgdata` : supprime

## 13. Volumes

Volume persistant du service Compose `db` :

- nom logique Compose : `hydro_hd_pgdata_ilh0107`
- nom Docker resolu : `app_hassan_addakhil_hydro_hd_pgdata_ilh0107`
- mount point : `/var/lib/docker/volumes/app_hassan_addakhil_hydro_hd_pgdata_ilh0107/_data`
- date de creation relevee : `2026-07-08T09:36:49Z`

Persistance :

- `docker compose down` preserve le volume et les donnees ;
- `docker compose down -v` supprime le volume et les donnees persistantes.

Alerte forte :

- NE JAMAIS UTILISER `docker compose down -v` EN PRODUCTION SANS SAUVEGARDE VALIDE.

## 14. Backup

Script cree :

- `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\03_DATABASE\scripts\backup_hydro_hd.sh`

Fonction :

- cree un dump custom `pg_dump -Fc` ;
- cree le dossier de sortie si necessaire ;
- utilise les variables d'environnement sans afficher le mot de passe ;
- verifie le dump produit avec `pg_restore --list`.

Variables supportees :

- `HDI_DB_NAME`, `PGDATABASE`, `POSTGRES_DB`
- `PGHOST`, `DB_HOST`
- `PGPORT`, `DB_PORT`
- `PGUSER`, `DB_USER`, `POSTGRES_USER`
- `PGPASSWORD`, `DB_PASSWORD`, `POSTGRES_PASSWORD`
- `BACKUP_DIR`

## 15. Restauration

Script cree :

- `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\03_DATABASE\scripts\restore_hydro_hd.sh`

Garanties :

- verifie que le dump existe ;
- verifie qu'il est lisible par `pg_restore` ;
- affiche clairement la cible ;
- refuse la base de maintenance `postgres` ;
- demande confirmation explicite avant restauration ;
- execute `pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error` ;
- rafraichit `api.mv_scenario_catalog` uniquement si l'objet est present.

Le script n'a pas ete execute sur la base de travail pendant C4.

## 16. Risques

- La base active de l'application est externe au conteneur Compose `db` ; il ne faut pas confondre les deux lors de la release.
- Le fichier `hydro_hd.sql` a une extension trompeuse.
- Le dump candidat actuel diverge de la base active ; il doit etre remplace par un dump final regenere.
- Le dump pese plus de `500 Mio` ; transfert et controle d'integrite sont obligatoires.
- Le depot Git contient deja des variations anterieures a la livraison ; il faudra isoler proprement les changements de release.

## 17. Rollback

Rollback technique disponible :

- restaurer l'ancien script via `10-restore-dump.sh.before_C4` si besoin ;
- conserver les scripts de livraison dans `LIVRAISON_ZIZ` ;
- aucun rollback de donnees n'est necessaire car aucune base active n'a ete modifiee.

## 18. Limites restantes

- Le dump final `hydro_hd_v1.0.0.dump` n'a pas encore ete regenere.
- Aucun test de premiere installation complete `frontend + backend + db finale` n'a encore ete mene.
- Les variables finales de production Ziz doivent encore etre figees dans les fichiers d'exemple, sans secrets.

## Conclusion C4

- Format du dump : identifie
- Integrite : controlee par SHA256
- Compatibilite PostgreSQL/PostGIS : validee
- Strategie de restauration : documentee
- Volume persistant : identifie
- Scripts backup/restore : prepares
- Base active : non modifiee
- Ressources temporaires C4 : nettoyees

Decision :

- Lot C4 valide
- Dump final a regenerer lors d'une etape controlee avant constitution du package final Ziz
