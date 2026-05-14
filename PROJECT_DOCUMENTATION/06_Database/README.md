# Database

La documentation SQL détaillée n’est pas réécrite ici. Elle est maintenue dans le dossier racine `DATABASE_DOCUMENTATION`, qui contient le schéma reconstruit, les scripts SQL et la backup PostgreSQL du projet. Cette section sert d’index métier et technique.

L’idée est de garder une seule source de vérité pour la base:

- la documentation SQL complète reste dans `DATABASE_DOCUMENTATION`
- la documentation projet renvoie vers cette source
- les pages métier décrivent uniquement l’usage fonctionnel des données

## Référence principale

- [DATABASE_DOCUMENTATION](../../DATABASE_DOCUMENTATION/README.md)
- backup PostgreSQL du projet dans `DATABASE_DOCUMENTATION/backup`
- schémas observés: `public`, `access`, `api`, `audit`, `auth`, `core`, `geo`, `gis`, `ref`, `staging`, `old_hd`

## Relations métier majeures

- stations -> timeseries -> measurements
- runs / scenarios -> catalogue des séries
- catchments / subbasins / reaches / reservoirs -> spatial

## Lecture fonctionnelle rapide

- stations = points de mesure
- timeseries = catalogue logique d’une série
- measurements = valeurs physiques observées
- catchments = bassins versants
- reservoirs = barrages / retenues

## Fichiers de référence disponibles

| Fichier | Contenu |
|---|---|
| `DATABASE_DOCUMENTATION/01_resume_global_base.md` | résumé global |
| `DATABASE_DOCUMENTATION/03_dictionnaire_donnees.md` | dictionnaire de données |
| `DATABASE_DOCUMENTATION/04_relations_pk_fk.md` | relations et clés |
| `DATABASE_DOCUMENTATION/05_inventaire_tables_et_vues.md` | inventaire des objets |
| `DATABASE_DOCUMENTATION/sql_recreation/*` | scripts de recréation |
| `DATABASE_DOCUMENTATION/backup/*.backup` | sauvegarde PostgreSQL |

## Pourquoi ce choix

| Avantage | Bénéfice |
|---|---|
| Séparation des responsabilités | la doc SQL reste indépendante |
| Maintenabilité | chaque documentation peut évoluer à son rythme |
| Traçabilité | les liens entre projet et BD restent clairs |

## Ce qu’il faut retenir

- les détails SQL sont dans le dossier dédié
- la documentation projet doit rester lisible par tous les publics
- toute modification majeure de schéma doit être reflétée dans les deux dossiers
