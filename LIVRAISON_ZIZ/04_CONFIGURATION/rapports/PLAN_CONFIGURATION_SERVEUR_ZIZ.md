# Plan Configuration Serveur Ziz

Date : 2026-08-27
Mode : conception uniquement
Objet : definir une strategie de configuration professionnelle pour la release Ziz

## 1. Principe general

La release Ziz ne doit pas dependre :

- du `.env` personnel actuel ;
- d'un secret local du poste de developpement ;
- d'une URL ou d'un chemin propre au PC source ;
- d'un melange ambigu entre configuration dev et configuration serveur.

Strategie retenue :

- conserver une configuration dev locale distincte ;
- preparer un exemple de configuration serveur dedie ;
- creer le vrai `.env` uniquement au moment de l'installation chez Ziz ;
- ne jamais livrer de secrets reels dans Git ni dans le package public.

## 2. Separation recommandee des environnements

| Environnement | Fichier / support cible | Objectif | Regle |
| --- | --- | --- | --- |
| Developpement local backend | `hydro_Hassan dakhil/backend/.env` et `backend/.env.example` | usage `ts-node-dev` / backend hors Docker | peut rester oriente `localhost` |
| Docker local actuel | `.env` racine + `docker-compose.yml` actuel | poste de dev / validation locale | ne doit pas imposer le modele serveur Ziz |
| Serveur Ziz | futur `.env.production.example` ou equivalent + `.env` reel cree sur serveur | release Docker autonome | doit viser `db`, publier le frontend, conserver les secrets hors Git |

## 3. Variables a documenter

| Variable | Usage | Obligatoire sur Ziz | Valeur par defaut acceptable | Secret | Observation |
| --- | --- | --- | --- | --- | --- |
| `HDI_DB_NAME` | nom logique de la base | Oui | `hydro_hd` | Non | variable canonique recommandee pour la release |
| `POSTGRES_USER` | utilisateur PostgreSQL | Oui | Non | Non | requis par le service `db` |
| `POSTGRES_PASSWORD` | mot de passe PostgreSQL | Oui | Non | Oui | ne jamais versionner |
| `DB_HOST` | hote vu par le backend | Oui | `db` en mode serveur | Non | correction P0 principale |
| `DB_PORT` | port vu par le backend | Oui | `5432` | Non | port interne Docker |
| `DB_SSL` | SSL backend -> DB | Non | `false` si reseau Docker interne | Non | a revoir seulement si DB externe |
| `JWT_SECRET` | signature des tokens | Oui | Non | Oui | requis par `backend/src/config/jwt.config.ts:5-6` |
| `JWT_EXPIRES_IN` | duree des tokens | Non | `8h` | Non | valeur par defaut deja prevue |
| `CORS_ORIGIN` | origines autorisees | Non | vide si frontend et API sont strictement same-origin | Non | utile seulement pour clients d'une autre origine |
| `FRONTEND_EXPOSE_PORT` | port public frontend | Oui | `8090` ou autre port retenu | Non | depend de l'exploitation Ziz |
| `BACKEND_EXPOSE_PORT` | port hote backend | Non | non publie par defaut | Non | garder interne par defaut |
| `DB_EXPOSE_PORT` | port hote PostgreSQL | Non | non publie par defaut | Non | garder interne par defaut |
| `HYDRO_HD_DUMP_PATH` | dump a restaurer | Oui pour install initiale avec restore | chemin package final | Non | doit pointer vers le dump final valide |
| `ENABLE_STARTUP_WARMUPS` | prechauffage backend | Non | `true` | Non | valeur par defaut acceptable |
| `ENABLE_STATION_MAPPING_INIT` | init metier au demarrage | Non | `true` | Non | valeur par defaut acceptable |
| `STARTUP_WARMUP_DELAY_MS` | delai warmup | Non | `250` | Non | valeur par defaut acceptable |
| `STARTUP_WARMUP_TIMEOUT_MS` | timeout warmup | Non | `15000` | Non | valeur par defaut acceptable |
| `SLOW_QUERY_LOG_MS` | seuil logs requetes lentes | Non | `1000` | Non | valeur par defaut acceptable |
| `SEED_USER_PASSWORD_HASH` | seed utilisateurs | Non | aucune en production par defaut | Oui / sensible | hors runtime normal |
| `SEED_ADMIN_EMAIL` | seed utilisateurs | Non | aucune en production par defaut | Non | hors runtime normal |
| `SEED_USER_EMAIL` | seed utilisateurs | Non | aucune en production par defaut | Non | hors runtime normal |
| `SWAT_MDB_PATH` | chemin MDB SWAT | Non | vide | Non | outil d'administration uniquement |
| `SWAT_DATA_ROOT` | racine SWAT import MDB | Non | vide | Non | outil d'administration uniquement |
| `SWAT_IMPORT_SCRIPT_PATH` | script import SWAT | Non | vide | Non | outil d'administration uniquement |
| `HASSAN_DATA_ROOT` | racine des donnees spatiales avancees | A verifier | vide si feature non retenue | Non | variable absente des exemples actuels mais lue par `backend/src/config/hassanDataRoot.ts:4-10` |

