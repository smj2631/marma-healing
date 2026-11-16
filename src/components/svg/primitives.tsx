import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Progress of t inside the window [a, b], clamped 0..1. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** Smooth ease in-out. */
export const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export type Pt = { x: number; y: number };
export const qBez = (p0: Pt, c: Pt, p1: Pt, u: number): Pt => ({
  x: (1 - u) ** 2 * p0.x + 2 * (1 - u) * u * c.x + u * u * p1.x,
  y: (1 - u) ** 2 * p0.y + 2 * (1 - u) * u * c.y + u * u * p1.y,
});
/** Path string for a curve sampled from 0 to u. */
export const partialPath = (f: (u: number) => Pt, u: number, samples = 48) => {
  if (u <= 0.001) return 'M0 0';
  const n = Math.max(2, Math.ceil(samples * u));
  let d = '';
  for (let i = 0; i <= n; i++) {
    const p = f((u * i) / n);
    d += `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  return d;
};

/** Local progress (0..1) inside the current rep, from the continuous clock phase. */
export function useRepT(phase: MotionValue<number>, reps: number) {
  return useTransform(phase, (p) => (p >= reps ? 1 : p - Math.floor(p)));
}

/** Viewport wrapper shared by every animation. All figures use a 300 × 360 viewBox. */
export function Stage({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 300 360" className="h-full w-full" role="img" aria-label={label}>
      <defs>
        <radialGradient id="mh-glow">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="35%" stopColor="var(--glow)" />
          <stop offset="100%" stopColor="var(--glow)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mh-warm">
          <stop offset="0%" stopColor="#ffd27a" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#f4a226" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f4a226" stopOpacity="0" />
        </radialGradient>
        <filter id="mh-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="mh-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      {children}
    </svg>
  );
}

/** A glowing marma point. */
export function MarmaDot({
  x,
  y,
  active = true,
  r = 7,
  reduced,
  state = 'active',
  label,
}: {
  x: number;
  y: number;
  active?: boolean;
  r?: number;
  reduced?: boolean;
  state?: 'active' | 'done' | 'pending';
  label?: string;
}) {
  const s = active ? state : 'pending';
  return (
    <g>
      {s !== 'pending' && (
        <motion.circle
          cx={x}
          cy={y}
          r={r * 3}
          fill="url(#mh-glow)"
          opacity={s === 'done' ? 0.35 : 0.9}
          initial={false}
          animate={reduced || s === 'done' ? undefined : { r: [r * 2.4, r * 3.4, r * 2.4], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <circle
        cx={x}
        cy={y}
        r={s === 'pending' ? r * 0.7 : r * 0.55}
        fill={s === 'pending' ? 'none' : '#fff6d8'}
        stroke={s === 'pending' ? 'var(--glow)' : 'none'}
        strokeWidth={1.5}
        opacity={s === 'pending' ? 0.6 : 1}
      />
      {label && (
        <text x={x} y={y - r - 6} textAnchor="middle" className="fill-[var(--ink)] text-[10px] font-semibold">
          {label}
        </text>
      )}
    </g>
  );
}

/** Rounded fingertip pad with a nail, pointing "up" before rotation. */
export function Fingertip({ w = 16, h = 22, nail = true, tone = 'a' }: { w?: number; h?: number; nail?: boolean; tone?: 'a' | 'b' }) {
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h * 1.6} rx={w / 2} fill={tone === 'a' ? 'var(--finger)' : 'var(--finger2)'} stroke="var(--line)" strokeWidth={1.2} />
      {nail && <rect x={-w / 2 + 3.5} y={-h / 2 + 2.5} width={w - 7} height={h * 0.45} rx={(w - 7) / 2} fill="var(--nail)" opacity={0.85} />}
    </g>
  );
}

/** A thumb: a broader fingertip. */
export const Thumb = () => <Fingertip w={22} h={26} />;

/** Helper: build an SVG transform string. */
export const tf = (x: number, y: number, r = 0, sc = 1) => `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r}) scale(${sc})`;

export function Caption({ x, y, children, size = 12, opacity }: { x: number; y: number; children: ReactNode; size?: number; opacity?: MotionValue<number> | number }) {
  return (
    <motion.text
      x={x}
      y={y}
      textAnchor="middle"
      opacity={opacity}
      style={{ fontSize: size, letterSpacing: '0.08em' }}
      className="fill-[var(--ink)] font-semibold uppercase"
    >
      {children}
    </motion.text>
  );
}

/** Mirror a group around the face's vertical centre line (x = 150). */
export const Mirror = ({ children }: { children: ReactNode }) => <g transform="matrix(-1 0 0 1 300 0)">{children}</g>;

/**
 * <g> whose transform attribute follows a MotionValue<string>. Written straight to the DOM,
 * so 60 fps animation doesn't re-render React and Safari gets a plain SVG transform.
 */
export function TG({ t, opacity, children }: { t: MotionValue<string>; opacity?: MotionValue<number> | number; children: ReactNode }) {
  const ref = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    const set = (v: string) => ref.current?.setAttribute('transform', v);
    set(t.get());
    return t.on('change', set);
  }, [t]);
  return (
    <motion.g ref={ref} opacity={opacity}>
      {children}
    </motion.g>
  );
}
