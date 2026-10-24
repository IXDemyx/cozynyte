/** HTTP-Server, Socket.IO und – im Produktivbetrieb – das gebaute Frontend. */

import express from "express";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { geoImage } from "./games/geo";
import { rooms } from "./state";

const app = express();

export const http = createServer(app);
export const io = new Server(http, { cors: { origin: true } });

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

/* ---------- Länder-Quiz: Flaggen und Umrisse ---------- */

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets");
let outlines: Record<string, { w: number; h: number; d: string }> | undefined;

/** Umriss als fertiges SVG (Catppuccin-Blau mit dunkler Kante – passt zu hellem und dunklem Modus). */
function outlineSvg(code: string): string | null {
  outlines ??= JSON.parse(readFileSync(path.join(assets, "outlines.json"), "utf8"));
  const shape = outlines?.[code];
  if (!shape) return null;
  const pad = 30;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${shape.w + 2 * pad} ` +
    `${shape.h + 2 * pad}"><path d="${shape.d}" fill="#89b4fa" stroke="#1e66f5" ` +
    `stroke-width="4" stroke-linejoin="round" fill-rule="evenodd"/></svg>`
  );
}

// Bild der laufenden Frage. Die Adresse verrät das Land nicht (zufällige Kennung der Frage).
app.get("/quiz-img/:code/:qid/:type", (req, res) => {
  const image = geoImage(
    rooms.get(String(req.params.code).toUpperCase()),
    String(req.params.qid),
    String(req.params.type).replace(/\.svg$/, ""),
  );
  if (!image) return res.status(404).end();
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "private, max-age=600");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (image.type === "flag") {
    return res.send(readFileSync(path.join(assets, "flags", `${image.code}.svg`)));
  }
  const svg = outlineSvg(image.code);
  if (!svg) return res.status(404).end();
  res.send(svg);
});

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
if (existsSync(dist)) {
  // Räume sind kurzlebig und gehören nicht in Suchmaschinen (die Startseite schon).
  app.use("/r", (_req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex");
    next();
  });
  // Deutsche Startseite: eigene Adresse mit eigenem Titel und Text (für Suchmaschinen).
  // Die englische ist die Hauptseite unter „/“.
  app.get("/de", (_req, res) => res.sendFile(path.join(dist, "de", "index.html")));
  // Früher lag Englisch unter /en: dauerhaft auf die Hauptseite umleiten (alte Links, Google).
  app.get("/en", (_req, res) => res.redirect(301, "/"));
  // Datenschutz: nicht in die Suchergebnisse. Die Adresse liefert (wie jede Unterseite) erst das
  // HTML der Startseite aus – Google hielt sie sonst für die Startseite und zeigte sie bei der
  // Suche nach „Cozynyte“ an. Links von dort zählen weiter (follow).
  app.get("/privacy", (_req, res) => {
    res.setHeader("X-Robots-Tag", "noindex, follow");
    res.sendFile(path.join(dist, "index.html"));
  });
  // Spielseiten (z. B. /de/stadt-land-fluss): beim Build vorgerendert als <adresse>/index.html.
  // Ohne Schrägstrich am Ende ausliefern, mit Schrägstrich dorthin umleiten (eine Adresse je Seite).
  const pageFile = (address: string) => path.join(dist, address, "index.html");
  app.get(/^\/(de\/)?[a-z-]+$/, (req, res, next) => {
    if (!existsSync(pageFile(req.path))) return next();
    res.sendFile(pageFile(req.path));
  });
  app.get(/^\/(de\/)?[a-z-]+\/$/, (req, res, next) => {
    const address = req.path.slice(0, -1);
    if (!existsSync(pageFile(address))) return next();
    res.redirect(301, address);
  });
  app.use(express.static(dist));
  // Räume (/r/…) gibt es; jede andere unbekannte Adresse ist ein 404 – die App zeigt dann die
  // Startseite, Suchmaschinen legen aber keine Kopien der Startseite unter fremden Adressen an.
  app.get(/^(?!\/socket\.io).*/, (req, res) => {
    if (!req.path.startsWith("/r/")) {
      res.status(404).setHeader("X-Robots-Tag", "noindex");
    }
    res.sendFile(path.join(dist, "index.html"));
  });
}
