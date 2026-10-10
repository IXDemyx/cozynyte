import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { FaLightbulb, FaPaintBrush } from "react-icons/fa";
import { FiCheck } from "react-icons/fi";
import { DRAW_SIZES } from "../../../../shared/draw";
import type { DrawView, RoomState } from "../../../../shared/types";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import VolumeControl from "../../components/VolumeControl";
import { card, eyebrow } from "../../components/ui";
import { useNow } from "../../hooks/useNow";
import { useLanguage } from "../../lib/i18n";
import { useExtraWide } from "../../lib/pageWidth";
import { socket } from "../../lib/socket";
import { colorOf, PIXEL_HEIGHT, PIXEL_WIDTH } from "./renderer";
import Toolbar from "./Toolbar";
import { useDrawSounds } from "./useDrawSounds";
import { useDrawing, type Tool } from "./useDrawing";

interface DrawRoundProps {
  state: RoomState;
  draw: DrawView;
  offset: number;
}

/** Montagsmaler: Leinwand in der Mitte, Begriff groß darunter, Werkzeuge für den Zeichner. */
function DrawRound({ state, draw, offset }: DrawRoundProps) {
  const { t } = useLanguage();
  const now = useNow(offset);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(1);

  const isDrawer = draw.drawerId === state.you;
  const drawer = state.players.find((p) => p.id === draw.drawerId);
  const guessedMe = draw.guessed.includes(state.you);
  const isAuthor = draw.authorId === state.you && !isDrawer;
  const author = state.players.find((p) => p.id === draw.authorId);
  const canDraw = isDrawer && draw.stage === "drawing";
  const { canvasRef, handlers, undo, clear } = useDrawing({
    turn: draw.turn,
    canDraw,
    tool,
    color,
    size,
  });
  useDrawSounds(state, draw, offset);
  useExtraWide(true);

  // Neuer Zug: wieder mit Stift und Schwarz anfangen.
  useEffect(() => {
    setTool("pen");
    setColor(0);
    setSize(1);
  }, [draw.turn]);

  // Strg/⌘+Z nimmt den letzten Strich zurück.
  useEffect(() => {
    if (!canDraw) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        if (event.target instanceof HTMLInputElement) return;
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const remaining = Math.max(0, draw.endsAt - now);
  const fraction = draw.durationMs > 0 ? Math.min(1, remaining / draw.durationMs) : 0;
  const urgent = draw.stage === "drawing" && remaining < 10_000;

  return (
    <RoomLayout
      state={state}
      players={
        <PlayerList
          state={state}
          title={t.points}
          showScore
          status={(p) =>
            p.id === draw.drawerId && draw.stage !== "reveal" ? (
              <span className="flex items-center gap-1 text-(--accent)">
                <FaPaintBrush aria-hidden="true" className="animate-wiggle" />
                <span className="sr-only">{t.draw.drawer}</span>
              </span>
            ) : p.id === draw.authorId && draw.stage === "drawing" ? (
              <span className="text-amber-400" title={t.draw.author}>
                <FaLightbulb aria-hidden="true" />
                <span className="sr-only">{t.draw.author}</span>
              </span>
            ) : draw.gains?.[p.id] ? (
              <span className="font-mono font-semibold text-(--success)">+{draw.gains[p.id]}</span>
            ) : draw.guessed.includes(p.id) ? (
              <FiCheck aria-label="✓" className="text-(--success)" />
            ) : null
          }
        />
      }
    >
      <section className={`${card} flex min-w-0 flex-col overflow-hidden xl:flex-1`}>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full transition-[width] duration-100 ease-linear ${
              urgent ? "bg-red-500" : "bg-(--accent)"
            }`}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-6">
          {/* Kopf: Runde, Lautstärke und Sekunden. Der Begriff steht groß unter dem Bild. */}
          <div className="flex items-center justify-between gap-4">
            <p className={eyebrow}>{t.draw.round(draw.round, draw.rounds)}</p>
            <div className="flex items-center gap-4">
              <VolumeControl />
              <p
                className={`font-mono text-2xl font-semibold tabular-nums ${urgent ? "text-red-500" : ""}`}
                aria-live="off"
              >
                {Math.ceil(remaining / 1000)}
                <span className="text-sm text-(--text-secondary)">s</span>
              </p>
            </div>
          </div>

          {/* Am Desktop so groß, wie es die Fensterhöhe zulässt (4:3). */}
          <div
            className={`relative mx-auto mt-4 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner dark:border-slate-700 ${
              isDrawer
                ? "xl:max-w-[calc((100dvh-26rem)*4/3)]"
                : "xl:max-w-[calc((100dvh-24rem)*4/3)]"
            }`}
          >
            <canvas
              ref={canvasRef}
              width={PIXEL_WIDTH}
              height={PIXEL_HEIGHT}
              {...handlers}
              className={`block aspect-[4/3] w-full touch-none select-none ${canDraw ? "cursor-none" : ""}`}
            />
            {canDraw && <BrushCursor canvasRef={canvasRef} tool={tool} color={color} size={size} />}

            {draw.stage === "choosing" && (
              <Overlay>
                {isDrawer && draw.choices ? (
                  <>
                    <p className="text-sm font-semibold uppercase tracking-widest text-orange-300">
                      {t.draw.choose}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 sm:mt-5 sm:gap-3">
                      {draw.choices.map((choice, i) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => socket.emit("draw:choose", { index: i })}
                          style={{ animationDelay: `${i * 90}ms` }}
                          className="animate-badge rounded-xl border-2 border-(--accent) bg-slate-950/60 px-3.5 py-2 text-base font-bold sm:px-5 sm:py-3 sm:text-lg text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-(--accent) hover:text-slate-950 active:scale-95"
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 hidden text-xs text-slate-300 sm:block">
                      {t.draw.chooseHint}
                    </p>
                  </>
                ) : (
                  <>
                    <FaPaintBrush
                      aria-hidden="true"
                      className="animate-wiggle text-4xl text-(--accent)"
                    />
                    <p className="mt-4 text-lg font-semibold text-white">
                      {t.draw.choosing(drawer?.name ?? "")}
                    </p>
                  </>
                )}
              </Overlay>
            )}

            {draw.stage === "reveal" && (
              <div className="animate-in absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/60 to-transparent px-4 pb-4 pt-12 text-center">
                {author && (
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-amber-300">
                    <FaLightbulb aria-hidden="true" />
                    {t.draw.by(author.name)}
                  </p>
                )}
                <p className="mt-1 text-sm font-medium text-slate-200">
                  {draw.guessed.length
                    ? `✓ ${t.draw.guessedLabel}: ` +
                      draw.guessed
                        .map((id) => state.players.find((p) => p.id === id)?.name)
                        .filter(Boolean)
                        .join(" · ")
                    : t.draw.nobody}
                </p>
              </div>
            )}
          </div>

          {/* Wer zeichnet, braucht die Werkzeuge direkt am Bild – der Begriff kommt darunter. */}
          {canDraw && (
            <Toolbar
              tool={tool}
              color={color}
              size={size}
              onTool={setTool}
              onColor={setColor}
              onSize={setSize}
              onUndo={undo}
              onClear={clear}
            />
          )}
          <WordBar draw={draw} isDrawer={isDrawer} guessedMe={guessedMe} isAuthor={isAuthor} />
        </div>
      </section>
    </RoomLayout>
  );
}

/**
 * Der Begriff groß unter dem Bild: Lücken mit Hinweis-Buchstaben zum Raten – oder das Wort selbst
 * für alle, die es kennen (Zeichner, Erraten, eigener Begriff, Auflösung).
 */
function WordBar({
  draw,
  isDrawer,
  guessedMe,
  isAuthor,
}: {
  draw: DrawView;
  isDrawer: boolean;
  guessedMe: boolean;
  isAuthor: boolean;
}) {
  const { t } = useLanguage();
  const reveal = draw.stage === "reveal";
  const known = draw.word && (reveal || isDrawer || guessedMe || isAuthor) ? draw.word : "";
  const success = guessedMe && !isDrawer && !reveal;

  // Hinweis-Buchstaben, die schon zu Beginn des Zugs (bzw. beim Laden) da waren, leuchten nicht auf.
  const shown = useRef<{ turn: number; indices: Set<number> } | null>(null);
  if (!shown.current || shown.current.turn !== draw.turn) {
    shown.current = { turn: draw.turn, indices: letterIndices(draw.mask) };
  }
  const seen = shown.current.indices;

  const label = reveal
    ? t.draw.wordWas
    : isDrawer
      ? t.draw.youDraw
      : isAuthor
        ? t.draw.yourWordLabel
        : guessedMe
          ? `✓ ${t.draw.guessedLabel}`
          : null;
  const hint =
    reveal || isDrawer || draw.stage !== "drawing"
      ? null
      : isAuthor
        ? t.draw.yourWord
        : guessedMe
          ? t.draw.waitOthers
          : t.draw.guessHint;
  const letters = draw.mask.replace(/[^_\p{L}\p{N}]/gu, "").length;

  return (
    <div
      className={`mt-4 rounded-xl border-2 px-4 text-center ${
        isDrawer && !reveal ? "py-2.5" : "py-3 sm:py-4"
      } ${
        success
          ? "border-(--success)/50 bg-(--success)/10"
          : "border-(--accent-border) bg-(--accent-soft)"
      }`}
    >
      {draw.stage === "choosing" ? (
        <p className="py-2 text-sm font-semibold text-(--text-secondary)">{t.draw.wordSoon}</p>
      ) : known && isDrawer && !reveal ? (
        <p className="flex flex-col items-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
            {label}
          </span>
          <span
            key={known}
            className="animate-badge mt-0.5 break-words text-2xl font-extrabold tracking-tight text-(--accent) sm:text-3xl"
          >
            {known}
          </span>
        </p>
      ) : known ? (
        <>
          {label && (
            <p
              className={`font-mono text-xs font-semibold uppercase tracking-widest ${
                success ? "text-(--success)" : "text-(--text-secondary)"
              }`}
            >
              {label}
            </p>
          )}
          <p
            key={known}
            className="animate-badge mt-1 break-words text-3xl font-extrabold tracking-tight text-(--accent) sm:text-4xl"
          >
            {known}
          </p>
        </>
      ) : (
        <>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
            {t.draw.letters(letters)}
          </p>
          <div
            className="mt-2 flex flex-wrap items-end justify-center gap-x-1.5 gap-y-2 sm:gap-x-2"
            aria-label={t.draw.letters(letters)}
          >
            {[...draw.mask].map((char, i) =>
              char === " " ? (
                <span key={i} className="w-4 sm:w-6" />
              ) : char === "_" ? (
                <span
                  key={i}
                  className="h-9 w-6 border-b-4 border-(--text-primary) sm:h-11 sm:w-8"
                />
              ) : /[\p{L}\p{N}]/u.test(char) ? (
                <span
                  key={`${i}-${char}`}
                  className={`inline-block h-9 w-6 rounded-t-md border-b-4 border-(--accent) text-center font-mono text-2xl font-bold leading-9 text-(--accent) sm:h-11 sm:w-8 sm:text-3xl sm:leading-[2.75rem] ${
                    seen.has(i) ? "" : "animate-hint"
                  }`}
                >
                  {char}
                </span>
              ) : (
                <span
                  key={i}
                  className="font-mono text-2xl font-bold leading-9 sm:text-3xl sm:leading-[2.75rem]"
                >
                  {char}
                </span>
              ),
            )}
          </div>
        </>
      )}
      {hint && (
        <p
          className={`mt-2 text-sm ${
            success
              ? "font-semibold text-(--success)"
              : isAuthor
                ? "font-semibold text-amber-500"
                : "text-(--text-secondary)"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

/** Positionen der schon sichtbaren Buchstaben in der Maske. */
function letterIndices(mask: string): Set<number> {
  return new Set([...mask].flatMap((char, i) => (/[\p{L}\p{N}]/u.test(char) ? [i] : [])));
}

function Overlay({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_40%,rgba(249,115,22,0.18),transparent_60%),linear-gradient(#17181c,#0f0f10)] p-3 text-center sm:p-6">
      {children}
    </div>
  );
}

/** Pinselvorschau unter dem Mauszeiger: zeigt Farbe und Größe (nur mit Maus/Stift). */
function BrushCursor({
  canvasRef,
  tool,
  color,
  size,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  tool: Tool;
  color: number;
  size: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dot = ref.current;
    if (!canvas || !dot) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      const diameter = tool === "fill" ? 16 : Math.max(6, (DRAW_SIZES[size] * rect.width) / 800);
      dot.style.width = dot.style.height = `${diameter}px`;
      dot.style.transform = `translate(${event.clientX - rect.left - diameter / 2}px, ${
        event.clientY - rect.top - diameter / 2
      }px)`;
      dot.style.opacity = "1";
    };
    const leave = () => (dot.style.opacity = "0");
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    return () => {
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, [canvasRef, tool, size]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 rounded-full border-2 border-slate-900/60 opacity-0 shadow-[0_0_0_1px_rgba(255,255,255,0.8)]"
      style={{
        background:
          tool === "eraser" ? "#ffffff" : tool === "fill" ? "transparent" : colorOf(color),
      }}
    />
  );
}

export default DrawRound;
