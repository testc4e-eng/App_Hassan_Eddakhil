# Points d'attention et risques

- La base dépend de `postgis` et `postgres_fdw`.
- `old_hd` est une couche de compatibilité vers une base distante, donc sa recréation exige des identifiants valides.
- Les vues matérialisées doivent être rafraîchies après recharge des tables sources.
- Les index spatiaux et les SRID doivent rester cohérents avec les colonnes géométriques.
- Les données existantes n'ont pas été modifiées durant l'analyse.
- En cas de duplication vers un autre projet, adapter les références FDW et les dictionnaires de domaines sans casser les contraintes.