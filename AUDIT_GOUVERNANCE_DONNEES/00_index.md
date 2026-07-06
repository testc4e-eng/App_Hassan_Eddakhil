# Index — AUDIT_GOUVERNANCE_DONNEES

Ce répertoire centralise les rapports d'audit, de traçabilité et de vérification des données du projet **Hassan Addakhil**.

## Documents maîtres

| Fichier | Description | Date |
|---------|-------------|------|
| `16_audit_scenarios_swat_ingestion.md` | Audit comparatif SWATOutput.mdb vs base avant ingestion des Daily reboisement | 2026-07-03 |
| `17_rapport_final_post_ingestion_reboisement.md` | Rapport final post-ingestion des 4 scénarios reboisement + vérification frontend | 2026-07-06 |

## Fichiers de données

| Fichier | Description |
|---------|-------------|
| `db_sub_summary.csv` | Synthèse des lignes `sub_results` en base |
| `db_rch_summary.csv` | Synthèse des lignes `rch_results` en base |
| `swat_output_mdb_audit.csv` | Audit des MDB sources (version initiale) |
| `swat_output_mdb_audit_fixed.csv` | Audit des MDB sources (version corrigée) |
| `swat_output_mdb_audit.log` | Logs détaillés de l'audit MDB |
| `index_creation.log` | Log de création des index d'optimisation |

## Captures d'écran

| Fichier | Description |
|---------|-------------|
| `dashboard_reboisement_buffer_zone.png` | Capture du dashboard hydrologique — scénario reboisement Buffer zone |

## Dossiers

| Dossier | Contenu |
|---------|---------|
| `screenshots/` | Captures d'écran diverses de l'audit |
| `sql_proposed/` | Scripts SQL proposés durant l'audit |
