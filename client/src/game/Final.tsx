import { useState } from "react";
import type { Ack, RoomState } from "../../../shared/types";
import Button from "../components/Button";
import { card, eyebrow } from "../components/ui";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";

function Final({ state }: { state: RoomState }) {
  const { t, err } = useLanguage();
  const [error, setError] = useState("");
  const ranking = [...state.players].sort((a, b) => b.score - a.score);
  const top = ranking[0]?.score ?? 0;
  const winners = ranking.filter((p) => p.score === top);
  const isHost = state.hostId === state.you;

  return (
    <section className={`${card} animate-in mx-auto max-w-xl p-7`}>
      <p className={eyebrow}>{t.final.eyebrow}</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
        {winners.length > 1 ? t.final.tie : ""}
        <span className="text-(--accent)">{winners.map((p) => p.name).join(" & ")}</span>
        {t.final.wins(winners.length)}
      </h1>

      <ol className="mt-7 space-y-2">
        {ranking.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
              p.score === top
                ? "border-(--accent) bg-(--accent-soft)"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <span className="w-6 font-mono text-sm text-(--text-secondary)">{i + 1}.</span>
            <span className="min-w-0 flex-1 truncate font-semibold">
              {p.name}
              {p.id === state.you && (
                <span className="ml-2 text-xs font-normal text-(--text-secondary)">{t.you}</span>
              )}
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums">{p.score}</span>
          </li>
        ))}
      </ol>

      <div className="mt-7 flex flex-wrap gap-3">
        {isHost ? (
          <>
            <Button
              onClick={() =>
                socket.emit("game:start", (res: Ack) => setError(res.ok ? "" : res.error))
              }
            >
              {t.final.again}
            </Button>
            <Button variant="secondary" onClick={() => socket.emit("game:lobby")}>
              {t.final.lobby}
            </Button>
          </>
        ) : (
          <p className="text-sm text-(--text-secondary)">{t.final.waitingHost}</p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-500">
          {err(error)}
        </p>
      )}
    </section>
  );
}

export default Final;
