import type {
  DataQualityNote,
  DegradationClassDefinition,
  DistanceClassDefinition,
  InterventionAction,
  InterventionAxis,
  InterventionMapAsset,
  InterventionProgramYear,
  InterventionSourceDocument,
  InterventionSpeciesGroup,
  InterventionYearPlan,
  PriorityClassInfo,
  PriorityMatrixRow,
} from "@/features/intervention-program/types/interventionProgram.types";

const SOURCE_RELATIVE_PATH =
  "public/data/hassan/Classification des zones prioritaires et Programme des  interventions anti-érosives/programme d'intervention prioritaire.pdf";

const SOURCE_PDF_URL = encodeURI(
  "/data/hassan/Classification des zones prioritaires et Programme des  interventions anti-érosives/programme d'intervention prioritaire.pdf"
);

const FIGURES_BASE = "/data/hassan/intervention-program/figures";

export const INTERVENTION_PROGRAM_YEARS: InterventionProgramYear[] = [
  2027,
  2028,
  2029,
  2030,
  2031,
];

export const PRIORITY_CLASS_INFO: PriorityClassInfo[] = [
  {
    id: "P0",
    level: { fr: "Immédiate", en: "Immediate" },
    interpretation: {
      fr: "Zone critique à traiter dès la première année par des actions mécaniques urgentes.",
      en: "Critical area to be treated in year one through urgent mechanical works.",
    },
    color: "#991b1b",
  },
  {
    id: "P1",
    level: { fr: "Très forte priorité", en: "Very high priority" },
    interpretation: {
      fr: "Zone à traiter dès l’année suivante par reboisement ciblé et actions mécaniques.",
      en: "Area to be treated early with targeted reforestation and mechanical works.",
    },
    color: "#dc2626",
  },
  {
    id: "P2",
    level: { fr: "Forte priorité", en: "High priority" },
    interpretation: {
      fr: "Zone importante à intégrer dans les premières phases du programme.",
      en: "Important area to integrate into the first program phases.",
    },
    color: "#f59e0b",
  },
  {
    id: "P3",
    level: { fr: "Priorité moyenne", en: "Medium priority" },
    interpretation: {
      fr: "Zone de stabilisation progressive des versants.",
      en: "Area for gradual slope stabilization.",
    },
    color: "#84cc16",
  },
  {
    id: "P4",
    level: { fr: "Priorité faible", en: "Low priority" },
    interpretation: {
      fr: "Zone de prévention, entretien et amélioration pastorale.",
      en: "Area for prevention, maintenance, and pastoral improvement.",
    },
    color: "#16a34a",
  },
  {
    id: "P5",
    level: { fr: "Vigilance", en: "Monitoring" },
    interpretation: {
      fr: "Zone à suivre avec interventions légères si nécessaire.",
      en: "Area to monitor with light interventions if needed.",
    },
    color: "#2563eb",
  },
];

export const DEGRADATION_CLASSES: DegradationClassDefinition[] = [
  {
    id: "gt-1000",
    rangeLabel: { fr: "DS > 1000 t/ha/an", en: "SD > 1000 t/ha/year" },
    erosionLevel: { fr: "Érosion catastrophique", en: "Catastrophic erosion" },
    operationalMeaning: {
      fr: "Points noirs, ravinement agressif, priorité très immédiate.",
      en: "Critical hotspots, aggressive gullying, very immediate priority.",
    },
    color: "#1d4ed8",
    severityRank: 6,
    sourcePage: 114,
  },
  {
    id: "500-1000",
    rangeLabel: { fr: "500 ≤ DS ≤ 1000 t/ha/an", en: "500 ≤ SD ≤ 1000 t/ha/year" },
    erosionLevel: { fr: "Érosion très forte", en: "Very strong erosion" },
    operationalMeaning: {
      fr: "Ravines actives, pertes de sol très importantes.",
      en: "Active ravines and very high soil losses.",
    },
    color: "#0ea5e9",
    severityRank: 5,
    sourcePage: 114,
  },
  {
    id: "250-500",
    rangeLabel: { fr: "250 ≤ DS < 500 t/ha/an", en: "250 ≤ SD < 500 t/ha/year" },
    erosionLevel: { fr: "Érosion forte", en: "Strong erosion" },
    operationalMeaning: {
      fr: "Versants fortement dégradés.",
      en: "Heavily degraded slopes.",
    },
    color: "#22c55e",
    severityRank: 4,
    sourcePage: 114,
  },
  {
    id: "100-250",
    rangeLabel: { fr: "100 ≤ DS < 250 t/ha/an", en: "100 ≤ SD < 250 t/ha/year" },
    erosionLevel: { fr: "Érosion moyenne à forte", en: "Moderate to strong erosion" },
    operationalMeaning: {
      fr: "Zones de transition, parcours dégradés et piémonts.",
      en: "Transition areas, degraded rangelands, and piedmont zones.",
    },
    color: "#fde047",
    severityRank: 3,
    sourcePage: 114,
  },
  {
    id: "50-100",
    rangeLabel: { fr: "50 ≤ DS < 100 t/ha/an", en: "50 ≤ SD < 100 t/ha/year" },
    erosionLevel: { fr: "Érosion moyenne", en: "Moderate erosion" },
    operationalMeaning: {
      fr: "Érosion diffuse, stabilisable par reboisement.",
      en: "Diffuse erosion that can be stabilized through reforestation.",
    },
    color: "#fdba74",
    severityRank: 2,
    sourcePage: 114,
  },
  {
    id: "lt-50",
    rangeLabel: { fr: "DS < 50 t/ha/an", en: "SD < 50 t/ha/year" },
    erosionLevel: { fr: "Érosion faible à tolérable", en: "Low to tolerable erosion" },
    operationalMeaning: {
      fr: "Zones à faible priorité, surtout en suivi et vigilance.",
      en: "Low-priority areas, mainly for monitoring and vigilance.",
    },
    color: "#c2410c",
    severityRank: 1,
    sourcePage: 114,
  },
];

export const DISTANCE_CLASSES: DistanceClassDefinition[] = [
  {
    id: "0-5",
    rangeLabel: { fr: "0-5 km", en: "0-5 km" },
    proximityLevel: { fr: "Très proche du barrage", en: "Very close to the dam" },
    operationalMeaning: {
      fr: "Zone très sensible, intervention très prioritaire.",
      en: "Highly sensitive zone with very high operational priority.",
    },
    color: "#d97706",
    sourcePage: 116,
  },
  {
    id: "5-15",
    rangeLabel: { fr: "5-15 km", en: "5-15 km" },
    proximityLevel: { fr: "Proche du barrage", en: "Close to the dam" },
    operationalMeaning: {
      fr: "Zone proche, forte priorité opérationnelle.",
      en: "Close area with strong operational priority.",
    },
    color: "#fbbf24",
    sourcePage: 116,
  },
  {
    id: "15-30",
    rangeLabel: { fr: "15-30 km", en: "15-30 km" },
    proximityLevel: { fr: "Distance intermédiaire", en: "Intermediate distance" },
    operationalMeaning: {
      fr: "Zone intermédiaire, priorité importante.",
      en: "Intermediate zone with important priority.",
    },
    color: "#84cc16",
    sourcePage: 116,
  },
  {
    id: "30-50",
    rangeLabel: { fr: "30-50 km", en: "30-50 km" },
    proximityLevel: { fr: "Zone éloignée", en: "Distant zone" },
    operationalMeaning: {
      fr: "Impact plus progressif sur l’envasement.",
      en: "More progressive impact on siltation.",
    },
    color: "#14b8a6",
    sourcePage: 116,
  },
  {
    id: "gt-50",
    rangeLabel: { fr: "> 50 km", en: "> 50 km" },
    proximityLevel: { fr: "Très éloignée", en: "Very distant" },
    operationalMeaning: {
      fr: "Zone de vigilance éloignée.",
      en: "Distant vigilance zone.",
    },
    color: "#1e3a8a",
    sourcePage: 116,
  },
];

