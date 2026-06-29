import PDFDocument from "pdfkit";
import xlsx from "xlsx";
import {
  BATHY_PERIOD_DEFINITIONS,
  buildPeriodVolumesFromBathymetryCampaigns,
} from "../constants/bathymetryCampaigns";
import { OFFICIAL_CAMPAIGN_YEARS } from "../constants/siltationCampaigns";
import {
  BathymetryCampaignRow,
  BathymetryCampaignsResponse,
  BathymetryPeriodVolumeRow,
  SiltationAvailability,
  SiltationEvolutionRow,
  SiltationHsvRow,
  SiltationIndicatorRow,
} from "../types/siltation.types";
import { DatabaseService } from "./database.service";

type ReservoirBathymetryPoint = {
  level_m: number;
  volume_hm3: number | null;
};

export class SiltationService {
  private db = new DatabaseService();

  private toFinite(value: unknown): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  async getBathymetryCampaigns(damCode = "HASSAN_ADDAKHIL"): Promise<BathymetryCampaignRow[]> {
    return this.db.query<BathymetryCampaignRow>(
      `
      SELECT
        campaign_id,
        dam_code,
        dam_name,
        measurement_year,
        campaign_year,
        normal_level_m::double precision AS normal_level_m,
        volume_mhm3::double precision AS volume_mhm3,
        silted_since_previous_mhm3::double precision AS silted_since_previous_mhm3,
        annual_siltation_rate_mhm3::double precision AS annual_siltation_rate_mhm3,
        cumulative_silted_mhm3::double precision AS cumulative_silted_mhm3,
        source_file,
        source_sheet,
        metadata
      FROM hydro.bathymetry_campaigns
      WHERE dam_code = $1
      ORDER BY campaign_year
      `,
      [damCode]
    );
  }

  async getBathymetryCampaignsPackage(damCode = "HASSAN_ADDAKHIL"): Promise<BathymetryCampaignsResponse | null> {
    const campaigns = await this.getBathymetryCampaigns(damCode);
    if (!campaigns.length) return null;

    const periods = buildPeriodVolumesFromBathymetryCampaigns(campaigns);
    const campaignYears = campaigns.map((row) => Number(row.campaign_year));
    const first = campaigns[0];

    return {
      dam_code: damCode,
      dam_name: first.dam_name,
      source_file: first.source_file,
      normal_level_m: this.toFinite(first.normal_level_m),
      campaigns,
      periods,
      campaignYears,
    };
  }

  private async fetchReservoirBathymetryRows(): Promise<ReservoirBathymetryPoint[]> {
    return this.db.query<ReservoirBathymetryPoint>(
      `
      SELECT b.level_m::double precision AS level_m, b.volume_hm3::double precision AS volume_hm3
      FROM core.reservoir_bathymetry b
      JOIN core.reservoirs r ON r.reservoir_id = b.reservoir_id
      WHERE UPPER(r.name) LIKE '%HASSAN ADDAKHIL%'
      ORDER BY b.level_m
      `
    );
  }

  private buildHsvRowsFromBathyCampaigns(
    campaigns: BathymetryCampaignRow[],
    bathymetryRows: ReservoirBathymetryPoint[]
  ): SiltationHsvRow[] {
    const baseRows = bathymetryRows
      .map((row) => ({
        level: this.toFinite(row.level_m),
        volume: this.toFinite(row.volume_hm3),
      }))
      .filter((row): row is { level: number; volume: number } => row.level !== null && row.volume !== null);

    if (!baseRows.length) return [];

    const maxBaseVolume = Math.max(...baseRows.map((row) => row.volume));
    const baseline = campaigns.find((row) => row.campaign_year === OFFICIAL_CAMPAIGN_YEARS[0]);
    const baselineVolume = this.toFinite(baseline?.volume_mhm3) ?? maxBaseVolume;

    return campaigns.flatMap((campaign) => {
      const campaignVolume = this.toFinite(campaign.volume_mhm3) ?? baselineVolume;
      const volumeDelta = Math.max(baselineVolume - campaignVolume, 0);

      return baseRows.map((row) => ({
        hsv_id: 0,
        dam_code: campaign.dam_code,
        dam_name: campaign.dam_name,
        campaign_year: campaign.campaign_year,
        level_m: row.level,
        surface_km2: null,
        volume_mhm3:
          row.volume +
          volumeDelta *
            Math.pow(maxBaseVolume > 0 ? row.volume / maxBaseVolume : 0, 0.65),
        source_sheet: `bathy_had:${campaign.source_sheet}`,
      }));
    });
  }

