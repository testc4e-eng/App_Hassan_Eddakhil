# SWAT ADMINISTRATION WINDOWS

Date : 2026-08-27

Statut : documentation technique C5

## Objectif

Documenter pourquoi les imports SWAT/MDB restent un outillage d'administration Windows distinct du runtime serveur Linux Ziz.

## Pourquoi SWAT/MDB reste sous Windows

Le projet actuel s'appuie sur :

- PowerShell
- `powershell.exe`
- COM `ADODB.Connection`
- `Microsoft.ACE.OLEDB.12.0`
- fichiers source `SWATOutput.mdb`

Ces dependances sont utilisees pour lire Microsoft Access et alimenter PostgreSQL. Elles ne sont pas necessaires au fonctionnement normal de la plateforme une fois les donnees deja importees dans `hydro_hd`.

## Quand utiliser ces outils

Utiliser les outils Windows uniquement pour :

- analyser un nouveau `SWATOutput.mdb`
- importer de nouvelles sorties SWAT
- relancer un import `preview`, `import`, `reload` ou `replace`
- synchroniser certaines donnees SWAT techniques
- verifier un import avec les scripts SQL de controle

Ne pas les utiliser pour :

- le fonctionnement quotidien du serveur Ziz
- l'affichage normal des tableaux de bord
- la consultation hydrologique, climatologique ou sedimentaire deja chargee en base

## Ce qui fonctionne sans SWAT sur le serveur Linux

Si les donnees SWAT ont deja ete importees dans `hydro_hd`, le serveur Linux Ziz peut assurer :

- frontend / Nginx
- backend
- PostgreSQL/PostGIS
- consultation des scenarios SWAT deja presents
- visualisation des disponibilites, points, comparaisons et cartes

Le runtime lit PostgreSQL, pas les fichiers MDB.

## Prerequis Windows

Poste d'administration recommande :

- Windows
- PowerShell
- Microsoft Access Database Engine / provider `Microsoft.ACE.OLEDB.12.0`
- client `psql`
- acces reseau au backend ou a PostgreSQL cible
- fichiers `SWATOutput.mdb` fournis hors depot

Variables a utiliser sans stocker de secrets dans Git :

- `SWAT_MDB_PATH`
- `SWAT_DATA_ROOT`
- `HASSAN_DATA_ROOT`
- `PGHOST`
- `PGPORT`
- `PGDATABASE` ou `HDI_DB_NAME`
- `PGUSER`
- `PGPASSWORD`
- `DB_PASSWORD`
- `POSTGRES_PASSWORD`
- `SWAT_IMPORT_SCRIPT_PATH`

## Procedure generale

1. Placer ou identifier les fichiers `SWATOutput.mdb` sur le poste Windows admin.
2. Configurer les variables d'environnement ou les parametres de connexion PostgreSQL.
3. Lancer une analyse MDB avec `analyze_mdb.ps1`.
4. Lancer un test `preview` avec `import_swat_output.ps1`.
5. Executer l'import reel seulement apres validation.
6. Si necessaire, utiliser `import_etat_actuel_bundle.ps1` pour le lot "etat_actuel".
7. Verifier ensuite dans PostgreSQL et dans l'application que les donnees SWAT sont disponibles.

## Relation avec la base hydro_hd

Flux logique :

```text
MDB externe
  -> import PowerShell/Access
  -> tables PostgreSQL access.*
  -> normalisation backend vers core.*
  -> consultation applicative
```

Important :

- les MDB sont des sources d'import
- `hydro_hd` est la base d'exploitation
- le serveur Linux n'a pas besoin de garder les MDB pour l'usage normal une fois l'import termine

## Fichiers recommandes pour un package admin Windows

A inclure :

- `analyze_mdb.ps1`
- `import_swat_output.ps1`
- `import_etat_actuel_bundle.ps1`
- `mapping.config.json`
- `verify_etat_actuel.sql`
- `sync_core_etat_actuel.sql`
- `sync_syldt_scenarios_from_legacy.sql`
- `etat_actuel_sync_payload.json`
- `README.md`

Optionnel :

- `extract_apport_hassan_excel.py`

A exclure par defaut :

- `logs/`
- `work/`
- `reports/`
- `archive/scripts/swat-import`
- scripts de correction ponctuelle non standard

## Points de vigilance

- Ne jamais stocker un mot de passe dans les scripts ou les rapports.
- Eviter de passer le mot de passe en argument shell si une variable d'environnement suffit.
- Les modes `reload`, `replace` et certaines requetes SQL suppriment des donnees cibles avant rechargement.
- Le dossier source semble utiliser le nom `Yealy` dans plusieurs chemins ; verifier cette convention sur les donnees d'entree avant execution.

## Conclusion

Position officielle C5 :

- le serveur Linux Ziz reste portable pour l'exploitation normale
- les imports SWAT/MDB restent un outillage separe d'administration Windows
