# Project Overview

La plateforme Hydro-Data Intelligence est organisée autour d’une navigation publique, d’un dashboard métier et d’un espace administrateur. Les modules métier exploitent les mêmes sources de données avec des vues adaptées au besoin: climat, hydrologie, érosion, spatial, cartes, reporting et scan de données.

Le projet est pensé comme une plateforme de lecture et de pilotage. L’utilisateur choisit un contexte, un périmètre et un module, puis consulte des cartes, tableaux, graphiques et indicateurs cohérents.

## Vision globale

L’application réunit plusieurs besoins dans une seule interface:

- consulter des données hydrologiques et climatiques
- visualiser les objets spatiaux du bassin
- analyser les séries temporelles et leurs agrégations
- contrôler la disponibilité et la qualité des tables
- restreindre l’accès grâce à une authentification sécurisée

## Fonctionnalités principales

- authentification utilisateur et administration des comptes
- visualisation des dashboards analytiques
- cartographie spatiale du bassin et des stations
- consultation des séries temporelles
- export CSV et lecture tabulaire
- scan de données et détection d’anomalies
- sélection de mode projet ou mode brute dans la cartographie

## Pages visibles dans le routeur frontend

- `/`
- `/login`
- `/dashboard`
- `/contact`
- `/admin`
- `/admin/users`
- `/change-password`
- page NotFound en fallback

## Lecture fonctionnelle du produit

Le dashboard n’est pas seulement une suite d’écrans. Il propose:

- un point d’entrée public
- un espace de connexion et de sécurité
- un cockpit de données par module
- une zone d’administration
- une documentation de base de données séparée

## Modules applicatifs

| Module | Rôle |
|---|---|
| Suivi Climat | lecture des séries climatiques et tableaux associés |
| Suivi Hydrologique | suivi des données hydrologiques et des scénarios |
| Suivi érosion | lecture des sédiments / érosion et séries dérivées |
| Analyse Spatiale | couches géographiques et mode projet / brute |
| Gestion de données | exploration et contrôle des données |
| Scan de données | qualité, anomalies, relations et disponibilité |
| Rapport & Export | synthèse et sorties d’exploitation |

## Cas d’usage

- un analyste sélectionne une station et compare plusieurs variables
- un hydrologue contrôle la période réellement couverte par une série
- un responsable métier consulte le mode projet Hassan Addakhil
- un administrateur gère les comptes et l’accès
- un technicien exporte les tableaux pour un traitement complémentaire

## Résultat attendu

Le système doit fournir:

- une lecture rapide des données
- une navigation claire
- des filtres cohérents avec les données réelles
- des cartes et tableaux exploitables
- une base stable pour la présentation métier
