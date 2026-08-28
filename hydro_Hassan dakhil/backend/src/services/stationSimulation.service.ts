import { DatabaseService } from "./database.service";
import { hydroSwatSeriesService } from "./hydroSwatSeries.service";
import { NV_STREAM_STATION_SEEDS, type NvStreamStationSeed } from "../data/nvStreamStationMap";
import {
  NORMALIZED_SWAT_SCENARIO_BY_CODE,
  NORMALIZED_SWAT_SCENARIO_BY_RUN_ID,
} from "../constants/swatScenarios";

type StationLookupRow = {
  station_id: number;
  station_code: string | null;
  name: string | null;
};

type StationMappingRow = {
  id: number;
  station_id: number;
  station_code: string;
  station_name: string;
  nv_station_name: string;
  subbasin_id: number;
  hydro_id: number;
  outlet_id: number;
  source_layer: string;
  mapping_method: string;
  confidence_score: string | number;
  is_primary: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ScenarioRow = {
  run_id: number | null;
  scenario_code: string;
  scenario_name: string | null;
  is_observed: boolean | null;
  import_id: number | null;
};

type ObservedSeriesRow = {
  ts_id: number;
  date: string;
  value: number | null;
};

type SubbasinDbRow = {
  date: string;
  wyld_mm: number | null;
  syld_t_ha: number | null;
  surq_mm: number | null;
  gw_q_mm: number | null;
};

type SubbasinSeriesPoint = {
  date: string;
  wyldMm: number | null;
  syldTHa: number | null;
  surqMm: number | null;
  gwQMm: number | null;
};

type SimulatedSeriesRow = {
  date: string;
  value: number | null;
};

type PairedPoint = {
  date: string;
  observed: number | null;
  simulated: number | null;
  delta: number | null;
  absDelta: number | null;
};

type StationSimulationMetrics = {
  n: number;
  observedMean: number | null;
  simulatedMean: number | null;
  rmse: number | null;
  nse: number | null;
  r2: number | null;
  pbias: number | null;
};

export type StationSimulationResponse = {
  station: {
    stationId: number;
    stationCode: string;
    stationName: string;
    nvStationName: string;
    subbasinId: number;
    hydroId: number;
    outletId: number;
    sourceLayer: string;
    mappingMethod: string;
    confidenceScore: number;
  };
  scenario: {
    runId: number | null;
    scenarioCode: string;
    scenarioName: string | null;
    importId: number | null;
  };
  observed: {
    tsId: number | null;
    count: number;
    startDate: string | null;
    endDate: string | null;
    points: Array<{ date: string; value: number | null }>;
  };
  subbasin: {
    count: number;
    startDate: string | null;
    endDate: string | null;
    points: SubbasinSeriesPoint[];
  };
  simulated: {
    count: number;
    startDate: string | null;
    endDate: string | null;
    points: Array<{ date: string; value: number | null }>;
  };
  paired: PairedPoint[];
  metrics: StationSimulationMetrics;
  warnings: string[];
};

type GetStationSimulationParams = {
  stationId: number;
  runId?: number;
  scenarioCode?: string;
  startDate?: string;
  endDate?: string;
  view?: "full" | "paired";
};

function formatScenarioNoDataLabel(requestedScenarioCode: string, scenarioLabel: string): string {
  const fromName = scenarioLabel.match(/SSP\d+/i)?.[0]?.toUpperCase();
  if (fromName) return fromName;

  const spatial = scenarioLabel.match(/Scénario\s+\d+/i)?.[0];
  if (spatial) return spatial;

  if (requestedScenarioCode) return requestedScenarioCode.toUpperCase();
  return scenarioLabel;
}

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function toDateKey(value: string): string {
  return String(value).slice(0, 10);
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function summarizeDates<T extends { date: string }>(points: T[]) {
  if (!points.length) {
    return { count: 0, startDate: null as string | null, endDate: null as string | null };
  }

  return {
    count: points.length,
    startDate: points[0].date,
    endDate: points[points.length - 1].date,
  };
}

function pearsonR(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 2) return null;

  const n = x.length;
  const meanX = x.reduce((acc, v) => acc + v, 0) / n;
  const meanY = y.reduce((acc, v) => acc + v, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  if (denX === 0 || denY === 0) return null;
  return num / Math.sqrt(denX * denY);
}

function computeMetrics(points: PairedPoint[]): StationSimulationMetrics {
  const paired = points.filter(
    (p) => Number.isFinite(p.observed ?? NaN) && Number.isFinite(p.simulated ?? NaN)
  ) as Array<{ observed: number; simulated: number }>;

  if (!paired.length) {
    return {
      n: 0,
      observedMean: null,
      simulatedMean: null,
      rmse: null,
      nse: null,
      r2: null,
      pbias: null,
    };
  }

  const obs = paired.map((p) => p.observed);
  const sim = paired.map((p) => p.simulated);
  const n = paired.length;

  const observedMean = obs.reduce((acc, v) => acc + v, 0) / n;
  const simulatedMean = sim.reduce((acc, v) => acc + v, 0) / n;

  let sumSqErr = 0;
  let sumSqObs = 0;
  let sumObs = 0;

  for (let i = 0; i < n; i += 1) {
    const diff = sim[i] - obs[i];
    sumSqErr += diff * diff;
    sumSqObs += (obs[i] - observedMean) * (obs[i] - observedMean);
    sumObs += obs[i];
  }

  const rmse = Math.sqrt(sumSqErr / n);
  const nse = sumSqObs === 0 ? null : 1 - sumSqErr / sumSqObs;
  const r = pearsonR(obs, sim);
  const r2 = r === null ? null : r * r;
  const pbias = sumObs === 0 ? null : ((sumObs - sim.reduce((acc, v) => acc + v, 0)) / sumObs) * 100;

  return {
    n,
    observedMean,
    simulatedMean,
    rmse,
    nse,
    r2,
    pbias,
  };
}

export class StationSimulationService {
  private db = new DatabaseService();

  private async ensureInfrastructure(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS core.station_subbasin_map (
        id bigserial PRIMARY KEY,
        station_id integer NOT NULL REFERENCES core.stations(station_id),
        station_code text NOT NULL,
        station_name text NOT NULL,
        nv_station_name text NOT NULL,
        subbasin_id integer NOT NULL,
        hydro_id integer NOT NULL,
        outlet_id integer NOT NULL,
        source_layer text NOT NULL DEFAULT 'NV-Stream',
        mapping_method text NOT NULL DEFAULT 'nv_stream_station_name',
        confidence_score numeric(5,2) NOT NULL DEFAULT 1.00,
        is_primary boolean NOT NULL DEFAULT true,
        is_active boolean NOT NULL DEFAULT true,
        notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await this.db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_station_subbasin_map_station_id
        ON core.station_subbasin_map(station_id)
    `);

    await this.db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_station_subbasin_map_subbasin_id
        ON core.station_subbasin_map(subbasin_id)
    `);

    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_station_subbasin_map_active
        ON core.station_subbasin_map(is_active)
        WHERE is_active = true
    `);
  }

  private async seedMappings(): Promise<string[]> {
    const warnings: string[] = [];
    const codeHints = NV_STREAM_STATION_SEEDS.flatMap((seed) => seed.stationCodeHints);
    const nameHints = NV_STREAM_STATION_SEEDS.flatMap((seed) => seed.stationNameHints).map((value) =>
      normalizeText(value)
    );

    const stations = await this.db.query<StationLookupRow>(
      `
      SELECT station_id, station_code, name
      FROM core.stations
      WHERE station_code = ANY($1::text[])
         OR LOWER(name) = ANY($2::text[])
      `,
      [codeHints, nameHints]
    );

    const byCode = new Map<string, StationLookupRow>();
    const byName = new Map<string, StationLookupRow>();

    for (const row of stations) {
      if (row.station_code) byCode.set(normalizeText(row.station_code), row);
      if (row.name) byName.set(normalizeText(row.name), row);
    }

    const rowsToUpsert: StationMappingRow[] = [];

    for (const seed of NV_STREAM_STATION_SEEDS) {
      const resolved = this.resolveStation(seed, byCode, byName);

      if (!resolved) {
        warnings.push(
          `Unable to resolve core.stations row for NV-Stream station "${seed.nvStationName}".`
        );
        continue;
      }

      rowsToUpsert.push({
        id: 0,
        station_id: resolved.station_id,
        station_code: resolved.station_code ?? "",
        station_name: resolved.name ?? "",
        nv_station_name: seed.nvStationName,
        subbasin_id: seed.subbasinId,
        hydro_id: seed.hydroId,
        outlet_id: seed.outletId,
        source_layer: "NV-Stream",
        mapping_method: "nv_stream_station_name",
        confidence_score: "1.00",
        is_primary: true,
        is_active: true,
        notes: "Auto-seeded from NV-Stream layer",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    for (const row of rowsToUpsert) {
      await this.db.execute(
        `
        INSERT INTO core.station_subbasin_map (
          station_id,
          station_code,
          station_name,
          nv_station_name,
          subbasin_id,
          hydro_id,
          outlet_id,
          source_layer,
          mapping_method,
          confidence_score,
          is_primary,
          is_active,
          notes,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now()
        )
        ON CONFLICT (station_id) DO UPDATE
        SET
          station_code = EXCLUDED.station_code,
          station_name = EXCLUDED.station_name,
          nv_station_name = EXCLUDED.nv_station_name,
          subbasin_id = EXCLUDED.subbasin_id,
          hydro_id = EXCLUDED.hydro_id,
          outlet_id = EXCLUDED.outlet_id,
          source_layer = EXCLUDED.source_layer,
          mapping_method = EXCLUDED.mapping_method,
          confidence_score = EXCLUDED.confidence_score,
          is_primary = EXCLUDED.is_primary,
          is_active = EXCLUDED.is_active,
          notes = EXCLUDED.notes,
          updated_at = now()
        `,
        [
          row.station_id,
          row.station_code,
          row.station_name,
          row.nv_station_name,
          row.subbasin_id,
          row.hydro_id,
          row.outlet_id,
          row.source_layer,
          row.mapping_method,
          row.confidence_score,
          row.is_primary,
          row.is_active,
          row.notes,
        ]
      );
    }

    return warnings;
  }

  private resolveStation(
    seed: NvStreamStationSeed,
    byCode: Map<string, StationLookupRow>,
    byName: Map<string, StationLookupRow>
  ): StationLookupRow | null {
    for (const codeHint of seed.stationCodeHints) {
      const match = byCode.get(normalizeText(codeHint));
      if (match) return match;
    }

    for (const nameHint of seed.stationNameHints) {
      const match = byName.get(normalizeText(nameHint));
      if (match) return match;
    }

    return null;
  }

  private async ensureSeeded(): Promise<string[]> {
    await this.ensureInfrastructure();
    return this.seedMappings();
  }

  async initializeMappings(): Promise<string[]> {
    return this.ensureSeeded();
  }

  private async resolveScenario(runId?: number): Promise<ScenarioRow> {
    if (typeof runId === "number" && Number.isFinite(runId)) {
      const canonical = NORMALIZED_SWAT_SCENARIO_BY_RUN_ID.get(runId);
      if (canonical) {
        return {
          run_id: canonical.run_id,
          scenario_code: canonical.scenario_code,
          scenario_name: canonical.scenario_name,
          is_observed: false,
          import_id: null,
        };
      }

      const requested = await this.db.queryOne<ScenarioRow>(
        `
        SELECT run_id, scenario_code, scenario_name, is_observed, NULL::bigint AS import_id
        FROM public.model_runs
        WHERE run_id = $1
        LIMIT 1
        `,
        [runId]
      );

      if (requested && requested.is_observed === false && requested.scenario_code) {
        return requested;
      }
      if (requested?.scenario_code) {
        return requested;
      }
    }

    const baselineScenario = await this.db.queryOne<ScenarioRow>(
      `
      SELECT run_id, scenario_code, scenario_name, is_observed, NULL::bigint AS import_id
      FROM public.model_runs
      WHERE is_observed = false
        AND scenario_code = 'etat_actuel'
      LIMIT 1
      `
    );

    if (baselineScenario?.scenario_code) {
      return baselineScenario;
    }

    const latestSimulatedRun = await this.db.queryOne<ScenarioRow>(
      `
      SELECT run_id, scenario_code, scenario_name, is_observed, NULL::bigint AS import_id
      FROM public.model_runs
      WHERE is_observed = false
      ORDER BY run_id DESC
      LIMIT 1
      `
    );

    if (latestSimulatedRun?.scenario_code) {
      return latestSimulatedRun;
    }

    const latestAccessImport = await this.db.queryOne<ScenarioRow>(
      `
      SELECT
        NULL::integer AS run_id,
        scenario_code,
        scenario_code AS scenario_name,
        NULL::boolean AS is_observed,
        import_id
      FROM access.rch_results
      ORDER BY import_id DESC
      LIMIT 1
      `
    );

    return (
      latestAccessImport || {
        run_id: null,
        scenario_code: "etat_actuel",
        scenario_name: "Scénario état actuel",
        is_observed: false,
        import_id: null,
      }
    );
  }

  private async loadObservedStreamflow(stationId: number, startDate?: string, endDate?: string) {
    const tsRow = await this.db.queryOne<{ ts_id: number }>(
      `
      SELECT t.ts_id
      FROM public.timeseries t
      JOIN ref.observed_properties p
        ON p.property_id = t.property_id
      WHERE t.station_id = $1
        AND t.source_type = 'observed'
        AND p.standard_name = 'STREAMFLOW'
      ORDER BY t.created_at DESC NULLS LAST, t.ts_id DESC
      LIMIT 1
      `,
      [stationId]
    );

    if (!tsRow) {
      return {
        tsId: null,
        points: [] as Array<{ date: string; value: number | null }>,
      };
    }

    const rows = await this.db.query<ObservedSeriesRow>(
      `
      SELECT
        $1::int AS ts_id,
        m.datetime::date::text AS date,
        AVG(m.value)::double precision AS value
      FROM public.measurements m
      WHERE m.ts_id = $1
        AND ($2::date IS NULL OR m.datetime::date >= $2::date)
        AND ($3::date IS NULL OR m.datetime::date <= $3::date)
      GROUP BY m.datetime::date
      ORDER BY m.datetime::date
      `,
      [tsRow.ts_id, startDate ?? null, endDate ?? null]
    );

    return {
      tsId: tsRow.ts_id,
      points: rows.map((row) => ({
        date: toDateKey(row.date),
        value: toNumber(row.value),
      })),
    };
  }

  private async loadSubbasinResults(
    subbasinId: number,
    scenarioCode: string,
    startDate?: string,
    endDate?: string
  ) {
    if (await this.db.relationExists("api.mv_hydro_station_timeseries")) {
      const params: unknown[] = [subbasinId, scenarioCode, "sub"];
      const where: string[] = [
        "sub_code = $1",
        "scenario_code = $2",
        "source_table = $3",
        "syld_t_ha IS NOT NULL",
      ];

      if (startDate) {
        params.push(startDate);
        where.push(`period_date >= $${params.length}::date`);
      }
      if (endDate) {
        params.push(endDate);
        where.push(`period_date <= $${params.length}::date`);
      }

      const rows = await this.db.query<SubbasinDbRow>(
        `
        SELECT
          period_date::date::text AS date,
          AVG(wyld_mm)::double precision AS wyld_mm,
          AVG(syld_t_ha)::double precision AS syld_t_ha,
          AVG(surq_mm)::double precision AS surq_mm,
          AVG(gw_q_mm)::double precision AS gw_q_mm
        FROM api.mv_hydro_station_timeseries
        WHERE ${where.join(" AND ")}
        GROUP BY period_date
        ORDER BY period_date
        `,
        params
      );

      return rows.map((row) => ({
        date: toDateKey(row.date),
        wyldMm: toNumber(row.wyld_mm),
        syldTHa: toNumber(row.syld_t_ha),
        surqMm: toNumber(row.surq_mm),
        gwQMm: toNumber(row.gw_q_mm),
      }));
    }

    const rows = await this.db.query<SubbasinDbRow>(
      `
      SELECT
        r.period_date::date::text AS date,
        AVG(r.wyld_mm)::double precision AS wyld_mm,
        AVG(r.syld_t_ha)::double precision AS syld_t_ha,
        AVG(r.surq_mm)::double precision AS surq_mm,
        AVG(r.gw_q_mm)::double precision AS gw_q_mm
      FROM access.sub_results r
      WHERE r.sub_code = $1
        AND r.scenario_code = $2
        AND ($3::date IS NULL OR r.period_date >= $3::date)
        AND ($4::date IS NULL OR r.period_date <= $4::date)
      GROUP BY r.period_date::date
      ORDER BY r.period_date::date
      `,
      [subbasinId, scenarioCode, startDate ?? null, endDate ?? null]
    );

    return rows.map((row) => ({
      date: toDateKey(row.date),
      wyldMm: toNumber(row.wyld_mm),
      syldTHa: toNumber(row.syld_t_ha),
      surqMm: toNumber(row.surq_mm),
      gwQMm: toNumber(row.gw_q_mm),
    }));
  }

  private async loadSimulatedFlow(
    stationId: number,
    _subbasinId: number,
    scenarioCode: string,
    runId?: number,
    startDate?: string,
    endDate?: string
  ) {
    const fromHydro = await hydroSwatSeriesService.loadStrictRchFlowSeries(
      stationId,
      scenarioCode,
      startDate,
      endDate
    );
    if (fromHydro.length) {
      return fromHydro.map((row) => ({
        date: row.date,
        value: row.value,
      }));
    }

    if (runId) {
      return this.loadSimulatedFlowFromCoreTimeseries(stationId, runId, startDate, endDate);
    }

    return [];
  }

  private async loadSimulatedFlowFromCoreTimeseries(
    stationId: number,
    runId: number,
    startDate?: string,
    endDate?: string
  ) {
    const params: unknown[] = [stationId, runId];
    const where: string[] = [
      "t.station_id = $1",
      "t.run_id = $2",
      "t.source_type = 'simulated'",
      "op.standard_name = 'SWAT_FLOW_M3S'",
    ];

    if (startDate) {
      params.push(startDate);
      where.push(`m.datetime::date >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      where.push(`m.datetime::date <= $${params.length}::date`);
    }

    const rows = await this.db.query<SimulatedSeriesRow>(
      `
      SELECT
        m.datetime::date::text AS date,
        AVG(m.value)::double precision AS value
      FROM core.measurements m
      JOIN core.timeseries t ON t.ts_id = m.ts_id
      JOIN ref.observed_properties op ON op.property_id = t.property_id
      WHERE ${where.join(" AND ")}
      GROUP BY m.datetime::date
      ORDER BY m.datetime::date
      `,
      params
    );

    return rows.map((row) => ({
      date: toDateKey(row.date),
      value: toNumber(row.value),
    }));
  }

  private buildPairedSeries(
    observed: Array<{ date: string; value: number | null }>,
    simulated: Array<{ date: string; value: number | null }>
  ): PairedPoint[] {
    const observedByDate = new Map<string, number | null>();
    const simulatedByDate = new Map<string, number | null>();

    for (const row of observed) observedByDate.set(row.date, row.value);
    for (const row of simulated) simulatedByDate.set(row.date, row.value);

    const dates = Array.from(new Set([...observedByDate.keys(), ...simulatedByDate.keys()])).sort();

    return dates.map((date) => {
      const observedValue = observedByDate.get(date) ?? null;
      const simulatedValue = simulatedByDate.get(date) ?? null;
      const delta =
        Number.isFinite(observedValue ?? NaN) && Number.isFinite(simulatedValue ?? NaN)
          ? (simulatedValue as number) - (observedValue as number)
          : null;

      return {
        date,
        observed: observedValue,
        simulated: simulatedValue,
        delta,
        absDelta: delta === null ? null : Math.abs(delta),
      };
    });
  }

  async getStationSimulations(params: GetStationSimulationParams): Promise<StationSimulationResponse> {
    const warnings = await this.ensureSeeded();

    const mapping = await this.db.queryOne<StationMappingRow>(
      `
      SELECT *
      FROM core.station_subbasin_map
      WHERE station_id = $1
        AND is_active = true
      ORDER BY is_primary DESC, updated_at DESC, id DESC
      LIMIT 1
      `,
      [params.stationId]
    );

    if (!mapping) {
      throw new Error(`No station_subbasin mapping found for station_id=${params.stationId}`);
    }

    const scenario = await this.resolveScenario(params.runId);
    const requestedScenarioCode = String(params.scenarioCode || scenario.scenario_code || "").trim();
    const scenarioLabel =
      NORMALIZED_SWAT_SCENARIO_BY_CODE.get(requestedScenarioCode)?.scenario_name ||
      scenario.scenario_name ||
      requestedScenarioCode;
    const responseView = params.view === "paired" ? "paired" : "full";
    const includeRawSeries = responseView === "full";

    const [observed, subbasin, simulated] = await Promise.all([
      this.loadObservedStreamflow(params.stationId, params.startDate, params.endDate),
      includeRawSeries
        ? this.loadSubbasinResults(
            mapping.subbasin_id,
            requestedScenarioCode,
            params.startDate,
            params.endDate
          )
        : Promise.resolve([] as SubbasinSeriesPoint[]),
      this.loadSimulatedFlow(
        params.stationId,
        mapping.subbasin_id,
        requestedScenarioCode,
        params.runId,
        params.startDate,
        params.endDate
      ),
    ]);

    const paired = this.buildPairedSeries(observed.points, simulated);
    const metrics = computeMetrics(paired);
    const observedSummary = summarizeDates(observed.points);
    const subbasinSummary = summarizeDates(subbasin);
    const simulatedSummary = summarizeDates(simulated);

    if (!observed.points.length) {
      warnings.push(`Aucune série observée de débit trouvée pour cette station.`);
    }

    if (!simulated.length) {
      warnings.push(
        `Aucune donnée simulée disponible pour ${formatScenarioNoDataLabel(requestedScenarioCode, scenarioLabel)} sur cette station.`
      );
    }

    return {
      station: {
        stationId: mapping.station_id,
        stationCode: mapping.station_code,
        stationName: mapping.station_name,
        nvStationName: mapping.nv_station_name,
        subbasinId: mapping.subbasin_id,
        hydroId: mapping.hydro_id,
        outletId: mapping.outlet_id,
        sourceLayer: mapping.source_layer,
        mappingMethod: mapping.mapping_method,
        confidenceScore: Number(mapping.confidence_score),
      },
      scenario: {
        runId: scenario.run_id,
        scenarioCode: requestedScenarioCode,
        scenarioName: scenarioLabel,
        importId: scenario.import_id,
      },
      observed: {
        tsId: observed.tsId,
        ...observedSummary,
        points: includeRawSeries ? observed.points : [],
      },
      subbasin: {
        ...subbasinSummary,
        points: includeRawSeries ? subbasin : [],
      },
      simulated: {
        ...simulatedSummary,
        points: includeRawSeries ? simulated : [],
      },
      paired,
      metrics,
      warnings,
    };
  }
}

export const stationSimulationService = new StationSimulationService();
