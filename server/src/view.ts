/** Was jeder Spieler vom Raum sehen darf – und das Verschicken an alle. */

import type { DrawView, RoomState, SlfView, TimelineCard, Track } from "../../shared/types";
import { DEV_TOOLS } from "./config";
import { canPlace, hasAnswered, opened } from "./games/music";
import { judgeRound } from "./games/slf";
import { cleanTitle, maskText } from "./music/match";
import { io } from "./server";
import type { Player, Room } from "./state";

function card(track: Track, wrong = false): TimelineCard {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    artwork: track.artwork,
    year: track.year ?? 0,
    ...(wrong ? { wrong } : {}),
  };
}

/** Zeitleiste eines Spielers; im Endstand mit den falsch gelegten Karten an ihrer Stelle. */
function timelineView(player: Player, withMisses: boolean): TimelineCard[] {
  const missesBefore = (id: number | null) =>
    withMisses
      ? player.misses.filter((m) => m.beforeId === id).map((m) => card(m.track, true))
      : [];
  return [
    ...player.timeline.flatMap((track) => [...missesBefore(track.id), card(track)]),
    ...missesBefore(null),
  ];
}

/** Stadt Land Fluss: beim Schreiben nur Füllstände der anderen, in der Auswertung alles. */
function slfView(room: Room, playerId: string): SlfView {
  const game = room.slf!;
  const writing = room.phase === "round";
  const filled = Object.fromEntries(
    [...room.players.keys()].map((id) => [
      id,
      (game.answers.get(id) ?? []).filter((a) => a.trim()).length,
    ]),
  );
  return {
    round: game.round,
    rounds: room.settings.slfRounds,
    letter: game.letter,
    categories: game.categories,
    endsAt: game.endsAt,
    durationMs: game.endsAt - game.startsAt,
    countdownEndsAt: game.countdownEndsAt,
    startsAt: game.startsAt,
    stopAt: game.stopAt,
    stoppedBy: game.stoppedBy,
    filled,
    mine: game.answers.get(playerId) ?? [],
    ...(game.drawing
      ? {
          drawing: {
            reciterId: game.drawing.reciterId,
            stopperId: game.drawing.stopperId,
            // Den Buchstaben kennt nur, wer gerade im Kopf das Alphabet durchgeht.
            ...(game.drawing.reciterId === playerId && game.drawing.position >= 0
              ? { current: game.drawing.pool[game.drawing.position] }
              : {}),
          },
        }
      : {}),
    ...(writing ? {} : judgeRound(room)),
  };
}

/** Montagsmaler: den Begriff kennen nur der Zeichner und wer ihn erraten hat – bis zur Auflösung. */
function drawView(room: Room, playerId: string): DrawView {
  const game = room.draw!;
  const knows =
    game.stage === "reveal" || game.drawerId === playerId || game.guessed.includes(playerId);
  return {
    round: Math.min(game.round, room.settings.drawRounds),
    rounds: room.settings.drawRounds,
    turn: game.turn,
    stage: game.stage,
    drawerId: game.drawerId,
    endsAt: game.endsAt,
    durationMs: game.endsAt - game.startedAt,
    ...(game.stage === "choosing" && game.drawerId === playerId ? { choices: game.choices } : {}),
    ...(knows && game.word ? { word: game.word } : {}),
    mask: game.word ? maskText(game.word, opened(game.hint)) : "",
    guessed: game.guessed,
    ...(game.stage === "reveal" ? { gains: Object.fromEntries(game.gains) } : {}),
    feed: game.feed.slice(-40),
  };
}

