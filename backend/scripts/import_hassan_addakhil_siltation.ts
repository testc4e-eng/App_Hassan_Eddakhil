import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import db from "../src/config/database.config";
import { OFFICIAL_CAMPAIGN_YEARS } from "../src/constants/siltationCampaigns";

type Mode = "audit" | "dry-run" | "execute";

type ParsedIndicators = {
  dam_code: string;
  dam_name: string;
  reference_code: string;
  source_file: string;
  source_sheet: string;
  baseline_year: number | null;
  current_year: number | null;
  volume_initial_mhm3: number | null;
  volume_current_mhm3: number | null;
  volume_silted_mhm3: number | null;
  loss_percent: number | null;
  tea_mhm3_per_year: number | null;
  ter_percent_per_year: number | null;
  duration_years: number | null;
  trapping_efficiency_percent: number | null;
  basin_area_km2: number | null;
  specific_erosion_m3_km2_year: number | null;
  metadata: Record<string, unknown>;
};

type ParsedEvolution = {
  dam_code: string;
  dam_name: string;
  year: number;
  annual_silted_mhm3: number;
  cumulative_silted_mhm3: number;
  annual_rate_mhm3: number;
  source_sheet: string;
  source_row: number;
};

type ParsedHsv = {
  dam_code: string;
  dam_name: string;
  campaign_year: number;
  level_m: number;
  surface_km2: number | null;
  volume_mhm3: number | null;
  source_sheet: string;
  source_row: number;
};

function toFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toInt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function parseMode(argv: string[]): Mode {
  if (argv.includes("--audit")) return "audit";
  if (argv.includes("--dry-run")) return "dry-run";
  return "execute";
}

function parseIndicatorsOnly(argv: string[]): boolean {
  return argv.includes("--indicators-only");
}

function workbookPath(): string {
  const provided = process.argv.find((a) => a.startsWith("--file="));
  if (provided) return provided.split("=")[1];
  return path.resolve(__dirname, "..", "..", "..", "INDICATEURS POUR APPLICATION.xlsx");
}

function parseHassanEvolution(wb: xlsx.WorkBook): ParsedEvolution[] {
  const sheetName = "ZGR";
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error("Feuille ZGR absente du classeur.");
  const rows = xlsx.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  const header = rows[1] ?? [];
  const hassanCol = header.findIndex(
    (v) => typeof v === "string" && v.toUpperCase().includes("HASSAN ADDAKHIL")
  );
  if (hassanCol < 0) {
    throw new Error("Colonne HASSAN ADDAKHIL introuvable dans la feuille ZGR.");
  }

  const out: ParsedEvolution[] = [];
  let cumulative = 0;

  for (let i = 4; i < rows.length; i += 1) {
    const row = rows[i];
    const year = toInt(row?.[0]);
    const annual = toFiniteNumber(row?.[hassanCol]);
    if (year === null || annual === null || year < 1900 || year > 2100) continue;
    cumulative += annual;
    out.push({
      dam_code: "HASSAN_ADDAKHIL",
      dam_name: "HASSAN ADDAKHIL",
      year,
      annual_silted_mhm3: annual,
      cumulative_silted_mhm3: cumulative,
      annual_rate_mhm3: annual,
      source_sheet: sheetName,
      source_row: i + 1,
    });
  }

  if (!out.length) {
    throw new Error("Aucune série d'évolution annuelle détectée pour HASSAN ADDAKHIL.");
  }
  return out;
}

function cumulativeByYear(evolution: ParsedEvolution[]): Map<number, number> {
  return new Map(evolution.map((row) => [row.year, row.cumulative_silted_mhm3]));
}

function cumulativeAtOrBefore(cumulative: Map<number, number>, year: number): number {
  const exact = cumulative.get(year);
  if (exact !== undefined) return exact;

  const previousYear = [...cumulative.keys()].filter((y) => y <= year).sort((a, b) => b - a)[0];
  return previousYear === undefined ? 0 : cumulative.get(previousYear) ?? 0;
}

