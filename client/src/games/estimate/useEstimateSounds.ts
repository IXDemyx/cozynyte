import { useEffect, useRef } from "react";
import type { EstimateView, RoomState } from "../../../../shared/types";
import { useNow } from "../../hooks/useNow";
import { playEffect } from "../../lib/sounds";

/**
 * Schätzfragen-Sounds: neue Frage, jemand hat getippt, die letzten Sekunden ticken, Auflösung
 * (am nächsten dran oder nicht).
 */
export function useEstimateSounds(state: RoomState, game: EstimateView, offset: number) {
  const seen = useRef<{ qid: string; stage: string; answered: number } | null>(null);
  const now = useNow(offset);
  const lastSecond = useRef(0);

  useEffect(() => {
    const before = seen.current;
    seen.current = { qid: game.qid, stage: game.stage, answered: game.answered.length };
    if (!before) return;
    if (game.stage === "question" && before.stage !== "question") return playEffect("turn");
    if (game.stage === "reveal" && before.stage !== "reveal") {
      return playEffect(game.closest?.includes(state.you) ? "reveal" : "miss");
    }
    if (game.stage === "question" && game.answered.length > before.answered) playEffect("blip");
  }, [game.qid, game.stage, game.answered, game.closest, state.you]);

  // Countdown vor der ersten Frage und die letzten fünf Sekunden jeder Frage ticken mit.
  useEffect(() => {
    if (game.stage === "reveal") return;
    const second = Math.ceil((game.endsAt - now) / 1000);
    const last = game.stage === "countdown" ? 3 : 5;
    if (second !== lastSecond.current && second >= 1 && second <= last) playEffect("count");
    lastSecond.current = second;
  }, [now, game.stage, game.endsAt]);
}
