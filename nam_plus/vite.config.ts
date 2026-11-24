
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

function appWorker(): Plugin {
  return {
    name: "nam-plus-offline",
    apply: "build",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const worker = readFileSync(new URL("./pwa/sw.js", import.meta.url), "utf8");
        const publicFiles = ["index.html", "favicon.svg", "manifest.webmanifest", "pwa-192.png", "pwa-512.png", "pwa-maskable.png"];
        const assets = [...new Set([...publicFiles, ...Object.keys(bundle)])].sort();
        const hash = createHash("sha256").update(worker).update(JSON.stringify(assets));
        for (const file of publicFiles.slice(1)) {
          hash.update(readFileSync(new URL(`./public/${file}`, import.meta.url)));
        }
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: worker.replace("__BUILD_VERSION__", hash.digest("hex").slice(0, 16))
            .replace("__PRECACHE_ASSETS__", JSON.stringify(assets.map((name) => `/${name}`))),
        });
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), appWorker()],

  server: {
    port: 5173,
    strictPort: true,

    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
