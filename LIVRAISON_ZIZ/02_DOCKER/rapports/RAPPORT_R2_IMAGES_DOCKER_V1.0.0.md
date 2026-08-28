# Rapport R2 - Images Docker v1.0.0

Date : 2026-08-27
Projet : Hassan Addakhil
Release cible : Ziz v1.0.0
Perimetre : validation Node, audit securite, builds Docker, strategie DB image, compose de release

Statut courant apres R2-FINAL du 2026-08-28 : `R2-FINAL VALIDE`

## 1. Baseline

Baseline Git :

- branche : `ilh_dev_20-07`
- HEAD : `ef62eae98af1c9991ee2287b969cf53f2051db88`

Containers principaux observes avant R2 :

| Service | Container ID | Image | Etat | Age observe |
| --- | --- | --- | --- | --- |
| `backend` | `db56353b99da1204288a20d2db6cf69b66b6a1050249794a5942d8d2c561506a` | `sha256:be6c846ede27a6d4f73877f7433461a6b86e803a001ff49d4cc923a4c90ed000` | `healthy` | `7 hours ago` |
| `db` | `1deca1cd7fbc353099dba03e341b77df9eaff1824696d6928f1502ea9b51f3a4` | `postgis/postgis:17-3.5` | `healthy` | `31 hours ago` |
| `frontend` | `3434b071d1d1d1dbff352737503c1484f990a4e0bdd7f82afac07ee040e2e2eb` | `sha256:de609b07b2f46b72dc0a88649c92aa4bfc593b1dcffe208bc3e903ea8818c6f1` | `healthy` | `31 hours ago` |

## 2. Tests Node

Backend :

- `npm run type-check` : `OK`
- `npm run test:run` : `31/31` tests `OK`
- `npm run build` : `OK`

Frontend :

- `npm run type-check` : `OK`
- `npm run test:run` : `16/16` tests `OK`
- `npm run build` : `OK`

Observations non bloquantes :

- warnings React Router v7 en tests frontend ;
- warning `Browserslist` obsolescent en build frontend ;
- warning `JWT_SECRET appears weak or placeholder-like` en environnement local de test backend.

## 3. SECURITY GATE R2

Verdict initial R2 du 2026-08-27 : `BLOCKED`

### Backend runtime

Vulnerabilites relevees par `npm audit --omit=dev` :

| Package | Severite | Directe | Runtime | Correctif disponible | Analyse |
| --- | --- | --- | --- | --- | --- |
| `express-rate-limit@8.2.1` | `HIGH` | `Oui` | `Oui` | `Oui` | Risque de contournement du rate limiting avec IPv4-mapped IPv6 sur environnement dual-stack. Le projet l'utilise sur `/api` et `/api/auth/login`. |
| `ip-address@10.0.1` | `HIGH` | `Non` | `Oui` via `express-rate-limit` | `Oui` | Transitive du point precedent. |
| `path-to-regexp@0.1.12` | `HIGH` | `Non` | `Oui` via `express` | `Oui` | ReDoS sur parsing de routes Express ; reste dans la surface d'attaque HTTP. |
| `xlsx@0.18.5` | `HIGH` | `Oui` | `Partiellement` | `Non` | Utilise en runtime pour export Excel, mais sur donnees construites par le serveur ; le risque principal n'est pas sur un import utilisateur libre. |
| `express@4.22.1`, `body-parser@1.20.4`, `qs@6.14.1` | `MODERATE` | mixte | `Oui` | `Oui` | Correctifs patch disponibles. |

Simulation de correction non destructive (`npm audit fix --dry-run`) :

- `express-rate-limit` `8.2.1 -> 8.6.2`
- `ip-address` `10.0.1 -> 10.5.0`
- `express` `4.22.1 -> 4.22.2`
- `path-to-regexp` `0.1.12 -> 0.1.13`
- `body-parser` `1.20.4 -> 1.20.6`
- `qs` `6.14.1 -> 6.15.3`

Conclusion backend :

- des correctifs sans saut majeur semblent disponibles ;
- au moins deux vulnerabilites `HIGH` touchent la surface HTTP runtime ;
- R2 ne doit donc pas creer les tags release definitifs sans validation prealable d'une correction securisee.

