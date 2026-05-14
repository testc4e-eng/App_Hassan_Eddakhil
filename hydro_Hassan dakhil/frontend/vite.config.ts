// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  server: {
    host: true,
    port: 5173,
    strictPort: false,

    hmr: {
      protocol: "ws",
      clientPort: 5173,
    },

    proxy: {
      // ✅ proxy explicite pour ton base "/api/v1"
      "/api/v1": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      // ✅ optionnel: si d’autres routes utilisent "/api"
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },

  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["recharts", "leaflet", "react-leaflet"],
        },
      },
    },
  },

  optimizeDeps: {
    esbuildOptions: { target: "es2020" },
  },
});
