# Plan Release Docker Ziz

Date : 2026-08-27
Mode : conception uniquement
Objet : transformer la stack actuelle en release Docker autonome pour serveur Linux

## 1. Architecture Docker cible

Architecture de reference recommandee :

```text
reseau Ziz
   |
   v
frontend (Nginx, port publie)
   |
   v
backend (interne Docker uniquement)
   |
   v
db Postgres/PostGIS (interne Docker uniquement)
```

Decision reseau recommandee :

- `frontend` : seul service publie vers le reseau serveur ;
- `backend` : acces interne Docker uniquement ;
- `db` : acces interne Docker uniquement ;
- exposition d'administration backend ou PostgreSQL : uniquement via variante controlee, jamais en publication publique par defaut.

## 2. Compose cible

### Etat actuel confirme

- `db` : `postgis/postgis:17-3.5` dans `docker-compose.yml:3`
- `backend` : build `hydro_Hassan dakhil/backend` dans `docker-compose.yml:24-26`
- `frontend` : build `hydro_Hassan dakhil/frontend` dans `docker-compose.yml:64-70`
- ordre de demarrage logique deja present : `db healthy -> backend -> frontend` dans `docker-compose.yml:47-49` et `72-74`

### Correction prioritaire

| Point | Configuration actuelle | Configuration cible recommandee | Impact |
| --- | --- | --- | --- |
| Base backend | `DB_HOST=${DB_HOST:-host.docker.internal}` | `DB_HOST=db` dans le mode livraison | rend la stack autonome |
| Hote special Docker Desktop | `extra_hosts host.docker.internal:host-gateway` | suppression en mode serveur | retire une dependance PC Windows |
| Frontend public | `127.0.0.1:${FRONTEND_EXPOSE_PORT:-8089}:80` | publication reseau Ziz, par ex. `${FRONTEND_EXPOSE_PORT:-8090}:80` | rend l'application accessible depuis le reseau |
| Backend public | `127.0.0.1:${BACKEND_EXPOSE_PORT:-5006}:5000` | pas de port publie par defaut | reduit la surface d'exposition |
| PostgreSQL public | `127.0.0.1:${DB_EXPOSE_PORT:-5435}:5432` | pas de port publie par defaut | reduit la surface d'exposition |

### Methode recommandee pour ne pas casser le local

Approche recommandee :

- conserver le compose actuel comme reference locale de developpement ;
- preparer lors du lot `C1` un compose serveur dedie a la livraison Ziz ;
- ne modifier en place `docker-compose.yml` que si l'equipe decide explicitement d'en faire la source commune de tous les environnements.

Si une correction en place est retenue plus tard, les lignes cibles sont deja connues :

- `docker-compose.yml:31`
- `docker-compose.yml:45-46`
- `docker-compose.yml:10`
- `docker-compose.yml:51`
- `docker-compose.yml:76`

## 3. Nginx frontend

Constat :

- `frontend/nginx.conf:52-53` proxy `/api/` vers `http://backend:5000/api/`
- les clients frontend utilisent deja des chemins relatifs : `frontend/src/api/http.ts:18-24`, `frontend/src/api/auth.ts:34-69`, `frontend/src/api/spatial.ts:78`

Conclusion :

- aucun besoin de compiler une URL frontend de type `http://localhost:5007` ou `http://IP_SERVEUR:5007` ;
- la strategie cible la plus propre est de conserver :
  - frontend acces utilisateur ;
  - proxy `/api` dans Nginx ;
  - backend cache derriere le reseau Docker.

Correction recommandees cote Nginx :

- aucune reecriture lourde necessaire ;
- conserver le proxy `backend:5000` ;
- ne corriger Nginx que si le port interne backend change, ce qui n'est pas recommande a ce stade.

## 4. Dockerfiles

### Backend Dockerfile

Evaluation de `backend/Dockerfile:1-26` :

