# Inventaire Services

Date d'inventaire : 2026-08-27
Mode : lecture seule

## 1. Services et composants detectes

| Element | Type | Emplacement / declaration | Role probable | Necessaire pour la livraison | Remarque |
| --- | --- | --- | --- | --- | --- |
| `db` | service Docker Compose | `docker-compose.yml` | Base PostgreSQL avec extension PostGIS | `Oui` | Image `postgis/postgis:17-3.5`, volume persistant dedie, restore init possible depuis dump. |
| `backend` | service Docker Compose | `docker-compose.yml` + `hydro_Hassan dakhil\backend\Dockerfile` | API Node.js de l'application | `Oui` | Healthcheck present, image construite localement, port interne `5000`. |
| `frontend` | service Docker Compose | `docker-compose.yml` + `hydro_Hassan dakhil\frontend\Dockerfile` | Interface web servie par Nginx | `Oui` | Le runtime utilise Nginx dans l'image frontend, port interne `80`. |
| `Nginx frontend` | composant integre | `hydro_Hassan dakhil\frontend\nginx.conf` | Reverse proxy `/api/` vers le backend et service des assets SPA | `Oui` | Pas de service Nginx Compose separe. |
| `10-restore-dump.sh` | script d'init Docker | `docker\db\init\10-restore-dump.sh` | Restauration initiale de la base a partir du dump monte | `Oui` | Actif seulement sur initialisation d'un volume vide PostgreSQL. |
| `hydro_hd.sql` | dump de donnees | racine du projet | Source de restauration de la base `hydro_hd` | `Oui` | Taille observee `533241663` octets, extension trompeuse au regard de `pg_restore`. |
| `hydro_hd_pgdata_ilh0107` | volume Compose | `docker-compose.yml` | Persistance des donnees PostgreSQL | `Oui` | Volume moteur observe : `app_hassan_addakhil_hydro_hd_pgdata_ilh0107`. |
| `app_hassan_addakhil_default` | reseau Docker | etat Docker observe | Communication inter-services | `Oui` | Reseau par defaut Compose. |
| `scripts\swat-import\*.ps1` | scripts d'administration | `scripts\swat-import` | Import/analyse SWAT via Access/PowerShell | `A verifier` | Outils d'administration, non necessaires au runtime courant, et peu portables vers Linux. |
| `hydro_Hassan dakhil\backend\scripts\*` | scripts backend | `hydro_Hassan dakhil\backend\scripts` | Seed, reset mot de passe, traitements metier et imports | `A verifier` | Certains scripts paraissent utiles en maintenance, d'autres semblent purement locaux. |
| `hydro_Hassan dakhil\frontend\vite.config.ts` | configuration dev | `hydro_Hassan dakhil\frontend` | Proxy et serveur de developpement Vite | `Non` | Utile pour le developpement, pas pour le runtime Nginx de livraison. |
| `hydro_Hassan dakhil\frontend\setup.bat` | script local Windows | `hydro_Hassan dakhil\frontend` | Demarrage local historique | `Non` | Candidat a exclusion future du package final. |

## 2. Services actuellement observes en execution

| Conteneur observe | Service logique | Etat | Port hote observe |
| --- | --- | --- | --- |
| `hydro-hassan-ilh0107-db` | `db` | `healthy` | `127.0.0.1:5436->5432/tcp` |
| `hydro-hassan-ilh0107-backend` | `backend` | `healthy` | `127.0.0.1:5007->5000/tcp` |
| `hydro-hassan-ilh0107-frontend` | `frontend` | `healthy` | `127.0.0.1:8090->80/tcp` |

## 3. Observations

- Aucun service Compose dedie a Nginx, Redis, worker, scheduler ou proxy externe n'a ete detecte.
- Les images applicatives sont deja construites localement, mais aucun package de livraison n'est encore constitue.
- Des images et conteneurs historiques lies a d'anciens travaux Docker existent localement ; ils ne doivent pas etre confondus avec le package final a remettre a Ziz.

## 4. Conclusion

Inventaire etabli sans aucune action destructive.

Les composants minimaux necessaires a une livraison Docker semblent etre :

- `docker-compose.yml`
- le service `db`
- le service `backend`
- le service `frontend`
- le volume de donnees PostgreSQL
- le dump `hydro_hd.sql`
- le script d'initialisation `10-restore-dump.sh`

Les scripts SWAT et certains scripts locaux Windows restent a qualifier avant inclusion ou exclusion du package final.

## 5. Matrice runtime C6

| Service | Port interne | Exposition | Healthcheck | Restart | Logs | Depend de |
| --- | --- | --- | --- | --- | --- | --- |
| `db` | `5432` | `127.0.0.1:${DB_EXPOSE_PORT:-5435}->5432` | `pg_isready -h 127.0.0.1 -p 5432 -U $POSTGRES_USER -d $POSTGRES_DB` | `unless-stopped` | `json-file`, `10m`, `3` | Aucun |
| `backend` | `5000` | non expose dans le compose actuel | `GET /api/v1/hydro/health` + verification `database=connected` | `unless-stopped` | `json-file`, `10m`, `3` | `db` sain |
| `frontend` | `80` | `${FRONTEND_EXPOSE_PORT:-8089}->80` | `GET /` | `unless-stopped` | `json-file`, `10m`, `3` | `backend` sain |

## 6. Notes C6

- le lot C6 n'a pas modifie les Dockerfiles ni `nginx.conf` ;
- le lot C6 renforce uniquement le runtime Docker via `docker-compose.yml` ;
- la validation dynamique a ete realisee sur des conteneurs temporaires isoles, sans volume source ni dump monte ;
- le stack principal observe localement est reste `healthy` pendant et apres les verifications.