  private buildIndicatorsFromBathyCampaigns(
    campaigns: BathymetryCampaignRow[],
    indicator?: SiltationIndicatorRow
  ): SiltationIndicatorRow | null {
    if (!campaigns.length) return null;

    const ordered = [...campaigns].sort((a, b) => a.campaign_year - b.campaign_year);
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const baselineYear = first.campaign_year;
    const currentYear = last.campaign_year;
    const volumeInitial = this.toFinite(first.volume_mhm3);
    const volumeCurrent = this.toFinite(last.volume_mhm3);
    const volumeSilted =
      this.toFinite(last.cumulative_silted_mhm3) ??
      (volumeInitial !== null && volumeCurrent !== null ? volumeInitial - volumeCurrent : null);
    const duration =
      baselineYear !== null && currentYear !== null && currentYear >= baselineYear
        ? currentYear - baselineYear
        : null;
    const lossPercent =
      volumeInitial !== null && volumeSilted !== null && volumeInitial > 0
        ? (volumeSilted / volumeInitial) * 100
        : null;
    const tea =
      duration && volumeSilted !== null && duration > 0 ? volumeSilted / duration : null;
    const ter =
      duration && lossPercent !== null && duration > 0 ? lossPercent / duration : null;

    return {
      indicator_id: indicator?.indicator_id ?? 0,
      dam_code: indicator?.dam_code ?? first.dam_code,
      dam_name: indicator?.dam_name ?? first.dam_name,
      reference_code: indicator?.reference_code ?? "BATHY_HAD",
      baseline_year: baselineYear,
      current_year: currentYear,
      volume_initial_mhm3: volumeInitial,
      volume_current_mhm3: volumeCurrent,
      volume_silted_mhm3: volumeSilted,
      loss_percent: lossPercent,
      tea_mhm3_per_year: tea,
      ter_percent_per_year: ter,
      duration_years: duration,
      trapping_efficiency_percent: indicator?.trapping_efficiency_percent ?? null,
      basin_area_km2: indicator?.basin_area_km2 ?? null,
      specific_erosion_m3_km2_year: indicator?.specific_erosion_m3_km2_year ?? null,
      created_at: indicator?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private getOfficialCampaignYears(campaigns?: BathymetryCampaignRow[]): number[] {
    if (campaigns?.length) {
      return campaigns.map((row) => Number(row.campaign_year)).sort((a, b) => a - b);
    }
    return [...OFFICIAL_CAMPAIGN_YEARS];
  }

  async getIndicators(damCode = "HASSAN_ADDAKHIL"): Promise<SiltationIndicatorRow[]> {
    return this.db.query<SiltationIndicatorRow>(
      `
      SELECT *
      FROM hydro.siltation_indicators
      WHERE dam_code = $1
      ORDER BY updated_at DESC
      `,
      [damCode]
    );
  }

  async getHsv(damCode = "HASSAN_ADDAKHIL"): Promise<SiltationHsvRow[]> {
    const campaigns = await this.getBathymetryCampaigns(damCode);
    if (campaigns.length) {
      const bathymetryRows = await this.fetchReservoirBathymetryRows();
      return this.buildHsvRowsFromBathyCampaigns(campaigns, bathymetryRows);
    }

    return this.db.query<SiltationHsvRow>(
      `
      SELECT *
      FROM hydro.siltation_hsv
      WHERE dam_code = $1
      ORDER BY campaign_year, level_m
      `,
      [damCode]
    );
  }

  async getEvolution(damCode = "HASSAN_ADDAKHIL"): Promise<SiltationEvolutionRow[]> {
    return this.db.query<SiltationEvolutionRow>(
      `
      SELECT
        evolution_id,
        dam_code,
        dam_name,
        year,
        annual_silted_mhm3::double precision AS annual_silted_mhm3,
        cumulative_silted_mhm3::double precision AS cumulative_silted_mhm3,
        annual_rate_mhm3::double precision AS annual_rate_mhm3,
        source_sheet,
        source_row,
        metadata,
        created_at,
        updated_at
      FROM hydro.siltation_evolution
      WHERE dam_code = $1
        AND year IS NOT NULL
        AND year <> 0
      ORDER BY year
      `,
      [damCode]
    );
  }

  async getAvailability(damCode = "HASSAN_ADDAKHIL"): Promise<SiltationAvailability> {
    const [bathyPackage, indicator] = await Promise.all([
      this.getBathymetryCampaignsPackage(damCode),
      this.db.queryOne<{ dam_name: string }>(
        `
        SELECT dam_name
        FROM hydro.siltation_indicators
        WHERE dam_code = $1
        ORDER BY updated_at DESC
        LIMIT 1
        `,
        [damCode]
      ),
    ]);

    if (bathyPackage) {
      return {
        barrage: bathyPackage.dam_name,
        years: bathyPackage.campaigns.map((row) => row.measurement_year),
        hsvYears: bathyPackage.campaignYears,
        campaignYears: bathyPackage.campaignYears,
        dataSource: "bathy_had",
      };
    }

    const [yearsRows, hsvYearsRows] = await Promise.all([
      this.db.query<{ year: number }>(
        `
        SELECT DISTINCT year
        FROM hydro.siltation_evolution
        WHERE dam_code = $1
          AND year IS NOT NULL
          AND year <> 0
        ORDER BY year
        `,
        [damCode]
      ),
      this.db.query<{ campaign_year: number }>(
        `
        SELECT DISTINCT campaign_year
        FROM hydro.siltation_hsv
        WHERE dam_code = $1
          AND campaign_year IS NOT NULL
        ORDER BY campaign_year
        `,
        [damCode]
      ),
    ]);

    return {
      barrage: indicator?.dam_name ?? "HASSAN ADDAKHIL",
      years: yearsRows.map((r) => Number(r.year)).filter((y) => Number.isFinite(y)),
      hsvYears: hsvYearsRows.map((r) => Number(r.campaign_year)).filter((y) => Number.isFinite(y)),
      campaignYears: this.getOfficialCampaignYears(),
      dataSource: "legacy",
    };
  }

  async getSummary(damCode = "HASSAN_ADDAKHIL") {
    const [indicator, bathyPackage, hsv, evolutionCount, hsvCount] = await Promise.all([
      this.getIndicators(damCode).then((rows) => rows[0]),
      this.getBathymetryCampaignsPackage(damCode),
      this.getHsv(damCode),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM hydro.siltation_evolution WHERE dam_code = $1`,
        [damCode]
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM hydro.siltation_hsv WHERE dam_code = $1`,
        [damCode]
      ),
    ]);

    const dynamicIndicator = bathyPackage
      ? this.buildIndicatorsFromBathyCampaigns(bathyPackage.campaigns, indicator)
      : null;

    return {
      dam_code: damCode,
      dam_name: bathyPackage?.dam_name ?? indicator?.dam_name ?? "HASSAN ADDAKHIL",
      indicators: dynamicIndicator,
      data_source: bathyPackage ? "bathy_had" : "legacy",
      evolution_rows: Number(evolutionCount?.count ?? 0),
      hsv_rows: bathyPackage ? hsv.length : Number(hsvCount?.count ?? 0),
    };
  }

  async getBathymetry(damCode = "HASSAN_ADDAKHIL") {
    const bathyPackage = await this.getBathymetryCampaignsPackage(damCode);
    const rows = await this.getHsv(damCode);
    return {
      dam_code: damCode,
      campaigns: bathyPackage?.campaignYears ?? this.getOfficialCampaignYears(),
      rows,
      source_file: bathyPackage?.source_file ?? null,
    };
  }

  async getPeriodVolumes(damCode = "HASSAN_ADDAKHIL"): Promise<BathymetryPeriodVolumeRow[]> {
    const bathyPackage = await this.getBathymetryCampaignsPackage(damCode);
    return bathyPackage?.periods ?? [];
  }

  async exportExcelBuffer(damCode = "HASSAN_ADDAKHIL"): Promise<Buffer> {
    const [summary, indicators, hsv, bathyPackage] = await Promise.all([
      this.getSummary(damCode),
      this.getIndicators(damCode),
      this.getHsv(damCode),
      this.getBathymetryCampaignsPackage(damCode),
    ]);

    const wb = xlsx.utils.book_new();
    const wsSummary = xlsx.utils.json_to_sheet([summary]);
    const wsIndicators = xlsx.utils.json_to_sheet(indicators);
    const wsHsv = xlsx.utils.json_to_sheet(hsv);
    const wsCampaigns = xlsx.utils.json_to_sheet(
      (bathyPackage?.campaigns ?? []).map((row) => ({
        measurement_year: row.measurement_year,
        campaign_year: row.campaign_year,
        volume_mhm3: row.volume_mhm3,
        silted_since_previous_mhm3: row.silted_since_previous_mhm3,
        cumulative_silted_mhm3: row.cumulative_silted_mhm3,
        source_file: row.source_file,
      }))
    );
    const wsPeriods = xlsx.utils.json_to_sheet(
      (bathyPackage?.periods ?? []).map((row) => ({
        periode: row.period,
        volume_envase_mhm3: row.volume_silted_mhm3,
        annee_debut: row.fromYear,
        annee_fin: row.toYear,
        source: "bathy_HAD.xlsx",
      }))
    );

    xlsx.utils.book_append_sheet(wb, wsSummary, "summary");
    xlsx.utils.book_append_sheet(wb, wsIndicators, "indicators");
    xlsx.utils.book_append_sheet(wb, wsHsv, "hsv");
    xlsx.utils.book_append_sheet(wb, wsCampaigns, "bathy_campaigns");
    xlsx.utils.book_append_sheet(wb, wsPeriods, "evolution_periodes");

    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  }

  async exportPdfBuffer(damCode = "HASSAN_ADDAKHIL"): Promise<Buffer> {
    const [summary, bathyPackage] = await Promise.all([
      this.getSummary(damCode),
      this.getBathymetryCampaignsPackage(damCode),
    ]);
    const campaignYears = bathyPackage?.campaignYears ?? this.getOfficialCampaignYears();
    const periods = bathyPackage?.periods ?? [];

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 36 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(16).text("Rapport d'envasement - Hassan Addakhil", { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(`Dam: ${summary.dam_name}`);
      doc.text(`Code: ${summary.dam_code}`);
      doc.text(`Source: ${bathyPackage?.source_file ?? "legacy"}`);
      doc.text(`Vi (Mm3): ${summary.indicators?.volume_initial_mhm3 ?? "-"}`);
      doc.text(`Vf (Mm3): ${summary.indicators?.volume_current_mhm3 ?? "-"}`);
      doc.text(`Ve (Mm3): ${summary.indicators?.volume_silted_mhm3 ?? "-"}`);
      doc.text(`Perte (%): ${summary.indicators?.loss_percent ?? "-"}`);
      doc.text(`TEA (Mm3/an): ${summary.indicators?.tea_mhm3_per_year ?? "-"}`);
      doc.text(`TER (%/an): ${summary.indicators?.ter_percent_per_year ?? "-"}`);
      doc.text(
        `Campagnes officielles: ${campaignYears.length ? campaignYears.join(", ") : "-"}`
      );
      doc.moveDown(0.5);
      doc.fontSize(11).text("Volumes envasés par période (bathy_HAD.xlsx):");
      periods.forEach((row) => {
        doc.text(`  ${row.period}: ${row.volume_silted_mhm3.toFixed(2)} Mm³`);
      });
      doc.moveDown(0.5);
      doc.text(
        `Périodes fixes: ${BATHY_PERIOD_DEFINITIONS.map((period) => period.label).join(" | ")}`
      );
      doc.end();
    });
  }
}

export const siltationService = new SiltationService();