export const PRIORITY_MATRIX_ROWS: PriorityMatrixRow[] = [
  {
    degradationClassId: "gt-1000",
    priorities: { "0-5": "P0", "5-15": "P1", "15-30": "P1", "30-50": "P1", "gt-50": "P2" },
  },
  {
    degradationClassId: "500-1000",
    priorities: { "0-5": "P1", "5-15": "P1", "15-30": "P1", "30-50": "P2", "gt-50": "P2" },
  },
  {
    degradationClassId: "250-500",
    priorities: { "0-5": "P1", "5-15": "P2", "15-30": "P2", "30-50": "P2", "gt-50": "P3" },
  },
  {
    degradationClassId: "100-250",
    priorities: { "0-5": "P2", "5-15": "P3", "15-30": "P3", "30-50": "P3", "gt-50": "P4" },
  },
  {
    degradationClassId: "50-100",
    priorities: { "0-5": "P3", "5-15": "P3", "15-30": "P4", "30-50": "P4", "gt-50": "P4" },
  },
  {
    degradationClassId: "lt-50",
    priorities: { "0-5": "P4", "5-15": "P4", "15-30": "P5", "30-50": "P5", "gt-50": "P5" },
  },
];

export const INTERVENTION_MAPS: InterventionMapAsset[] = [
  {
    id: "specific-degradation",
    title: {
      fr: "Répartition spatiale de la dégradation spécifique moyenne",
      en: "Spatial distribution of mean specific degradation",
    },
    subtitle: {
      fr: "Figure 61 du PDF métier - bassin du Haut Ziz.",
      en: "Figure 61 from the source PDF - Upper Ziz basin.",
    },
    imageUrl: `${FIGURES_BASE}/figure-61-specific-degradation.png`,
    relativePath: "public/data/hassan/intervention-program/figures/figure-61-specific-degradation.png",
    sourcePage: 115,
    legend: [
      { id: "lt-50", label: { fr: "< 50", en: "< 50" }, color: "#c2410c" },
      { id: "50-100", label: { fr: "50 - 100", en: "50 - 100" }, color: "#fdba74" },
      { id: "100-250", label: { fr: "100 - 250", en: "100 - 250" }, color: "#fde047" },
      { id: "250-500", label: { fr: "250 - 500", en: "250 - 500" }, color: "#22c55e" },
      { id: "500-1000", label: { fr: "500 - 1000", en: "500 - 1000" }, color: "#0ea5e9" },
      { id: "gt-1000", label: { fr: "> 1000", en: "> 1000" }, color: "#1d4ed8" },
    ],
  },
  {
    id: "distance-classes",
    title: {
      fr: "Carte des classes de distance à l’exutoire du barrage",
      en: "Distance classes to the dam outlet",
    },
    subtitle: {
      fr: "Figure 63 du PDF métier - classes 0-5 à >50 km.",
      en: "Figure 63 from the source PDF - classes from 0-5 to >50 km.",
    },
    imageUrl: `${FIGURES_BASE}/figure-63-distance-classes.png`,
    relativePath: "public/data/hassan/intervention-program/figures/figure-63-distance-classes.png",
    sourcePage: 117,
    legend: [
      { id: "0-5", label: { fr: "0 - 5 km", en: "0 - 5 km" }, color: "#d97706" },
      { id: "5-15", label: { fr: "5 - 15 km", en: "5 - 15 km" }, color: "#fbbf24" },
      { id: "15-30", label: { fr: "15 - 30 km", en: "15 - 30 km" }, color: "#84cc16" },
      { id: "30-50", label: { fr: "30 - 50 km", en: "30 - 50 km" }, color: "#14b8a6" },
      { id: "gt-50", label: { fr: "> 50 km", en: "> 50 km" }, color: "#1e3a8a" },
    ],
  },
  {
    id: "priority-zones",
    title: {
      fr: "Carte finale des zones prioritaires d’intervention",
      en: "Final intervention priority map",
    },
    subtitle: {
      fr: "Figure 64 du PDF métier - croisement dégradation spécifique et distance.",
      en: "Figure 64 from the source PDF - specific degradation crossed with distance.",
    },
    imageUrl: `${FIGURES_BASE}/figure-64-priority-zones.png`,
    relativePath: "public/data/hassan/intervention-program/figures/figure-64-priority-zones.png",
    sourcePage: 119,
    legend: PRIORITY_CLASS_INFO.map((item) => ({
      id: item.id,
      label: { fr: `${item.id} - ${item.level.fr}`, en: `${item.id} - ${item.level.en}` },
      color: item.color,
    })),
    note: {
      fr: "Le PDF ne fait apparaître aucune zone répondant strictement à la classe P0. Une zone tampon de 10 ha est utilisée comme substitut opérationnel.",
      en: "The PDF does not show any area that strictly meets the P0 criteria. A 10 ha buffer zone is used as an operational substitute.",
    },
  },
];

