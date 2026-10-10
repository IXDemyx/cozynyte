import { useEffect, useRef } from "react";
import type { DrawView, RoomState } from "../../../../shared/types";
import { useNow } from "../../hooks/useNow";
import { playEffect } from "../../lib/sounds";

/**
 * Montagsmaler-Sounds: Du bist dran, jemand hat es erraten (du selbst: heller Doppelton),
 * die letzten Sekunden ticken, Auflösung. Nur bei live miterlebten Ereignissen.
 */
export function useDrawSounds(state: RoomState, draw: DrawView, offset: number) {
  const seen = useRef<{ turn: number; guessed: number; stage: string } | null>(null);
  const now = useNow(offset);
  const lastSecond = useRef(0);

  useEffect(() => {
    const before = seen.current;
    seen.current = { turn: draw.turn, guessed: draw.guessed.length, stage: draw.stage };
    if (!before) return;

    if (draw.turn !== before.turn) {
      if (draw.drawerId === state.you) playEffect("turn");
      return;
    }
    if (draw.guessed.length > before.guessed) {
      const fresh = draw.guessed.slice(before.guessed);
      playEffect(fresh.includes(state.you) ? "correct" : "blip");
    }
    if (draw.stage === "reveal" && before.stage !== "reveal") {
      playEffect(draw.guessed.length ? "reveal" : "miss");
    }
  }, [draw.turn, draw.guessed, draw.stage, draw.drawerId, state.you]);

  // Die letzten fünf Sekunden ticken leise mit.
  useEffect(() => {
    if (draw.stage !== "drawing") return;
    const second = Math.ceil((draw.endsAt - now) / 1000);
    if (second !== lastSecond.current && second >= 1 && second <= 5) playEffect("count");
    lastSecond.current = second;
  }, [now, draw.stage, draw.endsAt]);
}
