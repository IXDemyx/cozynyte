import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import type { RoomState } from "../../../shared/types";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";

/**
 * Nur für den Host, mitten im Spiel: Partie abbrechen und zurück in die Lobby – etwa wenn die
 * Einstellungen nicht gepasst haben. Mit Rückfrage, weil der Punktestand dabei verloren geht.
 * Nach dem Endstand gibt es dafür einen eigenen Knopf, Kniffel hat keine Lobby.
 */
function BackToLobby({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const show =
    state.hostId === state.you &&
    state.game !== "kniffel" &&
    state.phase !== "lobby" &&
    state.phase !== "finished";
  if (!show) return null;

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-(--text-secondary) transition hover:border-(--accent) hover:text-(--accent) dark:border-slate-700"
      >
        <FiArrowLeft aria-hidden="true" />
        {t.room.toLobby}
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label={t.room.toLobby}
      className="animate-in rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm"
    >
      <p className="font-semibold">{t.room.toLobbyConfirm}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            socket.emit("game:lobby");
          }}
          className="rounded-lg bg-red-500 px-2 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 active:scale-[0.97]"
        >
          {t.room.toLobbyYes}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-slate-300 px-2 py-2 text-sm font-semibold text-(--text-secondary) transition hover:text-(--text-primary) dark:border-slate-700"
        >
          {t.room.cancel}
        </button>
      </div>
    </div>
  );
}

export default BackToLobby;
