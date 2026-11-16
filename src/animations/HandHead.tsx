import { motion, useTransform } from 'framer-motion';
import type { AnimProps } from './types';
import { LeftHand, HAND_THUMB } from '../components/svg/LeftHand';
import { HeadSide } from '../components/svg/HeadSide';
import { TG, Caption, Fingertip, MarmaDot, Stage, ease, lerp, partialPath, qBez, seg, tf, useRepT } from '../components/svg/primitives';
import { MARMA } from '../data/marmaPoints';

const thumbAt = (u: number) => qBez(HAND_THUMB.tip, HAND_THUMB.ctrl, HAND_THUMB.base, u);

/** Step 1 — right fingers interlock, then a pinch slides from thumb tip to Kurcha each rep. */
export function KurchaPinch({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  // Interlock slides in at the start of the first rep and stays.
  const lock = useTransform(phase, (p) => ease(seg(p, 0, 0.35)));
  const lockTf = useTransform(lock, (v) => `translate(${lerp(-150, 0, v)} ${lerp(-60, 0, v)})`);
  const lockOpacity = useTransform(lock, [0, 0.2, 1], [0, 0.9, 0.95]);
  // Pinch travels tip → base during 0.1–0.75, then lifts.
  const u = useTransform(t, (v) => ease(seg(v, 0.1, 0.75)));
  const lift = useTransform(t, (v) => (v < 0.75 ? 0 : seg(v, 0.75, 1)));
  const squeeze = useTransform(t, (v) => (v < 0.08 ? seg(v, 0, 0.08) : v > 0.75 ? 1 - seg(v, 0.75, 0.85) : 1));
  const padA = useTransform([u, squeeze], ([a, s]: number[]) => {
    const p = thumbAt(a);
    return tf(p.x - 20 + s * 6, p.y - 4, 60);
  });
  const padB = useTransform([u, squeeze], ([a, s]: number[]) => {
    const p = thumbAt(a);
    return tf(p.x + 22 - s * 6, p.y + 6, -110);
  });
  const padOpacity = useTransform(lift, [0, 0.4, 1], [1, 0, 0]);
  const trail = useTransform(u, (v) => partialPath(thumbAt, v));
  const trailOpacity = useTransform(t, [0, 0.1, 0.75, 1], [0, 1, 1, 0]);

  return (
    <Stage label="Left palm. The right hand interlocks and pinches the thumb from the tip down to the Kurcha point.">
      <LeftHand />
      <TG t={lockTf} opacity={lockOpacity}>
        {/* right-hand fingers resting between the left fingers */}
        {[124, 156, 188].map((x, i) => (
          <g key={i}>
            <line x1={x - 40} y1={150 + i * 4} x2={x} y2={178 + i * 2} stroke="var(--line)" strokeWidth={25} strokeLinecap="round" />
            <line x1={x - 40} y1={150 + i * 4} x2={x} y2={178 + i * 2} stroke="var(--finger2)" strokeWidth={22} strokeLinecap="round" />
          </g>
        ))}
      </TG>
      <motion.path d={trail} fill="none" stroke="var(--glow)" strokeWidth={8} strokeLinecap="round" opacity={trailOpacity} filter="url(#mh-soft)" />
      <MarmaDot x={MARMA.kurcha.x} y={MARMA.kurcha.y} r={9} reduced={reduced} label="Kurcha" />
      {!reduced && (
        <motion.g opacity={padOpacity}>
          <TG t={padA}>
            <Fingertip w={18} h={22} tone="b" />
          </TG>
          <TG t={padB}>
            <Fingertip w={22} h={24} tone="b" />
          </TG>
        </motion.g>
      )}
      <Caption x={150} y={40} size={11}>Left hand · tip → base</Caption>
    </Stage>
  );
}

/** Step 2 — bunched fingertips tap the Vidhura point behind the ear. */
export function VidhuraTap({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const away = useTransform(t, (v) => {
    // approach and hit at 0.35, then pull back
    if (v < 0.35) return 1 - ease(v / 0.35);
    return ease(seg(v, 0.4, 0.9));
  });
  const cluster = useTransform(away, (a) => tf(MARMA.vidhura.x + 16 + a * 34, MARMA.vidhura.y + 8 + a * 10, -35));
  const rippleR = useTransform(t, (v) => (v < 0.35 ? 0 : 6 + seg(v, 0.35, 0.95) * 34));
  const rippleO = useTransform(t, (v) => (v < 0.35 ? 0 : 1 - seg(v, 0.35, 0.95)));
  return (
    <Stage label="Side view of the head. Bunched fingertips tap the Vidhura point behind the ear.">
      <HeadSide />
      <motion.circle cx={MARMA.vidhura.x} cy={MARMA.vidhura.y} r={rippleR} fill="none" stroke="var(--glow)" strokeWidth={3} opacity={rippleO} />
      <MarmaDot x={MARMA.vidhura.x} y={MARMA.vidhura.y} r={8} reduced={reduced} />
      {!reduced && (
        <TG t={cluster}>
          {/* five fingertips bunched together */}
          {[
            [-8, -4],
            [6, -6],
            [-2, 6],
            [10, 6],
            [2, -14],
          ].map(([dx, dy], i) => (
            <g key={i} transform={`translate(${dx} ${dy})`}>
              <Fingertip w={13} h={16} nail={false} tone={i % 2 ? 'a' : 'b'} />
            </g>
          ))}
        </TG>
      )}
      <Caption x={150} y={40} size={12}>Both sides together</Caption>
      <text x={MARMA.vidhura.x} y={MARMA.vidhura.y + 46} textAnchor="middle" className="fill-[var(--ink)] text-[11px] font-semibold">
        Vidhura
      </text>
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
