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

/** Umriss als fertiges SVG (orange mit dunkler Kante – passt zu hellem und dunklem Modus). */
function outlineSvg(code: string): string | null {
  outlines ??= JSON.parse(readFileSync(path.join(assets, "outlines.json"), "utf8"));
  const shape = outlines?.[code];
  if (!shape) return null;
  const pad = 30;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${shape.w + 2 * pad} ` +
    `${shape.h + 2 * pad}"><path d="${shape.d}" fill="#f97316" stroke="#9a3412" ` +
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
  // Englische Startseite: eigene Adresse mit eigenem Titel und Text (für Suchmaschinen).
  app.get("/en", (_req, res) => res.sendFile(path.join(dist, "en", "index.html")));
  app.use(express.static(dist));
  app.get(/^(?!\/socket\.io).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}
