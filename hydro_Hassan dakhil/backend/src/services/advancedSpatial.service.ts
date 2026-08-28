import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { AppError } from "../middleware/errorHandler";
import { getProjectRoot, resolveHassanDataRoot } from "../config/hassanDataRoot";

export type AdvancedSpatialLayer = "hrus" | "subs" | "rivs" | "lulc" | "sol" | "slope";

export type AdvancedSpatialScenario = {
  key: string;
  label_fr: string;
  label_en: string;
};

type OgrGeoJson = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: Record<string, unknown> | null;
    properties: Record<string, unknown>;
  }>;
};

type ScenarioSources = {
  key: string;
  label_fr: string;
  label_en: string;
  root: string;
};

export class AdvancedSpatialService {
  private readonly cache = new Map<string, OgrGeoJson>();
  private readonly loggerPrefix = "[advanced-spatial]";

  private getDataRoot(): string {
    const info = resolveHassanDataRoot();
    console.log("[HASSAN_DATA_ROOT]", info.exists ? "configured" : "missing");

    if (!info.exists) {
      throw new AppError("SWAT advanced data root not found.", 404);
    }

    return info.resolved;
  }

  private getPublicAdvancedRoot(): string {
    return path.join(getProjectRoot(), "frontend", "public", "data", "swat-advanced");
  }

  private canonicalLayer(layer: AdvancedSpatialLayer): "hrus" | "subs" | "rivs" {
    if (layer === "subs" || layer === "rivs") return layer;
    return "hrus";
  }

  private getRequestedLayerName(layer: AdvancedSpatialLayer): string {
    return layer;
  }

  private getCurrentRoot(): string {
    return path.join(this.getDataRoot(), "Scenarios_etat_actuel", "Daily", "TablesOut");
  }

  private getAttenuationRoot(): string {
    return path.join(
      this.getDataRoot(),
      "Modèle Bge HAD",
      "Modèle Bge HAD",
      "Scénarios_d’atténuation_d’érosion"
    );
  }

  private ensureDirectoryExists(dirPath: string, label: string) {
    if (!fs.existsSync(dirPath)) {
      throw new AppError(`${label} not found.`, 404);
    }
  }

