import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { headHtml, staticHomeHtml, type SeoLanguage } from "./src/lib/seo.ts";

/** Kopf und Startseiten-Text einer Sprache in die index.html einsetzen. */
function localize(html: string, lang: SeoLanguage): string {
  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace("<!--seo-head-->", () => headHtml(lang))
    .replace('<div id="root"></div>', () => `<div id="root">${staticHomeHtml(lang)}</div>`);
}

/**
 * Suchmaschinen: Jede Sprache bekommt ihre eigene Startseite – `/` englisch, `/de` deutsch – mit
 * eigenem Titel, Beschreibung, hreflang-Verweisen, Vorab-HTML und strukturierten Daten.
 * React ersetzt das Vorab-HTML beim Start. Quelle der Texte ist src/lib/seo.ts.
 */
function seo(): Plugin {
  let transformed = false;
  let outDir = "";
  return {
    name: "seo-prerender",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        transformed = true;
        return localize(html, "en");
      },
    },
    // Nach dem Build: dieselbe Seite (mit den fertigen Asset-Links) noch einmal auf Deutsch.
    closeBundle() {
      if (!transformed) return;
      const built = readFileSync(path.join(outDir, "index.html"), "utf8");
      mkdirSync(path.join(outDir, "de"), { recursive: true });
      writeFileSync(path.join(outDir, "de", "index.html"), toGerman(built));
    },
  };
}

/** Die fertige englische index.html in die deutsche umbauen (Kopf und Vorab-HTML tauschen). */
function toGerman(built: string): string {
  const head = headHtml("en");
  const body = staticHomeHtml("en");
  if (!built.includes(head) || !built.includes(body)) {
    throw new Error("seo-prerender: englische Startseite nicht gefunden – deutsche Version fehlt");
  }
  return built
    .replace(/<html lang="en">/, '<html lang="de">')
    .replace(head, () => headHtml("de"))
    .replace(body, () => staticHomeHtml("de"));
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seo()],
  server: {
    // 5173 gehört dem Portfolio – so können beide gleichzeitig laufen.
    port: 5174,
    strictPort: true,
    proxy: {
      "/socket.io": { target: "http://localhost:3001", ws: true },
      // Länder-Quiz: Flaggen und Umrisse kommen vom Server.
      "/quiz-img": { target: "http://localhost:3001" },
    },
  },
});
