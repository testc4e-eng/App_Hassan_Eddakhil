# Frontend

Le frontend est une application React 18 + Vite + TypeScript, structurée autour de pages, de modules dashboard et d’un ensemble de composants UI réutilisables. L’état métier repose sur des contexts et sur TanStack Query pour les appels réseau.

L’interface a deux grands usages:

- un espace public / connexion
- un espace métier avec dashboard, cartographie, scan et administration

La navigation est pensée pour être compacte mais riche: topbar, sidebar de modules, cartes analytiques, tableaux et modales d’agrandissement.

## Routes frontend observées

- `/`
- `/login`
- `/dashboard`
- `/contact`
- `/admin`
- `/admin/users`
- `/change-password`

## Blocs principaux

- Navbar et gestion de langue FR/EN
- DashboardSidebarV2 et navigation des modules
- charts Recharts, cartes Leaflet et tableaux analytiques
- pages admin et authentification
- scan de données et affichage des anomalies

## Patterns d’interface visibles

- cards réutilisables pour filtres, graphiques et statistiques
- tableaux avec tri, recherche et export CSV
- cartes Leaflet avec couches et légende
- modal d’agrandissement pour la lecture détaillée

## Répertoires utiles

| Répertoire | Usage |
|---|---|
| `src/pages` | pages routées |
| `src/components/dashboard/modules` | modules métier |
| `src/components/charts` | graphiques temps réel et comparatifs |
| `src/components/map` | carte et couches spatiales |
| `src/components/auth` | login, protection et gestion utilisateurs |
| `src/api`, `src/services` | accès API côté client |

## Flux frontend

| Étape | Description |
|---|---|
| 1 | chargement du provider de données |
| 2 | sélection d’un module métier |
| 3 | requête des runs / stations / propriétés |
| 4 | affichage du graphe et du tableau |
| 5 | export ou navigation vers d’autres vues |

## Ce qu’il faut retenir

- le frontend n’invente pas les données: il consomme l’API
- les composants analytiques sont réutilisables
- les pages admin et métier partagent le même design system
