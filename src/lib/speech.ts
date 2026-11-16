/** Web Speech API wrapper: picks the calmest available voice, speaks sentence by sentence with soft pauses. */
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
let chosenURI = '';
let auto: SpeechSynthesisVoice | null = null;
const listeners = new Set<() => void>();

export type VoiceGender = 'male' | 'female';
let gender: VoiceGender = 'male';

const MALE = /prabhat|ravi|hemant|rishi|guy|ryan|thomas|christopher|andrew|brian|eric|davis|roger|steffan|william|liam|connor|daniel|aaron|arthur|oliver|alex|fred|tom|evan|nathan|uk english male|\bmale\b/;
const FEMALE = /neerja|heera|veena|sonia|libby|aria|jenny|ava|samantha|serena|karen|moira|tessa|kate|zira|emma|olivia|susan|hazel|female|natasha|catherine|allison|joanna|kendra|salli/;

/** Higher score = more natural / soothing, matching the chosen gender. */
function score(v: SpeechSynthesisVoice) {
  const n = v.name.toLowerCase();
  let s = 0;
  if (!v.lang.toLowerCase().startsWith('en')) return -100;
  if (/natural|neural|premium|enhanced|wavenet/.test(n)) s += 30;
  const isMale = MALE.test(n) && !/female/.test(n);
  const isFemale = FEMALE.test(n);
  if (gender === 'male') s += isMale ? 60 : isFemale ? -40 : 0;
  else s += isFemale ? 60 : isMale ? -40 : 0;
  if (/google uk english/.test(n)) s += 8;
  if (v.lang === 'en-IN' || v.lang === 'en-GB') s += 6;
  if (v.localService) s += 2; // works offline
  if (/novelty|whisper|bad news|bells|boing|bubbles|cellos|jester|organ|trinoids|zarvox|albert|junior|ralph|grandpa|grandma|rocko|shelley|superstar|eddy|reed|sandy|flo/.test(n)) s -= 120;
  return s;
}

export function setVoiceGender(g: VoiceGender) {
  if (g === gender) return;
  gender = g;
  refresh();
}
export const isMaleVoice = (v: SpeechSynthesisVoice) => MALE.test(v.name.toLowerCase()) && !/female/i.test(v.name);

function refresh() {
  if (!synth) return;
  const voices = synth.getVoices();
  auto = [...voices].sort((a, b) => score(b) - score(a))[0] ?? null;
  listeners.forEach((l) => l());
}

if (synth) {
  refresh();
  synth.addEventListener?.('voiceschanged', refresh);
}

export const speechSupported = () => !!synth;

/** English voices, best first, for the settings picker. */
export function listVoices() {
  if (!synth) return [];
  return synth
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith('en'))
    .sort((a, b) => score(b) - score(a));
}
export function onVoicesChanged(l: () => void) {
  listeners.add(l);
  return () => void listeners.delete(l);
}
export function setVoiceURI(uri: string) {
  chosenURI = uri;
}
function currentVoice() {
  if (!synth) return null;
  return (chosenURI && synth.getVoices().find((v) => v.voiceURI === chosenURI)) || auto;
}

// ---------- Recorded male voice (bundled clips, same on every phone, works offline) ----------
import { splitSentences, voiceKey } from './voiceKey';

const VOICE_BASE = import.meta.env.BASE_URL + 'voice/';
let manifest: Record<string, string> | null = null;
const clipUrls = new Map<string, string>();
let clipEl: HTMLAudioElement | null = null;
let loading = false;

/** Recorded clips are used for the male voice; the female voice uses the device's own speech. */
const useRecorded = () => gender === 'male' && !!manifest;

/** Fetch the manifest and every clip into memory (blob URLs play offline on Safari too). */
export function loadVoiceClips() {
  if (loading || typeof window === 'undefined') return;
  loading = true;
  fetch(VOICE_BASE + 'manifest.json')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then(async (m: Record<string, string>) => {
      manifest = m;
      listeners.forEach((l) => l());
      for (const [k, f] of Object.entries(m)) {
        try {
          const r = await fetch(VOICE_BASE + f);
          if (r.ok) clipUrls.set(k, URL.createObjectURL(await r.blob()));
        } catch {
          /* fall back to the network URL */
        }
      }
    })
    .catch(() => {
      loading = false;
    });
}
loadVoiceClips();

export const hasRecordedVoice = () => !!manifest;

function clipFor(sentence: string) {
  const k = voiceKey(sentence);
  const f = manifest?.[k];
  if (!f) return null;
  return clipUrls.get(k) ?? VOICE_BASE + f;
}

