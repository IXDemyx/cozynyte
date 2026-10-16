/**
 * Entspannte Hintergrundmusik im Lo-Fi-Stil – komplett im Browser erzeugt (keine Datei, keine
 * Lizenzfragen): warme E-Piano-Akkorde, weicher Bass, leise Drums mit etwas Swing, ab und zu ein
 * paar Glöckchen-Töne und Plattenknistern bzw. Regen. Vier Stücke zum Durchschalten; jedes läuft
 * endlos und variiert dabei leicht.
 */

import { useSyncExternalStore } from "react";
import { musicVolume, subscribe } from "../hooks/useVolume";
import { audioOut } from "./sounds";

/** So weit im Voraus werden Töne eingeplant (Sekunden) – und so oft wird nachgeplant (ms). */
const LOOKAHEAD = 0.6;
const TICK_MS = 150;

/** MIDI-Notennummer → Frequenz. */
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);

type Chord = { chord: number[]; bass: number };

/** Ein Stück: Tempo, Akkordfolgen, Spielweise und Klangfarbe. */
interface Track {
  bpm: number;
  /** Je vier Akkorde (ein Takt pro Akkord); jede Folge läuft zweimal, dann kommt die nächste. */
  progressions: Chord[][];
  /** Töne für die Glöckchen-Melodie (hohe Lage). */
  bells: number[];
  bellChance: number;
  /** Klavier: Akkord anschlagen oder Ton für Ton (Arpeggio). */
  piano: "block" | "arp";
  /** Drums: „laid“ = Standard, „sparse“ = nur das Nötigste, „busy“ = feinere Hi-Hats. */
  drums: "laid" | "sparse" | "busy";
  /** Wie dumpf alles klingt (Tiefpass über allem, Hz). */
  tone: number;
  /** Hintergrund: Plattenknistern oder leiser Regen. */
  ambience: "vinyl" | "rain";
}

/** Die Stücke zum Durchschalten. */
export const TRACKS: Track[] = [
  {
    // Fmaj9 – Em7 – Dm9 – Cmaj7: entspannt, warm.
    bpm: 72,
    progressions: [
      [
        { chord: [53, 57, 60, 64, 67], bass: 41 },
        { chord: [52, 55, 59, 62], bass: 40 },
        { chord: [50, 53, 57, 60, 64], bass: 38 },
        { chord: [48, 52, 55, 59], bass: 36 },
      ],
      [
        { chord: [53, 57, 60, 64], bass: 41 },
        { chord: [55, 59, 62, 65], bass: 43 },
        { chord: [52, 55, 59, 62], bass: 40 },
        { chord: [45, 52, 55, 60, 64], bass: 45 },
      ],
    ],
    bells: [72, 74, 76, 79, 81, 84],
    bellChance: 0.18,
    piano: "block",
    drums: "laid",
    tone: 3200,
    ambience: "vinyl",
  },
  {
    // Am9 – Dm9 – Em7 – Fmaj7: Moll, langsam, mit Regen am Fenster.
    bpm: 64,
    progressions: [
      [
        { chord: [57, 60, 64, 67, 71], bass: 45 },
        { chord: [50, 53, 57, 60, 64], bass: 38 },
        { chord: [52, 55, 59, 62], bass: 40 },
        { chord: [53, 57, 60, 64], bass: 41 },
      ],
      [
        { chord: [57, 60, 64, 67], bass: 45 },
        { chord: [53, 57, 60, 64, 67], bass: 41 },
        { chord: [50, 53, 57, 60], bass: 38 },
        { chord: [52, 56, 59, 62], bass: 40 },
      ],
    ],
    bells: [69, 72, 74, 76, 79, 81],
    bellChance: 0.12,
    piano: "block",
    drums: "sparse",
    tone: 2400,
    ambience: "rain",
  },
  {
    // Dm9 – G13 – Cmaj9 – A7: jazzige II-V-I, etwas flotter, feine Hi-Hats.
    bpm: 80,
    progressions: [
      [
        { chord: [50, 53, 57, 60, 64], bass: 38 },
        { chord: [53, 59, 64, 69], bass: 43 },
        { chord: [52, 55, 59, 62, 64], bass: 36 },
        { chord: [55, 61, 64, 65], bass: 45 },
      ],
      [
        { chord: [50, 53, 57, 60, 64], bass: 38 },
        { chord: [53, 59, 64, 67], bass: 43 },
        { chord: [52, 55, 59, 64], bass: 36 },
        { chord: [52, 55, 59, 62], bass: 45 },
      ],
    ],
    bells: [74, 76, 77, 81, 84, 86],
    bellChance: 0.15,
    piano: "block",
    drums: "busy",
    tone: 3600,
    ambience: "vinyl",
  },
  {
    // Cmaj7 – Am7 – Fmaj7 – G6, das Klavier perlt Ton für Ton: hell und freundlich.
    bpm: 76,
    progressions: [
      [
        { chord: [48, 52, 55, 59, 64], bass: 36 },
        { chord: [52, 55, 57, 60], bass: 45 },
        { chord: [53, 57, 60, 64], bass: 41 },
        { chord: [50, 55, 59, 64], bass: 43 },
      ],
      [
        { chord: [48, 52, 55, 59], bass: 36 },
        { chord: [50, 53, 57, 60, 64], bass: 38 },
        { chord: [52, 55, 59, 64], bass: 40 },
        { chord: [50, 53, 55, 59], bass: 43 },
      ],
    ],
    bells: [76, 79, 81, 84, 86, 88],
    bellChance: 0.1,
    piano: "arp",
    drums: "laid",
    tone: 4200,
    ambience: "vinyl",
  },
];

