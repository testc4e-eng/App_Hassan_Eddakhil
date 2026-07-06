# Rapport final — Ingestion et synchronisation des scénarios de reboisement

**Date** : 2026-07-06  
**Branche** : `dev/ilh-0107-stabilized`  
**Base** : `hydro_hd_1714` (PostgreSQL 17 + PostGIS, port `5436`)  
**Auteur** : Agent C4E — post-ingestion des 4 scénarios reboisement  

---

## 1. Résumé exécutif

L'ingestion des données **Daily** des 4 scénarios de reboisement (`scenario_1` à `scenario_4`) et leur synchronisation vers le schéma `core` ont été **finalisées avec succès**.

- **795 720 lignes** importées dans `access.sub_results` et `access.rch_results` (198 930 par scénario et par table).
- **2 387 160 mesures** créées dans `core.measurements` (596 790 par scénario).
- **228 séries** créées dans `core.timeseries` (57 par scénario).
- Le **référentiel 19 entités** est respecté : seuls les sous-bassins et reaches 1-19 sont exploités.
- Le **dashboard hydrologique frontend** affiche correctement les 4 scénarios de reboisement et leurs comparaisons avec les débits observés.

> ⚠️ La route `/scenarios` du frontend retourne toujours une erreur **404**. Cette page n'existe pas dans la version actuelle de l'application ; ce n'est pas un blocage pour la consultation via le dashboard.

---

## 2. État des données brutes `access`

### 2.1 `access.sub_results`

| Scénario | Agrégation | Lignes | Sous-bassins distincts | Date début | Date fin |
|----------|------------|--------|------------------------|------------|----------|
| scenario_1 | daily | 198 930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_2 | daily | 198 930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_3 | daily | 198 930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_4 | daily | 198 930 | 19 | 1995-01-01 | 2023-08-31 |

### 2.2 `access.rch_results`

| Scénario | Agrégation | Lignes | Reaches distincts | Date début | Date fin |
|----------|------------|--------|-------------------|------------|----------|
| scenario_1 | daily | 198 930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_2 | daily | 198 930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_3 | daily | 198 930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_4 | daily | 198 930 | 19 | 1995-01-01 | 2023-08-31 |

### 2.3 Contrôle d'unicité logique

Aucun doublon détecté sur la clé composite :

```text
(scenario_code, time_step, table_source, sub_code, period_date)
```

---

## 3. État des données synchronisées `core`

### 3.1 `core.model_runs`

| run_id | scenario_code | scenario_name | Séries liées |
|--------|---------------|---------------|--------------|
| 7 | scenario_1 | Scénario 1 reboisement | 57 |
| 8 | scenario_2 | Scénario 2 reboisement | 57 |
| 9 | scenario_3 | Scénario 3 reboisement | 57 |
| 10 | scenario_4 | Scénario 4 reboisement | 57 |

### 3.2 `core.timeseries` — détail par `property_id`

| Scénario | `property_id` | Mesures | Date début | Date fin |
|----------|---------------|---------|------------|----------|
| scenario_1 | 31 | 198 930 | 1995-01-01 | 2023-08-31 |
| scenario_1 | 32 | 198 930 | 1995-01-01 | 2023-08-31 |
| scenario_1 | 33 | 198 930 | 1995-01-01 | 2023-08-31 |
| scenario_2 | 31 | 198 930 | 1995-01-01 | 2023-08-31 |
| scenario_2 | 32 | 198 930 | 1995-01-01 | 2023-08-31 |
| scenario_2 | 33 | 198 930 | 1995-01-01 | 2023-08-31 |
| scenario_3 | 31 | 198 930 | 1995-01-01 | 2023-08-31 |
| scenario_3 | 32 | 198 930 | 1995-01-01 | 2023-08-31 |
| scenario_3 | 33 | 198 930 | 1995-01-01 | 2023-08-31 |
| scenario_4 | 31 | 198 930 | 1995-01-01 | 2023-08-31 |
| scenario_4 | 32 | 198 930 | 1995-01-01 | 2023-08-31 |
| scenario_4 | 33 | 198 930 | 1995-01-01 | 2023-08-31 |

- `property_id` 31 : flux (débit) — reaches
- `property_id` 32 : sédiments — reaches
- `property_id` 33 : yield de sédiments — sous-bassins

### 3.3 Répartition stations / séries (exemple `scenario_1`)

- **38 stations utilisées** par scénario :
  - 19 stations `swat_sub_1` → `swat_sub_19`
  - 19 stations `swat_rch_1` → `swat_rch_19`
