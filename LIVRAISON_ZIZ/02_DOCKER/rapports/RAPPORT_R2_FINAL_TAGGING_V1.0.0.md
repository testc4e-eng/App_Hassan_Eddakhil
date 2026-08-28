# Rapport R2-FINAL - Tagging Docker v1.0.0

Date : 2026-08-28
Projet : Hassan Addakhil
Release cible : Ziz v1.0.0
Baseline Git : `ilh_dev_20-07` / `ef62eae98af1c9991ee2287b969cf53f2051db88`

## 1. Security Gate backend

Verdict :

- `PASS AVEC RISQUE XLSX DOCUMENTE`

Resultat du backend apres validations finales :

- `npm ci` : `OK`
- `npm run type-check` : `OK`
- `npm run test:run` : `31/31 OK`
- `npm run build` : `OK`
- `npm audit --omit=dev` : `1 HIGH` restant sur `xlsx`

Les vulnerabilites HTTP backend corrigeables precedemment bloquantes ne sont pas revenues :

- `express-rate-limit` : corrige
- `ip-address` : corrige
- `path-to-regexp` : corrige
- `express` : corrige
- `body-parser` : corrige
- `qs` : corrige

## 2. Risque xlsx accepte

Document de reference :

- `LIVRAISON_ZIZ/08_SECURITE/ACCEPTATION_RISQUE_XLSX_V1.0.0.md`

Synthese :

- package : `xlsx`
- version : `0.18.5`
- severite : `HIGH`
- `fixAvailable` : `false`
- usage observe : export serveur et scripts techniques
- aucune lecture publique directe d'un fichier Excel non fiable identifiee dans le flux HTTP principal

Verdict documentaire :

- `RISQUE ACCEPTE POUR v1.0.0 AVEC SUIVI OBLIGATOIRE`

## 3. Security Gate frontend

Verdict :

- `PASS AVEC RISQUES DOCUMENTES`

Resultat `npm audit --omit=dev` :

| Package | Severite | Runtime/Build | Usage reel | Fix disponible | Bloquant v1.0.0 |
| --- | --- | --- | --- | --- | --- |
| `react-router-dom` | `MODERATE` | `Runtime navigateur` | redirections observees vers chemins internes fixes comme `/login`, `/home`, `/dashboard` | `Oui` | `Non` |
| `react-router` | `MODERATE` | `Runtime navigateur` | meme surface que `react-router-dom` | `Oui` | `Non` |
| `@remix-run/router` | `MODERATE` | `Runtime navigateur` | transitive de `react-router-dom` | `Oui` | `Non` |
| `postcss` | `HIGH` | `Build` | utilise pendant la construction Vite/Tailwind, pas dans l'image Nginx finale | `Oui` | `Non` |
| `nanoid` | `HIGH` | `Build` | transitive de `postcss`, pas de surface navigateur directe identifiee | `Oui` | `Non` |
| `picomatch` | `HIGH` | `Build` | transitive de `tailwindcss` / `micromatch` / `chokidar`, pas de surface runtime navigateur finale | `Oui` | `Non` |
| `lodash` via `recharts` | `HIGH` | `Runtime bundle potentiel` | composants projet releves : `BarChart`, `LineChart`, `PieChart`, `ComposedChart`, `ResponsiveContainer`; aucune preuve d'usage de `_.template`, et l'usage `omit` releve dans `recharts` ne correspond pas aux composants utilises | `Oui` | `Non, selon l'analyse d'exposition actuelle` |

Justification :

- aucune vulnerabilite `HIGH` n'a ete qualifiee comme exploitable au runtime navigateur dans l'usage reel observe avec un besoin immediat de correction avant release ;
- les points `postcss`, `nanoid`, `picomatch` restent classes build-only ;
- `lodash` reste a suivre, mais aucun chemin d'exploitation concret n'a ete etabli dans notre usage actuel ;
- les mises a jour compatibles proposees par npm sont documentees, sans etre rendues obligatoires pour lever le gate de `v1.0.0`.

## 4. Tests backend

- `npm ci --no-audit --no-fund` : `OK`
- `npm run type-check` : `OK`
- `npm run test:run` : `31/31 OK`
- `npm run build` : `OK`

Observations non bloquantes :

- warnings npm de dependances de tests/build ;
- warning local sur `JWT_SECRET` placeholder en contexte de test ;
- reponses `401` attendues dans certains tests HTTP.

## 5. Tests frontend

- `npm ci --no-audit --no-fund` : `OK`
- `npm run type-check` : `OK`
- `npm run test:run` : `16/16 OK`
- `npm run build` : `OK`

Warnings documentes :

- warning `React Router Future Flag` pendant les tests ;
- warning `Browserslist / caniuse-lite` ancien au build ;
- chunks > `500 kB` apres minification.

## 6. Builds

Validation compose source :

- `docker compose config -q` : `OK`
- `docker compose config --services` : `db`, `backend`, `frontend`

Builds applicatifs finaux :

- `docker compose build --no-cache backend` : `OK`
- `docker compose build --no-cache frontend` : `OK`

Observation :

- la sortie Docker du build frontend annonce aussi `Image app_hassan_addakhil-backend Building` en tete, mais l'image backend finale conserve son horodatage et son digest propres du build precedent de cette etape.

