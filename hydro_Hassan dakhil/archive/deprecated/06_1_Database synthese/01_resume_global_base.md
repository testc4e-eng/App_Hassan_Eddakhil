# Résumé global

- Base analysée: `hydro_hd_1714`
- Serveur: PostgreSQL 17.8 on x86_64-windows
- Utilisateur: `postgres`
- Date d'analyse: Wed May 13 2026 11:04:13 GMT+0000 (temps universel coordonné)
- Schémas non système: `public`, `access`, `api`, `audit`, `auth`, `core`, `geo`, `gis`, `old_hd`, `pg_temp_1`, `pg_temp_19`, `pg_temp_20`, `pg_temp_21`, `pg_temp_23`, `pg_temp_39`, `pg_temp_57`, `pg_temp_59`, `pg_temp_60`, `pg_temp_78`, `pg_temp_79`, `pg_temp_97`, `pg_temp_98`, `ref`, `staging`
- Extensions: `pgcrypto 1.3`, `plpgsql 1.0`, `postgis 3.5.3`, `postgres_fdw 1.1`
- Tables/foreign tables: 84
- Vues: 116
- Vues matérialisées: 2
- Séquences: 42
- Fonctions non extension: 3
- Triggers: 0
- Serveurs FDW: 1

## Lecture rapide

La base est organisée autour de 8 blocs fonctionnels: référentiels (`ref`), noyau hydrologique (`core`), géospatial (`geo`), contrôle qualité (`audit`), exposition analytique (`api`), sécurité (`auth`), espace public de vues et tables partagées, et un pont FDW legacy (`old_hd`).

PostGIS est présent et explique les colonnes géométriques, les vues géographiques et les index spatiaux. `postgres_fdw` alimente `old_hd` à partir d'une base distante `bd_hassdakh` sur `localhost:5432`.

Les fonctions applicatives détectées sont peu nombreuses et servent surtout à l'agrégation API. Aucun trigger utilisateur n'a été trouvé.

## Répartition par schéma

- public: 4 tables, 91 vues, 0 vues matérialisées. Couche d’exposition et de vues métier plus tables techniques partagées.
- access: 4 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- api: 0 tables, 20 vues, 2 vues matérialisées. Vues d’API et agrégations pour consommation applicative.
- audit: 2 tables, 5 vues, 0 vues matérialisées. Contrôle qualité et traçabilité des contrôles.
- auth: 6 tables, 0 vues, 0 vues matérialisées. Gestion des accès, rôles et journalisation.
- core: 15 tables, 0 vues, 0 vues matérialisées. Noyau hydrologique et temporel.
- geo: 1 tables, 0 vues, 0 vues matérialisées. Objets géographiques et occupation du sol.
- gis: 4 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- old_hd: 13 tables, 0 vues, 0 vues matérialisées. Couche FDW vers l’ancien socle HD.
- pg_temp_1: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_19: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_20: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_21: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_23: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_39: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_57: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_59: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_60: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_78: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_79: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_97: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- pg_temp_98: 0 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.
- ref: 6 tables, 0 vues, 0 vues matérialisées. Référentiels et dictionnaires de domaine.
- staging: 29 tables, 0 vues, 0 vues matérialisées. Schéma fonctionnel.