/** Sicht eines Spielers auf den Raum. Lösungen verlassen den Server nur, wenn er sie kennen darf. */
export function view(room: Room, playerId: string): RoomState {
  const { round } = room;
  const me = room.players.get(playerId);
  const state: RoomState = {
    code: room.code,
    game: room.game,
    phase: room.phase,
    hostId: room.hostId,
    you: playerId,
    settings: room.settings,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      connected: Boolean(p.socketId),
      picked: p.picks.length,
      gotTitle: round?.got.get(p.id)?.title ?? false,
      gotArtist: round?.got.get(p.id)?.artist ?? false,
      answered: round ? hasAnswered(room, round, p.id) : false,
      cards: p.timeline.length,
      bot: Boolean(p.bot),
    })),
    myPicks: room.phase === "picking" ? (me?.picks ?? []) : [],
    kniffel: room.kniffel,
    chat: room.chat,
    devTools: DEV_TOOLS,
    timelines:
      room.game === "timeline" && room.phase !== "lobby" && room.phase !== "picking"
        ? Object.fromEntries(
            [...room.players.values()].map((p) => [
              p.id,
              timelineView(p, room.phase === "finished"),
            ]),
          )
        : undefined,
    serverNow: Date.now(),
  };

  if (room.slf && (room.phase === "round" || room.phase === "reveal")) {
    state.slf = slfView(room, playerId);
  }

  if (room.draw && room.phase === "round") state.draw = drawView(room, playerId);

  if (room.phase === "round" && round) {
    const isPicker = round.pickerId === playerId;
    const mine = round.got.get(playerId);
    state.round = {
      index: room.roundIndex,
      total: room.queue.length,
      previewUrl: round.track.previewUrl,
      endsAt: round.endsAt,
      durationMs: round.endsAt - round.startedAt,
      youArePicker: isPicker,
      ...(room.game === "timeline"
        ? {
            activeId: round.activeId,
            canPlace: canPlace(room, round, playerId),
            yourPosition: round.placements.get(playerId),
            activePosition: round.activeId ? round.placements.get(round.activeId) : undefined,
          }
        : {}),
      ...(room.game === "year" || room.game === "timeline"
        ? {
            song:
              room.settings.showSong || isPicker
                ? { title: round.track.title, artist: round.track.artist }
                : undefined,
            yourYear: room.game === "year" ? round.years.get(playerId) : undefined,
            answerYear: isPicker ? round.track.year : undefined,
          }
        : {}),
      // Wer etwas schon weiß (erraten oder selbst gewählt), sieht es im Klartext.
      titleMask:
        isPicker || mine?.title
          ? cleanTitle(round.track.title)
          : maskText(cleanTitle(round.track.title), opened(round.titleHint)),
      artistMask:
        isPicker || mine?.artist
          ? round.track.artist
          : maskText(round.track.artist, opened(round.artistHint)),
      feed: round.feed.slice(-40),
    };
  }

  if (room.phase === "reveal" && round) {
    state.reveal = {
      index: room.roundIndex,
      total: room.queue.length,
      track: round.track,
      pickerId: round.pickerId,
      gains: Object.fromEntries(round.gains),
      yearGuesses: room.game === "year" ? Object.fromEntries(round.years) : undefined,
      placements: room.game === "timeline" ? Object.fromEntries(round.results) : undefined,
      nextAt: room.revealNextAt,
      isLast: room.timelineOver || room.roundIndex >= room.queue.length - 1,
    };
  }

  return state;
}

/** Nur einem Spieler seinen neuen Stand schicken – z. B. beim Aufsagen, damit die anderen nichts merken. */
export function sendTo(room: Room, playerId: string) {
  const player = room.players.get(playerId);
  if (player?.socketId && !player.bot)
    io.to(player.socketId).emit("room:state", view(room, playerId));
}

/** Wird nach jedem Verschicken aufgerufen (z. B. damit Testbots reagieren). */
export const broadcastListeners: ((room: Room) => void)[] = [];

/** Schickt jedem verbundenen Spieler seine aktuelle Sicht. */
export function broadcast(room: Room) {
  for (const p of room.players.values()) {
    if (p.socketId && !p.bot) io.to(p.socketId).emit("room:state", view(room, p.id));
  }
  for (const listener of broadcastListeners) listener(room);
}