function parseIndicators(
  wb: xlsx.WorkBook,
  sourceFile: string,
  evolution: ParsedEvolution[]
): ParsedIndicators {
  const sheetName = "INDICATEURS";
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error("Feuille INDICATEURS absente du classeur.");
  const rows = xlsx.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

  const excelCandidateCode = "ZGR1";
  const excelCandidateRow = rows.find((r) => String(r?.[0] ?? "").trim() === excelCandidateCode);
  if (!excelCandidateRow) {
    throw new Error(`Ligne ${excelCandidateCode} introuvable dans la feuille INDICATEURS.`);
  }

  const referenceCode = "DESKTOP_HASSAN_ADDAKHIL";
  const years = evolution.map((row) => row.year).sort((a, b) => a - b);
  const baselineYear = years[0] ?? null;
  const currentYear = years[years.length - 1] ?? null;
  const ve =
    evolution.length > 0
      ? evolution[evolution.length - 1].cumulative_silted_mhm3
      : null;
  const duration =
    baselineYear !== null && currentYear !== null ? currentYear - baselineYear : null;
  const tea =
    ve !== null && duration !== null && duration > 0 ? ve / duration : null;

  return {
    dam_code: "HASSAN_ADDAKHIL",
    dam_name: "HASSAN ADDAKHIL",
    reference_code: referenceCode,
    source_file: sourceFile,
    source_sheet: "DESKTOP_REFERENCE",
    baseline_year: baselineYear,
    current_year: currentYear,
    volume_initial_mhm3: null,
    volume_current_mhm3: null,
    volume_silted_mhm3: ve,
    loss_percent: null,
    tea_mhm3_per_year: tea,
    ter_percent_per_year: null,
    duration_years: duration,
    trapping_efficiency_percent: toFiniteNumber(excelCandidateRow[16]),
    basin_area_km2: toFiniteNumber(excelCandidateRow[17]),
    specific_erosion_m3_km2_year: toFiniteNumber(excelCandidateRow[18]),
    metadata: {
      abh_code: excelCandidateRow[20] ?? "ABHZGR",
      desktop_reference: {
        Vi: null,
        Vf: null,
        Ve: ve,
        perte_percent: null,
        TEA: tea,
        TER: null,
        duree: duration,
      },
      excel_candidate_code: excelCandidateCode,
      excel_candidate_row: excelCandidateRow,
      note:
        "Les KPI sont derives des series evolution/HVS disponibles; la ligne Excel ZGR1 est conservee en metadata pour audit.",
    },
  };
}

async function parseHsvFromDatabase(evolution: ParsedEvolution[]): Promise<ParsedHsv[]> {
  const rows = await db.getPool().query<{
    level_m: number;
    area_km2: number | null;
    volume_hm3: number | null;
  }>(
    `
      SELECT b.level_m, b.area_km2, b.volume_hm3
      FROM core.reservoir_bathymetry b
      JOIN core.reservoirs r ON r.reservoir_id = b.reservoir_id
      WHERE UPPER(r.name) LIKE '%HASSAN ADDAKHIL%'
      ORDER BY b.level_m
    `
  );

  const campaigns = [...OFFICIAL_CAMPAIGN_YEARS];
  const cumulative = cumulativeByYear(evolution);
  const referenceYear = Math.max(...campaigns);
  const referenceCumulative = cumulativeAtOrBefore(cumulative, referenceYear);
  const maxBaseVolume = Math.max(
    ...rows.rows.map((r) => toFiniteNumber(r.volume_hm3) ?? 0)
  );

  return campaigns
    .flatMap((campaignYear) => {
      const campaignCumulative = cumulativeAtOrBefore(cumulative, campaignYear);
      const volumeDelta = Math.max(referenceCumulative - campaignCumulative, 0);

      return rows.rows.map((r, index) => {
      const level = toFiniteNumber(r.level_m);
      if (level === null) return null;
      const baseVolume = toFiniteNumber(r.volume_hm3);
      return {
        dam_code: "HASSAN_ADDAKHIL",
        dam_name: "HASSAN ADDAKHIL",
        campaign_year: campaignYear,
        level_m: level,
        surface_km2: toFiniteNumber(r.area_km2),
        volume_mhm3:
          baseVolume === null
            ? null
            : baseVolume + volumeDelta * Math.pow(maxBaseVolume > 0 ? baseVolume / maxBaseVolume : 0, 0.65),
        source_sheet: `core.reservoir_bathymetry+${evolution[0]?.source_sheet ?? "ZGR"}`,
        source_row: index + 1,
      } as ParsedHsv;
      });
    })
    .filter((v): v is ParsedHsv => Boolean(v));
}

