# Variables d'environnement Ziz

Ce document distingue trois contextes :

- developpement backend local ;
- Docker Compose de livraison ;
- serveur Ziz.

Le fichier de remise a l'equipe Ziz est `LIVRAISON_ZIZ/04_CONFIGURATION/env/env.ziz.example`.

## Variables a renseigner pour Ziz

| Variable | Role | Obligatoire ? | Valeur attendue | Secret ? | Exemple non sensible | Composant consommateur |
| --- | --- | --- | --- | --- | --- | --- |
| `HDI_DB_NAME` | Nom logique de la base applicative | Oui | identifiant PostgreSQL | Non | `hydro_hd` | `docker-compose.yml`, backend |
| `POSTGRES_USER` | Compte PostgreSQL utilise par l'application | Oui | nom d'utilisateur | Non | `hassan_app` | `docker-compose.yml`, backend |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | Oui | secret fort propre au serveur | Oui | `CHANGE_ME_DB_PASSWORD` | `docker-compose.yml`, backend |
| `FRONTEND_EXPOSE_PORT` | Port HTTP publie pour l'entree utilisateur | Non | entier TCP libre | Non | `8089` | `docker-compose.yml`, frontend Nginx |
| `JWT_SECRET` | Secret de signature des jetons JWT | Oui | secret fort non placeholder, 32 caracteres ou plus recommandes | Oui | `REPLACE_WITH_SECURE_VALUE_MIN_32_CHARS` | backend `src/config/jwt.config.ts` |
| `JWT_EXPIRES_IN` | Duree de validite des JWT | Non | duree comprise par `jsonwebtoken` | Non | `8h` | backend `src/config/jwt.config.ts` |
| `DB_SSL` | Active SSL entre backend et PostgreSQL si necessaire | Non | `true` ou `false` | Non | `false` | backend `src/config/database.config.ts` |
| `CORS_ORIGIN` | Liste CSV des origines externes autorisees | Non | URL(s) absolue(s) | Non | `https://app.ziz.example` | backend `src/app.ts` |
| `DB_EXPOSE_PORT` | Port host reserve a l'administration locale de PostgreSQL | Non | entier TCP libre | Non | `5435` | `docker-compose.yml`, service `db` |
| `BCRYPT_SALT_ROUNDS` | Cout de hachage bcrypt | Non | entier positif | Non | `12` | backend `src/services/auth.service.ts`, scripts de seed |
| `ENABLE_STARTUP_WARMUPS` | Active les warmups de demarrage | Non | `true` ou `false` | Non | `true` | backend |
| `ENABLE_STATION_MAPPING_INIT` | Active l'initialisation des mappings au demarrage | Non | `true` ou `false` | Non | `true` | backend |
| `STARTUP_WARMUP_DELAY_MS` | Delai avant warmup | Non | entier en millisecondes | Non | `250` | backend |
| `STARTUP_WARMUP_TIMEOUT_MS` | Timeout des warmups | Non | entier en millisecondes | Non | `15000` | backend |
| `SLOW_QUERY_LOG_MS` | Seuil des logs de requetes lentes | Non | entier en millisecondes | Non | `1000` | backend `src/services/database.service.ts` |
| `HASSAN_DATA_ROOT` | Emplacement des donnees spatiales avancees externes au bundle | A verifier | chemin absolu serveur ou chemin volume monte | Non | `/srv/hassan-addakhil/data/hassan` | backend `src/config/hassanDataRoot.ts`, `src/services/advancedSpatial.service.ts` |
| `HYDRO_HD_DUMP_PATH` | Chemin du dump PostgreSQL monte dans Compose | Non | chemin relatif ou volume | Non | `./hydro_hd.sql` | `docker-compose.yml`, sujet de validation reporte en lot C4 |
| `SEED_USER_PASSWORD_HASH` | Hash bcrypt pour le seed manuel des comptes | Non | hash bcrypt | Oui | laisser vide | script `seed-users.js` |
| `SEED_ADMIN_EMAIL` | Email du compte seed admin | Non | email | Non | `admin@example.invalid` | script `seed-users.js` |
| `SEED_USER_EMAIL` | Email du compte seed utilisateur | Non | email | Non | `user@example.invalid` | script `seed-users.js` |

