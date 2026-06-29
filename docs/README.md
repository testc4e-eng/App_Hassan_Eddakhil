# Documentation Projet

Cette documentation a ete reorganisee pour distinguer clairement :

- la documentation de reference du projet ;
- la cartographie technique detaillee ;
- les rapports historiques lies a des corrections ou audits ponctuels.

## Point d'entree recommande

Commencer par :

- [../README.md](../README.md) : vue d'ensemble du depot
- [PROJECT_BASELINE_2026-06-29.md](PROJECT_BASELINE_2026-06-29.md) : baseline fonctionnelle et technique actuelle

## Documentation de reference

- [PROJECT_BASELINE_2026-06-29.md](PROJECT_BASELINE_2026-06-29.md)
  Role : reference synthese de l'etat courant du projet au 29 juin 2026.

- [DASHBOARDS_DATA_MAPPING.md](DASHBOARDS_DATA_MAPPING.md)
  Role : cartographie detaillee des dashboards vers les composants frontend, endpoints API, services backend et objets SQL confirmes dans le code.

## Rapports historiques

Ces documents restent utiles, mais doivent etre lus comme des rapports de travail dates et non comme la source unique de verite.

- [ANALYSE_ENVASEMENT_HASSAN_ADDAKHIL.md](ANALYSE_ENVASEMENT_HASSAN_ADDAKHIL.md)
- [RAPPORT_IMPLEMENTATION_ENVASEMENT_HASSAN_ADDAKHIL.md](RAPPORT_IMPLEMENTATION_ENVASEMENT_HASSAN_ADDAKHIL.md)
- [RAPPORT_AUDIT_SYLDT_HA_DEGRADATION_SPECIFIQUE_20260625.md](RAPPORT_AUDIT_SYLDT_HA_DEGRADATION_SPECIFIQUE_20260625.md)
- [RAPPORT_CORRECTION_SUBBASINS_19_HASSAN_ADDAKHIL.md](RAPPORT_CORRECTION_SUBBASINS_19_HASSAN_ADDAKHIL.md)
- [RAPPORT_REFACTORING_MODULE_SEDIMENTS_20260625.md](RAPPORT_REFACTORING_MODULE_SEDIMENTS_20260625.md)
- [RAPPORT_TEST_GLOBAL_APPLICATION_20260625.md](RAPPORT_TEST_GLOBAL_APPLICATION_20260625.md)
- [ANALYSE_ET_PLAN_IMPLEMENTATION_CARTO_2026-06-19.md](ANALYSE_ET_PLAN_IMPLEMENTATION_CARTO_2026-06-19.md)

## Regles de maintenance

- Mettre a jour `PROJECT_BASELINE_*.md` quand les modules actifs, l'architecture runtime ou les domaines de donnees evoluent.
- Mettre a jour `DASHBOARDS_DATA_MAPPING.md` quand un dashboard change de composants, d'API, de services ou de sources SQL.
- Conserver les rapports historiques, mais eviter d'y ajouter des informations qui devraient vivre dans la baseline ou dans la cartographie des dashboards.
