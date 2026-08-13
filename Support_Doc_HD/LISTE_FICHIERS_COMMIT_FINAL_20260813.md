# LISTE FICHIERS COMMIT FINAL — 2026-08-13

Inventaire Git (aucune mise en staging) :

- `git status --short` : **213** lignes
- `git diff --name-status` : **193** fichiers suivis
- `git ls-files --others --exclude-standard` : **206** fichiers
- `git diff --stat` : **+8922 / −52033**

Un commit unique de tout l’arbre serait un **commit massif**.  
Cette liste propose un **commit ciblé sécurité + qualité + rapports finaux**.

---

## À COMMITTER

### Sécurité (priorité)

- `hydro_Hassan dakhil/backend/src/routes/adminDbConfig.routes.ts` — JWT + rôle ADMIN sur db-config
- `hydro_Hassan dakhil/backend/src/middleware/errorHandler.ts` — plus de stack HTTP
- `hydro_Hassan dakhil/backend/src/app.ts` — CORS 8090/8089 + app existante
- `hydro_Hassan dakhil/frontend/src/api/adminDbConfig.ts` — envoi Bearer
- `hydro_Hassan dakhil/backend/tests/http/app.test.ts` — 401 db-config / auth
- `hydro_Hassan dakhil/backend/tests/middleware/errorHandler.test.ts` — envelope sans stack

### Qualité / tests (nécessaires à `npm run check`)

- `hydro_Hassan dakhil/backend/vitest.config.ts`
- `hydro_Hassan dakhil/backend/eslint.config.js`
- `hydro_Hassan dakhil/backend/scripts/check-utf8.mjs`
- `hydro_Hassan dakhil/backend/package.json`
- `hydro_Hassan dakhil/backend/tests/setup.ts`
- `hydro_Hassan dakhil/backend/tests/config/env.test.ts`
- `hydro_Hassan dakhil/backend/tests/constants/swatDataSources.test.ts`
- `hydro_Hassan dakhil/backend/tests/services/catalog.service.test.ts`
- `hydro_Hassan dakhil/backend/tests/services/erosionSwatSeries.service.test.ts`
- `hydro_Hassan dakhil/backend/tests/services/hydroSwatSeries.service.test.ts`
- `hydro_Hassan dakhil/backend/tests/services/swatIngestion.service.test.ts`
- `hydro_Hassan dakhil/backend/tests/utils/aggregationAvailability.test.ts`
- `hydro_Hassan dakhil/backend/tests/utils/ttlCache.test.ts`
- `hydro_Hassan dakhil/frontend/vitest.config.ts`
- `hydro_Hassan dakhil/frontend/scripts/check-utf8.mjs`
- `hydro_Hassan dakhil/frontend/package.json`
- `hydro_Hassan dakhil/frontend/eslint.config.js`
- `hydro_Hassan dakhil/frontend/tests/setup.ts`
- `hydro_Hassan dakhil/frontend/tests/api/client.test.ts`
- `hydro_Hassan dakhil/frontend/tests/api/http.test.ts`
- `hydro_Hassan dakhil/frontend/tests/app.routes.test.tsx`
- `hydro_Hassan dakhil/frontend/tests/components/button.test.tsx`
- `hydro_Hassan dakhil/frontend/tests/lib/selectOptions.test.ts`
- `hydro_Hassan dakhil/frontend/tests/lib/useDebouncedValue.test.tsx`
- `hydro_Hassan dakhil/frontend/tests/pages/dashboard.smoke.test.tsx`

### Rapports finaux utiles

- `RAPPORT_FINAL_NETTOYAGE_SECURITE_STABILISATION_HASSAN_ADDAKHIL_20260812_1610.md`
- `Support_Doc_HD/TEST_GLOBAL_APPLICATION_HASSAN_ADDAKHIL_20260812.md`
- `Support_Doc_HD/CHECKLIST_LIVRAISON_HASSAN_ADDAKHIL_20260813.md`
- `Support_Doc_HD/LISTE_FICHIERS_COMMIT_FINAL_20260813.md`
- `Support_Doc_HD/RAPPORT_PREPARATION_LIVRAISON_GIT_HASSAN_ADDAKHIL_20260813.md`

---

## À EXCLURE

