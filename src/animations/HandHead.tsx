import { motion, useMotionValueEvent, useTransform } from 'framer-motion';
import type { AnimProps } from './types';
import { LeftHand } from '../components/svg/LeftHand';
import { HeadSide } from '../components/svg/HeadSide';
import { TG, Caption, MarmaDot, Mirror, Stage, ease, seg, tf, useRepT } from '../components/svg/primitives';
import { groupOfIndex, phaseInfo } from '../lib/timeline';
import { useState } from 'react';
import { Hand, HandShape } from '../components/svg/Hand';
import { MARMA } from '../data/marmaPoints';

/**
 * Step 1 — fingers interlocked; the other hand's thumb rests on the Kurcha point and presses gently.
 * First 7 reps: right thumb on the left palm. Next 7: everything mirrors (left thumb on the right palm).
 */
export function KurchaPinch({ phase, reps, step, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const [side, setSide] = useState(0);
  useMotionValueEvent(phase, 'change', (p) => setSide(groupOfIndex(step?.pattern, phaseInfo(p, reps).idx)));
  const settle = useTransform(phase, (p) => ease(seg(p - (side === 1 ? (step?.pattern?.groups[0].count ?? 7) : 0), 0, 0.3)));
  const press = useTransform(t, (v) => (reduced ? 0.6 : Math.sin(Math.PI * seg(v, 0.08, 0.6))));
  const K = MARMA.kurcha;
  // The pressing hand comes from the lower right; its thumb pad sits on the mound.
  const thumbTf = useTransform([press, settle], ([pr, st]: number[]) => tf(K.x + 6 - pr * 3 + (1 - st) * 40, K.y - 4 + pr * 2 + (1 - st) * 50, -42, 0.95));
  const ringR = useTransform(press, (v) => 10 + v * 14);
  const ringO = useTransform(press, (v) => v * 0.9);
  const scene = (
    <g transform="translate(-30 0)">
      <LeftHand />
      <motion.circle cx={K.x} cy={K.y} r={ringR} fill="none" stroke="var(--glow)" strokeWidth={2.5} opacity={reduced ? 0 : ringO} />
      <MarmaDot x={K.x} y={K.y} r={10} reduced={reduced} />
      <Hand t={thumbTf} pose="thumb" />
    </g>
  );
  return (
    <Stage label="Fingers interlocked. The other hand's thumb rests on the Kurcha point, the soft mound at the base of the thumb, and presses gently.">
      {side === 0 ? scene : <Mirror>{scene}</Mirror>}
      <Caption x={150} y={36} size={12}>{side === 0 ? 'Left hand · right thumb presses' : 'Right hand · left thumb presses'}</Caption>
      <text x={side === 0 ? K.x - 30 : 300 - K.x + 30} y={K.y + 34} textAnchor="middle" className="fill-[var(--ink)] text-[11px] font-semibold">
        Kurcha
      </text>
    </Stage>
  );
}

/** Step 2 — the five fingertips of each hand gathered into a point tap the Vidhura point. */
export function VidhuraTap({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const away = useTransform(t, (v) => {
    if (reduced) return 0;
    if (v < 0.35) return 1 - ease(v / 0.35);
    return ease(seg(v, 0.4, 0.9));
  });
  // Hand comes from behind and below the ear; direction of the wrist ≈ (0.6, 0.8).
  const cluster = useTransform(away, (a) => tf(MARMA.vidhura.x + a * 0.6 * 26, MARMA.vidhura.y + a * 0.8 * 26, -37, 1.05));
  const rippleR = useTransform(t, (v) => (v < 0.35 ? 0 : 6 + seg(v, 0.35, 0.95) * 34));
  const rippleO = useTransform(t, (v) => (v < 0.35 ? 0 : 1 - seg(v, 0.35, 0.95)));
  return (
    <Stage label="Side view of the head. All five fingertips gathered together tap the Vidhura point behind the ear.">
      <HeadSide />
      <motion.circle cx={MARMA.vidhura.x} cy={MARMA.vidhura.y} r={rippleR} fill="none" stroke="var(--glow)" strokeWidth={3} opacity={rippleO} />
      <MarmaDot x={MARMA.vidhura.x} y={MARMA.vidhura.y} r={8} reduced={reduced} />
      <Hand t={cluster} pose="bunch" />
      <Caption x={150} y={40} size={12}>Both sides together</Caption>
      <text x={MARMA.vidhura.x - 46} y={MARMA.vidhura.y + 6} textAnchor="middle" className="fill-[var(--ink)] text-[11px] font-semibold">
        Vidhura
      </text>
      {/* inset: what "five fingertips together" looks like */}
      <g transform="translate(52 300)">
        <circle r={34} fill="var(--stage)" stroke="var(--line)" strokeOpacity={0.4} />
        <g transform="translate(0 -22) scale(0.55)">
          <HandShape pose="bunch" />
        </g>
        <text y={48} textAnchor="middle" className="fill-[var(--ink)] text-[9px] font-semibold uppercase">
          5 tips together
        </text>
      </g>
    </Stage>
  );
}

/** Transition — the left hand relaxes. */
export function RelaxHand({ phase }: AnimProps) {
  const v = useTransform(phase, (p) => ease(Math.min(p, 1)));
  const g = useTransform(v, (x) => `translate(0 ${x * 26}) rotate(${x * -8} 160 300)`);
  const glow = useTransform(v, [0, 1], [0.15, 0.7]);
  return (
    <Stage label="The left hand relaxes.">
      <motion.circle cx={160} cy={230} r={120} fill="url(#mh-warm)" opacity={glow} />
      <TG t={g}>
        <LeftHand relaxed={0.6} />
      </TG>
    </Stage>
  );
}
