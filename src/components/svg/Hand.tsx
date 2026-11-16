import { useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { TG } from './primitives';

/**
 * Reusable hand drawings (back of the hand visible, nails showing).
 * Local frame: the contact point (fingertip / thumb pad / palm heel) is at (0, 0) and the hand
 * extends towards +y, continuing into the wrist and forearm (which run off-stage).
 * Rotate with `angle` (degrees); mirror with `flip`.
 */
export type HandPose = 'four' | 'two' | 'index' | 'pinch' | 'thumb' | 'bunch' | 'palm';

const FILL = 'url(#mh-skin)';
const FLAT = 'var(--finger)';
const LINE = 'var(--line)';

/** A tapered finger: tip at (x, y), extending along +y for length L, then rotated by rot. */
export function Finger({ x = 0, y = 0, L = 60, W = 13, rot = 0, nail = true }: { x?: number; y?: number; L?: number; W?: number; rot?: number; nail?: boolean }) {
  const r = W / 2;
  const b = r * 1.14; // wider at the base
  const d = `M${-r} ${r} A${r} ${r} 0 0 1 ${r} ${r} C${r * 1.04} ${L * 0.45} ${b} ${L * 0.7} ${b} ${L} L${-b} ${L} C${-b} ${L * 0.7} ${-r * 1.04} ${L * 0.45} ${-r} ${r} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={d} fill={FILL} stroke={LINE} strokeWidth={1.1} strokeLinejoin="round" />
      {nail && (
        <>
          <path d={`M${-r * 0.62} ${W * 0.95} L${-r * 0.62} ${r * 0.75} A${r * 0.62} ${r * 0.62} 0 0 1 ${r * 0.62} ${r * 0.75} L${r * 0.62} ${W * 0.95} Q0 ${W * 1.08} ${-r * 0.62} ${W * 0.95} Z`} fill="var(--nail)" stroke={LINE} strokeOpacity={0.35} strokeWidth={0.7} />
          <path d={`M${-r * 0.4} ${W * 0.82} Q0 ${W * 0.7} ${r * 0.4} ${W * 0.82}`} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={0.8} />
        </>
      )}
      {/* joint creases */}
      <path d={`M${-r * 0.5} ${L * 0.36} q${r * 0.5} 1.6 ${r} 0`} fill="none" stroke={LINE} strokeOpacity={0.4} strokeWidth={0.8} />
      <path d={`M${-r * 0.6} ${L * 0.66} q${r * 0.6} 2.2 ${r * 1.2} 0 M${-r * 0.45} ${L * 0.7} q${r * 0.45} 1.6 ${r * 0.9} 0`} fill="none" stroke={LINE} strokeOpacity={0.4} strokeWidth={0.8} />
    </g>
  );
}

/**
 * Back of the hand from the knuckle line (y = top) down through the wrist into the forearm.
 * Drawn after the fingers so the knuckles overlap the finger bases cleanly.
 */
function HandBack({ top, w = 62, cx = 0, knuckles = 4 }: { top: number; w?: number; cx?: number; knuckles?: number }) {
  const h = w / 2;
  const wrist = top + w * 1.15;
  const d = `M${cx - h} ${top + 4} Q${cx} ${top - 8} ${cx + h} ${top + 4} C${cx + h + 3} ${top + w * 0.6} ${cx + h * 0.82} ${wrist - 10} ${cx + h * 0.74} ${wrist} L${cx + h * 0.86} ${top + 320} L${cx - h * 0.86} ${top + 320} L${cx - h * 0.74} ${wrist} C${cx - h * 0.82} ${wrist - 10} ${cx - h - 3} ${top + w * 0.6} ${cx - h} ${top + 4} Z`;
  return (
    <g>
      <path d={d} fill={FLAT} stroke={LINE} strokeWidth={1.2} />
      {Array.from({ length: knuckles }, (_, i) => {
        const kx = cx - h + ((i + 0.5) * w) / knuckles;
        return (
          <g key={i}>
            <ellipse cx={kx} cy={top + 3} rx={w / knuckles / 2.6} ry={2.6} fill={LINE} opacity={0.08} />
            <path d={`M${kx} ${top + 10} Q${(kx + cx) / 2} ${top + w * 0.55} ${cx + (kx - cx) * 0.3} ${wrist - 4}`} fill="none" stroke={LINE} strokeOpacity={0.12} strokeWidth={1.2} />
          </g>
        );
      })}
      <path d={`M${cx - h * 0.7} ${wrist + 6} q${h * 0.7} 4 ${h * 1.4} 0`} fill="none" stroke={LINE} strokeOpacity={0.25} strokeWidth={1} />
    </g>
  );
}

/** Curled fingers seen from the back: rounded knuckle bumps. */
function CurledFingers({ x, y, n = 3, w = 13 }: { x: number; y: number; n?: number; w?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x + i * w} y={y} width={w} height={w * 1.5} rx={w / 2} fill={FILL} stroke={LINE} strokeWidth={1.1} />
      ))}
    </g>
  );
}

interface HandProps {
  pose: HandPose;
  /** Pinch: 0 = open, 1 = closed. */
  squeeze?: MotionValue<number>;
  /** Pinch: width of what is held between the pads when closed. */
  gap?: number;
  scale?: number;
}

/** A hand drawn in its local frame (contact at 0,0). */
export function HandShape({ pose, squeeze, scale = 1, gap = 4 }: HandProps) {
  return (
    <g transform={`scale(${scale})`}>
      {pose === 'four' && (
        <g>
          {[
            [-19, 9, 62, 12],
            [-6.4, 1, 71, 13],
            [6.4, 0, 72, 13],
            [19, 6, 64, 12.5],
          ].map(([x, y, L, W], i) => (
            <Finger key={i} x={x} y={y} L={L} W={W} />
          ))}
          <HandBack top={66} w={64} />
        </g>
      )}
      {pose === 'two' && (
        <g>
          <Finger x={-6.6} y={0} L={72} W={13} />
          <Finger x={6.6} y={2} L={70} W={13} />
          <CurledFingers x={13} y={58} n={2} w={13} />
          <HandBack top={68} w={60} cx={6} />
        </g>
      )}
      {pose === 'index' && (
        <g>
          <Finger x={0} y={0} L={66} W={13.5} />
          <CurledFingers x={7} y={52} n={3} w={13} />
          <HandBack top={62} w={58} cx={16} />
          <Finger x={-14} y={58} rot={24} L={42} W={15} />
        </g>
      )}
      {pose === 'thumb' && (
        <g>
          <CurledFingers x={8} y={22} n={4} w={13.5} />
          <HandBack top={40} w={60} cx={34} />
          <Finger x={0} y={0} L={74} W={17} rot={-8} />
        </g>
      )}
      {pose === 'bunch' && (
        <g>
          {[
            [-5, 4, 16, 58],
            [5, 4, -16, 58],
            [-2.5, -1, 6, 64],
            [2.5, -1, -6, 64],
          ].map(([x, y, rot, L], i) => (
            <Finger key={i} x={x} y={y} rot={rot} L={L} W={12.5} />
          ))}
          <HandBack top={56} w={62} />
          <Finger x={-8} y={8} rot={34} L={52} W={15} />
        </g>
      )}
      {pose === 'pinch' && <Pinch squeeze={squeeze} gap={gap} />}
      {pose === 'palm' && (
        <g>
          {/* heel of the palm at (0,0); the hand rises along +y; wrist + forearm continue along -y */}
          <path d="M-22 -4 L-26 -240 L26 -240 L22 -4 Z" fill={FLAT} stroke={LINE} strokeWidth={1.2} />
          <path d="M-16 -16 q16 5 32 0" fill="none" stroke={LINE} strokeOpacity={0.3} strokeWidth={1} />
          {[
            [-24, 62, 50],
            [-8, 60, 58],
            [8, 60, 60],
            [24, 62, 52],
          ].map(([x, y, L], i) => (
            <g key={i} transform={`translate(${x} ${y + L}) rotate(180)`}>
              <Finger L={L + 6} W={14} />
            </g>
          ))}
          <path d="M-26 2 C-30 -8 -20 -16 -10 -12 Q0 -8 10 -12 C20 -16 30 -8 26 2 C32 24 36 46 34 66 Q0 74 -34 66 C-36 46 -32 24 -26 2 Z" fill={FLAT} stroke={LINE} strokeWidth={1.3} />
          <path d="M-20 60 Q-12 30 -8 8 M0 62 L0 8 M20 60 Q12 30 8 8" fill="none" stroke={LINE} strokeOpacity={0.12} strokeWidth={1.2} />
          <g transform="translate(-34 -8) rotate(-30)">
            <Finger L={34} W={14} />
          </g>
        </g>
      )}
    </g>
  );
}

function Pinch({ squeeze, gap }: { squeeze?: MotionValue<number>; gap: number }) {
  const zero = useMotionValue(0);
  const s = squeeze ?? zero;
  const indexTf = useTransform(s, (v) => `translate(${gap / 2 + 6.5 + (1 - v) * 10} ${-4 - (1 - v) * 2}) rotate(${-(10 + (1 - v) * 12)})`);
  const thumbTf = useTransform(s, (v) => `translate(${-gap / 2 - 8 - (1 - v) * 10} 0) rotate(${24 + (1 - v) * 10})`);
  return (
    <g>
      <TG t={indexTf}>
        <Finger L={70} W={13} />
      </TG>
      <CurledFingers x={gap / 2 + 4} y={58} n={3} w={13} />
      <HandBack top={70} w={58} cx={gap / 2 + 14} />
      <TG t={thumbTf}>
        <Finger L={58} W={16} />
      </TG>
    </g>
  );
}

/** Positions a hand: contact point at (x, y), rotated by angle, optionally mirrored. */
export function Hand({ t, pose, squeeze, scale, flip, opacity, gap }: HandProps & { t: MotionValue<string>; flip?: boolean; opacity?: MotionValue<number> | number }) {
  return (
    <TG t={t} opacity={opacity}>
      <g transform={flip ? 'scale(-1 1)' : undefined}>
        <HandShape pose={pose} squeeze={squeeze} scale={scale} gap={gap} />
      </g>
    </TG>
  );
}
