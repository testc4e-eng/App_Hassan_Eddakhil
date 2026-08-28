# RAPPORT APPLICATION LOT C2 - PORTABILITE ENVIRONNEMENT

## 1. Objectif

Rendre la configuration applicative independante du poste Windows de developpement et preparer un modele d'environnement propre, documente et securise pour le futur serveur Ziz, sans toucher aux lots C3, C4, C5 et C6.

## 2. Fichiers analyses

- `.env.example`
- vrai `.env`, lu uniquement pour les noms de variables, les categories et les references locales
- `docker-compose.yml`
- `hydro_Hassan dakhil/backend/.env.example`
- `hydro_Hassan dakhil/backend/src/config/env.ts`
- `hydro_Hassan dakhil/backend/src/config/loadEnv.ts`
- `hydro_Hassan dakhil/backend/src/config/database.config.ts`
- `hydro_Hassan dakhil/backend/src/config/jwt.config.ts`
- `hydro_Hassan dakhil/backend/src/config/hassanDataRoot.ts`
- `hydro_Hassan dakhil/backend/scripts/load-env.js`
- `hydro_Hassan dakhil/backend/server.ts`
- `hydro_Hassan dakhil/backend/src/app.ts`
- `hydro_Hassan dakhil/frontend/vite.config.ts`
- `hydro_Hassan dakhil/frontend/nginx.conf`
- `hydro_Hassan dakhil/frontend/src/api/http.ts`
- `hydro_Hassan dakhil/frontend/src/api/auth.ts`
- `hydro_Hassan dakhil/frontend/src/api/spatial.ts`
- `hydro_Hassan dakhil/backend/src/services/advancedSpatial.service.ts`
- `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx`

## 3. Fichiers modifies

| Fichier | Raison C2 |
| --- | --- |
| `.env.example` | transformation en template principal Docker/livraison avec placeholders neutres et commentaires de contexte |
| `docker-compose.yml` | injection explicite des variables runtime utiles et suppression du fallback CORS localhost dans le runtime Docker |
| `hydro_Hassan dakhil/backend/.env.example` | separation claire du mode backend local hors Docker |
| `hydro_Hassan dakhil/backend/src/app.ts` | activation des origines localhost uniquement hors `production` |
| `hydro_Hassan dakhil/backend/src/config/hassanDataRoot.ts` | desactivation du fallback de donnees projet-locales en `production` |
| `hydro_Hassan dakhil/backend/src/config/jwt.config.ts` | refus explicite d'un `JWT_SECRET` placeholder en `production` |

## 4. Sauvegardes

- `LIVRAISON_ZIZ/01_AUDIT/backups_corrections/C2/.env.example.before_C2`
- `LIVRAISON_ZIZ/01_AUDIT/backups_corrections/C2/docker-compose.yml.before_C2`
- `LIVRAISON_ZIZ/01_AUDIT/backups_corrections/C2/backend.env.example.before_C2`
- `LIVRAISON_ZIZ/01_AUDIT/backups_corrections/C2/backend.src.app.ts.before_C2`
- `LIVRAISON_ZIZ/01_AUDIT/backups_corrections/C2/backend.src.config.hassanDataRoot.ts.before_C2`
- `LIVRAISON_ZIZ/01_AUDIT/backups_corrections/C2/backend.src.config.jwt.config.ts.before_C2`

Le vrai `.env` n'a pas ete copie.

## 5. Dependances locales detectees