interface Engine {
  ctx: AudioContext;
  track: Track;
  /** Lautstärke der Musik (folgt dem Regler). */
  level: GainNode;
  /** Weiches Tiefpassfilter über allem – klingt nach altem Band. */
  bus: AudioNode;
  nextBeat: number;
  beat: number;
  timer: ReturnType<typeof setInterval>;
  noise: AudioBuffer;
  crackle: AudioBufferSourceNode;
  unsubscribe: () => void;
}

let engine: Engine | null = null;

/**
 * Musik ist an, aber der Browser lässt noch keinen Ton zu (nach dem Neuladen erst nach dem
 * ersten Klick). Der Regler zeigt das an, damit die Stille nicht wie ein Fehler wirkt.
 */
let waiting = false;
const waitingListeners = new Set<() => void>();
function setWaiting(value: boolean) {
  if (waiting === value) return;
  waiting = value;
  waitingListeners.forEach((listener) => listener());
}
export function useMusicWaiting(): boolean {
  return useSyncExternalStore(
    (listener) => {
      waitingListeners.add(listener);
      return () => waitingListeners.delete(listener);
    },
    () => waiting,
  );
}

/** Musik starten (wenn sie schon läuft: nichts tun). */
export function startMusic(index = 0) {
  if (engine) return;
  const track = TRACKS[index % TRACKS.length];
  const audio = audioOut();
  if (!audio) return;
  const { ctx, out } = audio;

  const level = ctx.createGain();
  level.gain.value = 0;
  level.connect(out);
  const tape = ctx.createBiquadFilter();
  tape.type = "lowpass";
  tape.frequency.value = track.tone;
  tape.Q.value = 0.4;
  tape.connect(level);

  const noise = noiseBuffer(ctx, 2);
  const crackle = track.ambience === "rain" ? rain(ctx, tape) : vinyl(ctx, tape);

  const start = () => {
    if (!engine) return;
    // Sanft einblenden bzw. der Reglerstellung folgen.
    const now = ctx.currentTime;
    level.gain.cancelScheduledValues(now);
    level.gain.setTargetAtTime(musicVolume(), now, 0.6);
  };

  engine = {
    ctx,
    track,
    level,
    bus: tape,
    nextBeat: ctx.currentTime + 0.3,
    beat: 0,
    noise,
    crackle,
    timer: setInterval(schedule, TICK_MS),
    unsubscribe: subscribe(start),
  };
  start();
  schedule();
}

/** Musik ausblenden und anhalten. */
export function stopMusic() {
  const current = engine;
  if (!current) return;
  engine = null;
  setWaiting(false);
  clearInterval(current.timer);
  current.unsubscribe();
  const now = current.ctx.currentTime;
  current.level.gain.cancelScheduledValues(now);
  current.level.gain.setTargetAtTime(0, now, 0.3);
  setTimeout(() => {
    current.crackle.stop();
    current.level.disconnect();
  }, 2000);
}

