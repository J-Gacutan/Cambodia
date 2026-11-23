import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Local default `/`. Pages job sets VITE_BASE=/Cambodia/. */
const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  plugins: [react()],
  // Bundle lives at repo-root public/khm-bundle/<version>/ (synced from delivery/open-cleared).
  publicDir: "../public",
  build: {
    target: ["chrome100", "edge100", "firefox100", "safari15.4"],
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("maplibre-gl")) return "maplibre";
        }
      }
    }
  },
  server: { port: 5173 }
});
