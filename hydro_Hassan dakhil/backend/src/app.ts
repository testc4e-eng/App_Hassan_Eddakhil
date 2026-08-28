// backend/src/app.ts
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { loadBackendEnv } from "./config/loadEnv";

import hydroRoutes from "./routes/hydroRoutes";
import timeseriesRoutes from "./routes/timeseriesRoutes";
import catalogRoutes from "./routes/catalogRoutes";
import catalogAvailabilityRouter from "./routes/catalogAvailability"; // ✅ ici
import accessRoutes from "./routes/access";
import { errorHandler } from "./middleware/errorHandler";
import spatialRoutes from "./routes/spatialRoutes";
import mapsRoutes from "./routes/maps.routes";
import thematicSubbasinRoutes from "./routes/thematicSubbasin.routes";
import thematicReachRoutes from "./routes/thematicReach.routes";
import swatRoutes from "./routes/swatRoutes";
import dataScanRoutes from "./routes/dataScan.routes";
import solidYieldRoutes from "./routes/solidYieldRoutes";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import adminDbConfigRoutes from "./routes/adminDbConfig.routes";
import stationSimulationRoutes from "./routes/stationSimulationRoutes";
import siltationRoutes from "./routes/siltationRoutes";

loadBackendEnv();

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

const isProd = process.env.NODE_ENV === "production";

const envCorsOrigins =
  process.env.CORS_ORIGIN?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

const devCorsOrigins = isProd
  ? []
  : [
      "http://localhost:8090",
      "http://127.0.0.1:8090",
      "http://localhost:8089",
      "http://127.0.0.1:8089",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
    ];

const allowedOrigins = Array.from(new Set([...devCorsOrigins, ...envCorsOrigins]));

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
  })
);
app.use(compression());

app.use(cors(corsOptions));

app.options("/*", cors(corsOptions));

const isLocalhostRequest = (req: Request) => {
  const host = String(req.headers.host || req.hostname || "").toLowerCase();
  const origin = String(req.headers.origin || "").toLowerCase();
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").toLowerCase();
  const ip = String(req.ip || "").toLowerCase();
  return [host, origin, forwardedHost, ip].some((value) =>
    value.includes("localhost") || value.includes("127.0.0.1") || value.includes("::1")
  );
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 200 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isProd && isLocalhostRequest(req),
});

app.use("/api", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((_req, res, next) => {
  res.type("application/json; charset=utf-8");
  next();
});

app.use("/api/v1/hydro", hydroRoutes);
app.use("/api/v1/timeseries", timeseriesRoutes);
app.use("/api/v1/catalog", catalogRoutes);
app.use("/api/v1/spatial", spatialRoutes);
app.use("/api/v1/maps", mapsRoutes);
app.use("/api/v1/maps/thematic/subbasins", thematicSubbasinRoutes);
app.use("/api/v1/maps/thematic/reaches", thematicReachRoutes);
app.use("/api/v1/access", accessRoutes);
app.use("/api/v1/hydro/swat", swatRoutes);
app.use("/api/v1", stationSimulationRoutes);
app.use("/api/v1/solid-yield", solidYieldRoutes);
app.use("/api/v1/data-scan", dataScanRoutes);
app.use("/api/v1/scan", dataScanRoutes);
// ✅ availability
app.use("/api/v1", catalogAvailabilityRouter);
app.use("/api/v1/siltation", siltationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/v1/admin", adminDbConfigRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Hydro HD API",
    version: "1.0.0",
  });
});

app.use("*", (req: Request, res: Response) => {
  res
    .status(404)
    .json({ success: false, error: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

export default app;
