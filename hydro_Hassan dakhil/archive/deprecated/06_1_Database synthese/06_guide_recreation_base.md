# Guide de recréation

1. Créer la base vide.
2. Activer les extensions dans l'ordre du script `01_create_extensions.sql`.
3. Créer les schémas.
4. Créer les séquences.
5. Créer les tables et tables étrangères.
6. Ajouter les contraintes et l'ownership des séquences.
7. Créer les index.
8. Créer les vues puis les vues matérialisées.
9. Créer les fonctions puis les triggers.

Vérifications recommandées:
- comparer la liste des schémas et objets avec `metadata.json`;
- contrôler les comptes de lignes;
- valider les dépendances FK avant injection de données;
- rafraîchir les vues matérialisées après chargement si nécessaire.