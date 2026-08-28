import type {
  InterventionAction,
  InterventionActionFilters,
  InterventionAxis,
  InterventionBudgetBand,
  InterventionProgramYear,
  LocalizedText,
  SupportedLanguage,
} from "@/features/intervention-program/types/interventionProgram.types";

export function getLocalizedText(text: LocalizedText, language: SupportedLanguage): string {
  return text[language] ?? text.fr;
}

export function formatNumber(value: number, language: SupportedLanguage, digits = 0): string {
  const locale = language === "fr" ? "fr-MA" : "en-US";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatMdh(value: number, language: SupportedLanguage, digits = 2): string {
  const safeDigits = Number.isInteger(value) ? 0 : digits;
  return `${formatNumber(value, language, safeDigits)} MDH`;
}

export function formatArea(value: number, language: SupportedLanguage): string {
  return `${formatNumber(value, language)} ha`;
}

export function formatPercentage(value: number, language: SupportedLanguage, digits = 1): string {
  return `${formatNumber(value, language, digits)}%`;
}

export function getActionYearsRange(action: InterventionAction): {
  start: InterventionProgramYear;
  end: InterventionProgramYear;
} {
  const years = [...action.years].sort((a, b) => a - b);
  return {
    start: years[0],
    end: years[years.length - 1],
  };
}

export function getAxisActions(axisId: InterventionAxis["id"], actions: InterventionAction[]) {
  return actions.filter((action) => action.axisId === axisId);
}

export function getActionCountByAxis(axisId: InterventionAxis["id"], actions: InterventionAction[]) {
  return getAxisActions(axisId, actions).length;
}

export function getAxisBudgetShare(axis: InterventionAxis, totalBudgetMdh: number) {
  return totalBudgetMdh > 0 ? (axis.budgetMdh / totalBudgetMdh) * 100 : 0;
}

export function getBudgetBand(value: number): Exclude<InterventionBudgetBand, "all"> {
  if (value < 1) return "lt-1";
  if (value <= 5) return "1-5";
  return "gt-5";
}

export function filterInterventionActions(
  actions: InterventionAction[],
  filters: InterventionActionFilters,
  language: SupportedLanguage
) {
  return actions.filter((action) => {
    if (filters.axisId !== "all" && action.axisId !== filters.axisId) {
      return false;
    }

    if (
      filters.priority !== "all" &&
      !(action.priorityClasses ?? []).includes(filters.priority)
    ) {
      return false;
    }

    if (filters.year !== "all" && !action.years.includes(filters.year)) {
      return false;
    }

    if (
      filters.interventionType !== "all" &&
      getLocalizedText(action.interventionType, language) !== filters.interventionType
    ) {
      return false;
    }

    if (filters.zone !== "all" && getLocalizedText(action.zoneTarget, language) !== filters.zone) {
      return false;
    }

    if (filters.budgetBand !== "all" && getBudgetBand(action.budgetMdh) !== filters.budgetBand) {
      return false;
    }

    return true;
  });
}

export function getUniqueLocalizedValues(
  actions: InterventionAction[],
  key: "interventionType" | "zoneTarget",
  language: SupportedLanguage
) {
  return [...new Set(actions.map((action) => getLocalizedText(action[key], language)))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getAnnualBudgetTotals(
  actions: InterventionAction[],
  years: InterventionProgramYear[]
) {
  return years.map((year) => ({
    year,
    budgetMdh: actions.reduce((sum, action) => sum + (action.annualBudgetMdh[year] ?? 0), 0),
  }));
}

export function getActionsForYear(actions: InterventionAction[], year: InterventionProgramYear) {
  return actions.filter((action) => action.years.includes(year));
}

export function sortActionsByCode(actions: InterventionAction[]) {
  return [...actions].sort((left, right) => left.code.localeCompare(right.code));
}
