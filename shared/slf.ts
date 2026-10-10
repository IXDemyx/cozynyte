/** Stadt Land Fluss: Kategorien, Buchstaben, Prüfung der Antworten und Punkte. Von Client und Server genutzt. */

/** Vordefinierte Kategorien – gespeichert als „@id" und je nach Sprache übersetzt. */
export const SLF_PRESETS = [
  "city",
  "country",
  "river",
  "name",
  "job",
  "animal",
  "plant",
  "food",
  "brand",
  "celebrity",
  "sport",
  "movie",
  "music",
  "thing",
] as const;

export type SlfPreset = (typeof SLF_PRESETS)[number];

export const DEFAULT_CATEGORIES = ["@city", "@country", "@river", "@name", "@job", "@animal"];
export const MIN_CATEGORIES = 3;
export const MAX_CATEGORIES = 10;
export const MAX_CATEGORY_LENGTH = 24;
export const MAX_ANSWER_LENGTH = 40;

export const SLF_ROUNDS = [3, 5, 8, 10];
export const SLF_SECONDS = [60, 90, 120, 180];

/** Aufsagen: Sagt niemand Stopp, wird nach dieser Zeit automatisch gestoppt. */
export const RECITE_TIMEOUT_MS = 20_000;

/** Countdown „3, 2, 1" vor jeder Schreibrunde – damit alle bereit sind. */
export const COUNTDOWN_MS = 3000;

/** So lange rattert der Buchstabe im Zufallsmodus, bevor er einrastet (nach dem Countdown). */
export const ROLL_MS = 2200;

/** Nach „Stopp!" haben die anderen noch so lange, um ihr Wort zu Ende zu tippen. */
export const STOP_GRACE_MS = 5000;

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
/** Schwere Buchstaben, die man ausschließen kann. */
export const HARD_LETTERS = ["Q", "X", "Y"];

/** Vordefinierte Kategorie? Liefert ihre ID, sonst undefined. */
export function presetId(category: string): SlfPreset | undefined {
  const id = category.startsWith("@") ? category.slice(1) : "";
  return (SLF_PRESETS as readonly string[]).includes(id) ? (id as SlfPreset) : undefined;
}

/**
 * Antwort zum Vergleichen: klein, ohne Akzente und doppelte Leerzeichen, ß → ss.
 * „  Ägypten" und „agypten" gelten so als dieselbe Antwort und beginnen beide mit A.
 */
export function normalizeAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ");
}

export function startsWithLetter(text: string, letter: string): boolean {
  const normalized = normalizeAnswer(text);
  return normalized.length > 0 && normalized[0] === letter.toLowerCase();
}

/**
 * Bewertung einer Antwort:
 * ok 10 · duplicate 5 (jemand hat dasselbe) · solo 20 (einzige gültige Antwort der Kategorie)
 * · empty / letter (falscher Anfangsbuchstabe) / voted (per Mehrheit abgelehnt) 0.
 */
export type SlfVerdict = "ok" | "duplicate" | "solo" | "empty" | "letter" | "voted";

export const POINTS: Record<SlfVerdict, number> = {
  ok: 10,
  duplicate: 5,
  solo: 20,
  empty: 0,
  letter: 0,
  voted: 0,
};

export interface SlfEntry {
  playerId: string;
  text: string;
  /** Anzahl der Gegenstimmen. */
  votes: number;
}

/**
 * Bewertet alle Antworten einer Kategorie. `voters` = wie viele andere mitstimmen können;
 * eine Antwort fällt bei mehr als der Hälfte Gegenstimmen durch.
 */
export function judgeCategory(
  entries: SlfEntry[],
  letter: string,
  voters: number,
): Map<string, SlfVerdict> {
  const verdicts = new Map<string, SlfVerdict>();
  const valid: SlfEntry[] = [];
  for (const entry of entries) {
    if (!entry.text.trim()) verdicts.set(entry.playerId, "empty");
    else if (!startsWithLetter(entry.text, letter)) verdicts.set(entry.playerId, "letter");
    else if (voters > 0 && entry.votes * 2 > voters) verdicts.set(entry.playerId, "voted");
    else valid.push(entry);
  }
  const counts = new Map<string, number>();
  for (const entry of valid) {
    const key = normalizeAnswer(entry.text);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const entry of valid) {
    const verdict =
      valid.length === 1
        ? "solo"
        : (counts.get(normalizeAnswer(entry.text)) ?? 0) > 1
          ? "duplicate"
          : "ok";
    verdicts.set(entry.playerId, verdict);
  }
  return verdicts;
}
