import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

const copyAssets = {
  name: "copy-pwa-assets",
  generateBundle() {
    for (const f of ["favicon.svg", "icon-192.png", "icon-512.png"]) {
      this.emitFile({ type: "asset", fileName: f, source: readFileSync(f) });
    }
  },
};

export default defineConfig({
  publicDir: false,
  plugins: [
    react(),
    copyAssets,
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "ALAMO · Gestión",
        short_name: "ALAMO",
        description: "Gestión integral de fábrica de bolsas industriales de papel",
        theme_color: "#1c1917",
        background_color: "#f5f5f4",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      }
    })
  ]
});
