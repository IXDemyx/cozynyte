import {
  CANVAS_BACKGROUND,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DRAW_COLORS,
  DRAW_SIZES,
  type DrawOp,
} from "../../../../shared/draw";

/**
 * Zeichnen auf die Leinwand. Die Leinwand hat bei allen dieselbe feste Auflösung (logisch
 * 800×600, intern 1,5-fach für scharfe Linien) und wird per CSS skaliert – so sieht jede
 * Zeichnung überall gleich aus, auch das Füllen.
 */
export const SCALE = 1.5;
export const PIXEL_WIDTH = CANVAS_WIDTH * SCALE;
export const PIXEL_HEIGHT = CANVAS_HEIGHT * SCALE;

export const colorOf = (index: number) => (index < 0 ? CANVAS_BACKGROUND : DRAW_COLORS[index]);

export function clearCanvas(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = CANVAS_BACKGROUND;
  ctx.fillRect(0, 0, PIXEL_WIDTH, PIXEL_HEIGHT);
}

/** Alles neu zeichnen (nach Rückgängig, Neuladen oder Beitreten). */
export function renderAll(ctx: CanvasRenderingContext2D, ops: DrawOp[]) {
  clearCanvas(ctx);
  for (const op of ops) renderOp(ctx, op);
}

export function renderOp(ctx: CanvasRenderingContext2D, op: DrawOp, from = 0) {
  if (op.t === "clear") return clearCanvas(ctx);
  if (op.t === "fill") return floodFill(ctx, op.x, op.y, colorOf(op.c));
  renderLine(ctx, op, from);
}

/**
 * Strich ab dem Punkt mit Index `from` zeichnen (in x,y-Paaren gezählt). Beim Weitermalen
 * kommt so nur das neue Stück dazu – verbunden mit dem letzten schon gezeichneten Punkt.
 */
function renderLine(
  ctx: CanvasRenderingContext2D,
  op: Extract<DrawOp, { t: "line" }>,
  from: number,
) {
  const p = op.p;
  const count = p.length / 2;
  if (count === 0 || from >= count) return;
  ctx.strokeStyle = ctx.fillStyle = colorOf(op.c);
  ctx.lineWidth = DRAW_SIZES[op.s] * SCALE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Einzelner Punkt (Klick ohne Bewegung): ein runder Tupfer.
  if (count === 1) {
    ctx.beginPath();
    ctx.arc(p[0] * SCALE, p[1] * SCALE, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const start = Math.max(0, from - 1);
  ctx.beginPath();
  ctx.moveTo(p[start * 2] * SCALE, p[start * 2 + 1] * SCALE);
  for (let i = start + 1; i < count; i++) ctx.lineTo(p[i * 2] * SCALE, p[i * 2 + 1] * SCALE);
  ctx.stroke();
}

/** Hex-Farbe als RGB. */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Füllen wie im Malprogramm (Scanline). Mit etwas Toleranz, damit die weichen Kanten der
 * Striche nicht als helle Lücken stehen bleiben.
 */
function floodFill(ctx: CanvasRenderingContext2D, lx: number, ly: number, hex: string) {
  const width = PIXEL_WIDTH;
  const height = PIXEL_HEIGHT;
  const x0 = Math.min(width - 1, Math.max(0, Math.floor(lx * SCALE)));
  const y0 = Math.min(height - 1, Math.max(0, Math.floor(ly * SCALE)));
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const [fr, fg, fb] = rgb(hex);
  const at = (y0 * width + x0) * 4;
  const [sr, sg, sb] = [data[at], data[at + 1], data[at + 2]];
  if (Math.abs(sr - fr) + Math.abs(sg - fg) + Math.abs(sb - fb) < 8) return;

  const TOLERANCE = 96;
  const matches = (i: number) =>
    Math.abs(data[i] - sr) + Math.abs(data[i + 1] - sg) + Math.abs(data[i + 2] - sb) <= TOLERANCE;
  const seen = new Uint8Array(width * height);
  const stack = [x0, y0];

  while (stack.length) {
    const y = stack.pop()!;
    let x = stack.pop()!;
    // Nach links bis zum Rand der Fläche, dann nach rechts füllen.
    while (x > 0 && !seen[y * width + x - 1] && matches((y * width + x - 1) * 4)) x--;
    let up = false;
    let down = false;
    for (; x < width; x++) {
      const k = y * width + x;
      if (seen[k] || !matches(k * 4)) break;
      seen[k] = 1;
      const i = k * 4;
      data[i] = fr;
      data[i + 1] = fg;
      data[i + 2] = fb;
      data[i + 3] = 255;
      for (const [dy, flag] of [
        [-1, up],
        [1, down],
      ] as const) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        const free = !seen[ny * width + x] && matches((ny * width + x) * 4);
        if (free && !flag) {
          stack.push(x, ny);
          if (dy < 0) up = true;
          else down = true;
        } else if (!free) {
          if (dy < 0) up = false;
          else down = false;
        }
      }
    }
  }

  // Ein Pixel Rand dazu, damit an Strichkanten keine Säume bleiben.
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const k = y * width + x;
      if (seen[k]) continue;
      if (seen[k - 1] || seen[k + 1] || seen[k - width] || seen[k + width]) {
        const i = k * 4;
        // Nur helle Kantenpixel anpassen – dunkle Linien bleiben unangetastet.
        const close =
          Math.abs(data[i] - sr) + Math.abs(data[i + 1] - sg) + Math.abs(data[i + 2] - sb) <= 220;
        if (close) {
          data[i] = fr;
          data[i + 1] = fg;
          data[i + 2] = fb;
        }
      }
    }
  }
  ctx.putImageData(image, 0, 0);
}
