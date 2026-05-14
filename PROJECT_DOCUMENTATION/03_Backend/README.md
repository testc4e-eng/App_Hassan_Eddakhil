# Backend

Le backend est structuré autour d’Express en TypeScript. La logique suit un découpage lisible: routes -> controllers -> services -> base de données. Le serveur applique une couche de sécurité, de compression et de limitation de débit.

Le code backend joue le rôle de pivot entre l’interface et PostgreSQL. Il:

- expose les API métier
- protège les routes privées
- valide les entrées utilisateur
- orchestre les requêtes SQL
- reformate les résultats pour le frontend

## Organisation du code

| Répertoire | Rôle |
|---|---|
| `config` | base de données et JWT |
| `controllers` | orchestration HTTP |
| `services` | logique métier et SQL |
| `routes` | exposition REST |
| `middleware` | auth, validation, erreurs |
| `types` / `schemas` / `utils` | typage et aide technique |

## Flux HTTP standard

1. le frontend appelle une route REST
2. le controller récupère les paramètres
3. le middleware vérifie le token si nécessaire
4. le service exécute la requête SQL ou la transformation
5. la réponse JSON est renvoyée au composant consommateur

## Sécurité backend

- `helmet` et `cors` configurés dans `app.ts`
- rate limiting sur le préfixe `/api`
- authentification JWT sur les routes protégées
- `bcrypt` pour le stockage des mots de passe
- validation `zod` sur les entrées sensibles

## Entrées majeures du backend

| Fichier | Rôle |
|---|---|
| `src/app.ts` | composition des middlewares et montage des routes |
| `src/config/database.config.ts` | connexion PostgreSQL via `pg` |
| `src/config/jwt.config.ts` | signature et vérification des tokens |
| `src/middleware/auth.ts` | vérification token et rôle |
| `src/services/*.ts` | logique métier et SQL |

## Contrôleurs importants

| Controller | Responsabilité |
|---|---|
| `authController` | login, profil, changement de mot de passe |
| `adminUsersController` | CRUD utilisateurs |
| `hydroController` | stations, timeseries, catchments, stats |
| `spatialController` | couches géographiques |
| `dataScanController` | qualité et disponibilité |

## Ce qu’il faut retenir

- le backend sert de couche de sécurité et d’orchestration
- la donnée n’est pas poussée directement au frontend sans transformation
- les modules métier reposent sur des services séparés
