# RAPPORT FINAL PERFORMANCE — HASSAN ADDAKHIL

- Date : 2026-08-26
- Base officielle : `hydro_hd`
- Backend : `http://127.0.0.1:5007`
- Frontend : `http://127.0.0.1:8090`

## 1. Synthèse

| Indicateur | Verdict |
| --- | --- |
| Performance backend | OK |
| Performance frontend | OK |
| API `<= 3 s` | 16 |
| API `> 3 s` et `<= 5 s` | 1 |
| API `> 5 s` et `<= 10 s` | 0 runtime chaud confirmé |
| API `> 10 s` | 0 |
| Dashboards `<= 5 s` estimés | 10 |
| Dashboards `> 10 s` | 0 confirmé |
| SQL optimisé | aucun |
| Payload optimisé | aucun |
| Cache ajouté | aucun |
| Appels redondants supprimés | 0 |
| Credentials | WARNING |
| Secrets hardcodés locaux | 4 familles principales détectées |
| Données métier | PRÉSERVÉES |
| Régression | NON |

## 2. Faits marquants

- La plateforme est globalement rapide à chaud.
- Le plus gros payload mesuré est `/api/v1/spatial/project-hassan-addakhil` à `5.47 MB`.
- `solid-yield/availability` est le seul endpoint à classer `À SURVEILLER` à cause de sa variabilité.
- Les lenteurs les plus visibles apparaissent au démarrage backend pendant le warmup, pas dans l'usage courant chaud.
- Aucune optimisation n'a été appliquée, par prudence et parce qu'aucune API runtime critique n'a été confirmée.

## 3. Validation

### Checks

| Check | Résultat |
| --- | --- |
| Backend `npm run check` | WARNING — bloqué par `spawn EPERM` lors du lancement Vitest/esbuild |
| Frontend `npm run check` | WARNING — lint avec warnings puis même blocage `spawn EPERM` sur Vitest/esbuild |

### Baseline

| Invariant | Résultat |
| --- | --- |
| `383` timeseries | OK |
| `3 773 400` measurements | OK |
| `75` stations visibles | OK |
| `9` scénarios visibles | OK |
| `19` reaches runtime | OK |
| `19` subbasins runtime | OK |

## 4. Décision de phase

- Modification code/backend/frontend : `NON`
- Modification PostgreSQL : `NON`
- Modification credentials réels : `NON`
- Commit : `NON`
- Push : `NON`

## 5. Références

- Audit performance détaillé : `AUDIT_PERFORMANCE_API_DASHBOARDS_HASSAN_ADDAKHIL_20260826.md`
- Audit credentials détaillé : `AUDIT_ENV_CREDENTIALS_HASSAN_ADDAKHIL_20260826.md`
- Baseline avant : `BASELINE_PERFORMANCE_AVANT_OPTIMISATION_20260826_01.md`
- Baseline après validation : `BASELINE_PERFORMANCE_APRES_VALIDATION_20260826_02.md`

## 6. Verdict final

- Performance backend : `OK`
- Performance frontend : `OK`
- Credentials : `WARNING`
- Régression fonctionnelle : `NON`
- Phase performance : terminée sans modification applicative
