# AUDIT STRUCTURE PROJET - LIVRAISON ZIZ

Date de l'audit : 2026-08-27

Mode d'execution : lecture seule

Projet source audite : `D:\3- Projets\App_Hassan_Addakhil`

## Racine du projet

La racine actuelle contient les elements suivants :

- `.git/` : depot Git du projet.
- `archive/` : archives et sauvegardes historiques.
- `docker/` : scripts Docker auxiliaires, notamment initialisation base de donnees.
- `hydro_Hassan dakhil/` : application principale.
- `LIVRAISON_ZIZ/` : espace de preparation de livraison cree separement du projet source.
- `scripts/` : scripts racine d'analyse, qualite et import SWAT.
- `Support_Doc_HD/` : documentation de travail, audits et rapports existants.
- `.env` : configuration racine sensible, non affichee.
- `.env.example` : exemple de configuration racine.
- `docker-compose.yml` : orchestration Docker racine.
- `hydro_hd.sql` : fichier volumineux de base/dump PostgreSQL.

## Structure generale

### Application principale

- Frontend : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend`
- Backend : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend`
- Documentation applicative : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\docs`
- Assets projet : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\assets`
- Scripts projet : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\scripts`
- Documentation de structure : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\README_PROJECT_STRUCTURE.md`

### Frontend detecte

Emplacement : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend`

Elements principaux identifies :

- `src/` : code source React/Vite.
- `public/` : assets publics et donnees embarquees.
- `tests/` : tests frontend.
- `scripts/` : scripts utilitaires frontend.
- `dist/` : build genere existant.
- `node_modules/` : dependances installees localement.
- `package.json` et `package-lock.json` : manifeste et verrouillage npm.
- `bun.lockb` : verrouillage Bun en plus de npm.
- `Dockerfile` : construction image frontend.
- `nginx.conf` : configuration Nginx de runtime.

### Backend detecte

Emplacement : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend`

Elements principaux identifies :

- `src/` : code source API Node.js / Express / TypeScript.
- `sql/` : SQL applicatif et scripts de schema/verification.
- `scripts/` : scripts backend d'import, seed, diagnostic et maintenance.
- `tests/` : tests backend.
- `dist/` : build backend genere.
- `node_modules/` : dependances installees localement.
- `.env` et `.env.example` : configuration backend, non affichee pour le fichier sensible.
- `package.json` et `package-lock.json` : manifeste et verrouillage npm.
- `Dockerfile` : construction image backend.

## Emplacement Docker

- Compose actif : `D:\3- Projets\App_Hassan_Addakhil\docker-compose.yml`
- Dossier Docker auxiliaire : `D:\3- Projets\App_Hassan_Addakhil\docker`
- Script d'init DB : `D:\3- Projets\App_Hassan_Addakhil\docker\db\init\10-restore-dump.sh`
- Dockerfile backend : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\Dockerfile`
- Dockerfile frontend : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\Dockerfile`

Services declares dans `docker-compose.yml` :

- `db`
- `backend`
- `frontend`

## Emplacement configuration

- Configuration racine : `D:\3- Projets\App_Hassan_Addakhil\.env`
- Exemple racine : `D:\3- Projets\App_Hassan_Addakhil\.env.example`
- Configuration backend : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\.env`
- Exemple backend : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\.env.example`
- Configuration Nginx : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\nginx.conf`

Remarque :

- Aucun secret n'a ete recopie depuis les fichiers `.env`.

## Emplacement scripts

- Scripts racine qualite : `D:\3- Projets\App_Hassan_Addakhil\scripts\quality`
- Scripts racine SWAT : `D:\3- Projets\App_Hassan_Addakhil\scripts\swat-import`
- Scripts backend : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\scripts`
- Scripts projet : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\scripts`
- Script frontend : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\scripts\check-utf8.mjs`

## Emplacement donnees

- Dump/base principal : `D:\3- Projets\App_Hassan_Addakhil\hydro_hd.sql`
- Donnees frontend publiees : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\public\data\hassan`
- Donnees frontend codees : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\src\data`
- Donnees backend codees : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\src\data`
- SQL backend : `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\sql`

Contenu de donnees notable cote frontend :

- fichiers GeoJSON
- images JPG/PNG
- rapports PDF integres
- cartes et vignettes de rapports

## Presence explicite demandee

### `node_modules`

Detectes :

- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\node_modules` - environ 113.79 Mo
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\node_modules` - environ 222.22 Mo

### `dist`

Detectes :

- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\dist` - environ 1.11 Mo
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\dist` - environ 182.62 Mo

### `.git`

Detecte :

- `D:\3- Projets\App_Hassan_Addakhil\.git`

### Backups

Detectes :

- `D:\3- Projets\App_Hassan_Addakhil\archive\stabilization_backups`
- sous-dossiers releves : `20260807_1704` et `20260810_0916`

### Archives

Detectees :

- `D:\3- Projets\App_Hassan_Addakhil\archive`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\docs\archive`

### Fichiers `.sql`

Presence constatee :

