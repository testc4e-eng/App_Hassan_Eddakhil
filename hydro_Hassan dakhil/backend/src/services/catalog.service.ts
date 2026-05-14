// backend/src/services/catalog.service.ts
import { DatabaseService } from "./database.service";

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
          WHEN p.standard_name = 'SWAT_FLOW_M3S' THEN 9001
          WHEN p.standard_name = 'SWAT_SED_TONS' THEN 9002
          WHEN p.standard_name = 'SWAT_SYLDT_HA' THEN 9003
          ELSE 9999
        END AS sort_order,
        p.name,
        p.unit,
        p.standard_name,
        NULL::text AS description
      FROM ref.observed_properties p
      WHERE
        (
          ($1 = 'hydro' AND p.standard_name = 'SWAT_FLOW_M3S')
          OR ($1 = 'erosion' AND p.standard_name IN ('SWAT_SED_TONS', 'SWAT_SYLDT_HA'))
        )
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
    return this.db.query<CatalogProperty>(q, [moduleCode]);
  }

  async getRuns(): Promise<CatalogRun[]> {
    const q = `
      SELECT run_id, scenario_code, scenario_name, description, is_observed, created_at
      FROM public.model_runs
      ORDER BY run_id
    `;
    return this.db.query<CatalogRun>(q, []);
  }

  async getStationsForModule(
    moduleCode: string,
    runId: number
  ): Promise<CatalogStation[]> {
    // station list filtrée par présence de timeseries sur ce module+run
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
          AND c.standard_name IN ('SWAT_FLOW_M3S', 'SWAT_SED_TONS')
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
            AND (
              ($1 = 'hydro' AND c.standard_name = 'SWAT_FLOW_M3S')
              OR ($1 = 'erosion' AND c.standard_name IN ('SWAT_SED_TONS', 'SWAT_SYLDT_HA'))
            )
          )
        )
      ORDER BY c.station_name
    `;
    return this.db.query<CatalogStation>(q, [moduleCode, runId]);
  }
}

export const catalogService = new CatalogService();
