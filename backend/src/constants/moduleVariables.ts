export type DashboardModuleCode = "climat" | "hydro" | "erosion";

export const MODULE_VISIBLE_STANDARD_NAMES: Record<
  DashboardModuleCode,
  readonly string[]
> = {
  climat: [],
  hydro: ["STREAMFLOW", "SWAT_FLOW_M3S", "reservoir_bathymetry"],
  erosion: ["SWAT_SED_IN_TONS", "SWAT_SED_TONS", "SWAT_SED_CONC_MG_KG", "SWAT_SYLDT_HA"],
} as const;

export function isStandardNameVisibleForModule(
  moduleCode: DashboardModuleCode | string,
  standardName: string | null | undefined
): boolean {
  const code = String(moduleCode || "").toLowerCase();
  const name = String(standardName || "");

  if (code === "climat" || code === "climate") {
    return !name.startsWith("SWAT_");
  }

  if (code === "hydro" || code === "hydrology") {
    return MODULE_VISIBLE_STANDARD_NAMES.hydro.some(
      (visibleName) => visibleName.toLowerCase() === name.toLowerCase()
    );
  }

  if (code === "erosion" || code === "sediment" || code === "sediments") {
    return MODULE_VISIBLE_STANDARD_NAMES.erosion.some(
      (visibleName) => visibleName.toLowerCase() === name.toLowerCase()
    );
  }

  return true;
}

export function isObservedRowVisibleForModule(
  moduleCode: DashboardModuleCode | string
): boolean {
  const code = String(moduleCode || "").toLowerCase();
  return code === "climat" || code === "hydro" || code === "erosion";
}
