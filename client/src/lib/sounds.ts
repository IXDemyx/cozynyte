/**
 * Kurze Soundeffekte, direkt im Browser erzeugt (Web Audio) – ohne Audiodateien.
 * Browser lassen Ton erst nach einer Interaktion zu; davor bleibt es einfach still.
 */

export type Sound =
  | "roll"
  | "hold"
  | "release"
  | "enter"
  | "strike"
  | "kniffel"
  | "turn"
  | "undo"
  | "win";

let context: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.35;
    master.connect(context.destination);
  }
  return { ctx: context, out: master! };
}

// Sobald der Nutzer irgendwo klickt oder tippt, darf der Ton laufen.
if (typeof window !== "undefined") {
  const unlock = () => void audio()?.ctx.resume();
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

/** Einzelner Ton mit kurzem Anschlag und weichem Ausklingen. */
function tone(
  { ctx, out }: { ctx: AudioContext; out: GainNode },
  freq: number,
  start: number,
  length: number,
  { type = "triangle" as OscillatorType, volume = 0.5, slideTo = 0 } = {},
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const at = ctx.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + length);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + length + 0.05);
}

/** Kurzes Klacken aus gefiltertem Rauschen – mehrere hintereinander klingen wie Würfel im Becher. */
function click({ ctx, out }: { ctx: AudioContext; out: GainNode }, start: number, volume: number) {
  const length = 0.05;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800 + Math.random() * 2200;
  filter.Q.value = 3;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(out);
  source.start(ctx.currentTime + start);
}

export function playSound(sound: Sound) {
  const a = audio();
  if (!a || a.ctx.state !== "running") return;

  switch (sound) {
    case "roll":
      // Unregelmäßiges Rattern, das zum Ende hin leiser wird.
      for (let i = 0, at = 0; i < 9; i++) {
        click(a, at, 1.4 - i * 0.12);
        at += 0.025 + Math.random() * 0.045;
      }
      break;
    case "hold":
      tone(a, 660, 0, 0.08, { type: "sine", volume: 0.4 });
      break;
    case "release":
      tone(a, 440, 0, 0.08, { type: "sine", volume: 0.35 });
      break;
    case "enter":
      tone(a, 880, 0, 0.15);
      tone(a, 1320, 0.08, 0.25);
      break;
    case "strike":
      tone(a, 260, 0, 0.3, { type: "sawtooth", volume: 0.15, slideTo: 130 });
      break;
    case "undo":
      tone(a, 700, 0, 0.12, { type: "sine", volume: 0.35, slideTo: 420 });
      break;
    case "turn":
      tone(a, 523, 0, 0.18, { volume: 0.4 });
      tone(a, 784, 0.12, 0.3, { volume: 0.4 });
      break;
    case "kniffel":
      // Aufsteigendes Arpeggio mit langem Schlusston.
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(a, f, i * 0.08, 0.22));
      tone(a, 1568, 0.4, 0.7, { volume: 0.45 });
      tone(a, 1047, 0.4, 0.7, { volume: 0.3 });
      break;
    case "win":
      // Kleine Fanfare.
      [
        [523, 0, 0.15],
        [523, 0.16, 0.15],
        [523, 0.32, 0.15],
        [659, 0.48, 0.35],
        [784, 0.86, 0.15],
        [659, 1.02, 0.15],
        [784, 1.18, 0.8],
      ].forEach(([f, at, len]) => {
        tone(a, f, at, len, { volume: 0.4 });
        tone(a, f / 2, at, len, { type: "square", volume: 0.06 });
      });
      break;
  }
}
