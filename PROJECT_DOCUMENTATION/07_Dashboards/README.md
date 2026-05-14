# Dashboards

Les dashboards constituent le cœur fonctionnel de la plateforme. La navigation latérale du dashboard regroupe les vues climat, hydrologie, érosion, spatial, données simulées, scan et reporting. Les cartes, tableaux et graphiques sont réutilisés dans plusieurs modules.

Le dashboard joue trois rôles:

- lecture rapide des données
- navigation analytique entre modules
- point de départ pour les exports et les contrôles

## Modules dashboard

| Module | Objectif | Données |
|---|---|---|
| Suivi Climat | lire les séries météo/climat | stations, runs, variables, périodes |
| Suivi Hydrologique | analyser les mesures hydrologiques | stations, séries, agrégations |
| Suivi érosion | suivre les indicateurs d’érosion et sédiments | séries SWAT et mesures simulées |
| Analyse Spatiale | comparer la donnée brute et le projet Hassan Addakhil | couches PostGIS et stations |
| Rapports & Export | synthèse et extraction | données agrégées et tableaux |

## Éléments communs

Chaque module analytique suit généralement la même logique:

1. sélection d’une station
2. sélection d’un scénario ou d’un run
3. choix d’une variable
4. définition de la période
5. lecture du graphe
6. lecture des statistiques
7. lecture du tableau
8. export éventuel

## Suivi Climat

But: analyser les variables climatiques par station.

Exemples d’affichage:

- graphique temporel
- statistiques sur la période sélectionnée
- tableau tabulaire filtrable
- export CSV

## Suivi Hydrologique

But: suivre les variables hydrologiques observées ou dérivées.

Points importants:

- cohérence de la granularité
- respect de la période réelle disponible
- support des agrégations

## Suivi érosion

But: suivre les données liées aux sédiments et à l’érosion.

Caractéristiques:

- séries simulées ou dérivées
- valeurs parfois très ponctuelles
- lecture graphique adaptée aux pics et aux faibles occurrences

## Analyse Spatiale

Le module spatial propose:

- le mode `Base de données brute`
- le mode `Projet Hassan Addakhil`

Dans le mode projet, la carte se concentre sur le périmètre métier du barrage et les couches utiles à l’analyse.

## Rapports & Export

Ce bloc sert à:

- récupérer des synthèses
- préparer un export CSV
- consolider une lecture exploitable en réunion ou en expertise

## Résultat attendu

Les dashboards doivent être:

- lisibles
- cohérents entre eux
- rapides à consulter
- suffisamment compacts pour éviter le scroll inutile
