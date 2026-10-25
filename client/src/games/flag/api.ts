/** Flagge und Umriss des Tages: Anfragen an den Server (HTTP unter /api/flag, ohne Raum). */

import type { DailyKind, FlagTurn } from "../../../../shared/flag";

type Reply<T> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Tipps eines Tages auswerten lassen – heute oder (`number`) ein früherer Tag aus dem Archiv.
 * `date` und `guesses`: Stand im Browser. `count`: Die Runde endet mit diesem Tipp (zählt dann
 * für den Vergleich mit allen).
 */
export async function playFlag(body: {
  kind: DailyKind;
  number: number | null;
  date: string;
  guesses: string[];
  giveUp: boolean;
  count: boolean;
}): Promise<Reply<FlagTurn>> {
  try {
    const res = await fetch("/api/flag/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as Reply<FlagTurn>;
  } catch {
    return { ok: false, error: "server_unreachable" };
  }
}

export const flagImage = (code: string) => `/api/flag/img/${code}.svg`;

export const flagGrid = (code: string) => `/api/flag/grid/${code}`;

/** Umriss des Tages Nr. `number` (das Land steht nicht in der Adresse). */
export const outlineImage = (number: number) => `/api/flag/outline/${number}.svg`;
