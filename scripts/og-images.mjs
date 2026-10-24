/**
 * Erzeugt die Vorschaubilder (og:image, 1200 × 630) der Tagesrätsel: Song, Flagge und Umriss des
 * Tages, je auf Englisch und Deutsch, nach client/public/og-<seite>-<sprache>.png. Gleicher Stil
 * wie og-image.png (Catppuccin Mocha, Fredoka, Logo oben links, Verlauf unten).
 *
 * Nur nötig, wenn sich die Texte ändern. Zeichnet mit Chromium über Playwright (gehört nicht zu
 * den Abhängigkeiten, daher ohne Eintrag in package.json installieren):
 *   npm i --no-save playwright && npx playwright install chromium
 *   node scripts/og-images.mjs
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = (...parts) => path.join(root, ...parts);
const dataUrl = (type, ...parts) =>
  `data:${type};base64,${readFileSync(file(...parts)).toString("base64")}`;

const TEXT = {
  snippet: {
    en: {
      title: "Song of the Day",
      text: "Name the song from 0.1 seconds<br>7 attempts · new every day",
    },
    de: {
      title: "Song des Tages",
      text: "Erkenne den Song an 0,1 Sekunden<br>7 Versuche · jeden Tag neu",
    },
  },
  flag: {
    en: {
      title: "Flag of the Day",
      text: "Uncover the flag colour by colour<br>7 guesses · new every day",
    },
    de: {
      title: "Flagge des Tages",
      text: "Deck die Flagge Farbe für Farbe auf<br>7 Tipps · jeden Tag neu",
    },
  },
  outline: {
    en: {
      title: "Shape of the Day",
      text: "Name the country from its shape<br>7 guesses · new every day",
    },
    de: {
      title: "Umriss des Tages",
      text: "Erkenne das Land am Umriss<br>7 Tipps · jeden Tag neu",
    },
  },
};

/* ---------- Bilder rechts ---------- */

/** Song: Wellenform, der erste Ausschnitt hervorgehoben, darunter die Stufen. */
function snippetArt(lang) {
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const bars = Array.from({ length: 38 }, (_, i) => {
    const h = 18 + Math.round(random() * 120 * (0.55 + 0.45 * Math.sin(i / 4)));
    const on = i < 3;
    return `<div style="height:${h}px;background:${on ? "#89b4fa" : "#45475a"}"></div>`;
  }).join("");
  const stages = ["0.1", "0.5", "1", "2", "4", "7", "12"]
    .map((s, i) => {
      const label = lang === "de" ? s.replace(".", ",") : s;
      return `<span class="pill${i === 0 ? " on" : ""}">${label}</span>`;
    })
    .join("");
  return `<div class="card"><div class="wave">${bars}</div><div class="pills">${stages}<span class="unit">s</span></div></div>`;
}

/** Flagge: Brasilien, aufgedeckt wie im Spiel nach den Tipps Portugal und Kolumbien. */
function flagArt() {
  const { w, h } = { w: 64, h: 48 };
  const grids = JSON.parse(readFileSync(file("server/assets/flag-grids.json"), "utf8")).grids;
  const decode = (runs) => {
    const cells = new Uint8Array(w * h);
    let at = 0;
    for (const run of runs.split(",")) {
      const length = parseInt(run.slice(1), 36);
      cells.fill(Number(run[0]), at, at + length);
      at += length;
    }
    return cells;
  };
  const goal = decode(grids.br);
  const guesses = ["pt", "co"].map((code) => decode(grids[code]));
  // Verdeckte Zellen als graue Kacheln über der Flagge.
  const cover = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; ) {
      const hidden = (at) => at < w && !guesses.some((g) => g[y * w + at] === goal[y * w + at]);
      if (!hidden(x)) {
        x++;
        continue;
      }
      let end = x;
      while (hidden(end)) end++;
      cover.push(`M${x} ${y}h${end - x}v1h${x - end}z`);
      x = end;
    }
  }
  return `<div class="flag">
    <img src="${dataUrl("image/svg+xml", "server/assets/flags/br.svg")}" alt="">
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" shape-rendering="crispEdges"><path fill="#313244" d="${cover.join("")}"/></svg>
  </div>`;
}

