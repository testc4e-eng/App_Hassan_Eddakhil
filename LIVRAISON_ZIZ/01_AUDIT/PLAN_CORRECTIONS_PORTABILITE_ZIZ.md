# Plan Corrections Portabilite Ziz

Date : 2026-08-27
Mode : conception uniquement
Perimetre : aucune correction appliquee, aucun fichier source modifie

## 1. Situation actuelle

Verdict actuel : `NON PORTABLE ACTUELLEMENT`

Causes principales deja confirmees :

- `docker-compose.yml:31` oriente le backend vers `host.docker.internal` au lieu du service Docker `db`.
- `docker-compose.yml:10`, `51`, `76` publient les services uniquement sur `127.0.0.1`.
- Les imports SWAT MDB reposent sur PowerShell/Windows/ACE OLEDB.
- Aucun `.dockerignore` n'est present sur les contextes `backend` et `frontend`.
- Le dump principal s'appelle `hydro_hd.sql` alors que son format reel est un dump PostgreSQL custom (`PGDMP`).

## 2. Architecture cible retenue

Architecture cible recommandee pour la release Ziz :

```text
Utilisateur / reseau Ziz
          |
          v
   Frontend Nginx
          |
          | /api
          v
       Backend
          |
          v
 PostgreSQL/PostGIS
      hydro_hd
```

Regles de communication cible :

- `frontend` doit joindre `backend` via le reseau Docker interne.
- `backend` doit joindre `db` via le reseau Docker interne.
- aucun service ne doit dependre d'un nom d'hote du poste de developpement.

## 3. Decision structurante

Decision recommandee :

- rendre portable le runtime principal `frontend + backend + db` ;
- isoler SWAT-import comme fonction d'administration distincte ;
- ne pas classer toute la plateforme comme non portable si seul l'import MDB Access reste Windows.

Justification :

- le frontend utilise deja des bases API relatives : `frontend/src/api/http.ts:18-24`, `frontend/src/api/auth.ts:12-18`, `55-69`, `frontend/src/api/spatial.ts:78`, `frontend/nginx.conf:52-53` ;
- les routes SWAT de consultation (`summary`, `availability`, `data`) existent independamment de l'import : `backend/src/routes/swatRoutes.ts:8-11`, `19-23` ;
- la route d'import SWAT est admin et distincte : `backend/src/routes/swatRoutes.ts:7` ;
- l'interface elle-meme documente deja que les modes MDB `preview/import/reload` exigent un backend Windows local et que seul `skipAccess` est supporte en Docker/Linux : `frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx:248-267`.

## 4. Matrice des corrections

