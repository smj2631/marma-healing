import { motion, useMotionValueEvent, useTransform } from 'framer-motion';
import type { AnimProps } from './types';
import { LeftHand } from '../components/svg/LeftHand';
import { HeadSide } from '../components/svg/HeadSide';
import { TG, Caption, MarmaDot, Mirror, Stage, ease, seg, tf, useRepT } from '../components/svg/primitives';
import { groupOfIndex, phaseInfo } from '../lib/timeline';
import { useState } from 'react';
import { Finger, Hand, HandShape } from '../components/svg/Hand';
import { MARMA } from '../data/marmaPoints';

/**
 * The pressing hand, as in the reference video: it comes from below, its fingers wrap behind the
 * other hand and peek out at the little-finger edge, and the thumb lies up across the palm with its pad on the point.
 * Local frame: thumb pad at (0, 0). `part` picks the layer (fingers go behind the palm, thumb + hand in front).
 */
function PressHand({ part }: { part: 'behind' | 'front' }) {
  if (part === 'behind')
    return (
      <g>
        {[
          [-100, -40, -58, 66],
          [-108, -16, -62, 70],
          [-110, 8, -66, 68],
          [-104, 30, -70, 60],
        ].map(([x, y, rot, L], i) => (
          <Finger key={i} x={x} y={y} rot={rot} L={L} W={13} nail={false} />
        ))}
      </g>
    );
  return (
    <g>
      {/* side of the hand (index edge) + wrist, running off the bottom of the stage */}
      <path d="M-96 14 C-88 30 -80 44 -76 62 C-74 92 -70 118 -54 150 L-48 280 L30 280 L24 156 C30 128 24 104 8 84 C-6 66 -40 48 -96 14 Z" fill="var(--finger)" stroke="var(--line)" strokeWidth={1.2} />
      <path d="M-74 64 C-60 74 -48 80 -34 84" fill="none" stroke="var(--line)" strokeOpacity={0.3} strokeWidth={1.1} />
      <path d="M-46 162 q34 6 68 0" fill="none" stroke="var(--line)" strokeOpacity={0.25} strokeWidth={1} />
      {/* thumb, nail towards you, lying up across the palm */}
      <Finger x={0} y={0} L={96} W={21} rot={20} />
    </g>
  );
}

/**
 * Step 1 — as in the reference video: clasp the hands, open the left palm while the right hand stays wrapped
 * around it; the right thumb rests on the Kurcha point and presses gently. First 7 reps on the left hand,
 * then everything mirrors for the right hand.
 */
export function KurchaPinch({ phase, reps, step, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const [side, setSide] = useState(0);
  useMotionValueEvent(phase, 'change', (p) => setSide(groupOfIndex(step?.pattern, phaseInfo(p, reps).idx)));
  // "Find the point": at the start of each hand the pressing hand slides up from below and settles.
  const settle = useTransform(phase, (p) => (reduced ? 1 : ease(seg(p - (side === 1 ? (step?.pattern?.groups[0].count ?? 7) : 0), 0, 0.45))));
  const press = useTransform([t, settle], ([v, st]: number[]) => (reduced ? 0.6 : st < 1 ? 0 : Math.sin(Math.PI * seg(v, 0.12, 0.62))));
  const K = MARMA.kurcha;
  const handTf = useTransform([press, settle], ([pr, st]: number[]) => tf(K.x - pr * 2 - (1 - st) * 20, K.y - pr * 3 + (1 - st) * 120, 0, 1));
  const ringR = useTransform(press, (v) => 10 + v * 14);
  const ringO = useTransform(press, (v) => v * 0.9);
  const findO = useTransform(settle, [0.85, 1], [0, 1]);
  const scene = (
    <g transform="translate(-30 0)">
      <TG t={handTf}>
        <PressHand part="behind" />
      </TG>
      <LeftHand />
      <MarmaDot x={K.x} y={K.y} r={10} reduced={reduced} />
      <TG t={handTf}>
        <PressHand part="front" />
      </TG>
      <motion.circle cx={K.x} cy={K.y} r={ringR} fill="none" stroke="var(--glow)" strokeWidth={2.5} opacity={reduced ? 0 : ringO} />
      <motion.circle cx={K.x} cy={K.y} r={7} fill="var(--glow)" opacity={findO} />
    </g>
  );
  return (
    <Stage label="Hands clasped, then the left palm opens while the right hand stays wrapped around it. The right fingers are behind the left hand and the right thumb rests on the Kurcha point, pressing gently.">
      {side === 0 ? scene : <Mirror>{scene}</Mirror>}
      <Caption x={150} y={36} size={12}>{side === 0 ? 'Left hand · right thumb presses' : 'Right hand · left thumb presses'}</Caption>
      <text x={side === 0 ? K.x + 6 : 300 - K.x - 6} y={K.y - 22} textAnchor="middle" className="fill-[var(--ink)] text-[11px] font-semibold">
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
