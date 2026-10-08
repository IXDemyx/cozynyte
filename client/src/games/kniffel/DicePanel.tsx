import type { Dispatch, SetStateAction } from "react";
import { FiSkipForward } from "react-icons/fi";
import { MAX_ROLLS, nextTurn, type KniffelState } from "../../../../shared/kniffel";
import Button from "../../components/Button";
import { card } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";
import Die from "./Die";

interface DicePanelProps {
  sheet: KniffelState;
  /** Von Hand eingetippte echte Würfel (nur auf diesem Gerät). */
  dice: number[];
  setDice: Dispatch<SetStateAction<number[]>>;
  /** Darf dieses Gerät für den Spieler am Zug würfeln? */
  canRoll: boolean;
  setTurn: (column: string | null) => void;
}

/** Wer ist dran, echte Würfel eintippen oder digital würfeln. */
function DicePanel({ sheet, dice, setDice, canRoll, setTurn }: DicePanelProps) {
  const { t } = useLanguage();
  const current = sheet.columns.find((c) => c.id === sheet.current);
  const { roll } = sheet;
  const rolling = Boolean(roll && roll.count > 0);
  const rollsLeft = MAX_ROLLS - (roll?.count ?? 0);

  return (
    <section className={`${card} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          {current ? (
            <span className="text-(--accent)">{t.kniffel.turnOf(current.name)}</span>
          ) : (
            t.kniffel.dice
          )}
        </h2>
        {sheet.columns.length > 1 && sheet.current && (
          <div className="flex items-center gap-2 text-sm text-(--text-secondary)">
            <label className="flex items-center gap-2">
              {t.kniffel.turn}
              <select
                value={sheet.current}
                onChange={(e) => setTurn(e.target.value)}
                className="rounded-lg border border-slate-300 bg-(--bg-primary) px-2 py-1.5 text-(--text-primary) dark:border-slate-700"
              >
                {sheet.columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setTurn(nextTurn(sheet, sheet.current!))}
            >
              <FiSkipForward aria-hidden="true" />{" "}
              <span className="hidden sm:inline">{t.kniffel.next}</span>
            </Button>
          </div>
        )}
      </div>

      {rolling && roll ? (
        <>
          <p className="mt-1 text-sm text-(--text-secondary)">
            {rollsLeft > 0 ? (canRoll ? t.kniffel.holdHint : "") : t.kniffel.noRolls}
          </p>
          <div className="mt-4 flex flex-wrap items-start gap-1.5">
            {roll.dice.map((value, i) => (
              <button
                key={roll.held[i] ? `held-${i}` : `${roll.count}-${i}`}
                type="button"
                aria-label={t.kniffel.hold(value)}
                aria-pressed={roll.held[i]}
                disabled={!canRoll || rollsLeft === 0}
                onClick={() => socket.emit("kniffel:hold", { index: i })}
                className={`flex flex-col items-center gap-1 rounded-xl p-1 transition ${
                  roll.held[i] ? "bg-(--accent-soft) ring-2 ring-(--accent)" : "animate-roll"
                }`}
              >
                <Die value={value} size={44} />
                <span
                  className={`font-mono text-[9px] uppercase ${
                    roll.held[i] ? "text-(--accent)" : "invisible"
                  }`}
                >
                  {t.kniffel.held}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-(--text-secondary)">{t.kniffel.diceHint}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {Array.from({ length: 5 }, (_, i) =>
              dice[i] ? (
                <button
                  key={i}
                  type="button"
                  aria-label={t.kniffel.removeDie(dice[i])}
                  onClick={() => setDice(dice.filter((_, j) => j !== i))}
                  className="transition hover:opacity-60"
                >
                  <Die value={dice[i]} size={44} />
                </button>
              ) : (
                <span
                  key={i}
                  className="h-11 w-11 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700"
                />
              ),
            )}
            {dice.length > 0 && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => setDice([])}
                className="ml-auto"
              >
                {t.kniffel.clearDice}
              </Button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((face) => (
              <button
                key={face}
                type="button"
                aria-label={t.kniffel.addDie(face)}
                disabled={dice.length === 5}
                onClick={() => setDice([...dice, face].sort((a, b) => a - b))}
                className="rounded-xl p-0.5 transition enabled:hover:scale-105 disabled:opacity-30"
              >
                <Die value={face} size={36} />
              </button>
            ))}
          </div>
        </>
      )}

      {current && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-(--accent-soft)">
          {canRoll ? (
            <Button
              onClick={() => socket.emit("kniffel:roll")}
              disabled={rollsLeft === 0 || dice.length > 0}
            >
              {rolling ? t.kniffel.roll : t.kniffel.digital}
            </Button>
          ) : (
            <span className="text-sm text-(--text-secondary)">
              {t.kniffel.notYourTurn(current.name)}
            </span>
          )}
          {rolling && (
            <span className="font-mono text-sm text-(--text-secondary)">
              {t.kniffel.rollAgain(rollsLeft)}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

export default DicePanel;
