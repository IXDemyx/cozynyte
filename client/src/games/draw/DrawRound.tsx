import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { FaPaintBrush } from "react-icons/fa";
import { FiCheck } from "react-icons/fi";
import { DRAW_SIZES } from "../../../../shared/draw";
import type { DrawView, RoomState } from "../../../../shared/types";
import PlayerList from "../../components/PlayerList";
import RoomLayout from "../../components/RoomLayout";
import VolumeControl from "../../components/VolumeControl";
import { card, eyebrow } from "../../components/ui";
import { useNow } from "../../hooks/useNow";
import { useLanguage } from "../../lib/i18n";
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

/** Montagsmaler: Leinwand in der Mitte, Begriff oben, Werkzeuge für den Zeichner. */
function DrawRound({ state, draw, offset }: DrawRoundProps) {
  const { t } = useLanguage();
  const now = useNow(offset);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(1);

  const isDrawer = draw.drawerId === state.you;
  const drawer = state.players.find((p) => p.id === draw.drawerId);
  const guessedMe = draw.guessed.includes(state.you);
  const canDraw = isDrawer && draw.stage === "drawing";
  const { canvasRef, handlers, undo, clear } = useDrawing({
    turn: draw.turn,
    canDraw,
    tool,
    color,
    size,
  });
  useDrawSounds(state, draw, offset);

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
  const word = draw.word ?? (draw.stage === "drawing" ? undefined : "");

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
          {/* Kopf: Runde, Begriff (bzw. Lücken), Lautstärke und Sekunden. */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 sm:grid-cols-[1fr_auto_1fr]">
            <p className={eyebrow}>{t.draw.round(draw.round, draw.rounds)}</p>
            <div className="col-span-2 row-start-2 flex justify-center sm:col-span-1 sm:col-start-2 sm:row-start-1">
              <WordDisplay draw={draw} word={word} isDrawer={isDrawer} />
            </div>
            <div className="flex items-center justify-end gap-4">
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

          <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner dark:border-slate-700">
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
              <div className="animate-in absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/75 to-transparent px-4 pb-5 pt-16 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-orange-300">
                  {t.draw.wordWas}
                </p>
                <p className="animate-badge mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {draw.word}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {draw.guessed.length
                    ? draw.guessed
                        .map((id) => state.players.find((p) => p.id === id)?.name)
                        .filter(Boolean)
                        .join(" · ")
                    : t.draw.nobody}
                </p>
              </div>
            )}
          </div>

          {canDraw ? (
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
          ) : (
            draw.stage === "drawing" &&
            !isDrawer && (
              <p
                className={`mt-4 text-center text-sm ${
                  guessedMe ? "font-semibold text-(--success)" : "text-(--text-secondary)"
                }`}
              >
                {guessedMe ? t.draw.youGuessed : t.draw.guessHint}
              </p>
            )
          )}
        </div>
      </section>
    </RoomLayout>
  );
}

/** Begriff für den Zeichner (und wer ihn erraten hat), sonst Lücken mit Hinweis-Buchstaben. */
function WordDisplay({
  draw,
  word,
  isDrawer,
}: {
  draw: DrawView;
  word: string | undefined;
  isDrawer: boolean;
}) {
  const { t } = useLanguage();
  if (draw.stage === "choosing") return null;
  if (word) {
    return (
      <p key={word} className="animate-badge text-center">
        {isDrawer && draw.stage === "drawing" && (
          <span className="block font-mono text-[10px] uppercase tracking-widest text-(--text-secondary)">
            {t.draw.youDraw}
          </span>
        )}
        <span className="text-2xl font-extrabold tracking-tight text-(--accent)">{word}</span>
      </p>
    );
  }
  const letters = draw.mask.replace(/[^_\p{L}\p{N}]/gu, "").length;
  return (
    <div className="flex flex-col items-center" aria-label={t.draw.letters(letters)}>
      <div className="flex flex-wrap items-end justify-center gap-1">
        {[...draw.mask].map((char, i) =>
          char === " " ? (
            <span key={i} className="w-3" />
          ) : char === "_" ? (
            <span key={i} className="h-7 w-4 border-b-[3px] border-(--text-primary) sm:w-5" />
          ) : /[\p{L}\p{N}]/u.test(char) ? (
            <span
              key={`${i}-${char}`}
              className="animate-letter inline-block w-4 border-b-[3px] border-(--accent) text-center font-mono text-xl font-bold leading-7 text-(--accent) sm:w-5"
            >
              {char}
            </span>
          ) : (
            <span key={i} className="font-mono text-xl font-bold leading-7">
              {char}
            </span>
          ),
        )}
      </div>
      <span className="mt-1 font-mono text-[10px] text-(--text-secondary)">{letters}</span>
    </div>
  );
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
