import { erosionSwatSeriesService } from "./src/services/erosionSwatSeries.service";
import { resolveHassanDataRoot } from "./src/config/hassanDataRoot";
import { stationSimulationService } from "./src/services/stationSimulation.service";
import { solidYieldService } from "./src/services/solidYield.service";
import { loadBackendEnv } from "./src/config/loadEnv";
import { getEnvOrDefaultBoolean, getEnvOrDefaultNumber, warnIfWeakSecret } from "./src/config/env";

loadBackendEnv();

import app from "./src/app";

const PORT = Number(process.env.PORT || 5000);
const ENABLE_STATION_MAPPING_INIT = getEnvOrDefaultBoolean("ENABLE_STATION_MAPPING_INIT", true);
const ENABLE_STARTUP_WARMUPS = getEnvOrDefaultBoolean("ENABLE_STARTUP_WARMUPS", true);
const STARTUP_WARMUP_DELAY_MS = getEnvOrDefaultNumber("STARTUP_WARMUP_DELAY_MS", 250);
const STARTUP_WARMUP_TIMEOUT_MS = getEnvOrDefaultNumber("STARTUP_WARMUP_TIMEOUT_MS", 15000);
const dataRootInfo = resolveHassanDataRoot();
console.log("[HASSAN_DATA_ROOT]", dataRootInfo.exists ? "configured" : "missing");
warnIfWeakSecret("JWT_SECRET");

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

function withTimeout<T>(name: string, promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${name} timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function warmHttpEndpoint(name: string, url: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${name} failed: HTTP ${response.status}`);
  }
  await response.text();
}

async function measureTask(name: string, task: () => Promise<unknown>) {
  const startedAt = Date.now();
  try {
    await withTimeout(name, task(), STARTUP_WARMUP_TIMEOUT_MS);
    return {
      name,
      status: "fulfilled" as const,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      name,
      status: "rejected" as const,
      durationMs: Date.now() - startedAt,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function warmPerformanceCaches(baseUrl: string): Promise<void> {
  const startedAt = Date.now();
  const tasks = [
    () => measureTask("catalog.erosion.availability", () => erosionSwatSeriesService.getAvailability()),
    () => measureTask("solid-yield.availability", () => solidYieldService.getAvailability()),
    () =>
      measureTask("hydro.swat.availability", () =>
        warmHttpEndpoint("hydro.swat.availability", `${baseUrl}/api/v1/hydro/swat/availability`)
      ),
    () =>
      measureTask("hydro.swat.summary", () =>
        warmHttpEndpoint("hydro.swat.summary", `${baseUrl}/api/v1/hydro/swat/summary`)
      ),
    () =>
      measureTask("data-scan.periods.global", () =>
        warmHttpEndpoint("data-scan.periods.global", `${baseUrl}/api/v1/data-scan/periods/global`)
      ),
  ];

  const results = await Promise.all(tasks.map((task) => task()));
  const failures = results.filter(
    (result): result is Extract<(typeof results)[number], { status: "rejected" }> =>
      result.status === "rejected"
  );

  console.log("[warmup] completed", {
    totalDurationMs: Date.now() - startedAt,
    tasks: results.map((result) => ({
      name: result.name,
      status: result.status,
      durationMs: result.durationMs,
    })),
  });

  if (failures.length > 0) {
    for (const failure of failures.slice(0, 5)) {
      console.warn("[warmup] detail:", {
        name: failure.name,
        durationMs: failure.durationMs,
        reason: failure.reason,
      });
    }
  }
}

async function initializeStationMappings(): Promise<void> {
  if (!ENABLE_STATION_MAPPING_INIT) {
    console.log("[station-mapping] startup initialization disabled by env");
    return;
  }

  try {
    const warnings = await stationSimulationService.initializeMappings();
    if (warnings.length > 0) {
      console.warn("[station-mapping] initialized with warnings");
      for (const warning of warnings.slice(0, 5)) {
        console.warn("[station-mapping]", warning);
      }
    } else {
      console.log("[station-mapping] initialized");
    }
  } catch (error) {
    console.warn("[station-mapping] initialization failed", error);
  }
}

function scheduleStartupWarmups(baseUrl: string): void {
  if (!ENABLE_STARTUP_WARMUPS) {
    console.log("[warmup] startup warmups disabled by env");
    return;
  }

  setTimeout(() => {
    void warmPerformanceCaches(baseUrl).catch((error) => {
      console.warn("[warmup] startup warmups failed", error);
    });
  }, STARTUP_WARMUP_DELAY_MS);
}

app.listen(PORT, () => {
  console.log(`🌊 Hydro HD Backend started on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}/api/v1/hydro/health`);
  console.log(`🌐 http://localhost:${PORT}/api/v1/timeseries/health`);
  console.log(`🌐 http://localhost:${PORT}/api/v1/catalog/runs`);
  void initializeStationMappings();
  scheduleStartupWarmups(`http://127.0.0.1:${PORT}`);
});
