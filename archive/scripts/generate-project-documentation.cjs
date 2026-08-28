const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const outDir = path.join(repoRoot, "PROJECT_DOCUMENTATION");
const dbDocsDir = path.join(repoRoot, "DATABASE_DOCUMENTATION");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(relPath, content) {
  const absPath = path.join(outDir, relPath);
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, `${content.trimEnd()}\n`, "utf8");
}

function sectionDoc({ title, intro, bullets = [], tables = [], mermaid = [] }) {
  const parts = [`# ${title}`, "", intro.trim()];

  for (const block of bullets) {
    parts.push("", `## ${block.title}`);
    if (block.note) parts.push("", block.note.trim());
    if (block.items?.length) {
      parts.push("");
      for (const item of block.items) parts.push(`- ${item}`);
    }
  }

  for (const table of tables) {
    parts.push("", `## ${table.title}`);
    if (table.note) parts.push("", table.note.trim());
    const header = table.header.trim();
    const columnCount = header
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean).length;
    const separator =
      columnCount > 0
        ? `|${Array.from({ length: columnCount }, () => "---").join("|")}|`
        : "";
    parts.push("", header, separator, table.rows.join("\n"));
  }

  for (const diagram of mermaid) {
    parts.push("", `## ${diagram.title}`, "", "```mermaid", diagram.code.trim(), "```");
  }

  return parts.join("\n");
}

const rootReadme = `# PROJECT_DOCUMENTATION

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
`;

const introDoc = sectionDoc({
  title: "Introduction",
  intro: `
Hydro-Data Intelligence est une plateforme web de supervision et d’analyse autour du barrage Hassan Addakhil. Elle centralise des données hydrologiques, climatiques, spatiales et analytiques dans une interface unique pour faciliter la lecture métier, la consultation technique et le pilotage scientifique.

Le projet répond à un besoin concret : consolider des séries temporelles et des objets géographiques hétérogènes dans un cockpit lisible, avec des filtres, cartes et indicateurs adaptés aux usages métier.
`,
  bullets: [
    {
      title: "Finalité métier",
      items: [
        "suivre les stations hydrologiques et climatologiques du périmètre Hassan Addakhil",
        "visualiser les séries temporelles et leurs agrégations",
        "naviguer dans les objets spatiaux du bassin versant",
        "contrôler la qualité et la disponibilité des données",
        "sécuriser l’accès aux fonctions administratives",
      ],
    },
    {
      title: "Intérêt pour la gestion hydrologique",
      items: [
        "réduction du temps d’analyse",
        "lecture unifiée des données observées et simulées",
        "visualisation des périodes réellement couvertes",
        "aide à la comparaison entre stations, scénarios et variables",
      ],
    },
  ],
  tables: [
    {
      title: "Socle technique observé",
      header: "| Couche | Technologie |",
      rows: [
        "| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |",
        "| Backend | Node.js, Express, TypeScript |",
        "| Base de données | PostgreSQL, PostGIS |",
        "| Sécurité | JWT, bcrypt, helmet, cors, rate limiting |",
        "| Analytique | TanStack Query, Recharts, React Router |",
      ],
    },
  ],
});

const overviewDoc = sectionDoc({
  title: "Project Overview",
  intro: `
La plateforme est organisée autour d’une navigation publique, d’un dashboard métier et d’un espace administrateur. Les modules métier exploitent les mêmes sources de données avec des vues adaptées au besoin : climat, hydrologie, érosion, spatial, cartes, reporting et scan de données.
`,
  bullets: [
    {
      title: "Fonctionnalités principales",
      items: [
        "authentification utilisateur et administration des comptes",
        "visualisation des dashboards analytiques",
        "cartographie spatiale du bassin et des stations",
        "consultation des séries temporelles",
        "export CSV et lecture tabulaire",
        "scan de données et détection d’anomalies",
      ],
    },
    {
      title: "Pages visibles dans le routeur frontend",
      items: [
        "/, /login, /dashboard, /contact",
        "/admin, /admin/users, /change-password",
        "page NotFound en fallback",
      ],
    },
  ],
  tables: [
    {
      title: "Modules applicatifs",
      header: "| Module | Rôle |",
      rows: [
        "| Suivi Climat | lecture des séries climatiques et tableaux associés |",
        "| Suivi Hydrologique | suivi des données hydrologiques et des scénarios |",
        "| Suivi érosion | lecture des sédiments / érosion et séries dérivées |",
        "| Analyse Spatiale | couches géographiques et mode projet / brute |",
        "| Gestion de données | exploration et contrôle des données |",
        "| Scan de données | qualité, anomalies, relations et disponibilité |",
        "| Rapport & Export | synthèse et sorties d’exploitation |",
      ],
    },
  ],
});

