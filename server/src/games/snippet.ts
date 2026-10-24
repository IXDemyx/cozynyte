/**
 * Song-Schnipsel: Einzelspieler-Songrätsel. Ein zufälliger bekannter Song, erst 0,1 s, nach jedem
 * Fehlversuch etwas mehr. Ohne Raum – jede Runde hat nur eine zufällige ID. Die Lösung bleibt bis
 * zum Ende auf dem Server; der Browser bekommt nur die Hörprobe (über /api/snippet/:id/audio).
 *
 * Song des Tages: für alle derselbe Song aus einer festen Liste bekannter Songs (dailySongs.ts),
 * Wechsel um Mitternacht deutscher Zeit. Sonst wie eine normale Runde; am Tag selbst zählt das
 * Ergebnis anonym für den Vergleich mit allen (snippetGlobal.ts). Frühere Tage gibt es im Archiv.
 */

import { randomUUID } from "node:crypto";
import {
  SNIPPET_STAGES,
  dailyDate,
  dailyDateOf,
  dailyNumber,
  type SnippetAttempt,
  type SnippetDaily,
  type SnippetResult,
  type SnippetSolution,
  type SnippetTrack,
  type SnippetTurn,
} from "../../../shared/snippet";
import type { Track } from "../../../shared/types";
import { DAILY_SONGS } from "../music/dailySongs";
import { searchTracks } from "../music/itunes";
import { cleanTitle, matchGuess, normalize } from "../music/match";
import { suggestTracks } from "../music/suggestions";
import { countResult, globalResult } from "./snippetGlobal";

interface SnippetGame {
  track: Track;
  attempts: SnippetAttempt[];
  done: boolean;
  createdAt: number;
  /** Song des Tages: welcher Tag, und ob das Ergebnis für den Vergleich zählt (nur am Tag selbst). */
  daily?: { date: string; count: boolean };
}

const games = new Map<string, SnippetGame>();
/** Runden verfallen nach einer Stunde; höchstens so viele gleichzeitig im Speicher. */
const GAME_TTL_MS = 60 * 60_000;
const MAX_GAMES = 5000;

/** Neue Runde mit einem zufälligen Song – nicht einem aus `recent` (zuletzt gespielte IDs). */
export async function newGame(category: string, recent: number[]): Promise<string> {
  let candidates: Track[] = [];
  // Zwei Anläufe: Vorschläge kommen von zwei zufälligen Interpreten, die schon gespielt sein können.
  for (let i = 0; i < 2 && !candidates.length; i++) {
    candidates = (await suggestTracks(category)).filter((t) => !recent.includes(t.id));
  }
  if (!candidates.length) candidates = await suggestTracks(category);
  const track = candidates[0];
  if (!track) throw new Error("no track");

  return addGame(track, []);
}

function addGame(track: Track, attempts: SnippetAttempt[], daily?: SnippetGame["daily"]): string {
  const id = randomUUID();
  const done = attempts.length >= SNIPPET_STAGES.length;
  games.set(id, { track, attempts, done, createdAt: Date.now(), daily });
  while (games.size > MAX_GAMES) games.delete(games.keys().next().value as string);
  return id;
}

/** Hörprobe der Runde (Adresse bei Apple) – nur für den Durchreicher im Server. */
export function previewOf(id: string): string | undefined {
  return games.get(id)?.track.previewUrl;
}

export function hasGame(id: string): boolean {
  return games.has(id);
}

export function toSnippetTrack(track: Track): SnippetTrack {
  return { id: track.id, title: track.title, artist: track.artist, artwork: track.artwork };
}

function solution(track: Track): SnippetSolution {
  return { ...toSnippetTrack(track), album: track.album, year: track.year };
}

/** Titel ohne Klammerzusätze, „feat.“ und „- Remastered 2011“ – zum Vergleich zweier Songs. */
const titleKey = (title: string) => normalize(cleanTitle(title).split(/\s+[-–—]\s+/)[0]);

/**
 * Gilt als derselbe Song, wenn Titel und Interpret passen – so zählen auch Single-, Album- und
 * Neuauflagen, die bei iTunes eigene IDs haben. Der Titel muss (bereinigt) genau stimmen, sonst
 * ginge „Human Nature“ als „Human“ durch.
 */
function judge(guess: Track, target: Track): SnippetResult {
  if (guess.id === target.id) return "right";
  const artist = matchGuess(guess.artist, target).artist === "exact";
  if (artist && titleKey(guess.title) === titleKey(target.title)) return "right";
  return artist ? "artist" : "wrong";
}

/**
 * Tipp (`guess`) oder Überspringen (ohne). null = Runde gibt es nicht oder ist schon vorbei.
 * `ip`: nur für das Limit beim Mitzählen des Songs des Tages.
 */
