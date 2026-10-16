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
  | "win"
  | "land"
  | "combo"
  | "shake"
  | "suspense"
  | "suspenseLong"
  | "heartbeat"
  | "aww"
  | "crowdAww"
  | "applause"
  // Musikspiele
  | "correct"
  | "blip"
  | "miss"
  // Stadt Land Fluss
  | "count"
  | "tick"
  | "rollTick"
  | "reveal"
  | "fill"
  | "alarm"
  | "beep"
  | "gong"
  | "vote";

import { effectsVolume } from "../hooks/useVolume";

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

/** Gemeinsamer Audio-Kontext und Ausgang – auch für die Hintergrundmusik (lib/music.ts). */
export function audioOut(): { ctx: AudioContext; out: GainNode } | null {
  return audio();
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

type Out = { ctx: AudioContext; out: GainNode };

/**
 * Enttäuschtes „Awwww" vieler Leute: mehrere leicht verstimmte Stimmen (Sägezahn mit etwas
 * Vibrato) durch Formantfilter für ein offenes „a/o", die Tonhöhe sackt dabei nach unten ab.
 */
function crowdAww({ ctx, out }: Out) {
  const now = ctx.currentTime;
  const length = 1.6;
  // Formanten eines „ah", die zum „oh" hin wandern.
  const formants = [
    { from: 800, to: 550, q: 5, gain: 1 },
    { from: 1200, to: 900, q: 7, gain: 0.6 },
  ];
  const mix = ctx.createGain();
  mix.gain.value = 2.8;
  mix.connect(out);
  const bank = formants.map(({ from, to, q, gain }) => {
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, now);
    filter.frequency.linearRampToValueAtTime(to, now + length);
    const level = ctx.createGain();
    level.gain.value = gain;
    filter.connect(level).connect(mix);
    return filter;
  });
  [196, 220, 233, 185, 262, 208, 247, 175].forEach((pitch, k) => {
    const start = now + k * 0.025 + Math.random() * 0.04;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(pitch * 1.06, start);
    osc.frequency.exponentialRampToValueAtTime(pitch, start + 0.25);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.72, start + length);
    // Leichtes Vibrato, damit es nach Stimmen klingt und nicht nach Synthesizer.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5 + Math.random() * 1.5;
    const depth = ctx.createGain();
    depth.gain.value = pitch * 0.015;
    lfo.connect(depth).connect(osc.frequency);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(0.09, start + 0.18);
    env.gain.setValueAtTime(0.09, start + length * 0.6);
    env.gain.exponentialRampToValueAtTime(0.0001, start + length);
    bank.forEach((filter) => osc.connect(env).connect(filter));
    osc.start(start);
    lfo.start(start);
    osc.stop(start + length + 0.05);
    lfo.stop(start + length + 0.05);
  });
}

/**
 * Applaus: viele kurze, gefilterte Rauschstöße (einzelne Klatscher) – erst schnell lauter,
 * dann langsam abebbend.
 */
function applause({ ctx, out }: Out) {
  const now = ctx.currentTime;
  const length = 2.8;
  for (let i = 0; i < 190; i++) {
    // Mehr Klatscher am Anfang, nach hinten ausdünnend.
    const t = length * Math.pow(Math.random(), 1.6);
    const swell = t < 0.25 ? t / 0.25 : Math.max(0, 1 - (t - 0.25) / (length - 0.25));
    const clap = 0.012 + Math.random() * 0.02;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * clap), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < data.length; j++) {
      data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / data.length, 2);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900 + Math.random() * 2400;
    filter.Q.value = 1.2;
    const gain = ctx.createGain();
    gain.gain.value = (0.25 + Math.random() * 0.5) * swell;
    source.connect(filter).connect(gain).connect(out);
    source.start(now + t);
  }
}

/**
 * Sound abspielen. `volume` skaliert nur diesen einen Sound (z. B. nach dem Lautstärkeregler),
 * `step` verschiebt die Tonhöhe bei „tick" – pro Buchstabe einen Halbton höher.
 */