| Ordre | ID | Priorite | Correction | Fichier(s) | Risque | Test apres correction |
| ----: | -- | -------- | ---------- | ---------- | ------ | --------------------- |
| 1 | `C1-DBHOST` | `P0 BLOQUANT` | Remplacer la cible Docker de la base par le service Compose `db` pour la release serveur. Valeur actuelle : `DB_HOST=${DB_HOST:-host.docker.internal}`. Valeur cible : `DB_HOST=db` ou equivalent dans un compose serveur dedie. | `docker-compose.yml:31`, `docker-compose.yml:45-46`, `.env.example:12-17`, `backend/src/config/database.config.ts:10-15`, `backend/src/config/loadEnv.ts:34-44` | Risque de casser le mode Docker local actuel si la correction est appliquee en place sans separation dev/serveur. | Démarrer la stack cible, verifier que le backend se connecte a `db:5432`, puis appeler `/api/v1/hydro/health`. |
| 2 | `C1-PORTS` | `P0 BLOQUANT` | Revoir l'exposition reseau : publier seulement le frontend vers le reseau Ziz ; garder backend et PostgreSQL internes par defaut. | `docker-compose.yml:9-10`, `50-51`, `75-76`, `frontend/nginx.conf:52-53` | Risque de perdre un acces d'administration direct si aucune alternative n'est prevue. | Verifier l'acces navigateur au frontend, puis l'acces API via `/api` depuis le frontend sans exposition publique du backend. |
| 3 | `C2-ENV-PROD` | `P1 IMPORTANT` | Introduire une separation nette entre config dev locale et config serveur Ziz : `.env.example` generique, `.env.production.example` ou equivalent pour Ziz, `.env` reel cree a l'installation. | `.env.example:1-33`, `backend/.env.example:1-29` | Risque de confusion si les variables dupliquees ne sont pas clarifiees. | Verifier qu'un `.env` serveur minimal permet un demarrage sans secrets personnels du poste courant. |
| 4 | `C2-ENV-VARS` | `P1 IMPORTANT` | Documenter toutes les variables obligatoires, facultatives et secretes ; ajouter la variable `HASSAN_DATA_ROOT` a la documentation si les routes spatiales avancees doivent etre supportees. | `backend/src/config/hassanDataRoot.ts:4-10`, `backend/src/routes/spatialRoutes.ts:34-46`, `backend/src/controllers/advancedSpatialController.ts:20-57` | Risque de livrer une plateforme partiellement fonctionnelle si ce besoin n'est pas tranche. | Verifier les modules spatiaux utilises sur Ziz avec ou sans `HASSAN_DATA_ROOT`. |
| 5 | `C3-BACKEND-DOCKERIGNORE` | `P1 IMPORTANT` | Creer `hydro_Hassan dakhil/backend/.dockerignore` avec exclusions compatibles avec le Dockerfile actuel. | `backend/Dockerfile:5-10`, futur `backend/.dockerignore` | Risque faible si `scripts/check-utf8.mjs` reste inclus. | Build backend futur : verifier que `npm ci` et `npm run build` fonctionnent toujours. |
| 6 | `C3-FRONTEND-DOCKERIGNORE` | `P1 IMPORTANT` | Creer `hydro_Hassan dakhil/frontend/.dockerignore` sans exclure `public/data/hassan` requis par l'image frontend. | `frontend/Dockerfile:13-18`, `frontend/src/data/reportAssets.ts:19-31`, `frontend/src/features/intervention-program/data/interventionProgram.data.ts:16-24`, `frontend/src/api/spatial.ts:291-296` | Risque de casser les assets metier si `public/data` est exclu par erreur. | Build frontend futur puis verifier les PDF, cartes JPG/PNG et GeoJSON embarques. |
| 7 | `C3-RUNTIME-HARDENING` | `P1 IMPORTANT` | Ajouter un utilisateur non-root aux images runtime backend et frontend si compatible. | `backend/Dockerfile:14-26`, `frontend/Dockerfile:20-25` | Risque moyen si permissions Nginx ou Node ne sont pas preparees. | Démarrer les images durcies, verifier healthchecks et acces lecture aux fichiers statiques. |
| 8 | `C4-DUMP-FINAL` | `P1 IMPORTANT` | Ne pas utiliser `hydro_hd.sql` comme artefact final sans revalidation. Generer plus tard un dump final proprement nomme, par ex. `hydro_hd_v1.0.0.dump`, depuis une base validee. | `hydro_hd.sql`, `docker/db/init/10-restore-dump.sh:4-20`, `docker-compose.yml:14` | Risque de livrer un dump ambigu ou non aligne sur l'etat fonctionnel final. | `pg_restore -l`, puis restauration sur volume vide et tests fonctionnels. |
| 9 | `C4-POSTGIS` | `P1 IMPORTANT` | Conserver une image versionnee `postgis/postgis:17-3.5` et verifier les extensions utiles lors d'une etape controlee ulterieure. | `docker-compose.yml:3`, base validee future | Risque faible si l'image reste identique ; risque moyen si extensions requises ne sont pas verifiees. | Verifier demarrage DB, extension PostGIS disponible et endpoints spatiaux principaux. |
| 10 | `C5-SWAT-SPLIT` | `P1 IMPORTANT` | Sortir SWAT-import du perimetre obligatoire du serveur Linux principal ; le conserver soit comme outil Windows separe, soit comme lot futur de portage. | `backend/src/services/swatIngestion.service.ts:149-157`, `scripts/swat-import/*.ps1`, `frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx:248-267` | Risque de confusion fonctionnelle si cette limitation n'est pas documentee. | Verifier que le runtime Linux fonctionne sans PowerShell et que l'import SWAT est clairement qualifie comme fonction d'administration. |
| 11 | `C6-HEALTH` | `P2 AMELIORATION` | Conserver les healthchecks existants ; eventuellement normaliser le backend vers `/api/v1/hydro/health` plutot que `/api/v1/hydro/test/health` si cela apporte plus de clarte. | `docker-compose.yml:15-21`, `52-61`, `77-82`, `backend/src/routes/hydroRoutes.ts:8`, `64-68` | Risque faible. | Verifier `docker compose ps` et les sondes HTTP/Nginx apres harmonisation. |
| 12 | `C6-ROBUSTESSE` | `P2 AMELIORATION` | Ajouter ensuite des politiques `restart`, une strategie de logs et, si utile, des limites de ressources. | `docker-compose.yml` | Risque faible a moyen selon l'environnement cible. | Verifier reprise apres restart et lisibilite des logs d'exploitation. |
| 13 | `C7-PACKAGE` | `P1 IMPORTANT` | Constituer un package final centre sur l'installation, l'exploitation, le dump valide, les checksums et eventuellement les images exportees. | `LIVRAISON_ZIZ/10_PACKAGE_FINAL` | Risque de livrer des artefacts inutiles ou d'oublier une piece critique. | Verifier le package sur environnement propre avec et sans acces Internet. |