export function play(id: string, guess?: Track, ip = ""): SnippetTurn | null {
  const game = games.get(id);
  if (!game || game.done) return null;
  const attempt: SnippetAttempt = guess
    ? { result: judge(guess, game.track), guess: toSnippetTrack(guess) }
    : { result: "skip" };
  game.attempts.push(attempt);
  game.done = attempt.result === "right" || game.attempts.length >= SNIPPET_STAGES.length;
  const daily = game.daily;
  if (game.done && daily?.count) {
    countResult(daily.date, attempt.result === "right" ? game.attempts.length - 1 : null, ip);
  }
  return {
    attempt,
    done: game.done,
    solution: game.done ? solution(game.track) : undefined,
    global: game.done && daily ? globalResult(daily.date) : undefined,
  };
}

/** Zeit bis Mitternacht in Berlin – gesucht statt gerechnet, so stimmt es auch bei Zeitumstellung. */
export function untilNextDay(now: number): number {
  const today = dailyDate(now);
  let low = now;
  let high = now + 26 * 60 * 60_000;
  while (high - low > 1000) {
    const mid = Math.floor((low + high) / 2);
    if (dailyDate(mid) === today) low = mid;
    else high = mid;
  }
  return high - now;
}

/** Live-, Karaoke- und andere Fassungen nur, wenn es nichts anderes gibt. */
const ODD_VERSION = /\b(live|karaoke|instrumental|remix|acoustic|akustik|cover|tribute)\b/i;

const dailyTracks = new Map<string, Promise<Track>>();

/**
 * Song eines Tages aus der Liste suchen. Findet die Suche ihn nicht (oder ohne Hörprobe), gilt
 * der nächste Eintrag – für alle gleich, weil die Suche überall dasselbe liefert.
 */
function dailyTrack(date: string): Promise<Track> {
  let track = dailyTracks.get(date);
  if (!track) {
    track = findDailyTrack(date);
    dailyTracks.set(date, track);
    track.catch(() => dailyTracks.delete(date)); // Fehler (iTunes weg) nicht merken
    // Ein paar Tage merken – im Archiv werden auch ältere gespielt.
    while (dailyTracks.size > 30) dailyTracks.delete(dailyTracks.keys().next().value as string);
  }
  return track;
}

async function findDailyTrack(date: string): Promise<Track> {
  const n = DAILY_SONGS.length;
  const start = (((dailyNumber(date) - 1) % n) + n) % n;
  for (let i = 0; i < 5; i++) {
    const [artist, title] = DAILY_SONGS[(start + i) % n];
    const found = (await searchTracks(`${artist} ${title}`)).filter(
      (t) => titleKey(t.title) === titleKey(title) && matchGuess(artist, t).artist === "exact",
    );
    const track = found.find((t) => !ODD_VERSION.test(`${t.title} ${t.album}`)) ?? found[0];
    if (track) return track;
    console.warn(`Song des Tages: „${title}“ von ${artist} nicht gefunden – nehme den nächsten.`);
  }
  throw new Error("no daily track");
}

/**
 * Runde für den Song des Tages – heute oder (`number`) ein früherer Tag aus dem Archiv.
 * `progress`: was der Browser für diesen Tag schon gespielt hat (gilt nur, wenn es derselbe Tag
 * ist). Ist die Runde dort schon vorbei, kommen gleich Lösung und Vergleich mit.
 */
export async function newDaily(
  number: number | null,
  progress: { date: string; used: number; done: boolean },
): Promise<SnippetDaily> {
  const now = Date.now();
  const today = dailyNumber(dailyDate(now));
  const archive = number !== null && number >= 1 && number < today;
  const date = archive ? dailyDateOf(number) : dailyDate(now);
  const track = await dailyTrack(date);
  const same = progress.date === date;
  const used = same ? Math.min(SNIPPET_STAGES.length, Math.max(0, progress.used)) : 0;
  const done = same && (progress.done || used >= SNIPPET_STAGES.length);
  const attempts: SnippetAttempt[] = Array.from({ length: used }, () => ({ result: "skip" }));
  // Schon fertig gespielt: nicht noch einmal mitzählen.
  const id = addGame(track, attempts, { date, count: !archive && !done });
  if (done) games.get(id)!.done = true;
  return {
    id,
    date,
    number: dailyNumber(date),
    today,
    nextIn: untilNextDay(now),
    solution: done ? solution(track) : undefined,
    global: done ? globalResult(date) : undefined,
  };
}

// Alte Runden regelmäßig wegräumen.
setInterval(() => {
  const now = Date.now();
  for (const [id, game] of games) {
    if (now - game.createdAt > GAME_TTL_MS) games.delete(id);
  }
}, 5 * 60_000).unref();
