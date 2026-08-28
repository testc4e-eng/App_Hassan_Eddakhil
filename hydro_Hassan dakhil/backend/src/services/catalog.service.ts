// backend/src/services/catalog.service.ts
import { DatabaseService } from "./database.service";
import { erosionSwatSeriesService } from "./erosionSwatSeries.service";
import { hydroSwatSeriesService } from "./hydroSwatSeries.service";
import {
  LEGACY_SWAT_SCENARIO_CODES,
} from "../constants/swatScenarios";
import {
  LEGACY_SWAT_REACH_STANDARD_NAMES,
  VISIBLE_SWAT_SCENARIO_CODES,
  buildSwatSortCaseSql,
  buildSwatStandardNameSqlCondition,
  getLegacyCatalogBackedSwatProperties,
} from "../constants/swatDataSources";
import { isStandardNameVisibleForModule } from "../constants/moduleVariables";
import { uniqueBy } from "../utils/deduplicate";

export type CatalogProperty = {
  module_code: string;
  property_id: number;
  is_enabled: boolean;
  sort_order: number;
  name: string;
  unit: string | null;
  standard_name: string | null;
  description: string | null;
};

export type CatalogRun = {
  run_id: number;
  scenario_code: string;
  scenario_name: string;
  description: string | null;
  is_observed: boolean;
  created_at: string;
};

export type CatalogStation = {
  station_id: number;
  station_code: string;
  station_name: string;
};

const CANONICAL_SWAT_SCENARIOS = [
  ...VISIBLE_SWAT_SCENARIO_CODES,
  ...LEGACY_SWAT_SCENARIO_CODES,
];

const CATALOG_RUN_ORDER = new Map<string, number>([
  ["OBSERVED", 0] as const,
  ...VISIBLE_SWAT_SCENARIO_CODES.map((scenarioCode, index) => [
    scenarioCode,
    index + 1,
  ] as const),
]);

function compareCatalogRuns(a: CatalogRun, b: CatalogRun) {
  if (a.is_observed !== b.is_observed) {
    return a.is_observed ? -1 : 1;
  }

  const rankA = CATALOG_RUN_ORDER.get(String(a.scenario_code)) ?? 999;
  const rankB = CATALOG_RUN_ORDER.get(String(b.scenario_code)) ?? 999;
  if (rankA !== rankB) return rankA - rankB;

  return Number(a.run_id) - Number(b.run_id);
}

function normalizeVisibleRuns(rows: CatalogRun[]) {
  return uniqueBy(
    rows
      .filter(
        (row) => !LEGACY_SWAT_SCENARIO_CODES.has(String(row.scenario_code))
      )
      .slice()
      .sort(compareCatalogRuns),
    (row) => row.scenario_code
  );
}

function getLegacyCatalogSwatSql(moduleCode: string) {
  const properties = getLegacyCatalogBackedSwatProperties(moduleCode);
  const standardNames = properties.map((property) => property.standard_name);

  return {
    standardNames,
    sortCaseSql: buildSwatSortCaseSql("p.standard_name", properties),
    propertyFilterSql: buildSwatStandardNameSqlCondition(
      "p.standard_name",
      standardNames
    ),
    catalogFilterSql: buildSwatStandardNameSqlCondition(
      "c.standard_name",
      standardNames
    ),
  };
}

export class CatalogService {
  private db = new DatabaseService();

  async getModules(): Promise<{ module_code: string }[]> {
    const q = `
      SELECT DISTINCT module_code
      FROM public.module_properties
      ORDER BY module_code
    `;
    return this.db.query(q, []);
  }

  async getModuleProperties(moduleCode: string): Promise<CatalogProperty[]> {
    const legacySwatSql = getLegacyCatalogSwatSql(moduleCode);
    const q = `
      SELECT
        mp.module_code,
        mp.property_id,
        mp.is_enabled,
        mp.sort_order,
        p.name,
        p.unit,
        p.standard_name,
        NULL::text AS description
      FROM public.module_properties mp
      JOIN ref.observed_properties p ON p.property_id = mp.property_id
      WHERE mp.module_code = $1
        AND mp.is_enabled = true

      UNION ALL

      SELECT
        $1::text AS module_code,
        p.property_id,
        true AS is_enabled,
        CASE
          ${legacySwatSql.sortCaseSql}
        END AS sort_order,
        p.name,
        p.unit,
        p.standard_name,
        NULL::text AS description
      FROM ref.observed_properties p
      WHERE ${legacySwatSql.propertyFilterSql}
        AND EXISTS (
          SELECT 1
          FROM public.v_ts_catalog_enriched c
          WHERE c.property_id = p.property_id
            AND c.source_type = 'simulated'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.module_properties mp2
          WHERE mp2.module_code = $1
            AND mp2.property_id = p.property_id
            AND mp2.is_enabled = true
        )
      ORDER BY sort_order, property_id
    `;

    const baseRows = uniqueBy(
      (await this.db.query<CatalogProperty>(q, [moduleCode])).filter((row) =>
        isStandardNameVisibleForModule(moduleCode, row.standard_name)
      ),
      (row) => row.property_id
    );

    if (moduleCode !== "hydro") {
      if (moduleCode !== "erosion") {
        return baseRows;
      }

      const erosionRows = uniqueBy(
        (await erosionSwatSeriesService.getModuleProperties()).filter((row) =>
          isStandardNameVisibleForModule(moduleCode, row.standard_name)
        ),
        (row) => row.property_id
      );
      const merged = new Map<number, CatalogProperty>();

      for (const row of baseRows) {
        merged.set(row.property_id, row);
      }

      for (const row of erosionRows as CatalogProperty[]) {
        merged.set(row.property_id, row);
      }

      return Array.from(merged.values()).sort(
        (a, b) => a.sort_order - b.sort_order || a.property_id - b.property_id
      );
    }

    const swatRows = uniqueBy(
      (await hydroSwatSeriesService.getModuleProperties()).filter((row) =>
        isStandardNameVisibleForModule(moduleCode, row.standard_name)
      ),
      (row) => row.property_id
    );
    const merged = new Map<number, CatalogProperty>();

    for (const row of baseRows) {
      merged.set(row.property_id, row);
    }

    for (const row of swatRows as CatalogProperty[]) {
      merged.set(row.property_id, row);
    }

    return Array.from(merged.values()).sort(
      (a, b) => a.sort_order - b.sort_order || a.property_id - b.property_id
    );
  }