/** Umriss: Griechenland, dazu ein Tipp mit Entfernung, Richtung und Nähe. */
function outlineArt(lang) {
  const shape = JSON.parse(readFileSync(file("server/assets/outlines.json"), "utf8")).gr;
  const pad = 30;
  const km = lang === "de" ? "1.050 km" : "1,050 km";
  const guess = lang === "de" ? "Italien" : "Italy";
  return `<div class="card shape">
    <svg viewBox="${-pad} ${-pad} ${shape.w + 2 * pad} ${shape.h + 2 * pad}">
      <path d="${shape.d}" fill="#89b4fa" stroke="#b4befe" stroke-width="4" stroke-linejoin="round" fill-rule="evenodd"/>
    </svg>
    <div class="row"><span>${guess}</span><span class="mono">${km} → 92 %</span></div>
  </div>`;
}

const ART = { snippet: snippetArt, flag: flagArt, outline: outlineArt };

/* ---------- Seite ---------- */

function page(id, lang) {
  const { title, text } = TEXT[id][lang];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: Fredoka; src: url(${dataUrl("font/woff", "client/public/fonts/fredoka-latin.woff")}); font-weight: 600; }
    @font-face { font-family: Inter; src: url(${dataUrl("font/woff2", "client/public/fonts/inter-latin.woff2")}); }
    @font-face { font-family: JetBrains; src: url(${dataUrl("font/woff2", "client/public/fonts/jetbrains-mono-latin.woff2")}); }
    * { box-sizing: border-box; margin: 0; }
    body { width: 1200px; height: 630px; overflow: hidden; position: relative; color: #cdd6f4;
      font-family: Inter, sans-serif;
      background:
        radial-gradient(circle at 100% 0%, #24273a 0%, transparent 45%),
        radial-gradient(circle, #2a2b3c 1px, transparent 1.2px) 0 0 / 24px 24px,
        #181825; }
    .logo { position: absolute; left: 97px; top: 90px; display: flex; align-items: center; gap: 14px;
      font: 600 34px Fredoka; }
    .logo span { color: #89b4fa; }
    .text { position: absolute; left: 97px; top: 50%; transform: translateY(-38%); width: 620px; }
    h1 { font: 600 76px/1.02 Fredoka; letter-spacing: -0.5px; }
    p { margin-top: 26px; font-size: 27px; line-height: 1.4; color: #9399b2; }
    .url { position: absolute; left: 97px; bottom: 40px; font: 22px JetBrains; color: #585b70; }
    .bar { position: absolute; left: 0; right: 0; bottom: 0; height: 8px;
      background: linear-gradient(90deg, #89b4fa, #94e2d5); }
    .art { position: absolute; right: 90px; top: 50%; transform: translateY(-46%); width: 380px; }
    .card { border: 1px solid #313244; border-radius: 22px; background: #1e1e2e; padding: 26px;
      box-shadow: 8px 8px 0 rgba(137, 180, 250, 0.35); }
    .wave { display: flex; align-items: center; gap: 4px; height: 170px; }
    .wave div { flex: 1; border-radius: 3px; }
    .pills { display: flex; gap: 6px; margin-top: 22px; }
    .pill { flex: 1; text-align: center; padding: 7px 0; border-radius: 999px; background: #313244;
      font: 15px JetBrains; color: #9399b2; }
    .pill.on { background: #89b4fa; color: #11111b; font-weight: 700; }
    .unit { align-self: center; font: 15px JetBrains; color: #6c7086; }
    .flag { position: relative; aspect-ratio: 4 / 3; border-radius: 18px; overflow: hidden;
      border: 1px solid #313244; box-shadow: 8px 8px 0 rgba(137, 180, 250, 0.35); }
    .flag img, .flag svg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .shape svg { display: block; width: 100%; height: 240px; }
    .row { display: flex; justify-content: space-between; margin-top: 20px; padding: 10px 14px;
      border-radius: 12px; background: #313244; font-size: 18px; font-weight: 600; }
    .mono { font: 16px JetBrains; color: #cdd6f4; }
  </style></head><body>
    <div class="logo">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#89b4fa" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M20 3v4M22 5h-4"/>
      </svg>
      <div>cozy<span>nyte</span></div>
    </div>
    <div class="text"><h1>${title}</h1><p>${text}</p></div>
    <div class="art">${ART[id](lang)}</div>
    <div class="url">cozynyte.com</div>
    <div class="bar"></div>
  </body></html>`;
}

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const id of Object.keys(TEXT)) {
  for (const lang of ["en", "de"]) {
    await tab.setContent(page(id, lang));
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: file("client/public", `og-${id}-${lang}.png`) });
    console.log(`og-${id}-${lang}.png`);
  }
}
await browser.close();
