/** Was jeder Spieler vom Raum sehen darf – und das Verschicken an alle. */

import type { RoomState } from "../../shared/types";
import { canPlace, hasAnswered, opened } from "./games/music";
import { cleanTitle, maskText } from "./music/match";
import { io } from "./server";
import type { Room } from "./state";

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
    })),
    myPicks: room.phase === "picking" ? (me?.picks ?? []) : [],
    kniffel: room.kniffel,
    chat: room.chat,
    timelines:
      room.game === "timeline" && room.phase !== "lobby" && room.phase !== "picking"
        ? Object.fromEntries(
            [...room.players.values()].map((p) => [
              p.id,
              p.timeline.map((t) => ({
                id: t.id,
                title: t.title,
                artist: t.artist,
                artwork: t.artwork,
                year: t.year ?? 0,
              })),
            ]),
          )
        : undefined,
    serverNow: Date.now(),
  };

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

/** Schickt jedem verbundenen Spieler seine aktuelle Sicht. */
export function broadcast(room: Room) {
  for (const p of room.players.values()) {
    if (p.socketId) io.to(p.socketId).emit("room:state", view(room, p.id));
  }
}