const architectureDoc = sectionDoc({
  title: "Global Architecture",
  intro: `
L’architecture est de type client-serveur. Le frontend récupère les données depuis une API REST. Le backend interroge PostgreSQL/PostGIS et normalise les réponses au format JSON. Les couches métier (stations, timeseries, cartes, indicateurs) sont traitées via des services dédiés.
`,
  mermaid: [
    {
      title: "Flux principal",
      code: `
flowchart LR
  U[Utilisateur] --> F[Frontend React/Vite]
  F --> A[API Node.js / Express]
  A --> S[Services métier]
  S --> P[(PostgreSQL / PostGIS)]
  P --> S
  S --> A
  A --> F
`,
    },
    {
      title: "Chaîne backend",
      code: `
flowchart LR
  R[Route] --> C[Controller]
  C --> V[Validation / Middleware]
  V --> S[Service]
  S --> D[(DatabaseService / pg)]
`,
    },
  ],
  tables: [
    {
      title: "Couches d’architecture",
      header: "| Couche | Détail |",
      rows: [
        "| Présentation | React, router, context, composants UI |",
        "| API | Express, controllers, routes, middlewares |",
        "| Métier | services hydro, spatial, auth, scan, auth admin |",
        "| Données | PostgreSQL, PostGIS, vues, tables, matérialisées |",
      ],
    },
  ],
});

const backendDoc = sectionDoc({
  title: "Backend",
  intro: `
Le backend est structuré autour d’Express en TypeScript. La logique suit un découpage lisible : routes -> controllers -> services -> base de données. Le serveur applique une couche de sécurité, de compression et de limitation de débit.
`,
  bullets: [
    {
      title: "Organisation du code",
      items: [
        "config : base de données et JWT",
        "controllers : orchestration HTTP",
        "services : logique métier et SQL",
        "routes : exposition REST",
        "middleware : auth, validation, erreurs",
        "types / schemas / utils : typage et aide technique",
      ],
    },
    {
      title: "Sécurité backend",
      items: [
        "helmet et cors configurés dans app.ts",
        "rate limiting sur le préfixe /api",
        "authentification JWT sur les routes protégées",
        "bcrypt pour le stockage des mots de passe",
        "validation zod sur les entrées sensibles",
      ],
    },
  ],
  tables: [
    {
      title: "Entrées majeures du backend",
      header: "| Fichier | Rôle |",
      rows: [
        "| src/app.ts | composition des middlewares et montage des routes |",
        "| src/config/database.config.ts | connexion PostgreSQL via pg |",
        "| src/config/jwt.config.ts | signature et vérification des tokens |",
        "| src/middleware/auth.ts | vérification token et rôle |",
        "| src/services/*.ts | logique métier et SQL |",
      ],
    },
  ],
});

const frontendDoc = sectionDoc({
  title: "Frontend",
  intro: `
Le frontend est une application React 18 + Vite + TypeScript, structurée autour de pages, de modules dashboard et d’un ensemble de composants UI réutilisables. L’état métier repose sur des contexts et sur TanStack Query pour les appels réseau.
`,
  bullets: [
    {
      title: "Routes frontend observées",
      items: [
        "/", "/login", "/dashboard", "/contact",
        "/admin", "/admin/users", "/change-password",
      ],
    },
    {
      title: "Blocs principaux",
      items: [
        "Navbar et gestion de langue FR/EN",
        "DashboardSidebarV2 et navigation des modules",
        "charts Recharts, cartes Leaflet et tableaux analytiques",
        "pages admin et authentification",
        "scan de données et affichage des anomalies",
      ],
    },
  ],
  tables: [
    {
      title: "Répertoires utiles",
      header: "| Répertoire | Usage |",
      rows: [
        "| src/pages | pages routées |",
        "| src/components/dashboard/modules | modules métier |",
        "| src/components/charts | graphiques temps réel et comparatifs |",
        "| src/components/map | carte et couches spatiales |",
        "| src/components/auth | login, protection et gestion utilisateurs |",
        "| src/api, src/services | accès API côté client |",
      ],
    },
  ],
});

