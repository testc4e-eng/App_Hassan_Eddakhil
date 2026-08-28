# VALIDATION LOT 1 AVANT NETTOYAGE — `hydro_hd`

Date : **2026-08-11**  
Heure : **11:20**  
Mode : **lecture seule**

Aucun `DROP`, aucun `DELETE`, aucune écriture PostgreSQL, aucune restauration, aucun changement Docker n'ont été exécutés.

## 1. Revalidation table par table

### TABLE :
`audit.qc_issues`

SUPPRESSION SURE :
**OUI**

PREUVES :
- la table existe encore dans `hydro_hd` ;
- nombre de lignes : `0` ;
- backend : aucune référence active ;
- frontend indirect via API : aucune ;
- scripts actifs : aucune ;
- Docker / init SQL / `.env` / `package.json` : aucune ;
- vues dépendantes : `0` ;
- matviews dépendantes : `0` ;
- FK entrantes : `0` ;
- FK sortantes : `0` ;
- fonctions dépendantes : `0` ;
- triggers : `0` ;
- migrations actives : aucune ;
- seule dépendance interne détectée : séquence owned `audit.qc_issues_qc_issue_id_seq`, supprimable avec la table sans `CASCADE`.

RISQUE :
**FAIBLE**

### TABLE :
`audit.qc_runs`

SUPPRESSION SURE :
**OUI**

PREUVES :
- la table existe encore dans `hydro_hd` ;
- nombre de lignes : `0` ;
- backend : aucune référence active ;
- frontend indirect via API : aucune ;
- scripts actifs : aucune ;
- Docker / init SQL / `.env` / `package.json` : aucune ;
- vues dépendantes : `0` ;
- matviews dépendantes : `0` ;
- FK entrantes : `0` ;
- FK sortantes : `0` ;
- fonctions dépendantes : `0` ;
- triggers : `0` ;
- migrations actives : aucune ;
- seule dépendance interne détectée : séquence owned `audit.qc_runs_qc_run_id_seq`, supprimable avec la table sans `CASCADE`.

RISQUE :
**FAIBLE**

### TABLE :
`audit.station_reach_map_backup_2026`

SUPPRESSION SURE :
**OUI**

PREUVES :
- la table existe encore dans `hydro_hd` ;
- nombre de lignes : `0` ;
- backend : aucune référence active ;
- frontend indirect via API : aucune ;
- scripts actifs : aucune ;
- Docker / init SQL / `.env` / `package.json` : aucune ;
- vues dépendantes : `0` ;
- matviews dépendantes : `0` ;
- FK entrantes : `0` ;
- FK sortantes : `0` ;
- fonctions dépendantes : `0` ;
- triggers : `0` ;
- migrations actives : aucune ;
- aucune séquence owned détectée ;
- table de backup vide, redondante avec `core.station_reach_map`.

RISQUE :
**FAIBLE**

### TABLE :
`audit.station_subbasin_map_backup_2026`

SUPPRESSION SURE :
**OUI**

PREUVES :
- la table existe encore dans `hydro_hd` ;
- nombre de lignes : `0` ;
- backend : aucune référence active ;
- frontend indirect via API : aucune ;
- scripts actifs : aucune ;
- Docker / init SQL / `.env` / `package.json` : aucune ;
- vues dépendantes : `0` ;
- matviews dépendantes : `0` ;
- FK entrantes : `0` ;
- FK sortantes : `0` ;
- fonctions dépendantes : `0` ;
- triggers : `0` ;
- migrations actives : aucune ;
- aucune séquence owned détectée ;
- table de backup vide, redondante avec `core.station_subbasin_map`.

RISQUE :
**FAIBLE**

## 2. Baseline fonctionnelle

Script exécuté :
`scripts/quality/compare-functional-baseline.py`

Baseline de comparaison :
`Support_Doc_HD/Phase Protection Donnees Fonctionnelles/PROTECTED_FUNCTIONAL_DATA_BASELINE_20260810_1608.json`

Artifacts générés :
- `Support_Doc_HD/Phase Protection Donnees Fonctionnelles/VALIDATION_LOT1_BASELINE_SNAPSHOT_20260811.json`
- `Support_Doc_HD/Phase Protection Donnees Fonctionnelles/VALIDATION_LOT1_BASELINE_REPORT_20260811.md`

