# Installation Hydro-Data Intelligence - Ziz

Version : 1.0.0

## 1. Prérequis

- Docker Engine avec Docker Compose v2
- Serveur Linux amd64
- Espace disque suffisant pour les images Docker et la base PostgreSQL

## 2. Configuration

Copier le fichier exemple :

cp env.ziz.example .env

Modifier ensuite .env et renseigner au minimum :

- POSTGRES_USER
- POSTGRES_PASSWORD
- JWT_SECRET avec au moins 32 caractères
- FRONTEND_EXPOSE_PORT si nécessaire

Ne jamais livrer ou partager un fichier .env contenant des secrets réels.

## 3. Vérifier les checksums

cd docker-images
sha256sum -c SHA256SUMS.txt
cd ../database
sha256sum -c SHA256SUMS.txt
cd ..

## 4. Charger les images Docker

docker load -i docker-images/postgis_17-3.5.tar
docker load -i docker-images/hassan-addakhil-backend_1.0.0.tar
docker load -i docker-images/hassan-addakhil-frontend_1.0.0.tar

## 5. Démarrer uniquement PostgreSQL

docker compose --env-file .env -f docker-compose.ziz.yml up -d db

Vérifier son état :

docker compose --env-file .env -f docker-compose.ziz.yml ps db

Attendre que le service db soit healthy.

## 6. Restaurer la base hydro_hd

DB_CONTAINER=$(docker compose --env-file .env -f docker-compose.ziz.yml ps -q db)

docker cp database/hydro_hd_v1.0.0.dump "$DB_CONTAINER:/tmp/hydro_hd_v1.0.0.dump"

docker exec "$DB_CONTAINER" sh -lc 'dropdb -U "$POSTGRES_USER" --if-exists "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" -T template0 "$POSTGRES_DB"'

docker exec "$DB_CONTAINER" sh -lc 'pg_restore --no-owner --no-privileges --exit-on-error -U "$POSTGRES_USER" -d "$POSTGRES_DB" /tmp/hydro_hd_v1.0.0.dump'

## 7. Vérifier la restauration

docker exec "$DB_CONTAINER" sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT dam_code, count(*) FROM hydro.bathymetry_campaigns GROUP BY dam_code ORDER BY dam_code;"'

La ligne HASSAN_ADDAKHIL doit afficher 6 campagnes.

## 8. Démarrer application

docker compose --env-file .env -f docker-compose.ziz.yml up -d backend frontend

## 9. Vérifier les services

docker compose --env-file .env -f docker-compose.ziz.yml ps

Les services db, backend et frontend doivent être healthy.

## 10. Accès application

Par défaut :

http://ADRESSE_DU_SERVEUR:8089

Le port dépend de FRONTEND_EXPOSE_PORT dans .env.

## 11. Vérification backend

curl http://127.0.0.1:8089/api/v1/hydro/health

La réponse doit indiquer database = connected.

## 12. Exploitation

Consulter documentation/EXPLOITATION_DOCKER_ZIZ.md.

Pour les opérations SWAT sous Windows, consulter documentation/SWAT_ADMINISTRATION_WINDOWS.md.

## 13. Sauvegarde et restauration

Les scripts disponibles dans scripts/ sont :

- backup_hydro_hd.sh
- restore_hydro_hd.sh

Ne jamais exécuter docker compose down -v sans sauvegarde validée de PostgreSQL.
