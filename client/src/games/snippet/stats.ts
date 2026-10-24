/** Song-Schnipsel: Statistik, Serien und zuletzt gespielte Songs – nur im Browser (localStorage). */

import { SNIPPET_STAGES } from "../../../../shared/snippet";

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
