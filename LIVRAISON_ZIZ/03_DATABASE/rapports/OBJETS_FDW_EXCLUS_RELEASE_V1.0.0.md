# OBJETS FDW EXCLUS DE LA RELEASE v1.0.0

Date : 2026-08-28

Contexte : assainissement R3-FIX du dump de livraison `hydro_hd_v1.0.0.dump`.

Principe :

- aucun objet runtime necessaire n'a ete retire ;
- seuls les objets FDW legacy non utilises par l'application de production ont ete exclus ;
- aucune option sensible n'est reproduite ici.

| Objet | Type | Raison d'exclusion |
|---|---|---|
| `old_hd` | `SCHEMA` | Schema legacy compose uniquement de foreign tables non consommees au runtime. |
| `postgres_fdw` | `EXTENSION` | Extension uniquement utilisee par le serveur legacy exclu ; aucune autre preuve d'usage dans la release. |
| `COMMENT ON EXTENSION postgres_fdw` | `COMMENT` | Objet associe a une extension exclue du dump final. |
| `old_hd_srv` | `SERVER` | Serveur FDW legacy non requis par le runtime et porteur d'options sensibles a ne pas livrer. |
| `USER MAPPING postgres -> old_hd_srv` | `USER MAPPING` | Dependance legacy non portable, liee au role source `postgres`, avec mot de passe FDW detecte dans la source historique. |
| `old_hd.adm_communes_abhgzr` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; non consommee par le backend actif. |
| `old_hd.barrages_abhgzr` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; non consommee par le backend actif. |
| `old_hd.bassin_abhgzr` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; non consommee par le backend actif. |
| `old_hd.bathymetries_barrages_abhgzr` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; le backend utilise d'abord les relations locales `public.v_values_bathymetry`, `core.reservoir_bathymetry` et `public.reservoir_bathymetry`. |
| `old_hd.mesures_debits_jr` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; non consommee par le backend actif. |
| `old_hd.mesures_evaporation_m` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; non consommee par le backend actif. |
| `old_hd.mesures_humidite_relative_m` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; non consommee par le backend actif. |
| `old_hd.mesures_lachers_barrages` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; non consommee par le backend actif. |
| `old_hd.mesures_precipitations_jr` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; non consommee par le backend actif. |
| `old_hd.mesures_temperature_jr_pn` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; non consommee par le backend actif. |
| `old_hd.mesures_temperature_m` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; non consommee par le backend actif. |
| `old_hd.mesures_vitesse_vent_m` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; non consommee par le backend actif. |
| `old_hd.stations_abhgzr` | `FOREIGN TABLE` | Aucune dependance SQL applicative detectee ; les stations runtime proviennent des relations locales `core.stations`, `public.stations` et catalogues API associes. |
