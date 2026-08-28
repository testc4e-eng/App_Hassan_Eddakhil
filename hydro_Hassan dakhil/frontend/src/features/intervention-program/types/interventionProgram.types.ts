export type SupportedLanguage = "fr" | "en";

export type LocalizedText = Record<SupportedLanguage, string>;

export type PriorityClass = "P0" | "P1" | "P2" | "P3" | "P4" | "P5";

export type InterventionTabId =
  | "overview"
  | "classification"
  | "matrix"
  | "actions"
  | "calendar"
  | "budgets"
  | "documents";

export type InterventionProgramYear = 2027 | 2028 | 2029 | 2030 | 2031;

export type InterventionAxisId =
  | "axis-1"
  | "axis-2"
  | "axis-3"
  | "axis-4"
  | "axis-5";

export type InterventionIconKey =
  | "leaf"
  | "hammer"
  | "waves"
  | "binoculars"
  | "users"
  | "wallet"
  | "target"
  | "trees"
  | "shield";

export type DegradationClassId =
  | "gt-1000"
  | "500-1000"
  | "250-500"
  | "100-250"
  | "50-100"
  | "lt-50";

export type DistanceClassId = "0-5" | "5-15" | "15-30" | "30-50" | "gt-50";

export type InterventionBudgetBand = "all" | "lt-1" | "1-5" | "gt-5";

export interface PriorityClassInfo {
  id: PriorityClass;
  level: LocalizedText;
  interpretation: LocalizedText;
  color: string;
}

export interface DegradationClassDefinition {
  id: DegradationClassId;
  rangeLabel: LocalizedText;
  erosionLevel: LocalizedText;
  operationalMeaning: LocalizedText;
  color: string;
  severityRank: number;
  sourcePage: number;
}

export interface DistanceClassDefinition {
  id: DistanceClassId;
  rangeLabel: LocalizedText;
  proximityLevel: LocalizedText;
  operationalMeaning: LocalizedText;
  color: string;
  sourcePage: number;
}

export interface PriorityMatrixRow {
  degradationClassId: DegradationClassId;
  priorities: Record<DistanceClassId, PriorityClass>;
}

export interface InterventionSpecies {
  name: LocalizedText;
  scientificName?: string;
  characteristics: LocalizedText;
  preferredUse: LocalizedText;
}

export interface InterventionSpeciesGroup {
  id: string;
  title: LocalizedText;
  sourceTable: number;
  species: InterventionSpecies[];
}

export interface InterventionMapLegendItem {
  id: string;
  label: LocalizedText;
  color: string;
}

export interface InterventionMapAsset {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  imageUrl: string;
  relativePath: string;
  sourcePage: number;
  legend: InterventionMapLegendItem[];
  note?: LocalizedText;
}

export interface InterventionAction {
  id: string;
  code: string;
  title: LocalizedText;
  axisId: InterventionAxisId;
  objective: LocalizedText;
  target: LocalizedText;
  years: InterventionProgramYear[];
  phaseByYear: Partial<Record<InterventionProgramYear, LocalizedText>>;
  annualBudgetMdh: Partial<Record<InterventionProgramYear, number>>;
  budgetMdh: number;
  areaHa?: number;
  areaRangeHa?: { min: number; max: number };
  quantityLabel?: LocalizedText;
  unitCost?: LocalizedText;
  priorityClasses?: PriorityClass[];
  interventionType: LocalizedText;
  zoneTarget: LocalizedText;
  status: LocalizedText;
  sourcePage: number;
  sourceTable?: number;
  speciesGroupIds?: string[];
  notes?: LocalizedText[];
}

export interface InterventionAxis {
  id: InterventionAxisId;
  name: LocalizedText;
  shortLabel: LocalizedText;
  description: LocalizedText;
  summary: LocalizedText;
  budgetMdh: number;
  color: string;
  iconKey: InterventionIconKey;
  actionIds: string[];
  keyMetric: LocalizedText;
  sourcePages: number[];
}

export interface InterventionYearPlan {
  year: InterventionProgramYear;
  title: LocalizedText;
  theme: LocalizedText;
  budgetMdh: number;
  actionIds: string[];
  knownHighlights: LocalizedText[];
  sourcePage: number;
}

export interface InterventionSourceDocument {
  id: string;
  title: LocalizedText;
  category: LocalizedText;
  url: string;
  relativePath: string;
  pageCount: number;
  integratedAt: string;
  sourceLabel: LocalizedText;
}

export interface DataQualityNote {
  field: string;
  sourceValue: string;
  retainedValue: string;
  reason: LocalizedText;
  sourcePage: number;
}

export interface InterventionActionFilters {
  axisId: InterventionAxisId | "all";
  priority: PriorityClass | "all";
  year: InterventionProgramYear | "all";
  interventionType: string | "all";
  zone: string | "all";
  budgetBand: InterventionBudgetBand;
}
