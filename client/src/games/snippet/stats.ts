/**
 * Song-Schnipsel: Statistik, Serien und zuletzt gespielte Songs, dazu Stand und Statistik des
 * Songs des Tages – nur im Browser (localStorage).
 */

import {
  SNIPPET_STAGES,
  type SnippetAttempt,
  type SnippetSolution,
} from "../../../../shared/snippet";

/** Serie einer Kategorie: erratene Songs am Stück und die Punkte dabei, jeweils mit Rekord. */
export interface SnippetRun {
  streak: number;
  points: number;
  best: number;
  bestPoints: number;
}

export interface SnippetStats {
  played: number;
  won: number;
  /** Erratene Songs am Stück über alle Kategorien (endet mit dem ersten nicht erratenen). */
  streak: number;
  best: number;
  /** Erraten bei Stufe 1, 2, … */
  byStage: number[];
  /** Serie und Rekord je Kategorie („surprise“ zählt als eigene). */
  runs: Record<string, SnippetRun>;
  /** IDs der zuletzt gespielten Songs – kommen nicht gleich wieder. */
  recent: number[];
}

/** Was sich mit einem Song an der Serie geändert hat – für die Meldung in der Auflösung. */
export interface RunChange {
  /** Serie und Punkte vor diesem Song. */
  before: SnippetRun;
  after: SnippetRun;
  /** Neuer Rekord bei der Länge der Serie bzw. bei den Punkten. */
  newBest: boolean;
  newBestPoints: boolean;
}

const KEY = "snippetStats";
const RECENT = 50;

export const emptyRun = (): SnippetRun => ({ streak: 0, points: 0, best: 0, bestPoints: 0 });

const empty = (): SnippetStats => ({
  played: 0,
  won: 0,
  streak: 0,
  best: 0,
  byStage: SNIPPET_STAGES.map(() => 0),
  runs: {},
  recent: [],
});

const count = (value: unknown) =>
  Number.isInteger(value) && Number(value) > 0 ? Number(value) : 0;

function readRuns(value: unknown): Record<string, SnippetRun> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, Partial<Record<keyof SnippetRun, unknown>>>).map(
      ([key, run]) => [
        key,
        {
          streak: count(run?.streak),
          points: count(run?.points),
          best: count(run?.best),
          bestPoints: count(run?.bestPoints),
        },
      ],
    ),
  );
}

export function loadStats(): SnippetStats {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!saved || typeof saved !== "object") return empty();
    const s = saved as Partial<Record<keyof SnippetStats, unknown>>;
    const byStage = Array.isArray(s.byStage) ? s.byStage : [];
    return {
      played: count(s.played),
      won: count(s.won),
      streak: count(s.streak),
      best: count(s.best),
      byStage: SNIPPET_STAGES.map((_, i) => count(byStage[i])),
      runs: readRuns(s.runs),
      recent: Array.isArray(s.recent) ? s.recent.filter(Number.isInteger).slice(-RECENT) : [],
    };
  } catch {
    return empty();
  }
}

/**
 * Ergebnis einer Runde eintragen. `stage`: bei welcher Stufe erraten (0 = erste), null = nicht;
 * `points`: dafür bekommene Punkte (0 = nicht erraten).
 */
export function recordResult(
  trackId: number,
  category: string,
  stage: number | null,
  points: number,
): { stats: SnippetStats; change: RunChange } {
  const s = loadStats();
  const won = stage !== null;
  const streak = won ? s.streak + 1 : 0;
  const before = s.runs[category] ?? emptyRun();
  const run = {
    streak: won ? before.streak + 1 : 0,
    points: won ? before.points + points : 0,
  };
  const after: SnippetRun = {
    ...run,
    best: Math.max(before.best, run.streak),
    bestPoints: Math.max(before.bestPoints, run.points),
  };
  const next: SnippetStats = {
    played: s.played + 1,
    won: s.won + (won ? 1 : 0),
    streak,
    best: Math.max(s.best, streak),
    byStage: s.byStage.map((n, i) => (i === stage ? n + 1 : n)),
    runs: { ...s.runs, [category]: after },
    recent: [...s.recent.filter((id) => id !== trackId), trackId].slice(-RECENT),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ohne Speicher gilt die Statistik eben nur bis zum Neuladen.
  }
  return {
    stats: next,
    change: {
      before,
      after,
      newBest: after.best > before.best,
      newBestPoints: after.bestPoints > before.bestPoints,
    },
  };
}

