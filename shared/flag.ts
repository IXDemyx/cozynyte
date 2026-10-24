/**
 * Flagge des Tages: Einzelspieler-Flaggenrätsel – Protokoll für Client und Server.
 *
 * Die Flagge ist erst ganz verdeckt. Jeder Tipp legt die Flagge des getippten Landes darüber: Wo
 * an derselben Stelle dieselbe Farbe ist, wird die gesuchte Flagge sichtbar. Verglichen wird auf
 * einem Raster (FLAG_GRID), dazu gibt es Entfernung, Richtung und Nähe zum gesuchten Land.
 *
 * Umriss des Tages läuft genauso, nur ist statt der Flagge der Umriss des Landes zu sehen (ohne
 * Farbvergleich, nur Entfernung, Richtung und Nähe). Beide teilen Tag-Nummern und Protokoll.
 */

/** Welches Tagesrätsel: Flagge oder Umriss des Tages. */
export type DailyKind = "flag" | "outline";

/** Versuche pro Tag. */
export const FLAG_TRIES = 7;

/** Raster für den Farbvergleich (Flaggen sind 4:3). */
export const FLAG_GRID = { w: 64, h: 48 };

/** Tag 1 (für Flagge und Umriss des Tages). Der Tag wechselt wie beim Song des Tages um Mitternacht in Berlin. */
export const FLAG_START = "2026-10-24";
const DAY_MS = 24 * 60 * 60_000;

/** Laufende Nummer eines Tages (#1 = FLAG_START). */
export const flagNumber = (date: string) =>
  Math.round((Date.parse(date) - Date.parse(FLAG_START)) / DAY_MS) + 1;

/** Tag zu einer Nummer. */
export const flagDateOf = (number: number) =>
  new Date(Date.parse(FLAG_START) + (number - 1) * DAY_MS).toISOString().slice(0, 10);

/** Ein Tipp, vom Server ausgewertet. */
export interface FlagAttempt {
  /** Getipptes Land (ISO-Code). */
  code: string;
  right: boolean;
  /** Entfernung zum gesuchten Land in km (zwischen den Mittelpunkten). */
  km: number;
  /** Richtung zum gesuchten Land in Grad (0 = Norden, 90 = Osten). */
  bearing: number;
  /** Nähe in Prozent: 100 = dasselbe Land, 0 = andere Seite der Erde. */
  near: number;
  /**
   * Zellen des Rasters, an denen die getippte Flagge dieselbe Farbe hat – zeilenweise ein Bit je
   * Zelle, als Base64. Der Browser zeichnet dort die getippte Flagge (die gesuchte kennt er nicht).
   * Nur bei der Flagge des Tages.
   */
  mask?: string;
}

/** Wie alle an einem Tag abgeschnitten haben (anonyme Zähler vom Server). */
export interface FlagGlobal {
  /** Erraten beim 1., 2., … Versuch. */
  byStage: number[];
  lost: number;
}

/** Antwort auf POST /api/flag/play. */
export interface FlagTurn {
  /** Tag in deutscher Zeit („JJJJ-MM-TT“) – daran hängt der Fortschritt im Browser. */
  date: string;
  number: number;
  /** Nummer von heute – frühere Tage gibt es im Archiv. */
  today: number;
  /** Millisekunden bis zur nächsten Flagge des Tages. */
  nextIn: number;
  /** Die mitgeschickten Tipps, ausgewertet (leer, wenn sie zu einem anderen Tag gehörten). */
  attempts: FlagAttempt[];
  done: boolean;
  /** Lösung (ISO-Code), sobald die Runde vorbei ist. */
  solution?: string;
  global?: FlagGlobal;
}

/** Maske (Base64) in eine Liste von 0/1 je Zelle umwandeln. */
export function decodeMask(mask: string): Uint8Array {
  const bytes = Uint8Array.from(atob(mask), (char) => char.charCodeAt(0));
  const cells = new Uint8Array(FLAG_GRID.w * FLAG_GRID.h);
  for (let i = 0; i < cells.length; i++) cells[i] = (bytes[i >> 3] >> (7 - (i & 7))) & 1;
  return cells;
}
