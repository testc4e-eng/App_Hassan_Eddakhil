# Deployment

Le projet se lance localement avec un backend Express/TypeScript, un frontend Vite et une base PostgreSQL/PostGIS. Le démarrage dépend de la configuration des variables d’environnement et de l’existence d’une base restaurée.

## Prérequis

- Node.js et npm
- PostgreSQL
- PostGIS activé
- un fichier `.env` correctement renseigné pour le backend

## Ports observés

| Composant | Port |
|---|---|
| PostgreSQL | 5432 |
| Backend local | 5000 |
| Frontend Vite | 5173 |

## Scripts utiles

### Frontend

- `npm run dev`
- `npm run build`
- `npm run preview`

### Backend

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run seed:users`

## Variables d’environnement

| Fichier | Variables principales |
|---|---|
| `backend/.env` | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS` |
| `frontend/.env` | `VITE_API_BASE_URL`, `VITE_API_URL` |

## Installation locale

1. installer les dépendances du backend
2. installer les dépendances du frontend
3. vérifier la base PostgreSQL
4. lancer les migrations / scripts SQL si nécessaire
5. lancer le backend
6. lancer le frontend

## Checklist de démarrage

- la base répond sur le port attendu
- les variables `.env` sont présentes
- l’API backend répond sur `/api/v1`
- le frontend pointe sur la bonne base API
- les comptes seedés existent si l’authentification est active

## Déploiement fonctionnel

La plateforme peut être déployée de manière séparée:

- backend exposé comme service API
- frontend servi statiquement ou via Vite preview en environnement de test
- base PostgreSQL placée sur une instance stable

## Points de vigilance

- ne pas exposer les secrets dans Git
- vérifier les origines CORS
- conserver la cohérence entre l’URL frontend et l’URL API
- garder le format des données compatible avec le frontend
