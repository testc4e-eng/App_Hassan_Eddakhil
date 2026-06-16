# Authentication Tests

## Accounts Initiaux

- ADMIN: `c4e.africa@gmail.com`
- USER: `ilhamqaidouh@gmail.com`
- Les mots de passe initiaux sont gérés par le seed local et ne sont pas stockés en clair dans le dépôt.

## Tests Fonctionnels

1. Connexion ADMIN
2. Connexion USER
3. Redirection ADMIN vers `/admin`
4. Redirection USER vers `/dashboard`
5. Affichage du menu utilisateur connecté
6. Accès à `/admin` réservé à ADMIN
7. Accès à `/admin/users` réservé à ADMIN
8. Accès à `/change-password` pour utilisateur connecté
9. Changement de mot de passe avec ancien mot de passe valide
10. Refus du changement de mot de passe avec ancien mot de passe invalide
11. Désactivation d’un utilisateur et refus de connexion
12. Logout et suppression du token côté frontend
13. Réponse API sans `password_hash`

## Vérifications API

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`
- `PATCH /api/admin/users/:id/reset-password`
- `DELETE /api/admin/users/:id`

## Contrôles Sécurité

- JWT présent dans `Authorization: Bearer ...`
- refus des comptes `INACTIVE`
- refus des routes admin pour `USER`
- messages d’erreur génériques à la connexion
- mot de passe jamais retourné par l’API
