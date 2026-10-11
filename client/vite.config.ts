import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { jsonLd, staticHomeHtml } from "./src/lib/seo";

/**
 * Suchmaschinen: Startseiten-Text als fertiges HTML in die index.html (React ersetzt ihn beim
 * Start) und strukturierte Daten in den <head>. Quelle für beides ist src/lib/seo.ts.
 */
function seo(): Plugin {
  return {
    name: "seo-prerender",
    transformIndexHtml(html) {
      return html
        .replace('<div id="root"></div>', `<div id="root">${staticHomeHtml("de")}</div>`)
        .replace(
          "</head>",
          `<script type="application/ld+json">${jsonLd("de")}</script>\n  </head>`,
        );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seo()],
  server: {
    // 5173 gehört dem Portfolio – so können beide gleichzeitig laufen.
    port: 5174,
    strictPort: true,
    proxy: {
      "/socket.io": { target: "http://localhost:3001", ws: true },
    },
  },
});