export const INTERVENTION_SPECIES_GROUPS: InterventionSpeciesGroup[] = [
  {
    id: "slope-reforestation",
    title: {
      fr: "Essences pour le reboisement de versant (zones P1/P2)",
      en: "Species for slope reforestation (P1/P2 zones)",
    },
    sourceTable: 24,
    species: [
      {
        name: { fr: "Pin d'Alep", en: "Aleppo pine" },
        scientificName: "Pinus halepensis",
        characteristics: {
          fr: "Essence de protection la plus utilisée au Maroc en contexte semi-aride, à croissance rapide et adaptée aux sols superficiels et pentus.",
          en: "Main protective reforestation species in semi-arid Morocco, fast-growing and suited to shallow, steep soils.",
        },
        preferredUse: {
          fr: "Étages semi-arides, piémonts P1/P2.",
          en: "Semi-arid belts and P1/P2 piedmont areas.",
        },
      },
      {
        name: { fr: "Genévrier rouge / thurifère", en: "Phoenician / Thurifer juniper" },
        scientificName: "Juniperus phoenicea, J. thurifera",
        characteristics: {
          fr: "Essence autochtone résistante à la sécheresse et au froid, avec système racinaire fixateur.",
          en: "Native species resistant to drought and cold, with a stabilizing root system.",
        },
        preferredUse: {
          fr: "Versants pentus, sols superficiels.",
          en: "Steep slopes and shallow soils.",
        },
      },
      {
        name: { fr: "Thuya de Berbérie", en: "Barbary thuya" },
        scientificName: "Tetraclinis articulata",
        characteristics: {
          fr: "Essence xérophile, thermophile et peu exigeante, utilisée en reboisement de protection.",
          en: "Drought-tolerant and heat-loving species used in protective reforestation.",
        },
        preferredUse: {
          fr: "Piémonts et bas de versant.",
          en: "Piedmonts and lower slopes.",
        },
      },
      {
        name: { fr: "Pistachier de l'Atlas / Bétoum", en: "Atlas pistachio / betoum" },
        scientificName: "Pistacia atlantica",
        characteristics: {
          fr: "Essence autochtone rustique favorisant la régénération naturelle ultérieure.",
          en: "Hardy native species that promotes later natural regeneration.",
        },
        preferredUse: {
          fr: "Zones de transition P2/P3.",
          en: "P2/P3 transition zones.",
        },
      },
      {
        name: { fr: "Acacia", en: "Acacia" },
        scientificName: "Acacia cyanophylla / A. saligna",
        characteristics: {
          fr: "Croissance rapide et bonne fixation des sols.",
          en: "Fast growth and good soil fixation.",
        },
        preferredUse: {
          fr: "Bordures de banquettes.",
          en: "Bench edges.",
        },
      },
    ],
  },
  {
    id: "buffer-and-riparian",
    title: {
      fr: "Essences pour la zone tampon et les plantations riveraines",
      en: "Species for the buffer zone and riparian plantations",
    },
    sourceTable: 25,
    species: [
      {
        name: { fr: "Saules", en: "Willows" },
        scientificName: "Salix spp.",
        characteristics: {
          fr: "Tiges souples, forte reprise par bouturage, base des techniques de fascinage et de tressage.",
          en: "Flexible stems, strong propagation by cuttings, foundational for fascines and weaving techniques.",
        },
        preferredUse: {
          fr: "Pied de berge, bande basse.",
          en: "Bank toe and low strip.",
        },
      },
      {
        name: { fr: "Tamaris", en: "Tamarisk" },
        scientificName: "Tamarix aphylla, T. gallica, T. africana",
        characteristics: {
          fr: "Très résistant à la sécheresse et à la salinité, tolère l’ennoiement temporaire.",
          en: "Highly resistant to drought and salinity, tolerates temporary flooding.",
        },
        preferredUse: {
          fr: "Berges d’oueds.",
          en: "Wadi banks.",
        },
      },
      {
        name: { fr: "Peuplier", en: "Poplar" },
        scientificName: "Populus alba, P. nigra",
        characteristics: {
          fr: "Racines profondes et tiges plus rigides que le saule.",
          en: "Deep roots and more rigid stems than willow.",
        },
        preferredUse: {
          fr: "Haut de berge.",
          en: "Upper bank.",
        },
      },
      {
        name: { fr: "Laurier rose", en: "Oleander" },
        scientificName: "Nerium oleander",
        characteristics: {
          fr: "Espèce autochtone des oueds, toxique pour le bétail.",
          en: "Native wadi species, toxic to livestock.",
        },
        preferredUse: {
          fr: "Tronçons mis en défens uniquement.",
          en: "Sections kept under exclosure only.",
        },
      },
    ],
  },
  {
    id: "pastoral-improvement",
    title: {
      fr: "Essences pour la mise en défens et l’amélioration pastorale",
      en: "Species for exclosure and pastoral improvement",
    },
    sourceTable: 26,
    species: [
      {
        name: { fr: "Arroche", en: "Saltbush" },
        scientificName: "Atriplex nummularia, A. halimus",
        characteristics: {
          fr: "Résistante à la sécheresse et à la salinité, avec bonne valeur fourragère.",
          en: "Drought- and salinity-resistant with strong forage value.",
        },
        preferredUse: {
          fr: "Zones P3/P4, parcours dégradés.",
          en: "P3/P4 zones and degraded rangelands.",
        },
      },
      {
        name: { fr: "Acacia raddiana (talha)", en: "Acacia raddiana (talha)" },
        scientificName: "Acacia raddiana",
        characteristics: {
          fr: "Essence autochtone présaharienne à vocation fourragère.",
          en: "Native pre-Saharan forage species.",
        },
        preferredUse: {
          fr: "Piémonts, secteurs présahariens.",
          en: "Piedmont and pre-Saharan sectors.",
        },
      },
      {
        name: { fr: "Jujubier sauvage", en: "Wild jujube" },
        scientificName: "Ziziphus lotus",
        characteristics: {
          fr: "Espèce autochtone rustique utile en bordure.",
          en: "Hardy native species useful for edges and hedges.",
        },
        preferredUse: {
          fr: "Bordures, haies vives.",
          en: "Borders and live hedges.",
        },
      },
      {
        name: { fr: "Retama", en: "Retama" },
        scientificName: "Retama sphaerocarpa",
        characteristics: {
          fr: "Fixation de sol et appui à la régénération naturelle assistée.",
          en: "Soil fixation and support for assisted natural regeneration.",
        },
        preferredUse: {
          fr: "Zones de transition.",
          en: "Transition zones.",
        },
      },
    ],
  },
];

