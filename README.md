# Hassan Addakhil Hydro-Data Intelligence

Version allegee du projet Hassan Addakhil pour partager le code applicatif et lancer l'application sur une autre machine, sans jeux de donnees metiers ni backup PostgreSQL embarque.

## Contenu

- `hydro_Hassan dakhil/frontend` : application React/Vite
- `hydro_Hassan dakhil/backend` : API Express/TypeScript
- `docker-compose.yml` : pile locale PostGIS + backend + frontend
- `docker/db/init` : initialisation PostgreSQL sans dump obligatoire

## Modules exposes

Le dashboard principal active notamment :

- `spatial`
- `climate`
- `hydraulic`
- `sediment`
- `simulatedData`
- `dataScan`
- `reports`
- `maps`

## Lancement local

### Docker

```powershell
docker compose up -d --build
```

Acces par defaut :

- Frontend : `http://localhost:8089`
- Backend : `http://localhost:5006`
- PostgreSQL : `localhost:5435`

### Variables d'environnement

Un fichier racine `.env.example` est fourni.

- copier `.env.example` vers `.env` si vous voulez personnaliser les ports ou secrets
- sans `.env`, `docker-compose.yml` utilise des valeurs de demarrage par defaut

### Frontend seul

```powershell
cd "D:\3- Projets\hassanAddakhil\hydro_Hassan dakhil\frontend"
npm install
npm run dev
```

### Backend seul

```powershell
cd "D:\3- Projets\hassanAddakhil\hydro_Hassan dakhil\backend"
npm install
npm run dev
```

## Note importante

Cette branche ne contient pas les jeux de donnees lourds, les dossiers de travail metier ni le dump de base. La base PostgreSQL demarre donc vide par defaut. Les fonctionnalites dependantes d'une base hydratee necessiteront ensuite un import ou une initialisation adaptee a votre environnement.
