import { FaCrown } from "react-icons/fa";
import type { ReactNode } from "react";
import type { PlayerView, RoomState } from "../../../shared/types";
import { card, eyebrow } from "./ui";
import { useLanguage } from "../lib/i18n";

interface PlayerListProps {
  state: RoomState;
  title?: string;
  showScore?: boolean;
  /** Zusatzinfo rechts neben dem Namen (z. B. "2/3 Songs"). */
  status?: (player: PlayerView) => ReactNode;
}

function PlayerList({ state, title, showScore = false, status }: PlayerListProps) {
  const { t } = useLanguage();
  const players = showScore
    ? [...state.players].sort((a, b) => b.score - a.score)
    : state.players;

  return (
    <aside className={`${card} p-5`}>
      <h2 className={eyebrow}>
        {title ?? t.players} · {players.length}
      </h2>
      <ul className="mt-4 space-y-2">
        {players.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
              p.id === state.you ? "bg-(--accent-soft)" : ""
            } ${p.connected ? "" : "opacity-40"}`}
          >
            {showScore && (
              <span className="w-4 font-mono text-xs text-(--text-secondary)">{i + 1}</span>
            )}
            <span className="flex min-w-0 flex-1 items-center gap-2 font-medium">
              <span className="truncate">{p.name}</span>
              {p.id === state.hostId && (
                <FaCrown className="shrink-0 text-(--accent)" aria-label="Host" />
              )}
              {p.id === state.you && (
                <span className="shrink-0 text-xs font-normal text-(--text-secondary)">{t.you}</span>
              )}
            </span>
            {status && <span className="shrink-0 text-xs text-(--text-secondary)">{status(p)}</span>}
            {showScore && (
              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">{p.score}</span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default PlayerList;
