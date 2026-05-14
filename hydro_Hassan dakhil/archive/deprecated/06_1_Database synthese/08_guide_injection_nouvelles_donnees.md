# Guide d'injection de nouvelles données

- Charger d'abord les référentiels (`ref`) et les tables de sécurité (`auth`).
- Charger ensuite le noyau `core`, puis les enrichissements `geo` et `audit`.
- Terminer par les couches `api` et les vues matérialisées.
- Ne jamais insérer dans les vues, seulement dans les tables sources.
- Respecter l'ordre PK/FK pour les tables liées.
- Après import, recalculer les séquences si des identifiants explicites ont été insérés.
- Vérifier les colonnes géométriques via le SRID attendu avant import.