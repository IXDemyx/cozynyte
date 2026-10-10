/**
 * Montagsmaler (Draw & Guess): Zeichenbefehle, Farben, Stärken und Einstellungen.
 * Von Client und Server genutzt.
 */

/** Logische Größe der Zeichenfläche (4:3). Alle Koordinaten beziehen sich darauf. */
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

/** Feste Farbpalette – Befehle enthalten nur den Index, nicht die Farbe selbst. */
export const DRAW_COLORS = [
  "#111111",
  "#ffffff",
  "#9ca3af",
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#8b5a2b",
] as const;

/** Hintergrund der Zeichenfläche – der Radierer malt in dieser Farbe. */
export const CANVAS_BACKGROUND = "#ffffff";

/** Strichstärken in logischen Pixeln. */
export const DRAW_SIZES = [4, 9, 18, 34] as const;

/**
 * Ein Zeichenbefehl. Striche werden beim Malen stückweise verschickt: Befehle mit derselben `id`
 * gehören zum selben Strich und hängen ihre Punkte an. `c = -1` ist der Radierer.
 */
export type DrawOp =
  | { id: number; t: "line"; c: number; s: number; p: number[] }
  | { id: number; t: "fill"; c: number; x: number; y: number }
  | { id: number; t: "clear" };

export const DRAW_ROUNDS = [2, 3, 4, 5];
export const DRAW_SECONDS = [60, 80, 120];

/** So lange hat der Zeichner, um einen der drei Begriffe zu wählen. */
export const CHOOSE_MS = 15_000;
/** So lange steht die Auflösung eines Zugs, bevor der Nächste dran ist. */
export const TURN_REVEAL_MS = 5_000;

/** „Eigene Runde“: so viele Begriffe steuert jeder bei. */
export const DRAW_WORDS_PER_PLAYER = [3, 5, 8];
export const MAX_WORD_LENGTH = 30;
/** Höchstens so viele Befehle pro Zug – schützt Server und Clients vor Endlos-Strichen. */
export const MAX_OPS = 4000;
/** Höchstens so viele Koordinaten (x und y einzeln gezählt) pro Strich. */
export const MAX_POINTS = 4000;

export type DrawStage = "choosing" | "drawing" | "reveal";

/** Bereinigt einen Befehl vom Client; null = ungültig. */
export function cleanOp(raw: unknown): DrawOp | null {
  if (!raw || typeof raw !== "object") return null;
  const op = raw as Record<string, unknown>;
  const id = Number(op.id);
  if (!Number.isInteger(id) || id < 0) return null;
  const inX = (v: unknown) => Math.min(CANVAS_WIDTH, Math.max(0, Math.round(Number(v) || 0)));
  const inY = (v: unknown) => Math.min(CANVAS_HEIGHT, Math.max(0, Math.round(Number(v) || 0)));
  const color = Number(op.c);
  const validColor = Number.isInteger(color) && color >= -1 && color < DRAW_COLORS.length;

  if (op.t === "clear") return { id, t: "clear" };
  if (op.t === "fill") {
    if (!validColor || color < 0) return null;
    return { id, t: "fill", c: color, x: inX(op.x), y: inY(op.y) };
  }
  if (op.t === "line") {
    const size = Number(op.s);
    if (!validColor || !Number.isInteger(size) || size < 0 || size >= DRAW_SIZES.length)
      return null;
    if (!Array.isArray(op.p) || op.p.length < 2 || op.p.length > MAX_POINTS) return null;
    const points = op.p.slice(0, op.p.length - (op.p.length % 2));
    return { id, t: "line", c: color, s: size, p: points.map((v, i) => (i % 2 ? inY(v) : inX(v))) };
  }
  return null;
}

/** Fügt Befehle in eine Liste ein: gleiche ID bei einem Strich = Punkte anhängen. */
export function applyOps(list: DrawOp[], ops: DrawOp[]): void {
  for (const op of ops) {
    const last = list[list.length - 1];
    if (op.t === "line" && last?.t === "line" && last.id === op.id) {
      if (last.p.length + op.p.length <= MAX_POINTS) last.p.push(...op.p);
    } else if (!list.some((o) => o.id === op.id)) {
      list.push(op.t === "line" ? { ...op, p: [...op.p] } : op);
    }
  }
}