  private findFirstFile(rootDir: string, fileName: string): string {
    this.ensureDirectoryExists(rootDir, "Advanced spatial directory");

    const walk = (dir: string): string | null => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const nested = walk(full);
          if (nested) return nested;
          continue;
        }
        if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
          return full;
        }
      }
      return null;
    };

    const found = walk(rootDir);
    if (!found) {
      throw new AppError(`Could not find ${fileName} in advanced spatial source.`, 404);
    }
    return found;
  }

  private getScenarioSources(): ScenarioSources[] {
    const currentRoot = this.getCurrentRoot();
    const attenuationRoot = this.getAttenuationRoot();
    const scenarios: ScenarioSources[] = [
      {
        key: "current",
        label_fr: "État actuel",
        label_en: "Current state",
        root: currentRoot,
      },
    ];

    if (!fs.existsSync(currentRoot)) {
      throw new AppError("Current advanced spatial root not found.", 404);
    }

    if (fs.existsSync(attenuationRoot)) {
      const attenuationDirs = fs
        .readdirSync(attenuationRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) => /^Scénario\s+[1-4]$/i.test(name))
        .sort((a, b) => a.localeCompare(b, "fr"));

      for (const dirName of attenuationDirs) {
        const match = dirName.match(/^Scénario\s+([1-4])$/i);
        if (!match) continue;
        const idx = Number(match[1]);
        scenarios.push({
          key: `scenario_${idx}`,
          label_fr: `Scénario spatial ${idx}`, 
          label_en: `Spatial scenario ${idx}`,
          root: path.join(attenuationRoot, dirName),
        });
      }
    } else {
      console.warn(`${this.loggerPrefix} attenuation root not found`);
    }

    return scenarios;
  }

  getScenarios(): AdvancedSpatialScenario[] {
    const scenarios = this.getScenarioSources().map(({ key, label_fr, label_en }) => ({
      key,
      label_fr,
      label_en,
    }));
    console.info(
      `${this.loggerPrefix} scenarios=${scenarios.map((s) => s.key).join(", ")}`
    );
    return scenarios;
  }

  private getScenarioRoot(scenarioKey: string): ScenarioSources {
    const scenario = this.getScenarioSources().find((item) => item.key === scenarioKey);
    if (!scenario) {
      throw new AppError("Unknown advanced spatial scenario.", 404);
    }
    return scenario;
  }

  private getSourcePath(scenarioKey: string, layer: AdvancedSpatialLayer): string {
    const scenario = this.getScenarioRoot(scenarioKey);
    const fileName = `${this.canonicalLayer(layer)}.shp`;
    return this.findFirstFile(scenario.root, fileName);
  }

  private getPublicGeoJsonPath(scenarioKey: string, layer: AdvancedSpatialLayer): string | null {
    const root = this.getPublicAdvancedRoot();
    const canonical = this.canonicalLayer(layer);
    const candidates = [
      path.join(root, scenarioKey, `${layer}.geojson`),
      path.join(root, scenarioKey, `${layer}.json`),
      path.join(root, `${scenarioKey}-${layer}.geojson`),
      path.join(root, `${layer}.geojson`),
      path.join(root, scenarioKey, `${canonical}.geojson`),
      path.join(root, scenarioKey, `${canonical}.json`),
      path.join(root, `${scenarioKey}-${canonical}.geojson`),
      path.join(root, `${canonical}.geojson`),
      path.join(root, scenarioKey, `${layer}.geojson`),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private getPublicHruSummaryPath(): string | null {
    const candidate = path.join(
      getProjectRoot(),
      "frontend",
      "public",
      "data",
      "hassan",
      "subbasin_hru_summary.geojson"
    );
    return fs.existsSync(candidate) ? candidate : null;
  }

  private readPublicGeoJson(filePath: string): OgrGeoJson {
    const raw = fs.readFileSync(filePath, "utf8");
    const payload = JSON.parse(raw) as OgrGeoJson;
    if (!payload || payload.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
      throw new Error(`Invalid GeoJSON payload at ${filePath}`);
    }
    return payload;
  }

  private logLayerPayload(
    scenarioKey: string,
    layer: AdvancedSpatialLayer,
    source: string,
    payload: OgrGeoJson
  ) {
    const firstProps = payload.features[0]?.properties ?? {};
    const sampleKeys = Object.keys(firstProps).slice(0, 12).join(", ");
    console.info(
      `${this.loggerPrefix} scenario=${scenarioKey} layer=${layer} count=${payload.features.length} sampleKeys=[${sampleKeys}]`
    );
  }

  private filterGeoJson(payload: OgrGeoJson, layer: AdvancedSpatialLayer, subbasinId?: number): OgrGeoJson {
    if (!Number.isFinite(subbasinId)) {
      return payload;
    }

    const target = Number(subbasinId);
    return {
      ...payload,
      features: payload.features.filter((feature) => {
        const props = feature.properties || {};
        const current = Number(props.Subbasin ?? props.subbasin_id ?? props.SUBBASIN ?? props.SUB ?? NaN);
        return Number.isFinite(current) && current === target;
      }),
    };
  }

  private ogr2geojson(sourcePath: string, where?: string): OgrGeoJson {
    const cacheKey = `${sourcePath}::${where ?? "*"}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const args = [
      "-f",
      "GeoJSON",
      "/vsistdout/",
      sourcePath,
      "-t_srs",
      "EPSG:4326",
      "-skipfailures",
      "-lco",
      "RFC7946=YES",
    ];

    if (where) {
      args.push("-where", where);
    }

    const result = spawnSync("ogr2ogr", args, {
      encoding: "utf8",
      maxBuffer: 250 * 1024 * 1024,
      windowsHide: true,
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      const details = (result.stderr || result.stdout || "").trim();
      throw new Error(details || `ogr2ogr failed with status ${result.status}`);
    }

    const payload = JSON.parse(result.stdout || '{"type":"FeatureCollection","features":[]}') as OgrGeoJson;
    this.cache.set(cacheKey, payload);
    return payload;
  }

  async getLayer(scenarioKey: string, layer: AdvancedSpatialLayer, subbasinId?: number): Promise<OgrGeoJson> {
    const canonicalLayer = this.canonicalLayer(layer);
    if (layer === "hrus" && !Number.isFinite(subbasinId)) {
      if (scenarioKey === "current") {
        const summaryPath = this.getPublicHruSummaryPath();
        if (summaryPath) {
          console.info(`${this.loggerPrefix} reading HRU summary for scenario=${scenarioKey} layer=${layer}`);
          return this.readPublicGeoJson(summaryPath);
        }
      }

      throw new AppError("HRU advanced layer requires a subbasinId for detailed polygons", 400);
    }

    const publicGeoJsonPath = this.getPublicGeoJsonPath(scenarioKey, layer);
    if (publicGeoJsonPath) {
      console.info(
        `${this.loggerPrefix} reading public GeoJSON scenario=${scenarioKey} layer=${layer}`
      );
      const payload = this.readPublicGeoJson(publicGeoJsonPath);
      const filtered = this.filterGeoJson(payload, layer, subbasinId);
      this.logLayerPayload(scenarioKey, layer, publicGeoJsonPath, filtered);
      return filtered;
    }

    const sourcePath = this.getSourcePath(scenarioKey, layer);
    const where = canonicalLayer === "hrus" && Number.isFinite(subbasinId) ? `Subbasin = ${Number(subbasinId)}` : undefined;

    console.info(
      `${this.loggerPrefix} reading shapefile scenario=${scenarioKey} layer=${layer} canonical=${canonicalLayer}${where ? " filtered" : ""}`
    );
    const payload = this.ogr2geojson(sourcePath, where);
    this.logLayerPayload(scenarioKey, layer, sourcePath, payload);
    return payload;
  }

  getDebugRoot() {
    const info = resolveHassanDataRoot();
    const tablesOutPath = path.join(info.resolved, "Scenarios_etat_actuel", "Daily", "TablesOut");
    const attenuationRoot = path.join(
      info.resolved,
      "Modèle Bge HAD",
      "Modèle Bge HAD",
      "Scénarios_d’atténuation_d’érosion"
    );

    return {
      cwd: process.cwd(),
      rawRoot: info.raw,
      resolvedRoot: info.resolved,
      existsRoot: info.exists,
      tablesOutPath,
      existsTablesOut: fs.existsSync(tablesOutPath),
      attenuationRoot,
      existsAttenuationRoot: fs.existsSync(attenuationRoot),
      scenarios: this.getScenarios(),
    };
  }
}
