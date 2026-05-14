# Error Handling & Anomalies

Cette section regroupe les problèmes observables et les solutions appliquées ou recommandées. Elle aide à diagnostiquer les écarts entre données réelles, rendu graphique et comportement API.

## Anomalies récurrentes

| Symptôme | Cause probable | Solution |
|---|---|---|
| Login 400 | email ou mot de passe invalide | vérifier les identifiants seedés |
| 401 sur route privée | token absent ou expiré | se reconnecter / renouveler la session |
| Date 1900 affichée | bornes de période non recalées | interroger `/date-range` |
| Graphique tronqué | conteneur sans hauteur explicite | fixer la hauteur et les marges Recharts |
| 500 spatial projet | requête SQL ou collection indéfinie | corriger la requête et les propriétés |
| CORS refusé | origine non listée | ajuster `CORS_ORIGIN` |

## Signaux à surveiller

- période vide alors que des données existent
- tableau plus long que le graphe associé
- station sans données dans un module donné
- différence entre compteur et série affichée
- erreurs console sur les composants UI

## Démarche de diagnostic

1. vérifier l’URL appelée par le frontend
2. regarder le statut HTTP
3. contrôler la réponse JSON
4. comparer la station, la variable et la période
5. vérifier la disponibilité réelle en base
6. relire la console backend si nécessaire

## Recommandation

Avant de corriger l’interface, il faut toujours vérifier:

- que les données existent réellement
- que la route API renvoie bien le bon périmètre
- que le front n’interpole pas artificiellement