export const INTERVENTION_ACTIONS: InterventionAction[] = [
  {
    id: "action-1-1",
    code: "1.1",
    title: {
      fr: "Reboisement de la zone tampon en amont de la retenue",
      en: "Reforestation of the upstream buffer zone",
    },
    axisId: "axis-1",
    objective: {
      fr: "Intercepter et filtrer immédiatement le flux solide avant son entrée dans la retenue par une bande boisée tampon.",
      en: "Immediately intercept and filter sediment flow before it enters the reservoir through a wooded buffer strip.",
    },
    target: {
      fr: "Zone tampon de 10 ha (100 m sur 1 km) le long de l’oued, utilisée comme substitut opérationnel de la classe P0.",
      en: "10 ha buffer zone (100 m over 1 km) along the wadi, used as the operational substitute for class P0.",
    },
    years: [2027, 2028],
    phaseByYear: {
      2027: {
        fr: "Tranche 1/2 - installation et plantation initiale.",
        en: "Phase 1/2 - installation and initial planting.",
      },
      2028: {
        fr: "Tranche 2/2 - regarnis et finalisation.",
        en: "Phase 2/2 - infill planting and completion.",
      },
    },
    annualBudgetMdh: { 2027: 0.1, 2028: 0.1 },
    budgetMdh: 0.2,
    areaHa: 10,
    unitCost: { fr: "20 000 DH/ha", en: "20,000 MAD/ha" },
    priorityClasses: ["P0"],
    interventionType: { fr: "Travaux biologiques", en: "Biological works" },
    zoneTarget: { fr: "Zone tampon amont de la retenue", en: "Upstream reservoir buffer zone" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 123,
    sourceTable: 27,
    speciesGroupIds: ["buffer-and-riparian"],
    notes: [
      {
        fr: "Le document précise qu’aucune zone ne répond strictement au critère P0, d’où l’usage d’un substitut opérationnel.",
        en: "The document states that no area strictly meets the P0 criterion, hence the operational substitute.",
      },
    ],
  },
  {
    id: "action-1-2",
    code: "1.2",
    title: {
      fr: "Reboisement prioritaire des zones P1",
      en: "Priority reforestation of P1 zones",
    },
    axisId: "axis-1",
    objective: {
      fr: "Réduire durablement la production sédimentaire dans les zones classées P1, les plus contributrices à l’envasement.",
      en: "Durably reduce sediment production in P1 zones, the strongest contributors to siltation.",
    },
    target: {
      fr: "~3 400 ha de zones P1, reboisées en mélange autour du pin d’Alep, associé selon le secteur au genévrier, au thuya et/ou au pistachier de l’Atlas.",
      en: "Approx. 3,400 ha of P1 zones, reforested with Aleppo pine mixed with juniper, thuya, and/or Atlas pistachio depending on the sector.",
    },
    years: [2027, 2028, 2029, 2030, 2031],
    phaseByYear: {
      2027: { fr: "Tranche 1/5 - ~680 ha.", en: "Phase 1/5 - ~680 ha." },
      2028: { fr: "Tranche 2/5 - ~680 ha supplémentaires.", en: "Phase 2/5 - ~680 additional ha." },
      2029: { fr: "Tranche 3/5 - ~680 ha.", en: "Phase 3/5 - ~680 ha." },
      2030: { fr: "Tranche 4/5 - ~680 ha.", en: "Phase 4/5 - ~680 ha." },
      2031: { fr: "Tranche 5/5 - finalisation des ~3 400 ha.", en: "Phase 5/5 - completion of ~3,400 ha." },
    },
    annualBudgetMdh: { 2027: 13.6, 2028: 13.6, 2029: 13.6, 2030: 13.6, 2031: 13.6 },
    budgetMdh: 68,
    areaHa: 3400,
    unitCost: { fr: "20 000 DH/ha", en: "20,000 MAD/ha" },
    priorityClasses: ["P1"],
    interventionType: { fr: "Reboisement", en: "Reforestation" },
    zoneTarget: { fr: "Zones P1", en: "P1 zones" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 123,
    sourceTable: 27,
    speciesGroupIds: ["slope-reforestation"],
  },
  {
    id: "action-1-3",
    code: "1.3",
    title: {
      fr: "Mise en défens ciblée des secteurs à forte pression pastorale",
      en: "Targeted exclosure of high pastoral pressure areas",
    },
    axisId: "axis-1",
    objective: {
      fr: "Protéger les parcelles reboisées et les zones de régénération naturelle contre le surpâturage pendant la phase critique d’installation.",
      en: "Protect reforested plots and natural regeneration areas from overgrazing during the critical establishment phase.",
    },
    target: {
      fr: "~2 000 ha répartis sur le périmètre P1 et P2, avec gardiennage, balisage et compensations pastorales.",
      en: "Approx. 2,000 ha across the P1 and P2 perimeter, including guarding, marking, and pastoral compensation.",
    },
    years: [2027, 2028, 2029, 2030, 2031],
    phaseByYear: {
      2027: { fr: "Tranche 1/5 - premières zones mises en rotation.", en: "Phase 1/5 - first rotating sectors." },
      2028: { fr: "Tranche 2/5.", en: "Phase 2/5." },
      2029: { fr: "Tranche 3/5.", en: "Phase 3/5." },
      2030: { fr: "Tranche 4/5.", en: "Phase 4/5." },
      2031: { fr: "Tranche 5/5 - finalisation du cycle P1.", en: "Phase 5/5 - completion of the P1 cycle." },
    },
    annualBudgetMdh: { 2027: 0.6, 2028: 0.6, 2029: 0.6, 2030: 0.6, 2031: 0.6 },
    budgetMdh: 3,
    areaHa: 2000,
    unitCost: { fr: "1 500 DH/ha", en: "1,500 MAD/ha" },
    priorityClasses: ["P1", "P2"],
    interventionType: { fr: "Mise en défens pastorale", en: "Pastoral exclosure" },
    zoneTarget: { fr: "Zones P1 et P2", en: "P1 and P2 zones" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 123,
    sourceTable: 27,
    speciesGroupIds: ["pastoral-improvement"],
  },
  {
    id: "action-1-4",
    code: "1.4",
    title: {
      fr: "Régénération naturelle assistée et amélioration pastorale",
      en: "Assisted natural regeneration and pastoral improvement",
    },
    axisId: "axis-1",
    objective: {
      fr: "Accompagner la reconstitution du couvert végétal à moindre coût en complément du reboisement actif.",
      en: "Support vegetation recovery at lower cost in addition to active reforestation.",
    },
    target: {
      fr: "Secteurs à sols pauvres des zones P1 et P2 (~500 à 800 ha) via repos biologique, scarification légère et sursemis pastoral.",
      en: "Poor-soil sectors in P1 and P2 zones (~500 to 800 ha) through biological rest, light scarification, and pastoral overseeding.",
    },
    years: [2029, 2030, 2031],
    phaseByYear: {
      2029: {
        fr: "Tranche 1/3 - démarrage du repos biologique.",
        en: "Phase 1/3 - start of biological rest.",
      },
      2030: { fr: "Tranche 2/3.", en: "Phase 2/3." },
      2031: { fr: "Tranche 3/3 - finalisation.", en: "Phase 3/3 - completion." },
    },
    annualBudgetMdh: { 2029: 0.67, 2030: 0.67, 2031: 0.67 },
    budgetMdh: 2,
    areaRangeHa: { min: 500, max: 800 },
    unitCost: { fr: "2 500 DH/ha", en: "2,500 MAD/ha" },
    priorityClasses: ["P1", "P2"],
    interventionType: { fr: "Régénération naturelle assistée", en: "Assisted natural regeneration" },
    zoneTarget: { fr: "Secteurs à sols pauvres des zones P1/P2", en: "Poor-soil sectors of P1/P2 zones" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 123,
    sourceTable: 27,
    speciesGroupIds: ["pastoral-improvement"],
    notes: [
      {
        fr: "Le tableau de coûts répartit 0,67 MDH par année sur trois ans, soit 2,01 MDH arrondis à 2 MDH dans le total.",
        en: "The cost table allocates 0.67 MDH per year over three years, i.e. 2.01 MDH rounded to 2 MDH in the total.",
      },
    ],
  },
  {
    id: "action-2-1",
    code: "2.1",
    title: {
      fr: "Seuils en gabions dans les ravines actives des zones P1",
      en: "Gabion check dams in active ravines of P1 zones",
    },
    axisId: "axis-2",
    objective: {
      fr: "Réduire la vitesse d’écoulement et piéger les sédiments grossiers dans les ravines les plus actives.",
      en: "Reduce flow velocity and trap coarse sediments in the most active ravines.",
    },
    target: {
      fr: "Ravines actives des zones P1 (pente > 8 %, ravinement visible), avec un ratio indicatif de 8 à 10 m³/ha soit ~30 000 m³ au total.",
      en: "Active ravines in P1 zones (slope > 8%, visible gullying), with an indicative ratio of 8 to 10 m³/ha, i.e. about 30,000 m³ in total.",
    },
    years: [2027, 2028, 2029, 2030, 2031],
    phaseByYear: {
      2027: {
        fr: "Enquête de terrain et pré-programmation des ravines prioritaires.",
        en: "Field survey and pre-programming of priority ravines.",
      },
      2028: { fr: "Tranche 1/4 - ~7 500 m³.", en: "Phase 1/4 - ~7,500 m³." },
      2029: { fr: "Tranche 2/4.", en: "Phase 2/4." },
      2030: { fr: "Tranche 3/4.", en: "Phase 3/4." },
      2031: {
        fr: "Tranche 4/4 - finalisation de l’enveloppe de ~30 000 m³.",
        en: "Phase 4/4 - completion of the ~30,000 m³ envelope.",
      },
    },
    annualBudgetMdh: { 2028: 6, 2029: 6, 2030: 6, 2031: 6 },
    budgetMdh: 24,
    quantityLabel: { fr: "~30 000 m³ de gabions", en: "~30,000 m³ of gabions" },
    unitCost: { fr: "800 DH/m³ de gabion", en: "800 MAD/m³ of gabion" },
    priorityClasses: ["P1"],
    interventionType: { fr: "Ouvrages de CES", en: "Soil and water conservation works" },
    zoneTarget: { fr: "Ravines actives des zones P1", en: "Active ravines of P1 zones" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 124,
    sourceTable: 27,
  },
  {
    id: "action-2-2-2-3",
    code: "2.2/2.3",
    title: {
      fr: "Banquettes de CES et cordons pierreux",
      en: "Conservation benches and stone lines",
    },
    axisId: "axis-2",
    objective: {
      fr: "Réduire le ruissellement et l’érosion en nappe sur les versants et piémonts à pente modérée.",
      en: "Reduce runoff and sheet erosion on moderate slopes and piedmont areas.",
    },
    target: {
      fr: "Versants à pente modérée et piémonts des zones P1/P2 (~300 ha/an).",
      en: "Moderate slopes and piedmont sectors in P1/P2 zones (~300 ha/year).",
    },
    years: [2028, 2029, 2030, 2031],
    phaseByYear: {
      2028: { fr: "Tranche 1/4 - démarrage sur ~300 ha/an.", en: "Phase 1/4 - start on ~300 ha/year." },
      2029: { fr: "Tranche 2/4.", en: "Phase 2/4." },
      2030: { fr: "Tranche 3/4.", en: "Phase 3/4." },
      2031: { fr: "Tranche 4/4 - finalisation.", en: "Phase 4/4 - completion." },
    },
    annualBudgetMdh: { 2028: 1.2, 2029: 1.2, 2030: 1.2, 2031: 1.2 },
    budgetMdh: 4.8,
    quantityLabel: { fr: "~300 ha/an", en: "~300 ha/year" },
    unitCost: { fr: "4 000 DH/ha", en: "4,000 MAD/ha" },
    priorityClasses: ["P1", "P2"],
    interventionType: { fr: "Travaux mécaniques de surface", en: "Surface mechanical works" },
    zoneTarget: { fr: "Versants et piémonts P1/P2", en: "P1/P2 slopes and piedmonts" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 124,
    sourceTable: 27,
  },
  {
    id: "action-2-4",
    code: "2.4",
    title: {
      fr: "Protection de berges sur le tronçon aval",
      en: "Bank protection on the downstream section",
    },
    axisId: "axis-2",
    objective: {
      fr: "Stabiliser les berges les plus proches de la retenue et limiter l’apport direct de sédiments par sapement.",
      en: "Stabilize banks closest to the reservoir and limit direct sediment inputs from bank erosion.",
    },
    target: {
      fr: "Tronçon aval de l’oued, 0-15 km du barrage, sur un linéaire estimatif de 2 à 3 km en technique mixte génie civil/génie végétal.",
      en: "Downstream wadi section, 0-15 km from the dam, across an estimated 2 to 3 km with a mixed civil/vegetative engineering approach.",
    },
    years: [2029, 2030, 2031],
    phaseByYear: {
      2029: { fr: "Tranche 1/3 - démarrage des enrochements.", en: "Phase 1/3 - rock armoring starts." },
      2030: { fr: "Tranche 2/3.", en: "Phase 2/3." },
      2031: { fr: "Tranche 3/3 - finalisation.", en: "Phase 3/3 - completion." },
    },
    annualBudgetMdh: { 2029: 1.25, 2030: 1.25, 2031: 1.25 },
    budgetMdh: 3.75,
    quantityLabel: { fr: "~2,5 km de berges", en: "~2.5 km of banks" },
    unitCost: { fr: "1 500 DH/ml", en: "1,500 MAD per linear meter" },
    interventionType: { fr: "Protection de berges", en: "Bank protection" },
    zoneTarget: { fr: "Tronçon aval 0-15 km du barrage", en: "0-15 km downstream section from the dam" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 124,
    sourceTable: 27,
  },
  {
    id: "action-3-1",
    code: "3.1",
    title: {
      fr: "Étude de faisabilité de seuils de recharge en tête de bassin",
      en: "Feasibility study for recharge check dams in the headwaters",
    },
    axisId: "axis-3",
    objective: {
      fr: "Évaluer la pertinence technique et économique de seuils destinés à ralentir les écoulements et favoriser la recharge de nappe.",
      en: "Assess the technical and economic relevance of structures that slow runoff and support aquifer recharge.",
    },
    target: {
      fr: "Secteurs les plus producteurs de sédiments en tête de bassin.",
      en: "The most sediment-producing sectors in the headwaters.",
    },
    years: [2027],
    phaseByYear: {
      2027: { fr: "Étude unique - démarrage.", en: "Single study - start." },
    },
    annualBudgetMdh: { 2027: 1 },
    budgetMdh: 1,
    interventionType: { fr: "Étude de faisabilité", en: "Feasibility study" },
    zoneTarget: { fr: "Tête de bassin", en: "Headwaters" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 125,
    sourceTable: 27,
  },
  {
    id: "action-3-2",
    code: "3.2",
    title: {
      fr: "Étude de faisabilité de barrages collinaires / pièges à sédiments",
      en: "Feasibility study for hill reservoirs / sediment traps",
    },
    axisId: "axis-3",
    objective: {
      fr: "Examiner l’opportunité d’ouvrages de rétention de second rang dans les sous-bassins les plus contributeurs identifiés par SWAT.",
      en: "Examine the suitability of second-rank retention structures in the most contributive sub-basins identified by SWAT.",
    },
    target: {
      fr: "Sous-bassins à fort apport sédimentaire.",
      en: "Sub-basins with high sediment contribution.",
    },
    years: [2027],
    phaseByYear: {
      2027: { fr: "Étude unique - démarrage.", en: "Single study - start." },
    },
    annualBudgetMdh: { 2027: 1 },
    budgetMdh: 1,
    interventionType: { fr: "Étude de faisabilité", en: "Feasibility study" },
    zoneTarget: { fr: "Sous-bassins à fort apport sédimentaire", en: "High sediment-yield sub-basins" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 125,
    sourceTable: 27,
  },
  {
    id: "action-3-3",
    code: "3.3",
    title: {
      fr: "Installation de turbidimètres",
      en: "Installation of turbidimeters",
    },
    axisId: "axis-3",
    objective: {
      fr: "Équiper les stations amont et aval du barrage pour objectiver le transit sédimentaire via la turbidité et les MES.",
      en: "Equip upstream and downstream stations to document sediment transfer through turbidity and suspended solids monitoring.",
    },
    target: {
      fr: "Stations amont et aval du barrage Hassan Addakhil.",
      en: "Upstream and downstream stations of Hassan Addakhil dam.",
    },
    years: [2027],
    phaseByYear: {
      2027: { fr: "Action unique.", en: "Single action." },
    },
    annualBudgetMdh: { 2027: 2 },
    budgetMdh: 2,
    interventionType: { fr: "Instrumentation", en: "Instrumentation" },
    zoneTarget: { fr: "Stations amont / aval du barrage", en: "Upstream / downstream dam stations" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 125,
    sourceTable: 27,
    notes: [
      {
        fr: "Le calendrier annuel mentionne aussi cette action en 2028, alors que la fiche action et le tableau de coûts la placent uniquement en année 1.",
        en: "The annual schedule also mentions this action in 2028, while the action sheet and cost table place it only in year 1.",
      },
    ],
  },
  {
    id: "action-4-1",
    code: "4.1",
    title: {
      fr: "Levés bathymétriques de la retenue",
      en: "Bathymetric surveys of the reservoir",
    },
    axisId: "axis-4",
    objective: {
      fr: "Mesurer l’évolution réelle de l’envasement et ajuster le programme à partir d’un point zéro puis d’un bilan à 5 ans.",
      en: "Measure actual siltation evolution and adjust the program from a baseline survey and a five-year review.",
    },
    target: {
      fr: "Retenue du barrage Hassan Addakhil.",
      en: "Hassan Addakhil reservoir.",
    },
    years: [2027, 2031],
    phaseByYear: {
      2027: { fr: "Campagne point zéro.", en: "Baseline survey." },
      2031: { fr: "Campagne bilan des 5 ans.", en: "Five-year review survey." },
    },
    annualBudgetMdh: { 2027: 0.75, 2031: 0.75 },
    budgetMdh: 1.5,
    interventionType: { fr: "Suivi bathymétrique", en: "Bathymetric monitoring" },
    zoneTarget: { fr: "Retenue du barrage", en: "Reservoir" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 125,
    sourceTable: 27,
  },
  {
    id: "action-4-2",
    code: "4.2",
    title: {
      fr: "Étude de modélisation hydrosédimentaire initiale de l’oued Ziz",
      en: "Initial hydro-sedimentary modelling study of Oued Ziz",
    },
    axisId: "axis-4",
    objective: {
      fr: "Élaborer un modèle hydrosédimentaire du bassin versant de l’oued Ziz et de ses affluents pour cibler les zones vulnérables.",
      en: "Develop a hydro-sedimentary model of the Oued Ziz basin and its tributaries to target vulnerable areas.",
    },
    target: {
      fr: "Bassin versant de l’oued Ziz et affluents.",
      en: "Oued Ziz watershed and tributaries.",
    },
    years: [2027],
    phaseByYear: {
      2027: { fr: "Étude unique.", en: "Single study." },
    },
    annualBudgetMdh: { 2027: 2 },
    budgetMdh: 2,
    interventionType: { fr: "Étude de modélisation", en: "Modelling study" },
    zoneTarget: { fr: "Bassin versant de l’oued Ziz", en: "Oued Ziz watershed" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 126,
    sourceTable: 27,
  },
  {
    id: "action-4-3",
    code: "4.3",
    title: {
      fr: "Étude d’optimisation des lâchers et du soutirage des sédiments",
      en: "Study to optimize releases and sediment withdrawal",
    },
    axisId: "axis-4",
    objective: {
      fr: "Élaborer un modèle hydrodynamique et sédimentologique 3D pour définir une règle optimale de gestion des vannes de fond.",
      en: "Develop a 3D hydrodynamic and sediment model to define an optimal bottom-outlet operating rule.",
    },
    target: {
      fr: "Gestion des chasses de vase par vidange de fond.",
      en: "Sediment flushing management through bottom outlet drawdown.",
    },
    years: [2031],
    phaseByYear: {
      2031: { fr: "Étude unique pour adoption du protocole en fin de programme.", en: "Single study for protocol adoption at program close." },
    },
    annualBudgetMdh: { 2031: 2 },
    budgetMdh: 2,
    interventionType: { fr: "Étude de modélisation 3D", en: "3D modelling study" },
    zoneTarget: { fr: "Gestion des chasses de vase", en: "Sediment flushing management" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 126,
    sourceTable: 27,
  },
  {
    id: "action-5-1",
    code: "5.1",
    title: {
      fr: "Sensibilisation des populations riveraines et usagers",
      en: "Awareness raising for riverside populations and users",
    },
    axisId: "axis-5",
    objective: {
      fr: "Informer et mobiliser les populations locales sur les enjeux de l’envasement et les actions du PAP.",
      en: "Inform and mobilize local populations on siltation issues and PAP actions.",
    },
    target: {
      fr: "Populations riveraines et usagers du bassin versant.",
      en: "Riverside populations and watershed users.",
    },
    years: [2027, 2028, 2029, 2030, 2031],
    phaseByYear: {
      2027: { fr: "Démarrage du dispositif continu.", en: "Start of the continuous program." },
      2028: { fr: "Action continue.", en: "Continuous action." },
      2029: { fr: "Action continue.", en: "Continuous action." },
      2030: { fr: "Action continue.", en: "Continuous action." },
      2031: { fr: "Action continue.", en: "Continuous action." },
    },
    annualBudgetMdh: { 2027: 0.12, 2028: 0.12, 2029: 0.12, 2030: 0.12, 2031: 0.12 },
    budgetMdh: 0.6,
    interventionType: { fr: "Sensibilisation", en: "Awareness and outreach" },
    zoneTarget: { fr: "Bassin versant et usagers", en: "Watershed and users" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 126,
    sourceTable: 27,
  },
  {
    id: "action-5-2",
    code: "5.2",
    title: {
      fr: "Coordination interinstitutionnelle",
      en: "Inter-institutional coordination",
    },
    axisId: "axis-5",
    objective: {
      fr: "Assurer la cohérence des interventions entre les maîtres d’ouvrage potentiels via un comité de pilotage dédié.",
      en: "Ensure coherence between potential contracting authorities through a dedicated steering committee.",
    },
    target: {
      fr: "ABH, ANEF/HCEFLCD, DGH, communes, DPA et autres institutions impliquées.",
      en: "ABH, ANEF/HCEFLCD, DGH, municipalities, DPA, and other involved institutions.",
    },
    years: [2027, 2028, 2029, 2030, 2031],
    phaseByYear: {
      2027: { fr: "Réunions semestrielles - démarrage.", en: "Semi-annual meetings - start." },
      2028: { fr: "Action continue.", en: "Continuous action." },
      2029: { fr: "Action continue.", en: "Continuous action." },
      2030: { fr: "Action continue.", en: "Continuous action." },
      2031: { fr: "Action continue.", en: "Continuous action." },
    },
    annualBudgetMdh: { 2027: 0.02, 2028: 0.02, 2029: 0.02, 2030: 0.02, 2031: 0.02 },
    budgetMdh: 0.1,
    interventionType: { fr: "Coordination", en: "Coordination" },
    zoneTarget: { fr: "Institutions parties prenantes du PAP", en: "PAP stakeholder institutions" },
    status: { fr: "Programmé dans le PAP", en: "Scheduled in the PAP" },
    sourcePage: 126,
    sourceTable: 27,
  },
];

export const INTERVENTION_AXES: InterventionAxis[] = [
  {
    id: "axis-1",
    name: { fr: "Travaux biologiques", en: "Biological works" },
    shortLabel: { fr: "Axe 1", en: "Axis 1" },
    description: {
      fr: "Socle du programme: reboisement de protection, plantations riveraines, mise en défens et régénération naturelle assistée.",
      en: "Program backbone: protective reforestation, riparian planting, exclosures, and assisted natural regeneration.",
    },
    summary: {
      fr: "Traite directement la cause de la production sédimentaire via le couvert végétal et concentre le principal effort budgétaire.",
      en: "Directly addresses sediment production through vegetation cover and concentrates the main budget effort.",
    },
    budgetMdh: 73.2,
    color: "#16a34a",
    iconKey: "leaf",
    actionIds: ["action-1-1", "action-1-2", "action-1-3", "action-1-4"],
    keyMetric: { fr: "3 400 ha de reboisement prioritaire", en: "3,400 ha of priority reforestation" },
    sourcePages: [120, 121, 123, 129],
  },
  {
    id: "axis-2",
    name: { fr: "Travaux mécaniques", en: "Mechanical works" },
    shortLabel: { fr: "Axe 2", en: "Axis 2" },
    description: {
      fr: "Complète les travaux biologiques par des ouvrages CES, gabions, banquettes, cordons pierreux et protections de berges.",
      en: "Complements biological works with soil and water conservation structures, gabions, benches, stone lines, and bank protection.",
    },
    summary: {
      fr: "Cible la stabilité des ravines et des secteurs proches de la retenue par des ouvrages de génie civil et végétal.",
      en: "Targets ravine stability and near-reservoir sectors through civil and vegetative engineering works.",
    },
    budgetMdh: 32.55,
    color: "#d97706",
    iconKey: "hammer",
    actionIds: ["action-2-1", "action-2-2-2-3", "action-2-4"],
    keyMetric: { fr: "~30 000 m³ de gabions et ~300 ha/an traités", en: "~30,000 m³ of gabions and ~300 ha/year treated" },
    sourcePages: [120, 124, 129],
  },
  {
    id: "axis-3",
    name: { fr: "Gestion hydraulique et des sédiments", en: "Hydraulic and sediment management" },
    shortLabel: { fr: "Axe 3", en: "Axis 3" },
    description: {
      fr: "Regroupe les études de faisabilité des ouvrages structurants et l’instrumentation de mesure de la turbidité.",
      en: "Groups feasibility studies for structural works and instrumentation for turbidity monitoring.",
    },
    summary: {
      fr: "Prépare les solutions structurantes sans engager directement de travaux lourds dans le PAP initial.",
      en: "Prepares structural solutions without launching major works directly in the initial PAP.",
    },
    budgetMdh: 4,
    color: "#0284c7",
    iconKey: "waves",
    actionIds: ["action-3-1", "action-3-2", "action-3-3"],
    keyMetric: { fr: "3 actions concentrées sur l’année 2027", en: "3 actions concentrated in 2027" },
    sourcePages: [120, 124, 125, 129],
  },
  {
    id: "axis-4",
    name: { fr: "Suivi et études", en: "Monitoring and studies" },
    shortLabel: { fr: "Axe 4", en: "Axis 4" },
    description: {
      fr: "Assure le pilotage technique par les levés bathymétriques et les modélisations hydrosédimentaires.",
      en: "Ensures technical steering through bathymetric surveys and hydro-sedimentary modelling.",
    },
    summary: {
      fr: "Budget retenu à partir du détail des actions, malgré une synthèse PDF incohérente sur cet axe.",
      en: "Budget retained from detailed actions despite an inconsistent PDF summary for this axis.",
    },
    budgetMdh: 5.5,
    color: "#4f46e5",
    iconKey: "binoculars",
    actionIds: ["action-4-1", "action-4-2", "action-4-3"],
    keyMetric: { fr: "2 campagnes bathymétriques et 2 études de modélisation", en: "2 bathymetric campaigns and 2 modelling studies" },
    sourcePages: [121, 125, 126, 129],
  },
  {
    id: "axis-5",
    name: { fr: "Gouvernance", en: "Governance" },
    shortLabel: { fr: "Axe 5", en: "Axis 5" },
    description: {
      fr: "Sécurise la mise en œuvre du PAP par la sensibilisation, la coordination et le suivi continu des acteurs.",
      en: "Secures PAP delivery through outreach, coordination, and continuous stakeholder follow-up.",
    },
    summary: {
      fr: "Axe léger en budget mais indispensable pour la continuité institutionnelle du programme.",
      en: "Light in budget but essential for the institutional continuity of the program.",
    },
    budgetMdh: 0.7,
    color: "#7c3aed",
    iconKey: "users",
    actionIds: ["action-5-1", "action-5-2"],
    keyMetric: { fr: "5 ans de sensibilisation et coordination", en: "5 years of outreach and coordination" },
    sourcePages: [121, 126, 129],
  },
];

export const INTERVENTION_YEAR_PLANS: InterventionYearPlan[] = [
  {
    year: 2027,
    title: { fr: "ANNÉE 1 (2027)", en: "YEAR 1 (2027)" },
    theme: {
      fr: "Démarrage rapide, urgences et cadrage technique",
      en: "Rapid start, urgent actions, and technical framing",
    },
    budgetMdh: 21.2,
    actionIds: [
      "action-1-1",
      "action-1-2",
      "action-1-3",
      "action-2-1",
      "action-3-1",
      "action-3-2",
      "action-3-3",
      "action-4-1",
      "action-4-2",
      "action-5-1",
      "action-5-2",
    ],
    knownHighlights: [
      { fr: "~680 ha de reboisement prioritaire P1.", en: "~680 ha of priority P1 reforestation." },
      { fr: "Zone tampon P0 - tranche 1/2.", en: "P0 buffer zone - phase 1/2." },
      { fr: "Enquête de terrain gabions et instrumentation turbidimètres.", en: "Gabion field survey and turbidimeter instrumentation." },
    ],
    sourcePage: 127,
  },
  {
    year: 2028,
    title: { fr: "ANNÉE 2 (2028)", en: "YEAR 2 (2028)" },
    theme: {
      fr: "Intensification des travaux et déploiement mécanique",
      en: "Work intensification and mechanical deployment",
    },
    budgetMdh: 21.6,
    actionIds: [
      "action-1-1",
      "action-1-2",
      "action-1-3",
      "action-2-1",
      "action-2-2-2-3",
      "action-5-1",
      "action-5-2",
    ],
    knownHighlights: [
      { fr: "~680 ha supplémentaires de reboisement P1.", en: "~680 additional ha of P1 reforestation." },
      { fr: "~300 ha/an pour banquettes et cordons pierreux.", en: "~300 ha/year for benches and stone lines." },
      { fr: "Gabions - tranche 1/4 (~7 500 m³).", en: "Gabions - phase 1/4 (~7,500 m³)." },
    ],
    sourcePage: 127,
  },
  {
    year: 2029,
    title: { fr: "ANNÉE 3 (2029)", en: "YEAR 3 (2029)" },
    theme: {
      fr: "Consolidation, entretien et amorce de la régénération naturelle",
      en: "Consolidation, maintenance, and start of natural regeneration",
    },
    budgetMdh: 23.5,
    actionIds: [
      "action-1-2",
      "action-1-3",
      "action-1-4",
      "action-2-1",
      "action-2-2-2-3",
      "action-2-4",
      "action-5-1",
      "action-5-2",
    ],
    knownHighlights: [
      { fr: "~680 ha de reboisement P1.", en: "~680 ha of P1 reforestation." },
      { fr: "Démarrage de la régénération naturelle assistée.", en: "Start of assisted natural regeneration." },
      { fr: "Protection de berges aval - tranche 1/3.", en: "Downstream bank protection - phase 1/3." },
    ],
    sourcePage: 127,
  },
  {
    year: 2030,
    title: { fr: "ANNÉE 4 (2030)", en: "YEAR 4 (2030)" },
    theme: {
      fr: "Extension vers les zones P2 et équipement de mesure",
      en: "Extension toward P2 zones and measurement equipment",
    },
    budgetMdh: 23.5,
    actionIds: [
      "action-1-2",
      "action-1-3",
      "action-1-4",
      "action-2-1",
      "action-2-2-2-3",
      "action-2-4",
      "action-5-1",
      "action-5-2",
    ],
    knownHighlights: [
      { fr: "~680 ha de reboisement P1.", en: "~680 ha of P1 reforestation." },
      { fr: "~300 ha/an pour banquettes et cordons pierreux.", en: "~300 ha/year for benches and stone lines." },
      { fr: "Poursuite de la régénération naturelle assistée.", en: "Continuation of assisted natural regeneration." },
    ],
    sourcePage: 128,
  },
  {
    year: 2031,
    title: { fr: "ANNÉE 5 (2031)", en: "YEAR 5 (2031)" },
    theme: {
      fr: "Clôture du cycle P1, bilan et protocoles de gestion",
      en: "Closure of the P1 cycle, review, and management protocols",
    },
    budgetMdh: 26.2,
    actionIds: [
      "action-1-2",
      "action-1-3",
      "action-1-4",
      "action-2-1",
      "action-2-2-2-3",
      "action-2-4",
      "action-4-1",
      "action-4-3",
      "action-5-1",
      "action-5-2",
    ],
    knownHighlights: [
      { fr: "Finalisation des ~3 400 ha de reboisement P1.", en: "Completion of ~3,400 ha of P1 reforestation." },
      { fr: "Bilan bathymétrique à 5 ans et modélisation 3D des lâchers.", en: "Five-year bathymetric review and 3D release modelling." },
      { fr: "Clôture des tranches gabions, banquettes et berges.", en: "Completion of gabions, benches, and bank protection phases." },
    ],
    sourcePage: 128,
  },
];

export const INTERVENTION_SOURCE_DOCUMENTS: InterventionSourceDocument[] = [
  {
    id: "pap-pdf",
    title: {
      fr: "Programme d’intervention prioritaire",
      en: "Priority intervention program",
    },
    category: {
      fr: "Source métier",
      en: "Business source",
    },
    url: SOURCE_PDF_URL,
    relativePath: SOURCE_RELATIVE_PATH,
    pageCount: 17,
    integratedAt: "2026-07-23",
    sourceLabel: {
      fr: "PDF de référence utilisé pour le dashboard",
      en: "Reference PDF used to build the dashboard",
    },
  },
];

export const DATA_QUALITY_NOTES: DataQualityNote[] = [
  {
    field: "Classe P0",
    sourceValue: "Aucune zone ne répond strictement au critère DS > 1000 t/ha/an à moins de 5 km.",
    retainedValue: "Zone tampon de 10 ha traitée comme substitut opérationnel P0.",
    reason: {
      fr: "Le PDF lui-même institue cette zone tampon comme substitut opérationnel ; aucune zone P0 réelle n’a été inventée.",
      en: "The PDF itself introduces this buffer zone as the operational substitute; no real P0 area was invented.",
    },
    sourcePage: 123,
  },
  {
    field: "Numérotation des actions",
    sourceValue: "1.3/1.4 deviennent 1.4/1.6 ; 3.3 devient 3.8 ; 4.2/4.3 deviennent 4.2b/4.7 dans le tableau 27.",
    retainedValue: "Codes d’actions conservés selon les fiches détaillées (1.3, 1.4, 3.3, 4.2, 4.3).",
    reason: {
      fr: "Les fiches actions sont plus cohérentes fonctionnellement que la numérotation du tableau récapitulatif final.",
      en: "The action sheets are functionally more coherent than the numbering used in the final summary table.",
    },
    sourcePage: 129,
  },
  {
    field: "Action turbidimètres",
    sourceValue: "Action 3.3 décrite comme “Année 1 / action unique” mais répétée aussi dans le calendrier 2028.",
    retainedValue: "Action conservée sur 2027 uniquement, avec note explicative sur l’incohérence du calendrier.",
    reason: {
      fr: "La fiche action détaillée et le tableau 27 attribuent tous deux le coût de 2 MDH à l’année 1 seulement.",
      en: "Both the detailed action sheet and table 27 allocate the 2 MDH cost to year 1 only.",
    },
    sourcePage: 127,
  },
  {
    field: "Budget Axe 4",
    sourceValue: "Tableau 28 : 4,5 MDH.",
    retainedValue: "5,5 MDH.",
    reason: {
      fr: "Somme détaillée des actions Axe 4 : 1,5 + 2 + 2 = 5,5 MDH. La synthèse du tableau 28 est incohérente.",
      en: "Detailed sum of Axis 4 actions: 1.5 + 2 + 2 = 5.5 MDH. The table 28 summary is inconsistent.",
    },
    sourcePage: 129,
  },
  {
    field: "Total général",
    sourceValue: "116,0 MDH.",
    retainedValue: "116 MDH affichés, pourcentages calculés à partir des budgets retenus totalisant 115,95 MDH.",
    reason: {
      fr: "La somme exacte des montants retenus est inférieure de 0,05 MDH, ce qui correspond à un effet d’arrondi dans le PDF.",
      en: "The exact sum of retained amounts is 0.05 MDH lower, which matches a rounding effect in the PDF.",
    },
    sourcePage: 129,
  },
];

export const INTERVENTION_BUDGET_TOTAL_MDH = 116;
