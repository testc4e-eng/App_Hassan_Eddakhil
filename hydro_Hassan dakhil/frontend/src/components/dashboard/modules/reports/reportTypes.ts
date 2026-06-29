import type { LucideIcon } from "lucide-react";
import {
  CloudRain,
  Droplets,
  FileStack,
  Layers3,
  MapPinned,
  Mountain,
} from "lucide-react";

export type ModuleCode = "climat" | "hydro" | "erosion";

export type ReportTypeId =
  | "climat"
  | "hydrologique"
  | "sediments"
  | "envasement"
  | "spatial"
  | "global";

export type ReportTypeDef = {
  id: ReportTypeId;
  label: string;
  description: string;
  icon: LucideIcon;
  moduleCode: ModuleCode | null;
  accent: string;
};

export const REPORT_TYPES: ReportTypeDef[] = [
  {
    id: "climat",
    label: "Rapport Climat",
    description: "Températures, précipitations et indicateurs climatiques du bassin.",
    icon: CloudRain,
    moduleCode: "climat",
    accent: "from-sky-50 to-cyan-50 border-sky-200",
  },
  {
    id: "hydrologique",
    label: "Rapport Hydrologique",
    description: "Débits observés et simulés, bilans hydriques et comparaisons de scénarios.",
    icon: Droplets,
    moduleCode: "hydro",
    accent: "from-blue-50 to-indigo-50 border-blue-200",
  },
  {
    id: "sediments",
    label: "Rapport Sédiments",
    description: "Transport solide, érosion et variables SWAT liées aux sédiments.",
    icon: Mountain,
    moduleCode: "erosion",
    accent: "from-amber-50 to-orange-50 border-amber-200",
  },
  {
    id: "envasement",
    label: "Rapport Envasement",
    description: "Indicateurs d'envasement, évolution bathymétrique et suivi du barrage.",
    icon: Layers3,
    moduleCode: "erosion",
    accent: "from-emerald-50 to-teal-50 border-emerald-200",
  },
  {
    id: "spatial",
    label: "Rapport Analyse Spatiale",
    description: "Synthèse cartographique des stations, reaches et sous-bassins.",
    icon: MapPinned,
    moduleCode: null,
    accent: "from-violet-50 to-purple-50 border-violet-200",
  },
  {
    id: "global",
    label: "Rapport Global",
    description: "Vue consolidée multi-modules pour une présentation complète du projet.",
    icon: FileStack,
    moduleCode: null,
    accent: "from-slate-50 to-slate-100 border-slate-200",
  },
];

export const REPORT_STEPS = [
  { id: 1, label: "Type de rapport" },
  { id: 2, label: "Configuration" },
  { id: 3, label: "Contenu" },
  { id: 4, label: "Génération" },
] as const;

export type ContentOptionId =
  | "executiveSummary"
  | "stats"
  | "charts"
  | "dataTable"
  | "map"
  | "scenarioComparison"
  | "damIndicators";

export const CONTENT_OPTIONS: Array<{
  id: ContentOptionId;
  label: string;
  description: string;
  reportTypes?: ReportTypeId[];
}> = [
  {
    id: "executiveSummary",
    label: "Résumé exécutif",
    description: "Synthèse des principaux résultats et messages clés.",
  },
  {
    id: "stats",
    label: "Statistiques",
    description: "Min, max, moyenne et comptages sur la période.",
  },
  {
    id: "charts",
    label: "Graphiques temporels",
    description: "Courbes et visualisations des séries sélectionnées.",
  },
  {
    id: "dataTable",
    label: "Tableau des données",
    description: "Export tabulaire détaillé des valeurs agrégées.",
  },
  {
    id: "map",
    label: "Carte du bassin",
    description: "Contexte spatial du bassin Hassan Addakhil.",
  },
  {
    id: "scenarioComparison",
    label: "Comparaison des scénarios",
    description: "Mise en regard de plusieurs scénarios climatiques ou spatiaux.",
  },
  {
    id: "damIndicators",
    label: "Indicateurs barrage / envasement",
    description: "KPIs bathymétriques et indicateurs liés au barrage.",
    reportTypes: ["envasement", "global"],
  },
];
