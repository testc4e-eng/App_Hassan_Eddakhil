# Synthèse de Comparaison des Bases

Date du diagnostic: 20 avril 2026  
Source: `bdd_erosion_abhgzr_20-04-26`  
Cible: `hydro_hd`

## 1) Vue globale 

| Indicateur  |  Source  | Cible  |
|------------ | -------: |------: |
| Taille base |  37 MB   | 246 MB |
| Tables métier principales (analysées) | 13 + `spatial_ref_sys` | Modèle multi-schémas |
| Lignes mesures brutes (tables `mesures_*`) | 257,221 | 349,710 (`core.measurements`) |
| Vues agrégées annuelles | N/A | 1,675 (`public.v_values_annual`) |
| Vues agrégées mensuelles | N/A | 18,985 (`public.v_values_monthly`) |

## 2) Comparaison des entités principales

| Domaine  | Table source | Nb source | Table cible | Nb cible | Statut |
|----------|--------------|----------:|-------------|---------:|--------|
| Communes | `public.adm_communes_abhgzr` | 86 | `ref.communes` | 86 | OK |
| Bassin | `public.bassin_abhgzr` | 1 | `core.catchments` | 1 | OK |
| Barrages | `public.barrages_abhgzr` | 12 | `core.reservoirs` | 12 | OK |
| Stations | `public.stations_abhgzr` | 35 | `core.stations` | 36 | OK (+1 station virtuelle réservoir) |
| Bathymétrie | `public.bathymetries_barrages_abhgzr` | 4,401 | `core.reservoir_bathymetry` | 4,401 | OK |

## 3) Comparaison mesures (brut source vs cible normalisée)

### Source (brut, par table)

| Table source                  | Lignes  |
|-----------------------------  |--------:|
| `mesures_precipitations_jr`   | 109,607 |
| `mesures_debits_jr`           | 78,529  |
| `mesures_temperature_jr_pn`   | 43,464  |
| `mesures_lachers_barrages`    | 19,861  |
| `mesures_temperature_m`       | 2,028   |
| `mesures_evaporation_m`       | 2,256   |
| `mesures_humidite_relative_m` | 1,020   |
| `mesures_vitesse_vent_m`      | 456     |
| **Total brut source**         | **257,221** |

### Cible (normalisé, par variable)

| Variable (`standard_name`) | Lignes cible |
|----------------------------|-------------:|
| `PRECIPITATION`            | 107,627      |
| `STREAMFLOW`               | 77,950       |
| `TMAX`                     | 45,235       |
| `TMIN`                     | 45,138       |
| `TMEAN`                    | 44,444       |
| `INFLOW_M3`                | 19,861       |
| `RESTITUTION_M3`           | 6,132        |
| `EVAPORATION`              | 2,031        |
| `HUMIDITY_REL`             | 928          |
| `WIND_SPEED`               | 364          |
| **Total `core.measurements`** | **349,710** |

## 4) Lecture du delta de volume

Pourquoi `349,710` (cible) > `257,221` (source brut) :

- la température est éclatée en 3 variables (`TMAX`, `TMIN`, `TMEAN`) dans le modèle cible;
- les mesures réservoir sont normalisées en séries distinctes;
- certaines lignes textuelles/non numériques/nulles sont filtrées au chargement.

## 5) Conclusion

La collecte de `bdd_erosion_abhgzr_20-04-26` vers `hydro_hd` est globalement cohérente sur les entités clés (communes, bassin, barrages, stations, bathymétrie) et les vues principales sont alimentées via `core.measurements`.

Points de vigilance restants:

- les comparaisons "1 ligne source = 1 ligne cible" ne sont pas directes pour les tables multi-variables;
- continuer les contrôles qualité métier (unités, bornes, doublons temporels) sur les variables climat/hydrologie.
