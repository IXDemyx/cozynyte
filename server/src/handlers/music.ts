/** Musikspiele: Songsuche, Songauswahl und Eingaben während einer Runde. */

import { SEARCH_LIMIT, SEARCH_WINDOW_MS } from "../config";
import { canPlace, endRoundIfDone, handleGuess, pushFeed, startRounds } from "../games/music";
import { getCachedTrack, searchTracks } from "../music/itunes";
import { suggestTracks } from "../music/suggestions";
import type { Player } from "../state";
import { broadcast } from "../view";
import type { Handlers } from "./context";

/** Zählt eine Suche mit; false = Limit erreicht. */
function allowSearch(player: Player): boolean {
  const now = Date.now();
  player.searches = player.searches.filter((at) => now - at < SEARCH_WINDOW_MS);
  if (player.searches.length >= SEARCH_LIMIT) return false;
  player.searches.push(now);
  return true;
}

export function registerMusicHandlers({ socket, ctx, reply }: Handlers) {
  socket.on("songs:search", async (data, cb) => {
    const c = ctx();
    const term = String(data?.term ?? "")
      .trim()
      .slice(0, 80);
    if (!c || term.length < 2) return reply(cb, { ok: true, tracks: [] });
    if (!allowSearch(c.player)) return reply(cb, { ok: false, error: "search_rate_limited" });
    try {
      reply(cb, { ok: true, tracks: await searchTracks(term) });
    } catch {
      reply(cb, { ok: false, error: "search_unavailable" });
    }
  });

  socket.on("songs:suggest", async (data, cb) => {
    const c = ctx();
    if (!c || c.room.phase !== "picking") return;
    if (!allowSearch(c.player)) return reply(cb, { ok: false, error: "search_rate_limited" });
    try {
      reply(cb, { ok: true, tracks: await suggestTracks(String(data?.category ?? "")) });
    } catch {
      reply(cb, { ok: false, error: "search_unavailable" });
    }
  });

  socket.on("songs:add", (data, cb) => {
    const c = ctx();
    if (!c || c.room.phase !== "picking") return;
    const track = getCachedTrack(Number(data?.trackId));
    if (!track) return reply(cb, { ok: false, error: "track_not_found" });
    if ((c.room.game === "year" || c.room.game === "timeline") && !track.year) {
      return reply(cb, { ok: false, error: "track_no_year" });
    }
    if (c.player.picks.length >= c.room.settings.songsPerPlayer) {
      return reply(cb, { ok: false, error: "picks_full" });
    }
    const taken = [...c.room.players.values()].some((p) => p.picks.some((t) => t.id === track.id));
    if (taken) return reply(cb, { ok: false, error: "track_taken" });
    c.player.picks.push(track);
    reply(cb, { ok: true });
    broadcast(c.room);
  });

  socket.on("songs:remove", (data) => {
    const c = ctx();
    if (!c || c.room.phase !== "picking") return;
    c.player.picks = c.player.picks.filter((t) => t.id !== Number(data?.trackId));
    broadcast(c.room);
  });

  // Start, sobald alle fertig sind – der Host bestätigt (oder erzwingt) den Start.
  socket.on("picking:finish", (cb) => {
    const c = ctx();
    if (!c || !c.isHost || c.room.phase !== "picking") return;
    const withSongs = [...c.room.players.values()].filter((p) => p.picks.length > 0);
    if (withSongs.length < 2) return reply(cb, { ok: false, error: "need_two_pickers" });
    startRounds(c.room);
    reply(cb, { ok: true });
    broadcast(c.room);
  });

  // Tipp (Guess the Song) bzw. Chatnachricht (alle Musikspiele).
  socket.on("round:guess", (data) => {
    const c = ctx();
    if (c) handleGuess(c.room, c.player, data?.text);
  });

  // Guess the Year: ein Tipp pro Runde, danach gesperrt.
  socket.on("round:year", (data) => {
    const c = ctx();
    const round = c?.room.round;
    if (!c || !round || c.room.game !== "year" || c.room.phase !== "round") return;
    if (round.pickerId === c.player.id || round.years.has(c.player.id)) return;
    const year = Math.round(Number(data?.year));
    if (!Number.isFinite(year) || year < 1900 || year > new Date().getFullYear() + 1) return;
    round.years.set(c.player.id, year);
    pushFeed(round, c.player, "locked");
    endRoundIfDone(c.room, round);
  });

  // Song-Timeline: Lücke in der eigenen Zeitleiste wählen (0 = ganz vorn).
  socket.on("round:place", (data) => {
    const c = ctx();
    const round = c?.room.round;
    if (!c || !round || c.room.game !== "timeline" || c.room.phase !== "round") return;
    if (!canPlace(c.room, round, c.player.id)) return;
    const position = Number(data?.position);
    if (!Number.isInteger(position) || position < 0 || position > c.player.timeline.length) return;
    round.placements.set(c.player.id, position);
    pushFeed(round, c.player, "placed");
    endRoundIfDone(c.room, round);
  });
}
