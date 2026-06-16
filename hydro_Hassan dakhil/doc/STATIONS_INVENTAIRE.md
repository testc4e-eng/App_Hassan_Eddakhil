# Inventaire des stations de la base Hydro HD

## 1. Vue d ensemble
La base contient actuellement:
- `102` stations dans `public.stations`
- `5` stations dans `gis.meteo_stations`
- soit `107` entites station/point utilisees par le projet

Toutes ces entites sont rattachees au bassin principal:
- `catchment_id = 1`
- `catchment_name = Ziz-Guir-Gheris`

## 2. Champs disponibles

### Table `public.stations`
Champs principaux utilises par le projet:
- `station_id`
- `station_code`
- `name`
- `type_station`
- `station_type_code`
- `commune_code`
- `geom`
- `altitude_m`
- `start_date`
- `end_date`
- `catchment_id`
- `reach_id`

### Table `gis.meteo_stations`
Champs principaux:
- `station_id`
- `station_code`
- `name`
- `type_station`
- `station_type_code`
- `catchment_id`
- `source_attrs`
- `geom`
- `created_at`

## 3. Stations hydrologiques reelles

| ID | Code station | Nom | Type | Code type | Altitude (m) |
|---|---|---|---|---|---|
| 2 | `1508/38` | FOUM TILLICHT | hydrologique | HYDROLOGIQUE | 1400 |
| 3 | `31/38` | Zaouiet Sidi Hamza | hydrologique | HYDROLOGIQUE | 1645 |
| 24 | `1585/38` | MZIZEL | hydrologique | HYDROLOGIQUE | 1441 |
| 29 | `867/48` | FOUM ZAABEL | hydrologique | HYDROLOGIQUE | 1210 |
| 35 | `1940/48` | AVAL BARAGE HASSAN ADDAKHEL | hydrologique | HYDROLOGIQUE | 1045 |

## 4. Stations de reference et stations "legacy"
Ces stations sont presentes dans `public.stations` avec un `station_type_code = UNKNOWN`.

| ID | Code station | Nom |
|---|---|---|
| 1 | `hammat_my_ali_cherif` | Hammat My Ali Cherif |
| 4 | `bouanane` | Bouanane |
| 5 | `tazouguert` | Tazouguert |
| 6 | `bge_kaddoussa` | Bge Kaddoussa |
| 7 | `pont_jorf` | Pont Jorf |
| 8 | `amouguer_taghia` | Amouguer Taghia |
| 9 | `assoul` | Assoul |
| 10 | `aghbalou_n_kerdous` | Aghbalou N'Kerdous |
| 11 | `bge_timkit` | Bge Timkit |
| 12 | `taouz` | Taouz |
| 13 | `centre_merzouga` | Centre Merzouga |
| 14 | `ait_boujane` | Ait Boujane |
| 15 | `tamettoucht` | Tamettoucht |
| 16 | `amont_n_kob` | Amont N'Kob |
| 17 | `pont_arfoud` | Pont Arfoud |
| 18 | `errachidia_se` | Errachidia (SE) |
| 19 | `centre_sidi_ayad` | Centre Sidi Ayad |
| 20 | `imider` | Imider |
| 21 | `mellaha` | Mellaha |
| 22 | `tazarine` | Tazarine |
| 23 | `tit_n_aissa` | Tit N'Aissa |
| 25 | `outerbat` | Outerbat |
| 26 | `ferkla` | Ferkla |
| 27 | `aoufous` | Aoufous |
| 28 | `tadighoust` | Tadighoust |
| 30 | `oued_lahmer` | Oued Lahmer |
| 31 | `adachar` | Adachar |
| 32 | `amin_ntaghit` | Amin Ntaghit |
| 33 | `nzala` | Nzala |
| 34 | `meroutcha` | Meroutcha |

## 5. Station virtuelle reservoir

| ID | Code station | Nom | Type | Code type |
|---|---|---|---|---|
| 39 | `RES_1940/48` | Reservoir 1940/48 | reservoir_virtual | RESERVOIR |

## 6. Stations SWAT
Ces stations servent a la couche modele/simulation.

### Reaches SWAT
Il y a `33` stations de type `SWAT_REACH`:
- `swat_rch_1` a `swat_rch_33`
- noms affiches: `SWAT reach 1` a `SWAT reach 33`

### Subbasins SWAT
Il y a `33` stations de type `SWAT_SUBBASIN`:
- `swat_sub_1` a `swat_sub_33`
- noms affiches: `SWAT subbasin 1` a `SWAT subbasin 33`

## 7. Stations meteorologiques
Ces stations sont stockees dans `gis.meteo_stations`.

| ID | Code station | Nom | Type |
|---|---|---|---|
| 1 | `METEO_001` | Bge Hassan Addakhil | meteo |
| 2 | `METEO_002` | Foum Zaabel | meteo |
| 3 | `METEO_003` | Zaouiet Sidi Hamza | meteo |
| 4 | `METEO_004` | Mzizel | meteo |
| 5 | `METEO_005` | Foum Tillicht | meteo |

## 8. Lecture fonctionnelle
Dans le projet, les stations servent a:
- relier les mesures a une entite physique
- filtrer les series temporelles par station
- afficher les points sur la carte
- faire le pont entre donnees observees et donnees simulees
- identifier les stations avec ou sans donnees dans le scan

## 9. Remarques utiles
- Les stations hydrologiques ont parfois une altitude renseignee.
- Les dates `start_date` et `end_date` sont souvent nulles dans la table station.
- Les stations SWAT sont surtout utilitaires pour le module modele/simulation.
- Le bassin principal actuellement visible dans les donnees est `Ziz-Guir-Gheris`.

## 10. Pour aller plus loin
Si besoin, ce fichier peut etre complete par:
- une colonne de disponibilite des donnees
- le nombre de series associees par station
- le nombre de points par station
- un export CSV ou XLSX genere depuis la base

