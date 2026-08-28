# RAPPORT R3 - INSTALLATION ZIZ ISOLEE

## 1. Objectif

Verifier qu'une premiere installation de la release Ziz `v1.0.0` est reproductible dans un environnement Docker completement isole, a partir uniquement :

- des images Docker versionnees ;
- du compose officiel `LIVRAISON_ZIZ/02_DOCKER/compose/docker-compose.ziz.yml` ;
- d'une configuration de test dediee ;
- du dump final `hydro_hd_v1.0.0.dump`.

Le test devait se faire sans utiliser la base active, les conteneurs actifs, le volume PostgreSQL principal, `host.docker.internal` ou le `.env` personnel.

## 2. Environnement

- Date du test : `2026-08-28`
- Racine projet : `D:\3- Projets\App_Hassan_Addakhil`
- Branche Git constatee avant et apres R3 : `ilh_dev_20-07`
- HEAD constate avant et apres R3 : `ef62eae98af1c9991ee2287b969cf53f2051db88`
- Docker Engine : `29.5.3`
- Docker Compose : `5.1.4`
- Plateforme Docker : `linux/amd64`
- Project name R3 : `hassan-ziz-r3-test-20260828`
- Zone temporaire : `LIVRAISON_ZIZ/07_TESTS_VALIDATION/R3_TEST_INSTALLATION/work`

Baseline stack principal avant / apres R3 :

- backend : `db56353b99da1204288a20d2db6cf69b66b6a1050249794a5942d8d2c561506a`
- frontend : `3434b071d1d1d1dbff352737503c1484f990a4e0bdd7f82afac07ee040e2e2eb`
- db : `1deca1cd7fbc353099dba03e341b77df9eaff1824696d6928f1502ea9b51f3a4`

## 3. Images

Images de release verifiees localement :

- `hassan-addakhil-backend:1.0.0`
  - image id : `sha256:57b8003501fe797d3420112206c620fedf31ea7bab85173c8751b2efe87fb63d`
  - architecture : `amd64`
  - created : `2026-08-28T09:45:47.680864275Z`
- `hassan-addakhil-frontend:1.0.0`
  - image id : `sha256:134dc3d6b72b00d0404f4271fb46d6149d1059063b795a11bed84c398f2df9b1`
  - architecture : `amd64`
  - created : `2026-08-28T09:48:32.182706574Z`
- `postgis/postgis:17-3.5`
  - image id : `sha256:71f7e60358fb03d3f157b9ea34516e8152394752ec7a01b3f9eb293d3aead29e`
  - architecture : `amd64`
  - created : `2026-06-15T11:21:18.20829135Z`

## 4. Configuration

Le compose officiel a pu etre utilise directement :

- aucun `container_name` fixe detecte ;
- images versionnees correctement referencees ;
- `backend` configure avec `DB_HOST=db` et `DB_PORT=5432` ;
- `frontend` publie sur `${FRONTEND_EXPOSE_PORT:-8089}` ;
- `restart: unless-stopped` sur les trois services ;
- `logging` en `json-file` avec `max-size=10m` et `max-file=3`.

Une configuration temporaire R3 a ete creee uniquement dans la zone de travail R3 avec des valeurs non sensibles de test.

Le port host reserve pour le frontend isole etait `18090`.

Le fichier temporaire `.env.r3.test` a ete supprime en fin de mission.

## 5. Dump

- Fichier utilise : `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump`
- Taille constatee : `528758454` octets
- SHA256 constate : `2b77870f109e081b7f6f4cb042502e047ed3533e4b175aa7371765334d93f255`
- Resultat checksum : conforme

## 6. Restauration

Strategie appliquee :

1. demarrage du service `db` seul dans le projet Docker R3 dedie ;
2. verification de l'etat `healthy` ;
3. constat que la base initiale `hydro_hd` creee par l'image etait deja prechargee en extensions PostGIS ;
4. recreation de `hydro_hd` a partir de `template0` pour respecter la strategie portable validee en R1 ;
5. lancement de `pg_restore --verbose --exit-on-error --clean --if-exists --no-owner --no-privileges`.

Resultat :

- restauration interrompue ;
- code retour `1` ;
- blocage constate sur un objet `USER MAPPING` visant le role `postgres`.

Cause technique documentee :

- le dump contient encore `EXTENSION postgres_fdw` ;
- le dump contient `SERVER old_hd_srv` ;
- le dump contient `USER MAPPING postgres SERVER old_hd_srv`.

La preuve structurelle est visible dans `LIVRAISON_ZIZ/03_DATABASE/rapports/hydro_hd_v1.0.0.pg_restore_list.txt` :

- entree `3825` : `SERVER - old_hd_srv postgres`
- entree `7145` : `USER MAPPING - USER MAPPING postgres SERVER old_hd_srv postgres`

Le message d'erreur retenu pour le diagnostic est : role `postgres` absent dans l'environnement R3 cible. Les options sensibles contenues dans le mapping n'ont pas ete reproduites dans ce rapport.

## 7. PostgreSQL / PostGIS

Sur l'environnement R3 :

- PostgreSQL reel : `17.5 (Debian 17.5-1.pgdg110+1)`
- PostGIS reel : `3.5.2`
- `postgis_full_version()` : execution validee

