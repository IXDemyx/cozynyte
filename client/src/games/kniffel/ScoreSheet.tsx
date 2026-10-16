import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { FaCrown } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { LuCrown } from "react-icons/lu";
import {
  BONUS_THRESHOLD,
  allowedValues,
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
  /** Wert eintragen (0 = streichen, null = leeren); `fromDice` = Vorschlag aus den Würfeln. */
  onWrite: (
    column: KniffelColumn,
    category: Category,
    value: number | null,
    fromDice?: boolean,
  ) => void;
  setTurn: (column: string | null) => void;
  /**
   * desktop: flache Zeilen, die mit der Fensterhöhe wachsen – der ganze Block passt ohne Scrollen
   * auf den Bildschirm. mobile: schmale Spalten (bis vier Spieler ohne seitliches Scrollen),
   * gut antippbare Felder. In beiden stehen die Erklärungen („nur Einser zählen“) im Tooltip.
   */
  variant?: "regular" | "desktop" | "mobile";
}

const cellClass =
  // block statt inline: sonst rutscht das Feld durch die Textgrundlinie der Zelle nach oben.
  "block w-full rounded-md font-mono text-sm tabular-nums transition hover:bg-(--accent-soft)";

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
  onWrite,
  setTurn,
  variant = "regular",
}: ScoreSheetProps) {
  const desktop = variant === "desktop";
  const mobile = variant === "mobile";
  const tight = desktop || mobile;
  const { t } = useLanguage();
  const { armed, confirm } = useConfirm();
  // Viele Spieler am Desktop (oder Handy): schmale Spalten mit kleinerer Schrift im Kopf.
  const narrow = (desktop && sheet.columns.length > 6) || mobile;
  const cellPad = narrow ? "px-0.5" : "px-1";
  // Feste erste Spalte beim seitlichen Scrollen. Ein Streifen nach links in Kartenfarbe deckt den
  // Innenabstand der Karte ab – sonst schauen dort die weggescrollten Zahlen hervor.
  const stickyCol =
    "sticky left-0 z-10 bg-(--surface) before:absolute before:inset-y-0 before:right-full before:w-5 before:bg-(--surface) dark:before:bg-(--bg-secondary) after:pointer-events-none after:absolute after:inset-y-0 after:left-full after:w-4 after:bg-linear-to-r after:from-(--surface) after:from-40% after:to-transparent after:opacity-0 after:transition-opacity group-data-[scrolled=true]/sheet:after:opacity-100 dark:after:from-(--bg-secondary)";
  // Feld, das gerade von Hand bearbeitet wird („spalte:kategorie“).
  const [editing, setEditing] = useState<string | null>(null);
  // Der weiche Übergang an der Namensspalte nur, wenn wirklich etwas darunter durchgescrollt ist.
  const [scrolled, setScrolled] = useState(false);

  /**
   * Antippen: Mit Würfeln steht der Wert fest – direkt eintragen. Ohne Würfel (oder zum
   * Korrigieren) wird das Feld zum Eingabefeld.
   */
  const tap = (column: KniffelColumn, category: Category, value: number | undefined) => {
    const hint = suggestion(column.id, category);
    if (value === undefined && hint !== undefined) onWrite(column, category, hint, true);
    else setEditing(`${column.id}:${category}`);
  };

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
        title={tight ? t.kniffel.hints[category] : undefined}
        className={`${stickyCol} pr-3 text-left font-normal dark:bg-(--bg-secondary) ${
          desktop ? "whitespace-nowrap py-px leading-5" : mobile ? "py-1 leading-tight" : "py-1"
        }`}
      >
        <span className="block font-semibold">{t.kniffel.categories[category]}</span>
        {!tight && (
          <span className="hidden text-xs text-(--text-secondary) sm:block">
            {t.kniffel.hints[category]}
          </span>
        )}
      </th>
      {sheet.columns.map((column) => {
        const value = sheet.cells[column.id]?.[category];
        const hint = suggestion(column.id, category);
        // Desktop: so hoch, wie es die Fensterhöhe zulässt (zwischen 22 und 40 px, dazu etwas Luft zu den Trennlinien) – auf kleinen
        // Laptops passt der Block noch ganz drauf, auf großen Bildschirmen wirkt er nicht gequetscht.
        const height = desktop
          ? "h-[clamp(1.375rem,calc((100dvh-19rem)/18-0.5rem),2.5rem)]"
          : mobile
            ? "h-9"
            : "h-10";
        return (
          <td key={column.id} className={`${cellPad} py-1 text-center`}>
            {editing === `${column.id}:${category}` && canEdit(column) ? (
              <CellInput
                category={category}
                label={t.kniffel.cellInput(t.kniffel.categories[category], column.name)}
                value={value}
                className={`${cellClass} ${height}`}
                onDone={(next) => {
                  setEditing(null);
                  if (next !== undefined && next !== value) onWrite(column, category, next);
                }}
              />
            ) : (
              <button
                type="button"
                aria-label={`${t.kniffel.categories[category]}, ${column.name}`}
                disabled={!canEdit(column)}
                onClick={() => tap(column, category, value)}
                className={`${cellClass} ${height} ${
                  value !== undefined
                    ? `font-semibold ${value === 0 ? "text-(--text-secondary) line-through" : ""}`
                    : hint !== undefined
                      ? "border border-dashed border-(--accent-border) text-(--accent)"
                      : "border border-slate-200 text-(--text-secondary) dark:border-slate-800"
                } ${canEdit(column) ? "" : "cursor-default opacity-70 hover:bg-transparent"}`}
              >
                {value ?? hint ?? ""}
              </button>
            )}
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
        className={`${stickyCol} pr-3 text-left dark:bg-(--bg-secondary) ${desktop ? "whitespace-nowrap py-0.5" : mobile ? "py-1.5 leading-tight" : "py-2"} ${
          strong ? "font-bold text-(--accent)" : "font-semibold text-(--text-secondary)"
        }`}
      >
        {label}
      </th>
      {sheet.columns.map((column) => (
        <td
          key={column.id}
          className={`${cellPad} text-center font-mono tabular-nums ${desktop ? "py-0.5" : mobile ? "py-1.5" : "py-2"} ${strong ? "font-bold text-(--accent)" : "font-semibold"}`}
        >
          {render(column.id)}
        </td>
      ))}
    </tr>
  );

  return (
    <section
      data-scrolled={scrolled}
      onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 2)}
      className={`${card} group/sheet overflow-x-auto ${desktop ? "px-5 py-4" : mobile ? "px-3 py-3" : "p-3 sm:p-5"}`}
    >
      {/* Feste Spaltenbreiten: alle Spieler gleich breit, egal wie lang Namen oder Zahlen sind.
          Bei vielen Spielern wird der Block breiter als der Bildschirm und scrollt seitlich. */}
      <table
        className="mx-auto w-full table-fixed border-collapse text-sm"
        // Desktop: Spalten werden schmaler statt seitlich zu scrollen – auch 16 Spieler passen.
        style={{
          minWidth: desktop
            ? `calc(8rem + ${sheet.columns.length} * 2.6rem)`
            : mobile
              ? `calc(6.5rem + ${sheet.columns.length} * 3.25rem)`
              : `calc(9rem + ${sheet.columns.length} * 5.5rem)`,
          // Wenige Spieler: Spalten nicht endlos breit ziehen – der Block bleibt kompakt in der Mitte.
          maxWidth: desktop
            ? `calc(10rem + ${sheet.columns.length} * 8rem)`
            : mobile
              ? undefined
              : `calc(12rem + ${sheet.columns.length} * 9rem)`,
        }}
      >
        <colgroup>
          <col
            className={
              desktop ? (narrow ? "w-32" : "w-40") : mobile ? "w-[6.5rem]" : "w-36 sm:w-48"
            }
          />
          {sheet.columns.map((column) => (
            <col key={column.id} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className={`${stickyCol} dark:bg-(--bg-secondary)`} />
            {sheet.columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={`${cellPad} align-bottom ${tight ? "pb-1" : "pb-2"}`}
              >
                {/* Antippen setzt den Zug – nur für den Host. */}
                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => setTurn(column.id)}
                  title={column.name}
                  className={`mx-auto block max-w-full truncate rounded-md py-0.5 font-semibold disabled:cursor-default ${
                    narrow ? "px-1 text-xs" : "px-2 text-sm"
                  } ${
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
                {/* Schmale Spalten: nur „−29“, der ganze Text steht im Tooltip. */}
                {narrow ? (
                  <span title={t.kniffel.missing(BONUS_THRESHOLD - upper)}>
                    −{BONUS_THRESHOLD - upper}
                  </span>
                ) : (
                  t.kniffel.missing(BONUS_THRESHOLD - upper)
                )}
              </span>
            );
          })}
          {sumRow(t.kniffel.upperTotal, (id) => columnTotals[id].upperTotal)}
          {LOWER.map(categoryRow)}
          {sumRow(t.kniffel.lowerSum, (id) => columnTotals[id].lower)}
          {sumRow(t.kniffel.total, (id) => columnTotals[id].total, true)}
        </tbody>
      </table>
      <p className={`${tight ? "mt-2" : "mt-3"} text-xs text-(--text-secondary)`}>
        {sheet.locked ? t.kniffel.sharedLocked : t.kniffel.shared}
      </p>
    </section>
  );
}

/**
 * Feld zum Eintippen der Punkte. Enter (oder Wegklicken) speichert, leer = Eintrag löschen,
 * 0 = streichen, Esc bricht ab. Unmögliche Werte (z. B. 7 bei den Dreiern) werden nicht angenommen.
 */
function CellInput({
  category,
  label,
  value,
  className,
  onDone,
}: {
  category: Category;
  label: string;
  value: number | undefined;
  className: string;
  /** undefined = nichts ändern, null = leeren, Zahl = eintragen. */
  onDone: (value: number | null | undefined) => void;
}) {
  const { t } = useLanguage();
  const [text, setText] = useState(value === undefined ? "" : String(value));
  const [invalid, setInvalid] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    field.current?.focus();
    field.current?.select();
  }, []);

  const finish = (result: number | null | undefined) => {
    if (done.current) return;
    done.current = true;
    onDone(result);
  };

  /** Eingabe prüfen: true = fertig (gespeichert oder nichts zu tun). */
  const commit = (): boolean => {
    const trimmed = text.trim();
    if (!trimmed) {
      finish(value === undefined ? undefined : null);
      return true;
    }
    const number = Number(trimmed);
    if (Number.isInteger(number) && allowedValues(category).includes(number)) {
      finish(number);
      return true;
    }
    setInvalid(true);
    return false;
  };

  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      finish(undefined);
    }
  };

  return (
    <input
      ref={field}
      aria-label={label}
      title={t.kniffel.cellHelp}
      inputMode="numeric"
      enterKeyHint="done"
      autoComplete="off"
      maxLength={2}
      value={text}
      placeholder={t.kniffel.cellPlaceholder}
      onChange={(e) => {
        setText(e.target.value.replace(/[^0-9]/g, ""));
        setInvalid(false);
      }}
      onKeyDown={onKey}
      // Wegklicken: gültige Eingabe speichern, sonst einfach abbrechen.
      onBlur={() => {
        if (!commit()) finish(undefined);
      }}
      className={`${className} border-2 bg-(--bg-primary) text-center font-semibold text-(--text-primary) outline-none placeholder:text-xs placeholder:font-normal placeholder:text-(--text-secondary) ${
        invalid ? "animate-shake border-red-500" : "border-(--accent)"
      }`}
    />
  );
}

export default ScoreSheet;
