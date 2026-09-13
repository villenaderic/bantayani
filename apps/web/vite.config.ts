import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "BantayAni",
        short_name: "BantayAni",
        description: "Agricultural damage detection and monitoring for the Philippines.",
        start_url: "/",
        display: "standalone",
        background_color: "#F8FAFC",
        theme_color: "#1F6B3B",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache the app shell (HTML, JS, CSS, icons) so the app itself
        // still opens without a connection. API responses are handled
        // separately below, since those are live government data, not
        // static assets, and need their own freshness rules.
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        runtimeCaching: [
          {
            // Try the network first so the person always sees current
            // data when they have a connection. Only fall back to the
            // last successful response when the request fails, which is
            // exactly the brief signal drop scenario this is for, not a
            // substitute for genuinely working offline.
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "bantayani-api-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // one day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Field evidence photos and any other uploaded media. Cache
            // first is appropriate here since a given photo's content
            // never changes once uploaded.
            urlPattern: ({ url }) => url.pathname.startsWith("/media/"),
            handler: "CacheFirst",
            options: {
              cacheName: "bantayani-media-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
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
