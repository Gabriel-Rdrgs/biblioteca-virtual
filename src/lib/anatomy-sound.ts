"use client";

/**
 * Os sons do treino: uma nota por tecla certa, subindo conforme o nome
 * avança; um baque grave no erro; um acorde no acerto. Sintetizados na hora
 * (Web Audio), sem arquivo para baixar.
 */

export type Cue = "key" | "slip" | "correct" | "miss" | "finish";

let ctx: AudioContext | null = null;
let out: GainNode | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    out = ctx.createGain();
    out.gain.value = 0.55;
    out.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface Tone {
  readonly f: number;
  readonly to?: number;
  readonly d: number;
  readonly gain: number;
  readonly at?: number;
  readonly type?: OscillatorType;
}

function tone(a: AudioContext, t: Tone): void {
  if (!out) return;
  const start = a.currentTime + (t.at ?? 0);
  const osc = a.createOscillator();
  const env = a.createGain();
  osc.type = t.type ?? "sine";
  osc.frequency.setValueAtTime(t.f, start);
  if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, start + t.d);
  env.gain.setValueAtTime(1e-4, start);
  env.gain.exponentialRampToValueAtTime(t.gain, start + 0.006);
  env.gain.exponentialRampToValueAtTime(1e-4, start + t.d);
  osc.connect(env).connect(out);
  osc.start(start);
  osc.stop(start + t.d + 0.02);
}

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];

/** `progress` (0–1) é quanto do nome já foi digitado: a nota sobe com ele. */
export function playCue(cue: Cue, progress = 0): void {
  const a = audio();
  if (!a) return;
  switch (cue) {
    case "key":
      tone(a, {
        f: SCALE[Math.min(SCALE.length - 1, Math.floor(progress * SCALE.length))] ?? 523.25,
        d: 0.09,
        gain: 0.11,
        type: "triangle",
      });
      break;
    case "slip":
      tone(a, { f: 150, to: 95, d: 0.12, gain: 0.2 });
      break;
    case "correct":
      tone(a, { f: 783.99, d: 0.22, gain: 0.2, type: "triangle" });
      tone(a, { f: 1174.66, at: 0.085, d: 0.42, gain: 0.22 });
      tone(a, { f: 2349.32, at: 0.085, d: 0.3, gain: 0.04 });
      break;
    case "miss":
      tone(a, { f: 392, d: 0.2, gain: 0.16 });
      tone(a, { f: 311.13, at: 0.11, d: 0.34, gain: 0.16 });
      break;
    case "finish":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(a, { f, at: i * 0.09, d: 0.5, gain: 0.17, type: "triangle" }),
      );
      tone(a, { f: 1567.98, at: 0.36, d: 0.7, gain: 0.07 });
      break;
  }
}
