import { useEffect, useRef } from "react";
import { MUSIC_GAMES, type RoomState } from "../../../../shared/types";
import { playEffect } from "../../lib/sounds";

/**
 * Dezente Sounds für die Musikspiele – die Musik soll im Vordergrund bleiben:
 * - Guess the Song: selbst Titel oder Interpret erraten → „correct", jemand anderes → leises „blip".
 * - Guess the Year / Song Timeline: in der Auflösung „correct" bei Punkten, sonst „miss".
 * - Endstand: kleine Fanfare.
 * Nur bei Ereignissen, die man live miterlebt – nicht nach dem Neuladen.
 */
export function useMusicSounds(state: RoomState | null) {
  const lastFeed = useRef<number | null>(null);
  const lastPhase = useRef(state?.phase);
  const music = state ? MUSIC_GAMES.includes(state.game) : false;
  const feed = state?.phase === "round" ? state.round?.feed : undefined;

  // Neue Treffer im Rundenverlauf (Guess the Song).
  useEffect(() => {
    if (!state || !music) return;
    // Außerhalb einer Runde sind wir live dabei: Treffer der nächsten Runde dürfen klingen.
    if (!feed) {
      lastFeed.current ??= 0;
      return;
    }
    const latest = feed.reduce((max, e) => Math.max(max, e.id), 0);
    const seen = lastFeed.current;
    lastFeed.current = Math.max(seen ?? 0, latest);
    if (seen === null || state.game !== "song") return;
    const hits = feed.filter((e) => e.id > seen && (e.kind === "title" || e.kind === "artist"));
    if (hits.some((e) => e.playerId === state.you)) playEffect("correct");
    else if (hits.length) playEffect("blip");
  }, [feed, music, state]);

  // Phasenwechsel: Auflösung und Endstand.
  const phase = state?.phase;
  useEffect(() => {
    const previous = lastPhase.current;
    lastPhase.current = phase;
    if (!state || !music || previous === phase || previous === undefined) return;
    if (phase === "reveal" && previous === "round" && state.reveal) {
      const { gains, placements, yearGuesses } = state.reveal;
      const tookPart =
        state.game === "year"
          ? yearGuesses?.[state.you] !== undefined
          : state.game === "timeline"
            ? placements?.[state.you] !== undefined
            : false;
      if (tookPart) playEffect((gains[state.you] ?? 0) > 0 ? "correct" : "miss");
    }
    if (phase === "finished" && previous === "reveal") playEffect("win");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
}