function clipElement() {
  if (!clipEl) {
    clipEl = new Audio();
    clipEl.preload = 'auto';
    clipEl.setAttribute('playsinline', '');
  }
  return clipEl;
}

export interface SpeakOpts {
  rate?: number;
  /** Cancel anything currently queued (keeps counts in sync). */
  interrupt?: boolean;
  onEnd?: () => void;
  /** Called with each sentence as it starts (for subtitles). */
  onSentence?: (s: string) => void;
  /** Speak sentence by sentence with pauses (scripts). false = one utterance (short cues, counts). */
  split?: boolean;
}

let token = 0;
const PAUSE_MS = 380;

export function speak(text: string, { rate = 0.85, interrupt = true, onEnd, onSentence, split = true }: SpeakOpts = {}) {
  const my = ++token;
  if (useRecorded() && text) {
    if (interrupt) {
      synth?.cancel();
      clipEl?.pause();
    }
    speakRecorded(my, text, rate, split, onEnd, onSentence);
    return;
  }
  if (!synth || !text) {
    onSentence?.(text);
    onEnd?.();
    return;
  }
  if (interrupt) synth.cancel();
  // Speak sentence by sentence with a short breath in between: slower, calmer delivery.
  const parts = !split ? [text] : splitSentences(text);
  let i = 0;
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    if (my === token) onEnd?.();
  };
  const next = () => {
    if (my !== token) return done();
    if (i >= parts.length) return done();
    const sentence = parts[i++];
    onSentence?.(sentence);
    const u = new SpeechSynthesisUtterance(sentence);
    const v = currentVoice();
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    }
    u.rate = rate;
    // Slightly lower pitch reads as softer and calmer.
    u.pitch = gender === 'male' ? 0.88 : 0.95;
    u.volume = 1;
    let ended = false;
    const after = () => {
      if (ended) return;
      ended = true;
      if (my !== token) return done();
      if (i < parts.length) setTimeout(next, PAUSE_MS);
      else done();
    };
    u.onend = after;
    u.onerror = after;
    synth.speak(u);
    synth.resume();
  };
  next();
}

function speakRecorded(my: number, text: string, rate: number, split: boolean, onEnd?: () => void, onSentence?: (s: string) => void) {
  const parts = splitSentences(text);
  const el = clipElement();
  let i = 0;
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    if (my === token) onEnd?.();
  };
  const next = () => {
    if (my !== token || i >= parts.length) return done();
    const sentence = parts[i++];
    if (split || i === 1) onSentence?.(split ? sentence : text);
    let ended = false;
    const after = () => {
      if (ended) return;
      ended = true;
      if (my !== token) return done();
      if (i < parts.length) setTimeout(next, split ? PAUSE_MS : 120);
      else done();
    };
    const url = clipFor(sentence);
    if (!url) {
      // A line that was not recorded: use the device voice for it.
      if (!synth) return after();
      const u = new SpeechSynthesisUtterance(sentence);
      const v = currentVoice();
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      }
      u.rate = rate;
      u.pitch = 0.88;
      u.onend = after;
      u.onerror = after;
      synth.speak(u);
      return;
    }
    el.onended = after;
    el.onerror = after;
    el.muted = false;
    el.src = url;
    el.playbackRate = Math.min(1.5, Math.max(0.6, rate / 0.85));
    el.play().catch(after);
  };
  next();
}

export function stopSpeech() {
  token++;
  synth?.cancel();
  if (clipEl) {
    clipEl.onended = null;
    clipEl.onerror = null;
    clipEl.pause();
  }
}

/** Call from a user gesture so iOS allows later speech. */
export function unlockSpeech(rate = 0.85) {
  if (manifest) {
    const el = clipElement();
    const first = clipFor('Inhale.');
    if (first && el.paused) {
      el.muted = true;
      el.src = first;
      el.play()
        .then(() => {
          if (el.muted) {
            el.pause();
            el.muted = false;
          }
        })
        .catch(() => (el.muted = false));
    }
  }
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  u.rate = rate;
  synth.speak(u);
}

/** Rough duration estimate for a script, in seconds. */
export const estimateSpeechSec = (text: string, rate = 0.85) => {
  if (!text) return 0;
  const sentences = text.match(/[.!?]+/g)?.length ?? 1;
  return text.split(/\s+/).length / 2.5 / rate + sentences * (PAUSE_MS / 1000) + 0.6;
};

export { numberWord } from './voiceKey';
