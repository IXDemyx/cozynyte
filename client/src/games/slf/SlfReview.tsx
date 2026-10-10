import { FiThumbsDown } from "react-icons/fi";
import type { RoomState, SlfCell, SlfView } from "../../../../shared/types";
import Button from "../../components/Button";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import { card, eyebrow } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";
import { categoryLabel } from "./categories";

/** Ungültige Antworten (leer, falscher Buchstabe, abgelehnt) – zählen 0 Punkte. */
const invalid = (cell: SlfCell) =>
  cell.verdict === "empty" || cell.verdict === "letter" || cell.verdict === "voted";

/**
 * Stadt Land Fluss: Auswertung. Pro Kategorie alle Antworten untereinander; zweifelhafte lassen
 * sich per 👎 anfechten (mit Mehrheit zählen sie nicht). Punkte rechnet der Server live neu.
 */
function SlfReview({ state, slf }: { state: RoomState; slf: SlfView }) {
  const { t } = useLanguage();
  const isHost = state.hostId === state.you;
  const isLast = slf.round >= slf.rounds;
  const players = state.players.filter((p) => slf.cells?.[p.id]);

  return (
    <RoomLayout
      state={state}
      players={
        <PlayerList
          state={state}
          title={t.points}
          showScore
          status={(p) =>
            slf.gains?.[p.id] ? (
              <span className="font-mono font-semibold text-(--success)">+{slf.gains[p.id]}</span>
            ) : null
          }
        />
      }
    >
      <section className={`${card} animate-in min-w-0 p-7 xl:flex-1`}>
        <div className="flex items-center justify-between gap-4">
          <p className={eyebrow}>
            {t.slf.review} · {t.slf.round(slf.round, slf.rounds)}
          </p>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--accent) font-mono text-xl font-bold text-slate-950">
            {slf.letter}
          </span>
        </div>
        <p className="mt-3 text-sm text-(--text-secondary)">{t.slf.voteHint}</p>

        <div className="mt-6 space-y-6">
          {slf.categories.map((category, i) => (
            <div key={i}>
              <h3 className="text-sm font-semibold">{categoryLabel(t, category)}</h3>
              <ul className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {players.map((p) => {
                  const cell = slf.cells![p.id][i];
                  const mine = p.id === state.you;
                  const voted = cell.votes.includes(state.you);
                  // Abstimmen nur über echte Antworten anderer.
                  const canVote = !mine && cell.text !== "" && cell.verdict !== "letter";
                  const label = t.slf.verdicts[cell.verdict];
                  return (
                    <li
                      key={p.id}
                      className={`flex items-center gap-3 px-3 py-2 text-sm ${mine ? "bg-(--accent-soft)" : ""}`}
                    >
                      <span className="w-16 shrink-0 truncate text-(--text-secondary) sm:w-24">
                        {p.name}
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate font-medium ${
                          invalid(cell) ? "text-(--text-secondary) line-through" : ""
                        }`}
                      >
                        {cell.text || "–"}
                      </span>
                      {label && (
                        <span
                          className={`hidden shrink-0 rounded-full px-2 py-0.5 text-xs sm:inline ${
                            cell.verdict === "solo"
                              ? "bg-(--accent-soft) text-(--accent)"
                              : invalid(cell)
                                ? "bg-red-500/10 text-red-500"
                                : "bg-slate-500/10 text-(--text-secondary)"
                          }`}
                        >
                          {label}
                        </span>
                      )}
                      {canVote ? (
                        <button
                          type="button"
                          aria-label={t.slf.vote(p.name)}
                          title={t.slf.vote(p.name)}
                          aria-pressed={voted}
                          onClick={() => socket.emit("slf:vote", { playerId: p.id, category: i })}
                          className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs transition ${
                            voted
                              ? "bg-red-500 text-white"
                              : "text-(--text-secondary) hover:text-red-500"
                          }`}
                        >
                          <FiThumbsDown aria-hidden="true" />
                          {cell.votes.length > 0 && cell.votes.length}
                        </button>
                      ) : (
                        <span className="w-7 shrink-0 text-center text-xs text-red-500">
                          {cell.votes.length > 0 && cell.votes.length}
                        </span>
                      )}
                      <span
                        className={`w-8 shrink-0 text-right font-mono font-semibold tabular-nums ${
                          cell.points === 0
                            ? "text-(--text-secondary)"
                            : cell.points === 20
                              ? "text-(--accent)"
                              : ""
                        }`}
                      >
                        {cell.points}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-(--accent-soft)">
          {isHost ? (
            <Button onClick={() => socket.emit("slf:next")}>
              {isLast ? t.slf.toFinal : t.slf.next}
            </Button>
          ) : (
            <p className="text-sm text-(--text-secondary)">{t.slf.waitingHost}</p>
          )}
        </div>
      </section>
    </RoomLayout>
  );
}

export default SlfReview;
