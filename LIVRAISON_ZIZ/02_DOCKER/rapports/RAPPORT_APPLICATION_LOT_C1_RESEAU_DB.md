# Rapport Application Lot C1 Reseau DB

Date : 2026-08-27
Lot : `C1 - Configuration Docker reseau / database`
Mode : correction controlee avec validation statique

## 1. Objectif

Rendre portable le runtime Docker principal :

- `frontend`
- `backend`
- `db`

afin de preparer une execution ulterieure sur serveur Linux Ziz sans dependance au poste Windows local pour la connexion PostgreSQL.

Perimetre traite dans ce lot :

- connexion `backend -> db`
- suppression de la dependance `host.docker.internal` en mode Docker de livraison
- communication interne via noms de services Docker
- exposition reseau cible des services
- conservation du `frontend` comme point d'entree utilisateur
- validation statique du Compose

## 2. Fichiers modifies

Fichiers reellement modifies par le lot C1 :

- `D:\3- Projets\App_Hassan_Addakhil\docker-compose.yml`
- `D:\3- Projets\App_Hassan_Addakhil\.env.example`

Fichiers explicitement non modifies :

- `D:\3- Projets\App_Hassan_Addakhil\hydro_Hassan dakhil\backend\.env.example`
- Dockerfiles
- `frontend/nginx.conf`
- code backend/frontend
- scripts SWAT
- dump PostgreSQL

## 3. Sauvegardes creees

Dossier cree :

- `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\01_AUDIT\backups_corrections\C1`

Sauvegardes documentaires :

- `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\01_AUDIT\backups_corrections\C1\docker-compose.yml.before_C1`
- `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\01_AUDIT\backups_corrections\C1\.env.example.before_C1`

Le vrai `.env` n'a ni ete copie ni affiche.

## 4. Changements realises

### `docker-compose.yml`

Changements appliques :

- `backend.environment.DB_HOST`
  - avant C1 : `${DB_HOST:-host.docker.internal}`
  - apres C1 : `db`
- `backend.environment.DB_PORT`
  - avant C1 : `${DB_PORT:-5432}`
  - apres C1 : `"5432"`
- suppression de :
  - `extra_hosts: host.docker.internal:host-gateway`
- suppression de la publication host du backend :
  - avant C1 : `127.0.0.1:${BACKEND_EXPOSE_PORT:-5006}:5000`
  - apres C1 : aucune publication host
- ouverture reseau du frontend :
  - avant C1 : `127.0.0.1:${FRONTEND_EXPOSE_PORT:-8089}:80`
  - apres C1 : `${FRONTEND_EXPOSE_PORT:-8089}:80`

Element volontairement conserve :

- publication PostgreSQL sur `127.0.0.1:${DB_EXPOSE_PORT:-5435}:5432`

Motif :

- conserve une possibilite d'administration locale restreinte au host ;
- n'expose pas PostgreSQL au reseau externe ;
- ne perturbe pas inutilement les usages de maintenance locale.

### `.env.example`

Changements appliques :

- suppression de `BACKEND_EXPOSE_PORT` de l'exemple Docker de livraison ;
- documentation explicite du fait que PostgreSQL reste lie a `localhost` uniquement pour administration cote host ;
- documentation explicite du fait que le frontend est le seul point d'entree utilisateur ;
- mise a jour de `DB_HOST=db` pour le mode Docker de livraison ;
- documentation explicite de la separation avec le mode backend local autonome gere par `hydro_Hassan dakhil/backend/.env.example`.

## 5. Justification

Decision retenue :

- le mode `docker-compose` devient la reference du runtime Docker portable ;
- le backend autonome local conserve son propre mode via `hydro_Hassan dakhil/backend/.env.example` avec `DB_HOST=localhost` ;
- aucun nouveau fichier de configuration n'a ete cree, afin de rester minimal dans le lot C1 ;
- `nginx.conf` n'a pas eu besoin d'etre modifie, car il proxy deja `/api/` vers `http://backend:5000/api/`.

Justification technique :

- `frontend` et `backend` partagent deja le reseau Compose par defaut ;
- `frontend` sait deja joindre `backend` via son nom de service ;
- le vrai point bloquant etait la reference PostgreSQL du backend vers `host.docker.internal` ;
- la publication host du backend n'etait pas necessaire au fonctionnement de l'architecture cible.

## 6. Comparaison avant / apres

