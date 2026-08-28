# PROCEDURE RESTAURATION INITIALE ZIZ

Date : 2026-08-27

Statut : brouillon technique C4 pour premiere installation

Projet : `D:\3- Projets\App_Hassan_Addakhil`

## 1. Objectif

Cette procedure prepare le premier demarrage PostgreSQL/PostGIS pour Ziz avec restauration initiale de la base `hydro_hd`.

Elle couvre uniquement :

- preparation des variables ;
- positionnement du dump ;
- demarrage initial du service `db` ;
- verification de la restauration ;
- demarrage ensuite du backend puis du frontend.

## 2. Preconditions

- Disposer d'un dump final valide nomme `hydro_hd_v1.0.0.dump`.
- Disposer de l'image `postgis/postgis:17-3.5`.
- Utiliser un volume PostgreSQL neuf pour la premiere initialisation.
- Ne jamais utiliser cette procedure pour ecraser silencieusement une base de production existante.

## 3. Variables a preparer

Renseigner le fichier d'exemple sans y placer de secrets dans le depot :

- `HDI_DB_NAME=hydro_hd`
- `POSTGRES_USER=...`
- `POSTGRES_PASSWORD=...`
- `DB_EXPOSE_PORT=...`
- `HYDRO_HD_DUMP_PATH=./LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump`

Variables optionnelles utiles :

- `HYDRO_HD_RESTORE_DUMP_PATH`
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`

## 4. Placer le dump

Positionner le dump final dans :

- `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump`

Le montage Docker devra rendre ce fichier visible dans le conteneur sous :

- `/backup/hydro_hd.dump`

Remarque :

- Le nom hote peut etre `hydro_hd_v1.0.0.dump`.
- Le script d'init travaille ensuite sur le chemin conteneur `/backup/hydro_hd.dump`.

## 5. Verifier que le volume DB est vide

La restauration automatique par `/docker-entrypoint-initdb.d` ne se declenche que lors de l'initialisation d'un repertoire PostgreSQL vide.

Scenario attendu :

```text
volume vide
  -> initialisation PostgreSQL
  -> execution des scripts /docker-entrypoint-initdb.d
  -> 10-restore-dump.sh
  -> restauration de hydro_hd
```

Scenario a ne pas confondre :

```text
volume existant
  -> PostgreSQL redemarre
  -> scripts d'init non rejoues
```

Attention :

- Ne jamais utiliser `docker compose down -v` en production sans sauvegarde valide.

## 6. Demarrer uniquement la base pour la premiere installation

Commande cible :

```bash
docker compose up -d db
```

Suivi conseille :

```bash
docker compose logs -f db
```

Attendre les messages de fin de restauration et le message indiquant que PostgreSQL est pret a accepter les connexions.

## 7. Verifications minimales apres restauration

Verifier au minimum :

- la base cible existe ;
- l'extension `postgis` est disponible ;
- les schemas applicatifs sont presents ;
- la vue materialisee `api.mv_scenario_catalog` est presente.

Exemples de controles :

```bash
docker exec <db-container> psql -U <postgres-user> -d hydro_hd -c "SELECT version();"
docker exec <db-container> psql -U <postgres-user> -d hydro_hd -c "SELECT postgis_full_version();"
docker exec <db-container> psql -U <postgres-user> -d hydro_hd -c "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;"
docker exec <db-container> psql -U <postgres-user> -d hydro_hd -c "SELECT to_regclass('api.mv_scenario_catalog');"
```

## 8. Demarrer ensuite backend et frontend

Une fois la base validee :

```bash
docker compose up -d backend frontend
```

Verifier ensuite :

- sante du backend ;
- acces frontend ;
- connexion applicative a `hydro_hd`.

## 9. Sauvegarde future

Pour une sauvegarde PostgreSQL custom :

```bash
./LIVRAISON_ZIZ/03_DATABASE/scripts/backup_hydro_hd.sh
```

Resultat attendu :

- creation d'un fichier `hydro_hd_YYYYMMDD_HHMM.dump`
- verification immediate avec `pg_restore --list`

## 10. Restauration future d'administration

Pour une restauration administree ulterieure :

```bash
./LIVRAISON_ZIZ/03_DATABASE/scripts/restore_hydro_hd.sh /chemin/vers/hydro_hd_YYYYMMDD_HHMM.dump
```

Garanties du script :

- verifie le fichier ;
- affiche la cible ;
- refuse la base `postgres` ;
- exige une confirmation explicite ;
- n'expose pas le mot de passe.

## 11. Decision de livraison

- Le dump actuel `hydro_hd.sql` est techniquement restaurable.
- Il ne doit pas etre retenu comme dump final sans regeneration controlee.
- Le dump final a produire avant la remise Ziz est `hydro_hd_v1.0.0.dump`.

## 12. Points de vigilance

- Ne pas reutiliser un volume PostgreSQL deja peuple pour un test de premiere installation.
- Ne pas confondre la base active applicative `hydro_hd` avec la base actuellement hebergee dans le conteneur Compose `db`.
- Verifier le SHA256 du dump final avant transfert vers Ziz.
- Ne jamais copier de secret dans les rapports de livraison.
