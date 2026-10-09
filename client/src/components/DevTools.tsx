import { useState } from "react";
import { FiMessageSquare, FiTrash2, FiUserPlus } from "react-icons/fi";
import type { Ack, RoomState } from "../../../shared/types";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";
import ErrorText from "./ErrorText";
import { eyebrow } from "./ui";

/**
 * Testmodus (nur bei `npm run dev`, nur für den Host): Testbots in den Raum holen, damit sich
 * Lobby, Chat und Spiele auch allein ausprobieren lassen.
 */
function DevTools({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const hasBots = state.players.some((p) => p.bot);

  const addBot = () => socket.emit("dev:addBot", (res: Ack) => setError(res.ok ? "" : res.error));

  const item =
    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium transition enabled:hover:bg-(--accent-soft) enabled:hover:text-(--accent) disabled:opacity-40";

  return (
    <aside className="rounded-2xl border-2 border-dashed border-(--accent-border) p-4">
      <h2 className={eyebrow}>{t.dev.heading}</h2>
      <p className="mt-1 text-xs text-(--text-secondary)">{t.dev.hint}</p>
      <div className="mt-2 space-y-0.5">
        <button type="button" className={item} onClick={addBot}>
          <FiUserPlus aria-hidden="true" /> {t.dev.addBot}
        </button>
        <button
          type="button"
          className={item}
          disabled={!hasBots}
          onClick={() => socket.emit("dev:botSays")}
        >
          <FiMessageSquare aria-hidden="true" /> {t.dev.botSays}
        </button>
        <button
          type="button"
          className={item}
          disabled={!hasBots}
          onClick={() => socket.emit("dev:removeBots")}
        >
          <FiTrash2 aria-hidden="true" /> {t.dev.removeBots}
        </button>
      </div>
      <ErrorText code={error} className="mt-1" />
    </aside>
  );
}

export default DevTools;
