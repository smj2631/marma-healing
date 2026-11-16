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

// ---------- Relaxing background music ----------
// A pre-rendered, seamlessly looping track (soft chords + bell notes) played through an <audio> element.
// An <audio> element (unlike Web Audio) still plays on iPhone when the ring/silent switch is on, and the
// track sits in a range phone speakers can actually reproduce.
let musicEl: HTMLAudioElement | null = null;
let fadeTimer = 0;
const MUSIC_VOL = 0.55;

const MUSIC_URL = import.meta.env.BASE_URL + 'media/calm-music.m4a';
let musicBlobUrl: string | null = null;

/**
 * Load the track into memory ahead of time. Playing from a blob URL avoids Safari's need for byte-range
 * responses, which the offline cache does not serve.
 */
export function preloadMusic() {
  if (musicBlobUrl) return;
  fetch(MUSIC_URL)
    .then((r) => (r.ok ? r.blob() : Promise.reject()))
    .then((b) => {
      musicBlobUrl = URL.createObjectURL(b);
      if (musicEl && musicEl.paused) musicEl.src = musicBlobUrl;
    })
    .catch(() => {});
}

function musicElement() {
  if (!musicEl) {
    musicEl = new Audio(musicBlobUrl ?? MUSIC_URL);
    musicEl.loop = true;
    musicEl.preload = 'auto';
    musicEl.setAttribute('playsinline', '');
  }
  return musicEl;
}

function fadeTo(el: HTMLAudioElement, target: number, ms: number, done?: () => void) {
  clearInterval(fadeTimer);
  const start = el.volume;
  const t0 = performance.now();
  fadeTimer = window.setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    try {
      el.volume = start + (target - start) * k;
    } catch {
      /* iOS: volume is read-only */
    }
    if (k >= 1) {
      clearInterval(fadeTimer);
      done?.();
    }
  }, 50);
}

/** Call from a user gesture once so mobile browsers allow later playback. */
export function primeMusic() {
  const el = musicElement();
  if (!el.paused) return;
  el.volume = 0;
  el.play()
    .then(() => {
      if (el.dataset.on !== '1') el.pause();
    })
    .catch(() => {});
}

export function startAmbient() {
  const el = musicElement();
  if (!el.paused && el.dataset.on === '1') return;
  el.dataset.on = '1';
  try {
    el.volume = 0;
  } catch {
    /* ignore */
  }
  el.play()
    .then(() => fadeTo(el, MUSIC_VOL, 2500))
    .catch(() => {});
}

export function stopAmbient() {
  const el = musicEl;
  if (!el || el.dataset.on !== '1') return;
  el.dataset.on = '0';
  fadeTo(el, 0, 1200, () => {
    if (el.dataset.on !== '1') el.pause();
  });
}