- `hydro_hd.sql` a la racine
- SQL applicatifs backend dans `hydro_Hassan dakhil\backend\sql`
- SQL backend additionnel dans `hydro_Hassan dakhil\backend\scripts`
- SQL d'import SWAT dans `scripts\swat-import`
- nombreux SQL historiques dans `archive\scripts\...`

### Fichiers `.dump`

Aucun fichier `*.dump` detecte dans le projet source.

### Fichiers superieurs a 100 Mo

Detecte :

- `D:\3- Projets\App_Hassan_Addakhil\hydro_hd.sql` - environ 508.54 Mo

### Fichiers de logs

Repertoires de logs detectes :

- `D:\3- Projets\App_Hassan_Addakhil\scripts\swat-import\logs`
- `D:\3- Projets\App_Hassan_Addakhil\archive\scripts\swat-import\logs`

Fichiers `.log` source hors dependances :

- aucun fichier `.log` significatif detecte hors dependances installees

### Fichiers temporaires

Detectes :

- `D:\3- Projets\App_Hassan_Addakhil\archive\tmp`
- `D:\3- Projets\App_Hassan_Addakhil\scripts\swat-import\reports\_tmp_probe`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\tsconfig.app.tsbuildinfo`
- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\frontend\tsconfig.node.tsbuildinfo`

## Elements potentiellement necessaires a la livraison

- `docker-compose.yml`
- `docker/`
- Dockerfiles frontend/backend
- `hydro_Hassan dakhil\frontend\src`
- `hydro_Hassan dakhil\frontend\public`
- `hydro_Hassan dakhil\backend\src`
- `hydro_Hassan dakhil\backend\sql`
- `hydro_Hassan dakhil\backend\package.json`
- `hydro_Hassan dakhil\backend\package-lock.json`
- `hydro_Hassan dakhil\frontend\package.json`
- `hydro_Hassan dakhil\frontend\package-lock.json`
- `hydro_Hassan dakhil\frontend\nginx.conf`
- `hydro_hd.sql` ou un export DB valide si la livraison doit inclure les donnees
- une selection ciblee de documentation d'installation/exploitation issue de `Support_Doc_HD`

## Elements probablement inutiles a la livraison

Ces elements ne doivent pas etre supprimes ici. Ils sont seulement candidats a exclusion du futur package final.

- `.git/`
- `archive/`
- `archive\stabilization_backups/`
- `archive\tmp/`
- `hydro_Hassan dakhil\docs\archive/`
- `hydro_Hassan dakhil\backend\node_modules/`
- `hydro_Hassan dakhil\frontend\node_modules/`
- `hydro_Hassan dakhil\backend\tests/`
- `hydro_Hassan dakhil\frontend\tests/`
- `hydro_Hassan dakhil\assets\spatial-proof/`
- `scripts\swat-import\logs/`
- `scripts\swat-import\reports\_tmp_probe/`
- `hydro_Hassan dakhil\frontend\tsconfig.app.tsbuildinfo`
- `hydro_Hassan dakhil\frontend\tsconfig.node.tsbuildinfo`

## Elements qui necessitent encore une analyse

- format reel du fichier `hydro_hd.sql` et strategie de restauration cible
- relation entre le service `db` du compose et la variable effective `DB_HOST` du backend
- role exact de `bun.lockb` cote frontend alors que les Dockerfiles utilisent `npm`
- liste definitive des documents a remettre a Ziz depuis `Support_Doc_HD`
- utilite reelle des scripts `scripts\swat-import` pour une installation serveur Ziz
- decision future sur l'inclusion ou non des `dist/` deja presents
- verification des fichiers `.env.example` avant packaging final

## Anomalies et points d'attention

- `hydro_hd.sql` commence par l'entete binaire `PGDMP`, ce qui indique un dump PostgreSQL au format custom, malgre son extension `.sql`.
- `docker\db\init\10-restore-dump.sh` utilise `pg_restore` sur `/backup/hydro_hd.dump`. Le comportement attendu devra etre confirme avec le fichier `hydro_hd.sql`.
- `docker-compose.yml` declare un service `db`, mais le backend a pour valeur par defaut `DB_HOST=host.docker.internal` au lieu de `db`.
- Le frontend contient a la fois `package-lock.json` et `bun.lockb`, ce qui laisse supposer un double outillage npm/Bun a clarifier.
- `hydro_Hassan dakhil\README_PROJECT_STRUCTURE.md` decrit une structure cible qui ne correspond pas exactement a la structure observee.

## Synthese de l'audit

- Frontend detecte : oui
- Backend detecte : oui
- Dockerfiles applicatifs detectes : 2
- `docker-compose.yml` actif detecte : 1
- Fichier de base/dump detecte : oui
- Fichiers `.dump` detectes : non
- Gros fichiers > 100 Mo detectes : 1
- Repertoires `node_modules` detectes : 2
- Repertoires `dist` detectes : 2

Conclusion :

Le projet contient une application complete frontend/backend, une orchestration Docker active, un dump PostgreSQL volumineux, des scripts d'import/metier, une documentation abondante et plusieurs zones historiques ou generes qui devront etre filtrees plus tard pour constituer un package final propre.
