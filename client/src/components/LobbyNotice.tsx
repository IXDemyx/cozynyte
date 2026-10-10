import { useEffect, useState } from "react";
import { FiInfo, FiX } from "react-icons/fi";
import type { RoomState } from "../../../shared/types";
import { useLanguage } from "../lib/i18n";

/** So lange bleibt der Hinweis stehen, wenn ihn niemand wegklickt. */
const VISIBLE_MS = 15_000;

/**
 * Hinweis in der Lobby, wenn der Host die Partie mittendrin abgebrochen hat – damit sich die
 * anderen nicht wundern, warum sie plötzlich hier sind. Der Host selbst weiß es ja.
 */
function LobbyNotice({ state, className = "" }: { state: RoomState; className?: string }) {
  const { t } = useLanguage();
  const notice = state.phase === "lobby" ? state.notice : undefined;
  const [hidden, setHidden] = useState<number | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setHidden(notice.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notice?.id]);

  if (!notice || hidden === notice.id || state.hostId === state.you) return null;

  return (
    <div
      role="status"
      className={`animate-in flex items-start gap-3 rounded-xl border border-(--accent-border) bg-(--accent-soft) p-4 text-sm ${className}`}
    >
      <FiInfo aria-hidden="true" className="mt-0.5 shrink-0 text-lg text-(--accent)" />
      <p className="flex-1 font-medium">{t.room.aborted(notice.name)}</p>
      <button
        type="button"
        aria-label={t.room.dismiss}
        title={t.room.dismiss}
        onClick={() => setHidden(notice.id)}
        className="shrink-0 rounded-md p-1 text-(--text-secondary) transition hover:text-(--text-primary)"
      >
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
}

export default LobbyNotice;
