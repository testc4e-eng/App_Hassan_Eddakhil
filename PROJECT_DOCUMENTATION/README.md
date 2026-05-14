# PROJECT_DOCUMENTATION

Documentation fonctionnelle et technique du projet **Hydro-Data Intelligence – Barrage Hassan Addakhil**.

Cette documentation est organisée par thèmes pour servir plusieurs publics :
- équipe métier
- développeurs
- administrateurs
- intégrateurs

## Navigation rapide

| Section | Contenu |
|---|---|
| [00_Introduction](./00_Introduction/README.md) | contexte, objectif et finalité métier |
| [01_Project_Overview](./01_Project_Overview/README.md) | vision d’ensemble et modules |
| [02_Global_Architecture](./02_Global_Architecture/README.md) | architecture applicative et flux |
| [03_Backend](./03_Backend/README.md) | structure Node.js/Express |
| [04_Frontend](./04_Frontend/README.md) | structure React/Vite |
| [05_APIs](./05_APIs/README.md) | inventaire des endpoints |
| [06_Database](./06_Database/README.md) | synthèse et référence vers la documentation BD |
| [07_Dashboards](./07_Dashboards/README.md) | modules dashboard |
| [08_Hydrological_Data](./08_Hydrological_Data/README.md) | données métier hydrologiques |
| [09_Analytics_Indicators](./09_Analytics_Indicators/README.md) | KPI, calculs et indicateurs |
| [10_Security](./10_Security/README.md) | authentification, rôles, protection |
| [11_Deployment](./11_Deployment/README.md) | installation et déploiement |
| [12_Error_Handling_Anomalies](./12_Error_Handling_Anomalies/README.md) | incidents, anomalies et solutions |
| [13_User_Guide](./13_User_Guide/README.md) | guide utilisateur |
| [14_Admin_Guide](./14_Admin_Guide/README.md) | guide administrateur |
| [15_Technical_Guide](./15_Technical_Guide/README.md) | guide développeur |
| [16_Project_Synthesis](./16_Project_Synthesis/README.md) | synthèse stratégique |

## Référence base de données

La documentation SQL détaillée, les exports de schéma et la backup PostgreSQL sont maintenus dans :

- [DATABASE_DOCUMENTATION](../DATABASE_DOCUMENTATION/README.md)

## Périmètre observé dans le code

- Frontend React 18 + Vite + TypeScript
- Backend Node.js + Express + TypeScript
- PostgreSQL + PostGIS
- Authentification JWT
- Dashboards climat, hydrologie, érosion, spatial, reporting, scan de données

## Remarque de maintenance

Cette documentation est conçue pour être maintenable. Lors d’une évolution majeure :
1. mettre à jour le code
2. régénérer ou compléter la page concernée
3. vérifier la cohérence avec la documentation BD