### Frontend runtime

Vulnerabilites relevees par `npm audit --omit=dev` :

| Package | Severite | Directe | Runtime | Correctif disponible | Analyse |
| --- | --- | --- | --- | --- | --- |
| `react-router-dom@6.30.3` et `react-router` | `MODERATE` | `Oui / Non` | `Oui` dans le bundle | `Oui` | Risques d'open redirect documentes, mais l'application navigue surtout vers des chemins internes fixes ou encodes. |
| `postcss`, `nanoid`, `picomatch` | `HIGH` | mixte | `Non` dans l'image Nginx finale | `Oui` | Chaine de build, pas dependances runtime du conteneur frontend final. |
| `lodash` via `recharts` | `HIGH` | `Non` | `Oui` potentiellement dans le bundle | `Oui` | A surveiller en R3, mais pas d'exposition directe identifiee sur usage applicatif courant. |

Conclusion frontend :

- pas de blocage immediat identifie propre au conteneur Nginx final ;
- risque surtout documentaire ou lie au bundle web, a retester en R3.

## 4. Builds

Compose :

- `docker compose config -q` : `OK`
- `docker compose config --services` : `db`, `backend`, `frontend`
- `docker compose config --images` : `app_hassan_addakhil-backend`, `app_hassan_addakhil-frontend`, `postgis/postgis:17-3.5`

Builds realises :

- `docker compose build backend frontend` : `OK`
- `docker compose --progress plain build --no-cache backend frontend` : `OK`

Preuves de reproductibilite :

- build multi-stage backend `node:20-alpine -> node:20-alpine runtime`
- build multi-stage frontend `node:20-alpine -> nginx:1.27-alpine runtime`
- aucun `docker compose up`
- aucun remplacement des containers de travail

## 5. Dockerfiles utilises

- `hydro_Hassan dakhil/backend/Dockerfile`
- `hydro_Hassan dakhil/frontend/Dockerfile`

Evaluation OCI labels :

- non appliques en R2 ;
- valeur potentielle reelle, mais modification non retenue pour ne pas toucher aux Dockerfiles valides tant que le Security Gate backend reste bloque.

## 6. Contextes

Verification `.dockerignore` :

- backend exclut `node_modules`, `dist`, `coverage`, `.env`, logs, `.git`, `tmp`, `temp`, `tests`, `sql`
- frontend exclut `node_modules`, `dist`, `coverage`, `.env`, logs, `.git`, `tests`, `README.md`, `setup.bat`

Preuve par build :

- contexte backend transfere : `4.88kB`
- contexte frontend transfere : `18.39kB`

Conclusion :

- `node_modules`, `dist` local, `.env` et logs ne sont pas injectes dans les builds Docker R2.

## 7. Images generees

Images Compose produites par le no-cache :

- `app_hassan_addakhil-backend:latest`
- `app_hassan_addakhil-frontend:latest`

## 8. Tags

Tags release demandes :

- `hassan-addakhil-backend:1.0.0`
- `hassan-addakhil-frontend:1.0.0`
- tags immuables proposes :
  - `hassan-addakhil-backend:1.0.0-20260827`
  - `hassan-addakhil-frontend:1.0.0-20260827`

Decision R2 :

- aucun tag release n'a ete cree ;
- arret volontaire avant tagging definitif a cause du `SECURITY GATE R2 = BLOCKED`.

## 9. Tailles

- backend : `61583417` octets (`58.73 MiB`)
- frontend : `201423220` octets (`192.09 MiB`)
- postgis : `218437565` octets (`208.32 MiB`)

## 10. Architecture

- backend : `linux/amd64`
- frontend : `linux/amd64`
- postgis : `linux/amd64`

Prerequis serveur Ziz :

- hote Docker Linux compatible `amd64`

## 11. IDs / Digests

Backend :

- Image ID : `sha256:8d161b715faf4e3436cdce0ac1d51e15badba7cffb3a9b096ffe7da01c71725a`
- RepoDigest local : `app_hassan_addakhil-backend@sha256:8d161b715faf4e3436cdce0ac1d51e15badba7cffb3a9b096ffe7da01c71725a`
- Created : `2026-08-27T17:47:19.2668083Z`

Frontend :

