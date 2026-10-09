import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FiLock, FiRotateCcw, FiUnlock, FiUserPlus, FiVolume2, FiVolumeX } from "react-icons/fi";
import {
  CATEGORIES,
  canEditColumn,
  scoreDice,
  totals,
  type Category,
  type KniffelColumn,
  type KniffelState,
} from "../../../../shared/kniffel";
import type { RoomState } from "../../../../shared/types";
import Button from "../../components/Button";
import InviteButton from "../../components/InviteButton";
import RoomLayout from "../../components/RoomLayout";
import { card, eyebrow, input } from "../../components/ui";
import { useConfirm } from "../../hooks/useConfirm";
import { useSoundEffects } from "../../hooks/useSoundEffects";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";
import DicePanel from "./DicePanel";
import EntryDialog from "./EntryDialog";
import ScoreSheet from "./ScoreSheet";
import { useKniffelSounds } from "./useKniffelSounds";

const EMPTY_SHEET: KniffelState = {
  columns: [],
  cells: {},
  current: null,
  locked: false,
  roll: null,
  lastEntry: null,
};

interface Editing {
  column: KniffelColumn;
  category: Category;
}

/** Kniffel-Raum: Kopfzeile mit Host-Werkzeugen, Würfel, Block und Spieler hinzufügen. */
function Kniffel({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const sheet = state.kniffel ?? EMPTY_SHEET;
  const isHost = state.hostId === state.you;

  const [dice, setDice] = useState<number[]>([]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [newName, setNewName] = useState("");
  const { armed, confirm } = useConfirm();
  const [sounds, setSounds] = useSoundEffects();
  useKniffelSounds(sheet, state.you, sounds);

  const targetId = sheet.current ?? undefined;
  const currentColumn = sheet.columns.find((c) => c.id === targetId);

  // Die eingegebenen Würfel gehören zum aktuellen Zug – wechselt der Zug, sind sie weg.
  useEffect(() => setDice([]), [targetId]);

  const setTurn = (column: string | null) => column && socket.emit("kniffel:turn", { column });

  const { roll } = sheet;
  const rolling = Boolean(roll && roll.count > 0);
  // Digitaler Wurf hat Vorrang vor von Hand eingetippten Würfeln.
  const activeDice = rolling && roll ? roll.dice : dice;
  const diceReady = activeDice.length === 5;
  const canEdit = (column: KniffelColumn) => canEditColumn(sheet, column, state.you);
  const canRoll = Boolean(currentColumn && canEdit(currentColumn));
  const suggestion = (columnId: string, category: Category) =>
    diceReady && columnId === targetId && sheet.cells[columnId]?.[category] === undefined
      ? scoreDice(category, activeDice)
      : undefined;

  const lastColumn = sheet.columns.find((c) => c.id === sheet.lastEntry?.column);
  const undoLabel =
    sheet.lastEntry && lastColumn
      ? t.kniffel.undoWhat(t.kniffel.categories[sheet.lastEntry.category], lastColumn.name)
      : t.kniffel.undo;

  const closeEditor = useCallback(() => setEditing(null), []);

  const choose = (value: number | null, fromDice = false) => {
    if (!editing) return;
    socket.emit("kniffel:set", { column: editing.column.id, category: editing.category, value });
    if (fromDice) setDice([]);
    setEditing(null);
  };

  const addColumn = (event: FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;
    socket.emit("kniffel:add", { name: newName.trim() }, () => setNewName(""));
  };

  const reset = () => {
    if (confirm("reset")) socket.emit("kniffel:reset");
  };

  const columnTotals = Object.fromEntries(
    sheet.columns.map((c) => [c.id, totals(sheet.cells[c.id])]),
  );
  const finished =
    sheet.columns.length > 0 &&
    sheet.columns.every((c) => columnTotals[c.id].filled === CATEGORIES.length);
  const best = Math.max(0, ...sheet.columns.map((c) => columnTotals[c.id].total));
  const winners = sheet.columns.filter((c) => columnTotals[c.id].total === best);

  return (
    <RoomLayout state={state}>
      <div className="animate-in space-y-6">
        <section className={`${card} flex flex-wrap items-center justify-between gap-4 p-5`}>
          <div>
            <p className={eyebrow}>{t.games.kniffel}</p>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.25em] text-(--accent)">
              {state.code}
            </p>
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
            <InviteButton code={state.code} />
            <Button
              variant="secondary"
              size="small"
              title={sounds ? t.audio.effectsOn : t.audio.effectsOff}
              aria-label={t.audio.effectsOn}
              aria-pressed={sounds}
              onClick={() => setSounds(!sounds)}
            >
              {sounds ? <FiVolume2 aria-hidden="true" /> : <FiVolumeX aria-hidden="true" />}
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
                <span
                  className="flex items-center gap-1.5 text-sm text-(--text-secondary)"
                  title={t.kniffel.lockHint}
                >
                  <FiLock aria-hidden="true" /> {t.kniffel.lockOn}
                </span>
              )
            )}
            {isHost && (
              <Button
                variant="secondary"
                size="small"
                onClick={reset}
                className={armed === "reset" ? "border-red-500! text-red-500!" : ""}
              >
                {armed === "reset" ? t.kniffel.newGameConfirm : t.kniffel.newGame}
              </Button>
            )}
          </div>
        </section>

        {finished && (
          <p className="rounded-2xl border border-(--accent) bg-(--accent-soft) p-4 text-center font-semibold">
            {t.kniffel.winner(winners.map((c) => c.name).join(" & "), best)}
          </p>
        )}

        <DicePanel
          sheet={sheet}
          dice={dice}
          setDice={setDice}
          canRoll={canRoll}
          setTurn={setTurn}
        />

        <ScoreSheet
          sheet={sheet}
          you={state.you}
          isHost={isHost}
          columnTotals={columnTotals}
          canEdit={canEdit}
          suggestion={suggestion}
          onEdit={(column, category) => setEditing({ column, category })}
          setTurn={setTurn}
        />

        <form onSubmit={addColumn} className={`${card} flex gap-2 p-5`}>
          <input
            aria-label={t.kniffel.addPlaceholder}
            className={input}
            value={newName}
            maxLength={16}
            placeholder={t.kniffel.addPlaceholder}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={!newName.trim()}
            aria-label={t.kniffel.add}
          >
            <FiUserPlus aria-hidden="true" />{" "}
            <span className="hidden sm:inline">{t.kniffel.add}</span>
          </Button>
        </form>

        {editing && (
          <EntryDialog
            columnName={editing.column.name}
            category={editing.category}
            value={sheet.cells[editing.column.id]?.[editing.category]}
            hint={suggestion(editing.column.id, editing.category)}
            onChoose={choose}
            onClose={closeEditor}
          />
        )}
      </div>
    </RoomLayout>
  );
}

export default Kniffel;
