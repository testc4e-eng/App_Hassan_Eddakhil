# Analytics & Indicators

Les indicateurs présents dans l’application servent à résumer une série temporelle ou un ensemble de séries. Ils sont utilisés dans les cartes statistiques, le tableau et certains exports.

## Indicateurs courants

- minimum
- maximum
- moyenne
- somme
- nombre de valeurs
- valeurs manquantes
- période couverte
- fréquence dominante

## Modes analytiques disponibles dans les graphes

- Normal
- Logarithmique
- FDC (Flow Duration Curve)

## Exemples de calcul

| Indicateur | Définition |
|---|---|
| Min | plus petite valeur numérique valide |
| Max | plus grande valeur numérique valide |
| Moyenne | somme des valeurs / nombre de valeurs valides |
| Valeurs manquantes | total de points sans valeur exploitable |

## Lecture des cartes statistiques

Les petites cartes au-dessus du tableau ou sous les graphiques résument généralement:

- le nombre de valeurs disponibles
- le minimum
- le maximum
- la moyenne
- la somme
- le nombre de valeurs manquantes

## Interprétation

Un bon indicateur doit toujours être interprété avec:

- la station active
- la variable choisie
- la période filtrée
- le mode d’agrégation

## Utilité

- accélérer la lecture métier
- détecter rapidement les ordres de grandeur
- guider l’utilisateur vers les périodes ou stations les plus pertinentes