/** Plant alle Töne der nächsten Momente ein (läuft alle TICK_MS). */
function schedule() {
  const e = engine;
  if (!e) return;
  // Solange der Browser den Ton noch blockiert, nicht vorauslaufen.
  if (e.ctx.state !== "running") {
    setWaiting(true);
    e.nextBeat = e.ctx.currentTime + 0.3;
    return;
  }
  setWaiting(false);
  while (e.nextBeat < e.ctx.currentTime + LOOKAHEAD) {
    playBeat(e, e.beat, e.nextBeat);
    e.beat++;
    e.nextBeat += 60 / e.track.bpm;
  }
}

/** Ein Schlag: Akkord und Bass auf der Eins, Drums mit Swing, ab und zu Glöckchen. */
function playBeat(e: Engine, beat: number, at: number) {
  const { track } = e;
  const beatLen = 60 / track.bpm;
  const inBar = beat % 4;
  const bar = Math.floor(beat / 4);
  const round = Math.floor(bar / 4);
  const progression = track.progressions[Math.floor(round / 2) % track.progressions.length];
  const { chord, bass } = progression[bar % 4];
  // Die ersten zwei Takte nur Akkorde – dann kommen Bass und Drums dazu.
  const full = beat >= 8;
  const swing = beatLen * 0.58;

  if (track.piano === "block") {
    if (inBar === 0) epiano(e, chord, at, beatLen * 3.6, 0.11);
    // Leiser Nachschlag zwischen zweitem und drittem Schlag (wie ein Pianist, der „mitwippt“).
    if (inBar === 1 && Math.random() < 0.6)
      epiano(e, chord.slice(1), at + swing, beatLen * 1.8, 0.05);
  } else {
    // Arpeggio: leiser Grundakkord, darüber pro Achtel ein Ton – auf und ab.
    if (inBar === 0) epiano(e, chord.slice(0, 3), at, beatLen * 3.8, 0.06);
    const order = [...chord, ...chord.slice(1, -1).reverse()];
    for (const half of [0, 1]) {
      const step = inBar * 2 + half;
      epiano(e, [order[step % order.length] + 12], at + half * swing, beatLen * 1.4, 0.05);
    }
  }

  if (full) {
    if (inBar === 0) bassNote(e, bass, at, beatLen * 1.8);
    if (inBar === 2) bassNote(e, Math.random() < 0.5 ? bass + 7 : bass, at, beatLen * 1.4);
    if (track.drums === "sparse") {
      // Nur Bassdrum auf der Eins, ein weicher Schlag auf der Drei, leise Hi-Hats.
      if (inBar === 0) kick(e, at);
      if (inBar === 2) snare(e, at, 0.6);
      if (Math.random() < 0.7) hat(e, at + swing, 0.35);
    } else {
      if (inBar === 0 || (inBar === 2 && Math.random() < 0.6)) kick(e, at);
      if (inBar === 2 && Math.random() < 0.35) kick(e, at + swing);
      if (inBar === 1 || inBar === 3) snare(e, at);
      hat(e, at, 0.5);
      hat(e, at + swing, 0.3 + Math.random() * 0.2);
      // Feinere Hi-Hats dazwischen (Sechzehntel), sehr leise.
      if (track.drums === "busy") {
        hat(e, at + beatLen * 0.25, 0.18);
        if (Math.random() < 0.5) hat(e, at + swing + beatLen * 0.22, 0.15);
      }
    }
  }

  // Glöckchen: selten, und nicht in den ersten Takten.
  if (beat >= 16 && Math.random() < track.bellChance) {
    const note = track.bells[Math.floor(Math.random() * track.bells.length)];
    bell(e, note, at + (Math.random() < 0.5 ? 0 : swing));
  }
}

