# Analyse des données d'envasement - HASSAN ADDAKHIL

## Source auditée

- Fichier: `INDICATEURS POUR APPLICATION.xlsx`
- Chemin: `D:/3- Projets/hassanAddakhil/INDICATEURS POUR APPLICATION.xlsx`
- Feuilles détectées: `L`, `M`, `S`, `BC`, `OER`, `T`, `SM`, `DON`, `ZGR`, `N`, `INDICATEURS`

## Feuilles utilisées

### 1) Feuille `N` (historique annuel consolidé)

- Colonne `A`: année
- Ligne `2`: noms de barrages (inclut `HASSAN ADDAKHIL`)
- Colonne du barrage `HASSAN ADDAKHIL`: valeurs annuelles d'envasement (Mm3/an)
- Lignes utiles: `5` à `61` (selon fichier)

Usage métier:

- Alimente la courbe `Evolution annuelle`
- Sert de base pour `cumulative_silted_mhm3`

### 2) Feuille `INDICATEURS` (KPI de synthèse)

- Ligne utilisée pour cette phase: `L14` (ABHZGR, utilisée comme ligne de référence d'import)
- Colonnes utiles:
  - `B`: année de référence (`baseline_year`)
  - `C`: Vi (`volume_initial_mhm3`)
  - `E`: année actuelle (`current_year`)
  - `F`: Vf (`volume_current_mhm3`)
  - `H`: Ve (`volume_silted_mhm3`) si présent
  - `J`: `% perte`
  - `M`: TEA
  - `N`: TER
  - `Q`: piégeage (%)
  - `R`: surface bassin (km2)
  - `S`: érosion spécifique

### 3) Feuille `ZGR` (ABHZGR local)

- Vérifiée pour HASSAN ADDAKHIL (colonne `C`), utile pour contrôle croisé des séries annuelles.

## Valeurs trouvées (import phase initiale)

Les valeurs importées en KPI proviennent de `INDICATEURS!L14`:

- Vi: `187.5` Mm3
- Vf: `188.732007` Mm3
- Ve: valeur directe absente, recalculée à `max(Vi - Vf, 0)` si nécessaire
- % perte: absent ou nul selon ligne source
- TEA / TER: pris depuis colonnes `M/N` si disponibles
- Durée: `current_year - baseline_year`

Les valeurs d'évolution annuelle proviennent de la colonne `HASSAN ADDAKHIL` de la feuille `N`.

## Données HSV

Constat d'audit:

- Le fichier `INDICATEURS POUR APPLICATION.xlsx` ne contient pas de table bathymétrique HSV détaillée (campagne, cote, surface, volume) directement exploitable pour HASSAN ADDAKHIL.
- Pour fournir le module HSV opérationnel, les points HSV sont initialement chargés depuis `core.reservoir_bathymetry` (campagne technique 2022), puis stockés dans `hydro.siltation_hsv`.

## Structure métier retenue

- `siltation_indicators`: KPI barrage (1 ligne par barrage et source)
- `siltation_evolution`: série annuelle (année, annuel, cumulé)
- `siltation_hsv`: courbes cote/surface/volume par campagne

## Mapping Excel -> Base de données

### Excel `INDICATEURS` -> `hydro.siltation_indicators`

- `B` -> `baseline_year`
- `C` -> `volume_initial_mhm3`
- `E` -> `current_year`
- `F` -> `volume_current_mhm3`
- `H` -> `volume_silted_mhm3`
- `J` -> `loss_percent`
- `M` -> `tea_mhm3_per_year`
- `N` -> `ter_percent_per_year`
- `Q` -> `trapping_efficiency_percent`
- `R` -> `basin_area_km2`
- `S` -> `specific_erosion_m3_km2_year`

### Excel `N` -> `hydro.siltation_evolution`

- `A` -> `year`
- `col(HASSAN ADDAKHIL)` -> `annual_silted_mhm3`
- cumul calculé -> `cumulative_silted_mhm3`

### Bathymétrie existante -> `hydro.siltation_hsv`

- `level_m` -> `level_m`
- `area_km2` -> `surface_km2`
- `volume_hm3` -> `volume_mhm3`
- campagne par défaut -> `campaign_year = 2022`

## Mapping Base -> API -> Frontend

- `hydro.siltation_indicators` -> `GET /api/v1/siltation/indicators` -> KPI cards
- `hydro.siltation_evolution` -> `GET /api/v1/siltation/evolution` -> courbe évolution
- `hydro.siltation_hsv` -> `GET /api/v1/siltation/hsv` -> courbes HSV + tableau bathymétrique
- agrégat -> `GET /api/v1/siltation/summary` -> en-tête du module
- export -> `/api/v1/siltation/export/excel` et `/api/v1/siltation/export/pdf`

