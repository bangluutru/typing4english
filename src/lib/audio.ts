import { settingsStore } from './store';

/* --------------------------------------------------------------------------
   Pronunciation comes from 英級アップ's recorded MP3s (public, long-cached).
   A plain <audio> element needs no CORS, so we can play them cross-origin.
   If a file is missing or the network is down, fall back to browser TTS.
   -------------------------------------------------------------------------- */

export const EIKYU_BASE: string = (import.meta.env.VITE_EIKYU_BASE as string | undefined) ?? 'https://eiken-compass.pages.dev';
const VOCAB_AUDIO = `${EIKYU_BASE}/api/media/audio/vocab/`;

let player: HTMLAudioElement | null = null;

function speak(text: string, rate = 0.85) {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  const voice = synth.getVoices().find(v => v.lang === 'en-US') ?? synth.getVoices().find(v => v.lang.startsWith('en'));
  if (voice) u.voice = voice;
  synth.speak(u);
}

/** Play a recorded file from eikyu-up, or speak `text` if there is none. */
export function say(text: string, file?: string) {
  if (!settingsStore.get().voice) return;
  stopVoice();
  if (!file) { speak(text); return; }
  player = new Audio(VOCAB_AUDIO + file);
  const p = player;
  p.onerror = () => { if (player === p) speak(text); };
  p.play().catch(() => { if (player === p) speak(text); });
}

export function stopVoice() {
  if (player) { player.onerror = null; player.pause(); player = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// Chrome fills the voice list asynchronously; touch it once so it is ready.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}

/* ---------- small synthesized sound effects ---------- */

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.08) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  key() { if (settingsStore.get().sound) tone(880, 0, 0.05, 'triangle', 0.03); },
  miss() { if (settingsStore.get().sound) tone(180, 0, 0.12, 'square', 0.03); },
  word() { if (settingsStore.get().sound) { tone(660, 0, 0.1, 'triangle'); tone(990, 0.07, 0.14, 'triangle'); } },
  pop() { if (settingsStore.get().sound) { tone(520, 0, 0.08, 'sine', 0.1); tone(1040, 0.04, 0.1, 'sine', 0.06); } },
  lose() { if (settingsStore.get().sound) { tone(330, 0, 0.18, 'triangle'); tone(247, 0.15, 0.25, 'triangle'); } },
  fanfare() {
    if (!settingsStore.get().sound) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, 'triangle', 0.07));
  },
};
