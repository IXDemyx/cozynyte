/**
 * Song des Tages: wie alle an einem Tag abgeschnitten haben (erraten bei Stufe 1 … 7, nicht
 * erraten). Zählen und Speichern wie bei allen Tagesrätseln in dailyGlobal.ts.
 */

import { SNIPPET_STAGES } from "../../../shared/snippet";
import { dailyCounter } from "./dailyGlobal";

export const { globalResult, countResult } = dailyCounter(
  "snippet-daily.json",
  SNIPPET_STAGES.length,
  "Song des Tages",
);
