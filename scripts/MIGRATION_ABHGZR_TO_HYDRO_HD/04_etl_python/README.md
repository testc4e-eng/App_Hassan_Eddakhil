# 04_etl_python

Script principal: `etl_migrate_abhgzr.py`

## Variables d'environnement

- `SRC_DB_HOST`, `SRC_DB_PORT`, `SRC_DB_NAME`, `SRC_DB_USER`, `SRC_DB_PASSWORD`, `SRC_DB_SSL`
- `TGT_DB_HOST`, `TGT_DB_PORT`, `TGT_DB_NAME`, `TGT_DB_USER`, `TGT_DB_PASSWORD`, `TGT_DB_SSL`

## Commandes

Dry-run (aucune ecriture cible):

```bash
python etl_migrate_abhgzr.py --mode dry-run
```

Commit:

```bash
python etl_migrate_abhgzr.py --mode commit --batch-id 20260420T1500Z_abhgzr
```

## Garanties

- Aucun update/delete/drop.
- Ecriture uniquement dans `staging.raw_*` + logs migration.
- Traçabilité par `load_batch_id`.