- Image ID : `sha256:168bd6a985693cdda8914b698101e7a7a684b2ab0bfe0a6448e388e4aa76d409`
- RepoDigest local : `app_hassan_addakhil-frontend@sha256:168bd6a985693cdda8914b698101e7a7a684b2ab0bfe0a6448e388e4aa76d409`
- Created : `2026-08-27T17:47:59.852933748Z`

PostgreSQL / PostGIS :

- Image ID : `sha256:71f7e60358fb03d3f157b9ea34516e8152394752ec7a01b3f9eb293d3aead29e`
- RepoDigest : `postgis/postgis@sha256:71f7e60358fb03d3f157b9ea34516e8152394752ec7a01b3f9eb293d3aead29e`
- Created : `2026-06-15T11:21:18.20829135Z`

## 12. PostgreSQL / PostGIS

Image locale inspectee :

- tag : `postgis/postgis:17-3.5`
- PostgreSQL reel expose : `17.5`
- PostGIS reel expose : `3.5.2`
- architecture : `linux/amd64`

Ecart connu avec la base active source :

- source active R1 : PostgreSQL `17.8` / PostGIS `3.5.3`
- image cible locale actuelle : PostgreSQL `17.5` / PostGIS `3.5.2`

## 13. Compose Ziz

Fichier cree :

- `LIVRAISON_ZIZ/02_DOCKER/compose/docker-compose.ziz.yml`

Caracteristiques :

- aucune section `build:`
- frontend image cible : `hassan-addakhil-frontend:1.0.0`
- backend image cible : `hassan-addakhil-backend:1.0.0`
- image DB retenue : `postgis/postgis:17-3.5`
- backend -> `db:5432`
- healthchecks C6 repris
- `depends_on` `service_healthy` repris
- `restart: unless-stopped` repris
- rotation de logs reprise
- aucun secret en dur
- seul le frontend expose un port hote

## 14. Tests minimaux d'image

Backend image :

- demarrage isole sur conteneur temporaire sans DB active : `OK`
- verification interne `GET /api/v1/hydro/test/health` : `OK`

Frontend image :

- test seul : echec attendu car `nginx.conf` reference l'upstream `backend` au demarrage
- test isole avec backend temporaire sur reseau R2 dedie : `OK`
- verification interne `GET /` : `OK`

Ressources temporaires de test :

- `hassan-ziz-r2-backend-test-20260827175314`
- `hassan-ziz-r2-frontend-test-20260827175314`
- `hassan-ziz-r2-net-20260827175314`

Nettoyage :

- conteneurs temporaires supprimes
- reseau temporaire supprime

## 15. Containers avant / apres

Constat attendu :

- memes containers principaux
- memes IDs
- aucune recreation
- aucun arret

Verification finale effectuee apres R2 : a comparer avec la baseline initiale.

## 16. Anomalies

- Security Gate backend bloque par vulnerabilites `HIGH` runtime avec correctifs patch apparemment disponibles
- warning Nginx non bloquant : `duplicate MIME type "text/html"` dans `default.conf`
- chunk frontend principal > `500 kB` apres minification
- image PostGIS locale de test en `17.5 / 3.5.2`, inferieure a la source active `17.8 / 3.5.3`

## 17. Verdict

R2 n'est pas valide en l'etat.

Les builds Docker sont techniquement reussis, reproductibles et documentes, mais les tags release n'ont pas ete crees car :

- le backend embarque encore des vulnerabilites `HIGH` sur la surface HTTP runtime ;
- un chemin de correction sans changement majeur semble disponible et doit etre valide avant tagging definitif.

## 18. Addendum R2-S du 2026-08-28

Correctifs backend appliques :

- `express` : `4.22.1 -> 4.22.2`
- `express-rate-limit` : `8.2.1 -> 8.6.2`
- `ip-address` : `10.0.1 -> 10.5.0`
- `body-parser` : `1.20.4 -> 1.20.6`
- `qs` : `6.14.1 -> 6.15.3`
- `path-to-regexp` : `0.1.12 -> 0.1.13` via override npm cible sur `express`

Validation backend apres correction :