const apiDoc = sectionDoc({
  title: "APIs",
  intro: `
Les APIs sont exposées sous des préfixes clairs. Les réponses suivent majoritairement un enveloppement JSON de type success/data/error. La documentation ci-dessous reprend les endpoints effectivement présents dans le code.
`,
  tables: [
    {
      title: "Vue d’ensemble des groupes d’API",
      header: "| Groupe | Préfixe | Usage |",
      rows: [
        "| hydro | /api/v1/hydro | stations, catchments, series, statistiques, modèles |",
        "| timeseries | /api/v1/timeseries | catalogue, date-range, bundle, agrégation |",
        "| catalog | /api/v1/catalog | runs, propriétés, stations, catalogue enrichi |",
        "| catalog availability | /api/v1/catalog/availability | disponibilité par module |",
        "| spatial | /api/v1/spatial | bassins, sous-bassins, reaches, stations, projet |",
        "| maps | /api/v1/maps | valeurs des stations pour cartographie |",
        "| access | /api/v1/access | scan de données, tables, entités, stats |",
        "| swat | /api/v1/hydro/swat | import et lecture SWAT |",
        "| solid-yield | /api/v1/solid-yield | sous-bassins, disponibilité, stats |",
        "| auth | /api/auth | login, me, change-password, logout |",
        "| admin | /api/admin | gestion des utilisateurs |",
      ],
    },
    {
      title: "Endpoints clés",
      header: "| Endpoint | Méthode | Rôle |",
      rows: [
        "| /api/auth/login | POST | authentifier un utilisateur |",
        "| /api/auth/me | GET | profil connecté |",
        "| /api/auth/change-password | POST | changer son mot de passe |",
        "| /api/admin/users | GET/POST | lister et créer des comptes |",
        "| /api/v1/timeseries/date-range | GET | bornes réelles d’une série |",
        "| /api/v1/timeseries/bundle | GET | catalogue + stats + fenêtre |",
        "| /api/v1/spatial/project-hassan-addakhil | GET | mode projet spatial |",
        "| /api/v1/data-scan/summary | GET | résumé qualité des données |",
      ],
    },
  ],
});

const dbDoc = sectionDoc({
  title: "Database",
  intro: `
La documentation SQL détaillée n’est pas réécrite ici. Elle est maintenue dans le dossier racine ` + "`DATABASE_DOCUMENTATION`" + `, qui contient le schéma reconstruit, les scripts SQL et la backup PostgreSQL du projet. Cette section sert d’index métier et technique.
`,
  bullets: [
    {
      title: "Référence principale",
      items: [
        "[DATABASE_DOCUMENTATION](../../DATABASE_DOCUMENTATION/README.md)",
        "backup PostgreSQL du projet dans DATABASE_DOCUMENTATION/backup",
        "schémas observés : public, access, api, audit, auth, core, geo, gis, ref, staging, old_hd",
      ],
    },
    {
      title: "Relations métier majeures",
      items: [
        "stations -> timeseries -> measurements",
        "runs / scenarios -> catalogue des séries",
        "catchments / subbasins / reaches / reservoirs -> spatial",
      ],
    },
  ],
  tables: [
    {
      title: "Fichiers de référence disponibles",
      header: "| Fichier | Contenu |",
      rows: [
        "| DATABASE_DOCUMENTATION/01_resume_global_base.md | résumé global |",
        "| DATABASE_DOCUMENTATION/03_dictionnaire_donnees.md | dictionnaire de données |",
        "| DATABASE_DOCUMENTATION/04_relations_pk_fk.md | relations et clés |",
        "| DATABASE_DOCUMENTATION/05_inventaire_tables_et_vues.md | inventaire des objets |",
        "| DATABASE_DOCUMENTATION/sql_recreation/* | scripts de recréation |",
        "| DATABASE_DOCUMENTATION/backup/*.backup | sauvegarde PostgreSQL |",
      ],
    },
  ],
});

