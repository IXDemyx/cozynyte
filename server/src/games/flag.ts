/**
 * Flagge des Tages: Einzelspieler-Flaggenrätsel, für alle dieselbe Flagge, Wechsel um Mitternacht
 * deutscher Zeit (wie beim Song des Tages). Ohne Runde auf dem Server: Der Browser schickt jedes
 * Mal alle bisherigen Tipps mit, der Server wertet sie neu aus. Die Lösung verrät er erst, wenn
 * die Runde vorbei ist – bis dahin nur, wo die getippten Flaggen farblich passen.
 *
 * Farbvergleich auf einem Raster (assets/flag-grids.json, je Zelle eine Farbe aus einer kleinen
 * Palette, vorab aus den Flaggen berechnet), Entfernung zwischen den Mittelpunkten der Länder
 * (assets/flag-centers.json).
 *
 * Umriss des Tages: dieselbe Auswertung ohne Farbvergleich, eigene Länderliste und eigene Zähler.
 * Den Umriss gibt es über die Tag-Nummer (outlineOf), die Adresse verrät das Land nicht.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COUNTRY_BY_CODE } from "../../../shared/countries";
import {
  FLAG_GRID,
  FLAG_TRIES,
  flagDateOf,
  flagNumber,
  type DailyKind,
  type FlagAttempt,
  type FlagTurn,
} from "../../../shared/flag";
import { dailyDate } from "../../../shared/snippet";
import { DAILY_FLAGS } from "./dailyFlags";
import { dailyCounter } from "./dailyGlobal";
import { DAILY_OUTLINES } from "./dailyOutlines";
import { untilNextDay } from "./snippet";

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets");

const counters = {
  flag: dailyCounter("flag-daily.json", FLAG_TRIES, "Flagge des Tages"),
  outline: dailyCounter("outline-daily.json", FLAG_TRIES, "Umriss des Tages"),
};
const lists: Record<DailyKind, string[]> = { flag: DAILY_FLAGS, outline: DAILY_OUTLINES };

/** Raster je Land: Lauflängen „<Farbe><Anzahl zur Basis 36>“, durch Kommas getrennt. */
const grids = new Map<string, Uint8Array>(
  Object.entries(
    (
      JSON.parse(readFileSync(path.join(assets, "flag-grids.json"), "utf8")) as {
        grids: Record<string, string>;
      }
    ).grids,
  ).map(([code, runs]) => {
    const cells = new Uint8Array(FLAG_GRID.w * FLAG_GRID.h);
    let at = 0;
    for (const run of runs.split(",")) {
      const length = parseInt(run.slice(1), 36);
      cells.fill(Number(run[0]), at, at + length);
      at += length;
    }
    return [code, cells];
  }),
);

/** Mittelpunkt je Land als [Breite, Länge]. */
const centers = JSON.parse(readFileSync(path.join(assets, "flag-centers.json"), "utf8")) as Record<
  string,
  [number, number]
>;

/** Gibt es zu dem Land eine Flagge zum Tippen? */
export const isFlagCountry = (code: string) => grids.has(code) && COUNTRY_BY_CODE.has(code);

/** Land eines Tages aus der festen Liste. */
function targetOf(kind: DailyKind, date: string): string {
  const list = lists[kind];
  const n = list.length;
  return list[(((flagNumber(date) - 1) % n) + n) % n];
}

/** Land des Umrisses zu einer Tag-Nummer – nur bis heute (für das Bild), sonst null. */
export function outlineOf(number: number): string | null {
  const today = flagNumber(dailyDate(Date.now()));
  if (!Number.isInteger(number) || number < 1 || number > today) return null;
  return targetOf("outline", flagDateOf(number));
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const EARTH_KM = 6371;
const HALF_WAY_KM = Math.PI * EARTH_KM;

/** Entfernung (Großkreis) und Richtung von einem Punkt zum anderen. */
function distance(from: [number, number], to: [number, number]) {
  const [lat1, lon1] = from.map(rad);
  const [lat2, lon2] = to.map(rad);
  const h =
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
  const km = 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return { km, bearing };
}

/** Farbvergleich: ein Bit je Zelle, an der beide Flaggen dieselbe Farbe haben (Base64). */
function colourMask(code: string, target: string): string {
  const guess = grids.get(code)!;
  const goal = grids.get(target)!;
  const bits = new Uint8Array(Math.ceil(goal.length / 8));
  for (let i = 0; i < goal.length; i++) {
    if (guess[i] === goal[i]) bits[i >> 3] |= 1 << (7 - (i & 7));
  }
  return Buffer.from(bits).toString("base64");
}

function judge(kind: DailyKind, code: string, target: string): FlagAttempt {
  const right = code === target;
  const { km, bearing } = right
    ? { km: 0, bearing: 0 }
    : distance(centers[code] ?? [0, 0], centers[target] ?? [0, 0]);
  return {
    code,
    right,
    km: Math.round(km),
    bearing: Math.round(bearing),
    near: right ? 100 : Math.max(0, Math.min(99, Math.round((1 - km / HALF_WAY_KM) * 100))),
    mask: kind === "flag" ? colourMask(code, target) : undefined,
  };
}

/**
 * Tipps eines Tages auswerten (Flagge oder Umriss) – heute oder (`number`) ein früherer Tag aus dem Archiv.
 * `date`: Tag, zu dem die Tipps im Browser gehören (gelten nur, wenn es derselbe Tag ist).
 * `giveUp`: aufgegeben, dann gibt es die Lösung auch vor dem letzten Versuch. `count`: Die Runde
 * ist mit diesem Tipp gerade zu Ende gegangen – nur dann zählt sie für den Vergleich (und nur
 * heute, nicht im Archiv).
 */
export function playFlag(
  kind: DailyKind,
  number: number | null,
  request: { date: string; guesses: string[]; giveUp: boolean; count: boolean },
  ip: string,
): FlagTurn {
  const now = Date.now();
  const today = flagNumber(dailyDate(now));
  const archive = number !== null && number >= 1 && number < today;
  const date = archive ? flagDateOf(number) : dailyDate(now);
  const target = targetOf(kind, date);

  const guesses = request.date === date ? request.guesses : [];
  const attempts: FlagAttempt[] = [];
  for (const code of guesses) {
    if (attempts.length >= FLAG_TRIES || attempts.at(-1)?.right) break;
    if (!isFlagCountry(code) || attempts.some((a) => a.code === code)) continue;
    attempts.push(judge(kind, code, target));
  }
  const won = attempts.at(-1)?.right === true;
  const done = won || attempts.length >= FLAG_TRIES || (request.giveUp && request.date === date);
  if (done && request.count && !archive) {
    counters[kind].countResult(date, won ? attempts.length - 1 : null, ip);
  }
  return {
    date,
    number: flagNumber(date),
    today,
    nextIn: untilNextDay(now),
    attempts,
    done,
    solution: done ? target : undefined,
    global: done ? counters[kind].globalResult(date) : undefined,
  };
}
