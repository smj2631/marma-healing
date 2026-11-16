/**
 * Lists every sentence the app can speak, for pre-recording the voice.
 * Run: npx esbuild scripts/voice-lines.ts --bundle --platform=node | node > lines.json
 */
import { PROTOCOLS } from '../src/data/protocols';
import { numberWord, splitSentences } from '../src/lib/voiceKey';

const out = new Set<string>();
const add = (t?: string) => t && splitSentences(t).forEach((s) => out.add(s));

add('Breathe in gently. And breathe out.');
add('Inhale. Exhale. Next. Get ready.');
for (let n = 1; n <= 21; n++) add(numberWord(n) + '.');
for (const p of PROTOCOLS) {
  add(p.intro?.voiceScript);
  add(p.completion?.voiceScript);
  p.transitions.forEach((t) => add(t.voiceScript));
  for (const step of p.steps) {
    add(step.voiceScript);
    add(`Step ${numberWord(step.number)}.`);
    add(step.title + '.');
    step.cues?.forEach((c) => add(c + '.'));
    step.pattern?.groups.forEach((g, i) => {
      if (g.announce) add(g.announce);
      else if (g.announce === undefined) {
        add(`${step.pattern!.unit} ${numberWord(i + 1)}.`);
        add(g.name.replace(/\s*↔\s*/g, ' and ') + '.');
      }
      g.cues?.forEach((c) => add(c + '.'));
    });
  }
}
console.log(JSON.stringify([...out], null, 1));
