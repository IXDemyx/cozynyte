/**
 * Song-Schnipsel: Einzelspieler-Songrätsel. Ein zufälliger bekannter Song, erst 0,1 s, nach jedem
 * Fehlversuch etwas mehr. Ohne Raum – jede Runde hat nur eine zufällige ID. Die Lösung bleibt bis
 * zum Ende auf dem Server; der Browser bekommt nur die Hörprobe (über /api/snippet/:id/audio).
 */

import { randomUUID } from "node:crypto";
import {
  SNIPPET_STAGES,
  type SnippetAttempt,
  type SnippetResult,
  type SnippetSolution,
  type SnippetTrack,
  type SnippetTurn,
} from "../../../shared/snippet";
import type { Track } from "../../../shared/types";
import { cleanTitle, matchGuess, normalize } from "../music/match";
import { suggestTracks } from "../music/suggestions";

interface SnippetGame {
  track: Track;
  attempts: SnippetAttempt[];
  done: boolean;
  createdAt: number;
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

  const id = randomUUID();
  games.set(id, { track, attempts: [], done: false, createdAt: Date.now() });
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

/** Tipp (`guess`) oder Überspringen (ohne). null = Runde gibt es nicht oder ist schon vorbei. */
export function play(id: string, guess?: Track): SnippetTurn | null {
  const game = games.get(id);
  if (!game || game.done) return null;
  const attempt: SnippetAttempt = guess
    ? { result: judge(guess, game.track), guess: toSnippetTrack(guess) }
    : { result: "skip" };
  game.attempts.push(attempt);
  game.done = attempt.result === "right" || game.attempts.length >= SNIPPET_STAGES.length;
  return {
    attempt,
    done: game.done,
    solution: game.done ? solution(game.track) : undefined,
  };
}

// Alte Runden regelmäßig wegräumen.
setInterval(() => {
  const now = Date.now();
  for (const [id, game] of games) {
    if (now - game.createdAt > GAME_TTL_MS) games.delete(id);
  }
}, 5 * 60_000).unref();
