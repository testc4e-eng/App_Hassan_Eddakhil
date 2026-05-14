# Hydrological Data

Le projet manipule des données hydrologiques et climatiques à granularité variable. Les séries peuvent être journalières, mensuelles ou annuelles selon la source. Le front respecte la granularité réelle détectée afin d’éviter l’invention de points non présents dans la base.

## Objets métier

- stations hydrologiques
- bassins et sous-bassins
- réservoirs / barrages
- timeseries et measurements
- runs / scénarios / modules

## Variables fréquentes observées

- précipitation
- température
- humidité relative
- évaporation
- débit
- sédiments / érosion

## Lecture métier

| Élément | Lecture |
|---|---|
| Fréquence | journalière, mensuelle ou annuelle selon la série |
| Unités | mm, m3/s, %, tonnes, etc. selon la variable |
| Interprétation | suivi opérationnel, comparaison, détection d’anomalies |

## Points d’attention

- toujours vérifier la station et le run actifs
- ne pas supposer une fréquence si elle n’est pas détectée
- conserver les bornes réelles de disponibilité
- documenter les variables métier ajoutées plus tard

## Utilité métier

- lecture de l’évolution dans le temps
- comparaison entre stations
- préparation d’analyses de crue, sécheresse ou tendances
- support pour les rapports internes
