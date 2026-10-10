import { presetId } from "../../../../shared/slf";
import type { Dictionary } from "../../lib/i18n/de";

/** Anzeigename einer Kategorie: vordefinierte übersetzt, eigene wie eingegeben. */
export function categoryLabel(t: Dictionary, category: string): string {
  const id = presetId(category);
  return id ? t.slf.presets[id] : category;
}