| Fichier | Ligne | Reference | Classification | Statut C2 |
| --- | ---: | --- | --- | --- |
| `docker-compose.yml` | 10 | `127.0.0.1:${DB_EXPOSE_PORT:-5435}:5432` | publication volontaire de PostgreSQL sur localhost host uniquement | conserve, acceptable |
| `docker-compose.yml` | 17, 58, 80 | `127.0.0.1` | healthchecks internes conteneur | conserve, reporte lot C6 |
| `hydro_Hassan dakhil/backend/.env.example` | 5 | `DB_HOST=localhost` | backend local hors Docker | conserve, acceptable |
| `hydro_Hassan dakhil/backend/src/app.ts` | 41-56 | origines `localhost` et `127.0.0.1` | developpement local uniquement | corrige, desactive en production |
| `hydro_Hassan dakhil/backend/src/app.ts` | 84-90 | detection `localhost` / `127.0.0.1` / `::1` | assouplissement du rate limiting hors production | conserve, acceptable |
| `hydro_Hassan dakhil/backend/src/config/hassanDataRoot.ts` | 6-13 | fallback `../hassan dakhil` | fallback local desormais limite au dev local | corrige, desactive en production |
| `hydro_Hassan dakhil/frontend/vite.config.ts` | 12 | `http://127.0.0.1:5000` | proxy Vite de developpement | conserve, dev uniquement |
| `hydro_Hassan dakhil/backend/server.ts` | 158-162 | `http://localhost:${PORT}` et `http://127.0.0.1:${PORT}` | logs locaux et warmup interne backend | conserve, non bloquant |
| `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts` | 136, 156, 192 | backend Windows local, `powershell.exe`, `SWAT_MDB_PATH` | dependance SWAT/MDB hors Docker Linux | reporte lot C5 |
| `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx` | 265-266 | backend Windows local avec Access ACE/OLEDB | dependance SWAT/MDB hors Docker Linux | reporte lot C5 |
| `hydro_Hassan dakhil/frontend/src/pages/admin/DatabaseConfigPage.tsx` | 99 | `placeholder="localhost"` | simple hint d'interface, non runtime | a surveiller, non bloquant |

Resultats de recherche complementaires :

- `host.docker.internal` : aucune occurrence dans le runtime principal analyse.
- `hydro_hd_1714` : aucune occurrence dans le runtime principal analyse.
- URL frontend livree pointant vers `http://localhost:5007` ou `http://127.0.0.1:5007` : aucune occurrence.

## 6. Corrections appliquees

- le template racine `.env.example` est redevenu un modele Docker/livraison lisible, documente et sans secret reel ;
- `docker-compose.yml` passe maintenant explicitement `DB_SSL`, `CORS_ORIGIN`, les variables de warmup, `SLOW_QUERY_LOG_MS` et `HASSAN_DATA_ROOT` au backend ;
- le runtime Docker n'autorise plus par defaut des origines localhost dans `CORS_ORIGIN` ;
- le backend garde les origines localhost uniquement en developpement, plus en production ;
- le fallback de donnees `../hassan dakhil` ne s'applique plus en `production` ;
- `JWT_SECRET` ne peut plus rester un placeholder faible en `production`.

## 7. Dependances volontairement conservees

- les `127.0.0.1` des healthchecks sont gardes car ils appartiennent au lot C6 et ne concernent pas l'acces externe Ziz ;
- `DB_HOST=localhost` dans `hydro_Hassan dakhil/backend/.env.example` est conserve car ce fichier decrit le contexte backend local hors Docker ;
- `VITE_BACKEND_PROXY` vers `127.0.0.1:5000` est conserve car il ne sert qu'au serveur Vite local ;
- les references SWAT/PowerShell/MDB sont volontairement maintenues et marquees `REPORTE LOT C5`.

## 8. Variables de livraison

Le fichier remis a Ziz est :

- `LIVRAISON_ZIZ/04_CONFIGURATION/env/env.ziz.example`

La documentation complete des variables est :

- `LIVRAISON_ZIZ/04_CONFIGURATION/VARIABLES_ENVIRONNEMENT_ZIZ.md`

Variables obligatoires minimales pour une installation Ziz :

| Variable | Pourquoi |
| --- | --- |
| `HDI_DB_NAME` | nom logique de la base utilisee par le backend et PostgreSQL |
| `POSTGRES_USER` | compte d'acces a la base |
| `POSTGRES_PASSWORD` | secret d'acces a la base |
| `JWT_SECRET` | signature des jetons d'authentification |

Variables d'installation recommandee :

| Variable | Pourquoi |
| --- | --- |
| `FRONTEND_EXPOSE_PORT` | choix du port HTTP frontal |
| `CORS_ORIGIN` | seulement si l'API doit accepter une origine externe differente |
| `DB_SSL` | activer si PostgreSQL l'exige |
| `HASSAN_DATA_ROOT` | requis si les donnees spatiales avancees sont livrees hors bundle |

## 9. Secrets

- aucune valeur sensible du vrai `.env` n'a ete recopiee dans `LIVRAISON_ZIZ` ;
- les templates utilisent uniquement des placeholders comme `CHANGE_ME_*` et `REPLACE_WITH_SECURE_VALUE_*` ;
- `JWT_SECRET` est maintenant valide activement en production contre les placeholders faibles ;
- les variables de seed sensibles sont laissees vides dans les templates ;
- si un vrai secret a deja ete versionne auparavant hors perimetre de ce lot, une rotation reste recommandee.

