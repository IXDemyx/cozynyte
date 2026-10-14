import { useEffect, useRef } from "react";
import type { GeoView, RoomState } from "../../../../shared/types";
import { useNow } from "../../hooks/useNow";
import { playEffect } from "../../lib/sounds";

/**
 * Länder-Quiz-Sounds: Countdown, neue Frage, jemand hat geantwortet (du selbst richtig: heller
 * Doppelton), die letzten Sekunden ticken, Auflösung (richtig oder daneben).
 */
export function useGeoSounds(state: RoomState, geo: GeoView, offset: number) {
  const seen = useRef<{ qid: string; stage: string; answered: number } | null>(null);
  const now = useNow(offset);
  const lastSecond = useRef(0);

  useEffect(() => {
    const before = seen.current;
    seen.current = { qid: geo.qid, stage: geo.stage, answered: geo.answered.length };
    if (!before) return;
    if (geo.stage === "question" && before.stage !== "question") return playEffect("turn");
    if (geo.stage === "reveal" && before.stage !== "reveal") {
      return playEffect(geo.correct?.includes(state.you) ? "reveal" : "miss");
    }
    if (geo.stage === "question" && geo.answered.length > before.answered) {
      const fresh = geo.answered.slice(before.answered);
      // Beim Tippen heißt „geantwortet“ schon „richtig“ – beim eigenen Treffer der helle Ton.
      playEffect(fresh.includes(state.you) && geo.youGotIt ? "correct" : "blip");
    }
  }, [geo.qid, geo.stage, geo.answered, geo.correct, geo.youGotIt, state.you]);

  // Countdown vor der ersten Frage und die letzten fünf Sekunden jeder Frage ticken mit.
  useEffect(() => {
    if (geo.stage === "reveal") return;
    const second = Math.ceil((geo.endsAt - now) / 1000);
    const last = geo.stage === "countdown" ? 3 : 5;
    if (second !== lastSecond.current && second >= 1 && second <= last) playEffect("count");
    lastSecond.current = second;
  }, [now, geo.stage, geo.endsAt]);
}
