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