  async getRuns(): Promise<CatalogRun[]> {
    if (await this.db.relationExists("api.mv_scenario_catalog")) {
      const rows = await this.db.query<CatalogRun & { is_visible: boolean }>(
        `
        SELECT
          run_id,
          scenario_code,
          scenario_name,
          description,
          is_observed,
          created_at,
          is_visible
        FROM api.mv_scenario_catalog
        WHERE is_visible = true
        ORDER BY
          CASE WHEN is_observed THEN 0 ELSE 1 END,
          scenario_code,
          run_id
        `
      );
      return normalizeVisibleRuns(
        rows.map(({ is_visible: _isVisible, ...row }) => row)
      );
    }

    const hasScenarioMetadata = await this.db.relationExists("access.scenario_metadata");

    const q = `
      SELECT run_id, scenario_code, scenario_name, description, is_observed, created_at
      FROM public.model_runs
      WHERE (
          is_observed = true
          OR ${hasScenarioMetadata ? `EXISTS (
            SELECT 1
            FROM access.scenario_metadata sm
            WHERE sm.scenario_code = public.model_runs.scenario_code
          )` : "false"}
          OR scenario_code = ANY($1::text[])
        )
      ORDER BY
        CASE WHEN is_observed THEN 0 ELSE 1 END,
        array_position($1::text[], scenario_code),
        run_id
    `;
    return normalizeVisibleRuns(
      await this.db.query<CatalogRun>(q, [CANONICAL_SWAT_SCENARIOS])
    );
  }

  async getStationsForModule(
    moduleCode: string,
    runId: number
  ): Promise<CatalogStation[]> {
    const legacySwatSql = getLegacyCatalogSwatSql(moduleCode);

    if (moduleCode === "hydro") {
      const scenario = await hydroSwatSeriesService.resolveHydroScenario(runId);
      if (scenario) {
        return uniqueBy(
          await hydroSwatSeriesService.getStationsForRun(runId),
          (row) => row.station_id
        );
      }
    }

    if (moduleCode === "erosion") {
      const scenario = await erosionSwatSeriesService.resolveErosionScenario(runId);
      if (scenario) {
        return uniqueBy(
          await erosionSwatSeriesService.getStationsForRun(runId),
          (row) => row.station_id
        );
      }
    }

    const q = `
      WITH station_catalog AS (
        SELECT
          c.station_id,
          c.station_code,
          c.station_name,
          c.property_id,
          c.standard_name,
          c.run_id,
          c.source_type
        FROM public.v_ts_catalog_enriched c

        UNION ALL

        SELECT
          m.station_id,
          rs.station_code,
          rs.name AS station_name,
          c.property_id,
          c.standard_name,
          c.run_id,
          c.source_type
        FROM public.v_ts_catalog_enriched c
        JOIN core.stations sw
          ON sw.station_id = c.station_id
        JOIN core.station_reach_map m
          ON m.is_active = true
         AND m.is_primary = true
         AND (
           (m.simulated_station_id IS NOT NULL AND m.simulated_station_id = sw.station_id)
           OR sw.station_code = ('swat_rch_' || m.reach_id::text)
         )
        JOIN core.stations rs
          ON rs.station_id = m.station_id
        WHERE c.source_type = 'simulated'
          AND c.standard_name IN (${LEGACY_SWAT_REACH_STANDARD_NAMES.map((name) => `'${name}'`).join(", ")})
      )
      SELECT DISTINCT
        c.station_id,
        c.station_code,
        c.station_name
      FROM station_catalog c
      LEFT JOIN public.module_properties mp
        ON mp.property_id = c.property_id
       AND mp.module_code = $1
       AND mp.is_enabled = true
      WHERE c.run_id = $2
        AND (
          mp.property_id IS NOT NULL
          OR (
            c.source_type = 'simulated'
            AND ${legacySwatSql.catalogFilterSql}
          )
        )
      ORDER BY c.station_name
    `;
    const rows = await this.db.query<CatalogStation>(q, [moduleCode, runId]);
    return uniqueBy(rows, (row) => row.station_id).sort((a, b) =>
      a.station_name.localeCompare(b.station_name)
    );
  }
}

export const catalogService = new CatalogService();