Comparaison avec la source R1 :

- source R1 : PostgreSQL `17.8`
- source R1 : PostGIS `3.5.3`
- image release actuelle : PostgreSQL `17.5`
- image release actuelle : PostGIS `3.5.2`

Compatibilite moteur :

- la pile PostgreSQL / PostGIS demarre correctement ;
- la non-validation R3 ne vient pas du moteur PostGIS lui-meme ;
- la non-validation provient du contenu non portable du dump.

## 8. Backend

Le backend n'a pas ete demarre.

Decision appliquee :

- arret du scenario au premier blocage bloquant de restauration ;
- aucune tentative de contournement automatique ;
- aucune reutilisation de la base active ou de `host.docker.internal`.

Points deja verifies au niveau package :

- image attendue : `hassan-addakhil-backend:1.0.0`
- configuration attendue dans le compose : `DB_HOST=db`
- configuration attendue dans le compose : `DB_PORT=5432`

## 9. Frontend

Le frontend n'a pas ete demarre.

Le port `18090` avait ete reserve pour le test HTTP isole, mais n'a pas ete exploite puisque la restauration de la base a bloque le scenario avant l'etape backend/frontend.

## 10. API

Tests API non executes.

Raison :

- backend non demarre apres echec bloquant de restauration.

## 11. Proxy

Test proxy `frontend -> nginx -> backend -> db` non execute.

Raison :

- frontend et backend non demarres apres echec bloquant de restauration.

## 12. Healthchecks

Constats :

- `db` R3 : `healthy`
- `backend` R3 : non cree
- `frontend` R3 : non cree

Le healthcheck base etait donc valide avant restauration, mais la chaine complete n'a pas pu etre validee.

## 13. Restart

Tests non executes :

- restart DB
- restart stack complet

Raison :

- scenario stoppe apres echec bloquant de restauration.

## 14. Persistance

Test non execute.

Raison :

- la persistance ne peut etre valablement testee qu'apres une restauration complete et un stack fonctionnel.

## 15. Logs

Observations :

- aucun incident Docker n'a ete observe pendant le demarrage isole du service `db` ;
- l'erreur bloquante est apparue pendant `pg_restore`, pas dans le healthcheck Docker ;
- le journal temporaire de restauration a ete supprime apres analyse car il contenait des donnees sensibles du mapping FDW present dans le dump.

## 16. Isolation

Elements d'isolation valides :

- project Docker dedie `hassan-ziz-r3-test-20260828` ;
- reseau dedie `hassan-ziz-r3-test-20260828_default` ;
- volume dedie `hassan-ziz-r3-test-20260828_hydro_hd_pgdata` ;
- aucun impact sur le stack principal ;
- aucun usage du `.env` personnel ;
- aucun usage de `host.docker.internal`.

Bind mounts constates :

- conteneur `db` R3 : un seul volume nomme `hassan-ziz-r3-test-20260828_hydro_hd_pgdata` monte sur `/var/lib/postgresql/data` ;
- aucun bind mount applicatif frontend/backend detecte dans le compose officiel de livraison.

Limite de validation :

- l'absence de dependance host pour le runtime complet backend/frontend n'a pas pu etre testee jusqu'au bout a cause du blocage de restauration.

## 17. Anomalies

### BLOQUANT - dump non portable pour une installation serveur neuve

Fichier / artefact concerne :

- `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump`

Cause :

- le dump embarque encore des objets FDW et un `USER MAPPING` cible sur le role `postgres`.

Impact :

- la restauration echoue dans un environnement neuf ou l'utilisateur PostgreSQL d'installation n'est pas `postgres` ;
- la release n'est pas reproductible sur un serveur isole a partir du package officiel actuel.

### IMPORTANT - presence de matiere sensible dans le dump

Artefacts concernes :

- `LIVRAISON_ZIZ/03_DATABASE/backup/hydro_hd_v1.0.0.dump`
- journal temporaire de restauration R3, supprime apres analyse

Constat :

- les metadonnees FDW restaurees font apparaitre des options sensibles de mapping ;
- aucune valeur sensible n'a ete recopies dans les rapports R3.

Impact :

- le dump de livraison doit etre considere comme non assaini tant que ces objets existent.

## 18. Verdict

Verdict R3 : `NON VALIDE`

Motif principal :

- la restauration du dump final echoue dans un environnement isole pourtant conforme aux prerequis de release.

Ce qui est valide malgre l'echec :

- images de release presentes ;
- checksum du dump correct ;
- compose de livraison exploitable pour un stack isole ;
- demarrage isole de PostgreSQL/PostGIS ;
- nettoyage R3 termine ;
- stack principal intact ;
- branche et HEAD inchanges.

Ce qui reste non valide :

- restauration complete du dump ;
- structure finale de la base ;
- backend ;
- frontend ;
- proxy ;
- restart ;
- persistance ;
- preuve finale d'installation reproductible.

Prochaine etape de processus :

- `R4 - VALIDATION FONCTIONNELLE COMPLETE DE LA RELEASE ZIZ v1.0.0`
- cette etape ne doit toutefois pas etre demarree tant que le blocage R3 n'a pas ete corrige dans un lot separe.
