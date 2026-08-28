# Rapport R2-S - Security Gate v1.0.0

Date : 2026-08-28
Projet : Hassan Addakhil
Release cible : Ziz v1.0.0
Perimetre : remediation securite backend runtime avant tagging release
Baseline Git : `ilh_dev_20-07` / `ef62eae98af1c9991ee2287b969cf53f2051db88`

## 1. Objectif

Corriger en priorite les vulnerabilites runtime backend avec un niveau de changement strictement compatible, sans toucher au frontend sauf en cas de faille runtime serieuse corrigeable en patch/minor, puis revalider :

- dependances backend ;
- audit npm backend ;
- validations TypeScript / tests / build ;
- image Docker backend ;
- integrite du stack principal deja en cours d'execution.

## 2. Dependances backend avant

Dependances directes ciblees avant correction :

| Package | Version avant | Exposition | Observation |
| --- | --- | --- | --- |
| `express` | `4.22.1` | runtime HTTP | dependance directe du serveur |
| `express-rate-limit` | `8.2.1` | runtime HTTP | utilise sur `/api` et `/api/auth/login` |
| `xlsx` | `0.18.5` | runtime partiel | utilise pour export Excel et scripts d'import |

Transitives observees avant correction :

| Package | Version avant | Chemin |
| --- | --- | --- |
| `ip-address` | `10.0.1` | `express-rate-limit -> ip-address` |
| `body-parser` | `1.20.4` | `express -> body-parser` |
| `qs` | `6.14.1` | `express -> qs`, `body-parser -> qs` |
| `path-to-regexp` | `0.1.12` | `express -> path-to-regexp` |

## 3. Corrections appliquees

Corrections retenues :

- mise a jour `express` de `^4.22.1` vers `^4.22.2` ;
- mise a jour `express-rate-limit` de `^8.2.1` vers `^8.6.2` ;
- ajout d'un override npm cible :
  - `express -> path-to-regexp = 0.1.13`

Fichiers backend impactes :

- `hydro_Hassan dakhil/backend/package.json`
- `hydro_Hassan dakhil/backend/package-lock.json`

Sauvegardes prealables realisees :

- `LIVRAISON_ZIZ/01_AUDIT/backups_corrections/R2_SECURITY/backend.package.json.before_R2_SECURITY`
- `LIVRAISON_ZIZ/01_AUDIT/backups_corrections/R2_SECURITY/backend.package-lock.json.before_R2_SECURITY`

## 4. Dependances backend apres

Dependances directes apres correction :

| Package | Version apres | Statut |
| --- | --- | --- |
| `express` | `4.22.2` | corrige |
| `express-rate-limit` | `8.6.2` | corrige |
| `xlsx` | `0.18.5` | non modifie |

Transitives apres correction :

| Package | Version apres | Statut |
| --- | --- | --- |
| `ip-address` | `10.5.0` | corrige |
| `body-parser` | `1.20.6` | corrige |
| `qs` | `6.15.3` | corrige |
| `path-to-regexp` | `0.1.13` | corrige via override |

## 5. npm audit backend avant / apres

Avant correction (`npm audit --omit=dev`) :

| Severite | Total |
| --- | --- |
| `moderate` | `3` |
| `high` | `4` |
| `critical` | `0` |
| `total` | `7` |

Vulnerabilites backend avant :

- `express-rate-limit` : `HIGH`
- `ip-address` : `HIGH`
- `path-to-regexp` : `HIGH`
- `xlsx` : `HIGH`
- `express` : `MODERATE`
- `body-parser` : `MODERATE`
- `qs` : `MODERATE`

Apres correction (`npm audit --omit=dev`) :

| Severite | Total |
| --- | --- |
| `moderate` | `0` |
| `high` | `1` |
| `critical` | `0` |
| `total` | `1` |

Vulnerabilite backend restante :

- `xlsx` : `HIGH`, `fixAvailable: false`

Conclusion backend :

