/** Shared by the app and the recording script, so spoken text maps to the same clip. */
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  'twenty', 'twenty one'];
export const numberWord = (n: number) => WORDS[n] ?? String(n);

export const splitSentences = (text: string) => text.match(/[^.!?]+[.!?]*/g)?.map((p) => p.trim()).filter(Boolean) ?? [text];

/** Normalised lookup key for a sentence. */
export const voiceKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
