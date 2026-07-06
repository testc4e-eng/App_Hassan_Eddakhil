# Rapport d'audit comparatif — SWATOutput.mdb vs base de données
Date : 2026-07-03
## Résumé exécutif
- **scenario_1 à scenario_4** : les fichiers Daily (198 930 lignes/sub et rch, 19 entités, 1995-2023) ne sont PAS encore en base. Les Yearly le sont déjà (551 lignes).
- **ssp126, ssp245, ssp585** : Daily, Monthly et Yearly semblent déjà en base, mais avec des incohérences de dénomination (les lignes 'monthly'/'yearly' en base portent des dates quotidiennes).
- **etat_actuel** : source non localisée dans `Modèle Bge HAD`.
- Aucune donnée en base ne dépasse 19 entités.

## Tableau comparatif détaillé
| Scénario | Agrégation | Table | Lignes MDB | Distinct SUB MDB | Lignes DB | Distinct SUB DB | Statut |
|----------|------------|-------|------------|------------------|-----------|-----------------|--------|
| ssp126 | Daily | sub | 145,730 | 19 | 344,660 | 19 | DIFFERENT |
| ssp126 | Daily | rch | 145,730 | 19 | 344,660 | 19 | DIFFERENT |
| ssp126 | Monthly | sub | 4,788 | 19 | 203,718 | 19 | DIFFERENT |
| ssp126 | Monthly | rch | 4,788 | 19 | 203,718 | 19 | DIFFERENT |
| ssp126 | Yearly | sub | 399 | 19 | 199,329 | 19 | DIFFERENT |
| ssp126 | Yearly | rch | 399 | 19 | 199,329 | 19 | DIFFERENT |
| ssp245 | Daily | sub | 145,730 | 19 | 344,660 | 19 | DIFFERENT |
| ssp245 | Daily | rch | 145,730 | 19 | 344,660 | 19 | DIFFERENT |
| ssp245 | Monthly | sub | 4,788 | 19 | 203,718 | 19 | DIFFERENT |
| ssp245 | Monthly | rch | 4,788 | 19 | 203,718 | 19 | DIFFERENT |
| ssp245 | Yearly | sub | 399 | 19 | 199,329 | 19 | DIFFERENT |
| ssp245 | Yearly | rch | 399 | 19 | 199,329 | 19 | DIFFERENT |
| ssp585 | Daily | sub | 145,730 | 19 | 344,660 | 19 | DIFFERENT |
| ssp585 | Daily | rch | 145,730 | 19 | 344,660 | 19 | DIFFERENT |
| ssp585 | Monthly | sub | 4,788 | 19 | 203,718 | 19 | DIFFERENT |
| ssp585 | Monthly | rch | 4,788 | 19 | 203,718 | 19 | DIFFERENT |
| ssp585 | Yearly | sub | 399 | 19 | 199,329 | 19 | DIFFERENT |
| ssp585 | Yearly | rch | 399 | 19 | 199,329 | 19 | DIFFERENT |
| scenario_1 | Daily | sub | 198,930 | 19 | 0 | 0 | MANQUANT |
| scenario_1 | Daily | rch | 198,930 | 19 | 0 | 0 | MANQUANT |
| scenario_1 | Yearly | sub | 551 | 19 | 551 | 19 | OK |
| scenario_1 | Yearly | rch | 551 | 19 | 551 | 19 | OK |
| scenario_2 | Daily | sub | 198,930 | 19 | 0 | 0 | MANQUANT |
| scenario_2 | Daily | rch | 198,930 | 19 | 0 | 0 | MANQUANT |
| scenario_2 | Yearly | sub | 551 | 19 | 551 | 19 | OK |
| scenario_2 | Yearly | rch | 551 | 19 | 551 | 19 | OK |
| scenario_3 | Daily | sub | 198,930 | 19 | 0 | 0 | MANQUANT |
| scenario_3 | Daily | rch | 198,930 | 19 | 0 | 0 | MANQUANT |
| scenario_3 | Yearly | sub | 551 | 19 | 551 | 19 | OK |
| scenario_3 | Yearly | rch | 551 | 19 | 551 | 19 | OK |
| scenario_4 | Daily | sub | 198,930 | 19 | 0 | 0 | MANQUANT |
| scenario_4 | Daily | rch | 198,930 | 19 | 0 | 0 | MANQUANT |
| scenario_4 | Yearly | sub | 551 | 19 | 551 | 19 | OK |
| scenario_4 | Yearly | rch | 551 | 19 | 551 | 19 | OK |


## Notes complémentaires

### Scénarios SSP (ssp126, ssp245, ssp585)
Les fichiers `SWATOutput.mdb` trouvés dans `Modèle Bge HAD` couvrent uniquement la période **2039-2059** :
- Daily : 145 730 lignes = 19 sous-bassins × 7 670 jours
- Monthly : 4 788 lignes
- Yearly : 399 lignes

Or, la base contient pour les SSP une période **1995-2059** :
- Daily : 344 660 lignes
- Monthly : 203 718 lignes
- Yearly : 199 329 lignes

**Conséquence** : les données SSP actuellement en base ne proviennent **pas** des fichiers `SWATOutput.mdb` audités dans `Modèle Bge HAD`. Elles proviennent probablement d'un autre jeu de fichiers (période complète 1995-2059). Il ne faut donc pas réimprimer les SSP depuis `Modèle Bge HAD` sans validation métier.

### Scénarios de reboisement (scenario_1-4)
Les fichiers Daily et Yearly ont la même période couverte (1995-2023) et le même nombre de sous-bassins (19). Les Yearly sont déjà en base. Seuls les Daily sont manquants.

### etat_actuel
Aucun fichier source identifié dans `Modèle Bge HAD`. Les données en base (1995-2023) proviennent d'une source externe non encore localisée.

## Conclusion et actions recommandées
1. **Ingestion prioritaire** : importer les 4 fichiers Daily de `scenario_1` à `scenario_4`.
2. **Pas de réingestion** : ne pas réimporter les Yearly de scenario_1-4 ni les données SSP/etat_actuel.
3. **Investigation SSP** : les counts DB différents des counts MDB pour Monthly/Yearly SSP nécessitent une vérification (les DB rows 'monthly'/'yearly' semblent être des daily étiquetés).
4. **Source etat_actuel** : localiser le dossier source réel avant toute action.