- `npm ci` : `OK`
- `npm run type-check` : `OK`
- `npm run test:run` : `31/31 OK`
- `npm run build` : `OK`
- `npm audit --omit=dev` : plus aucun point `express-rate-limit`, `ip-address`, `path-to-regexp`, `express`, `body-parser`, `qs`

Point restant :

- `xlsx` reste `HIGH` sans fix npm disponible, avec exposition jugee plus limitee dans le code observe

Rebuild Docker cible :

- `docker compose build --no-cache backend` : `OK`
- image backend locale finale : `app_hassan_addakhil-backend@sha256:9ea5c21722387607a9279a68e52274acc863dded44d5136d5acea9cb6f87cbf6`
- taille : `61639227` octets

Smoke test :

- tentative avec `.env` local : echec de demarrage car variables DB absentes pour le conteneur de test
- test final avec placeholders non sensibles et warmups desactives : `GET /api/v1/hydro/test/health = OK`
- cet endpoint valide surtout le demarrage HTTP ; il ne constitue pas une preuve d'integration DB complete

Integrite du stack principal :

- containers `backend`, `db`, `frontend` inchanges
- memes IDs avant et apres
- aucun restart ni remplacement du stack de travail

## 19. Verdict courant

R2 est maintenant exploitable en etat `PASS AVEC RISQUE DOCUMENTE`.

Le blocage initial de securite runtime backend est leve pour la release `v1.0.0`, sous reserve de conserver :

- le risque residuel `xlsx` documente ;
- une passe ulterieure dediee a la filiere Excel et a la securite frontend si un gate plus strict doit etre impose.

## 20. Addendum R2-FINAL du 2026-08-28

Security Gate backend :

- `PASS AVEC RISQUE XLSX DOCUMENTE`
- `npm audit --omit=dev` final : `1 HIGH` restant sur `xlsx`, `fixAvailable: false`

Acceptation de risque :

- document cree : `LIVRAISON_ZIZ/08_SECURITE/ACCEPTATION_RISQUE_XLSX_V1.0.0.md`

Security Gate frontend final :

- `PASS AVEC RISQUES DOCUMENTES`
- `npm audit --omit=dev` final : `3 MODERATE`, `4 HIGH`
- qualification retenue :
  - `react-router-dom` / `react-router` / `@remix-run/router` : runtime navigateur, mais usage observe principalement sur chemins internes fixes
  - `postcss`, `nanoid`, `picomatch` : chaine de build
  - `lodash` via `recharts` : present dans le graphe, mais aucune exploitation runtime concretement identifiee dans l'usage releve des composants du projet

Tests finaux :

- backend : `npm ci`, `type-check`, `31/31 tests`, `build` = `OK`
- frontend : `npm ci`, `type-check`, `16/16 tests`, `build` = `OK`
- warnings frontend documentes :
  - `caniuse-lite` ancien
  - chunks > `500 kB`
  - warnings React Router v7 en tests

Builds Docker finaux :

- backend : `app_hassan_addakhil-backend@sha256:57b8003501fe797d3420112206c620fedf31ea7bab85173c8751b2efe87fb63d`
- frontend : `app_hassan_addakhil-frontend@sha256:134dc3d6b72b00d0404f4271fb46d6149d1059063b795a11bed84c398f2df9b1`

Tags crees :

- `hassan-addakhil-backend:1.0.0`
- `hassan-addakhil-backend:1.0.0-20260828`
- `hassan-addakhil-frontend:1.0.0`
- `hassan-addakhil-frontend:1.0.0-20260828`

Compose Ziz :

- `docker-compose.ziz.yml` reference bien :
  - `hassan-addakhil-backend:1.0.0`
  - `hassan-addakhil-frontend:1.0.0`
  - `postgis/postgis:17-3.5`
- aucune section `build:` pour backend/frontend
- validation `config -q` : `OK`

Containers principaux :

- IDs identiques avant et apres builds/tagging
- aucun restart
- aucun redeploiement du stack principal

## 21. Verdict final R2

R2-FINAL est valide.

Les images Docker Ziz `v1.0.0` sont construites, taggees et documentees, avec :

- backend `PASS AVEC RISQUE XLSX DOCUMENTE`
- frontend `PASS AVEC RISQUES DOCUMENTES`
- global `PASS AVEC RISQUES DOCUMENTES`
