# Runbook securise

## 0) Prerequis

1. Sauvegardes disponibles.
2. Credentials source/cible verifies.
3. Aucune fenetre de maintenance critique en cours.

## 1) Preparation

1. Copier `.env.migration.example` en `.env.migration`.
2. Renseigner les mots de passe.
3. Exporter les variables d'environnement.

PowerShell:

```powershell
Get-Content .\.env.migration | ForEach-Object {
  if ($_ -match '^(?<k>[^#=]+)=(?<v>.*)$') {
    [System.Environment]::SetEnvironmentVariable($Matches.k.Trim(), $Matches.v.Trim(), 'Process')
  }
}
```

## 2) Inspection

- Executer les scripts `01_inspection_sql/*` sur source puis cible.
- Conserver les sorties dans `00_inventory`.

## 3) Initialisation staging

- Executer `03_staging_sql/01_create_staging_tables.sql` sur cible.

## 4) ETL dry-run

```powershell
python .\04_etl_python\etl_migrate_abhgzr.py --mode dry-run
```

- Verifier les compteurs.
- Corriger toute erreur bloquante avant commit.

## 5) ETL commit

```powershell
python .\04_etl_python\etl_migrate_abhgzr.py --mode commit --batch-id <BATCH_ID_OPTIONNEL>
```

## 6) Normalisation

- Recuperer `load_batch_id` (summary ETL).
- Executer:
- `03_staging_sql/02_normalize_staging.sql`

## 7) Chargement final

Ordre obligatoire:

1. `05_load_sql/01_load_ref_communes.sql`
2. `05_load_sql/02_load_core_entities.sql`
3. `05_load_sql/03_load_ref_properties_model_run.sql`
4. `05_load_sql/04_load_core_timeseries_measurements.sql`
5. `05_load_sql/05_load_core_bathymetry.sql`

## 8) Controles qualite

1. `06_quality_checks/01_preload_checks.sql`
2. `06_quality_checks/02_postload_checks.sql`
3. `06_quality_checks/03_reconciliation_checks.sql`

## 9) Criteres de go/no-go

Go:

- Aucun check bloquant.
- Volumes reconcilies a seuil acceptable.
- Pas de regression de vues cibles critiques.

No-go:

- erreurs parsing massives,
- orphelins FK importants,
- geometries invalides massives.

