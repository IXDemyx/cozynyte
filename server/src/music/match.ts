/** Unscharfer Vergleich von Tipps mit Titel / Interpret. */

function base(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/&/g, " and ");
}

function squash(s: string): string {
  return s.replace(/[^a-z0-9]/g, "");
}

export function normalize(s: string): string {
  return squash(base(s));
}

/** Titel ohne Klammerzusätze, "feat." und "- Remastered"-Anhänge. */
export function cleanTitle(title: string): string {
  const cleaned = title
    .replace(/\s*[([][^)\]]*[)\]]/g, "")
    .replace(/\s+(feat\.?|ft\.?|featuring)\s.*$/i, "")
    .trim();
  return cleaned || title;
}

function titleVariants(title: string): string[] {
  const clean = cleanTitle(title);
  const beforeDash = clean.split(/\s+[-–—]\s+/)[0];
  return unique([title, clean, beforeDash].map(normalize));
}

function artistVariants(artist: string): string[] {
  const parts = artist.split(/\s*(?:,|&|\bfeat\.?|\bft\.?|\bx\b|\bund\b|\band\b|\bvs\.?)\s*/i);
  const all = [artist, ...parts];
  return unique(
    all.flatMap((a) => {
      const n = normalize(a);
      return n.startsWith("the") && n.length > 5 ? [n, n.slice(3)] : [n];
    }),
  );
}

function unique(list: string[]): string[] {
  return [...new Set(list.filter((s) => s.length > 0))];
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

export type MatchResult = "exact" | "close" | "none";

function compare(guess: string, targets: string[]): MatchResult {
  let best: MatchResult = "none";
  for (const t of targets) {
    if (guess === t) return "exact";
    // "Interpret - Titel" in einem Tipp
    if (t.length >= 4 && guess.includes(t)) return "exact";
    const d = levenshtein(guess, t);
    const tolerance = t.length <= 3 ? 0 : Math.floor(t.length / 6);
    if (d <= tolerance) return "exact";
    if (t.length >= 4 && d <= Math.max(2, Math.floor(t.length / 3))) best = "close";
  }
  return best;
}

export function matchGuess(
  guess: string,
  track: { title: string; artist: string },
): { title: MatchResult; artist: MatchResult } {
  const g = normalize(guess);
  if (!g) return { title: "none", artist: "none" };
  return {
    title: compare(g, titleVariants(track.title)),
    artist: compare(g, artistVariants(track.artist)),
  };
}

const LETTER = /[\p{L}\p{N}]/gu;

/** Anzahl der Zeichen, die in der Maske verdeckt werden. */
export function countLetters(text: string): number {
  return (text.match(LETTER) ?? []).length;
}

/** "Hey Jude" -> "___ ____"; aufgedeckte Positionen (als Hinweis) bleiben lesbar. */
export function maskText(text: string, revealed: ReadonlySet<number> = new Set()): string {
  let index = 0;
  return text.replace(LETTER, (char) => (revealed.has(index++) ? char : "_"));
}

export function maskTitle(title: string, revealed?: ReadonlySet<number>): string {
  return maskText(cleanTitle(title), revealed);
}

/** Montagsmaler: Tipp mit einem Begriff vergleichen (gleiche Toleranz wie bei Songtiteln). */
export function matchWord(guess: string, word: string): MatchResult {
  const g = normalize(guess);
  const w = normalize(word);
  if (!g || !w) return "none";
  return compare(g, [w]);
}
