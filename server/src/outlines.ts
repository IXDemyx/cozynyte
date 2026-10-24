/** Landesumrisse (assets/outlines.json) als SVG – für das Länder-Quiz und den Umriss des Tages. */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets");
let outlines: Record<string, { w: number; h: number; d: string }> | undefined;

/** Umriss als fertiges SVG (Catppuccin-Blau mit dunkler Kante – passt zu hellem und dunklem Modus). */
export function outlineSvg(code: string): string | null {
  outlines ??= JSON.parse(readFileSync(path.join(assets, "outlines.json"), "utf8"));
  const shape = outlines?.[code];
  if (!shape) return null;
  const pad = 30;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${shape.w + 2 * pad} ` +
    `${shape.h + 2 * pad}"><path d="${shape.d}" fill="#89b4fa" stroke="#1e66f5" ` +
    `stroke-width="4" stroke-linejoin="round" fill-rule="evenodd"/></svg>`
  );
}
