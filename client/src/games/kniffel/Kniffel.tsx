import { useEffect, useState, type FormEvent } from "react";
import {
  FiGlobe,
  FiLock,
  FiMessageSquare,
  FiMoreHorizontal,
  FiRotateCcw,
  FiUnlock,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { createPortal } from "react-dom";
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
import RoomChat from "../../components/RoomChat";
import RoomLayout from "../../components/RoomLayout";
import { card, eyebrow, input } from "../../components/ui";
import { useConfirm } from "../../hooks/useConfirm";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useExtraWide } from "../../lib/pageWidth";
import VolumeControl from "../../components/VolumeControl";
import { usePlayback } from "../../hooks/useVolume";
import { Confetti } from "../../components/Podium";
import { useLanguage } from "../../lib/i18n";
import { startMusic, stopMusic } from "../../lib/music";
import { socket } from "../../lib/socket";
import DicePanel from "./DicePanel";
import ScoreSheet from "./ScoreSheet";
import { findCombo } from "./combos";
import { useKniffelSounds } from "./useKniffelSounds";
import { useRollAnimation } from "./useRollAnimation";

const EMPTY_SHEET: KniffelState = {
  columns: [],
  cells: {},
  current: null,
  locked: false,
  roll: null,
  lastEntry: null,
};

