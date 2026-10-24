import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  GAME_PAGES,
  headHtml,
  pathOf,
  staticGameHtml,
  staticHomeHtml,
  type GamePageId,
  type SeoLanguage,
} from "./src/lib/seo.ts";

/** Kopf und Startseiten-Text einer Sprache in die index.html einsetzen. */
function localize(html: string, lang: SeoLanguage): string {
  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace("<!--seo-head-->", () => headHtml(lang))
    .replace('<div id="root"></div>', () => `<div id="root">${staticHomeHtml(lang)}</div>`);
}

/**
 * Suchmaschinen: Jede Sprache bekommt ihre eigene Startseite – `/` englisch, `/de` deutsch – mit
 * eigenem Titel, Beschreibung, hreflang-Verweisen, Vorab-HTML und strukturierten Daten. Ebenso
 * jede Spielseite (z. B. `dist/de/stadt-land-fluss/index.html`).
 * React ersetzt das Vorab-HTML beim Start. Quelle der Texte ist src/lib/seo.ts.
 */
function seo(): Plugin {
  let transformed = false;
  let outDir = "";
  // Seite unter ihrer Adresse ablegen, z. B. „/de/stadt-land-fluss“ → dist/de/stadt-land-fluss/index.html.
  const write = (address: string, html: string) => {
    const dir = path.join(outDir, address);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "index.html"), html);
  };
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
    // Nach dem Build: dieselbe Seite (mit den fertigen Asset-Links) noch einmal auf Deutsch und
    // als Spielseiten in beiden Sprachen.
    closeBundle() {
      if (!transformed) return;
      const built = readFileSync(path.join(outDir, "index.html"), "utf8");
      write(pathOf("home", "de"), rebuild(built, "de"));
      for (const page of GAME_PAGES) {
        for (const lang of ["en", "de"] as const)
          write(pathOf(page, lang), rebuild(built, lang, page));
      }
    },
  };
}

/**
 * Die fertige englische Startseite in eine andere Seite umbauen: Sprache, Kopf und Vorab-HTML
 * tauschen. Ohne `page` die Startseite der Sprache.
 */
function rebuild(built: string, lang: SeoLanguage, page?: GamePageId): string {
  const head = headHtml("en");
  const body = staticHomeHtml("en");
  if (!built.includes(head) || !built.includes(body)) {
    throw new Error("seo-prerender: englische Startseite nicht gefunden – weitere Seiten fehlen");
  }
  return built
    .replace(/<html lang="en">/, `<html lang="${lang}">`)
    .replace(head, () => headHtml(lang, page))
    .replace(body, () => (page ? staticGameHtml(lang, page) : staticHomeHtml(lang)));
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
      // Song-Schnipsel, Flagge und Umriss des Tages (Einzelspieler): HTTP statt Socket.
      "/api": { target: "http://localhost:3001" },
    },
  },
});
