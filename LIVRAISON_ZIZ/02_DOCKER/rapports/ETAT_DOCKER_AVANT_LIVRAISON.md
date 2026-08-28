# Etat Docker Avant Livraison

Date de constat : 2026-08-27
Mode : lecture seule
Objet : photographie documentaire de l'etat Docker avant toute correction de livraison

## 1. Methode

Les constats ci-dessous proviennent uniquement de commandes de lecture et de l'inspection de fichiers :

- `docker compose config --services`
- `docker compose config --images`
- `docker compose ps`
- `docker compose images`
- `docker ps -a`
- `docker images`
- `docker volume ls`
- `docker network ls`
- lecture de `docker-compose.yml`, des Dockerfiles et des fichiers de configuration associes

Aucun `build`, aucun `up`, aucun `down`, aucun `restart`, aucune suppression et aucune modification de conteneur, image, volume ou reseau n'ont ete executes.

## 2. Services Compose detectes

| Service | Image / build | Etat observe | Port hote observe |
| --- | --- | --- | --- |
| `db` | `postgis/postgis:17-3.5` | `healthy` | `127.0.0.1:5436->5432/tcp` |
| `backend` | `app_hassan_addakhil-backend` | `healthy` | `127.0.0.1:5007->5000/tcp` |
| `frontend` | `app_hassan_addakhil-frontend` | `healthy` | `127.0.0.1:8090->80/tcp` |

## 3. Images observees

| Image | Identifiant observe | Taille observee | Remarque |
| --- | --- | --- | --- |
| `app_hassan_addakhil-backend:latest` | `be6c846ede27` | `74.9 MB` | image locale issue du build Compose |
| `app_hassan_addakhil-frontend:latest` | `de609b07b2f4` | `201 MB` | image locale issue du build Compose |
| `postgis/postgis:17-3.5` | `71f7e60358fb` | `218 MB` | image officielle base de donnees |

Des images historiques supplementaires liees a des travaux anterieurs existent localement, mais elles ne font pas partie de la stack active documentee ici.

## 4. Volumes et reseaux observes

| Type | Nom observe | Usage probable |
| --- | --- | --- |
| volume | `app_hassan_addakhil_hydro_hd_pgdata_ilh0107` | persistance PostgreSQL |
| reseau | `app_hassan_addakhil_default` | communication inter-services Compose |

## 5. Donnees source associees

| Element | Emplacement | Etat | Remarque |
| --- | --- | --- | --- |
| dump principal | `D:\3- Projets\App_Hassan_Addakhil\hydro_hd.sql` | present | taille observee `533241663` octets |
| script d'init DB | `D:\3- Projets\App_Hassan_Addakhil\docker\db\init\10-restore-dump.sh` | present | utilise `pg_restore` sur `/backup/hydro_hd.dump` |

Observation :

- le dump est reference sous le nom `hydro_hd.sql`, mais il est monte dans le conteneur sous `/backup/hydro_hd.dump` ;
- la restauration automatique ne concerne que l'initialisation d'une base vide.

## 6. Ecarts documentaires utiles pour la suite

- Les ports reels observes (`5436`, `5007`, `8090`) ne correspondent pas aux valeurs par defaut de `.env.example` (`5435`, `5006`, `8089`).
- Le service `frontend` integre Nginx ; aucun conteneur Nginx distinct n'a ete detecte.
- Le service `backend` est declare avec une cible base de donnees par defaut `host.docker.internal`, ce qui devra etre requalifie pour une livraison serveur autonome.
- Aucun fichier `.dockerignore` n'a ete detecte sur les contextes de build principaux.

## 7. Conclusion

Etat Docker capture avant toute correction de livraison.

Constat global :

- stack Compose active composee de `db`, `backend`, `frontend` ;
- conteneurs actifs observes en bon etat ;
- dump de base important deja present ;
- ecarts de portabilite et de durcissement encore a traiter lors d'une etape ulterieure.

Aucune correction n'a ete appliquee dans cette mission.
