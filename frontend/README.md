# Frontend Hassan Addakhil

Application React/Vite du projet Hydro-Data Intelligence pour le barrage Hassan Addakhil.

## Role du frontend

Le frontend expose les principaux modules utilisateur :

- Analyse Spatiale
- Suivi Climat
- Suivi Hydrologique
- Sediments
- Gestion de donnee
- Scan de donnees
- Rapport & Export

Le point d'entree applicatif est `src/App.tsx`.

Le dashboard principal est monte depuis `src/pages/Dashboard.tsx`.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Router
- Recharts
- Leaflet
- i18next

## Scripts utiles

```powershell
npm install
npm run dev
npm run build
```

## Organisation utile

- `src/pages` : pages applicatives
- `src/components/dashboard` : structure dashboard et modules
- `src/components/charts` : composants graphiques mutualises
- `src/api` : clients HTTP frontend
- `src/contexts` : contexte auth et catalogue hydro
- `src/lib` : helpers, cache, export, transformations
- `src/i18n` : traductions

## Documentation associee

Pour la vue projet globale :

- [../../README.md](../../README.md)
- [../../docs/README.md](../../docs/README.md)
- [../../docs/PROJECT_BASELINE_2026-06-29.md](../../docs/PROJECT_BASELINE_2026-06-29.md)
- [../../docs/DASHBOARDS_DATA_MAPPING.md](../../docs/DASHBOARDS_DATA_MAPPING.md)

## Note

Ce fichier remplace le boilerplate Lovable initial afin de documenter l'application reelle telle qu'elle existe actuellement dans le depot.
