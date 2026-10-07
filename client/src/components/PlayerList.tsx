import { useState, type ReactNode } from "react";
import { FaCrown } from "react-icons/fa";
import { FiUserX } from "react-icons/fi";
import type { PlayerView, RoomState } from "../../../shared/types";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";
import { card, eyebrow } from "./ui";

interface PlayerListProps {
  state: RoomState;
  title?: string;
  showScore?: boolean;
  /** Zusatzinfo rechts neben dem Namen (z. B. "2/3 Songs"). */
  status?: (player: PlayerView) => ReactNode;
}

function PlayerList({ state, title, showScore = false, status }: PlayerListProps) {
  const { t } = useLanguage();
  // Entfernen braucht zwei Klicks, damit es nicht versehentlich passiert.
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const isHost = state.hostId === state.you;
  const players = showScore
    ? [...state.players].sort((a, b) => b.score - a.score)
    : state.players;

  const kick = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId((current) => (current === id ? null : current)), 3000);
      return;
    }
    socket.emit("player:kick", { playerId: id });
    setConfirmId(null);
  };

  return (
    <aside className={`${card} p-5`}>
      <h2 className={eyebrow}>
        {title ?? t.players} · {players.length}
      </h2>
      <ul className="mt-4 space-y-2">
        {players.map((p, i) => (
          <li
            key={p.id}
            className={`flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm ${
              p.id === state.you ? "bg-(--accent-soft)" : ""
            }`}
          >
            {showScore && (
              <span className="w-4 font-mono text-xs text-(--text-secondary)">{i + 1}</span>
            )}
            <span
              className={`flex min-w-0 flex-1 items-center gap-2 font-medium ${
                p.connected ? "" : "opacity-40"
              }`}
            >
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
            {isHost && p.id !== state.you && (
              <button
                type="button"
                aria-label={t.kick(p.name)}
                title={t.kick(p.name)}
                onClick={() => kick(p.id)}
                className={`shrink-0 rounded-md text-xs font-semibold transition ${
                  confirmId === p.id
                    ? "bg-red-500 px-2 py-1 text-white"
                    : "p-1 text-(--text-secondary) hover:text-red-500"
                }`}
              >
                {confirmId === p.id ? t.kickConfirm : <FiUserX aria-hidden="true" />}
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default PlayerList;
