import { useId, type ReactNode } from 'react';
import { useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { TG } from './primitives';

/**
 * Reusable hand drawings. Local frame: the contact point (fingertip / pad / palm heel) is at (0, 0)
 * and the hand extends towards +y. Rotate with `angle` (degrees) and mirror with `flip`.
 * We see the back of the hand (nails visible), as when you look at someone touching their face.
 */
export type HandPose = 'four' | 'two' | 'index' | 'pinch' | 'thumb' | 'bunch' | 'palm';

const FILL = 'var(--finger)';
const LINE = 'var(--line)';

/** One finger: tip at (x, y), extending along +y for length L (before the group's rotation). */
export function Finger({ x = 0, y = 0, L = 60, W = 13, rot = 0, nail = true }: { x?: number; y?: number; L?: number; W?: number; rot?: number; nail?: boolean }) {
  const r = W / 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M${-r} ${r} A${r} ${r} 0 0 1 ${r} ${r} L${r * 1.06} ${L} L${-r * 1.06} ${L} Z`} fill={FILL} stroke={LINE} strokeWidth={1.2} strokeLinejoin="round" />
      {/* soft side shading */}
      <path d={`M${r * 0.55} ${r} L${r * 0.62} ${L}`} stroke={LINE} strokeOpacity={0.12} strokeWidth={W * 0.3} />
      {nail && <rect x={-r * 0.62} y={1.6} width={r * 1.24} height={W * 0.85} rx={r * 0.6} fill="var(--nail)" stroke={LINE} strokeOpacity={0.35} strokeWidth={0.8} />}
      <path d={`M${-r * 0.55} ${L * 0.38} q${r * 0.55} ${2.2} ${r * 1.1} 0`} fill="none" stroke={LINE} strokeOpacity={0.45} strokeWidth={0.9} />
      <path d={`M${-r * 0.55} ${L * 0.7} q${r * 0.55} ${2.2} ${r * 1.1} 0`} fill="none" stroke={LINE} strokeOpacity={0.45} strokeWidth={0.9} />
    </g>
  );
}

/** Back of the hand / palm block that fingers join into. */
function Palm({ x, y, w, h, r = 18 }: { x: number; y: number; w: number; h: number; r?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={r} fill={FILL} stroke={LINE} strokeWidth={1.2} />;
}

/** Curled fingers seen from the back (a loose fist). */
function Fist({ x, y, w = 44, h = 40 }: { x: number; y: number; w?: number; h?: number }) {
  const bumps = 4;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={FILL} stroke={LINE} strokeWidth={1.2} />
      {Array.from({ length: bumps - 1 }, (_, i) => (
        <path key={i} d={`M${x + ((i + 1) * w) / bumps} ${y + 2} l0 ${h * 0.45}`} stroke={LINE} strokeOpacity={0.35} strokeWidth={1} />
      ))}
    </g>
  );
}

function Fade({ id, from, to, children }: { id: string; from: number; to: number; children: ReactNode }) {
  // Fades the wrist end so hands appear to come in from off-stage.
  return (
    <>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1={from} x2="0" y2={to} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={400} height={500}>
          <rect x={-200} y={-200} width={400} height={500} fill={`url(#${id}-g)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`}>{children}</g>
    </>
  );
}

interface HandProps {
  pose: HandPose;
  /** Pinch: width of what is held between the pads when closed. */
  gap?: number;
  /** Pinch: 0 = open, 1 = closed. */
  squeeze?: MotionValue<number>;
  scale?: number;
}

/** A hand drawn in its local frame (contact at 0,0). Wrap it in a positioned/rotated group. */
export function HandShape({ pose, squeeze, scale = 1, gap = 4 }: HandProps) {
  const id = useId().replace(/:/g, '');
  return (
    <g transform={`scale(${scale})`}>
      {pose === 'four' && (
        <Fade id={id} from={80} to={150}>
          <Palm x={-30} y={52} w={60} h={110} r={22} />
          {[
            [-18.5, 7, 56],
            [-6.2, 1, 62],
            [6.2, 0, 63],
            [18.5, 5, 57],
          ].map(([x, y, L], i) => (
            <Finger key={i} x={x} y={y} L={L} W={12.4} />
          ))}
        </Fade>
      )}
      {pose === 'two' && (
        <Fade id={id} from={70} to={140}>
          <Fist x={-16} y={56} w={46} h={44} />
          <Palm x={-24} y={70} w={56} h={90} r={20} />
          <Finger x={-6.5} y={0} L={66} W={13} />
          <Finger x={6.5} y={2} L={64} W={13} />
        </Fade>
      )}
      {pose === 'index' && (
        <Fade id={id} from={75} to={145}>
          <Palm x={-14} y={66} w={56} h={90} r={20} />
          <Fist x={2} y={50} w={42} h={40} />
          <Finger x={-15} y={60} L={40} W={15} rot={28} />
          <Finger x={0} y={0} L={70} W={13.5} />
        </Fade>
      )}
      {pose === 'thumb' && (
        <Fade id={id} from={60} to={130}>
          <Palm x={-14} y={44} w={60} h={90} r={22} />
          <Fist x={6} y={24} w={44} h={42} />
          <Finger x={0} y={0} L={58} W={17} />
        </Fade>
      )}
      {pose === 'bunch' && (
        <Fade id={id} from={72} to={140}>
          <Palm x={-30} y={50} w={60} h={100} r={24} />
          {/* five fingertips gathered into one point */}
          {[
            [-5, 3, -16, 60, 12.5],
            [5, 3, 16, 60, 12.5],
            [-2.5, -2, -6, 64, 12.5],
            [2.5, -2, 6, 64, 12.5],
          ].map(([x, y, rot, L, W], i) => (
            <Finger key={i} x={x} y={y} rot={-rot} L={L} W={W} />
          ))}
          <Finger x={-9} y={8} rot={30} L={48} W={15} />
        </Fade>
      )}
      {pose === 'pinch' && <Pinch id={id} squeeze={squeeze} gap={gap} />}
      {pose === 'palm' && (
        <g>
          {/* heel of the palm at (0,0); palm and fingers extend along +y */}
          <path d="M-30 -2 Q-36 30 -34 66 L34 66 Q36 30 30 -2 Q0 -14 -30 -2 Z" fill={FILL} stroke={LINE} strokeWidth={1.3} />
          <path d="M-14 4 Q0 12 14 4" fill="none" stroke={LINE} strokeOpacity={0.35} strokeWidth={1} />
          {[
            [-24, 62, 50],
            [-8, 60, 58],
            [8, 60, 60],
            [24, 62, 52],
          ].map(([x, y, L], i) => (
            <g key={i} transform={`translate(${x} ${y + L}) rotate(180)`}>
              <Finger L={L} W={14} />
            </g>
          ))}
          {/* thumb along the side */}
          <g transform="translate(-40 -30) rotate(-13)">
            <Finger L={44} W={15} />
          </g>
        </g>
      )}
    </g>
  );
}

function Pinch({ id, squeeze, gap }: { id: string; squeeze?: MotionValue<number>; gap: number }) {
  const zero = useMotionValue(0);
  const s = squeeze ?? zero;
  // Index pad on the right of the target, thumb pad on the left; both open outwards when s = 0.
  const indexTf = useTransform(s, (v) => `translate(${gap / 2 + 6.5 + (1 - v) * 10} ${-4 - (1 - v) * 2}) rotate(${-(10 + (1 - v) * 12)})`);
  const thumbTf = useTransform(s, (v) => `translate(${-gap / 2 - 8 - (1 - v) * 10} ${0}) rotate(${24 + (1 - v) * 10})`);
  return (
    <Fade id={id} from={86} to={150}>
      <Palm x={-30} y={76} w={64} h={96} r={24} />
      <Fist x={-4} y={64} w={40} h={36} />
      <TG t={indexTf}>
        <Finger L={66} W={13} />
      </TG>
      <TG t={thumbTf}>
        <Finger L={52} W={16} />
      </TG>
    </Fade>
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
