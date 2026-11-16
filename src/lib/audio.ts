/** Soft chimes synthesised with Web Audio (no audio files needed, works offline). */
let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Must be called from a user gesture (iOS autoplay rules). */
export function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  // Play a silent buffer to fully unlock on iOS.
  const buf = c.createBuffer(1, 1, 22050);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.start(0);
}

function bell(freq: number, start: number, dur: number, gain: number) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + start;
  const partials = [1, 2.01, 3.02];
  partials.forEach((m, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = freq * m;
    const peak = gain / (i + 1) ** 1.6;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (i * 0.6 + 1));
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  });
}

/** Short, soft tick for each rep. */
export const repChime = () => bell(660, 0, 0.6, 0.12);
/** Two-tone bell for step changes. */
export const stepChime = () => {
  bell(528, 0, 1.6, 0.18);
  bell(792, 0.22, 1.8, 0.14);
};
/** Three-tone resolution at the end of the session. */
export const completeChime = () => {
  bell(396, 0, 2.4, 0.16);
  bell(528, 0.35, 2.4, 0.14);
  bell(792, 0.7, 3, 0.12);
};

// ---------- Relaxing background music (generated live, works offline) ----------
// Slow warm pad chords (D – Bm – G – A) with sparse, soft pentatonic bell notes, through a gentle reverb.
const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);
const CHORDS = [
  [50, 57, 62, 66, 69], // D
  [47, 54, 59, 62, 66], // Bm
  [43, 50, 55, 59, 62], // G
  [45, 52, 57, 61, 64], // A
];
const MELODY = [62, 64, 66, 69, 71, 74, 76, 78]; // D major pentatonic
const CHORD_SEC = 9;

let music: { master: GainNode; bus: GainNode; timer: number; nextChord: number; nextNote: number; chord: number } | null = null;

function makeReverb(c: AudioContext) {
  const len = Math.floor(c.sampleRate * 3.2);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
  }
  const conv = c.createConvolver();
  conv.buffer = buf;
  return conv;
}

function padChord(c: AudioContext, out: AudioNode, notes: number[], t: number) {
  const dur = CHORD_SEC + 4;
  notes.forEach((n, i) => {
    for (const [type, det, g] of [
      ['sine', 0, 0.06],
      ['triangle', 6, 0.025],
    ] as const) {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = midi(n);
      o.detune.value = det * (i % 2 ? 1 : -1);
      const gain = c.createGain();
      const peak = g * (i === 0 ? 1.2 : 0.8);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 3.5);
      gain.gain.setValueAtTime(peak, t + dur - 4.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gain).connect(out);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
  });
}

function softBell(c: AudioContext, out: AudioNode, n: number, t: number) {
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.value = midi(n);
  const o2 = c.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = midi(n) * 2.0;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
  const g2 = c.createGain();
  g2.gain.value = 0.15;
  o.connect(g).connect(out);
  o2.connect(g2).connect(g);
  o.start(t);
  o2.start(t);
  o.stop(t + 4.1);
  o2.stop(t + 4.1);
}

export function startAmbient() {
  const c = getCtx();
  if (!c || music) return;
  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, c.currentTime);
  master.gain.exponentialRampToValueAtTime(0.3, c.currentTime + 6);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  const bus = c.createGain();
  const reverb = makeReverb(c);
  const wet = c.createGain();
  wet.gain.value = 0.6;
  const dry = c.createGain();
  dry.gain.value = 0.55;
  bus.connect(dry).connect(lp);
  bus.connect(reverb).connect(wet).connect(lp);
  lp.connect(master).connect(c.destination);
  const m = { master, bus, timer: 0, nextChord: c.currentTime + 0.1, nextNote: c.currentTime + 4, chord: 0 };
  // Look-ahead scheduler.
  m.timer = window.setInterval(() => {
    const now = c.currentTime;
    while (m.nextChord < now + 2) {
      padChord(c, bus, CHORDS[m.chord % CHORDS.length], m.nextChord);
      m.chord++;
      m.nextChord += CHORD_SEC;
    }
    while (m.nextNote < now + 2) {
      if (Math.random() < 0.55) softBell(c, bus, MELODY[Math.floor(Math.random() * MELODY.length)], m.nextNote);
      m.nextNote += 2.6 + Math.random() * 2.8;
    }
  }, 500);
  music = m;
}

export function stopAmbient() {
  const c = getCtx();
  if (!c || !music) return;
  const m = music;
  music = null;
  clearInterval(m.timer);
  m.master.gain.cancelScheduledValues(c.currentTime);
  m.master.gain.setValueAtTime(Math.max(m.master.gain.value, 0.0001), c.currentTime);
  m.master.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 2);
  setTimeout(() => m.master.disconnect(), 2300);
}
