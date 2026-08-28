# INVENTAIRE DES IMAGES DOCKER

Date : 2026-08-28

| Image | Tag | Image ID | Taille | Architecture | Security Gate | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| `hassan-addakhil-backend` | `1.0.0` | `sha256:57b8003501fe797d3420112206c620fedf31ea7bab85173c8751b2efe87fb63d` | `61639104` octets (`58.78 MiB`) | `linux/amd64` | `PASS AVEC RISQUE XLSX DOCUMENTE` | `VALIDE R2-FINAL` |
| `hassan-addakhil-frontend` | `1.0.0` | `sha256:134dc3d6b72b00d0404f4271fb46d6149d1059063b795a11bed84c398f2df9b1` | `201423306` octets (`192.09 MiB`) | `linux/amd64` | `PASS AVEC RISQUES DOCUMENTES` | `VALIDE R2-FINAL` |
| `postgis/postgis` | `17-3.5` | `sha256:71f7e60358fb03d3f157b9ea34516e8152394752ec7a01b3f9eb293d3aead29e` | `218437565` octets (`208.32 MiB`) | `linux/amd64` | `RESERVE DE COMPATIBILITE DOCUMENTEE` | `VALIDE POUR TEST R3` |

## Tags de tracabilite

- `hassan-addakhil-backend:1.0.0-20260828`
- `hassan-addakhil-frontend:1.0.0-20260828`

## Notes

- les tags officiels `:1.0.0` et les tags dates pointent vers les builds finals du `2026-08-28`
- les tags `latest` sources ont ete conserves
- la base source `hydro_hd` reste en PostgreSQL `17.8` / PostGIS `3.5.3`
- l'image locale de test conservee en R2-FINAL reste `postgis/postgis:17-3.5`, soit PostgreSQL `17.5` / PostGIS `3.5.2`