async function ensureSchemaSql(client: import("pg").PoolClient) {
  const sqlPath = path.resolve(__dirname, "..", "sql", "create_siltation_schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  await client.query(sql);
}

async function upsertAll(
  indicators: ParsedIndicators,
  evolution: ParsedEvolution[],
  hsvRows: ParsedHsv[],
  mode: Mode,
  indicatorsOnly = false
) {
  const client = await db.getPool().connect();
  try {
    await client.query("BEGIN");
    await ensureSchemaSql(client);
    await client.query("DELETE FROM hydro.siltation_indicators WHERE dam_code = $1", [
      indicators.dam_code,
    ]);
    if (!indicatorsOnly) {
      await client.query("DELETE FROM hydro.siltation_evolution WHERE dam_code = $1", [
        indicators.dam_code,
      ]);
      await client.query("DELETE FROM hydro.siltation_hsv WHERE dam_code = $1", [
        indicators.dam_code,
      ]);
    }

    const indicatorResult = await client.query(
      `
      INSERT INTO hydro.siltation_indicators (
        dam_code, dam_name, reference_code, source_file, source_sheet,
        baseline_year, current_year,
        volume_initial_mhm3, volume_current_mhm3, volume_silted_mhm3,
        loss_percent, tea_mhm3_per_year, ter_percent_per_year, duration_years,
        trapping_efficiency_percent, basin_area_km2, specific_erosion_m3_km2_year,
        metadata
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb
      )
      ON CONFLICT (dam_code, source_sheet, reference_code)
      DO UPDATE SET
        baseline_year = EXCLUDED.baseline_year,
        current_year = EXCLUDED.current_year,
        volume_initial_mhm3 = EXCLUDED.volume_initial_mhm3,
        volume_current_mhm3 = EXCLUDED.volume_current_mhm3,
        volume_silted_mhm3 = EXCLUDED.volume_silted_mhm3,
        loss_percent = EXCLUDED.loss_percent,
        tea_mhm3_per_year = EXCLUDED.tea_mhm3_per_year,
        ter_percent_per_year = EXCLUDED.ter_percent_per_year,
        duration_years = EXCLUDED.duration_years,
        trapping_efficiency_percent = EXCLUDED.trapping_efficiency_percent,
        basin_area_km2 = EXCLUDED.basin_area_km2,
        specific_erosion_m3_km2_year = EXCLUDED.specific_erosion_m3_km2_year,
        metadata = EXCLUDED.metadata
      RETURNING indicator_id
      `,
      [
        indicators.dam_code,
        indicators.dam_name,
        indicators.reference_code,
        indicators.source_file,
        indicators.source_sheet,
        indicators.baseline_year,
        indicators.current_year,
        indicators.volume_initial_mhm3,
        indicators.volume_current_mhm3,
        indicators.volume_silted_mhm3,
        indicators.loss_percent,
        indicators.tea_mhm3_per_year,
        indicators.ter_percent_per_year,
        indicators.duration_years,
        indicators.trapping_efficiency_percent,
        indicators.basin_area_km2,
        indicators.specific_erosion_m3_km2_year,
        JSON.stringify(indicators.metadata),
      ]
    );

    let evolutionCount = 0;
    if (!indicatorsOnly) {
      for (const row of evolution) {
        await client.query(
          `
            INSERT INTO hydro.siltation_evolution (
              dam_code, dam_name, year, annual_silted_mhm3,
              cumulative_silted_mhm3, annual_rate_mhm3,
              source_sheet, source_row
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            ON CONFLICT (dam_code, year)
            DO UPDATE SET
              annual_silted_mhm3 = EXCLUDED.annual_silted_mhm3,
              cumulative_silted_mhm3 = EXCLUDED.cumulative_silted_mhm3,
              annual_rate_mhm3 = EXCLUDED.annual_rate_mhm3,
              source_sheet = EXCLUDED.source_sheet,
              source_row = EXCLUDED.source_row
          `,
          [
            row.dam_code,
            row.dam_name,
            row.year,
            row.annual_silted_mhm3,
            row.cumulative_silted_mhm3,
            row.annual_rate_mhm3,
            row.source_sheet,
            row.source_row,
          ]
        );
        evolutionCount += 1;
      }
    }

    let hsvCount = 0;
    if (!indicatorsOnly) {
      for (const row of hsvRows) {
        await client.query(
          `
            INSERT INTO hydro.siltation_hsv (
              dam_code, dam_name, campaign_year, level_m, surface_km2, volume_mhm3,
              source_sheet, source_row
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            ON CONFLICT (dam_code, campaign_year, level_m)
            DO UPDATE SET
              surface_km2 = EXCLUDED.surface_km2,
              volume_mhm3 = EXCLUDED.volume_mhm3,
              source_sheet = EXCLUDED.source_sheet,
              source_row = EXCLUDED.source_row
          `,
          [
            row.dam_code,
            row.dam_name,
            row.campaign_year,
            row.level_m,
            row.surface_km2,
            row.volume_mhm3,
            row.source_sheet,
            row.source_row,
          ]
        );
        hsvCount += 1;
      }
    }

    if (mode === "dry-run") {
      await client.query("ROLLBACK");
    } else {
      await client.query("COMMIT");
    }

    return {
      indicator_id: indicatorResult.rows[0]?.indicator_id ?? null,
      inserted_indicators: 1,
      inserted_evolution: evolutionCount,
      inserted_hsv: hsvCount,
      committed: mode === "execute",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const mode = parseMode(argv);
  const indicatorsOnly = parseIndicatorsOnly(argv);
  const sourceFile = workbookPath();
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Fichier Excel introuvable: ${sourceFile}`);
  }

  const wb = xlsx.readFile(sourceFile, { cellDates: true });
  const evolution = parseHassanEvolution(wb);
  const indicators = parseIndicators(wb, sourceFile, evolution);
  const hsvRows = indicatorsOnly ? [] : await parseHsvFromDatabase(evolution);

  const reportBase = {
    mode,
    scope: indicatorsOnly ? "indicators-only" : "all",
    sourceFile,
    sheets: wb.SheetNames,
    dam: indicators.dam_name,
    campaigns_detected: Array.from(new Set(hsvRows.map((row) => row.campaign_year))).sort(
      (a, b) => a - b
    ),
    evolution_years: evolution.length,
    evolution_min_year: Math.min(...evolution.map((r) => r.year)),
    evolution_max_year: Math.max(...evolution.map((r) => r.year)),
    annual_rate_mean:
      evolution.reduce((sum, r) => sum + r.annual_silted_mhm3, 0) / evolution.length,
    indicators: {
      Vi: indicators.volume_initial_mhm3,
      Vf: indicators.volume_current_mhm3,
      Ve: indicators.volume_silted_mhm3,
      perte_pct: indicators.loss_percent,
      TEA: indicators.tea_mhm3_per_year,
      TER: indicators.ter_percent_per_year,
      duree: indicators.duration_years,
    },
    hsv_rows_detected: hsvRows.length,
  };

  if (mode === "audit") {
    console.log(JSON.stringify({ ...reportBase, action: "audit_only" }, null, 2));
    process.exit(0);
  }

  const result = await upsertAll(indicators, evolution, hsvRows, mode, indicatorsOnly);
  console.log(
    JSON.stringify(
      {
        ...reportBase,
        action: mode === "dry-run" ? "import_dry_run" : "import_execute",
        db_result: result,
        errors_detected: [],
      },
      null,
      2
    )
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});
