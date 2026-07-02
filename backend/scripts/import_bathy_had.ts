import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import db from "../src/config/database.config";
import {
  BATHY_HAD_NORMAL_LEVEL_M,
} from "../src/constants/bathymetryCampaigns";

type Mode = "audit" | "dry-run" | "execute";

type ParsedCampaign = {
  dam_code: string;
  dam_name: string;
  measurement_year: number;
  campaign_year: number;
  normal_level_m: number;
  volume_mhm3: number;
  silted_since_previous_mhm3: number | null;
  annual_siltation_rate_mhm3: number | null;
  cumulative_silted_mhm3: number | null;
  source_file: string;
  source_sheet: string;
  source_row: number;
  metadata: Record<string, unknown>;
};

function parseMode(argv: string[]): Mode {
  if (argv.includes("--execute")) return "execute";
  if (argv.includes("--dry-run")) return "dry-run";
  return "audit";
}

function workbookPath(): string {
  const fromEnv = process.env.BATHY_HAD_XLSX?.trim();
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const candidate = path.resolve(__dirname, "../../../bathy_HAD.xlsx");
  if (fs.existsSync(candidate)) return candidate;
  return "D:/3- Projets/hassanAddakhil/bathy_HAD.xlsx";
}

function toFinite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseWorkbook(sourceFile: string): ParsedCampaign[] {
  const wb = xlsx.readFile(sourceFile, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Classeur Excel vide.");

  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

  let normalLevel = BATHY_HAD_NORMAL_LEVEL_M;
  for (const row of rows.slice(0, 6)) {
    if (!Array.isArray(row)) continue;
    const label = String(row[2] ?? "").trim().toUpperCase();
    if (label.includes("COTE NORMALE")) {
      const parsed = toFinite(row[3]);
      if (parsed !== null) normalLevel = parsed;
    }
  }

  const parsedRows: ParsedCampaign[] = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!Array.isArray(row)) continue;

    const measurementYear = toFinite(row[0]);
    const volume = toFinite(row[1]);
    if (measurementYear === null || measurementYear < 1900 || volume === null) continue;

    const campaignYear = measurementYear;

    parsedRows.push({
      dam_code: "HASSAN_ADDAKHIL",
      dam_name: "HASSAN ADDAKHIL",
      measurement_year: measurementYear,
      campaign_year: campaignYear,
      normal_level_m: normalLevel,
      volume_mhm3: volume,
      silted_since_previous_mhm3: toFinite(row[2]),
      annual_siltation_rate_mhm3: toFinite(row[3]),
      cumulative_silted_mhm3: toFinite(row[4]),
      source_file: sourceFile,
      source_sheet: sheetName,
      source_row: index + 1,
      metadata: {},
    });
  }

  if (!parsedRows.length) {
    throw new Error("Aucune campagne bathymetrique detectee dans bathy_HAD.xlsx.");
  }

  return parsedRows.sort((a, b) => a.measurement_year - b.measurement_year);
}

async function ensureSchema(client: import("pg").PoolClient) {
  const sqlPath = path.resolve(__dirname, "..", "sql", "create_bathymetry_campaigns_schema.sql");
  await client.query(fs.readFileSync(sqlPath, "utf8"));
}

async function upsertCampaigns(rows: ParsedCampaign[], mode: Mode) {
  const client = await db.getPool().connect();
  try {
    await client.query("BEGIN");
    await ensureSchema(client);
    await client.query("DELETE FROM hydro.bathymetry_campaigns WHERE dam_code = $1", [
      rows[0]?.dam_code ?? "HASSAN_ADDAKHIL",
    ]);

    for (const row of rows) {
      await client.query(
        `
        INSERT INTO hydro.bathymetry_campaigns (
          dam_code, dam_name, measurement_year, campaign_year, normal_level_m,
          volume_mhm3, silted_since_previous_mhm3, annual_siltation_rate_mhm3,
          cumulative_silted_mhm3, source_file, source_sheet, source_row, metadata
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb
        )
        `,
        [
          row.dam_code,
          row.dam_name,
          row.measurement_year,
          row.campaign_year,
          row.normal_level_m,
          row.volume_mhm3,
          row.silted_since_previous_mhm3,
          row.annual_siltation_rate_mhm3,
          row.cumulative_silted_mhm3,
          row.source_file,
          row.source_sheet,
          row.source_row,
          JSON.stringify(row.metadata),
        ]
      );
    }

    if (mode === "dry-run") {
      await client.query("ROLLBACK");
    } else {
      await client.query("COMMIT");
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  const sourceFile = workbookPath();
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Fichier introuvable: ${sourceFile}`);
  }

  const campaigns = parseWorkbook(sourceFile);
  const report = {
    mode,
    sourceFile,
    sheet: campaigns[0]?.source_sheet ?? "Sheet1",
    normal_level_m: campaigns[0]?.normal_level_m ?? BATHY_HAD_NORMAL_LEVEL_M,
    campaigns: campaigns.map((row) => ({
      measurement_year: row.measurement_year,
      campaign_year: row.campaign_year,
      volume_mhm3: row.volume_mhm3,
      silted_since_previous_mhm3: row.silted_since_previous_mhm3,
      cumulative_silted_mhm3: row.cumulative_silted_mhm3,
      metadata: row.metadata,
    })),
  };

  if (mode === "audit") {
    console.log(JSON.stringify({ ...report, action: "audit_only" }, null, 2));
    process.exit(0);
  }

  await upsertCampaigns(campaigns, mode);
  console.log(
    JSON.stringify(
      {
        ...report,
        action: mode === "dry-run" ? "import_dry_run" : "import_execute",
        inserted_campaigns: campaigns.length,
        committed: mode === "execute",
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
      { success: false, error: error instanceof Error ? error.message : String(error) },
      null,
      2
    )
  );
  process.exit(1);
});
