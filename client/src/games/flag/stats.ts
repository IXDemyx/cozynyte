/**
 * Flagge und Umriss des Tages: Stand jedes gespielten Tages und eigene Statistik – nur im Browser
 * (localStorage), getrennt je Rätsel. Wie beim Song des Tages zählt die Serie Tage am Stück, an
 * denen das Land erraten wurde; das Archiv zählt nicht mit.
 */

import { FLAG_TRIES, type DailyKind } from "../../../../shared/flag";

/** Stand eines Tages: die Tipps (ISO-Codes) und ob aufgegeben. */
export interface FlagDay {
  date: string;
  guesses: string[];
  gaveUp: boolean;
  /** Lösung, sobald die Runde vorbei ist. */
  solution: string | null;
  /** Bonusfrage: gewählte Hauptstadt (ISO-Code ihres Landes), null = noch nicht beantwortet. */
  capital: string | null;
}

export interface FlagStats {
  played: number;
  won: number;
  streak: number;
  best: number;
  /** Erraten beim 1., 2., … Versuch. */
  byStage: number[];
  /** Zuletzt gespielter bzw. erratener Tag („JJJJ-MM-TT“). */
  lastPlayed: string;
  lastWon: string;
}

const daysKey = (kind: DailyKind) => `${kind}Days`;
const statsKey = (kind: DailyKind) => `${kind}Stats`;

const count = (value: unknown) =>
  Number.isInteger(value) && Number(value) > 0 ? Number(value) : 0;

/** Alle gespielten Tage nach Datum. */
export function loadFlagDays(kind: DailyKind): Record<string, FlagDay> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(daysKey(kind)) ?? "null");
    if (!saved || typeof saved !== "object") return {};
    const days: Record<string, FlagDay> = {};
    for (const [date, day] of Object.entries(saved as Record<string, Partial<FlagDay>>)) {
      if (!day || !Array.isArray(day.guesses)) continue;
      days[date] = {
        date,
        guesses: day.guesses.filter((code) => typeof code === "string").slice(0, FLAG_TRIES),
        gaveUp: day.gaveUp === true,
        solution: typeof day.solution === "string" ? day.solution : null,
        capital: typeof day.capital === "string" ? day.capital : null,
      };
    }
    return days;
  } catch {
    return {};
  }
}

export function saveFlagDay(kind: DailyKind, day: FlagDay) {
  try {
    localStorage.setItem(daysKey(kind), JSON.stringify({ ...loadFlagDays(kind), [day.date]: day }));
  } catch {
    // Ohne Speicher beginnt der Tag beim Neuladen eben von vorn.
  }
}

const empty = (): FlagStats => ({
  played: 0,
  won: 0,
  streak: 0,
  best: 0,
  byStage: Array.from({ length: FLAG_TRIES }, () => 0),
  lastPlayed: "",
  lastWon: "",
});

export function loadFlagStats(kind: DailyKind): FlagStats {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(statsKey(kind)) ?? "null");
    if (!saved || typeof saved !== "object") return empty();
    const s = saved as Partial<Record<keyof FlagStats, unknown>>;
    const byStage = Array.isArray(s.byStage) ? s.byStage : [];
    return {
      played: count(s.played),
      won: count(s.won),
      streak: count(s.streak),
      best: count(s.best),
      byStage: Array.from({ length: FLAG_TRIES }, (_, i) => count(byStage[i])),
      lastPlayed: typeof s.lastPlayed === "string" ? s.lastPlayed : "",
      lastWon: typeof s.lastWon === "string" ? s.lastWon : "",
    };
  } catch {
    return empty();
  }
}

/** Der Tag davor („JJJJ-MM-TT“), leer bei ungültigem Datum. */
function dayBefore(date: string): string {
  const at = Date.parse(date);
  return Number.isNaN(at) ? "" : new Date(at - 24 * 60 * 60_000).toISOString().slice(0, 10);
}

/** Aktuelle Serie – gerissen, wenn gestern und heute nichts erraten wurde. */
export function flagStreak(stats: FlagStats, today: string): number {
  if (!stats.lastWon) return 0;
  return stats.lastWon === today || stats.lastWon === dayBefore(today) ? stats.streak : 0;
}

/** Ergebnis des Tages eintragen (nur einmal pro Tag). `stage`: erraten bei, null = nicht. */
export function recordFlag(kind: DailyKind, date: string, stage: number | null): FlagStats {
  const s = loadFlagStats(kind);
  if (s.lastPlayed === date) return s;
  const won = stage !== null;
  const streak = won ? (s.lastWon === dayBefore(date) ? s.streak + 1 : 1) : 0;
  const next: FlagStats = {
    played: s.played + 1,
    won: s.won + (won ? 1 : 0),
    streak,
    best: Math.max(s.best, streak),
    byStage: s.byStage.map((n, i) => (i === stage ? n + 1 : n)),
    lastPlayed: date,
    lastWon: won ? date : s.lastWon,
  };
  try {
    localStorage.setItem(statsKey(kind), JSON.stringify(next));
  } catch {
    // Ohne Speicher gilt die Statistik eben nur bis zum Neuladen.
  }
  return next;
}
