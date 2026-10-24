/**
 * Tagesrätsel (Song, Flagge und Umriss des Tages): wie alle an einem Tag abgeschnitten haben. Pro
 * Tag nur Zähler (erraten beim 1. … n. Versuch, nicht erraten) – nichts Persönliches. Liegt als
 * JSON-Datei in DATA_DIR (im Docker-Container ein Volume), damit ein Neustart oder Deploy nichts
 * verliert.
 *
 * Gegen Skripte zählen pro IP und Tag höchstens MAX_PER_IP Ergebnisse (mehrere Leute im selben
 * WLAN gehen trotzdem). Die IPs liegen dafür nur gehasht im Speicher und fallen beim
 * Tageswechsel weg.
 */

import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface DailyGlobal {
  byStage: number[];
  lost: number;
}

const KEEP_DAYS = 400;
const MAX_PER_IP = 3;
const SAVE_DELAY_MS = 5000;

const count = (value: unknown) =>
  Number.isInteger(value) && Number(value) > 0 ? Number(value) : 0;
const salt = randomBytes(16);

/** Alle Zähler, damit beim Beenden jeder noch Ungespeichertes schreibt. */
const counters: { flush: () => void }[] = [];

/**
 * Zähler für ein Tagesrätsel. `file`: Dateiname in DATA_DIR, `stages`: Anzahl der Versuche,
 * `label`: Name für Warnungen im Log.
 */
export function dailyCounter(file: string, stages: number, label: string) {
  const FILE = path.resolve(process.env.DATA_DIR ?? "data", file);
  const empty = (): DailyGlobal => ({ byStage: Array.from({ length: stages }, () => 0), lost: 0 });

  function load(): Record<string, DailyGlobal> {
    try {
      const saved = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, Partial<DailyGlobal>>;
      return Object.fromEntries(
        Object.entries(saved).map(([date, day]) => [
          date,
          {
            byStage: Array.from({ length: stages }, (_, i) => count(day?.byStage?.[i])),
            lost: count(day?.lost),
          },
        ]),
      );
    } catch {
      return {}; // Noch keine Datei (oder kaputt): leer anfangen.
    }
  }

  const days = load();
  const perIp = new Map<string, number>();
  let perIpDate = "";
  let timer: NodeJS.Timeout | undefined;

  function save() {
    clearTimeout(timer);
    timer = undefined;
    try {
      mkdirSync(path.dirname(FILE), { recursive: true });
      // Erst in eine Hilfsdatei, dann umbenennen – so bleibt die Datei auch bei einem Absturz heil.
      writeFileSync(`${FILE}.tmp`, JSON.stringify(days));
      renameSync(`${FILE}.tmp`, FILE);
    } catch (error) {
      console.warn(`${label}: Statistik nicht gespeichert (${String(error)})`);
    }
  }

  counters.push({ flush: () => timer && save() });

  return {
    /** Ergebnisse aller an einem Tag. */
    globalResult(date: string): DailyGlobal {
      const day = days[date] ?? empty();
      return { byStage: [...day.byStage], lost: day.lost };
    },

    /** Ergebnis einer Runde mitzählen. `stage`: erraten bei (0 = erster Versuch), null = nicht. */
    countResult(date: string, stage: number | null, ip: string) {
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
    },
  };
}

// Beim Beenden (Deploy, Neustart) noch Ungespeichertes schreiben – für alle Zähler.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    for (const counter of counters) counter.flush();
    process.exit(0);
  });
}
