# APIs

Les APIs sont exposées sous des préfixes clairs. Les réponses suivent majoritairement un enveloppement JSON de type `success/data/error`. Cette documentation reprend les endpoints effectivement présents dans le code.

## Convention de réponse

La plupart des routes renvoient une enveloppe de la forme:

```json
{
  "success": true,
  "data": {}
}
```

En cas d’erreur, le backend renvoie:

```json
{
  "success": false,
  "error": "message lisible"
}
```

## Groupes d’API

| Groupe | Préfixe | Usage |
|---|---|---|
| hydro | `/api/v1/hydro` | stations, catchments, series, statistiques, modèles |
| timeseries | `/api/v1/timeseries` | catalogue, date-range, bundle, agrégation |
| catalog | `/api/v1/catalog` | runs, propriétés, stations, catalogue enrichi |
| catalog availability | `/api/v1/catalog/availability` | disponibilité par module |
| spatial | `/api/v1/spatial` | bassins, sous-bassins, reaches, stations, projet |
| maps | `/api/v1/maps` | valeurs des stations pour cartographie |
| access | `/api/v1/access` | scan de données, tables, entités, stats |
| swat | `/api/v1/hydro/swat` | import et lecture SWAT |
| solid-yield | `/api/v1/solid-yield` | sous-bassins, disponibilité, stats |
| auth | `/api/auth` | login, me, change-password, logout |
| admin | `/api/admin` | gestion des utilisateurs |

## Endpoints clés

| Endpoint | Méthode | Rôle |
|---|---|---|
| `/api/auth/login` | POST | authentifier un utilisateur |
| `/api/auth/me` | GET | profil connecté |
| `/api/auth/change-password` | POST | changer son mot de passe |
| `/api/admin/users` | GET/POST | lister et créer des comptes |
| `/api/v1/timeseries/date-range` | GET | bornes réelles d’une série |
| `/api/v1/timeseries/bundle` | GET | catalogue + stats + fenêtre |
| `/api/v1/spatial/project-hassan-addakhil` | GET | mode projet spatial |
| `/api/v1/data-scan/summary` | GET | résumé qualité des données |

## Paramètres fréquents

| Paramètre | Usage |
|---|---|
| `stationId` | identifier une station cible |
| `runId` | choisir un scénario ou modèle |
| `propertyId` | cibler une variable |
| `module` | filtrer climat / hydro / erosion |
| `startDate` / `endDate` | borner une période |

## Sécurité et contrat

| Point | Règle |
|---|---|
| Auth | les routes privées utilisent JWT |
| Admin | `/api/admin` réservé au rôle ADMIN |
| Login | messages génériques pour éviter les fuites |
| Export | suit le même filtre que l’interface |

## Exemple d’usage

### Récupérer les bornes d’une série

```http
GET /api/v1/timeseries/date-range?stationId=35&runId=1&propertyId=12&module=hydro
```

Réponse attendue:

```json
{
  "min_date": "1982-01-01",
  "max_date": "2024-12-31",
  "n_points": 455
}
```

### Lister les utilisateurs

```http
GET /api/admin/users
Authorization: Bearer <token>
```

Réponse attendue:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "full_name": "C4E Admin",
      "email": "c4e.africa@gmail.com",
      "role": "ADMIN",
      "status": "ACTIVE"
    }
  ]
}
```

## Ce qu’il faut retenir

- les routes API sont regroupées par domaine
- les paramètres de filtrage doivent rester cohérents avec l’UI
- la sécurité dépend du token et du rôle
- le frontend ne doit pas inventer de données, il consomme les réponses réelles du backend