/** Weiches E-Piano: Sinus mit leiser Oktave, kurzer Anschlag, langes Ausklingen, leichtes Tremolo. */
function epiano(e: Engine, notes: number[], at: number, length: number, volume: number) {
  const { ctx } = e;
  const voice = ctx.createGain();
  voice.gain.setValueAtTime(0.0001, at);
  voice.gain.exponentialRampToValueAtTime(volume, at + 0.02);
  voice.gain.exponentialRampToValueAtTime(volume * 0.45, at + 0.6);
  voice.gain.exponentialRampToValueAtTime(0.0001, at + length);
  const tremolo = ctx.createGain();
  tremolo.gain.value = 1;
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  lfo.frequency.value = 4.5;
  depth.gain.value = 0.12;
  lfo.connect(depth).connect(tremolo.gain);
  const warm = ctx.createBiquadFilter();
  warm.type = "lowpass";
  warm.frequency.value = 1600;
  voice.connect(warm).connect(tremolo).connect(e.bus);
  for (const note of notes) {
    for (const [ratio, level, detune] of [
      [1, 1, -4],
      [2, 0.18, 3],
    ] as const) {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = hz(note) * ratio;
      osc.detune.value = detune;
      amp.gain.value = level / notes.length;
      osc.connect(amp).connect(voice);
      osc.start(at);
      osc.stop(at + length + 0.1);
    }
  }
  lfo.start(at);
  lfo.stop(at + length + 0.1);
}

function bassNote(e: Engine, note: number, at: number, length: number) {
  const { ctx } = e;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = "triangle";
  osc.frequency.value = hz(note);
  filter.type = "lowpass";
  filter.frequency.value = 380;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.3, at + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(filter).connect(gain).connect(e.bus);
  osc.start(at);
  osc.stop(at + length + 0.05);
}

/** Weiche Bassdrum: Sinus, der schnell nach unten rutscht. */
function kick(e: Engine, at: number) {
  const { ctx } = e;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(110, at);
  osc.frequency.exponentialRampToValueAtTime(42, at + 0.18);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.45, at + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
  osc.connect(gain).connect(e.bus);
  osc.start(at);
  osc.stop(at + 0.4);
}

/** Gedämpfte Snare (eher ein „Tsch“ als ein Knall). */
function snare(e: Engine, at: number, velocity = 1) {
  noiseHit(e, at, { type: "bandpass", freq: 1700, q: 0.8, volume: 0.09 * velocity, length: 0.22 });
}

function hat(e: Engine, at: number, velocity: number) {
  noiseHit(e, at, { type: "highpass", freq: 7000, q: 0.5, volume: 0.025 * velocity, length: 0.05 });
}

function noiseHit(
  e: Engine,
  at: number,
  opts: { type: BiquadFilterType; freq: number; q: number; volume: number; length: number },
) {
  const { ctx } = e;
  const source = ctx.createBufferSource();
  source.buffer = e.noise;
  const filter = ctx.createBiquadFilter();
  filter.type = opts.type;
  filter.frequency.value = opts.freq;
  filter.Q.value = opts.q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(opts.volume, at + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + opts.length);
  source.connect(filter).connect(gain).connect(e.bus);
  source.start(at, Math.random() * 1.5);
  source.stop(at + opts.length + 0.05);
}

/** Glöckchen-Ton: Sinus mit leiser, unharmonischer Obertonstufe und langem Ausklingen. */
function bell(e: Engine, note: number, at: number) {
  const { ctx } = e;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.035, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.4);
  gain.connect(e.bus);
  for (const [ratio, level] of [
    [1, 1],
    [2.76, 0.25],
  ]) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.frequency.value = hz(note) * ratio;
    amp.gain.value = level;
    osc.connect(amp).connect(gain);
    osc.start(at);
    osc.stop(at + 2.5);
  }
}

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Plattenknistern: leises Rauschen mit vereinzelten Knacksern, endlos geloopt. */
function vinyl(ctx: AudioContext, bus: AudioNode): AudioBufferSourceNode {
  const seconds = 4;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.0025;
    if (Math.random() < 0.00005) data[i] = (Math.random() * 2 - 1) * 0.15;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2500;
  filter.Q.value = 0.6;
  source.connect(filter).connect(bus);
  source.start();
  return source;
}

/** Leiser Regen: dumpfes Rauschen mit vereinzelten Tropfen, endlos geloopt. */
function rain(ctx: AudioContext, bus: AudioNode): AudioBufferSourceNode {
  const seconds = 6;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let smooth = 0;
  for (let i = 0; i < data.length; i++) {
    // Leicht geglättetes Rauschen klingt weicher, eher nach Regen als nach Radio.
    smooth = smooth * 0.6 + (Math.random() * 2 - 1) * 0.4;
    data[i] = smooth * 0.03;
    if (Math.random() < 0.0004) data[i] += (Math.random() * 2 - 1) * 0.08;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  source.connect(filter).connect(bus);
  source.start();
  return source;
}
