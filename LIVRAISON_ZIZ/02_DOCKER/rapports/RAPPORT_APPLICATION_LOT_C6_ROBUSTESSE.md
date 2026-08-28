# Rapport Application Lot C6 - Robustesse Docker

Date : 2026-08-27
Perimetre : robustesse runtime Docker avant construction/export des images
Mode : corrections minimales, sans build, sans migration, sans modification de donnees

## 1. Objet

Le lot C6 vise a fiabiliser le demarrage et l'exploitation Docker de l'application Hassan Addakhil pour une installation ulterieure sur le serveur Ziz.

Les travaux de ce lot se limitent a :

- healthchecks runtime ;
- ordre de demarrage ;
- politiques de redemarrage ;
- rotation de logs ;
- validation statique et validation dynamique isolee.

## 2. Fichiers analyses

- `docker-compose.yml`
- `hydro_Hassan dakhil/backend/Dockerfile`
- `hydro_Hassan dakhil/frontend/Dockerfile`
- `hydro_Hassan dakhil/frontend/nginx.conf`
- `hydro_Hassan dakhil/backend/src/routes/hydroRoutes.ts`
- `hydro_Hassan dakhil/backend/src/controllers/hydroController.ts`
- `hydro_Hassan dakhil/backend/src/services/adaptive.service.ts`

## 3. Corrections appliquees

### Base PostgreSQL

- conservation du service `db` existant ;
- healthcheck `pg_isready` rendu explicite sur `127.0.0.1:5432` ;
- `restart: unless-stopped` ajoute ;
- rotation de logs Docker ajoutee :
  - driver `json-file`
  - `max-size: 10m`
  - `max-file: 3`

### Backend

- conservation du `depends_on` sur `db` avec `condition: service_healthy` ;
- healthcheck modifie pour viser `http://127.0.0.1:5000/api/v1/hydro/health` ;
- verification du payload JSON afin de n'etre `healthy` que si `database == connected` ;
- `restart: unless-stopped` ajoute ;
- rotation de logs Docker ajoutee :
  - driver `json-file`
  - `max-size: 10m`
  - `max-file: 3`

### Frontend

- conservation du `depends_on` sur `backend` avec `condition: service_healthy` ;
- conservation du healthcheck HTTP sur `/` ;
- `restart: unless-stopped` ajoute ;
- rotation de logs Docker ajoutee :
  - driver `json-file`
  - `max-size: 10m`
  - `max-file: 3`

## 4. Elements explicitement non modifies

- aucun Dockerfile ;
- aucun code metier backend ;
- aucun script SWAT ;
- aucun script de restauration de dump ;
- aucun fichier `.env` ;
- aucun dump SQL ;
- aucun volume ou donnee PostgreSQL existante ;
- aucun conteneur du stack principal n'a ete reconstruit.

## 5. Validation statique

- `docker compose config -q` : OK
- `docker compose config --services` : `db`, `backend`, `frontend`
- ordre de demarrage confirme par la configuration :
  - `backend` depend de `db` sain
  - `frontend` depend de `backend` sain
- politiques de redemarrage presentes sur les 3 services
- rotation de logs presente sur les 3 services

## 6. Validation dynamique isolee

Methode employee :

- utilisation d'un reseau Docker temporaire isole ;
- utilisation des images locales deja presentes :
  - `app_hassan_addakhil-backend`
  - `app_hassan_addakhil-frontend`
  - `postgis/postgis:17-3.5`
- aucun build ;
- aucun montage de volume existant ;
- aucun dump monte ;
- aucune suppression de volume.

Resultats observes :

| Controle | Resultat |
| --- | --- |
| Sante initiale `db` | `healthy` |
| Sante initiale `backend` | `healthy` |
| Verification manuelle health backend (DB disponible) | code retour `0` |
| Sante initiale `frontend` | `healthy` |
| Verification proxy frontend -> backend -> DB | code retour `0` |
| Verification politique restart `db` | `unless-stopped` |
| Verification politique restart `backend` | `unless-stopped` |
| Verification politique restart `frontend` | `unless-stopped` |
| Verification logs `db` | `json-file`, `max-size=10m`, `max-file=3` |
| Verification logs `backend` | `json-file`, `max-size=10m`, `max-file=3` |
| Verification logs `frontend` | `json-file`, `max-size=10m`, `max-file=3` |
| Backend lorsque la DB temporaire est arretee | code retour `1` |
| Proxy frontend lorsque la DB temporaire est arretee | code retour `1` |
| DB apres redemarrage | `healthy` |
| Backend apres retour DB | code retour `0` |
| Proxy frontend apres retour DB | code retour `0` |
| Backend apres restart | `healthy` |
| Frontend apres restart | `healthy` |

## 7. Points d'attention

- le stack principal actuellement en service n'a pas ete redeploye ; les nouvelles directives `restart` et `logging` seront prises en compte au prochain redeploiement controle ;
- les `container_name` fixes dans `docker-compose.yml` limitent le lancement simultane de plusieurs stacks Compose issus du meme fichier ;
- l'endpoint backend `/api/v1/hydro/health` retourne un JSON exploitable pour la sante DB, mais ne change pas nativement le code HTTP en `503` lorsque la base est indisponible ; le healthcheck Docker compense cela en analysant le payload.

## 8. Verdict

Le lot C6 est considere conforme pour la robustesse runtime Docker ciblee.

La pile est maintenant preparee avec :

- healthchecks coherents ;
- ordre de demarrage explicite ;
- policies de restart adaptees au serveur ;
- rotation de logs bornee.
