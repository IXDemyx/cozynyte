/**
 * Stand der Tagesrätsel von heute (Song, Flagge und Umriss des Tages) für die Startseite – nur aus
 * dem Speicher im Browser.
 */

import { FLAG_TRIES, type DailyKind } from "../../../shared/flag";
import { SNIPPET_STAGES, dailyDate } from "../../../shared/snippet";
import { flagStreak, loadFlagDays, loadFlagStats } from "./flag/stats";
import { dailyStreak, loadDailyStats, loadDays } from "./snippet/stats";

export type DailyId = "snippet" | DailyKind;

/** Stand eines Tages: new = noch nicht gespielt, open = angefangen, won/lost = fertig. */
export interface DayResult {
  state: "new" | "open" | "won" | "lost";
  /** Gebrauchte Versuche. */
  tries: number;
}

export interface DailyStatus extends DayResult {
  /** Wie viele Versuche es gibt. */
  max: number;
  streak: number;
}

/** Stand je Tag eines Tagesrätsels – liest den Speicher einmal (für Archiv und Startseite). */
export function dayResults(id: DailyId): (date: string) => DayResult {
  if (id === "snippet") {
    const days = loadDays();
    return (date) => {
      const day = days[date];
      const tries = day?.attempts.length ?? 0;
      const won = day?.attempts.at(-1)?.result === "right";
      return { state: day?.solution ? (won ? "won" : "lost") : tries ? "open" : "new", tries };
    };
  }
  const days = loadFlagDays(id);
  return (date) => {
    const day = days[date];
    const tries = day?.guesses.length ?? 0;
    const won = Boolean(day?.solution) && day?.guesses.at(-1) === day?.solution;
    return { state: day?.solution ? (won ? "won" : "lost") : tries ? "open" : "new", tries };
  };
}

export function dailyStatus(id: DailyId): DailyStatus {
  const today = dailyDate();
  return id === "snippet"
    ? {
        ...dayResults(id)(today),
        max: SNIPPET_STAGES.length,
        streak: dailyStreak(loadDailyStats(), today),
      }
    : { ...dayResults(id)(today), max: FLAG_TRIES, streak: flagStreak(loadFlagStats(id), today) };
}

/** Reihenfolge der Tagesrätsel (Startseite und „Weiter mit“). */
export const DAILY_IDS: DailyId[] = ["snippet", "flag", "outline"];

/** Vor dem Öffnen: Beim Song-Schnipsel den Song des Tages statt des Endlos-Modus zeigen. */
export function prepareDaily(id: DailyId) {
  if (id !== "snippet") return;
  try {
    localStorage.setItem("snippetMode", "daily");
  } catch {
    // Ohne Speicher öffnet die Seite ohnehin den Song des Tages.
  }
}