Résultat du compare :
- `COMPARE STATUS: REGRESSION`
- cause unique : backend API non démarré sur `http://127.0.0.1:5007`, donc toutes les probes HTTP backend reviennent `None != 200`.

Lecture métier de la baseline :
- `timeseries` : `383` — **OK**
- `measurements` : `3 773 400` — **OK**
- `stations visibles` : `75` — **OK**
- `scénarios visibles protégés` : `9` — **OK**
- `runtime reaches` : `19` — **OK**
- `runtime subbasins` : `19` — **OK**
- stations protégées : **préservées**
- signatures timeseries protégées : **préservées**
- groupes SWAT Reach/Sub : **préservés**
- couches cartographiques protégées : **préservées**

Conclusion baseline :
**WARNING**

Motif :
pas de régression métier détectée sur les données protégées ; alerte uniquement d’environnement API car le backend attendu sur `5007` n’était pas lancé au moment du contrôle.

## 3. Backup

BACKUP :
`D:\3- Projets\App_Hassan_Addakhil\backups\hydro_hd_before_dq_corrections_20260810_1339.dump`

Vérifications :
- fichier présent : **OUI**
- dump logique PostgreSQL custom : **OUI**
- date : **2026-08-10 13:41**
- taille : **533241661** octets
- `pg_restore --list` : **OK**

Décision :
backup réutilisable pour le lot 1, aucune restauration nécessaire.

## 4. SQL futur prêt

SQL prêt :
**OUI**

Validation :
- aucun `CASCADE` requis d’après les dépendances actives live ;
- aucune vue, matview, FK, fonction ou trigger bloquant ;
- les séquences owned internes de `audit.qc_issues` et `audit.qc_runs` ne bloquent pas un `DROP TABLE` simple.

SQL à exécuter plus tard, sans modification dans cette phase :

```sql
DROP TABLE audit.qc_issues;
DROP TABLE audit.qc_runs;
DROP TABLE audit.station_reach_map_backup_2026;
DROP TABLE audit.station_subbasin_map_backup_2026;
```

## 5. Plan de test après suppression

Tests à exécuter juste après le lot 1 :

1. Backend health  
   `GET /api/v1/hydro/health`
2. Catalog / runs  
   `GET /api/v1/catalog/runs`
3. Hydrologie  
   `GET /api/v1/catalog/availability?module=hydro`
4. Climat  
   `GET /api/v1/catalog/availability?module=climat`
5. Sédiments  
   `GET /api/v1/hydro/swat/summary`  
   `GET /api/v1/solid-yield/availability`
6. Spatial  
   `GET /api/v1/spatial/reaches`  
   `GET /api/v1/spatial/subbasins`
7. Data Scan  
   `GET /api/v1/data-scan/summary`
8. Admin  
   vérifier `/api/auth/*` et `/api/v1/admin/*`
9. Baseline  
   relancer `scripts/quality/compare-functional-baseline.py --compare ...`
10. Backend qualité  
   `npm run check` dans `hydro_Hassan dakhil/backend`
11. Frontend qualité  
   `npm run check` dans `hydro_Hassan dakhil/frontend`

## 6. Synthèse finale

Tables validées :
- `audit.qc_issues`
- `audit.qc_runs`
- `audit.station_reach_map_backup_2026`
- `audit.station_subbasin_map_backup_2026`

Tables refusées :
- aucune

Backup :
- `D:\3- Projets\App_Hassan_Addakhil\backups\hydro_hd_before_dq_corrections_20260810_1339.dump`
- validation `pg_restore --list` : **OK**

Baseline :
- données protégées : **OK**
- APIs backend attendues sur `5007` : **non disponibles au moment du test**
- statut global : **WARNING**

SQL prêt :
**OUI**

PostgreSQL modifié :
**NON**

## 7. Point d’arrêt

ARRÊT ICI.

- Aucun `DROP` exécuté.
- Aucune table supprimée.
- Aucun `CASCADE`.
- Aucun changement PostgreSQL.
