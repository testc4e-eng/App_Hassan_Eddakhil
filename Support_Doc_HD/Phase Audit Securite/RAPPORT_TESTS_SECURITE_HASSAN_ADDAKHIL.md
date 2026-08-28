# RAPPORT TESTS SECURITE — HASSAN ADDAKHIL

- Date : 2026-08-26
- Environnement de test : backend local `127.0.0.1:5007`, frontend local `127.0.0.1:8090`, base officielle `hydro_hd`

## Tests automatiques

| Test | Resultat |
| --- | --- |
| `backend npm run check` | OK |
| `frontend npm run check` | OK |
| `backend tests/http/app.test.ts` | OK |

## Tests HTTP de securite

| Probe | Resultat attendu | Resultat observe | Verdict |
| --- | --- | --- | --- |
| `GET /api/auth/me` sans token | 401 | 401 | OK |
| `GET /api/v1/admin/db-config` sans token | 401 | 401 | OK |
| `GET /api/v1/admin/db-config` avec USER | 403 | 403 | OK |
| `GET /api/v1/admin/db-config` avec ADMIN | 200 | 200 | OK |
| `POST /api/v1/hydro/swat/import` sans token | 401 | 401 | OK |
| `POST /api/v1/hydro/swat/import` avec USER | 403 | 403 | OK |
| `GET /api/v1/spatial/advanced/debug-root` sans token | 401 | 401 | OK |
| `GET /api/v1/spatial/advanced/debug-root` avec ADMIN | acces controle, plus de divulgation publique | erreur metier sur source absente mais acces bien controle | OK |
| `GET /api/v1/solid-yield/debug/diagnostic` sans token | 401 | 401 | OK |
| `GET /api/v1/solid-yield/debug/diagnostic` avec ADMIN | 200 | 200 | OK |
| SQLi probe `scenario_1' OR '1'='1` | pas d'execution parasite | `data=[]` | OK |
| `GET /api/v1/hydro/health` | payload minimal | 200 minimal | OK |

## Tests frontend / exposition fichiers

Les probes `/.env`, `/hydro_hd.sql`, `/Support_Doc_HD/` sur le serveur Vite de developpement retournent la page SPA de dev. Cela ne prouve pas le blocage Nginx de production ; ce point est valide par revue de `frontend/nginx.conf`, pas par le serveur de dev.

## Baseline fonctionnelle

Le comparateur signale `REGRESSION` uniquement parce que la baseline de reference avait ete prise avec services backend/frontend non disponibles, alors que la baseline courante observe des `200`. Les invariants metier proteges restent intacts.

## Verdict

- Regressions securite : `NON`
- Regressions donnees metier : `NON`
- Warning de comparaison : `OUI`, purement lie a l'etat initial des services
