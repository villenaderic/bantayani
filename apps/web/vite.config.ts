import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Leaflet and its marker clustering plugin are only needed
          // on the dashboard's map. Recharts is only needed on the
          // analytics page. Splitting them into their own vendor
          // chunks keeps them cacheable independently of app code
          // that changes far more often, on top of the route level
          // lazy loading already in App.tsx.
          leaflet: ["leaflet", "react-leaflet", "leaflet.markercluster"],
          charts: ["recharts"],
        },
      },
    },
  },
});
