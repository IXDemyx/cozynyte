import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent,
  type SetStateAction,
} from "react";
import { FiSkipForward } from "react-icons/fi";
import { MAX_ROLLS, nextTurn, type KniffelState } from "../../../../shared/kniffel";
import Button from "../../components/Button";
import { Confetti } from "../../components/Podium";
import { card } from "../../components/ui";
import { useLanguage } from "../../lib/i18n";
import { playEffect } from "../../lib/sounds";
import { socket } from "../../lib/socket";
import { findCombo } from "./combos";
import Die from "./Die";
import type { useRollAnimation } from "./useRollAnimation";

interface DicePanelProps {
  sheet: KniffelState;
  /** Von Hand eingetippte echte Würfel (nur auf diesem Gerät). */
  dice: number[];
  setDice: Dispatch<SetStateAction<number[]>>;
  /** Darf dieses Gerät für den Spieler am Zug würfeln? */
  canRoll: boolean;
  setTurn: (column: string | null) => void;
  /** Nur der Host darf von Hand festlegen, wer dran ist. */
  isHost: boolean;
  /** Soundeffekte an (Schalter im Kniffel-Raum). */
  sounds: boolean;
  /** Stand der Würfelanimation (liegt im Kniffel-Raum, damit der Block auf sie warten kann). */
  animation: ReturnType<typeof useRollAnimation>;
}

/** Alle so viele ms klappert es beim Schütteln (und vibriert das Handy kurz). */
const RATTLE_MS = 130;

