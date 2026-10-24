/**
 * Song des Tages: wie alle an einem Tag abgeschnitten haben. Pro Tag nur Zähler (erraten bei
 * Stufe 1 … 7, nicht erraten) – nichts Persönliches. Liegt als JSON-Datei in DATA_DIR (im
 * Docker-Container ein Volume), damit ein Neustart oder Deploy nichts verliert.
 *
 * Gegen Skripte zählen pro IP und Tag höchstens MAX_PER_IP Ergebnisse (mehrere Leute im selben
 * WLAN gehen trotzdem). Die IPs liegen dafür nur gehasht im Speicher und fallen beim
 * Tageswechsel weg.
 */

import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SNIPPET_STAGES, type SnippetGlobal } from "../../../shared/snippet";

const FILE = path.resolve(process.env.DATA_DIR ?? "data", "snippet-daily.json");
const KEEP_DAYS = 400;
const MAX_PER_IP = 3;
const SAVE_DELAY_MS = 5000;

const empty = (): SnippetGlobal => ({ byStage: SNIPPET_STAGES.map(() => 0), lost: 0 });
const count = (value: unknown) =>
  Number.isInteger(value) && Number(value) > 0 ? Number(value) : 0;

function load(): Record<string, SnippetGlobal> {
  try {
    const saved = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, Partial<SnippetGlobal>>;
    return Object.fromEntries(
      Object.entries(saved).map(([date, day]) => [
        date,
        {
          byStage: SNIPPET_STAGES.map((_, i) => count(day?.byStage?.[i])),
          lost: count(day?.lost),
        },
      ]),
    );
  } catch {
    return {}; // Noch keine Datei (oder kaputt): leer anfangen.
  }
}

const days = load();
const salt = randomBytes(16);
const perIp = new Map<string, number>();
let perIpDate = "";
let timer: NodeJS.Timeout | undefined;

/** Ergebnisse aller an einem Tag. */
export function globalResult(date: string): SnippetGlobal {
  const day = days[date] ?? empty();
  return { byStage: [...day.byStage], lost: day.lost };
}

/** Ergebnis einer Runde mitzählen. `stage`: erraten bei (0 = erste Stufe), null = nicht. */
export function countResult(date: string, stage: number | null, ip: string) {
  if (perIpDate !== date) {
    perIp.clear();
    perIpDate = date;
  }
  const key = createHash("sha256").update(salt).update(ip).digest("base64");
  const seen = perIp.get(key) ?? 0;
  if (seen >= MAX_PER_IP) return;
  perIp.set(key, seen + 1);

  const day = (days[date] ??= empty());
  if (stage === null) day.lost += 1;
  else day.byStage[stage] += 1;

  // Nur die letzten KEEP_DAYS Tage behalten.
  const dates = Object.keys(days).sort();
  for (const old of dates.slice(0, Math.max(0, dates.length - KEEP_DAYS))) delete days[old];

  timer ??= setTimeout(save, SAVE_DELAY_MS);
}

function save() {
  clearTimeout(timer);
  timer = undefined;
  try {
    mkdirSync(path.dirname(FILE), { recursive: true });
    // Erst in eine Hilfsdatei, dann umbenennen – so bleibt die Datei auch bei einem Absturz heil.
    writeFileSync(`${FILE}.tmp`, JSON.stringify(days));
    renameSync(`${FILE}.tmp`, FILE);
  } catch (error) {
    console.warn(`Song des Tages: Statistik nicht gespeichert (${String(error)})`);
  }
}

// Beim Beenden (Deploy, Neustart) noch Ungespeichertes schreiben.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    if (timer) save();
    process.exit(0);
  });
}
