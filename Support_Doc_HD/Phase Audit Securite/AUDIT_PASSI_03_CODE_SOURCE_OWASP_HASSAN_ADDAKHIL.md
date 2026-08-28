# AUDIT PASSI 03 — CODE SOURCE / OWASP — HASSAN ADDAKHIL

- Date : 2026-08-26
- Referentiel : OWASP Top 10, controle d'acces, exposition d'information, gestion des secrets

## Resume executif

Le code source ne montre pas de regression metier introduite par la securisation. Les principales corrections OWASP ont porte sur l'authentification/autorisation, la reduction de surface d'information et l'elimination d'un secret hardcode.

## Anomalies confirmees et traitees

### A01 — Broken Access Control

1. Endpoints SWAT sensibles exposes publiquement.
2. Route `spatial/advanced/debug-root` accessible sans controle.
3. Route `solid-yield/debug/diagnostic` accessible sans controle.

Correction :

- Ajout de `verifyToken` et `requireRole("ADMIN")` sur ces routes.
- Ajout de l'envoi du bearer token dans `frontend/src/services/swatDataService.ts` pour conserver l'usage admin legitime.

### A05 — Security Misconfiguration

1. Root endpoint trop verbeux.
2. `healthCheck` trop bavard.
3. `x-powered-by` actif.
4. Preflight CORS moins strict que la politique principale.

Correction :

- Payload `/` minimal.
- Payload `health` minimal.
- `app.disable("x-powered-by")`.
- Unification de la politique CORS.

### A02 / Secrets Management

1. Mot de passe PostgreSQL code en dur dans un script actif d'import SWAT.

Correction :

- Secret retire du script.
- Lecture stricte depuis l'environnement.

### A09 — Logging / Information Exposure

1. Reponses et logs contenant des chemins absolus locaux.
2. Service `adminDbConfig` renvoyant trop d'information dans les messages de test.

Correction :

- Messages sanitises.
- Logs limites a `configured/missing` au lieu du chemin absolu.

## Tests OWASP fonctionnels

| Test | Resultat |
| --- | --- |
| `/api/auth/me` sans token | 401 |
| `/api/v1/admin/db-config` sans token | 401 |
| `/api/v1/admin/db-config` avec USER | 403 |
| `/api/v1/hydro/swat/import` sans token | 401 |
| `/api/v1/hydro/swat/import` avec USER | 403 |
| `/api/v1/spatial/advanced/debug-root` sans token | 401 |
| `/api/v1/solid-yield/debug/diagnostic` sans token | 401 |
| Probe `scenarioCode=scenario_1' OR '1'='1` | 200 avec `data=[]`, pas d'explosion SQL |

## Points residuels

1. Le probe frontend sur `/.env`, `/hydro_hd.sql`, `/Support_Doc_HD/` en mode Vite retourne la page SPA de dev ; cela ne valide pas le blocage Nginx en runtime prod.
2. `npm audit` frontend remonte encore 7 vulnerabilites de dependances a traiter dans une phase dediee de mise a jour.

## Verdict

- Controle d'acces : `RENFORCE`
- Exposition d'information : `REDUITE`
- Secret hardcode : `CORRIGE`
