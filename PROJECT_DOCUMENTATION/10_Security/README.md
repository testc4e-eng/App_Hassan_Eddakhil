# Security

La sécurité repose sur une authentification JWT, des rôles applicatifs et des protections HTTP classiques. L’accès à l’administration est limité au rôle `ADMIN`.

## Composants de sécurité

| Mécanisme | Rôle |
|---|---|
| JWT | session applicative et vérification des requêtes |
| bcrypt | hash des mots de passe |
| verifyToken | protection des routes privées |
| requireRole('ADMIN') | restriction des routes d’administration |
| rate limiting | protection des endpoints sensibles |
| helmet / cors | durcissement HTTP |

## Rôles observés

| Rôle | Droits principaux |
|---|---|
| ADMIN | gestion des utilisateurs, accès au dashboard admin, consultation globale |
| USER | consultation métier, changement de mot de passe, accès au dashboard standard |

## Flux d’authentification

1. l’utilisateur saisit son email et son mot de passe
2. le backend vérifie le compte et son statut
3. le mot de passe est comparé au hash bcrypt
4. un JWT est renvoyé au frontend
5. le frontend stocke le token et l’envoie dans `Authorization: Bearer ...`

## Bonnes pratiques appliquées

- ne jamais renvoyer `password_hash`
- ne pas exposer d’informations sensibles dans les messages de login
- vérifier le statut `ACTIVE` avant de valider une session
- refuser les routes admin au rôle `USER`
- invalider proprement la session côté frontend en cas de 401

## Variables de configuration

| Variable | Usage |
|---|---|
| `JWT_SECRET` | clé de signature du token |
| `JWT_EXPIRES_IN` | durée de vie du token |
| `BCRYPT_SALT_ROUNDS` | coût de hash |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_SSL` | connexion PostgreSQL |

## Ce qu’il faut surveiller

- expiration des tokens
- utilisateurs désactivés
- erreurs de validation d’entrée
- accès non autorisé aux routes admin
- configuration CORS entre frontend et backend
