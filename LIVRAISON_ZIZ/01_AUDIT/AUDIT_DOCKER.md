# Audit Docker

Date d'audit : 2026-08-27
Mode : lecture seule
Perimetre : aucun build, aucun demarrage, aucun arret, aucune modification du projet source

## 1. Elements inspectes

- `D:\3- Projets\App_Hassan_Addakhil\docker-compose.yml`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\Dockerfile`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\Dockerfile`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\nginx.conf`
- `D:\3- Projets\App_Hassan_Addakhil\.env.example`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\.env.example`
- `D:\3- Projets\App_Hassan_Addakhil\docker\db\init\10-restore-dump.sh`

## 2. Architecture Docker detectee

- Orchestrateur detecte : `docker-compose.yml` a la racine du projet.
- Services declares : `db`, `backend`, `frontend`.
- Reverse proxy : Nginx est integre dans l'image `frontend`, pas dans un service Compose dedie.
- Volume persistant declare : `hydro_hd_pgdata_ilh0107`.
- Reseau observe : `app_hassan_addakhil_default`.
- Dump de base reference : `D:\3- Projets\App_Hassan_Addakhil\hydro_hd.sql` monte en lecture seule vers `/backup/hydro_hd.dump`.

## 3. Etat Docker observe

### Services Compose

| Service | Source image / build | Role probable | Port interne | Port hote observe | Etat |
| --- | --- | --- | --- | --- | --- |
| `db` | `postgis/postgis:17-3.5` | PostgreSQL + PostGIS | `5432` | `127.0.0.1:5436` | `healthy` |
| `backend` | build `hydro_Hassan dakhil/backend/Dockerfile` | API Node.js | `5000` | `127.0.0.1:5007` | `healthy` |
| `frontend` | build `hydro_Hassan dakhil/frontend/Dockerfile` | SPA + Nginx | `80` | `127.0.0.1:8090` | `healthy` |

### Images observees

| Image | Origine | Taille observee |
| --- | --- | --- |
| `postgis/postgis:17-3.5` | registre officiel | `218 MB` |
| `app_hassan_addakhil-backend:latest` | build local Compose | `74.9 MB` |
| `app_hassan_addakhil-frontend:latest` | build local Compose | `201 MB` |

### Donnees et persistance

- Volume moteur observe pour la base : `app_hassan_addakhil_hydro_hd_pgdata_ilh0107`.
- Dump local observe : `hydro_hd.sql`, taille `533241663` octets.
- Script d'initialisation : `docker\db\init\10-restore-dump.sh`.
- Le script de restauration utilise `pg_restore` et ne s'executera que lors d'une initialisation sur volume vide de PostgreSQL.

## 4. Points favorables

- Les Dockerfiles `backend` et `frontend` utilisent des builds multi-stage.
- Le frontend publie des URLs API relatives (`/api` et `/api/v1`) et le Nginx interne reverse-proxy vers `backend:5000`.
- Les trois services disposent d'un healthcheck.
- Le dump de base est monte en lecture seule.

## 5. Anomalies et ecarts

| ID | Niveau | Fichier | Ligne | Configuration actuelle | Probleme | Impact serveur Ziz | Correction recommandee |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `DKR-01` | `BLOQUANT` | `docker-compose.yml` | `31`, `45-46` | `DB_HOST=${DB_HOST:-host.docker.internal}` et `extra_hosts host.docker.internal:host-gateway` | Le backend vise par defaut la machine hote Docker au lieu du service Compose `db`. | Configuration non portable telle quelle sur un serveur Linux si l'objectif est une stack autonome. | Pointer explicitement le backend vers le service `db` pour la livraison serveur, ou documenter une dependance externe volontaire. |
| `DKR-02` | `IMPORTANT` | `docker-compose.yml` | `10`, `51`, `76` | Bindings `127.0.0.1:...` | Les ports ne sont exposes qu'en loopback local. | Acces externe impossible sans reverse proxy ou modification de binding sur le serveur Ziz. | Definir la strategie d'exposition reseau de livraison avant packaging final. |
| `DKR-03` | `IMPORTANT` | racine du projet, `backend`, `frontend` | n/a | Aucun fichier `.dockerignore` detecte | Les contextes de build peuvent embarquer inutilement `node_modules`, `dist`, tests, donnees et fichiers d'environnement. | Builds plus lents, moins reproductibles, et risque de fuite de fichiers non destines a l'image. | Prevoir des `.dockerignore` dedies avant la livraison finale. |
| `DKR-04` | `IMPORTANT` | `hydro_Hassan dakhil\backend\Dockerfile` | `19-20` | `npm ci --omit=dev`, aucun `USER` | L'image runtime backend tourne par defaut en root. | Durcissement securite insuffisant pour une livraison serveur professionnelle. | Ajouter un utilisateur non root dans l'image runtime. |
| `DKR-05` | `IMPORTANT` | `hydro_Hassan dakhil\frontend\Dockerfile` | `20-25` | image `nginx:1.27-alpine`, aucun `USER` | L'image frontend tourne egalement avec l'utilisateur par defaut. | Surface de risque inutile sur le serveur cible. | Durcir l'image runtime frontend ou documenter la contrainte si l'image de base est conservee telle quelle. |
| `DKR-06` | `INFORMATION` | `docker-compose.yml`, `docker\db\init\10-restore-dump.sh` | `14`, `4-20` | dump `hydro_hd.sql` monte sous `/backup/hydro_hd.dump` | L'extension `.sql` ne correspond pas a l'usage `pg_restore`, ce qui peut induire en erreur. | Risque documentaire et operatoire lors de l'installation. | Renommer ou documenter explicitement le format reel du dump avant package final. |
| `DKR-07` | `INFORMATION` | `docker-compose.yml` | global | aucune politique `restart`, aucun quota ressources, aucune configuration de logs | La stack n'est pas encore durcie pour l'exploitation serveur. | Qualite d'exploitation et reprise apres incident a clarifier. | Completer la configuration d'exploitation lors de l'etape de durcissement Docker. |

## 6. Conclusion

Verdict actuel : `NON PORTABLE ACTUELLEMENT`

Justification synthetique :

- la cible base de donnees Docker par defaut n'est pas le service Compose interne ;
- l'exposition reseau est strictement locale ;
- les contextes de build ne sont pas maitrises par `.dockerignore` ;
- le durcissement runtime reste incomplet.

Ce rapport est purement documentaire. Aucune correction n'a ete appliquee dans cette etape.
