/** Web Speech API wrapper: picks the calmest available voice, speaks sentence by sentence with soft pauses. */
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
let chosenURI = '';
let auto: SpeechSynthesisVoice | null = null;
const listeners = new Set<() => void>();

/** Higher score = more natural / soothing. Neural "Natural"/"Premium"/"Enhanced" voices sound far better. */
function score(v: SpeechSynthesisVoice) {
  const n = v.name.toLowerCase();
  let s = 0;
  if (!v.lang.toLowerCase().startsWith('en')) return -100;
  if (/natural|neural|premium|enhanced|wavenet/.test(n)) s += 50;
  if (/neerja|sonia|libby|aria|jenny|ava|samantha|serena|karen|moira|tessa|kate|veena|female|zira|emma|olivia/.test(n)) s += 20;
  if (/google uk english female/.test(n)) s += 25;
  if (v.lang === 'en-IN' || v.lang === 'en-GB') s += 6;
  if (v.localService) s += 2; // works offline
  if (/novelty|whisper|bad news|bells|boing|bubbles|cellos|jester|organ|trinoids|zarvox|albert|fred|junior|ralph|grandpa|grandma|rocko|shelley|superstar|eddy|reed|sandy|flo/.test(n)) s -= 80;
  return s;
}

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
  if (!synth || !text) {
    onSentence?.(text);
    onEnd?.();
    return;
  }
  if (interrupt) synth.cancel();
  // Speak sentence by sentence with a short breath in between: slower, calmer delivery.
  const parts = !split ? [text] : text.match(/[^.!?]+[.!?]*/g)?.map((p) => p.trim()).filter(Boolean) ?? [text];
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
    u.pitch = 0.95;
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

export function stopSpeech() {
  token++;
  synth?.cancel();
}

/** Call from a user gesture so iOS allows later speech. */
export function unlockSpeech(rate = 0.85) {
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

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  'twenty', 'twenty one'];
export const numberWord = (n: number) => WORDS[n] ?? String(n);
