# RISQUES_ET_GARDE_FOUS

## Risques techniques majeurs

1. SRID source non strict / geometadonnees inconsistantes.
2. Colonnes de mesures en texte (mensuel + lachers) -> conversion numerique fragile.
3. Ambiguite d'unites (`volumr_mm3`, flux lachers).
4. Doubles insertions si absence de cle metier explicite.
5. Non-regression: vues `public.*` et `api.*` consomment `core.*`.
6. Dependance FDW `old_hd_srv` potentiellement indisponible.

## Garde-fous imposes

- Mode `dry-run` obligatoire avant `commit`.
- Journalisation par lot: `load_batch_id`, timestamps, compteurs.
- Idempotence:
- dimension: `INSERT ... WHERE NOT EXISTS` sur codes metier.
- faits: hash cle fonctionnelle (station/property/time_step/date/source) et anti-duplication.
- Controle geometrique:
- validite (`ST_IsValid`)
- SRID detecte
- transformation conditionnelle vers 4326
- Parse numerique defensif:
- regex + cast securise (`NULL` si invalide)
- rejet/trace des lignes non conformes.

## Regles de non-destruction

- Aucun `DROP`.
- Aucun `TRUNCATE`.
- Aucun `DELETE` massif.
- Aucun `ALTER` destructif sur tables existantes.
- Ecritures limitees a `staging` puis `INSERT` cible en anti-collision.

## Politique d'echec

- Erreur bloquante:
- structure cible manquante critique,
- > seuil d'erreurs de parsing,
- FK metier massivement orphelines,
- geometries massivement invalides.

- Erreur non bloquante:
- valeurs ponctuelles aberrantes,
- geometriques invalides isolees,
- champs source non mappes secondaires.

## Auditabilite

- Fichiers:
- inventaire JSON (`00_inventory`)
- logs ETL (stdout + table log staging)
- rapports markdown (`07_reports`)
- checks SQL (`06_quality_checks`)

- Comparaison avant/apres:
- compte source vs staging vs cible par table/metrique.

