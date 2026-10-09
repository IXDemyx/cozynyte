import { useState } from "react";
import type { Ack, RoomState } from "../../../../shared/types";
import Button from "../../components/Button";
import ErrorText from "../../components/ErrorText";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import { card, eyebrow } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";

function Final({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const ranking = [...state.players].sort((a, b) => b.score - a.score);
  const top = ranking[0]?.score ?? 0;
  const winners = ranking.filter((p) => p.score === top);
  const isHost = state.hostId === state.you;

  return (
    <RoomLayout state={state} players={<PlayerList state={state} title={t.points} showScore />}>
      <div className="space-y-6">
        <section className={`${card} animate-in p-7`}>
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
                    <span className="ml-2 text-xs font-normal text-(--text-secondary)">
                      {t.you}
                    </span>
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
          <ErrorText code={error} className="mt-3" />
        </section>

        {state.game === "timeline" && state.timelines && (
          <section className="animate-in">
            <h2 className={`${eyebrow} text-center`}>{t.final.timelines}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {ranking.map((p) => {
                const cards = state.timelines?.[p.id] ?? [];
                return (
                  <article
                    key={p.id}
                    className={`${card} p-4 ${p.score === top ? "ring-2 ring-(--accent)" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold">
                        {p.name}
                        {p.id === state.you && (
                          <span className="ml-1.5 text-xs font-normal text-(--text-secondary)">
                            {t.you}
                          </span>
                        )}
                      </h3>
                      <span className="shrink-0 font-mono text-sm text-(--text-secondary)">
                        {t.timeline.cardCount(cards.length)}
                      </span>
                    </div>
                    <ol className="mt-3 space-y-1">
                      {cards.map((item) => (
                        <li key={item.id} className="flex items-center gap-2 text-sm">
                          <span className="w-11 shrink-0 font-mono font-semibold text-(--accent)">
                            {item.year}
                          </span>
                          <span className="min-w-0 truncate">
                            {item.title}
                            <span className="text-(--text-secondary)"> · {item.artist}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </RoomLayout>
  );
}
export default Final;
