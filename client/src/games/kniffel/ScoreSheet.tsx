import type { ReactNode } from "react";
import { FaCrown } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { LuCrown } from "react-icons/lu";
import {
  BONUS_THRESHOLD,
  LOWER,
  UPPER,
  type Category,
  type KniffelColumn,
  type KniffelState,
  type Totals,
} from "../../../../shared/kniffel";
import type { PlayerView } from "../../../../shared/types";
import { card } from "../../components/ui";
import { useConfirm } from "../../hooks/useConfirm";
import { useLanguage } from "../../lib/i18n";
import { socket } from "../../lib/socket";

interface ScoreSheetProps {
  sheet: KniffelState;
  you: string;
  isHost: boolean;
  hostId: string;
  /** Spieler im Raum – wer verbunden ist, kann Host werden. */
  players: PlayerView[];
  columnTotals: Record<string, Totals>;
  canEdit: (column: KniffelColumn) => boolean;
  /** Vorschlag aus den aktuellen Würfeln für ein leeres Feld. */
  suggestion: (columnId: string, category: Category) => number | undefined;
  onEdit: (column: KniffelColumn, category: Category) => void;
  setTurn: (column: string | null) => void;
}

const cellClass =
  "h-10 w-full min-w-14 rounded-md font-mono text-sm tabular-nums transition hover:bg-(--accent-soft)";

/** Der Kniffelblock: eine Spalte pro Spieler, Zeilen für Kategorien und Summen. */
function ScoreSheet({
  sheet,
  you,
  isHost,
  hostId,
  players,
  columnTotals,
  canEdit,
  suggestion,
  onEdit,
  setTurn,
}: ScoreSheetProps) {
  const { t } = useLanguage();
  const { armed, confirm } = useConfirm();

  const remove = (column: KniffelColumn) => {
    if (confirm(column.id)) socket.emit("kniffel:remove", { column: column.id });
  };
  const makeHost = (playerId: string) => {
    if (confirm(`host:${playerId}`)) socket.emit("host:transfer", { playerId });
  };
  const canBecomeHost = (playerId?: string) =>
    Boolean(playerId && players.some((p) => p.id === playerId && p.connected && !p.bot));

  const categoryRow = (category: Category) => (
    <tr key={category} className="border-t border-slate-200 dark:border-slate-800">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-white py-1 pr-3 text-left font-normal dark:bg-(--bg-secondary)"
      >
        <span className="block font-semibold">{t.kniffel.categories[category]}</span>
        <span className="hidden text-xs text-(--text-secondary) sm:block">
          {t.kniffel.hints[category]}
        </span>
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
              onClick={() => onEdit(column, category)}
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
    <tr
      className={`border-t-2 border-slate-300 dark:border-(--accent-border) ${strong ? "text-base" : ""}`}
    >
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

  return (
    <section className={`${card} overflow-x-auto p-3 sm:p-5`}>
      {/* Feste Spaltenbreiten: alle Spieler gleich breit, egal wie lang Namen oder Zahlen sind.
          Bei vielen Spielern wird der Block breiter als der Bildschirm und scrollt seitlich. */}
      <table
        className="w-full table-fixed border-collapse text-sm"
        style={{ minWidth: `calc(9rem + ${sheet.columns.length} * 5.5rem)` }}
      >
        <colgroup>
          <col className="w-36 sm:w-48" />
          {sheet.columns.map((column) => (
            <col key={column.id} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white dark:bg-(--bg-secondary)" />
            {sheet.columns.map((column) => (
              <th key={column.id} scope="col" className="px-1 pb-2 align-bottom">
                {/* Antippen setzt den Zug – nur für den Host. */}
                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => setTurn(column.id)}
                  className={`mx-auto block max-w-full truncate rounded-md px-2 py-0.5 text-sm font-semibold disabled:cursor-default ${
                    column.id === sheet.current
                      ? "bg-(--accent) text-slate-950"
                      : "enabled:hover:text-(--accent)"
                  }`}
                >
                  {column.name}
                </button>
                {column.playerId === you ? (
                  <span className="flex items-center justify-center gap-1 text-xs font-normal text-(--text-secondary)">
                    {t.you}
                    {column.playerId === hostId && (
                      <FaCrown className="text-(--accent)" aria-label="Host" />
                    )}
                  </span>
                ) : (
                  <span className="mt-0.5 flex items-center justify-center gap-1.5">
                    {column.playerId === hostId && (
                      <FaCrown className="text-xs text-(--accent)" aria-label="Host" />
                    )}
                    {isHost && canBecomeHost(column.playerId) && (
                      <button
                        type="button"
                        aria-label={t.makeHost(column.name)}
                        title={t.makeHost(column.name)}
                        onClick={() => makeHost(column.playerId!)}
                        className={`flex items-center rounded text-xs ${
                          armed === `host:${column.playerId}`
                            ? "bg-(--accent) px-1.5 text-slate-950"
                            : "text-(--text-secondary) hover:text-(--accent)"
                        }`}
                      >
                        {armed === `host:${column.playerId}` ? (
                          t.makeHostConfirm
                        ) : (
                          <LuCrown aria-hidden="true" />
                        )}
                      </button>
                    )}
                    {isHost && (
                      <button
                        type="button"
                        aria-label={t.kniffel.removeColumn(column.name)}
                        title={t.kniffel.removeColumn(column.name)}
                        onClick={() => remove(column)}
                        className={`flex items-center rounded text-xs ${
                          armed === column.id
                            ? "bg-red-500 px-1.5 text-white"
                            : "text-(--text-secondary) hover:text-red-500"
                        }`}
                      >
                        {armed === column.id ? t.kickConfirm : <FiTrash2 aria-hidden="true" />}
                      </button>
                    )}
                  </span>
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
  );
}

export default ScoreSheet;