/** Song des Tages: Stand eines Tages (heute oder aus dem Archiv), damit Neuladen nichts verliert. */
export interface DailyProgress {
  date: string;
  number: number;
  attempts: SnippetAttempt[];
  solution: SnippetSolution | null;
}

/** Song des Tages: eigene Statistik, Serie in Tagen (erraten an aufeinanderfolgenden Tagen). */
export interface DailyStats {
  played: number;
  won: number;
  streak: number;
  best: number;
  byStage: number[];
  /** Zuletzt gespielter bzw. erratener Tag („JJJJ-MM-TT“). */
  lastPlayed: string;
  lastWon: string;
}

const DAYS_KEY = "snippetDailyDays";
const DAILY_STATS_KEY = "snippetDailyStats";

/** Alle gespielten Tage nach Datum. */
export function loadDays(): Record<string, DailyProgress> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(DAYS_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return {};
    const days: Record<string, DailyProgress> = {};
    for (const [date, day] of Object.entries(saved as Record<string, Partial<DailyProgress>>)) {
      if (!day || !Array.isArray(day.attempts)) continue;
      days[date] = {
        date,
        number: count(day.number),
        attempts: day.attempts.slice(0, SNIPPET_STAGES.length),
        solution: day.solution ?? null,
      };
    }
    return days;
  } catch {
    return {};
  }
}

export function saveDay(progress: DailyProgress) {
  try {
    localStorage.setItem(DAYS_KEY, JSON.stringify({ ...loadDays(), [progress.date]: progress }));
  } catch {
    // Ohne Speicher beginnt der Tag beim Neuladen eben von vorn.
  }
}

const emptyDaily = (): DailyStats => ({
  played: 0,
  won: 0,
  streak: 0,
  best: 0,
  byStage: SNIPPET_STAGES.map(() => 0),
  lastPlayed: "",
  lastWon: "",
});

export function loadDailyStats(): DailyStats {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(DAILY_STATS_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return emptyDaily();
    const s = saved as Partial<Record<keyof DailyStats, unknown>>;
    const byStage = Array.isArray(s.byStage) ? s.byStage : [];
    return {
      played: count(s.played),
      won: count(s.won),
      streak: count(s.streak),
      best: count(s.best),
      byStage: SNIPPET_STAGES.map((_, i) => count(byStage[i])),
      lastPlayed: typeof s.lastPlayed === "string" ? s.lastPlayed : "",
      lastWon: typeof s.lastWon === "string" ? s.lastWon : "",
    };
  } catch {
    return emptyDaily();
  }
}

/** Der Tag davor („JJJJ-MM-TT“), leer bei ungültigem Datum. */
function dayBefore(date: string): string {
  const at = Date.parse(date);
  return Number.isNaN(at) ? "" : new Date(at - 24 * 60 * 60_000).toISOString().slice(0, 10);
}

/** Aktuelle Tagesserie – gerissen, wenn gestern und heute nichts erraten wurde. */
export function dailyStreak(stats: DailyStats, today: string): number {
  if (!stats.lastWon) return 0;
  return stats.lastWon === today || stats.lastWon === dayBefore(today) ? stats.streak : 0;
}

/** Ergebnis des Tages eintragen (nur einmal pro Tag). `stage`: erraten bei, null = nicht. */
export function recordDaily(date: string, stage: number | null): DailyStats {
  const s = loadDailyStats();
  if (s.lastPlayed === date) return s;
  const won = stage !== null;
  const streak = won ? (s.lastWon === dayBefore(date) ? s.streak + 1 : 1) : 0;
  const next: DailyStats = {
    played: s.played + 1,
    won: s.won + (won ? 1 : 0),
    streak,
    best: Math.max(s.best, streak),
    byStage: s.byStage.map((n, i) => (i === stage ? n + 1 : n)),
    lastPlayed: date,
    lastWon: won ? date : s.lastWon,
  };
  try {
    localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(next));
  } catch {
    // Ohne Speicher gilt die Statistik eben nur bis zum Neuladen.
  }
  return next;
}
