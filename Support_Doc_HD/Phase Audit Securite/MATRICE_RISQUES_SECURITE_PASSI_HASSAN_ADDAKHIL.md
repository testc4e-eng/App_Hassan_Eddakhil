# MATRICE DES RISQUES SECURITE PASSI — HASSAN ADDAKHIL

- Date : 2026-08-26

| ID | Risque | Criticite | Correction | Test | Resultat | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | Import SWAT accessible sans auth | CRITIQUE | `verifyToken + requireRole("ADMIN")` sur `/api/v1/hydro/swat/import` | POST anonyme / USER / ADMIN | 401 / 403 / comportement normal admin | CORRIGE |
| R2 | Suppression SWAT accessible sans auth | CRITIQUE | `verifyToken + requireRole("ADMIN")` sur `/delete-by-filter` | DELETE anonyme | 401 | CORRIGE |
| R3 | Secret PostgreSQL hardcode dans le script SWAT | CRITIQUE | suppression du secret, lecture via variables d'environnement | revue fichier + `npm run check` backend | aucun secret hardcode restant | CORRIGE |
| R4 | Route debug spatial publique | HIGH | protection ADMIN sur `/api/v1/spatial/advanced/debug-root` | GET anonyme / ADMIN | 401 / 404 metier controlee | CORRIGE |
| R5 | Route diagnostic solid yield publique | HIGH | protection ADMIN sur `/api/v1/solid-yield/debug/diagnostic` | GET anonyme / ADMIN | 401 / 200 | CORRIGE |
| R6 | Exposition Docker sur toutes interfaces | HIGH | bind `127.0.0.1` dans `docker-compose.yml` | revue config | restriction presente | CORRIGE |
| R7 | Root API trop verbeux | HIGH | payload minimal sur `/` | GET `/` | plus de liste d'endpoints exposee | CORRIGE |
| R8 | Health API trop verbeux | HIGH | payload minimal sur `/api/v1/hydro/health` | GET health | plus de structure interne exposee | CORRIGE |
| R9 | Refus CORS non propre pour origine inconnue | HIGH | callback CORS renvoie `false` au lieu d'une erreur | OPTIONS origine autorisee / inconnue | 204 avec ACAO / 200 sans ACAO | CORRIGE |
| R10 | Messages admin DB trop verbeux | MEDIUM | messages sanitises dans `adminDbConfig.service.ts` | tests d'acces + revue | plus d'hote/port/detail technique en erreur | CORRIGE |
| R11 | Fuites de chemins absolus dans logs/erreurs | MEDIUM | messages neutres dans `advancedSpatial.service.ts` et `server.ts` | route debug admin | message sans chemin `D:\...` | CORRIGE |
| R12 | Headers HTTP de securite insuffisants | MEDIUM | hardening `helmet` backend + regles Nginx | GET backend + revue Nginx | headers backend visibles, regles Nginx presentes | CORRIGE |
| R13 | Acces potentiel a fichiers sensibles en prod | MEDIUM | regles Nginx de blocage | revue `frontend/nginx.conf` | blocages configures | CORRIGE |
| R14 | Emails reels dans fichiers d'exemple | MEDIUM | placeholders dans `.env.example` | revue fichiers | plus d'emails reels | CORRIGE |
| R15 | 7 vulnerabilites frontend remontees precedemment | MEDIUM | revalidation `npm audit --omit=dev` | audit final frontend | 0 vulnerabilite reproduite | FAUX POSITIF |
| R16 | Audit dependances backend non execute | LOW | aucun contournement autorise | tentative precedente bloquee par politique | resultat non disponible | REPORTE |
| R17 | Payload XSS / traversal reflechi par `damCode` | HIGH | validation stricte `^[A-Z0-9_-]+$` sur `damCode` | probes XSS et traversal sur siltation | 400 propre | CORRIGE |
| R18 | Erreur SQL brute sur `propertyId` invalide | HIGH | validation entiers + message generique dans `catalogAvailability.ts` | probe `propertyId=1' OR '1'='1` | 400 propre, pas de SQL brut | CORRIGE |
| R19 | Validation Nginx conteneurisee indisponible | MEDIUM | aucune correction applicative necessaire | `docker compose ps` | daemon Docker indisponible localement | ACCEPTE |
| R20 | Rate limit peu observable en dev local | LOW | conservation du limiteur existant | 5 tentatives login | headers `RateLimit-*` presents, compteur decremente | ACCEPTE |

## Notes

1. `FAUX POSITIF` signifie ici : non reproduit lors de la validation finale du mercredi 26 aout 2026.
2. `REPORTE` signifie : non realisable sans autorisation supplementaire ou changement de contexte.
3. `ACCEPTE` signifie : risque compris, non bloquant pour la validation finale, sans regression constatee.
