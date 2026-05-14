# Archive

Date d’archivage initiale: 2026-05-13

Le dossier `archive/` contient les fichiers historiques, de secours ou de travail qui ne sont plus nécessaires dans le flux principal du projet, mais qui sont conservés pour traçabilité.

## Règles d’utilisation

- aucun fichier archivé ne doit être considéré comme source de vérité
- si un fichier archivé est encore requis par le code, il doit être replacé dans le projet principal
- les fichiers archivés servent à préserver l’historique sans polluer la structure active

## Structure

| Dossier | Usage |
|---|---|
| `old_components/` | anciens composants React remplacés |
| `old_pages/` | anciennes pages remplacées |
| `old_dashboards/` | anciens modules dashboard |
| `old_services/` | anciens services déplacés |
| `old_routes/` | anciennes routes API |
| `old_scripts/` | scripts obsolètes ou de validation |
| `deprecated/` | éléments dépréciés mais conservés |
| `backup_versions/` | copies de secours ou versions historiques |
| `unused_files/` | fichiers identifiés comme non utilisés |
| `legacy/` | anciens documents, scripts et artefacts historiques |

## Fichiers archivés actuellement

### backup_versions

| Fichier | Raison | État d’utilisation |
|---|---|---|
| `server.js` | ancienne entrée backend remplacée par `server.ts` / `dist/server.js` | non utilisé par le flux actuel |
| `root-package-lock.json` | artefact racine sans package.json associé | non utilisé |

### old_scripts

| Fichier | Raison | État d’utilisation |
|---|---|---|
| `check-structure.js` | script de contrôle ponctuel | non utilisé en production |
| `clean-rebuild.bat` | script manuel de nettoyage/rebuild | utilitaire historique |
| `test-db.js` | script de test ponctuel | non utilisé en production |
| `test-simple.js` | script de test ponctuel | non utilisé en production |

### deprecated

| Fichier | Raison | État d’utilisation |
|---|---|---|
| `06_1_Database synthese/` | doublon documentaire remplacé par `PROJECT_DOCUMENTATION/06_Database` | ne doit plus servir comme source principale |

### legacy

| Fichier | Raison | État d’utilisation |
|---|---|---|
| `backend.txt` | note de travail historique | non utilisé |
| `code a fournir.txt` | note de travail historique | non utilisé |
| `frontend-coeur API data.txt` | note d’analyse historique | non utilisé |
| `frontend-Écrans qui doivent consommer les séries.txt` | note de travail historique | non utilisé |
| `apiv1hydrostations.txt` | note de travail historique | non utilisé |
| `Wiring app.txt` | note de travail historique | non utilisé |
| `SYNTHESE_APP.md` | ancienne synthèse remplacée par `PROJECT_DOCUMENTATION` | non utilisé |
| `Dictionnaire_HD.xlsx` | document de référence historique remplacé par les docs projet/BD | non utilisé dans le flux actuel |
| `hydro_hd.sql` | ancien export SQL / sauvegarde historique | remplacé par `DATABASE_DOCUMENTATION` |
| `910_ref_properties_and_api_views.sql` | script historique | non utilisé par le build |
| `920_ref_modules_and_module_properties.sql` | script historique | non utilisé par le build |
| `930_api_v_catalog_module_properties.sql` | script historique | non utilisé par le build |
| `930_public_ts_catalog_views.sql` | script historique | non utilisé par le build |

## Méthode d’archivage

Les fichiers ont été déplacés uniquement après vérification de l’absence de référence directe dans le code actif.

## Remarque

Si un ancien fichier redevient utile, il peut être remis dans la structure principale après validation.
