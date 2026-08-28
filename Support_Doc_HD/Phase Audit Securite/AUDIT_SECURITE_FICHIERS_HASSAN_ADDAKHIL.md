# AUDIT SECURITE FICHIERS — HASSAN ADDAKHIL

- Date : 2026-08-26

## Objets sensibles verifies

| Fichier | Risque avant | Action appliquee | Statut |
| --- | --- | --- | --- |
| `docker-compose.yml` | exposition reseau trop large | bind localhost sur DB/backend/frontend | CORRIGE |
| `backend/src/app.ts` | CORS incoherent, root verbeux, `x-powered-by` | hardening + payload minimal | CORRIGE |
| `backend/src/controllers/hydroController.ts` | `health` trop verbeux | payload minimal | CORRIGE |
| `backend/src/routes/swatRoutes.ts` | import/delete/batches publics | auth admin | CORRIGE |
| `backend/src/routes/spatialRoutes.ts` | debug public | auth admin | CORRIGE |
| `backend/src/routes/solidYieldRoutes.ts` | diagnostic public | auth admin | CORRIGE |
| `backend/src/services/adminDbConfig.service.ts` | message de test trop verbeux | sanitisation | CORRIGE |
| `backend/src/services/advancedSpatial.service.ts` | fuite de chemins locaux | sanitisation logs/erreurs | CORRIGE |
| `frontend/src/services/swatDataService.ts` | appels admin sans bearer | ajout token | CORRIGE |
| `frontend/nginx.conf` | headers / blocages insuffisants | hardening proxy et fichiers | CORRIGE |
| `scripts/swat-import/import_etat_actuel_bundle.ps1` | mot de passe code en dur | secret via env uniquement | CORRIGE |
| `.env.example` | emails reels identifiables | placeholders | CORRIGE |
| `backend/.env.example` | emails reels identifiables | placeholders | CORRIGE |

## Fichiers non modifies volontairement

1. Donnees PostgreSQL `hydro_hd`
2. Scripts metier de calcul hydrologique
3. Modules front de cartographie, scenarios, dashboard, sediments
4. Donnees SWAT et tables runtime

## Conclusion

- Modifications appliquees : `MINIMALES ET CIBLEES`
- Touches sur donnees metier : `NON`
- Touches PostgreSQL : `NON`