- `multi-stage` : deja correct ;
- `npm ci` : deja correct ;
- `NODE_ENV=production` runtime : deja correct ;
- dependance a `dist` local : non ;
- dependance a `node_modules` local : non ;
- healthcheck : gere par Compose, pas par le Dockerfile ;
- point d'amelioration utile : execution non-root ;
- point d'amelioration optionnel : pinning plus strict de l'image Node a un patch ou un digest au moment du cut release.

Decision recommandee :

- ne pas recrire le Dockerfile backend en profondeur ;
- appliquer seulement les changements a forte valeur :
  - utilisateur non-root ;
  - eventuel pinning de version si l'equipe veut une reproductibilite maximale.

### Frontend Dockerfile

Evaluation de `frontend/Dockerfile:1-25` :

- `multi-stage` : deja correct ;
- `npm ci` : deja correct ;
- variables de build relatives `/api` et `/api/v1` : bonnes pour la portabilite ;
- dependance a `dist` local : non ;
- dependance a `node_modules` local : non ;
- point sensible principal : `COPY . .` sans `.dockerignore` ;
- point d'amelioration utile : execution non-root si compatible avec Nginx.

Decision recommandee :

- conserver le principe actuel ;
- ajouter en priorite un `.dockerignore` ;
- durcir ensuite l'image runtime si les tests de permissions sont bons.

## 5. .dockerignore a creer plus tard

### Backend

Fichier cible :

`hydro_Hassan dakhil/backend/.dockerignore`

Contenu futur recommande :

```text
node_modules
dist
coverage
tests
*.log
*.tsbuildinfo
.env
.env.*
.git
```

Commentaires :

- ne pas exclure `src/`
- ne pas exclure `server.ts`
- ne pas exclure `package.json`
- ne pas exclure `package-lock.json`
- ne pas exclure `tsconfig.json`
- ne pas exclure `scripts/check-utf8.mjs`

### Frontend

Fichier cible :

`hydro_Hassan dakhil/frontend/.dockerignore`

Contenu futur recommande :

```text
node_modules
dist
coverage
tests
*.log
*.tsbuildinfo
.env
.env.*
.git
bun.lockb
setup.bat
```

Commentaires :

- ne pas exclure `public/data/hassan`
- ne pas exclure `public/*.png`, `public/*.ico`, `public/*.svg`
- ne pas exclure `src/`
- ne pas exclure `vite.config.ts`
- `bun.lockb` peut etre exclu car le build Docker actuel repose sur `npm ci`

## 6. PostgreSQL / PostGIS

Etat confirme :

- image cible actuelle : `postgis/postgis:17-3.5`
- port interne : `5432`
- volume declare : `hydro_hd_pgdata_ilh0107`
- healthcheck DB : `docker-compose.yml:15-21`
- dump monte : `docker-compose.yml:14`
- script d'init : `docker/db/init/10-restore-dump.sh:4-20`

Plan retenu :

- conserver l'image `postgis/postgis:17-3.5` pour la release courante ;
- conserver la base logique `hydro_hd` ;
- conserver le volume persistant PostgreSQL ;
- ne pas utiliser `latest` ;
- verifier a l'etape de validation DB la disponibilite effective de PostGIS dans la base restauree.

## 7. Strategie dump et restauration

Recommandation principale :

- ne pas livrer `hydro_hd.sql` comme artefact final sans revalidation ;
- generer plus tard un dump final nomme explicitement, par exemple `hydro_hd_v1.0.0.dump` ;
- produire ce dump depuis la base fonctionnellement validee, pas depuis un etat ambigu.

Verification future du dump :

- controle du format via `PGDMP` ou `pg_restore -l`
- restauration sur volume vide
- verification fonctionnelle post-restauration

Comportement cible a documenter :

- volume vide PostgreSQL : `10-restore-dump.sh` restaure le dump via `/docker-entrypoint-initdb.d`
- volume deja initialise : le script d'init n'est pas rejoue automatiquement
- `docker compose down -v` : suppression du volume et perte des donnees

## 8. Healthchecks et startup order

Constat :

