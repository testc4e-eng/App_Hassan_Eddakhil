# AUDIT .ENV / CREDENTIALS — HASSAN ADDAKHIL

- Date : 2026-08-26
- Règle appliquée : aucune valeur sensible n'est affichée dans ce rapport

## 1. Résumé exécutif

- Les fichiers `.env.example` sont correctement neutralisés avec des placeholders.
- Les variables exposées au frontend via `VITE_*` ne contiennent pas de secret backend ou base de données.
- Des secrets réels restent présents dans les fichiers locaux `.env` et `backend/.env`.
- Ces fichiers ne sont pas listés dans `git ls-files`, mais leur présence locale avec valeurs réelles reste un risque `CRITICAL`.

## 2. Statut Git / exemples

| Fichier | Présent | Versionné Git | Commentaire |
| --- | --- | --- | --- |
| `.env` | OUI | NON détecté | fichier local avec secrets réels |
| `backend/.env` | OUI | NON détecté | fichier local avec secrets réels |
| `.env.example` | OUI | OUI | placeholders uniquement |
| `backend/.env.example` | OUI | OUI | placeholders uniquement |

## 3. Variables sensibles auditées

| Variable | Fichier | Présente | Hardcodée | Versionnée Git | Utilisée frontend | Risque |
| --- | --- | --- | --- | --- | --- | --- |
| `POSTGRES_PASSWORD` | `.env` | OUI | OUI | NON détecté | NON | CRITICAL |
| `JWT_SECRET` | `.env` | OUI | OUI | NON détecté | NON | HIGH |
| `DB_PASSWORD` | `backend/.env` | OUI | OUI | NON détecté | NON | CRITICAL |
| `JWT_SECRET` | `backend/.env` | OUI | OUI | NON détecté | NON | HIGH |
| `SEED_USER_PASSWORD_HASH` | `.env` / `backend/.env` | OUI | OUI | NON détecté | NON | MEDIUM |
| `POSTGRES_PASSWORD` | `.env.example` | OUI | NON | OUI | NON | LOW |
| `JWT_SECRET` | `.env.example` | OUI | NON | OUI | NON | LOW |
| `DB_PASSWORD` | `backend/.env.example` | OUI | NON | OUI | NON | LOW |
| `JWT_SECRET` | `backend/.env.example` | OUI | NON | OUI | NON | LOW |

## 4. Exposition frontend

| Élément | Statut | Justification |
| --- | --- | --- |
| `VITE_API_BASE` | OK | URL d'API uniquement |
| `VITE_API_BASE_URL` | OK | URL d'API uniquement |
| `VITE_API_URL` | OK | URL d'API uniquement |
| `DB_PASSWORD` dans frontend | NON trouvé | aucun secret DB injecté côté build frontend |
| `JWT_SECRET` dans frontend | NON trouvé | aucun secret JWT injecté côté build frontend |

## 5. Docker / build

| Fichier | Constat | Risque |
| --- | --- | --- |
| `docker-compose.yml` | consomme `POSTGRES_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET` via variables d'environnement | normal si injecté depuis environnement sûr |
| `frontend/Dockerfile` | ne reçoit que des variables `VITE_*` non sensibles | LOW |
| `backend/Dockerfile` | aucun secret hardcodé détecté | LOW |

## 6. Scripts actifs

| Fichier | Constat | Risque |
| --- | --- | --- |
| `scripts/swat-import/import_etat_actuel_bundle.ps1` | lit `PGPASSWORD`, `DB_PASSWORD`, `POSTGRES_PASSWORD` depuis l'environnement | MEDIUM |
| `scripts/swat-import/import_swat_output.ps1` | utilise l'environnement pour PostgreSQL | MEDIUM |
| `backend/scripts/seed-users.js` | utilise `DB_PASSWORD` et seed password via env | MEDIUM |
| `backend/scripts/reset-user-password.js` | utilise `DB_PASSWORD` et mot de passe de reset via env | MEDIUM |
| `backend/scripts/diagnose.js` | lit la config DB depuis env | LOW |

## 7. Credentials applicatifs

| Sujet | Statut | Commentaire |
| --- | --- | --- |
| Mots de passe utilisateurs en clair frontend | NON trouvé | OK |
| JWT secret exposé frontend | NON trouvé | OK |
| Password DB exposé frontend | NON trouvé | OK |
| Hash bcrypt de seed | OUI | acceptable en configuration si secret source non publié |
| Credentials de test publics | présents en environnement de test seulement | faible risque local |

## 8. Conclusions

### OK

- `.env` est ignoré par les règles `.gitignore`
- `.env.example` et `backend/.env.example` ne révèlent pas de secret réel
- aucune variable `VITE_*` sensible détectée

### WARNING / KO

- `POSTGRES_PASSWORD` réel présent localement dans `.env`
- `DB_PASSWORD` réel présent localement dans `backend/.env`
- `JWT_SECRET` non placeholder fort dans les fichiers locaux

## 9. Corrections recommandées

1. Conserver les valeurs réelles uniquement dans un store local sécurisé ou dans des variables d'environnement hors dépôt.
2. Remplacer les valeurs locales faibles de type `change_me_*` par de vrais secrets robustes hors versionnement.
3. Éviter de garder des secrets réels dans plusieurs `.env` locaux redondants.
4. Vérifier régulièrement `git ls-files` et `git status` pour s'assurer qu'aucun `.env` réel n'entre dans l'index.

## 10. Verdict

- Credentials : `WARNING`
- Secrets hardcodés locaux : `OUI`
- Secrets exposés au frontend : `NON`
- Fuite directe détectée dans les rapports : `NON`
