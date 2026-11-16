import type { Protocol, Step, Transition, Pattern } from '../data/types';
import { estimateSpeechSec } from './speech';

export type SeqItem =
  | { kind: 'step'; step: Step }
  | { kind: 'transition'; transition: Transition };

/** Steps with transitions inserted after the step they follow. */
export function buildSequence(p: Protocol): SeqItem[] {
  const seq: SeqItem[] = [];
  for (const step of p.steps) {
    seq.push({ kind: 'step', step });
    for (const t of p.transitions.filter((t) => t.afterStep === step.number)) seq.push({ kind: 'transition', transition: t });
  }
  return seq;
}

export const GET_READY_SEC = 3;

export function stepDurationSec(step: Step, factor = 1, rate = 0.9) {
  return GET_READY_SEC + estimateSpeechSec(step.voiceScript, rate) + step.reps * step.tempoSec * factor + 1;
}

export function itemDurationSec(item: SeqItem, factor = 1, rate = 0.9) {
  return item.kind === 'step' ? stepDurationSec(item.step, factor, rate) : item.transition.durationSec;
}

export function protocolDurationSec(p: Protocol, factor = 1, rate = 0.9) {
  return (
    buildSequence(p).reduce((s, i) => s + itemDurationSec(i, factor, rate), 0) +
    estimateSpeechSec(p.intro.voiceScript, rate) +
    estimateSpeechSec(p.completion.voiceScript, rate)
  );
}

export const formatMin = (sec: number) => `${Math.max(1, Math.round(sec / 60))} min`;
export const formatClock = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Where a 1-based rep falls inside a step's pattern. */
export function patternPosition(pattern: Pattern | undefined, rep: number) {
  if (!pattern) return null;
  let left = rep;
  for (let gi = 0; gi < pattern.groups.length; gi++) {
    const g = pattern.groups[gi];
    if (left <= g.count) return { groupIndex: gi, inGroup: left, group: g, groupCount: pattern.groups.length };
    left -= g.count;
  }
  const gi = pattern.groups.length - 1;
  const g = pattern.groups[gi];
  return { groupIndex: gi, inGroup: g.count, group: g, groupCount: pattern.groups.length };
}

/** Continuous phase (0..reps) → group index + local progress 0..1 inside the current rep. */
export function phaseInfo(phase: number, reps: number) {
  const p = Math.min(Math.max(phase, 0), reps);
  const idx = Math.min(Math.floor(p), reps - 1);
  const t = p >= reps ? 1 : p - Math.floor(p);
  return { idx, t };
}

export function groupOfIndex(pattern: Pattern | undefined, idx: number) {
  if (!pattern) return 0;
  let acc = 0;
  for (let gi = 0; gi < pattern.groups.length; gi++) {
    acc += pattern.groups[gi].count;
    if (idx < acc) return gi;
  }
  return pattern.groups.length - 1;
}