- les points `express-rate-limit`, `ip-address`, `path-to-regexp`, `express`, `body-parser` et `qs` ne ressortent plus dans l'audit final ;
- le seul point restant est `xlsx`, sans correctif npm disponible.

## 6. Analyse xlsx

Constat de code :

- `src/controllers/siltation.controller.ts:90-102` expose un export Excel serveur vers client ;
- `src/services/siltation.service.ts:389-419` construit un classeur a partir de donnees serveur puis renvoie un `Buffer` ;
- `scripts/import_bathy_had.ts` et `scripts/import_hassan_addakhil_siltation.ts` utilisent `xlsx.readFile(...)` dans des scripts d'import operes hors parcours HTTP public.

Lecture du risque :

- aucun endpoint runtime observe dans ce passage n'accepte un fichier Excel utilisateur libre pour le parser a la volee ;
- l'usage runtime visible est un export genere par le serveur, pas un import utilisateur arbitraire ;
- les usages de lecture `xlsx.readFile(...)` releves sont des scripts operes, pas un flux web public standard ;
- le risque n'est donc pas nul, mais il est plus limite que les failles runtime HTTP corrigees dans cette etape.

Decision R2-S sur `xlsx` :

- ne pas modifier `xlsx` dans cette etape ;
- conserver une acceptation de risque documentee pour v1.0.0 ;
- planifier une analyse/fix dedie(e) sur la chaine d'import/export Excel a l'etape suivante.

## 7. npm audit frontend

Resultat du frontend (`npm audit --omit=dev`) :

| Severite | Total |
| --- | --- |
| `moderate` | `3` |
| `high` | `4` |
| `critical` | `0` |
| `total` | `7` |

Points observes :

- `react-router-dom` / `react-router` / `@remix-run/router` : `MODERATE`
- `postcss`, `nanoid`, `picomatch` : `HIGH`, principalement chaine de build
- `lodash` via `recharts` : `HIGH`

Analyse frontend :

- aucune correction frontend n'a ete appliquee dans R2-S ;
- le risque runtime le plus visible est `react-router-dom`, mais l'usage du projet reste majoritairement sur des chemins internes fixes ;
- `src/api/http.ts:48-58` reconstruit les URLs via `new URL(...)` ;
- `src/components/auth/ProtectedRoute.tsx:17-18` redirige vers un chemin interne fixe `"/login"` ;
- les points `postcss` / `nanoid` / `picomatch` concernent surtout la chaine de build et non le conteneur Nginx final deja produit.

Conclusion frontend :

- pas de changement justifie dans cette etape R2-S ;
- a reprendre dans une passe dediee si un gate de securite frontend doit etre impose avant release finale.

## 8. Tests backend

Validations executees apres la correction finale :

- `npm ci --no-audit --no-fund` : `OK`
- `npm run type-check` : `OK`
- `npm run test:run` : `31/31` tests `OK`
- `npm run build` : `OK`

Observations non bloquantes :

- warnings de depreciation npm sur certaines dependances de build/tests ;
- warning local `JWT_SECRET appears weak or placeholder-like` lors des tests ;
- les reponses `401 Non autorise` vues dans les tests sont attendues par les cas de test.

## 9. Tests frontend

Aucun test frontend supplementaire n'a ete execute dans R2-S.

Reference de cette etape :

- audit frontend relance en lecture seule ;
- aucun changement frontend applique.

## 10. Build Docker backend

Commande executee :

- `docker compose build --no-cache backend`

Resultat :

- build `OK`
- image produite : `app_hassan_addakhil-backend:latest`
- digest local : `app_hassan_addakhil-backend@sha256:9ea5c21722387607a9279a68e52274acc863dded44d5136d5acea9cb6f87cbf6`
- date de creation : `2026-08-28T09:26:16.866505334Z`
- taille : `61639227` octets

Observation importante :

- l'etape runtime `npm ci --omit=dev` du Dockerfile signale encore `1 high severity vulnerability`, coherente avec le seul point `xlsx` restant.

## 11. Smoke test

Passage 1 :

