// backend/server.ts
import dotenv from "dotenv";
import mapsRoutes from "./src/routes/maps.routes";
dotenv.config();

import app from "./src/app";

const PORT = Number(process.env.PORT || 5000);

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});
app.use("/api/v1/maps", mapsRoutes);

app.listen(PORT, () => {
  console.log(`🌊 Hydro HD Backend started on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}/api/v1/hydro/health`);
  console.log(`🌐 http://localhost:${PORT}/api/v1/timeseries/health`);
  console.log(`🌐 http://localhost:${PORT}/api/v1/catalog/runs`);
});