const dashboardsDoc = sectionDoc({
  title: "Dashboards",
  intro: `
Les dashboards constituent le cœur fonctionnel de la plateforme. La navigation latérale du dashboard regroupe les vues climat, hydrologie, érosion, spatial, données simulées, scan et reporting. Les cartes, tableaux et graphiques sont réutilisés dans plusieurs modules.
`,
  tables: [
    {
      title: "Modules dashboard",
      header: "| Module | Objectif | Données |",
      rows: [
        "| Suivi Climat | lire les séries météo/climat | stations, runs, variables, périodes |",
        "| Suivi Hydrologique | analyser les mesures hydrologiques | stations, séries, agrégations |",
        "| Suivi érosion | suivre les indicateurs d’érosion et sédiments | séries SWAT et mesures simulées |",
        "| Analyse Spatiale | comparer la donnée brute et le projet Hassan Addakhil | couches PostGIS et stations |",
        "| Rapports & Export | synthèse et extraction | données agrégées et tableaux |",
      ],
    },
  ],
});

const hydroDataDoc = sectionDoc({
  title: "Hydrological Data",
  intro: `
Le projet manipule des données hydrologiques et climatiques à granularité variable. Les séries peuvent être journalières, mensuelles ou annuelles selon la source. Le front respecte la granularité réelle détectée afin d’éviter l’invention de points non présents dans la base.
`,
  bullets: [
    {
      title: "Objets métier",
      items: [
        "stations hydrologiques",
        "bassins et sous-bassins",
        "réservoirs / barrages",
        "timeseries et measurements",
        "runs / scénarios / modules",
      ],
    },
    {
      title: "Variables fréquentes observées",
      items: [
        "précipitation",
        "température",
        "humidité relative",
        "évaporation",
        "débit",
        "sédiments / érosion",
      ],
    },
  ],
  tables: [
    {
      title: "Lecture métier",
      header: "| Élément | Lecture |",
      rows: [
        "| Fréquence | journalière, mensuelle ou annuelle selon la série |",
        "| Unités | mm, m3/s, %, tonnes, etc. selon la variable |",
        "| Interprétation | suivi opérationnel, comparaison, détection d’anomalies |",
      ],
    },
  ],
});

const analyticsDoc = sectionDoc({
  title: "Analytics & Indicators",
  intro: `
Les indicateurs présents dans l’application servent à résumer une série temporelle ou un ensemble de séries. Ils sont utilisés dans les cartes statistiques, le tableau et certains exports.
`,
  bullets: [
    {
      title: "Indicateurs courants",
      items: [
        "minimum",
        "maximum",
        "moyenne",
        "somme",
        "nombre de valeurs",
        "valeurs manquantes",
        "période couverte",
        "fréquence dominante",
      ],
    },
    {
      title: "Modes analytiques disponibles dans les graphes",
      items: [
        "Normal",
        "Logarithmique",
        "FDC (Flow Duration Curve)",
      ],
    },
  ],
  tables: [
    {
      title: "Exemples de calcul",
      header: "| Indicateur | Définition |",
      rows: [
        "| Min | plus petite valeur numérique valide |",
        "| Max | plus grande valeur numérique valide |",
        "| Moyenne | somme des valeurs / nombre de valeurs valides |",
        "| Valeurs manquantes | total de points sans valeur exploitable |",
      ],
    },
  ],
});

const securityDoc = sectionDoc({
  title: "Security",
  intro: `
La sécurité est assurée par une authentification JWT, des rôles applicatifs et des protections HTTP classiques. L’accès à l’administration est limité au rôle ADMIN.
`,
  tables: [
    {
      title: "Composants de sécurité",
      header: "| Mécanisme | Rôle |",
      rows: [
        "| JWT | session applicative et vérification des requêtes |",
        "| bcrypt | hash des mots de passe |",
        "| verifyToken | protection des routes privées |",
        "| requireRole('ADMIN') | restriction des routes d’administration |",
        "| rate limiting | protection des endpoints sensibles |",
        "| helmet / cors | durcissement HTTP |",
      ],
    },
    {
      title: "Variables de configuration",
      header: "| Variable | Usage |",
      rows: [
        "| JWT_SECRET | clé de signature du token |",
        "| JWT_EXPIRES_IN | durée de vie du token |",
        "| BCRYPT_SALT_ROUNDS | coût de hash |",
        "| DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD / DB_SSL | connexion PostgreSQL |",
      ],
    },
  ],
});