/** Wer ist dran, echte Würfel eintippen oder digital würfeln. */
function DicePanel({
  sheet,
  dice,
  setDice,
  canRoll,
  setTurn,
  sounds,
  isHost,
  animation,
}: DicePanelProps) {
  const { t } = useLanguage();
  const current = sheet.columns.find((c) => c.id === sheet.current);
  const { roll } = sheet;
  const rolling = Boolean(roll && roll.count > 0);
  const rollsLeft = MAX_ROLLS - (roll?.count ?? 0);
  const { faces, landed, settled, live, suspense, suspenseKind } = animation;
  // Kurz vor dem Kniffel: alles auf Spannung – Bereich glüht, die vier gleichen pochen.
  const almostKniffel = suspenseKind === "kniffel";
  const canThrow = canRoll && rollsLeft > 0 && dice.length === 0 && settled;

  // Würfelbecher: gedrückt halten = schütteln (klappert, vibriert), loslassen = werfen.
  // Wie lange geschüttelt wurde, macht nur die Animation wilder – würfeln tut der Server.
  const [shaking, setShaking] = useState(false);
  // Beim Schütteln zeigen die losen Würfel wechselnde Augen – wie im Becher.
  const [shakeFaces, setShakeFaces] = useState<number[]>([]);
  const shakeStart = useRef(0);
  const rattle = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => () => clearInterval(rattle.current), []);

  const startShake = (event: PointerEvent<HTMLButtonElement>) => {
    if (!canThrow || shaking || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    shakeStart.current = performance.now();
    setShaking(true);
    const tick = () => {
      setShakeFaces(Array.from({ length: 5 }, () => 1 + Math.floor(Math.random() * 6)));
      if (sounds) playEffect("shake");
      navigator.vibrate?.(25);
    };
    tick();
    rattle.current = setInterval(tick, RATTLE_MS);
  };
  const throwDice = () => {
    if (!shaking) return;
    clearInterval(rattle.current);
    setShaking(false);
    socket.emit("kniffel:roll", { shake: performance.now() - shakeStart.current });
  };
  // Besonderer Wurf? Erst zeigen, wenn alle Würfel liegen.
  const found = rolling && settled && roll ? findCombo(roll.dice) : null;
  const highlight = new Set(found?.dice);
  const comboKey = found && roll ? `${roll.count}:${roll.dice.join("")}` : "";
  const isKniffel = found?.combo === "kniffel";

  // Der Würfelbereich behält im Zug die Höhe der Würfel-Eingabe, damit der Becher-Knopf nach dem
  // ersten Wurf nicht nach oben springt (gerade am Handy landet der Finger sonst daneben).
  const area = useRef<HTMLDivElement>(null);
  const inputHeight = useRef(0);
  const [areaMin, setAreaMin] = useState<number>();
  useEffect(() => {
    const el = area.current;
    if (rolling || !el) return;
    const observer = new ResizeObserver(() => (inputHeight.current = el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [rolling]);
  useLayoutEffect(() => {
    setAreaMin(rolling && inputHeight.current ? inputHeight.current : undefined);
  }, [rolling]);

  // Klang zum besonderen Wurf – nur bei einem live miterlebten Wurf, einmal pro Wurf.
  const lastCombo = useRef("");
  useEffect(() => {
    if (!comboKey || !live || comboKey === lastCombo.current) return;
    lastCombo.current = comboKey;
    if (sounds) playEffect(isKniffel ? "kniffel" : "combo");
    // Kniffel! Der Tisch applaudiert.
    if (sounds && isKniffel) setTimeout(() => playEffect("applause"), 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comboKey, live]);

  return (
    <section
      className={`${card} relative overflow-hidden p-5 transition ${almostKniffel ? "animate-tension" : ""}`}
    >
      {isKniffel && live && <Confetti key={comboKey} delay={0} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          {current ? (
            <span className="text-(--accent)">{t.kniffel.turnOf(current.name)}</span>
          ) : (
            t.kniffel.dice
          )}
        </h2>
        {/* Wer dran ist, legt nur der Host von Hand fest – sonst geht es automatisch weiter. */}
        {isHost && sheet.columns.length > 1 && sheet.current && (
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

      <div ref={area} style={{ minHeight: areaMin }}>
        {rolling && roll ? (
          <>
            <p className="mt-1 text-sm text-(--text-secondary)">
              {rollsLeft > 0 ? (canRoll ? t.kniffel.holdHint : "") : t.kniffel.noRolls}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex flex-wrap items-start gap-1.5">
                {roll.dice.map((value, i) => {
                  const down = landed[i] ?? true;
                  const tense = suspense === i;
                  // Becher wird geschüttelt → rütteln; rollt noch → wackeln (der spannende Würfel
                  // stattdessen groß in Zeitlupe); gerade gelandet → nachfedern; Kniffel → springen.
                  const motion = tense
                    ? ""
                    : almostKniffel
                      ? "animate-heartbeat"
                      : shaking && !roll.held[i]
                        ? "animate-rattle"
                        : !down
                          ? "animate-tumble"
                          : isKniffel && live
                            ? "animate-jump"
                            : roll.held[i]
                              ? ""
                              : "animate-land";
                  return (
                    <button
                      key={`${roll.count}-${i}-${down}`}
                      type="button"
                      aria-label={t.kniffel.hold(value)}
                      aria-pressed={roll.held[i]}
                      disabled={!canRoll || rollsLeft === 0 || !settled}
                      onClick={() => socket.emit("kniffel:hold", { index: i })}
                      style={isKniffel && live ? { animationDelay: `${i * 0.07}s` } : undefined}
                      className={`flex flex-col items-center gap-1 rounded-xl p-1 transition ${
                        roll.held[i] ? "bg-(--accent-soft) ring-2 ring-(--accent)" : ""
                      } ${motion}`}
                    >
                      {/* Würfel, die zum besonderen Wurf gehören, leuchten kurz auf. */}
                      <span
                        className={`block rounded-[10px] ${
                          tense
                            ? almostKniffel
                              ? "animate-suspense-big"
                              : "animate-suspense"
                            : highlight.has(i)
                              ? "animate-glow"
                              : ""
                        }`}
                      >
                        <Die
                          value={
                            shaking && !roll.held[i]
                              ? (shakeFaces[i] ?? value)
                              : (faces[i] ?? value)
                          }
                          size={44}
                        />
                      </span>
                      <span
                        className={`font-mono text-[9px] uppercase ${
                          roll.held[i] ? "text-(--accent)" : "invisible"
                        }`}
                      >
                        {t.kniffel.held}
                      </span>
                    </button>
                  );
                })}
              </div>
              {almostKniffel && (
                <span
                  role="status"
                  className="animate-heartbeat rounded-full bg-(--accent) px-3 py-1 text-lg font-extrabold text-slate-950"
                >
                  {t.kniffel.almostKniffel}
                </span>
              )}
              {found && (
                <span
                  key={comboKey}
                  role="status"
                  className={`animate-badge rounded-full px-3 py-1 font-bold ${
                    isKniffel
                      ? "bg-(--accent) text-lg text-slate-950"
                      : "bg-(--accent-soft) text-sm text-(--accent)"
                  }`}
                >
                  {t.kniffel.combos[found.combo]}
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Beim ersten Wurf im Zug klappern hier alle fünf Würfel – das Layout bleibt gleich,
              damit der Becher-Knopf beim Schütteln nicht verrutscht. */}
            <p className="mt-1 text-sm text-(--text-secondary)">{t.kniffel.diceHint}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {Array.from({ length: 5 }, (_, i) =>
                shaking ? (
                  <span key={i} className="animate-rattle">
                    <Die value={shakeFaces[i] ?? 1 + i} size={44} />
                  </span>
                ) : dice[i] ? (
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
                  className={`ml-auto ${shaking ? "invisible" : ""}`}
                >
                  {t.kniffel.clearDice}
                </Button>
              )}
            </div>
            <div className={`mt-3 flex flex-wrap gap-2 ${shaking ? "invisible" : ""}`}>
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
      </div>

      {current && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-(--accent-soft)">
          {canRoll ? (
            <>
              <Button
                onPointerDown={startShake}
                onPointerUp={throwDice}
                onPointerCancel={throwDice}
                onContextMenu={(e) => e.preventDefault()}
                // Tastatur (Enter/Leertaste): sofort werfen, ohne Schütteln.
                onClick={(e) => e.detail === 0 && canThrow && socket.emit("kniffel:roll")}
                disabled={!canThrow && !shaking}
                className={`touch-none select-none [-webkit-touch-callout:none] ${shaking ? "animate-rattle" : ""}`}
              >
                {shaking ? t.kniffel.release : rolling ? t.kniffel.roll : t.kniffel.digital}
              </Button>
              {canThrow && !shaking && (
                <span className="text-xs text-(--text-secondary)">{t.kniffel.shakeHint}</span>
              )}
            </>
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
