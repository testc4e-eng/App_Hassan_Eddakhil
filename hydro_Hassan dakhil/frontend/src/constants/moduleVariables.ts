export type DashboardModuleCode = "climat" | "hydro" | "erosion";

export const MODULE_VISIBLE_STANDARD_NAMES: Record<
  DashboardModuleCode,
  readonly string[]
> = {
  climat: [],
  hydro: ["STREAMFLOW", "SWAT_FLOW_M3S"],
  erosion: ["SWAT_SED_IN_TONS", "SWAT_SED_TONS", "SWAT_SED_CONC_MG_KG", "SWAT_SYLDT_HA"],
} as const;

function normalizeModuleCode(moduleCode: DashboardModuleCode | string): DashboardModuleCode | string {
  const code = String(moduleCode || "").toLowerCase();
  if (code === "climate") return "climat";
  if (code === "hydrology") return "hydro";
  if (code === "sediment" || code === "sediments") return "erosion";
  return code;
}

export function isStandardNameVisibleForModule(
  moduleCode: DashboardModuleCode | string,
  standardName: string | null | undefined
): boolean {
  const code = normalizeModuleCode(moduleCode);
  const name = String(standardName || "");

  if (code === "climat") {
    return !name.startsWith("SWAT_");
  }

  if (code === "hydro") {
    return MODULE_VISIBLE_STANDARD_NAMES.hydro.includes(name);
  }

  if (code === "erosion") {
    return MODULE_VISIBLE_STANDARD_NAMES.erosion.includes(name);
  }

  return true;
}

export function isModulePropertyVisibleForModule(
  moduleCode: DashboardModuleCode | string,
  standardName: string | null | undefined
): boolean {
  return isStandardNameVisibleForModule(moduleCode, standardName);
}

export function isVariableVisibleForModule(
  moduleCode: DashboardModuleCode | string,
  row: { standard_name?: string | null; source_type?: string | null; scenario_code?: string | null } | null | undefined
): boolean {
  const code = normalizeModuleCode(moduleCode);
  const standardName = String(row?.standard_name || "");

  if (code === "climat") {
    return !standardName.startsWith("SWAT_");
  }

  if (code === "hydro" || code === "erosion") {
    return isStandardNameVisibleForModule(code, standardName);
  }

  return true;
}

export function isObservedRowVisibleForModule(
  moduleCode: DashboardModuleCode | string
): boolean {
  const code = normalizeModuleCode(moduleCode);
  return code === "climat" || code === "hydro" || code === "erosion";
}