## Variables internes deja fixees par Docker Compose

Ces variables font partie du runtime, mais ne doivent pas etre demandees a l'equipe Ziz dans `env.ziz.example`.

| Variable | Role | Gestion actuelle | Composant consommateur |
| --- | --- | --- | --- |
| `NODE_ENV` | Mode d'execution du backend | force a `production` dans `docker-compose.yml` | backend |
| `PORT` | Port interne du backend | force a `5000` dans `docker-compose.yml` | backend |
| `DB_HOST` | Hote PostgreSQL vu par le backend | force a `db` dans `docker-compose.yml` | backend |
| `DB_PORT` | Port PostgreSQL vu par le backend | force a `5432` dans `docker-compose.yml` | backend |
| `VITE_API_BASE` | Base API frontend livree | forcee a `/api/v1` au build Docker | frontend |
| `VITE_API_BASE_URL` | Base API frontend livree | forcee a `/api/v1` au build Docker | frontend |
| `VITE_API_URL` | Base auth/frontend livree | forcee a `/api` au build Docker | frontend |

## Variables de developpement local ou hors perimetre Ziz

Ces variables ont ete identifiees mais ne doivent pas entrer dans le package de configuration serveur Ziz.

| Variable | Statut | Remarque | Composant consommateur |
| --- | --- | --- | --- |
| `POSTGRES_DB` | Compatibilite | Alias conserve dans `.env.example` pour certains scripts, non requis dans `env.ziz.example` | templates et scripts |
| `VITE_BACKEND_PROXY` | Developpement local | Pointe le proxy Vite vers un backend local | `frontend/vite.config.ts` |
| `VITE_HMR_CLIENT_PORT` | Developpement local | Reglage HMR Vite | `frontend/vite.config.ts` |
| `VITE_HMR_HOST` | Developpement local | Reglage HMR Vite | `frontend/vite.config.ts` |
| `VITE_AUTH_API_BASE_URL` | Override optionnel | Le frontend livre retombe deja sur `/api` | `frontend/src/api/auth.ts` |
| `SWAT_MDB_PATH` | Reporte lot C5 | Integration Windows/MDB hors perimetre C2 | backend local et UI SWAT |
| `SWAT_DATA_ROOT` | Reporte lot C5 | Integration Windows/MDB hors perimetre C2 | backend local et UI SWAT |
| `SWAT_IMPORT_SCRIPT_PATH` | Reporte lot C5 | Script PowerShell/MDB hors perimetre C2 | backend local |
| `SEED_USER_PASSWORD` | Utilitaire local | Alternative non recommandee au hash bcrypt | script `seed-users.js` |
| `BATHY_HAD_XLSX` | Outillage local | Script d'import bathymetrie hors runtime principal | `backend/scripts/import_bathy_had.ts` |
| `AUTH_RESET_EMAIL` | Utilitaire local | Script de reset mot de passe, hors livraison | `backend/scripts/reset-user-password.js` |
| `AUTH_RESET_PASSWORD` | Utilitaire local | Script de reset mot de passe, hors livraison | `backend/scripts/reset-user-password.js` |

## Regles d'utilisation

- Ne jamais copier le vrai `.env` du poste dans `LIVRAISON_ZIZ`.
- Ne jamais remettre un secret reel dans `env.ziz.example`.
- Si le frontend et l'API restent servis par la meme origine via Nginx, laisser `CORS_ORIGIN` vide.
- Si les couches spatiales avancees doivent fonctionner depuis des donnees externes, definir explicitement `HASSAN_DATA_ROOT` sur le serveur Ziz.