const deploymentDoc = sectionDoc({
  title: "Deployment",
  intro: `
Le projet se lance localement avec un backend Express/TypeScript, un frontend Vite et une base PostgreSQL/PostGIS. Le démarrage dépend de la configuration des variables d’environnement et de l’existence d’une base restaurée.
`,
  bullets: [
    {
      title: "Scripts utiles",
      items: [
        "frontend: npm run dev / npm run build / npm run preview",
        "backend: npm run dev / npm run build / npm run start / npm run seed:users",
      ],
    },
    {
      title: "Ports observés",
      items: [
        "PostgreSQL: 5432",
        "Backend local: 5000",
        "Frontend Vite: 5173",
      ],
    },
  ],
  tables: [
    {
      title: "Variables d’environnement",
      header: "| Fichier | Variables principales |",
      rows: [
        "| backend/.env | DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL, JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS |",
        "| frontend/.env | VITE_API_BASE_URL, VITE_API_URL |",
      ],
    },
  ],
});

const errorsDoc = sectionDoc({
  title: "Error Handling & Anomalies",
  intro: `
Cette section regroupe les problèmes observables et les solutions appliquées ou recommandées. Elle aide à diagnostiquer les écarts entre données réelles, rendu graphique et comportement API.
`,
  tables: [
    {
      title: "Anomalies récurrentes",
      header: "| Symptôme | Cause probable | Solution |",
      rows: [
        "| Login 400 | email ou mot de passe invalide | vérifier les identifiants seedés |",
        "| 401 sur route privée | token absent ou expiré | se reconnecter / renouveler la session |",
        "| Date 1900 affichée | bornes de période non recalées | interroger /date-range |",
        "| Graphique tronqué | conteneur sans hauteur explicite | fixer la hauteur et les marges Recharts |",
        "| 500 spatial projet | requête SQL ou collection indéfinie | corriger la requête et les propriétés |",
        "| CORS refusé | origine non listée | ajuster CORS_ORIGIN |",
      ],
    },
  ],
});

const userGuideDoc = sectionDoc({
  title: "User Guide",
  intro: `
Le guide utilisateur décrit le parcours standard : connexion, navigation, lecture des dashboards, utilisation des filtres et export des tableaux.
`,
  bullets: [
    {
      title: "Parcours de base",
      items: [
        "ouvrir /login",
        "s’authentifier",
        "accéder au dashboard selon le rôle",
        "choisir un module métier",
        "filtrer station, scénario, variable et période",
        "lire le graphe, le tableau et les indicateurs",
        "exporter si nécessaire",
      ],
    },
  ],
});

const adminGuideDoc = sectionDoc({
  title: "Admin Guide",
  intro: `
Le guide administrateur couvre l’espace sécurisé réservé au rôle ADMIN : consultation des statistiques générales, gestion des utilisateurs et supervision des accès.
`,
  bullets: [
    {
      title: "Actions administrateur",
      items: [
        "lister les utilisateurs",
        "créer ou modifier un compte",
        "activer ou désactiver un utilisateur",
        "réinitialiser un mot de passe",
        "changer un rôle",
        "surveiller les derniers accès",
      ],
    },
  ],
});

const technicalGuideDoc = sectionDoc({
  title: "Technical Guide",
  intro: `
Ce guide s’adresse aux développeurs qui veulent faire évoluer la plateforme sans casser les contrats existants.
`,
  bullets: [
    {
      title: "Bonnes pratiques d’extension",
      items: [
        "ajouter un endpoint dans routes -> controller -> service",
        "mettre à jour les types partagés frontend et backend",
        "préserver le format d’enveloppe JSON des APIs",
        "adapter i18n lorsque l’UI expose un nouveau libellé",
        "documenter tout nouveau flux dans cette arborescence",
      ],
    },
    {
      title: "Intégration d’un nouveau dashboard",
      items: [
        "créer le module dans components/dashboard/modules",
        "raccorder la sidebar",
        "définir les appels API et les états de chargement",
        "ajouter les vues graphiques et tabulaires",
      ],
    },
  ],
});

