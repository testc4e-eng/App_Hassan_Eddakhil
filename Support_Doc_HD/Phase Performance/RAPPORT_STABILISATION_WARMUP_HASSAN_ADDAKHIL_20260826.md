# RAPPORT STABILISATION WARMUP - HASSAN ADDAKHIL

- Date : 2026-08-26
- Base officielle : `hydro_hd`

## 1. Objectif

Rendre le warmup backend non bloquant et observable, sans changer la logique metier ni les resultats exposes.

## 2. Optimisations appliquees

- warmup lance apres `server.listen`
- warmup rendu non bloquant
- timeouts controles par environnement
- logs de synthese de warmup ajoutes
- initialisation station mapping isolee du warmup principal
- warmup `solid-yield` appele directement via service plutot qu'en HTTP interne
- flags d'activation ajoutes :
  - `ENABLE_STARTUP_WARMUPS`
  - `ENABLE_STATION_MAPPING_INIT`
  - `STARTUP_WARMUP_DELAY_MS`
  - `STARTUP_WARMUP_TIMEOUT_MS`
  - `SLOW_QUERY_LOG_MS`

## 3. Mesures observees

### Backend actif sur `5007`

- `solid-yield/availability` appel 1 : `9064.53 ms`
- appels 2 a 5 : `11.33 / 10.31 / 19.32 / 7.43 ms`

Conclusion :
- profil confirme `COLD START / CACHE`

### Instance compilee de validation

Instance de test lancee a part, puis arretee apres validation.

- `solid-yield/availability` appel 1 : `7115.01 ms`
- appels 2 a 5 : `13.36 / 7.36 / 16.75 / 6.32 ms`
- warmup asynchrone termine en : `12458 ms`
- tache la plus couteuse : `solid-yield.availability` a `8773 ms`

### Gain observe

- premier appel froid : `9064.53 ms -> 7115.01 ms`
- gain approximatif : `1949.52 ms`

Note :
- mesure indicative car comparee entre backend actif et instance compilee de validation ;
- le point principal valide est l'absence de blocage du `listen`.

## 4. Temps de demarrage

TEMPS DEMARRAGE AVANT :
- warmup percu comme source principale des lenteurs a froid ;
- mesure historique precise non disponible dans cette phase.

TEMPS DEMARRAGE APRES :
- demarrage rendu non bloquant ;
- le serveur ecoute avant la fin du warmup ;
- warmup post-listen observe : `12458 ms`

## 5. Taches warmup observees

- `catalog.erosion.availability` : `2491 ms`
- `solid-yield.availability` : `8773 ms`
- `hydro.swat.availability` : `1425 ms`
- `hydro.swat.summary` : `1401 ms`
- `data-scan.periods.global` : `12419 ms`

## 6. Regressions

REGRESSION :
- `NON`

## 7. Verdict

- Warmup : `OK`
- Non bloquant : `OUI`
- Cold start : `WARNING` normal, lie au cache
- Warm path : `OK`
