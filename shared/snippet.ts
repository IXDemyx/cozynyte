/** Song-Schnipsel: Einzelspieler-Songrätsel – Stufen und Protokoll für Client und Server. */

/** Länge der Ausschnitte in Sekunden – nach jedem Fehlversuch oder Überspringen die nächste. */
export const SNIPPET_STAGES = [0.1, 0.5, 1, 2, 4, 8, 16];

/** Punkte für einen erratenen Song: 7 bei der ersten Stufe (0,1 s), 1 bei der letzten (16 s). */
export function snippetPoints(stage: number): number {
  return Math.max(1, SNIPPET_STAGES.length - stage);
}

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

/** Antwort auf einen Versuch: Ergebnis, ob die Runde vorbei ist, und dann die Lösung. */
export interface SnippetTurn {
  attempt: SnippetAttempt;
  done: boolean;
  solution?: SnippetSolution;
}