## 4. Variables en doublon a clarifier

Variables actuellement redondantes :

- `HDI_DB_NAME`
- `DB_NAME`
- `POSTGRES_DB`

Constat technique :

- `loadEnv.ts:6-22` maintient des alias de compatibilite ;
- `database.config.ts:12-14` accepte plusieurs noms pour la meme information.

Strategie recommande :

- utiliser `HDI_DB_NAME` comme variable canonique ;
- laisser `DB_NAME` et `POSTGRES_DB` comme alias de compatibilite transitoires ;
- documenter qu'en mode livraison serveur, une seule source canonique doit etre renseignee.

## 5. Strategie recommande pour les fichiers de configuration

Fichiers a viser dans une etape ulterieure :

- conserver `.env.example` comme baseline generique ou dev
- conserver `backend/.env.example` pour le backend hors Docker
- ajouter un exemple serveur dedie, par exemple `.env.production.example`

Contenu minimal attendu du futur exemple serveur :

- nom de base
- utilisateur DB
- mot de passe DB
- secret JWT
- port public frontend
- chemin du dump final
- variables optionnelles documentees mais non imposees

Contenu a ne jamais mettre dans l'exemple :

- mot de passe reel
- secret JWT reel
- token
- credential Git

## 6. Ports et exposition reseau

Decision cible recommandee :

- frontend : accessible depuis le reseau Ziz
- backend : interne Docker uniquement par defaut
- PostgreSQL : interne Docker uniquement par defaut

Justification :

- le frontend reverse-proxy deja `/api` vers `backend:5000` dans `frontend/nginx.conf:52-53`
- le frontend consomme deja des URLs relatives dans `frontend/src/api/http.ts:18-24` et `frontend/src/api/auth.ts:34-69`

Options d'exploitation :

- mode autonome simple : `FRONTEND_EXPOSE_PORT:80`
- mode serveur avec proxy externe : `FRONTEND_EXPOSE_PORT:8090` puis proxy/HTTPS en amont
- mode administration DB optionnel : override specifique et restreint a `127.0.0.1`

## 7. SWAT et limites de configuration

Conclusion sur SWAT :

- le runtime principal n'a pas besoin de PowerShell pour servir l'application ;
- l'import SWAT MDB est une fonction d'administration distincte ;
- la route d'import est admin : `backend/src/routes/swatRoutes.ts:7`
- l'UI indique deja que Docker/Linux supporte `skipAccess` uniquement : `frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx:248-267`

Strategie retenue :

- ne pas rendre `SWAT_MDB_PATH`, `SWAT_DATA_ROOT` ni `SWAT_IMPORT_SCRIPT_PATH` obligatoires pour Ziz ;
- documenter SWAT-import comme outillage separe, possiblement Windows ;
- ne rendre `HASSAN_DATA_ROOT` obligatoire que si les routes `/api/v1/spatial/advanced/*` doivent faire partie du scope serveur.

## 8. Donnees statiques et donnees serveur

Donnees a considerer comme requises au runtime :

- `frontend/public/data/hassan`
- images publiques du frontend
- PDFs et GeoJSON references par le frontend

Donnees a verifier fonctionnellement mais non a forcer par defaut :

- `HASSAN_DATA_ROOT` pour spatial avance

Donnees a exclure du package public par defaut :

- `.env` reels
- outillage local de developpement
- `archive`
- `node_modules`
- `dist`

## 9. Procedure d'installation cible

Procedure serveur cible a documenter plus tard :

1. copier le futur exemple serveur vers un `.env` reel
2. renseigner `POSTGRES_PASSWORD` et `JWT_SECRET`
3. choisir le port public frontend
4. placer le dump final valide dans l'emplacement prevu
5. charger les images Docker si le serveur est offline
6. lancer la stack cible
7. verifier frontend, API, base et restauration initiale

## 10. Risques a couvrir dans la documentation finale

- ne jamais confondre le `.env` personnel du poste source et le `.env` de Ziz
- ne jamais commiter le `.env` reel
- ne jamais publier `POSTGRES_PASSWORD` ou `JWT_SECRET`
- avertir explicitement que `docker compose down -v` supprime le volume PostgreSQL
- documenter clairement la limitation SWAT si l'import MDB n'est pas porte sous Linux

## 11. Verdict vise

Situation actuelle : `NON PORTABLE ACTUELLEMENT`

Situation attendue apres application des `P0` et `P1` :

`PORTABLE AVEC LIMITATION SWAT`

## 12. Prochaine etape

Premiere etape a appliquer ensuite :

`APPLICATION CONTROLEE DU LOT C1`

Objectif config du lot `C1` :

- separer la topologie serveur de la topologie locale ;
- poser `DB_HOST=db` pour la release ;
- publier seulement le frontend vers le reseau Ziz.

Aucune correction n'a ete appliquee dans cette mission.
