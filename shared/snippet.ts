/** Song-Schnipsel: Einzelspieler-Songrätsel – Stufen und Protokoll für Client und Server. */

/** Länge der Ausschnitte in Sekunden – nach jedem Fehlversuch oder Überspringen die nächste. */
export const SNIPPET_STAGES = [0.1, 0.5, 1, 2, 4, 7, 12];

/** Punkte für einen erratenen Song: 7 bei der ersten Stufe (0,1 s), 1 bei der letzten (12 s). */
export function snippetPoints(stage: number): number {
  return Math.max(1, SNIPPET_STAGES.length - stage);
}

/** Song des Tages: Tag 1. */
export const DAILY_START = "2026-10-24";
const DAY_MS = 24 * 60 * 60_000;
const BERLIN = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Tag in deutscher Zeit als „JJJJ-MM-TT“ – der Song des Tages wechselt um Mitternacht in Berlin. */
export function dailyDate(at = Date.now()): string {
  const parts = Object.fromEntries(BERLIN.formatToParts(at).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Laufende Nummer eines Tages (#1 = DAILY_START). */
export const dailyNumber = (date: string) =>
  Math.round((Date.parse(date) - Date.parse(DAILY_START)) / DAY_MS) + 1;

/** Tag zu einer Nummer. */
export const dailyDateOf = (number: number) =>
  new Date(Date.parse(DAILY_START) + (number - 1) * DAY_MS).toISOString().slice(0, 10);

/** Wie ein Versuch ausging. „artist“: richtiger Interpret, anderer Song. */
export type SnippetResult = "skip" | "wrong" | "artist" | "right";

/** Ein Treffer der Songsuche (ohne Hörprobe – die läuft über den Server). */
export interface SnippetTrack {
  id: number;
  title: string;
  artist: string;
  artwork: string;
}

/** Die Lösung, sobald die Runde vorbei ist. */
export interface SnippetSolution extends SnippetTrack {
  album: string;
  year?: number;
}

export interface SnippetAttempt {
  result: SnippetResult;
  /** Der geratene Song (fehlt beim Überspringen). */
  guess?: SnippetTrack;
}

/** Song des Tages: wie alle an einem Tag abgeschnitten haben (anonyme Zähler vom Server). */
export interface SnippetGlobal {
  /** Erraten bei Stufe 1, 2, … */
  byStage: number[];
  lost: number;
}

/** Antwort auf einen Versuch: Ergebnis, ob die Runde vorbei ist, und dann die Lösung. */
export interface SnippetTurn {
  attempt: SnippetAttempt;
  done: boolean;
  solution?: SnippetSolution;
  /** Song des Tages, sobald die Runde vorbei ist: Ergebnisse aller an diesem Tag. */
  global?: SnippetGlobal;
}

/** Song des Tages: Antwort auf POST /api/snippet/daily. */
export interface SnippetDaily {
  /** Runde für Hörprobe, Tipps und Überspringen (wie im Endlos-Modus). */
  id: string;
  /** Tag in deutscher Zeit, z. B. „2026-10-25“ – daran hängt der Fortschritt im Browser. */
  date: string;
  /** Laufende Nummer (#1 am 24.10.2026), für den Teilen-Text. */
  number: number;
  /** Nummer von heute – frühere Tage gibt es im Archiv. */
  today: number;
  /** Millisekunden bis zum nächsten Song des Tages (Mitternacht deutscher Zeit). */
  nextIn: number;
  /** Nur wenn die Runde laut Browser schon vorbei ist. */
  solution?: SnippetSolution;
  global?: SnippetGlobal;
}
