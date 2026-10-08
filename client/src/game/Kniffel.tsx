import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  FiCheck,
  FiCopy,
  FiLock,
  FiRotateCcw,
  FiSkipForward,
  FiTrash2,
  FiUnlock,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import {
  BONUS_THRESHOLD,
  CATEGORIES,
  FACE,
  FIXED,
  LOWER,
  UPPER,
  MAX_ROLLS,
  allowedValues,
  canEditColumn,
  isUpper,
  nextTurn,
  scoreDice,
  totals,
  type Category,
  type KniffelColumn,
} from "../../../shared/kniffel";
import type { RoomState } from "../../../shared/types";
import Button from "../components/Button";
import { card, eyebrow, input } from "../components/ui";
import { useLanguage } from "../lib/i18n";
import { socket } from "../lib/socket";

/** Würfelseite mit Augen. */
function Die({ value, size = 40 }: { value: number; size?: number }) {
  const pips: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
  };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <rect x="4" y="4" width="92" height="92" rx="20" className="fill-(--bg-primary) stroke-(--accent)" strokeWidth="6" />
      {pips[value].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" className="fill-(--text-primary)" />
      ))}
    </svg>
  );
}

interface Editing {
  column: KniffelColumn;
  category: Category;
}

function Kniffel({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const sheet = state.kniffel ?? { columns: [], cells: {}, current: null, locked: false, roll: null, lastEntry: null };
  const isHost = state.hostId === state.you;

  const [dice, setDice] = useState<number[]>([]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [newName, setNewName] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const targetId = sheet.current ?? undefined;
  const currentColumn = sheet.columns.find((c) => c.id === targetId);

  // Die eingegebenen Würfel gehören zum aktuellen Zug – wechselt der Zug, sind sie weg.
  useEffect(() => setDice([]), [targetId]);

  const setTurn = (column: string | null) => column && socket.emit("kniffel:turn", { column });

  const roll = sheet.roll;
  const rolling = Boolean(roll && roll.count > 0);
  const rollsLeft = MAX_ROLLS - (roll?.count ?? 0);
  // Digitaler Wurf hat Vorrang vor von Hand eingetippten Würfeln.
  const activeDice = rolling && roll ? roll.dice : dice;
  const diceReady = activeDice.length === 5;
  const canEdit = (column: KniffelColumn) => canEditColumn(sheet, column, state.you);
  const canRoll = Boolean(currentColumn && canEdit(currentColumn));
  const lastColumn = sheet.columns.find((c) => c.id === sheet.lastEntry?.column);
  const undoLabel =
    sheet.lastEntry && lastColumn
      ? t.kniffel.undoWhat(t.kniffel.categories[sheet.lastEntry.category], lastColumn.name)
      : t.kniffel.undo;
  const suggestion = (columnId: string, category: Category) =>
    diceReady && columnId === targetId && sheet.cells[columnId]?.[category] === undefined
      ? scoreDice(category, activeDice)
      : undefined;

  const set = (column: string, category: Category, value: number | null) =>
    socket.emit("kniffel:set", { column, category, value });

  const choose = (value: number | null, fromDice = false) => {
    if (!editing) return;
    set(editing.column.id, editing.category, value);
    if (fromDice) setDice([]);
    setEditing(null);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${location.origin}/r/${state.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const addColumn = (event: FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;
    socket.emit("kniffel:add", { name: newName.trim() }, () => setNewName(""));
  };

  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    socket.emit("kniffel:reset");
    setConfirmReset(false);
  };

  const remove = (column: KniffelColumn) => {
    if (confirmRemove !== column.id) {
      setConfirmRemove(column.id);
      setTimeout(() => setConfirmRemove((c) => (c === column.id ? null : c)), 3000);
      return;
    }
    socket.emit("kniffel:remove", { column: column.id });
    setConfirmRemove(null);
  };

  const columnTotals = Object.fromEntries(sheet.columns.map((c) => [c.id, totals(sheet.cells[c.id])]));
  const finished =
    sheet.columns.length > 0 && sheet.columns.every((c) => columnTotals[c.id].filled === CATEGORIES.length);
  const best = Math.max(0, ...sheet.columns.map((c) => columnTotals[c.id].total));
  const winners = sheet.columns.filter((c) => columnTotals[c.id].total === best);

  const cellClass =
    "h-10 w-full min-w-14 rounded-md font-mono text-sm tabular-nums transition hover:bg-(--accent-soft)";

  const categoryRow = (category: Category) => (
    <tr key={category} className="border-t border-slate-200 dark:border-slate-800">
      <th scope="row" className="sticky left-0 z-10 bg-white py-1 pr-3 text-left font-normal dark:bg-(--bg-secondary)">
        <span className="block font-semibold">{t.kniffel.categories[category]}</span>
        <span className="hidden text-xs text-(--text-secondary) sm:block">{t.kniffel.hints[category]}</span>
      </th>
      {sheet.columns.map((column) => {
        const value = sheet.cells[column.id]?.[category];
        const hint = suggestion(column.id, category);
        return (
          <td key={column.id} className="px-1 py-1 text-center">
            <button
              type="button"
              aria-label={`${t.kniffel.categories[category]}, ${column.name}`}
              disabled={!canEdit(column)}
              onClick={() => setEditing({ column, category })}
              className={`${cellClass} ${
                value !== undefined
                  ? `font-semibold ${value === 0 ? "text-(--text-secondary) line-through" : ""}`
                  : hint !== undefined
                    ? "border border-dashed border-(--accent-border) text-(--accent)"
                    : "border border-slate-200 text-(--text-secondary) dark:border-slate-800"
              } ${canEdit(column) ? "" : "cursor-default opacity-70 hover:bg-transparent"}`}
            >
              {value ?? hint ?? ""}
            </button>
          </td>
        );
      })}
    </tr>
  );

  const sumRow = (label: string, render: (columnId: string) => ReactNode, strong = false) => (
    <tr className={`border-t-2 border-slate-300 dark:border-(--accent-border) ${strong ? "text-base" : ""}`}>
      <th
        scope="row"
        className={`sticky left-0 z-10 bg-white py-2 pr-3 text-left dark:bg-(--bg-secondary) ${
          strong ? "font-bold text-(--accent)" : "font-semibold text-(--text-secondary)"
        }`}
      >
        {label}
      </th>
      {sheet.columns.map((column) => (
        <td
          key={column.id}
          className={`px-1 py-2 text-center font-mono tabular-nums ${strong ? "font-bold text-(--accent)" : "font-semibold"}`}
        >
          {render(column.id)}
        </td>
      ))}
    </tr>
  );

  const editingValue = editing ? sheet.cells[editing.column.id]?.[editing.category] : undefined;
  const editingHint = editing ? suggestion(editing.column.id, editing.category) : undefined;

  return (
    <div className="animate-in space-y-6">
      <section className={`${card} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div>
          <p className={eyebrow}>{t.home.kniffelTitle}</p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.25em] text-(--accent)">{state.code}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="small"
            title={undoLabel}
            aria-label={undoLabel}
            disabled={!lastColumn || !canEdit(lastColumn)}
            onClick={() => socket.emit("kniffel:undo")}
          >
            <FiRotateCcw aria-hidden="true" /> {t.kniffel.undo}
          </Button>
          <Button variant="secondary" size="small" onClick={copyLink}>
            {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
            {copied ? t.lobby.copied : t.lobby.copy}
          </Button>
          {isHost ? (
            <Button
              variant="secondary"
              size="small"
              title={t.kniffel.lockHint}
              aria-pressed={sheet.locked}
              onClick={() => socket.emit("kniffel:lock", { locked: !sheet.locked })}
              className={sheet.locked ? "border-(--accent)! text-(--accent)!" : ""}
            >
              {sheet.locked ? <FiLock aria-hidden="true" /> : <FiUnlock aria-hidden="true" />}
              {sheet.locked ? t.kniffel.lockOn : t.kniffel.lockOff}
            </Button>
          ) : (
            sheet.locked && (
              <span className="flex items-center gap-1.5 text-sm text-(--text-secondary)" title={t.kniffel.lockHint}>
                <FiLock aria-hidden="true" /> {t.kniffel.lockOn}
              </span>
            )
          )}
          {isHost && (
            <Button
              variant="secondary"
              size="small"
              onClick={reset}
              className={confirmReset ? "border-red-500! text-red-500!" : ""}
            >
              {confirmReset ? t.kniffel.newGameConfirm : t.kniffel.newGame}
            </Button>
          )}
        </div>
      </section>

      {finished && (
        <p className="rounded-2xl border border-(--accent) bg-(--accent-soft) p-4 text-center font-semibold">
          {t.kniffel.winner(winners.map((c) => c.name).join(" & "), best)}
        </p>
      )}

      <section className={`${card} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            {currentColumn ? (
              <span className="text-(--accent)">{t.kniffel.turnOf(currentColumn.name)}</span>
            ) : (
              t.kniffel.dice
            )}
          </h2>
          {sheet.columns.length > 1 && targetId && (
            <div className="flex items-center gap-2 text-sm text-(--text-secondary)">
              <label className="flex items-center gap-2">
                {t.kniffel.turn}
                <select
                  value={targetId}
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
              <Button variant="secondary" size="small" onClick={() => setTurn(nextTurn(sheet, targetId))}>
                <FiSkipForward aria-hidden="true" /> <span className="hidden sm:inline">{t.kniffel.next}</span>
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
                <Button variant="secondary" size="small" onClick={() => setDice([])} className="ml-auto">
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
                  disabled={diceReady}
                  onClick={() => setDice([...dice, face].sort((a, b) => a - b))}
                  className="rounded-xl p-0.5 transition enabled:hover:scale-105 disabled:opacity-30"
                >
                  <Die value={face} size={36} />
                </button>
              ))}
            </div>
          </>
        )}

        {currentColumn && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-(--accent-soft)">
            {canRoll ? (
              <Button onClick={() => socket.emit("kniffel:roll")} disabled={rollsLeft === 0 || dice.length > 0}>
                {rolling ? t.kniffel.roll : t.kniffel.digital}
              </Button>
            ) : (
              <span className="text-sm text-(--text-secondary)">{t.kniffel.notYourTurn(currentColumn.name)}</span>
            )}
            {rolling && (
              <span className="font-mono text-sm text-(--text-secondary)">{t.kniffel.rollAgain(rollsLeft)}</span>
            )}
          </div>
        )}
      </section>

      <section className={`${card} overflow-x-auto p-3 sm:p-5`}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white dark:bg-(--bg-secondary)" />
              {sheet.columns.map((column) => (
                <th key={column.id} scope="col" className="px-1 pb-2 align-bottom">
                  <button
                    type="button"
                    onClick={() => setTurn(column.id)}
                    className={`mx-auto block max-w-24 truncate rounded-md px-2 py-0.5 text-sm font-semibold ${
                      column.id === targetId ? "bg-(--accent) text-slate-950" : "hover:text-(--accent)"
                    }`}
                  >
                    {column.name}
                  </button>
                  {column.playerId === state.you ? (
                    <span className="block text-xs font-normal text-(--text-secondary)">{t.you}</span>
                  ) : (
                    isHost && (
                      <button
                        type="button"
                        aria-label={t.kniffel.removeColumn(column.name)}
                        title={t.kniffel.removeColumn(column.name)}
                        onClick={() => remove(column)}
                        className={`mx-auto mt-0.5 flex items-center rounded text-xs ${
                          confirmRemove === column.id
                            ? "bg-red-500 px-1.5 text-white"
                            : "text-(--text-secondary) hover:text-red-500"
                        }`}
                      >
                        {confirmRemove === column.id ? t.kickConfirm : <FiTrash2 aria-hidden="true" />}
                      </button>
                    )
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {UPPER.map(categoryRow)}
            {sumRow(t.kniffel.upperSum, (id) => columnTotals[id].upper)}
            {sumRow(t.kniffel.bonus, (id) => {
              const { upper, bonus } = columnTotals[id];
              const upperDone = UPPER.every((c) => sheet.cells[id]?.[c] !== undefined);
              return bonus || upperDone ? (
                bonus
              ) : (
                <span className="text-xs font-normal text-(--text-secondary)">
                  {t.kniffel.missing(BONUS_THRESHOLD - upper)}
                </span>
              );
            })}
            {sumRow(t.kniffel.upperTotal, (id) => columnTotals[id].upperTotal)}
            {LOWER.map(categoryRow)}
            {sumRow(t.kniffel.lowerSum, (id) => columnTotals[id].lower)}
            {sumRow(t.kniffel.total, (id) => columnTotals[id].total, true)}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-(--text-secondary)">
          {sheet.locked ? t.kniffel.sharedLocked : t.kniffel.shared}
        </p>
      </section>

      <form onSubmit={addColumn} className={`${card} flex gap-2 p-5`}>
        <input
          aria-label={t.kniffel.addPlaceholder}
          className={input}
          value={newName}
          maxLength={16}
          placeholder={t.kniffel.addPlaceholder}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={!newName.trim()} aria-label={t.kniffel.add}>
          <FiUserPlus aria-hidden="true" /> <span className="hidden sm:inline">{t.kniffel.add}</span>
        </Button>
      </form>

      {editing && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setEditing(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.kniffel.categories[editing.category]}
            className={`${card} animate-in w-full max-w-md rounded-b-none p-5 sm:rounded-b-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={eyebrow}>{editing.column.name}</p>
                <h2 className="mt-1 text-xl font-bold">{t.kniffel.categories[editing.category]}</h2>
                <p className="text-sm text-(--text-secondary)">{t.kniffel.hints[editing.category]}</p>
              </div>
              <button
                type="button"
                aria-label={t.kniffel.close}
                onClick={() => setEditing(null)}
                className="rounded-lg p-2 text-(--text-secondary) hover:text-(--text-primary)"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            {editingHint !== undefined && (
              <Button className="mt-5 w-full" onClick={() => choose(editingHint, true)}>
                {t.kniffel.fromDice(editingHint)}
              </Button>
            )}

            <div
              className={`mt-5 grid gap-2 ${
                isUpper(editing.category) ? "grid-cols-3" : FIXED[editing.category] ? "grid-cols-1" : "grid-cols-6"
              }`}
            >
              {allowedValues(editing.category)
                .filter((v) => v > 0)
                .map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => choose(value)}
                    className={`h-11 rounded-lg border font-mono text-sm font-semibold transition ${
                      value === editingValue
                        ? "border-(--accent) bg-(--accent) text-slate-950"
                        : "border-slate-300 hover:border-(--accent) hover:text-(--accent) dark:border-slate-700"
                    }`}
                  >
                    {isUpper(editing.category)
                      ? t.kniffel.times(value / FACE[editing.category], value)
                      : FIXED[editing.category]
                        ? t.kniffel.enter(value)
                        : value}
                  </button>
                ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => choose(0)}
                className={editingValue === 0 ? "border-(--accent)! text-(--accent)!" : ""}
              >
                {t.kniffel.strike}
              </Button>
              <Button variant="secondary" onClick={() => choose(null)} disabled={editingValue === undefined}>
                {t.kniffel.clear}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Kniffel;
