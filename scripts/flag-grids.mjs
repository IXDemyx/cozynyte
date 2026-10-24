/**
 * Erzeugt server/assets/flag-grids.json für die Flagge des Tages: jede Flagge auf ein Raster von
 * 64 × 48 Zellen, je Zelle die häufigste Farbe aus einer kleinen Palette typischer Flaggenfarben
 * (so zählen ähnliche Rot- oder Blautöne als gleich). Gespeichert als Lauflängen
 * „<Farbe><Anzahl zur Basis 36>“, durch Kommas getrennt.
 *
 * Nur nötig, wenn sich Flaggen ändern. Zeichnet die SVGs mit Chromium über Playwright (gehört
 * nicht zu den Abhängigkeiten, daher ohne Eintrag in package.json installieren):
 *   npm i --no-save playwright && npx playwright install chromium
 *   node scripts/flag-grids.mjs
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "server/assets/flags");
const W = 64;
const H = 48;
/** Rot, Weiß, Schwarz, Gelb, Grün, Dunkelblau, Blau, Hellblau, Orange, Weinrot. */
const PALETTE = [
  [206, 17, 38],
  [255, 255, 255],
  [0, 0, 0],
  [252, 209, 22],
  [0, 135, 60],
  [0, 40, 120],
  [0, 90, 190],
  [110, 180, 230],
  [255, 130, 0],
  [130, 20, 40],
];

const svgs = Object.fromEntries(
  readdirSync(dir)
    .filter((file) => file.endsWith(".svg"))
    .map((file) => [
      file.slice(0, -4),
      `data:image/svg+xml;base64,${readFileSync(path.join(dir, file)).toString("base64")}`,
    ]),
);

const browser = await chromium.launch();
const page = await browser.newPage();
const cells = await page.evaluate(
  async ({ svgs, W, H, PALETTE }) => {
    const result = {};
    const S = 4; // je Zelle 4 × 4 Pixel auswerten
    const canvas = document.createElement("canvas");
    canvas.width = W * S;
    canvas.height = H * S;
    const ctx = canvas.getContext("2d");
    for (const [code, src] of Object.entries(svgs)) {
      const img = new Image();
      img.src = src;
      await img.decode();
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let out = "";
      for (let cy = 0; cy < H; cy++) {
        for (let cx = 0; cx < W; cx++) {
          const votes = PALETTE.map(() => 0);
          for (let y = 0; y < S; y++) {
            for (let x = 0; x < S; x++) {
              const i = ((cy * S + y) * canvas.width + cx * S + x) * 4;
              let best = 0;
              let bestDistance = Infinity;
              PALETTE.forEach(([r, g, b], k) => {
                const d = (data[i] - r) ** 2 + (data[i + 1] - g) ** 2 + (data[i + 2] - b) ** 2;
                if (d < bestDistance) {
                  bestDistance = d;
                  best = k;
                }
              });
              votes[best]++;
            }
          }
          out += votes.indexOf(Math.max(...votes));
        }
      }
      result[code] = out;
    }
    return result;
  },
  { svgs, W, H, PALETTE },
);
await browser.close();

const runs = (text) => text.match(/(.)\1*/g).map((run) => run[0] + run.length.toString(36));
const grids = Object.fromEntries(
  Object.keys(cells)
    .sort()
    .map((code) => [code, runs(cells[code]).join(",")]),
);
writeFileSync(
  path.join(root, "server/assets/flag-grids.json"),
  JSON.stringify({ w: W, h: H, grids }),
);
console.log(`${Object.keys(grids).length} Flaggen gerastert.`);