- DB : `pg_isready` deja present
- Backend : healthcheck HTTP Compose deja present sur `/api/v1/hydro/test/health`
- Frontend : healthcheck HTTP Nginx deja present
- route standard backend de health egalement presente : `backend/src/routes/hydroRoutes.ts:8`

Conclusion :

- aucun nouvel endpoint de health n'est obligatoire ;
- le compose actuel exprime deja l'ordre `db healthy -> backend healthy -> frontend` ;
- le vrai probleme est la coherence topologique : tant que `DB_HOST` ne pointe pas vers `db`, la dependance `depends_on` ne garantit pas la vraie cible.

Correction recommandee :

- corriger d'abord `DB_HOST` ;
- conserver les healthchecks existants ;
- harmoniser eventuellement le backend vers `/api/v1/hydro/health` seulement si cela apporte plus de clarte.

## 9. Persistance

Persistance obligatoire :

- volume PostgreSQL

Persistance non prouvee comme necessaire a ce stade :

- uploads applicatifs
- logs applicatifs sur disque
- fichiers de sortie serveur hors base

Constat utile :

- aucune preuve forte d'un repertoire d'upload runtime n'a ete detectee ;
- les exports visibles cote frontend sont majoritairement telecharges cote navigateur ;
- les assets metier sont statiques et doivent etre embarques dans l'image frontend.

## 10. Donnees statiques et documents runtime

Requis au runtime frontend :

- `frontend/public/data/hassan`
- taille observee : `185750634` octets
- contenu observe :
  - `29` fichiers `.jpg`
  - `4` fichiers `.pdf`
  - `3` fichiers `.png`
  - `2` fichiers `.geojson`
  - `1` fichier `.json`

References source :

- `frontend/src/data/reportAssets.ts:19-31`
- `frontend/src/features/intervention-program/data/interventionProgram.data.ts:16-24`
- `frontend/src/api/spatial.ts:291-296`

Elements probablement hors runtime :

- `Support_Doc_HD` : documentation source volumineuse, utile pour preparation/documentation mais pas necessaire dans l'image runtime
- `archive` : historique, a exclure du package final

## 11. Images Docker finales

Strategie de nommage recommandee :

- `hassan-addakhil-backend:1.0.0`
- `hassan-addakhil-frontend:1.0.0`
- `postgis/postgis:17-3.5` ou image exportee equivalente si serveur offline

Scenario serveur avec Internet :

- construire backend et frontend
- tirer `postgis/postgis:17-3.5` depuis le registry officiel

Scenario serveur sans Internet :

- exporter backend en `.tar`
- exporter frontend en `.tar`
- exporter l'image `postgis/postgis:17-3.5` en `.tar`
- fournir les commandes `docker load` et le checksum de chaque archive

## 12. Contenu cible de 10_PACKAGE_FINAL

### Obligatoire

- compose serveur de livraison
- exemple de configuration serveur
- dump final valide
- script(s) d'installation et de restauration
- documentation d'installation
- documentation d'exploitation
- checksums
- images exportees si scenario offline

### Administration

- procedure d'import SWAT separee si elle est retenue
- outils d'administration non indispensables au runtime

### Documentation

- note de version
- matrice services / ports
- guide sauvegarde / restauration

### A exclure

- `node_modules`
- `dist`
- `.git`
- `.env` reels
- `archive`
- brouillons internes et artefacts de travail

## 13. Verdict vise

Situation actuelle : `NON PORTABLE ACTUELLEMENT`

Situation attendue apres application des `P0` et `P1` :

`PORTABLE AVEC LIMITATION SWAT`

## 14. Prochaine etape

Premiere etape a appliquer ensuite :

`APPLICATION CONTROLEE DU LOT C1`

Contenu exact du lot `C1` :

- definir le compose serveur cible ;
- fixer `DB_HOST=db` pour le mode livraison ;
- supprimer la dependance `host.docker.internal` du mode serveur ;
- publier uniquement le frontend vers le reseau Ziz.

Aucune correction n'a ete appliquee dans cette mission.
