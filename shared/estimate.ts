/**
 * Schätzfragen: Alle tippen eine Zahl zur selben Frage (z. B. „Wie hoch ist der Eiffelturm?“),
 * wer am nächsten dran liegt, bekommt die meisten Punkte. Hier steht nur, was Client und Server
 * beide brauchen – die Fragen samt Lösungen liegen allein auf dem Server.
 */

export type EstimateCategory = "world" | "history" | "science" | "culture" | "gaming" | "sport";
/** Lobby: alle Themen gemischt oder nur eins. */
export type EstimateTopic = EstimateCategory | "all";

export const ESTIMATE_CATEGORIES: EstimateCategory[] = [
  "world",
  "history",
  "science",
  "culture",
  "gaming",
  "sport",
];

/**
 * Einheit der Antwort. „year“ = Jahreszahl (ohne Tausenderpunkt), „count“ = reine Anzahl.
 * Die Beschriftungen stehen in den Übersetzungen (t.estimate.units).
 */
export type EstimateUnit =
  | "count"
  | "year"
  | "years"
  | "months"
  | "weeks"
  | "days"
  | "h"
  | "min"
  | "s"
  | "m"
  | "km"
  | "cm"
  | "mkm"
  | "g"
  | "kms"
  | "ms"
  | "percent"
  | "c"
  | "f"
  | "k";

export const ESTIMATE_QUESTIONS = [5, 10, 15, 20];
export const ESTIMATE_SECONDS = [20, 30, 45];
/** Höchster Tipp – größere Zahlen kommen in keiner Frage vor. */
export const ESTIMATE_MAX = 999_999_999_999;
/** Punkte nach Platz (am nächsten dran = Platz 1), ab Platz 4 gibt es den letzten Wert. */
export const ESTIMATE_POINTS = [100, 60, 40, 20];
/** Genau getroffen. */
export const ESTIMATE_EXACT_BONUS = 50;
/** So lange steht die Auflösung einer Frage (länger als beim Länder-Quiz: alle Tipps lesen). */
export const ESTIMATE_REVEAL_MS = 9_000;
/** Kurze Pause vor der ersten Frage (Countdown). */
export const ESTIMATE_COUNTDOWN_MS = 3_000;
