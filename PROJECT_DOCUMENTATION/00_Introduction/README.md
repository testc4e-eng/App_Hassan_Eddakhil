# Introduction

Hydro-Data Intelligence est une plateforme web de supervision et d’analyse autour du barrage Hassan Addakhil. Elle centralise des données hydrologiques, climatiques, spatiales et analytiques dans une interface unique pour faciliter la lecture métier, la consultation technique et le pilotage scientifique.

Le projet répond à un besoin concret: consolider des séries temporelles et des objets géographiques hétérogènes dans un cockpit lisible, avec des filtres, cartes et indicateurs adaptés aux usages métier.

## Contexte général

Le projet est centré sur le barrage Hassan Addakhil et son bassin versant. Dans la pratique, les équipes ont besoin de:

- suivre l’évolution des données par station
- comparer plusieurs scénarios ou modèles
- lire rapidement les périodes couvertes par les séries
- visualiser les objets spatiaux associés au bassin
- distinguer les données réelles, simulées et les données projet

La plateforme rassemble ces usages dans un même espace de travail.

## Finalité métier

- suivre les stations hydrologiques et climatologiques du périmètre Hassan Addakhil
- visualiser les séries temporelles et leurs agrégations
- naviguer dans les objets spatiaux du bassin versant
- contrôler la qualité et la disponibilité des données
- sécuriser l’accès aux fonctions administratives
- fournir une base stable pour les présentations métier et scientifiques

## Questions auxquelles la plateforme répond

- quelles stations possèdent des données exploitables?
- quelles variables sont disponibles par station?
- quelle période est réellement couverte?
- les données sont-elles journalières, mensuelles ou annuelles?
- quelles sont les valeurs min, max, moyenne et la somme?
- quels objets spatiaux appartiennent au projet Hassan Addakhil?

## Intérêt pour la gestion hydrologique

- réduction du temps d’analyse
- lecture unifiée des données observées et simulées
- visualisation des périodes réellement couvertes
- aide à la comparaison entre stations, scénarios et variables
- meilleure compréhension du périmètre hydrologique du barrage
- possibilité de préparer des exports lisibles pour le partage interne

## Public cible

- ingénieurs hydrologues
- analystes SIG / spatial
- responsables métier
- administrateurs de la plateforme
- développeurs et mainteneurs

## Ce que l’application met en avant

- des dashboards orientés lecture rapide
- des cartes interactives
- des tableaux triables et exportables
- des filtres station / scénario / variable / période
- un mode projet dédié à Hassan Addakhil
- un mode administrateur pour la gestion des comptes

## Socle technique observé

| Couche | Technologie |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Base de données | PostgreSQL, PostGIS |
| Sécurité | JWT, bcrypt, helmet, cors, rate limiting |
| Analytique | TanStack Query, Recharts, React Router |

## Limites du périmètre documenté

Cette documentation décrit ce qui est visible dans le code et dans la base actuelle. Elle ne suppose pas:

- un moteur de calcul métier non observé
- un workflow d’approbation complexe
- une gestion multi-projet générique au-delà du mode projet spatial décrit
- une couche de prédiction ou d’intelligence artificielle non présente dans le repo

## Valeur ajoutée attendue

La plateforme doit permettre de:

- gagner du temps dans l’analyse
- garder la cohérence entre les écrans et la base
- fournir un socle fiable pour les démonstrations
- préparer la lecture scientifique et le reporting métier

## Socle d’intégration

La documentation projet renvoie aussi vers la documentation SQL séparée dans `DATABASE_DOCUMENTATION`, qui reste la source de vérité pour le modèle relationnel et les scripts de recréation.
