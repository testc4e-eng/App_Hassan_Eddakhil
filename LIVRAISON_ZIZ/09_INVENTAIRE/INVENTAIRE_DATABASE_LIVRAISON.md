# INVENTAIRE DATABASE LIVRAISON

Date de mise a jour : 2026-08-28

Projet source : `D:\3- Projets\App_Hassan_Addakhil`

## Etat courant du dump officiel de livraison

| Element | Valeur |
|---|---|
| Dump officiel release Ziz v1.0.0 | `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\03_DATABASE\backup\hydro_hd_v1.0.0.dump` |
| Statut | `R3-FIX VALIDE` |
| Format officiel | `PostgreSQL custom dump (PGDMP)` |
| Taille exacte | `528313425` octets |
| Taille MiB | `503.84` |
| Date dump assaini | `2026-08-28 10:54:12` |
| SHA256 officiel | `1f33e0e4295c74edf0ae4dcfaa82196e589e7029db985ecb1e1459ba55f2cbd1` |
| Fichier checksum | `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\03_DATABASE\backup\hydro_hd_v1.0.0.sha256` |
| Inventaire `pg_restore --list` final | `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\03_DATABASE\rapports\hydro_hd_v1.0.0.pg_restore_list.after_r3fix.txt` |
| TOC Entries | `477` |
| Dumped from database version | `17.5 (Debian 17.5-1.pgdg110+1)` |
| Dumped by `pg_dump` version | `17.5 (Debian 17.5-1.pgdg110+1)` |
| Mode de restauration valide pour Ziz | `pg_restore --no-owner --no-privileges --exit-on-error` |
| Second restore portable valide | `Oui` |

## Historique du dump bloque

| Element | Valeur |
|---|---|
| Dump historique bloque | `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\03_DATABASE\backup\hydro_hd_v1.0.0.blocked_fdw.dump` |
| Statut | `NON LIVRABLE - BLOQUE PAR FDW LEGACY` |
| Taille exacte | `528758454` octets |
| SHA256 historique | `2b77870f109e081b7f6f4cb042502e047ed3533e4b175aa7371765334d93f255` |
| Fichier checksum historique | `D:\3- Projets\App_Hassan_Addakhil\LIVRAISON_ZIZ\03_DATABASE\backup\hydro_hd_v1.0.0.blocked_fdw.sha256` |
| Cause du blocage | `postgres_fdw`, `old_hd_srv`, `USER MAPPING postgres`, `13` foreign tables du schema `old_hd` |
| Destination package final | `A exclure de 10_PACKAGE_FINAL` |

## Base source de reference

| Element | Valeur |
|---|---|
| Base active applicative | `hydro_hd` |
| Hote DB actif applicatif | `host.docker.internal:5432` |
| PostgreSQL actif releve sur la source | `17.8` |
| PostGIS actif releve sur la source | `3.5.3` |
| Service Compose DB local | `db` |
| Volume Docker Compose local | `hydro_hd_pgdata_ilh0107` |
| Volume Docker resolu local | `app_hassan_addakhil_hydro_hd_pgdata_ilh0107` |
| Script backup livre | `LIVRAISON_ZIZ/03_DATABASE/scripts/backup_hydro_hd.sh` |
| Script restore livre | `LIVRAISON_ZIZ/03_DATABASE/scripts/restore_hydro_hd.sh` |

## Contenu confirme du dump officiel assaini

Schemas applicatifs confirmes :

- `access`
- `api`
- `audit`
- `auth`
- `core`
- `geo`
- `gis`
- `hydro`
- `public`
- `ref`
- `staging`
- `swat_setup`

Extensions confirmees dans le dump officiel :

- `pgcrypto`
- `postgis`

Elements explicitement absents du dump officiel :

- schema `old_hd`
- extension `postgres_fdw`
- serveur `old_hd_srv`
- `USER MAPPING` legacy
- foreign tables du schema `old_hd`
- credentials FDW legacy

Verdict securite dump officiel :

- `FDW LEGACY SENSITIVE DATA : ABSENT`

## Verification structurelle et metier

Indicateurs verifies sur la base assainie puis sur un second restore neuf :

| Controle | Valeur attendue | Resultat |
|---|---:|---:|
| Tables | `79` | `79` |
| Vues | `104` | `104` |
| Vues materialisees | `1` | `1` |
| `core.stations` | `102` | `102` |
| `core.reaches` | `33` | `33` |
| `core.subbasins` | `33` | `33` |
| `public.stations` | `102` | `102` |
| `public.timeseries` | `383` | `383` |

Objets applicatifs essentiels confirmes :

- `access.rch_results`
- `access.sub_results`
- `core.reaches`
- `core.stations`
- `core.subbasins`
- `public.stations`
- `public.timeseries`
- `api.mv_scenario_catalog`
- `api.v_catalog_properties`
- `api.v_catalog_stations`
- `api.v_timeseries_enriched`

## Notes d'exploitation

- Le dump officiel assaini ne doit pas etre remplace par le dump bloque conserve pour l'historique.
- Le dump bloque `hydro_hd_v1.0.0.blocked_fdw.dump` ne doit jamais etre place dans `10_PACKAGE_FINAL`.
- Le scenario R3 complet doit etre rejoue depuis zero avec le nouveau dump officiel portable.
- Le stack principal et la base active n'ont pas ete modifies pendant R3-FIX.

## Ancien dump source hors release

- `D:\3- Projets\App_Hassan_Addakhil\hydro_hd.sql`
- Statut : `ANCIEN DUMP - NON UTILISE POUR LA RELEASE ZIZ V1.0.0`
- Conservation : `A conserver dans le projet source, sans l'inclure dans 10_PACKAGE_FINAL`