export function playSound(sound: Sound, volume = 1, step = 0) {
  const base = audio();
  if (!base || base.ctx.state !== "running" || volume <= 0) return;
  const out = base.ctx.createGain();
  out.gain.value = volume;
  out.connect(base.out);
  const a = { ctx: base.ctx, out };

  switch (sound) {
    case "roll":
      // Unregelmäßiges Rattern, das zum Ende hin leiser wird.
      for (let i = 0, at = 0; i < 9; i++) {
        click(a, at, 1.4 - i * 0.12);
        at += 0.025 + Math.random() * 0.045;
      }
      break;
    case "shake":
      // Würfel klappern im Becher – wird beim Schütteln laufend wiederholt.
      for (let i = 0, at = 0; i < 4; i++) {
        click(a, at, 0.5 + Math.random() * 0.6);
        at += 0.02 + Math.random() * 0.03;
      }
      break;
    case "suspense":
      // Spannung: langsam ansteigender Ton, während der letzte Würfel in Zeitlupe dreht.
      tone(a, 220, 0, 1.7, { volume: 0.16, slideTo: 660 });
      tone(a, 330, 0, 1.7, { type: "sine", volume: 0.08, slideTo: 990 });
      break;
    case "suspenseLong":
      // Kurz vor dem Kniffel: tiefer, langer Anstieg mit leisem Zittern obendrauf.
      tone(a, 110, 0, 3.4, { type: "sawtooth", volume: 0.05, slideTo: 440 });
      tone(a, 220, 0, 3.4, { volume: 0.12, slideTo: 880 });
      tone(a, 330, 0.4, 3.0, { type: "sine", volume: 0.06, slideTo: 1320 });
      break;
    case "heartbeat":
      // Ba-bumm: zwei dumpfe Schläge.
      tone(a, 70, 0, 0.14, { type: "sine", volume: 0.9, slideTo: 45 });
      tone(a, 60, 0.16, 0.18, { type: "sine", volume: 0.7, slideTo: 40 });
      break;
    case "crowdAww":
      crowdAww(a);
      break;
    case "applause":
      applause(a);
      break;
    case "aww":
      // Knapp daneben: zwei absteigende Töne.
      tone(a, 440, 0, 0.25, { type: "sine", volume: 0.3, slideTo: 330 });
      tone(a, 330, 0.22, 0.45, { type: "sine", volume: 0.3, slideTo: 220 });
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
    case "land":
      // Ein Würfel bleibt liegen: kurzes Klacken mit etwas Körper.
      click(a, 0, 1.1);
      tone(a, 180, 0, 0.06, { type: "sine", volume: 0.25, slideTo: 110 });
      break;
    case "combo":
      // Guter Wurf: kleines Glitzern nach oben.
      [659, 880, 1175].forEach((f, i) => tone(a, f, i * 0.07, 0.2, { type: "sine", volume: 0.3 }));
      break;
    case "correct":
      // Selbst erraten bzw. richtig gelegen: zwei helle Töne nach oben.
      tone(a, 784, 0, 0.12, { type: "sine", volume: 0.35 });
      tone(a, 1175, 0.09, 0.28, { type: "sine", volume: 0.35 });
      break;
    case "blip":
      // Jemand anderes hat etwas erraten: ganz leise, nur als Hinweis.
      tone(a, 988, 0, 0.09, { type: "sine", volume: 0.15 });
      break;
    case "miss":
      tone(a, 392, 0, 0.14, { type: "sine", volume: 0.25 });
      tone(a, 311, 0.11, 0.24, { type: "sine", volume: 0.25 });
      break;
    case "count":
      // Countdown: kurzer, runder Ton pro Zahl.
      tone(a, 587, 0, 0.18, { type: "sine", volume: 0.45 });
      tone(a, 1174, 0, 0.08, { type: "sine", volume: 0.1 });
      break;
    case "tick":
      // Kurzes Klicken, das mit jedem Buchstaben einen Halbton höher wird (nach Z wieder von vorn).
      tone(a, 440 * 2 ** ((step % 26) / 12), 0, 0.07, { type: "square", volume: 0.12 });
      click(a, 0, 0.5);
      break;
    case "rollTick":
      click(a, 0, 0.6);
      tone(a, 1200 + Math.random() * 600, 0, 0.03, { type: "sine", volume: 0.08 });
      break;
    case "reveal":
      // „Ding": heller Akkord mit Glanz obendrauf.
      [784, 988, 1175].forEach((f) => tone(a, f, 0, 0.6, { volume: 0.3 }));
      tone(a, 2349, 0.05, 0.5, { type: "sine", volume: 0.12 });
      break;
    case "fill":
      // Weiches „Plopp".
      tone(a, 520, 0, 0.12, { type: "sine", volume: 0.35, slideTo: 880 });
      break;
    case "alarm":
      // Zweiton-Alarm: Stopp!
      [0, 0.18, 0.36].forEach((at, i) =>
        tone(a, i % 2 ? 660 : 880, at, 0.16, { type: "square", volume: 0.12 }),
      );
      break;
    case "beep":
      tone(a, 1000, 0, 0.09, { type: "sine", volume: 0.3 });
      break;
    case "gong":
      // Zeit um: tiefer Gong mit langem Nachklang.
      tone(a, 196, 0, 1.6, { type: "sine", volume: 0.5 });
      tone(a, 294, 0, 1.2, { type: "sine", volume: 0.2 });
      tone(a, 523, 0, 0.8, { type: "triangle", volume: 0.1 });
      break;
    case "vote":
      tone(a, 330, 0, 0.12, { type: "triangle", volume: 0.35, slideTo: 220 });
      break;
  }
}

/** Sound in der Lautstärke des Reglers (stumm = still) – für alles außer Kniffel. */
export function playEffect(sound: Sound, step = 0) {
  playSound(sound, effectsVolume(), step);
}
