/** Kniffel: Kategorien, erlaubte Werte, Wertung aus Würfeln und Summen. Von Client und Server genutzt. */

export const UPPER = ["ones", "twos", "threes", "fours", "fives", "sixes"] as const;
export const LOWER = [
  "threeKind",
  "fourKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "kniffel",
  "chance",
] as const;

export type UpperCategory = (typeof UPPER)[number];
export type Category = UpperCategory | (typeof LOWER)[number];
export const CATEGORIES: readonly Category[] = [...UPPER, ...LOWER];

export const FACE: Record<UpperCategory, number> = {
  ones: 1,
  twos: 2,
  threes: 3,
  fours: 4,
  fives: 5,
  sixes: 6,
};

/** Feste Punktzahlen der unteren Felder. */
export const FIXED: Partial<Record<Category, number>> = {
  fullHouse: 25,
  smallStraight: 30,
  largeStraight: 40,
  kniffel: 50,
};

export const BONUS_THRESHOLD = 63;
export const BONUS = 35;

export type Cells = Partial<Record<Category, number>>;

export interface KniffelColumn {
  id: string;
  name: string;
  /** Gesetzt, wenn die Spalte zu einem Spieler im Raum gehört. */
  playerId?: string;
}

export interface KniffelState {
  columns: KniffelColumn[];
  cells: Record<string, Cells>;
  /** Spalte, die gerade dran ist (null = alle fertig oder keine Spalten). */
  current: string | null;
  /** Raumeinstellung: Jeder schreibt nur in die eigene Spalte (Spalten ohne Handy bleiben offen). */
  locked: boolean;
  /** Digitaler Wurf des aktuellen Zugs; null, solange (noch) nicht digital gewürfelt wird. */
  roll: DigitalRoll | null;
  /** Letzter Eintrag, der sich rückgängig machen lässt (null = nichts zum Zurücknehmen). */
  lastEntry: { column: string; category: Category } | null;
}

export interface DigitalRoll {
  dice: number[];
  held: boolean[];
  /** Bereits gewürfelt in diesem Zug (0–3). */
  count: number;
}

export const MAX_ROLLS = 3;

/** Darf `playerId` in diese Spalte schreiben bzw. für sie würfeln? */
export function canEditColumn(
  sheet: KniffelState,
  column: KniffelColumn,
  playerId: string,
): boolean {
  return !sheet.locked || !column.playerId || column.playerId === playerId;
}

/** Nächste Spalte nach `fromId` (reihum), die noch freie Felder hat – zuletzt `fromId` selbst. */
export function nextTurn(sheet: KniffelState, fromId: string): string | null {
  const { columns } = sheet;
  const start = columns.findIndex((c) => c.id === fromId);
  for (let step = 1; step <= columns.length; step++) {
    const column = columns[(start + step + columns.length) % columns.length];
    const filled = CATEGORIES.filter((c) => sheet.cells[column.id]?.[c] !== undefined).length;
    if (filled < CATEGORIES.length) return column.id;
  }
  return null;
}

export function isUpper(category: Category): category is UpperCategory {
  return (UPPER as readonly string[]).includes(category);
}

/** Alle Werte, die in einem Feld überhaupt möglich sind (0 = gestrichen). */
export function allowedValues(category: Category): number[] {
  if (isUpper(category)) return [0, 1, 2, 3, 4, 5].map((n) => n * FACE[category]);
  const fixed = FIXED[category];
  if (fixed) return [0, fixed];
  return [0, ...Array.from({ length: 26 }, (_, i) => i + 5)]; // 5–30
}

/** Punkte, die fünf Würfel in einem Feld bringen würden. */
export function scoreDice(category: Category, dice: number[]): number {
  if (dice.length !== 5) return 0;
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dice) counts[d]++;
  const sum = dice.reduce((a, b) => a + b, 0);
  const max = Math.max(...counts);
  const has = (...faces: number[]) => faces.every((f) => counts[f] > 0);

  if (isUpper(category)) return counts[FACE[category]] * FACE[category];
  switch (category) {
    case "threeKind":
      return max >= 3 ? sum : 0;
    case "fourKind":
      return max >= 4 ? sum : 0;
    case "fullHouse":
      return counts.includes(3) && counts.includes(2) ? 25 : 0;
    case "smallStraight":
      return has(1, 2, 3, 4) || has(2, 3, 4, 5) || has(3, 4, 5, 6) ? 30 : 0;
    case "largeStraight":
      return has(1, 2, 3, 4, 5) || has(2, 3, 4, 5, 6) ? 40 : 0;
    case "kniffel":
      return max === 5 ? 50 : 0;
    case "chance":
      return sum;
  }
}

export interface Totals {
  upper: number;
  bonus: number;
  upperTotal: number;
  lower: number;
  total: number;
  filled: number;
}

export function totals(cells: Cells = {}): Totals {
  const sumOf = (list: readonly Category[]) => list.reduce((s, c) => s + (cells[c] ?? 0), 0);
  const upper = sumOf(UPPER);
  const bonus = upper >= BONUS_THRESHOLD ? BONUS : 0;
  const lower = sumOf(LOWER);
  const filled = CATEGORIES.filter((c) => cells[c] !== undefined).length;
  return { upper, bonus, upperTotal: upper + bonus, lower, total: upper + bonus + lower, filled };
}
