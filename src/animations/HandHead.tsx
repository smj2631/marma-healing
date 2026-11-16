import { motion, useTransform } from 'framer-motion';
import type { AnimProps } from './types';
import { LeftHand, HAND_THUMB } from '../components/svg/LeftHand';
import { HeadSide } from '../components/svg/HeadSide';
import { TG, Caption, MarmaDot, Stage, ease, lerp, qBez, seg, tf, useRepT } from '../components/svg/primitives';
import { Finger, Hand, HandShape } from '../components/svg/Hand';
import { MARMA } from '../data/marmaPoints';

const thumbAt = (u: number) => qBez(HAND_THUMB.tip, HAND_THUMB.ctrl, HAND_THUMB.base, u);
/** Three pinch spots per rep: thumb tip → middle → Kurcha at the base. */
const PINCH_U = [0.08, 0.5, 0.97];
// The pinching right hand comes in from the right side.
const PINCH_ANGLE = -100;

/** Step 1 — right fingers interlock, then the right thumb + index pinch down the left thumb (lift, never slide). */
export function KurchaPinch({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const lock = useTransform(phase, (p) => ease(seg(p, 0, 0.35)));
  const lockTf = useTransform(lock, (v) => `translate(0 ${lerp(-70, 0, v)})`);
  const lockOpacity = useTransform(lock, [0, 0.2, 1], [0, 0.95, 1]);
  // Which spot, and where we are inside that spot's window.
  const state = useTransform(t, (v) => {
    const k = Math.min(2, Math.floor(v * 3));
    const w = v * 3 - k; // 0..1 inside the window
    const prevU = PINCH_U[(k + 2) % 3];
    const move = ease(seg(w, 0, 0.3)); // lift and move (pads open)
    const u = lerp(prevU, PINCH_U[k], move);
    const squeeze = w < 0.3 ? 0 : Math.sin(Math.PI * seg(w, 0.32, 0.92));
    const lift = w < 0.3 ? Math.sin(Math.PI * seg(w, 0, 0.3)) : 0;
    return { u, squeeze, lift, k };
  });
  // The right thumb presses on the front of the left thumb; the right index supports from behind.
  const handTf = useTransform(state, ({ u, lift, squeeze }) => {
    const p = thumbAt(reduced ? 0.97 : u);
    return tf(p.x - 2 + lift * 16 - squeeze * 3, p.y - lift * 6, PINCH_ANGLE, 0.95);
  });
  const indexTf = useTransform(state, ({ u, lift }) => {
    const p = thumbAt(reduced ? 0.97 : u);
    return tf(p.x - 20 - lift * 6, p.y - 10 - lift * 8, 150, 0.7);
  });
  const indexO = useTransform(state, ({ lift }) => (reduced ? 1 : 1 - lift));
  const ringR = useTransform(state, ({ squeeze }) => 8 + squeeze * 10);
  const ringO = useTransform(state, ({ squeeze }) => squeeze * 0.9);
  const ringX = useTransform(state, ({ u }) => thumbAt(u).x);
  const ringY = useTransform(state, ({ u }) => thumbAt(u).y);
  const spotOpacity = PINCH_U.map((_, i) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTransform(state, (s) => (s.k === i ? 0.4 + 0.6 * s.squeeze : 0.25)),
  );

  return (
    <Stage label="Left palm. The right thumb and index finger pinch the left thumb at the tip, the middle and the Kurcha point, lifting between pinches.">
      <g transform="translate(-34 0)">
      <LeftHand />
      <TG t={lockTf} opacity={lockOpacity}>
        {/* right-hand fingers interlocked between the left fingers */}
        {[
          [124, 214],
          [156, 212],
          [188, 216],
        ].map(([x, y], i) => (
          <Finger key={i} x={x} y={y} rot={180} L={64} W={15} nail={false} />
        ))}
      </TG>
      {PINCH_U.map((u, i) => {
        const p = thumbAt(u);
        return <motion.circle key={i} cx={p.x} cy={p.y} r={i === 2 ? 14 : 9} fill="url(#mh-glow)" opacity={reduced ? 0.6 : spotOpacity[i]} />;
      })}
      <MarmaDot x={MARMA.kurcha.x} y={MARMA.kurcha.y} r={9} reduced={reduced} label="Kurcha" />
      {/* tip of the right index finger, just visible behind the left thumb */}
      <TG t={indexTf} opacity={indexO}>
        <Finger L={30} W={13} />
      </TG>
      <motion.circle cx={ringX} cy={ringY} r={ringR} fill="none" stroke="var(--glow)" strokeWidth={2.5} opacity={reduced ? 0 : ringO} />
      <Hand t={handTf} pose="thumb" />
      </g>
      <Caption x={150} y={40} size={11}>Pinch · lift · pinch — tip → base</Caption>
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