const synthesisDoc = sectionDoc({
  title: "Project Synthesis",
  intro: `
Hydro-Data Intelligence apporte une valeur opérationnelle, scientifique et décisionnelle. La plateforme consolide les données de mesure, les cartes, les indicateurs et les outils de contrôle dans une expérience cohérente autour du barrage Hassan Addakhil.
`,
  bullets: [
    {
      title: "Valeur métier",
      items: [
        "lecture rapide de l’état des données",
        "navigation métier centrée sur le périmètre Hassan Addakhil",
        "outils d’aide à la décision et de reporting",
      ],
    },
    {
      title: "Perspectives",
      items: [
        "enrichissement du catalogue de variables",
        "industrialisation des exports",
        "amélioration continue des contrôles de qualité",
        "extension des vues analytiques et spatiales",
      ],
    },
  ],
});

const dbReadme = `# DATABASE_DOCUMENTATION

Documentation technique et SQL de la base **hydro_hd_1714**.

## Contenu

| Fichier | Rôle |
|---|---|
| [01_resume_global_base.md](./01_resume_global_base.md) | vue globale |
| [02_architecture_base.md](./02_architecture_base.md) | architecture SQL |
| [03_dictionnaire_donnees.md](./03_dictionnaire_donnees.md) | dictionnaire |
| [04_relations_pk_fk.md](./04_relations_pk_fk.md) | relations et contraintes |
| [05_inventaire_tables_et_vues.md](./05_inventaire_tables_et_vues.md) | inventaire |
| [06_guide_recreation_base.md](./06_guide_recreation_base.md) | recréation |
| [07_ordre_execution_scripts.md](./07_ordre_execution_scripts.md) | ordre d’exécution |
| [08_guide_injection_nouvelles_donnees.md](./08_guide_injection_nouvelles_donnees.md) | injection |
| [09_points_attention_et_risques.md](./09_points_attention_et_risques.md) | risques |

## Backup

La sauvegarde PostgreSQL est disponible dans :

- [backup](./backup/)

## Utilisation

- consulter cette documentation pour le détail SQL
- utiliser la backup pour une restauration ou validation locale
- référencer ce dossier depuis [PROJECT_DOCUMENTATION/06_Database](../PROJECT_DOCUMENTATION/06_Database/README.md)
`;

ensureDir(outDir);
ensureDir(path.join(outDir, "assets"));
ensureDir(path.join(dbDocsDir, "backup"));

writeFile("README.md", rootReadme);
writeFile("00_Introduction/README.md", introDoc);
writeFile("01_Project_Overview/README.md", overviewDoc);
writeFile("02_Global_Architecture/README.md", architectureDoc);
writeFile("03_Backend/README.md", backendDoc);
writeFile("04_Frontend/README.md", frontendDoc);
writeFile("05_APIs/README.md", apiDoc);
writeFile("06_Database/README.md", dbDoc);
writeFile("07_Dashboards/README.md", dashboardsDoc);
writeFile("08_Hydrological_Data/README.md", hydroDataDoc);
writeFile("09_Analytics_Indicators/README.md", analyticsDoc);
writeFile("10_Security/README.md", securityDoc);
writeFile("11_Deployment/README.md", deploymentDoc);
writeFile("12_Error_Handling_Anomalies/README.md", errorsDoc);
writeFile("13_User_Guide/README.md", userGuideDoc);
writeFile("14_Admin_Guide/README.md", adminGuideDoc);
writeFile("15_Technical_Guide/README.md", technicalGuideDoc);
writeFile("16_Project_Synthesis/README.md", synthesisDoc);

if (!fs.existsSync(path.join(dbDocsDir, "README.md"))) {
  fs.writeFileSync(path.join(dbDocsDir, "README.md"), `${dbReadme.trimEnd()}\n`, "utf8");
}

fs.writeFileSync(path.join(outDir, "assets", ".gitkeep"), "", "utf8");

console.log(`Generated project documentation in ${outDir}`);
