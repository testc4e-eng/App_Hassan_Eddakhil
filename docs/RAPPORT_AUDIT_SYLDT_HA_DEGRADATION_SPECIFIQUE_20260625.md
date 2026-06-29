# Rapport audit SYLDT_HA - Degradation specifique

Date: 2026-06-25

## Perimetre

Module verifie:

- Dashboard > Sediments > Degradation specifique
- Variable metier: SYLDT_HA
- Entite: sous-bassin SWAT
- Scenarios: etat actuel, SSP126, SSP245, SSP585, changements spatiaux 1 a 4

## Cause racine

Les donnees SYLDT_HA existaient bien en base, mais l'interface demarrait sur le scenario `Observe`.

Or aucune serie observee SYLDT_HA par sous-bassin n'existe dans la base active. Le service backend ajoutait aussi une disponibilite virtuelle `OBSERVED` avec `points_count = 0`, ce qui faisait croire au frontend que ce scenario etait selectionnable.

Resultat avant correction:

- scenario actif: Observe
- serie retournee: vide
- statistiques: vides
- tableau: vide
- graphe: vide

## Donnees confirmees en PostgreSQL

Table source active:

- `access.sub_results`

Colonnes controlees:

- `sub_code`
- `scenario_code`
- `period_date`
- `syld_t_ha`

Controle SQL:

```sql
SELECT
  count(*) AS rows,
  count(syld_t_ha) AS syldt_rows,
  min(period_date),
  max(period_date),
  count(DISTINCT sub_code),
  min(syld_t_ha),
  max(syld_t_ha)
FROM access.sub_results
WHERE syld_t_ha IS NOT NULL;
```

Resultat:

- rows = 345510
- syldt_rows = 345510
- periode = 1995-01-01 -> 2023-08-31
- sous-bassins = 33 dans la table source SWAT
- min = 0
- max = 216

Controle exemples:

```sql
SELECT sub_code, sum(syld_t_ha), min(period_date), max(period_date), count(*)
FROM access.sub_results
WHERE scenario_code = 'SWAT_OUTPUT'
  AND sub_code IN (1, 2, 8, 19)
GROUP BY sub_code
ORDER BY sub_code;
```

Resultats:

- subbasin 1: 10470 lignes, total 0
- subbasin 2: 10470 lignes, total 127.365316
- subbasin 8: 10470 lignes, total 1432.194283
- subbasin 19: 10470 lignes, total 342.706480

## Source Access identifiee

Fichier controle:

- `D:\3- Projets\hassanAddakhil\hassan dakhil\Scenarios_etat_actuel\Daily\TablesOut\SWATOutput.mdb`

Provider:

- `Microsoft.ACE.OLEDB.16.0`

Table source:

- `sub`

Colonnes pertinentes:

- `SUB`
- `YEAR`
- `MON`
- `AREAkm2`
- `SYLDt_ha`
- `SEDPkg_ha`
- `YYYYDDD`

Exemple lu depuis Access:

```text
ROW sub=1 mon=1 syldt=2.57E-13 sedpkg=2.59E-10
ROW sub=2 mon=1 syldt=8.11E-13 sedpkg=2E-09
ROW sub=3 mon=1 syldt=3.97E-13 sedpkg=1.67E-09
```

Mapping confirme:

- Access `sub.SYLDt_ha`
- PostgreSQL `access.sub_results.syld_t_ha`
- API `/api/v1/solid-yield/*`
- Frontend `SolidYieldModuleV2`

## Corrections appliquees

### Backend

Fichier modifie:

- `hydro_Hassan dakhil/backend/src/services/erosionSwatSeries.service.ts`

Correction:

- suppression fonctionnelle de la disponibilite virtuelle `OBSERVED` pour le fallback Access SYLDT_HA;
- les disponibilites exposees par `/solid-yield/availability` representent maintenant uniquement les scenarios qui ont des donnees;
- les scenarios normalises `101..108` restent exposes sur les donnees SWAT disponibles.

### Frontend

Fichier modifie:

- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx`

Corrections:

- selection automatique du premier scenario ayant `points_count > 0`;
- `Observe` reste visible comme indisponible, mais n'est plus selectionnable;
- les checkboxes de comparaison sans donnees sont desactivees;
- les appels API series/statistiques sont evites quand la disponibilite est vide;
- les boutons d'agregation sont grises si le scenario actif n'a pas de donnees;
- le graphe/tableau/statistiques demarrent maintenant sur `Scenario etat actuel`.

## API live verifiees

Endpoint:

```text
GET /api/v1/solid-yield/availability?subbasinStationId=84
```

Resultat apres correction:

- count = 8
- premier scenario = `etat_actuel`
- run_id = 101
- points_count = 10470
- periode = 1995-01-01 -> 2023-08-31
- `OBSERVED` n'est plus retourne par cette disponibilite.

Endpoint:

```text
GET /api/v1/solid-yield/timeseries?subbasinStationId=84&runId=101&interval=year
```

Resultat:

- count = 29
- premier point = 1995-01-01, value = 0.023438036727385064, n = 365

Endpoint:

```text
GET /api/v1/solid-yield/stats?subbasinStationId=84&runId=101
```

Resultat:

- min = 2.34E-12
- max = 31.7
- moyenne = 0.012164786594369592
- somme = 127.36531564304963
- points = 10470
- periode = 1995-01-01 -> 2023-08-31

Comparaison:

- `runId=101` et `runId=102` retournent la meme serie via le meme endpoint;
- la comparaison frontend superpose les series retournees sans recalculer les valeurs.

## Verification interface

Verification via navigateur integre:

- page: `http://localhost:8089/dashboard?section=sediment`
- mode: `Degradation specifique`
- scenario actif: `Scenario etat actuel`
- `Observe`: affiche `indisponible`
- points: `10470`
- periode: `1995-01-01 -> 2023-08-31`
- tableau: rempli
- message `Aucune donnee pour cette selection`: absent

## Tests realises

- `npm run build` backend: OK
- `npx tsc -b --pretty false` frontend: OK
- `docker compose up -d --build backend frontend`: OK
- `docker compose up -d --build frontend`: OK
- verification API live: OK
- verification navigateur apres login: OK

## Limites restantes

- La base active ne contient pas de serie observee SYLDT_HA par sous-bassin. L'interface le signale donc comme indisponible.
- Le fallback actuel expose les scenarios normalises sur la source SWAT importee disponible. Si chaque scenario doit avoir un fichier Access distinct avec des valeurs differentes, il faudra importer ces MDB scenario par scenario dans PostgreSQL.