- tentative avec `--env-file backend/.env` : `ECHEC`
- cause observee dans les logs : variable requise absente parmi `DB_USER` / `POSTGRES_USER`

Passage 2 :

- conteneur temporaire lance avec variables non sensibles et placeholders techniques :
  - `NODE_ENV=test`
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `JWT_SECRET` placeholder
  - `ENABLE_STARTUP_WARMUPS=false`
  - `ENABLE_STATION_MAPPING_INIT=false`
- appel `GET /api/v1/hydro/test/health` : `OK`

Limite connue :

- `src/controllers/hydroController.ts:407-417` retourne un etat de liveness simplifie et non une preuve fiable de connectivite DB reelle ;
- le smoke test valide donc le demarrage de l'image et la disponibilite HTTP, pas une campagne d'integration complete avec PostgreSQL.

## 12. Containers principaux avant / apres

Etat avant correction :

| Service | Container ID | Image | Etat |
| --- | --- | --- | --- |
| `backend` | `db56353b99da1204288a20d2db6cf69b66b6a1050249794a5942d8d2c561506a` | `sha256:be6c846ede27a6d4f73877f7433461a6b86e803a001ff49d4cc923a4c90ed000` | `healthy` |
| `db` | `1deca1cd7fbc353099dba03e341b77df9eaff1824696d6928f1502ea9b51f3a4` | `postgis/postgis:17-3.5` | `healthy` |
| `frontend` | `3434b071d1d1d1dbff352737503c1484f990a4e0bdd7f82afac07ee040e2e2eb` | `sha256:de609b07b2f46b72dc0a88649c92aa4bfc593b1dcffe208bc3e903ea8818c6f1` | `healthy` |

Etat apres R2-S :

| Service | Container ID | Image | Etat |
| --- | --- | --- | --- |
| `backend` | `db56353b99da1204288a20d2db6cf69b66b6a1050249794a5942d8d2c561506a` | `sha256:be6c846ede27a6d4f73877f7433461a6b86e803a001ff49d4cc923a4c90ed000` | `healthy` |
| `db` | `1deca1cd7fbc353099dba03e341b77df9eaff1824696d6928f1502ea9b51f3a4` | `postgis/postgis:17-3.5` | `healthy` |
| `frontend` | `3434b071d1d1d1dbff352737503c1484f990a4e0bdd7f82afac07ee040e2e2eb` | `sha256:de609b07b2f46b72dc0a88649c92aa4bfc593b1dcffe208bc3e903ea8818c6f1` | `healthy` |

Conclusion :

- aucun restart du stack principal ;
- aucun changement d'ID container ;
- l'image backend rebuild reste disponible localement sans etre deployee sur les conteneurs de travail en cours.

## 13. Risques residuels

- `xlsx` reste signale `HIGH` sans correctif npm disponible ;
- le smoke test backend ne couvre pas un parcours complet avec base de donnees reelle ;
- les alertes frontend n'ont pas ete traitees dans cette etape, seulement relues et analysees ;
- le depot Git contient deja de nombreuses modifications historiques sans lien direct avec R2-S : il faudra continuer a distinguer les travaux Ziz des ecarts preexistants.

## 14. Security Gate R2

Verdict retenu :

- `PASS AVEC RISQUE DOCUMENTE`

Justification :

- toutes les vulnerabilites backend runtime priorisees et corrigeables en patch/minor ont ete supprimees de l'audit final ;
- l'unique alerte restante est `xlsx`, sans fix npm disponible et avec une exposition estimee plus limitee dans le code observe ;
- les validations TypeScript, tests, build backend et rebuild Docker sont `OK` ;
- le stack principal n'a pas ete perturbe.

## 15. Verdict R2-S

R2-S est valide avec reserve documentaire sur `xlsx`.

La release technique peut continuer sans tagging de commit automatique dans cette etape, en conservant :

- l'acceptation de risque `xlsx` dans le dossier de livraison ;
- une future passe dediee pour la securite frontend et la filiere Excel ;
- le principe de ne pas attribuer aux travaux Ziz les ecarts Git preexistants.