| Element | Avant C1 | Apres C1 |
| --- | --- | --- |
| Backend DB host | `${DB_HOST:-host.docker.internal}` | `db` |
| Backend DB port | `${DB_PORT:-5432}` | `"5432"` |
| Frontend host binding | `127.0.0.1:${FRONTEND_EXPOSE_PORT:-8089}:80` | `${FRONTEND_EXPOSE_PORT:-8089}:80` |
| Backend exposition host | `127.0.0.1:${BACKEND_EXPOSE_PORT:-5006}:5000` | aucune publication host |
| DB exposition host | `127.0.0.1:${DB_EXPOSE_PORT:-5435}:5432` | `127.0.0.1:${DB_EXPOSE_PORT:-5435}:5432` |
| Communication interne | `frontend -> backend`, `backend -> host.docker.internal:${DB_PORT:-5432}` | `frontend -> backend`, `backend -> db:5432` |

## 7. Commandes de validation utilisees

Commandes de lecture / validation statique executees :

- `git branch --show-current`
- `git rev-parse HEAD`
- `git status --short -- 'docker-compose.yml' '.env.example' 'hydro_Hassan dakhil/backend/.env.example'`
- `docker compose ps`
- `docker compose config --services`
- `docker compose config --images`
- `git diff --no-index --unified=0 -- <backup> <fichier courant>`

Aucune commande destructive Git ou Docker n'a ete utilisee.

## 8. Resultats

### Validation Compose

Resultat de `docker compose config --services` :

- `db`
- `backend`
- `frontend`

Resultat de `docker compose config --images` :

- `postgis/postgis:17-3.5`
- `app_hassan_addakhil-backend`
- `app_hassan_addakhil-frontend`

### Validation statique par inspection

Confirme apres C1 :

- le backend reference desormais `db` ;
- le backend utilise le port PostgreSQL interne `5432` ;
- le frontend devient publiable sur le reseau cible ;
- PostgreSQL reste non public car limite au host local ;
- le backend n'est plus publie sur le host ;
- aucune dependance Docker runtime a `host.docker.internal` n'est conservee pour PostgreSQL.

### Etat runtime courant observe

Conteneurs actifs observes avant tout test dynamique :

- `hydro-hassan-ilh0107-backend`
- `hydro-hassan-ilh0107-db`
- `hydro-hassan-ilh0107-frontend`

Ils etaient deja en cours d'execution au moment du lot C1.

## 9. Limitations restantes

Limitations encore presentes apres C1 :

- le runtime actif n'a pas ete redeploye avec le Compose corrige ;
- la validation de demarrage reel `backend -> db:5432` n'a donc pas ete executee dynamiquement ;
- PostgreSQL reste accessible depuis le host local pour administration, ce qui est volontaire mais non indispensable au runtime ;
- les healthchecks n'ont pas ete retravailles dans ce lot ;
- les sujets `.dockerignore`, durcissement Dockerfiles, dump final et SWAT restent hors perimetre C1.

## 10. Rollback possible

Rollback documentaire possible a partir des sauvegardes C1 :

```powershell
Copy-Item -LiteralPath 'D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\01_AUDIT\backups_corrections\C1\docker-compose.yml.before_C1' `
  -Destination 'D:\3- Projets\App_Hassan_Addakhil\docker-compose.yml' -Force

Copy-Item -LiteralPath 'D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\01_AUDIT\backups_corrections\C1\.env.example.before_C1' `
  -Destination 'D:\3- Projets\App_Hassan_Addakhil\.env.example' -Force
```

Rollback non execute :

- aucune regression evidente n'a ete constatee en validation statique ;
- le lot reste donc en place sans restauration.

## 11. Fichiers reportes aux lots suivants

Lots suivants et fichiers hors perimetre volontairement non modifies :

- `LOT C3`
  - Dockerfiles
  - futurs `.dockerignore`
- `LOT C4`
  - `hydro_hd.sql`
  - `docker/db/init/10-restore-dump.sh`
- `LOT C5`
  - `scripts/swat-import/*`
  - tout le perimetre MDB / PowerShell
- `LOT C6`
  - eventuelle harmonisation des healthchecks
  - eventuelle robustesse `restart` / logs

## Conclusion

Evaluation du lot C1 :

- validation statique `OK`
- exposition reseau cible mieux alignee
- dependance Docker PostgreSQL au host Windows supprimee
- architecture `frontend -> backend -> db` correctement preparee

Decision :

`LOT C1 VALIDE`

Note importante :

- aucun test dynamique de redeploiement n'a ete lance pour ne pas modifier les conteneurs actifs de travail ;
- la verification runtime reelle devra intervenir dans un contexte controle lors d'une etape de validation dediee.
