import { motion, useTransform, type MotionValue } from 'framer-motion';
import type { AnimProps } from './types';
import { FaceFront } from '../components/svg/FaceFront';
import { Caption, MarmaDot, Mirror, Stage, ease, lerp, partialPath, qBez, seg, tf, useRepT, type Pt } from '../components/svg/primitives';
import { Hand } from '../components/svg/Hand';
import { MARMA, mirrorX } from '../data/marmaPoints';
import { groupOfIndex, phaseInfo } from '../lib/timeline';

// ---------- Step 4: Figure 8 ----------
const EIGHT = { cx: 150, cy: 186, a: 62, b: 118 };
const eightAt = (u: number): Pt => {
  const th = u * Math.PI * 2;
  return { x: EIGHT.cx + EIGHT.a * 2 * Math.sin(th) * Math.cos(th), y: EIGHT.cy - EIGHT.b * Math.sin(th) };
};

export function Figure8({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const pos = useTransform(t, eightAt);
  const px = useTransform(pos, (p) => (p.x - EIGHT.cx) / EIGHT.a);
  const py = useTransform(pos, (p) => (p.y - EIGHT.cy) / EIGHT.b);
  const d = useTransform(t, (v) => partialPath(eightAt, v, 120));
  const cx = useTransform(pos, (p) => p.x);
  const cy = useTransform(pos, (p) => p.y);
  return (
    <Stage label="Face looking at a large figure eight. The pupils follow a glowing dot along the path.">
      <FaceFront pupilX={px} pupilY={py} />
      <path d={partialPath(eightAt, 1, 120)} fill="none" stroke="var(--glow)" strokeWidth={2} strokeDasharray="4 6" opacity={0.45} />
      {!reduced && <motion.path d={d} fill="none" stroke="var(--glow)" strokeWidth={4} strokeLinecap="round" opacity={0.85} />}
      {!reduced && <motion.circle cx={cx} cy={cy} r={16} fill="url(#mh-glow)" />}
      {!reduced && <motion.circle cx={cx} cy={cy} r={5} fill="#fff6d8" />}
      <Caption x={150} y={30} size={11}>Head still · eyes only</Caption>
    </Stage>
  );
}

// ---------- Step 5: Side to side, up and down ----------
export function SideUpDown({ phase, reps, step, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const group = useTransform(phase, (p) => groupOfIndex(step?.pattern, phaseInfo(p, reps).idx));
  const amt = useTransform(t, (v) => Math.sin(v * Math.PI * 2));
  const px = useTransform([amt, group], ([a, g]: number[]) => (g === 0 ? a : 0));
  const py = useTransform([amt, group], ([a, g]: number[]) => (g === 1 ? -a : 0));
  const firstHalf = useTransform(t, (v): number => (v < 0.5 ? 1 : 0));
  const hR = useTransform([firstHalf, group], ([f, g]: number[]): number => (g === 0 ? (f ? 1 : 0.2) : 0));
  const hL = useTransform([firstHalf, group], ([f, g]: number[]): number => (g === 0 ? (f ? 0.2 : 1) : 0));
  const vU = useTransform([firstHalf, group], ([f, g]: number[]): number => (g === 1 ? (f ? 1 : 0.2) : 0));
  const vD = useTransform([firstHalf, group], ([f, g]: number[]): number => (g === 1 ? (f ? 0.2 : 1) : 0));
  const breath = useTransform(t, (v) => 0.75 + 0.25 * Math.sin(v * Math.PI));
  const ring = useTransform(breath, (b) => 150 * b);
  return (
    <Stage label="Face with the pupils moving right and left, then up and down, with the breath.">
      <motion.circle cx={150} cy={188} r={ring} fill="none" stroke="var(--glow)" strokeWidth={2} opacity={0.35} />
      <FaceFront pupilX={reduced ? undefined : px} pupilY={reduced ? undefined : py} />
      <Arrow x={262} y={180} dir="right" opacity={reduced ? 0.8 : hR} />
      <Arrow x={38} y={180} dir="left" opacity={reduced ? 0.8 : hL} />
      <Arrow x={150} y={30} dir="up" opacity={reduced ? 0.8 : vU} />
      <Arrow x={150} y={346} dir="down" opacity={reduced ? 0.8 : vD} />
    </Stage>
  );
}

function Arrow({ x, y, dir, opacity }: { x: number; y: number; dir: 'left' | 'right' | 'up' | 'down'; opacity: MotionValue<number> | number }) {
  const rot = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <motion.g opacity={opacity} transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M-14 0 L10 0 M2 -9 L12 0 L2 9" fill="none" stroke="var(--glow)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </motion.g>
  );
}

// ---------- Steps 6 & 7: four-finger strokes ----------
// Just below the brow line (brows sit at y ≈ 142–152).
const BROW = { p0: { x: 134, y: 160 }, c: { x: 111, y: 152 }, p1: { x: 86, y: 160 } };
// On the bony rim just under the eye (lower lid ≈ y 190).
const UNDER = { p0: { x: 131, y: 200 }, c: { x: 110, y: 210 }, p1: { x: 89, y: 199 } };

function Stroke({
  phase,
  reps,
  reduced,
  path,
  label,
  caption,
  angle,
}: AnimProps & { path: typeof BROW; label: string; caption: string; angle: number }) {
  const t = useRepT(phase, reps);
  const u = useTransform(t, (v) => (reduced ? 0.5 : ease(seg(v, 0.05, 0.75))));
  const at = (k: number) => qBez(path.p0, path.c, path.p1, k);
  const trail = useTransform(u, (v) => partialPath(at, v));
  const trailO = useTransform(t, (v) => (reduced ? 0.9 : v < 0.75 ? 0.9 : 0.9 * (1 - seg(v, 0.75, 1))));
  const handTf = useTransform([u, t], ([v, tt]: number[]) => {
    const p = at(v);
    // lift slightly while returning to the start
    const lift = tt > 0.78 ? Math.sin(Math.PI * seg(tt, 0.78, 1)) : 0;
    const back = tt > 0.78 ? ease(seg(tt, 0.78, 1)) : 0;
    const q = at(lerp(v, 0, back));
    const x = tt > 0.78 ? q.x : p.x;
    const y = tt > 0.78 ? q.y : p.y;
    return tf(x, y + (angle > 90 ? -lift * 8 : lift * 8), angle, 0.72);
  });
  const side = (
    <g>
      <path d={partialPath(at, 1)} fill="none" stroke="var(--glow)" strokeWidth={2} strokeDasharray="3 5" opacity={0.6} />
      <motion.path d={trail} fill="none" stroke="var(--glow)" strokeWidth={9} strokeLinecap="round" opacity={trailO} filter="url(#mh-soft)" />
      <Hand t={handTf} pose="four" />
    </g>
  );
  return (
    <Stage label={label}>
      <FaceFront closed />
      {side}
      <Mirror>{side}</Mirror>
      <Caption x={150} y={30} size={11}>{caption}</Caption>
    </Stage>
  );
}

export const BrowStroke = (p: AnimProps) => (
  <Stroke {...p} path={BROW} angle={14} label="Closed eyes. Four fingertips glide just below the eyebrows from inner to outer end." caption="Inside → outside · both sides" />
);
export const UnderEyeStroke = (p: AnimProps) => (
  <Stroke {...p} path={UNDER} angle={14} label="Closed eyes. Four fingertips glide along the bony rim under the eyes, away from the eyeball." caption="On the bone · never the eyeball" />
);

// ---------- Steps 8 & 9: three points, pull and release ----------
type ThreeKey = 'bhruhAntara' | 'bhruhMadhya' | 'bhruhAgra' | 'ashruAntara' | 'ashruMadhya' | 'ashruAgra';

function ThreePoints({
  phase,
  reps,
  step,
  reduced,
  keys,
  pull,
  label,
  labelDy = -11,
  angle,
}: AnimProps & { labelDy?: number; keys: ThreeKey[]; pull: number; label: string; angle: number }) {
  const t = useRepT(phase, reps);
  const active = useTransform(phase, (p) => groupOfIndex(step?.pattern, phaseInfo(p, reps).idx));
  const offset = useTransform(t, (v) => (reduced ? 0 : Math.sin(Math.PI * seg(v, 0.05, 0.7)) * pull));
  const thumbTf = useTransform([active, offset], ([a, o]: number[]) => {
    const m = MARMA[keys[Math.max(0, Math.min(2, a))]];
    return tf(m.x, m.y + o, angle, 0.62);
  });
  const hand = <Hand t={thumbTf} pose="thumb" flip />;
  return (
    <Stage label={label}>
      <FaceFront closed />
      {keys.map((k, i) => (
        <PointPair key={k} pKey={k} index={i} active={active} reduced={reduced} labelDy={labelDy} />
      ))}
      {hand}
      <Mirror>{hand}</Mirror>
      <Caption x={150} y={30} size={11}>Centre → outwards · both sides</Caption>
    </Stage>
  );
}

function PointPair({ pKey, index, active, reduced, labelDy }: { pKey: ThreeKey; index: number; active: MotionValue<number>; reduced: boolean; labelDy: number }) {
  const m = MARMA[pKey];
  const glowO = useTransform(active, (a) => (a === index ? 1 : a > index ? 0.35 : 0));
  return (
    <g>
      {[m.x, mirrorX(m.x)].map((x, i) => (
        <g key={i}>
          <motion.circle cx={x} cy={m.y} r={20} fill="url(#mh-glow)" opacity={reduced ? 0.8 : glowO} />
          <circle cx={x} cy={m.y} r={5} fill="#fff6d8" stroke="var(--glow)" strokeWidth={1.5} />
          <text x={x} y={m.y + labelDy} textAnchor="middle" className="fill-[var(--ink)] text-[11px] font-bold">
            {index + 1}
          </text>
        </g>
      ))}
    </g>
  );
}

export const BrowPoints = (p: AnimProps) => (
  <ThreePoints {...p} keys={['bhruhAntara', 'bhruhMadhya', 'bhruhAgra']} pull={-6} angle={12} label="Three numbered points on each eyebrow. The thumbs pull and release at the active point." />
);
export const UnderEyePoints = (p: AnimProps) => (
  <ThreePoints {...p} keys={['ashruAntara', 'ashruMadhya', 'ashruAgra']} pull={5} labelDy={-9} angle={22} label="Three points on the bone below each eye. The thumbs pull and release at the active point." />
);

// ---------- Step 10: Kaninaka ----------
export function Kaninaka({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const k = MARMA.kaninaka;
  const hand = useTransform(t, (v) => {
    const o = reduced ? 0 : Math.sin(Math.PI * seg(v, 0.05, 0.7)) * 4;
    return tf(k.x + 1 - o * 0.3, k.y + 2 + o, -4, 0.6);
  });
  const h = <Hand t={hand} pose="index" flip />;
  return (
    <Stage label="Closed eyes. An index fingertip at the inner corner of each eye pulls gently and releases.">
      <FaceFront closed />
      <MarmaDot x={k.x} y={k.y} r={6} reduced={reduced} />
      <MarmaDot x={mirrorX(k.x)} y={k.y} r={6} reduced={reduced} />
      {h}
      <Mirror>{h}</Mirror>
      <Caption x={150} y={30} size={11}>Inner corners · beside the nose</Caption>
    </Stage>
  );
}

// ---------- Step 11: Kaju Katli diamond — tap each point, one breath each ----------
const DIAMOND = [MARMA.nasaMula, MARMA.apangaL, MARMA.nasaAgra, MARMA.apangaR];
const DIAMOND_LABELS = [
  { l: 'Nasa Mula', dx: 0, dy: -12 },
  { l: 'Apanga L', dx: -2, dy: -12 },
  { l: 'Nasa Agra', dx: 0, dy: 22 },
  { l: 'Apanga R', dx: 2, dy: -12 },
];

export function KajuKatli({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const idx = useTransform(phase, (p) => phaseInfo(p, reps).idx);
  const hand = useTransform([idx, t], ([i, v]: number[]) => {
    const cur = DIAMOND[i % 4];
    const prev = DIAMOND[(i + 3) % 4];
    // lift → move → tap (first 22% of the breath), then rest lightly on the point
    const move = i === 0 && phase.get() < 0.25 ? 1 : ease(seg(v, 0, 0.16));
    const lift = Math.sin(Math.PI * seg(v, 0, 0.16));
    const press = v > 0.16 && v < 0.26 ? Math.sin(Math.PI * seg(v, 0.16, 0.26)) : 0;
    const x = lerp(prev.x, cur.x, move);
    const y = lerp(prev.y, cur.y, move) - lift * 12 + press * 1.5;
    return tf(x, y, -12, 0.6 - press * 0.02 + lift * 0.04);
  });
  const rippleR = useTransform(t, (v) => (v < 0.18 ? 0 : 5 + seg(v, 0.18, 0.7) * 20));
  const rippleO = useTransform(t, (v) => (v < 0.18 ? 0 : 1 - seg(v, 0.18, 0.7)));
  const rippleX = useTransform(idx, (i) => DIAMOND[i % 4].x);
  const rippleY = useTransform(idx, (i) => DIAMOND[i % 4].y);
  return (
    <Stage label="Four points of a diamond: root of the nose, outer corner of the left eye, tip of the nose, outer corner of the right eye. A fingertip lifts and taps each point in turn, one breath per point.">
      <FaceFront closed />
      <path
        d={`M${DIAMOND.map((p) => `${p.x} ${p.y}`).join(' L')} Z`}
        fill="rgba(244,162,38,0.06)"
        stroke="var(--glow)"
        strokeWidth={1.2}
        strokeDasharray="2 6"
        opacity={0.55}
      />
      {DIAMOND.map((p, i) => (
        <DiamondPoint key={i} i={i} idx={idx} reduced={reduced} x={p.x} y={p.y} {...DIAMOND_LABELS[i]} />
      ))}
      <motion.circle cx={rippleX} cy={rippleY} r={rippleR} fill="none" stroke="var(--glow)" strokeWidth={2.5} opacity={reduced ? 0 : rippleO} />
      {!reduced && <Hand t={hand} pose="index" />}
      <Caption x={150} y={30} size={11}>Tap · one breath · lift to the next</Caption>
    </Stage>
  );
}

function DiamondPoint({ i, idx, reduced, x, y, l, dx, dy }: { i: number; idx: MotionValue<number>; reduced: boolean; x: number; y: number; l: string; dx: number; dy: number }) {
  const o = useTransform(idx, (k) => (k % 4 === i ? 1 : 0.3));
  return (
    <g>
      <motion.circle cx={x} cy={y} r={17} fill="url(#mh-glow)" opacity={reduced ? 0.8 : o} />
      <circle cx={x} cy={y} r={4.5} fill="#fff6d8" stroke="var(--glow)" strokeWidth={1.4} />
      <text x={x + dx} y={y + dy} textAnchor="middle" className="fill-[var(--ink)] text-[9px] font-semibold">
        {l}
      </text>
    </g>
  );
}

// ---------- Step 12: Nasa Mula pinch ----------
export function NasaMulaPinch({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  // Grip (0–0.2), gently pull away from the face (0.2–0.55), release and let go (0.55–0.85).
  const squeeze = useTransform(t, (v) => (reduced ? 1 : v < 0.2 ? ease(v / 0.2) : v < 0.6 ? 1 : 1 - ease(seg(v, 0.6, 0.85))));
  const pull = useTransform(t, (v) => (reduced ? 0 : v < 0.2 ? 0 : v < 0.55 ? ease(seg(v, 0.2, 0.45)) : 1 - ease(seg(v, 0.55, 0.75))));
  const m = MARMA.nasaMula;
  // "Pull" = towards you: the hand grows slightly and lifts a touch, the skin glow brightens.
  const hand = useTransform(pull, (p) => tf(m.x, m.y + 2 - p * 3, 0, 0.72 + p * 0.06));
  const skinGlow = useTransform(pull, (p) => 0.2 + p * 0.8);
  return (
    <Stage label="Closed eyes. Thumb and index finger hold the bridge of the nose, gently pull it away from the face, and release.">
      <FaceFront closed />
      <motion.ellipse cx={m.x} cy={m.y + 2} rx={16} ry={10} fill="url(#mh-glow)" opacity={skinGlow} />
      <MarmaDot x={m.x} y={m.y} r={7} reduced={reduced} />
      <Hand t={hand} pose="pinch" squeeze={squeeze} gap={12} />
      <Caption x={150} y={30} size={11}>Bridge of the nose · gently pull, release</Caption>
    </Stage>
  );
}

// ---------- Step 13: Cheekbones ----------
// Along the zygomatic bone: from below the outer eye, up and out towards the temple. Well above the mouth.
const CHEEK = { p0: { x: 97, y: 242 }, c: { x: 94, y: 226 }, p1: { x: 91, y: 210 } };
export function Cheekbones({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const u = useTransform(t, (v) => (reduced ? 0.5 : ease(seg(v, 0.05, 0.75))));
  const at = (k: number) => qBez(CHEEK.p0, CHEEK.c, CHEEK.p1, k);
  const hand = useTransform([u, t], ([v, tt]: number[]) => {
    const back = tt > 0.78 ? ease(seg(tt, 0.78, 1)) : 0;
    const lift = tt > 0.78 ? Math.sin(Math.PI * seg(tt, 0.78, 1)) : 0;
    const p = at(lerp(v, 0, back));
    return tf(p.x, p.y + lift * 6, 10, 0.62);
  });
  const trail = useTransform(u, (v) => partialPath(at, v));
  const side = (
    <g>
      <path d={partialPath(at, 1)} fill="none" stroke="var(--glow)" strokeWidth={2} strokeDasharray="3 5" opacity={0.6} />
      <motion.path d={trail} fill="none" stroke="var(--glow)" strokeWidth={9} strokeLinecap="round" opacity={0.8} filter="url(#mh-soft)" />
      <Hand t={hand} pose="two" />
      <path d="M60 240 L60 206 M51 215 L60 204 L69 215" fill="none" stroke="var(--glow)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  return (
    <Stage label="Closed eyes. Two fingertips on each cheekbone push gently upward along the bone.">
      <FaceFront closed />
      <MarmaDot x={MARMA.ganda.x} y={MARMA.ganda.y - 12} r={5} reduced={reduced} />
      <MarmaDot x={mirrorX(MARMA.ganda.x)} y={MARMA.ganda.y - 12} r={5} reduced={reduced} />
      {side}
      <Mirror>{side}</Mirror>
      <Caption x={150} y={30} size={11}>On the cheekbone · bottom → top</Caption>
    </Stage>
  );
}

// ---------- Step 14: Palming — base (heel) of the palms over the eyes ----------
export function Palming({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const cup = useTransform(phase, (p) => (reduced ? 1 : ease(seg(p, 0, 0.18))));
  const breath = useTransform(t, (v) => (v < 0.5 ? ease(v * 2) : 1 - ease((v - 0.5) * 2)));
  const glowR = useTransform(breath, (b) => 30 + b * 22);
  const glowO = useTransform([breath, cup], ([b, c]: number[]) => c * (0.35 + b * 0.5));
  // Heel of the palm rests on the closed eye; fingers point up over the forehead, leaning inwards.
  const palm = useTransform(cup, (c) => tf(lerp(60, 112, c), lerp(330, 190, c), 189, 0.95));
  const label = useTransform(t, (v): string => (v < 0.5 ? 'Inhale' : 'Exhale'));
  const side = (
    <g>
      <Hand t={palm} pose="palm" />
      <motion.circle cx={111} cy={186} r={glowR} fill="url(#mh-warm)" opacity={glowO} />
    </g>
  );
  return (
    <Stage label="The base of each warm palm rests gently over a closed eye, fingers on the forehead. A soft glow breathes in and out.">
      <FaceFront closed />
      {side}
      <Mirror>{side}</Mirror>
      {!reduced && (
        <motion.text x={150} y={34} textAnchor="middle" className="fill-[var(--ink)] text-[13px] font-semibold uppercase tracking-widest">
          {label}
        </motion.text>
      )}
      <Caption x={150} y={352} size={10}>Base of the palm on the eyes · no pressure</Caption>
    </Stage>
  );
}

// ---------- Transition: close the eyes ----------
export function CloseEyes({ phase }: AnimProps) {
  const lid = useTransform(phase, (p) => ease(seg(p, 0.15, 0.75)));
  return (
    <Stage label="The eyelids slowly close.">
      <FaceFront lid={lid} />
    </Stage>
  );
}