/** Kniffel-Raum: Kopfzeile mit Host-Werkzeugen, Würfel, Block und Spieler hinzufügen. */
function Kniffel({ state }: { state: RoomState }) {
  const { t } = useLanguage();
  const sheet = state.kniffel ?? EMPTY_SHEET;
  const isHost = state.hostId === state.you;

  const [dice, setDice] = useState<number[]>([]);
  const [newName, setNewName] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const { armed, confirm } = useConfirm();
  // Breiter Bildschirm: Block in der Mitte, Würfel und Werkzeuge rechts, Chat zum Aufklappen –
  // so passt alles ohne Scrollen auf den Bildschirm.
  const desktop = useMediaQuery("(min-width: 1280px)");
  // Handy (und schmale Fenster): kompakter Kopf, schmaler Block, Chat als Knopf.
  const mobile = !useMediaQuery("(min-width: 1024px)");
  const [moreOpen, setMoreOpen] = useState(false);
  // Auf großen Bildschirmen die volle Breite nutzen – Platz für viele Spalten.
  useExtraWide(desktop);
  // Lautstärke wie in den anderen Spielen (gemeinsamer Regler); stumm = keine Soundeffekte.
  const playback = usePlayback();
  const sounds = !playback.muted && playback.volume > 0;
  // Entspannte Hintergrundmusik (über das Noten-Symbol neben dem Regler).
  useEffect(() => {
    if (!playback.chill) return;
    startMusic(playback.track);
    return stopMusic;
  }, [playback.chill, playback.track]);
  useKniffelSounds(sheet, state.you, sounds);

  const targetId = sheet.current ?? undefined;
  const currentColumn = sheet.columns.find((c) => c.id === targetId);

  // Die eingegebenen Würfel gehören zum aktuellen Zug – wechselt der Zug, sind sie weg.
  useEffect(() => setDice([]), [targetId]);

  const setTurn = (column: string | null) => column && socket.emit("kniffel:turn", { column });

  const { roll } = sheet;
  const rolling = Boolean(roll && roll.count > 0);
  // Zeitlupe bei fast großer Straße nur, wenn das Feld beim Spieler am Zug noch frei ist.
  const straightDone = targetId !== undefined && sheet.cells[targetId]?.largeStraight !== undefined;
  const animation = useRollAnimation(roll, sounds, straightDone);
  // Digitaler Wurf hat Vorrang vor von Hand eingetippten Würfeln.
  const activeDice = rolling && roll ? roll.dice : dice;
  const diceReady = activeDice.length === 5;
  const canEdit = (column: KniffelColumn) => canEditColumn(sheet, column, state.you, isHost);
  const canRoll = Boolean(currentColumn && canEdit(currentColumn));
  // Vorschläge im Block erst, wenn alle Würfel liegen – sonst verrät die Tabelle den Wurf.
  const suggestion = (columnId: string, category: Category) =>
    diceReady &&
    (!rolling || animation.settled) &&
    columnId === targetId &&
    sheet.cells[columnId]?.[category] === undefined
      ? scoreDice(category, activeDice)
      : undefined;

  const lastColumn = sheet.columns.find((c) => c.id === sheet.lastEntry?.column);
  const undoLabel =
    sheet.lastEntry && lastColumn
      ? t.kniffel.undoWhat(t.kniffel.categories[sheet.lastEntry.category], lastColumn.name)
      : t.kniffel.undo;

  // Direkt im Block eintragen; kam der Wert aus von Hand eingetippten Würfeln, sind die verbraucht.
  const write = (
    column: KniffelColumn,
    category: Category,
    value: number | null,
    fromDice = false,
  ) => {
    socket.emit("kniffel:set", { column: column.id, category, value });
    if (fromDice) setDice([]);
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

  // Häufig gebraucht: Rückgängig und Einladungslink.
  const mainTools = (
    <>
      <Button
        variant="secondary"
        size="small"
        title={undoLabel}
        aria-label={undoLabel}
        disabled={!lastColumn || !canEdit(lastColumn) || sheet.strict}
        onClick={() => socket.emit("kniffel:undo")}
      >
        <FiRotateCcw aria-hidden="true" /> {t.kniffel.undo}
      </Button>
      <InviteButton code={state.code} short={desktop || mobile} />
    </>
  );

  // Seltener gebraucht: Lautstärke, Spalten sperren, neues Spiel (am Handy unter „Mehr“).
  const moreTools = (
    <>
      <div className="flex h-9 items-center rounded-lg border border-slate-300 px-2 dark:border-slate-700">
        <VolumeControl music />
      </div>
      {isHost ? (
        <Button
          variant="secondary"
          size="small"
          title={state.settings.isPublic ? t.lobby.publicHint : t.lobby.privateHint}
          aria-pressed={state.settings.isPublic}
          onClick={() => socket.emit("settings:update", { isPublic: !state.settings.isPublic })}
          className={state.settings.isPublic ? "border-(--accent)! text-(--accent)!" : ""}
        >
          <FiGlobe aria-hidden="true" />
          <span className={desktop ? "sr-only" : undefined}>
            {state.settings.isPublic ? t.kniffel.publicOn : t.kniffel.publicOff}
          </span>
        </Button>
      ) : (
        state.settings.isPublic && (
          <span
            className="flex items-center gap-1.5 text-sm text-(--text-secondary)"
            title={t.lobby.publicHint}
          >
            <FiGlobe aria-hidden="true" /> {t.kniffel.publicOn}
          </span>
        )
      )}
      {isHost ? (
        <Button
          variant="secondary"
          size="small"
          title={sheet.strict ? t.kniffel.lockedPublic : t.kniffel.lockHint}
          aria-pressed={sheet.locked}
          disabled={sheet.strict}
          onClick={() => socket.emit("kniffel:lock", { locked: !sheet.locked })}
          className={sheet.locked ? "border-(--accent)! text-(--accent)!" : ""}
        >
          {sheet.locked ? <FiLock aria-hidden="true" /> : <FiUnlock aria-hidden="true" />}
          {/* In der schmalen Desktop-Spalte nur das Schloss (Text im Tooltip). */}
          <span className={desktop ? "sr-only" : undefined}>
            {sheet.locked ? t.kniffel.lockOn : t.kniffel.lockOff}
          </span>
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
    </>
  );

  const tools = (
    <>
      {mainTools}
      {moreTools}
    </>
  );

  const dicePanel = (
    <DicePanel
      sheet={sheet}
      dice={dice}
      setDice={setDice}
      canRoll={canRoll}
      setTurn={setTurn}
      sounds={sounds}
      isHost={isHost}
      animation={animation}
      compact={desktop || mobile}
    />
  );

  // Öffentliche Räume: Spieler ohne Handy trägt nur der Host ein.
  const addForm = !sheet.strict || isHost ? (
    <form
      onSubmit={addColumn}
      className={`${card} flex gap-2 ${desktop || mobile ? "p-4" : "p-5"}`}
    >
      <input
        aria-label={t.kniffel.addPlaceholder}
        className={`${input} ${desktop || mobile ? "py-2" : ""}`}
        value={newName}
        maxLength={16}
        placeholder={t.kniffel.addPlaceholder}
        onChange={(e) => setNewName(e.target.value)}
      />
      <Button
        type="submit"
        variant="secondary"
        size={desktop || mobile ? "small" : "default"}
        disabled={!newName.trim()}
        aria-label={t.kniffel.add}
      >
        <FiUserPlus aria-hidden="true" />{" "}
        <span className={desktop ? "sr-only" : "hidden sm:inline"}>{t.kniffel.add}</span>
      </Button>
    </form>
  ) : null;

  const winnerBanner = finished && (
    <p className="rounded-2xl border border-(--accent) bg-(--accent-soft) p-4 text-center font-semibold">
      {t.kniffel.winner(winners.map((c) => c.name).join(" & "), best)}
    </p>
  );

  // Die Kniffel-Spannung und das Konfetti auch am Block – nicht nur im Würfelbereich.
  const almostKniffel = animation.suspenseKind === "kniffel";
  const kniffelHit =
    rolling &&
    roll &&
    animation.settled &&
    animation.live &&
    findCombo(roll.dice)?.combo === "kniffel"
      ? `${roll.count}:${roll.dice.join("")}`
      : "";

  const scoreSheet = (
    <div className={`relative rounded-2xl ${almostKniffel ? "animate-tension" : ""}`}>
      <ScoreSheet
        sheet={sheet}
        you={state.you}
        isHost={isHost}
        hostId={state.hostId}
        players={state.players}
        columnTotals={columnTotals}
        canEdit={canEdit}
        suggestion={suggestion}
        onWrite={write}
        setTurn={setTurn}
        variant={desktop ? "desktop" : mobile ? "mobile" : "regular"}
      />
      {kniffelHit && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <Confetti key={kniffelHit} delay={0} />
        </div>
      )}
    </div>
  );

  if (desktop) {
    return (
      <RoomLayout
        state={state}
        side={
          <>
            <section className={`${card} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={eyebrow}>{t.games.kniffel}</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.25em] text-(--accent)">
                    {state.code}
                  </p>
                </div>
                <ChatToggle state={state} open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">{tools}</div>
            </section>
            {dicePanel}
            {addForm}
            {chatOpen && <ChatDrawer state={state} onClose={() => setChatOpen(false)} />}
          </>
        }
      >
        <div className="animate-in space-y-4">
          {winnerBanner}
          {scoreSheet}
        </div>
      </RoomLayout>
    );
  }

  if (mobile) {
    return (
      <RoomLayout state={state} chat={false}>
        <div className="animate-in space-y-4">
          <section className={`${card} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={eyebrow}>{t.games.kniffel}</p>
                <p className="mt-0.5 font-mono text-2xl font-semibold tracking-[0.25em] text-(--accent)">
                  {state.code}
                </p>
              </div>
              <div className="flex gap-2">
                <ChatToggle state={state} open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />
                <Button
                  variant="secondary"
                  size="small"
                  aria-expanded={moreOpen}
                  aria-label={t.kniffel.more}
                  onClick={() => setMoreOpen((o) => !o)}
                  className={moreOpen ? "border-(--accent)! text-(--accent)!" : ""}
                >
                  <FiMoreHorizontal aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">{mainTools}</div>
            {moreOpen && (
              <div className="animate-in mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-(--accent-soft)">
                {moreTools}
              </div>
            )}
          </section>
          {winnerBanner}
          {dicePanel}
          {scoreSheet}
          {addForm}
        </div>
        {chatOpen && <ChatSheet state={state} onClose={() => setChatOpen(false)} />}
      </RoomLayout>
    );
  }

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
          <div className="flex flex-wrap gap-2">{tools}</div>
        </section>
        {winnerBanner}
        {dicePanel}
        {scoreSheet}
        {addForm}
      </div>
    </RoomLayout>
  );
}

/** Knopf zum Chat (Desktop): zeigt, wie viele neue Nachrichten seit dem letzten Blick da sind. */
function ChatToggle({
  state,
  open,
  onToggle,
}: {
  state: RoomState;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();
  const lastId = state.chat[state.chat.length - 1]?.id ?? 0;
  // Was beim Laden schon da war, gilt als gelesen.
  const [seen, setSeen] = useState(lastId);
  useEffect(() => {
    if (open) setSeen(lastId);
  }, [open, lastId]);
  const unread = open
    ? 0
    : state.chat.filter((m) => m.id > seen && m.playerId !== state.you).length;

  return (
    <Button
      variant="secondary"
      size="small"
      aria-pressed={open}
      onClick={onToggle}
      className={`relative ${open ? "border-(--accent)! text-(--accent)!" : ""}`}
    >
      <FiMessageSquare aria-hidden="true" /> {t.chat.title}
      {unread > 0 && (
        <span className="animate-badge absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-(--accent) px-1 font-mono text-xs font-bold text-(--on-accent)">
          {unread}
        </span>
      )}
    </Button>
  );
}

/** Aufgeklappter Chat – liegt genau über der rechten Spalte (Würfel und Werkzeuge). Esc schließt ihn. */
function ChatDrawer({ state, onClose }: { state: RoomState; onClose: () => void }) {
  const { t } = useLanguage();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    // Genau so groß wie die rechte Spalte darunter (Werkzeuge, Würfel, Spieler ohne Handy).
    <div className="animate-in absolute inset-0 z-30 mt-0! min-h-80 rounded-2xl shadow-2xl">
      <RoomChat state={state} fill />
      <button
        type="button"
        onClick={onClose}
        aria-label={t.kniffel.closeChat}
        className="absolute right-4 top-4 rounded-md p-1 text-(--text-secondary) hover:text-(--accent)"
      >
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Chat am Handy: Blatt von unten über dem Spiel (per Portal an <body>, sonst richtet „fixed“ sich
 * an animierten Eltern aus). Antippen daneben oder Esc schließt.
 */
function ChatSheet({ state, onClose }: { state: RoomState; onClose: () => void }) {
  const { t } = useLanguage();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="animate-in relative h-[70dvh] w-full"
        onClick={(event) => event.stopPropagation()}
      >
        <RoomChat state={state} fill />
        <button
          type="button"
          onClick={onClose}
          aria-label={t.kniffel.closeChat}
          className="absolute right-4 top-4 rounded-md p-1 text-(--text-secondary) hover:text-(--accent)"
        >
          <FiX aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default Kniffel;