- **57 séries** par scénario :
  - 19 reaches × 2 variables = 38 séries (property_id 31 et 32)
  - 19 sous-bassins × 1 variable = 19 séries (property_id 33)
- Chaque série contient **10 470 mesures**.

---

## 4. Vérification frontend

### 4.1 Connexion et navigation

- ✅ Page de login accessible
- ✅ Authentification avec le compte admin fonctionnelle
- ✅ Dashboard hydrologique (`/dashboard?section=hydraulic`) accessible
- ✅ Indicateur API : `API OK • 17 runs`

### 4.2 Sélection des scénarios reboisement

Les 4 scénarios apparaissent bien dans le sélecteur de scénarios :

- Scénario reboisement pente 9% (`scenario_1`)
- Scénario reboisement pente 15% (`scenario_2`)
- Scénario reboisement pente 25% (`scenario_3`)
- Scénario reboisement Buffer zone (`scenario_4`)

### 4.3 Affichage graphique et statistiques

Test effectué avec la station **Aval Barage Hassan Addakhel (1940/48)** et le scénario **Scénario reboisement Buffer zone** :

- ✅ Graphique de comparaison généré : *Débit observé vs Scénario reboisement Buffer zone*
- ✅ 7 548 paires de données
- ✅ Indicateurs statistiques calculés :
  - NSE : -9,10
  - RMSE : 14,33
  - R² : 0,00
  - PBIAS : -256,01%
- ✅ Période affichée : 1996 → 2023

> 📸 Capture d'écran : `dashboard_reboisement_buffer_zone.png`

### 4.4 Problème identifié

- ❌ La route `/scenarios` retourne une page **404**. Cette page n'est pas implémentée dans le frontend actuel. Les scénarios restent consultables via le dashboard hydrologique.

---

## 5. Problèmes résolus durant l'opération

| Problème | Cause racine | Solution appliquée |
|----------|--------------|---------------------|
| `ON CONFLICT` sans contrainte unique | Absence de clé composite sur `core.measurements` | Ajout de la contrainte `UNIQUE (ts_id, datetime)` |
| Mismatch colonnes CSV (37 vs 32) | Export PowerShell incomplet | Remplacement par un export Python via `fast_export_table.ps1` / `fast_ingest_scenarios.py` |
| Timeout / deadlock API `/hydro/swat/import` | Insertion ligne par ligne + forte volumétrie | Remplacement par `sync_core_manual.py` avec `COPY` par lots de 50 000 |
| Backend crash `Connection terminated unexpectedly` | Connexion PostgreSQL interrompue | Redémarrage du container backend |

---

## 6. Actions recommandées

### Immédiates

1. **Surveiller la stabilité du backend** : le crash transitoire a été corrigé par redémarrage ; surveiller les logs sur les prochaines sessions.
2. **Créer la page `/scenarios`** : si un listing dédié des scénarios est nécessaire, ajouter la route et le composant React correspondant.
3. **Valider métier les indicateurs statistiques** : les valeurs NSE/R²/PBIAS très défavorables indiquent un écart important entre observé et simulé pour la station aval ; à discuter avec l'équipe hydrologique.

### À moyen terme

4. **Investigation SSP** : les données SSP en base ne correspondent pas aux MDB audités (période et counts différents). Ne pas réimporter sans validation.
5. **Source `etat_actuel`** : le fichier source n'a pas été localisé dans `Modèle Bge HAD`. À retrouver avant toute mise à jour.
6. **Archivage des scénarios 33 entités** : les anciennes stations `swat_sub_20-33` et `swat_rch_20-33` existent toujours en base mais ne sont plus exploitées. Prévoir un nettoyage / archivage explicite.

---

## 7. Fichiers et livrables associés

- Backup complet : `backups/hydro_hd_before_swat_daily_import.dump` (396 MB)
- Script d'ingestion : `fast_ingest_scenarios.py`
- Script de synchronisation : `sync_core_manual.py`
- Capture d'écran frontend : `AUDIT_GOUVERNANCE_DONNEES/dashboard_reboisement_buffer_zone.png`
- Rapports d'audit antérieurs : `AUDIT_GOUVERNANCE_DONNEES/16_audit_scenarios_swat_ingestion.md`

---

## 8. Conclusion

L'objectif d'ingérer les 4 scénarios de reboisement **Daily** et de les rendre exploitables dans le dashboard est atteint. Les données sont cohérentes, le référentiel 19 entités est respecté, et le frontend les affiche correctement. Seule la route `/scenarios` reste à implémenter si elle est requise par les utilisateurs finaux.