## 10. CORS

Etat avant C2 :

- le runtime Docker injectait un fallback `CORS_ORIGIN` contenant plusieurs `localhost` ;
- le backend cumulait ces valeurs avec une liste locale codee en dur.

Etat apres C2 :

- `docker-compose.yml` laisse `CORS_ORIGIN` vide par defaut ;
- `hydro_Hassan dakhil/backend/src/app.ts` n'active les origines localhost qu'en dehors de `production` ;
- si frontend et API sont servis par la meme origine via Nginx, aucune configuration CORS externe n'est necessaire ;
- si une origine externe doit etre autorisee, elle doit etre renseignee explicitement via `CORS_ORIGIN`.

## 11. Frontend / API

Preuves collectees :

- `hydro_Hassan dakhil/frontend/nginx.conf` proxifie `/api/` vers `http://backend:5000/api/` ;
- `hydro_Hassan dakhil/frontend/src/api/http.ts` utilise `/api/v1` par defaut ;
- `hydro_Hassan dakhil/frontend/src/api/auth.ts` utilise `/api` par defaut ;
- `hydro_Hassan dakhil/frontend/src/api/spatial.ts` utilise `/api/v1` par defaut ;
- `docker-compose.yml` construit le frontend avec `VITE_API_BASE=/api/v1`, `VITE_API_BASE_URL=/api/v1` et `VITE_API_URL=/api`.

Conclusion :

Le frontend livre ne depend pas d'une URL backend localhost codee en dur. Le mode serveur Ziz reste coherent avec une entree utilisateur unique sur le frontend Nginx.

## 12. Comparaison avant / apres

| Element | Avant C2 | Apres C2 |
| --- | --- | --- |
| Template Docker | `.env.example` melangeait contexte livraison et valeurs locales implicites | `.env.example` structure, documente et neutralise |
| Template Ziz | absent | `LIVRAISON_ZIZ/04_CONFIGURATION/env/env.ziz.example` cree |
| Secrets dans template | placeholders parfois trop proches du local et hash seed present | placeholders explicites, hash seed vide |
| API frontend | deja relative via `/api` et `/api/v1` | conservee, preuve documentee |
| DB Docker | `db:5432` | `db:5432` conserve |
| Config backend local | peu differenciee du mode livraison | fichier backend local clairement isole |
| Chemins locaux runtime principal | fallback `../hassan dakhil` encore actif en production | fallback local limite au dev, plus au runtime production |
| Variables documentees | documentation Ziz absente | inventaire et mode d'emploi crees |

## 13. Validations

Validations reussies :

- `docker compose config --services` : `db`, `backend`, `frontend`
- `docker compose config --images` : `postgis/postgis:17-3.5`, `app_hassan_addakhil-backend`, `app_hassan_addakhil-frontend`
- `docker compose config -q` : syntaxe Compose valide
- `npm run type-check` dans `hydro_Hassan dakhil/backend` : succes
- recherche finale ciblee : aucune occurrence de `host.docker.internal`, `hydro_hd_1714`, ni URL backend localhost codee en dur dans le frontend livre

Validations volontairement reportees :

- tout test dynamique impliquant un redeploiement Docker ;
- toute verification de dump/restauration PostgreSQL ;
- toute correction SWAT/PowerShell/MDB ;
- toute revue healthcheck/restart policy.

## 14. Limitations restantes

- les imports SWAT MDB/Access restent dependants d'un backend Windows local et sont reportes au lot C5 ;
- `HASSAN_DATA_ROOT` doit etre renseigne explicitement sur Ziz si les donnees spatiales avancees doivent etre fournies hors bundle ;
- les healthchecks contenant `127.0.0.1` n'ont pas ete retraites ici car ils relevent du lot C6 ;
- la validation complete de `HYDRO_HD_DUMP_PATH` est reportee au lot C4 ;
- le placeholder `localhost` dans l'interface admin DB n'est pas bloquant mais merite une revue d'UX plus tard.

## 15. Rollback

Pour revenir a l'etat precedent du lot C2, restaurer manuellement les sauvegardes `*.before_C2` depuis :

- `LIVRAISON_ZIZ/01_AUDIT/backups_corrections/C2/`

Aucune operation Git destructive, aucun build Docker, aucun redemarrage de conteneur et aucune modification de base n'ont ete effectues pendant ce lot.
