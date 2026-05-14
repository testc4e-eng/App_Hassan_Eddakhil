// backend/src/app.ts
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import hydroRoutes from "./routes/hydroRoutes";
import timeseriesRoutes from "./routes/timeseriesRoutes";
import catalogRoutes from "./routes/catalogRoutes";
import catalogAvailabilityRouter from "./routes/catalogAvailability"; // ✅ ici
import accessRoutes from "./routes/access";
import { errorHandler } from "./middleware/errorHandler";
import spatialRoutes from "./routes/spatialRoutes";
import mapsRoutes from "./routes/maps.routes";
import swatRoutes from "./routes/swatRoutes";
import dataScanRoutes from "./routes/dataScan.routes";
import solidYieldRoutes from "./routes/solidYieldRoutes";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
dotenv.config();

const app = express();

const CORS_ORIGIN =
  process.env.CORS_ORIGIN ||
  "http://localhost:3001,http://localhost:5173,http://localhost:8080";

const allowedOrigins = CORS_ORIGIN.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("/*", cors());

const isProd = process.env.NODE_ENV === "production";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 200 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const ip = req.ip || "";
    const origin = String(req.headers.origin || "");
    return (
      !isProd &&
      (ip.includes("127.0.0.1") ||
        ip.includes("::1") ||
        origin.includes("localhost"))
    );
  },
});

app.use("/api", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/v1/hydro", hydroRoutes);
app.use("/api/v1/timeseries", timeseriesRoutes);
app.use("/api/v1/catalog", catalogRoutes);
app.use("/api/v1/spatial", spatialRoutes);
app.use("/api/v1/maps", mapsRoutes);
app.use("/api/v1/access", accessRoutes);
app.use("/api/v1/hydro/swat", swatRoutes);
app.use("/api/v1/solid-yield", solidYieldRoutes);
app.use("/api/v1/data-scan", dataScanRoutes);
app.use("/api/v1/scan", dataScanRoutes);
// ✅ availability
app.use("/api/v1", catalogAvailabilityRouter);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "🌊 Hydro HD API",
    version: "1.0.0",
    endpoints: [
      "/api/v1/hydro",
      "/api/v1/timeseries",
      "/api/v1/catalog",
      "/api/v1/catalog/availability",
      "/api/v1/solid-yield",
      "/api/v1/data-scan",
      "/api/v1/scan",
      "/api/auth",
      "/api/admin",
    ],
    corsAllowed: allowedOrigins,
  });
});

app.use("*", (req: Request, res: Response) => {
  res
    .status(404)
    .json({ success: false, error: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

export default app;
