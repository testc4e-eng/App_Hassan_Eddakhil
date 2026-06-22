import dotenv from "dotenv";
import { erosionSwatSeriesService } from "./src/services/erosionSwatSeries.service";
import { resolveHassanDataRoot } from "./src/config/hassanDataRoot";
dotenv.config();

import app from "./src/app";

const PORT = Number(process.env.PORT || 5000);
const dataRootInfo = resolveHassanDataRoot();
console.log("[HASSAN_DATA_ROOT]", dataRootInfo.resolved);

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

async function warmPerformanceCaches(baseUrl: string): Promise<void> {
  const warmups: Array<Promise<unknown>> = [
    erosionSwatSeriesService.getAvailability(),
    fetch(`${baseUrl}/api/v1/hydro/swat/availability`).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Warmup failed for /api/v1/hydro/swat/availability: ${response.status}`);
      }
      await response.text();
    }),
    fetch(`${baseUrl}/api/v1/hydro/swat/summary`).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Warmup failed for /api/v1/hydro/swat/summary: ${response.status}`);
      }
      await response.text();
    }),
    fetch(`${baseUrl}/api/v1/solid-yield/availability`).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Warmup failed for /api/v1/solid-yield/availability: ${response.status}`);
      }
      await response.text();
    }),
    fetch(`${baseUrl}/api/v1/data-scan/periods/global`).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Warmup failed for /api/v1/data-scan/periods/global: ${response.status}`);
      }
      await response.text();
    }),
  ];

  const results = await Promise.allSettled(warmups);
  const failures = results.filter((result) => result.status === "rejected") as PromiseRejectedResult[];
  if (failures.length > 0) {
    console.warn(`[warmup] ${failures.length} cache warmup(s) failed`);
    for (const failure of failures.slice(0, 3)) {
      console.warn("[warmup] detail:", failure.reason);
    }
  } else {
    console.log("[warmup] performance caches warmed");
  }
}

app.listen(PORT, () => {
  console.log(`🌊 Hydro HD Backend started on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}/api/v1/hydro/health`);
  console.log(`🌐 http://localhost:${PORT}/api/v1/timeseries/health`);
  console.log(`🌐 http://localhost:${PORT}/api/v1/catalog/runs`);
  void warmPerformanceCaches(`http://127.0.0.1:${PORT}`);
});