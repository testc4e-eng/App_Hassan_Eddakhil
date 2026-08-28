# RAPPORT APPLICATION LOT C3 - DOCKERFILES

## Etat avant

### Dockerfile backend

- fichier present et deja en multi-stage ;
- image de base : `node:20-alpine` ;
- installation dependances : `npm ci` puis `npm ci --omit=dev` ;
- build TypeScript : `npm run build` ;
- independant de `node_modules` local et de `dist` local par ses `COPY` explicites ;
- aucune `.dockerignore` backend presente avant C3.

### Dockerfile frontend

- fichier present en mode `Node build -> Nginx runtime` ;
- images de base : `node:20-alpine` puis `nginx:1.27-alpine` ;
- installation dependances : `npm ci` ;
- build frontend : `npm run build` ;
- dependait d'un `COPY . .`, donc du contexte complet sans filtre ;
- aucune `.dockerignore` frontend presente avant C3.

### Lockfiles et methode npm

- backend : `package-lock.json` present et exploite par `npm ci` ;
- frontend : `package-lock.json` present et exploite par `npm ci` ;
- `bun.lockb` present dans le frontend mais aucun Dockerfile, script npm principal ou configuration Compose n'utilise Bun ;
- le build Docker actuel repose donc sur npm et `package-lock.json`.

### Etat des conteneurs avant C3

`docker compose ps` avant build :

| Service | Container | Image | Etat | Cree |
| --- | --- | --- | --- | --- |
| `backend` | `hydro-hassan-ilh0107-backend` | `app_hassan_addakhil-backend` | `Up 5 hours (healthy)` | `5 hours ago` |
| `db` | `hydro-hassan-ilh0107-db` | `postgis/postgis:17-3.5` | `Up 5 hours (healthy)` | `29 hours ago` |
| `frontend` | `hydro-hassan-ilh0107-frontend` | `app_hassan_addakhil-frontend` | `Up 5 hours (healthy)` | `29 hours ago` |

`docker ps` avant build a confirme les IDs :

- backend : `db56353b99da`
- frontend : `3434b071d1d1`
- db : `1deca1cd7fbc`

Des conteneurs d'autres projets etaient egalement actifs, sans lien avec ce lot.

## Modifications

### `hydro_Hassan dakhil/backend/Dockerfile`

Avant :

- image runtime basee sur `node:20-alpine` ;
- `npm ci --omit=dev` dans le stage runtime ;
- aucun nettoyage de cache npm final.

Apres :

- le stage runtime conserve `node:20-alpine` ;
- `npm ci --omit=dev && npm cache clean --force` reduit l'empreinte cache de l'image finale ;
- aucun changement de logique applicative ni du port interne `5000`.

Justification :

- amelioration legere et sure de l'image finale ;
- conservation du comportement valide deja observe ;
- aucune dependance au `dist` local ou au `node_modules` local.

### `hydro_Hassan dakhil/frontend/Dockerfile`

Avant :

- `COPY . .` dans le stage build ;
- absence de filtrage du contexte ;
- risque d'envoyer inutilement `node_modules`, `dist`, lockfiles inutiles et fichiers `.env` si non filtres.

Apres :

- copie explicite des seuls fichiers utiles au build : `index.html`, `nginx.conf`, `vite.config.ts`, `postcss.config.js`, `tailwind.config.ts`, `tsconfig*.json`, `scripts/check-utf8.mjs`, `public/`, `src/` ;
- conservation du runtime final `nginx:1.27-alpine` ;
- compatibilite maintenue avec `nginx.conf` et le proxy `/api -> http://backend:5000/api/`.

Justification :

- build plus reproductible ;
- contexte plus strict et lisible ;
- securisation complementaire meme en plus du `.dockerignore`.

### Incident et correction C3

Premier build frontend C3 :

- echec sur `ENOENT: no such file or directory, open '/app/nginx.conf'` ;
- cause exacte : le script `scripts/check-utf8.mjs` lance par `npm run build` lit `index.html` et `nginx.conf` ;
- correction appliquee : ajout de `nginx.conf` dans les fichiers copies au stage build ;
- relance ciblee : succes.

## `.dockerignore`

### Backend

Fichier cree :

- `hydro_Hassan dakhil/backend/.dockerignore`

Exclusions principales :

- `node_modules`, `dist`, `coverage` : inutiles au build image ;
- `.env`, `.env.*` : secrets et configurations locales a ne jamais envoyer ;
- `*.log`, `npm-debug.log*` : journaux locaux ;
- `*.tsbuildinfo` : artefacts TypeScript locaux ;
- `tests` : non necessaires au build Docker backend ;
- `sql` : scripts d'import/maintenance non requis au runtime principal ;
- `scripts/*` puis `!scripts/check-utf8.mjs` : conservation du seul script requis par `npm run build`.

### Frontend

Fichier cree :

- `hydro_Hassan dakhil/frontend/.dockerignore`

Exclusions principales :

- `node_modules`, `dist`, `coverage` : inutiles au build image ;
- `.env`, `.env.*` : secrets et configurations locales a ne jamais envoyer ;
- `*.log`, `npm-debug.log*`, `*.tsbuildinfo` : artefacts locaux ;
- `tests` : non necessaires au build frontend ;
- `README.md`, `setup.bat` : documentation et script Windows non utiles au build ;
- `.eslintrc.js`, `eslint.config.js` : non necessaires a `npm run build` ;
- `bun.lockb` : lockfile present mais non utilise par Docker, le build officiel repose sur npm.

## Build backend