- `backups/` — dumps / baselines JSON (~504 Mo dump) ; déjà ignoré
- `*.dump` — hors Git
- `**/node_modules/`, `**/dist/` — déjà ignorés
- `**/.env`, `**/.env.local` — secrets
- `archive/` — historique / tmp / copies ; à décider plus tard
- `Support_Doc_HD/Rapport & Support/*.docx` — gros binaires Word
- `Support_Doc_HD/Phase Nettoyage et Stabilisation/*.json` — snapshots debug
- `Support_Doc_HD/Phase Validation Final/*.json|tsv|txt` — inventaires bruts
- `Support_Doc_HD/Phase Protection Donnees Fonctionnelles/*.json` — déjà référencés ; gros
- `hydro_Hassan dakhil/frontend/public/data/hassan/reports/*.pdf` — binaires lourds
- `hydro_Hassan dakhil/frontend/public/data/hassan/Classification des zones.../*.pdf` — binaire
- `hydro_Hassan dakhil/frontend/public/data/hassan/intervention-program/figures/*.png` — assets (décision séparée)
- captures / logs / `__pycache__` — déjà ignorés ou hors périmètre

---

## À VÉRIFIER

- `.env.example` / `hydro_Hassan dakhil/backend/.env.example` — placeholders OK, mais emails nominatifs
- `.gitignore` / `.gitattributes` — diff existant + proposition `*.dump` et `tmp/`
- `docker-compose.yml` / Dockerfiles / `nginx.conf` — infra, pas le commit sécurité minimal
- `package-lock.json` backend/frontend — volumineux ; utile seulement si `package.json` part
- `README.md` **supprimé** — dangereux sans remplacement
- suppressions `AUDIT_GOUVERNANCE_DONNEES/` et scripts racine — nettoyage déjà fait, trop large pour ce commit
- `archive/` vs suppressions `scripts/MIGRATION_*` — même contenu déplacé
- tout `Support_Doc_HD/` hors 4 rapports ci-dessus — audits utiles mais pas le commit ciblé
- `scripts/quality/compare-functional-baseline.py` — outil baseline, utile mais hors correctif sécu
- `hydro_Hassan dakhil/frontend/src/features/intervention-program/` — module métier, pas sécu
- services SWAT / hydro / spatial / charts / FilterBar / maps **modifiés** — hors périmètre « ne pas toucher métier » pour *ce* commit
- `hydro_Hassan dakhil/backend/scripts/reset-user-password.js` — outil admin
- `hydro_Hassan dakhil/backend/src/constants/swatDataSources.ts` — SWAT
- `.editorconfig` — cosmétique

---

## Commandes proposées (à exécuter seulement après validation)

Ne pas utiliser `git add .`

```text
git add "hydro_Hassan dakhil/backend/src/routes/adminDbConfig.routes.ts"
git add "hydro_Hassan dakhil/backend/src/middleware/errorHandler.ts"
git add "hydro_Hassan dakhil/backend/src/app.ts"
git add "hydro_Hassan dakhil/frontend/src/api/adminDbConfig.ts"
git add "hydro_Hassan dakhil/backend/tests"
git add "hydro_Hassan dakhil/backend/vitest.config.ts"
git add "hydro_Hassan dakhil/backend/eslint.config.js"
git add "hydro_Hassan dakhil/backend/scripts/check-utf8.mjs"
git add "hydro_Hassan dakhil/backend/package.json"
git add "hydro_Hassan dakhil/frontend/tests"
git add "hydro_Hassan dakhil/frontend/vitest.config.ts"
git add "hydro_Hassan dakhil/frontend/scripts/check-utf8.mjs"
git add "hydro_Hassan dakhil/frontend/package.json"
git add "hydro_Hassan dakhil/frontend/eslint.config.js"
git add "RAPPORT_FINAL_NETTOYAGE_SECURITE_STABILISATION_HASSAN_ADDAKHIL_20260812_1610.md"
git add "Support_Doc_HD/TEST_GLOBAL_APPLICATION_HASSAN_ADDAKHIL_20260812.md"
git add "Support_Doc_HD/CHECKLIST_LIVRAISON_HASSAN_ADDAKHIL_20260813.md"
git add "Support_Doc_HD/LISTE_FICHIERS_COMMIT_FINAL_20260813.md"
git add "Support_Doc_HD/RAPPORT_PREPARATION_LIVRAISON_GIT_HASSAN_ADDAKHIL_20260813.md"
```

Puis contrôler **avant** commit :

```text
git diff --cached --stat
git diff --cached --name-status
```

Vérifier l’absence de `backups/`, `*.dump`, `node_modules`, `dist`, `.env`, secrets, gros binaires.

Message proposé :

```text
chore: finalise stabilisation et sécurisation Hassan Addakhil
```

**Non exécuté** : `git add`, `git commit`, `git push`.
