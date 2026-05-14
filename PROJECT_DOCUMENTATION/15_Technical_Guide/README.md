# Technical Guide

Ce guide s’adresse aux développeurs qui veulent faire évoluer la plateforme sans casser les contrats existants.

## Structure utile

- `frontend/src/pages` pour les routes
- `frontend/src/components/dashboard/modules` pour les modules métier
- `frontend/src/components/map` pour la cartographie
- `frontend/src/api` pour les appels réseau
- `backend/src/routes` pour les routes HTTP
- `backend/src/controllers` pour l’orchestration
- `backend/src/services` pour le SQL et la logique métier

## Ajouter une fonctionnalité

1. identifier le besoin métier
2. vérifier les données disponibles
3. ajouter ou ajuster le service backend
4. exposer la route API
5. consommer la route côté frontend
6. documenter le changement

## Bonnes pratiques

- ne pas casser l’enveloppe JSON des API
- garder les types synchronisés entre front et back
- vérifier les filtres de date et les granularités
- réutiliser les composants UI existants
- privilégier les services métier plutôt que les requêtes dispersées dans les composants

## Points sensibles

- auth et gestion des rôles
- bornes réelles des séries temporelles
- cohérence du mode projet spatial
- export CSV et pagination
- robustesse des graphiques Recharts