- commande : `docker compose build --progress plain backend`
- resultat : succes
- duree approximative : ~26 s d'apres les etapes BuildKit
- warnings :
  - `npm` a signale une nouvelle version majeure disponible ;
  - `npm ci --omit=dev` a remonte `7 vulnerabilities (3 moderate, 4 high)` dans les dependances runtime
- image produite : `app_hassan_addakhil-backend:latest`
- image ID finale : `21b8bf58af12`
- taille : `267MB`

Constats techniques :

- base `node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293`
- contexte envoye observe : `94.46kB`
- build multi-stage fonctionnel avec `npm ci` puis `npm ci --omit=dev`

## Build frontend

- commande : `docker compose --progress plain build frontend`
- resultat final : succes
- duree approximative : ~63 s sur le build reussi, d'apres les etapes BuildKit
- warnings :
  - `Browserslist` signale des donnees `caniuse-lite` anciennes de 8 mois ;
  - Vite signale des chunks > `500 kB` apres minification ;
  - `npm` a signale une nouvelle version majeure disponible
- image produite : `app_hassan_addakhil-frontend:latest`
- image ID finale : `3ec5c871dac9`
- taille : `446MB`

Constats techniques :

- base build `node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293`
- base runtime `nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10`
- premier build C3 : contexte observe `191.52MB`, echec sur `nginx.conf` absent dans le stage build
- build relance apres correction : succes

## Contextes Docker

Avant C3 :

- backend : absence de `.dockerignore`, contexte theorique proche de la taille du dossier backend complet, soit environ `115.76MB`
- frontend : absence de `.dockerignore`, contexte theorique proche de la taille du dossier frontend complet, soit environ `587.64MB`

Apres C3 :

- backend : contexte BuildKit observe `94.46kB`
- frontend : contexte BuildKit observe `191.52MB` sur le premier build C3 complet

Gain approximatif :

- backend : reduction d'environ `115.67MB`, soit ~`99.92%`
- frontend : reduction d'environ `396.12MB`, soit ~`67.41%`

Interpretation :

- le backend n'envoie plus `node_modules`, `dist`, `tests`, `sql` ni les fichiers `.env` ;
- le frontend garde un contexte significatif car `public/` est requis et pese environ `180.86MB` ;
- ce poids frontend restant est majoritairement justifie par les donnees metier a conserver.

## Securite

- le vrai `.env` n'a pas ete modifie ;
- les fichiers `.env` et `.env.*` sont exclus des deux contextes Docker ;
- `node_modules` et `dist` locaux sont exclus des deux contextes Docker ;
- `bun.lockb` frontend n'est pas envoye au build Docker ;
- aucun secret n'a ete copie dans les rapports C3.

## Containers

### Etat apres C3

`docker compose ps` apres build :

| Service | Container | Image affichee | Etat | Cree |
| --- | --- | --- | --- | --- |
| `backend` | `hydro-hassan-ilh0107-backend` | `sha256:be6c846ede27...` | `Up 5 hours (healthy)` | `5 hours ago` |
| `db` | `hydro-hassan-ilh0107-db` | `postgis/postgis:17-3.5` | `Up 5 hours (healthy)` | `29 hours ago` |
| `frontend` | `hydro-hassan-ilh0107-frontend` | `sha256:de609b07b2f4...` | `Up 5 hours (healthy)` | `29 hours ago` |

`docker ps` apres build :

- backend : `db56353b99da`
- frontend : `3434b071d1d1`
- db : `1deca1cd7fbc`

Conclusion :

- aucun container n'a ete recree ;
- aucun ID container n'a change ;
- aucun container n'a ete remplace ;
- aucun restart de la base n'a ete provoque ;
- les conteneurs en cours utilisent toujours leurs images precedentes (`be6c846ede27` pour backend, `de609b07b2f4` pour frontend), tandis que les nouvelles images construites sont `21b8bf58af12` et `3ec5c871dac9`.

## Rollback

Rollback documentaire exact :

1. recopier `LIVRAISON_ZIZ/01_AUDIT/backups_corrections/C3/backend.Dockerfile.before_C3` vers `hydro_Hassan dakhil/backend/Dockerfile`
2. recopier `LIVRAISON_ZIZ/01_AUDIT/backups_corrections/C3/frontend.Dockerfile.before_C3` vers `hydro_Hassan dakhil/frontend/Dockerfile`
3. supprimer si souhaite :
   - `hydro_Hassan dakhil/backend/.dockerignore`
   - `hydro_Hassan dakhil/frontend/.dockerignore`
4. reconstruire manuellement les images plus tard uniquement si un retour arriere doit etre teste

Ce rollback n'a pas ete execute.

## Limitations

- lot C4 : dump `hydro_hd` et restauration PostgreSQL non traites ;
- lot C5 : SWAT / PowerShell / MDB non traites ;
- lot C6 : healthchecks avances et restart policies non traites ;
- les warnings de taille des chunks frontend restent a optimiser ulterieurement sans bloquer C3 ;
- les vulnerabilites npm signalees pendant le build backend meritent une revue dediee, sans correction precipitee dans ce lot.

## Validation C1 / C2 apres C3

Controles maintenus :

- C1 conserve `backend -> db:5432`
- C1 conserve frontend publie, backend non expose, PostgreSQL limite au host
- C2 conserve la separation local / Docker / Ziz
- C2 conserve `CORS_ORIGIN` sans fallback localhost en production
- C2 conserve l'obligation d'un `JWT_SECRET` explicite en production
- `docker compose config -q` : succes

## Conclusion

Le lot C3 a professionnalise les contextes Docker et valide les builds backend/frontend sans recreer les conteneurs actifs. Le runtime Docker principal reste compatible avec les contraintes de livraison Ziz et n'embarque plus les `node_modules`, `dist` et fichiers `.env` locaux dans ses contextes de build.