## 7. Tags

Tags officiels :

- `hassan-addakhil-backend:1.0.0`
- `hassan-addakhil-frontend:1.0.0`

Tags de tracabilite :

- `hassan-addakhil-backend:1.0.0-20260828`
- `hassan-addakhil-frontend:1.0.0-20260828`

Les tags `latest` sources ont ete conserves.

## 8. Image IDs

- backend final : `sha256:57b8003501fe797d3420112206c620fedf31ea7bab85173c8751b2efe87fb63d`
- frontend final : `sha256:134dc3d6b72b00d0404f4271fb46d6149d1059063b795a11bed84c398f2df9b1`
- PostGIS : `sha256:71f7e60358fb03d3f157b9ea34516e8152394752ec7a01b3f9eb293d3aead29e`

## 9. Tailles

- backend final : `61639104` octets (`58.78 MiB`)
- frontend final : `201423306` octets (`192.09 MiB`)
- PostGIS : `218437565` octets (`208.32 MiB`)

## 10. Architecture

- backend : `linux/amd64`
- frontend : `linux/amd64`
- PostGIS : `linux/amd64`

## 11. Image PostgreSQL / PostGIS

Image retenue sans changement en R2-FINAL :

- `postgis/postgis:17-3.5`
- digest : `sha256:71f7e60358fb03d3f157b9ea34516e8152394752ec7a01b3f9eb293d3aead29e`
- PostgreSQL reel : `17.5`
- PostGIS reel : `3.5.2`

Reserve maintenue :

- source `hydro_hd` : PostgreSQL `17.8` / PostGIS `3.5.3`
- image locale testee : PostgreSQL `17.5` / PostGIS `3.5.2`
- restauration du dump R1 deja validee sur cette image ; compatibilite a revalider en R3.

## 12. docker-compose.ziz.yml

Verification :

- `image: hassan-addakhil-backend:1.0.0`
- `image: hassan-addakhil-frontend:1.0.0`
- `image: postgis/postgis:17-3.5`
- aucune section `build:` pour backend/frontend

Validation avec placeholders non sensibles :

- `docker compose -f LIVRAISON_ZIZ/02_DOCKER/compose/docker-compose.ziz.yml config -q` : `OK`
- services resolves : `db`, `backend`, `frontend`
- images resolvees :
  - `postgis/postgis:17-3.5`
  - `hassan-addakhil-backend:1.0.0`
  - `hassan-addakhil-frontend:1.0.0`

## 13. Containers principaux avant / apres

Avant builds/tagging :

| Service | Container ID | Image | Etat |
| --- | --- | --- | --- |
| `backend` | `db56353b99da1204288a20d2db6cf69b66b6a1050249794a5942d8d2c561506a` | `sha256:be6c846ede27a6d4f73877f7433461a6b86e803a001ff49d4cc923a4c90ed000` | `healthy` |
| `db` | `1deca1cd7fbc353099dba03e341b77df9eaff1824696d6928f1502ea9b51f3a4` | `postgis/postgis:17-3.5` | `healthy` |
| `frontend` | `3434b071d1d1d1dbff352737503c1484f990a4e0bdd7f82afac07ee040e2e2eb` | `sha256:de609b07b2f46b72dc0a88649c92aa4bfc593b1dcffe208bc3e903ea8818c6f1` | `healthy` |

Apres builds/tagging :

| Service | Container ID | Image | Etat |
| --- | --- | --- | --- |
| `backend` | `db56353b99da1204288a20d2db6cf69b66b6a1050249794a5942d8d2c561506a` | `sha256:be6c846ede27a6d4f73877f7433461a6b86e803a001ff49d4cc923a4c90ed000` | `healthy` |
| `db` | `1deca1cd7fbc353099dba03e341b77df9eaff1824696d6928f1502ea9b51f3a4` | `postgis/postgis:17-3.5` | `healthy` |
| `frontend` | `3434b071d1d1d1dbff352737503c1484f990a4e0bdd7f82afac07ee040e2e2eb` | `sha256:de609b07b2f46b72dc0a88649c92aa4bfc593b1dcffe208bc3e903ea8818c6f1` | `healthy` |

Conclusion :

- aucun container principal n'a ete recree ;
- aucun arret ;
- aucun redemarrage ;
- aucun redeploiement du stack principal.

## 14. Risques residuels

- `xlsx` reste `HIGH` cote backend sans correctif npm disponible ;
- `react-router-dom` et transitives restent `MODERATE` cote frontend, avec exposition jugee non bloquante dans l'usage observe ;
- `lodash` via `recharts` reste un point de vigilance documentaire ;
- warnings de chunk frontend > `500 kB` ;
- reserve de compatibilite PostgreSQL/PostGIS a revalider en R3.

## 15. Verdict final

Verdict global :

- backend : `PASS AVEC RISQUE XLSX DOCUMENTE`
- frontend : `PASS AVEC RISQUES DOCUMENTES`
- global : `PASS AVEC RISQUES DOCUMENTES`

R2-FINAL est valide.

Les images Docker Ziz `v1.0.0` sont pretes pour la phase suivante de test d'installation isolee.
