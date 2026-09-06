import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// Offline-first is not optional here — this config is what makes the
// "disable wifi live in front of judges" demo actually work.
export default defineConfig({
  resolve: {
    // CRITICAL: tsconfig.json's `paths` only satisfies the TypeScript
    // compiler/editor — it does nothing for Vite's actual module
    // resolution at dev-server or build time. Without this block,
    // every `@/` import (which is most imports in this codebase)
    // resolves fine in the editor and then fails at runtime with
    // "Failed to resolve import @/App". Keep this in sync with
    // tsconfig.json's paths entry if either ever changes.
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Medexa — Frontline Worker App",
        short_name: "Medexa",
        description:
          "Offline-first care-continuity and referral-recovery layer for India's public-health network.",
        theme_color: "#005c55",
        background_color: "#f7faf8",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // Cache API GET calls (patient lookups, dashboard reads) so the
        // app is usable offline even for data fetched, not just created.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
    {
      name: "medexa-mock-api",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith("/api")) {
            return next();
          }

          const url = req.url.replace(/^\/api/, "");
          res.setHeader("Content-Type", "application/json");

          if (url.includes("/pathway-options")) {
            res.statusCode = 200;
            res.end(
              JSON.stringify([
                {
                  facilityId: "FAC-WB-PHC-01",
                  facilityName: "Belur Block PHC",
                  distanceKm: 3.2,
                  serviceAvailability: "available",
                  diagnosticAvailability: "available",
                  medicineAvailability: "available",
                },
                {
                  facilityId: "FAC-WB-CHC-02",
                  facilityName: "Joypur Block CHC",
                  distanceKm: 8.5,
                  serviceAvailability: "available",
                  diagnosticAvailability: "available",
                  medicineAvailability: "limited",
                },
                {
                  facilityId: "FAC-WB-RH-03",
                  facilityName: "Sonamukhi Rural Hospital (Block CHC)",
                  distanceKm: 14.1,
                  serviceAvailability: "available",
                  diagnosticAvailability: "limited",
                  medicineAvailability: "available",
                },
                {
                  facilityId: "FAC-WB-DH-04",
                  facilityName: "Bankura District General Hospital",
                  distanceKm: 28.7,
                  serviceAvailability: "available",
                  diagnosticAvailability: "available",
                  medicineAvailability: "available",
                },
              ])
            );
            return;
          }

          // Generic mock handler for sync and health requests
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              status: "success",
              synced: true,
              timestamp: new Date().toISOString(),
            })
          );
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
});