## 5. Lots de correction recommandes

| Lot | Perimetre | Fichiers concernes | Modifications prevues | Risque | Rollback | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| `LOT C1 - Configuration Docker reseau/DB` | portabilite du runtime principal | `docker-compose.yml`, eventuel compose serveur dedie, exemples de config | cibler `db`, supprimer la dependance `host.docker.internal`, publier uniquement le frontend | moyen | revenir au compose local dev de reference | demarrage complet, healthchecks, navigation frontend, appel API via Nginx |
| `LOT C2 - Portabilite environnement` | separation des environnements | `.env.example`, futur `.env.production.example`, documentation | clarifier variables, secrets, valeurs par defaut, profils dev/serveur | faible a moyen | restauration des exemples precedents | test d'installation avec `.env` neuf sur serveur ou VM propre |
| `LOT C3 - Dockerfiles et .dockerignore` | reproductibilite et hygiene de build | `backend/Dockerfile`, `frontend/Dockerfile`, futurs `.dockerignore` | exclure les artefacts inutiles, durcir runtime si possible | moyen | restaurer les Dockerfiles precedents | builds propres, images plus maitrisees, assets presents |
| `LOT C4 - PostgreSQL, dump, restauration` | livraison base et restauration initiale | dump final, `10-restore-dump.sh`, docs d'install | produire un dump final explicite, verifier la restauration sur volume vide | moyen | conserver le dump de reference precedent | `pg_restore -l`, restore sur environnement propre, tests applicatifs |
| `LOT C5 - SWAT et dependances Windows` | administration SWAT | `scripts/swat-import`, doc, eventuelle UI d'info | documenter la limitation ou separer le toolkit Windows | faible a moyen | conserver SWAT hors package principal | verif runtime Linux sans SWAT-import, verif procedure admin separee |
| `LOT C6 - Healthchecks et robustesse` | exploitation | `docker-compose.yml`, eventuelles docs | harmoniser sondes, restart, logs | faible | retour config precedente | `docker compose ps`, tests de restart, lecture des logs |
| `LOT C7 - Preparation release` | package final Ziz | `LIVRAISON_ZIZ/10_PACKAGE_FINAL` | assembler compose, env, docs, dump, checksums, images si offline | faible | reconstruire le package | test d'installation complet sur environnement vierge |

## 6. Verdict vise apres P0/P1

Situation actuelle : `NON PORTABLE ACTUELLEMENT`

Situation attendue apres application des `P0` et `P1` :

`PORTABLE AVEC LIMITATION SWAT`

Justification :

- le runtime principal peut devenir autonome et Linux-compatible ;
- la limitation residuelle porte sur l'import MDB/Access SWAT, qui est un outillage d'administration separe et deja signale comme tel dans l'interface.

## 7. Prochaine etape recommandee

Premiere etape a appliquer ensuite :

`APPLICATION CONTROLEE DU LOT C1`

Contenu prioritaire du lot `C1` :

- fixer la topologie Docker cible ;
- faire disparaitre `host.docker.internal` du mode livraison ;
- exposer seulement le frontend vers le reseau Ziz ;
- maintenir backend et PostgreSQL sur le reseau Docker interne.

Ce document constitue la baseline de planification. Aucune correction n'a ete appliquee.
