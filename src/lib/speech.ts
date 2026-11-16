/** Thin wrapper around the Web Speech API with graceful fallback. */
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
let preferred: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (!synth) return null;
  const voices = synth.getVoices();
  if (!voices.length) return null;
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const byName = (re: RegExp) => en.find((v) => re.test(v.name));
  return (
    byName(/samantha|karen|moira|serena|google uk english female|female|zira|aria|jenny/i) ||
    en.find((v) => v.lang === 'en-IN') ||
    en.find((v) => v.default) ||
    en[0] ||
    voices[0]
  );
}

if (synth) {
  preferred = pickVoice();
  synth.addEventListener?.('voiceschanged', () => (preferred = pickVoice()));
}

export const speechSupported = () => !!synth;

export interface SpeakOpts {
  rate?: number;
  /** Cancel anything currently queued (keeps counts in sync). */
  interrupt?: boolean;
  onEnd?: () => void;
}

export function speak(text: string, { rate = 0.9, interrupt = true, onEnd }: SpeakOpts = {}) {
  if (!synth || !text) {
    onEnd?.();
    return;
  }
  if (interrupt) synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (preferred) u.voice = preferred;
  u.rate = rate;
  u.pitch = 1;
  u.volume = 1;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onEnd?.();
  };
  u.onend = finish;
  u.onerror = finish;
  synth.speak(u);
  // Chrome sometimes stalls long utterances; a resume() nudge helps.
  synth.resume();
}

export function stopSpeech() {
  synth?.cancel();
}

/** Call from a user gesture so iOS allows later speech. */
export function unlockSpeech(rate = 0.9) {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  u.rate = rate;
  synth.speak(u);
}

/** Rough duration estimate for a script, in seconds. */
export const estimateSpeechSec = (text: string, rate = 0.9) =>
  text ? (text.split(/\s+/).length / 2.6) / rate + 0.6 : 0;

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  'twenty', 'twenty one'];
export const numberWord = (n: number) => WORDS[n] ?? String(n);
