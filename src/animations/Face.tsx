import { motion, useTransform, type MotionValue } from 'framer-motion';
import type { AnimProps } from './types';
import { FaceFront } from '../components/svg/FaceFront';
import { TG, Caption, Fingertip, MarmaDot, Mirror, Stage, ease, lerp, partialPath, qBez, seg, tf, useRepT, type Pt } from '../components/svg/primitives';
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
const BROW = { p0: { x: 136, y: 160 }, c: { x: 112, y: 148 }, p1: { x: 84, y: 158 } };
const UNDER = { p0: { x: 134, y: 200 }, c: { x: 111, y: 214 }, p1: { x: 88, y: 199 } };

function Stroke({ phase, reps, reduced, path, label, caption }: AnimProps & { path: typeof BROW; label: string; caption: string }) {
  const t = useRepT(phase, reps);
  const u = useTransform(t, (v) => (reduced ? 1 : ease(seg(v, 0.05, 0.75))));
  const at = (k: number) => qBez(path.p0, path.c, path.p1, k);
  const trail = useTransform(u, (v) => partialPath(at, v));
  const trailO = useTransform(t, (v) => (reduced ? 0.9 : v < 0.75 ? 0.9 : 0.9 * (1 - seg(v, 0.75, 1))));
  const handTf = useTransform(u, (v) => {
    const p = at(v);
    return tf(p.x, p.y);
  });
  const handO = useTransform(t, (v) => (reduced ? 0 : v < 0.8 ? 1 : 1 - seg(v, 0.8, 0.95)));
  const side = (
    <g>
      <path d={partialPath(at, 1)} fill="none" stroke="var(--glow)" strokeWidth={2} strokeDasharray="3 5" opacity={0.5} />
      <motion.path d={trail} fill="none" stroke="var(--glow)" strokeWidth={9} strokeLinecap="round" opacity={trailO} filter="url(#mh-soft)" />
      <TG t={handTf} opacity={handO}>
        {/* four fingertips side by side */}
        {[-15, -5, 5, 15].map((dx, i) => (
          <g key={i} transform={`translate(${dx} ${-12 - Math.abs(dx) * 0.2}) rotate(${dx * 0.8}) scale(0.62)`}>
            <Fingertip w={16} h={20} tone="b" />
          </g>
        ))}
      </TG>
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
  <Stroke {...p} path={BROW} label="Closed eyes. Four fingertips glide below the eyebrows from inner to outer end." caption="Inside → outside · both sides" />
);
export const UnderEyeStroke = (p: AnimProps) => (
  <Stroke {...p} path={UNDER} label="Closed eyes. Four fingertips glide along the bone under the eyes." caption="Along the bone · never the eyeball" />
);

// ---------- Steps 8 & 9: three points, pull and release ----------
function ThreePoints({
  phase,
  reps,
  step,
  reduced,
  keys,
  pull,
  label,
  labelDy = -11,
}: AnimProps & { labelDy?: number; keys: ('bhruhAntara' | 'bhruhMadhya' | 'bhruhAgra' | 'ashruAntara' | 'ashruMadhya' | 'ashruAgra')[]; pull: number; label: string }) {
  const t = useRepT(phase, reps);
  const active = useTransform(phase, (p) => groupOfIndex(step?.pattern, phaseInfo(p, reps).idx));
  const offset = useTransform(t, (v) => Math.sin(Math.PI * seg(v, 0.05, 0.7)) * pull);
  return (
    <Stage label={label}>
      <FaceFront closed />
      {keys.map((k, i) => (
        <PointPair key={k} pKey={k} index={i} active={active} offset={offset} reduced={reduced} labelDy={labelDy} />
      ))}
      <Caption x={150} y={30} size={11}>Centre → outwards · both sides</Caption>
    </Stage>
  );
}

function PointPair({
  pKey,
  index,
  active,
  offset,
  reduced,
  labelDy,
}: {
  labelDy: number;
  pKey: keyof typeof MARMA;
  index: number;
  active: MotionValue<number>;
  offset: MotionValue<number>;
  reduced: boolean;
}) {
  const m = MARMA[pKey];
  const isActive = useTransform(active, (a) => (a === index ? 1 : 0));
  const glowO = useTransform(active, (a) => (a === index ? 1 : a > index ? 0.35 : 0));
  const thumbL = useTransform(offset, (o) => tf(m.x, m.y + 14 - o, 0, 0.8));
  const thumbR = useTransform(offset, (o) => tf(mirrorX(m.x), m.y + 14 - o, 0, 0.8));
  const thumbO = useTransform(isActive, (v) => (reduced ? 0 : v));
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
      <motion.g opacity={thumbO}>
        <TG t={thumbL}>
          <g transform="translate(0 6)">
            <Fingertip w={20} h={22} tone="b" />
          </g>
        </TG>
        <TG t={thumbR}>
          <g transform="translate(0 6)">
            <Fingertip w={20} h={22} tone="b" />
          </g>
        </TG>
      </motion.g>
    </g>
  );
}

export const BrowPoints = (p: AnimProps) => (
  <ThreePoints {...p} keys={['bhruhAntara', 'bhruhMadhya', 'bhruhAgra']} pull={-7} label="Three numbered points on each eyebrow. The thumbs pull and release at the active point." />
);
export const UnderEyePoints = (p: AnimProps) => (
  <ThreePoints {...p} keys={['ashruAntara', 'ashruMadhya', 'ashruAgra']} pull={6} labelDy={-9} label="Three points on the bone below each eye. The thumbs pull and release at the active point." />
);

// ---------- Step 10: Kaninaka ----------
export function Kaninaka({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const o = useTransform(t, (v) => Math.sin(Math.PI * seg(v, 0.05, 0.7)) * 5);
  const k = MARMA.kaninaka;
  const l = useTransform(o, (v) => tf(k.x + 2 + v * 0.3, k.y + 18 + v, -20, 0.7));
  const r = useTransform(o, (v) => tf(mirrorX(k.x) - 2 - v * 0.3, k.y + 18 + v, 20, 0.7));
  return (
    <Stage label="Closed eyes. Fingertips at the inner corners of the eyes pull and release.">
      <FaceFront closed />
      <MarmaDot x={k.x} y={k.y} r={6} reduced={reduced} />
      <MarmaDot x={mirrorX(k.x)} y={k.y} r={6} reduced={reduced} />
      {!reduced && (
        <>
          <TG t={l}>
            <Fingertip w={16} h={20} tone="b" />
          </TG>
          <TG t={r}>
            <Fingertip w={16} h={20} tone="b" />
          </TG>
        </>
      )}
      <Caption x={150} y={30} size={11}>Inner corners · beside the nose</Caption>
    </Stage>
  );
}

// ---------- Step 11: Kaju Katli diamond ----------
const DIAMOND: Pt[] = [MARMA.nasaMula, MARMA.apangaL, MARMA.nasaAgra, MARMA.apangaR, MARMA.nasaMula];
const diamondAt = (u: number): Pt => {
  const s = Math.min(u, 0.9999) * 4;
  const i = Math.floor(s);
  return { x: lerp(DIAMOND[i].x, DIAMOND[i + 1].x, s - i), y: lerp(DIAMOND[i].y, DIAMOND[i + 1].y, s - i) };
};

export function KajuKatli({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const u = useTransform(t, (v) => (reduced ? 1 : v));
  const d = useTransform(u, (v) => partialPath(diamondAt, v, 120));
  const finger = useTransform(u, (v) => {
    const p = diamondAt(v);
    return tf(p.x + 6, p.y + 16, -15, 0.7);
  });
  const pts = [
    { ...MARMA.nasaMula, l: 'Nasa Mula', dy: -12 },
    { ...MARMA.apangaL, l: 'Apanga L', dy: -12 },
    { ...MARMA.nasaAgra, l: 'Nasa Agra', dy: 22 },
    { ...MARMA.apangaR, l: 'Apanga R', dy: -12 },
  ];
  return (
    <Stage label="A diamond traced from the root of the nose to the left eye, the nose tip, the right eye and back.">
      <FaceFront closed />
      <path d={partialPath(diamondAt, 1, 120)} fill="rgba(244,162,38,0.08)" stroke="var(--glow)" strokeWidth={1.5} strokeDasharray="3 5" opacity={0.6} />
      <motion.path d={d} fill="none" stroke="var(--glow)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p) => (
        <g key={p.l}>
          <MarmaDot x={p.x} y={p.y} r={6} reduced={reduced} />
          <text x={p.x} y={p.y + p.dy} textAnchor="middle" className="fill-[var(--ink)] text-[9px] font-semibold">
            {p.l}
          </text>
        </g>
      ))}
      {!reduced && (
        <TG t={finger}>
          <Fingertip w={16} h={20} tone="b" />
        </TG>
      )}
    </Stage>
  );
}

// ---------- Step 12: Nasa Mula pinch ----------
export function NasaMulaPinch({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const squeeze = useTransform(t, (v) => Math.sin(Math.PI * seg(v, 0.05, 0.75)));
  const m = MARMA.nasaMula;
  const thumb = useTransform(squeeze, (s) => tf(m.x - 22 + s * 8, m.y - 2, 80, 0.8));
  const index = useTransform(squeeze, (s) => tf(m.x + 22 - s * 8, m.y - 2, -80, 0.8));
  return (
    <Stage label="Closed eyes. Thumb and index finger gently pinch the bridge of the nose.">
      <FaceFront closed />
      <MarmaDot x={m.x} y={m.y} r={7} reduced={reduced} />
      <Caption x={150} y={30} size={11}>Nasa Mula · bridge of the nose</Caption>
      {!reduced && (
        <>
          <TG t={thumb}>
            <Fingertip w={20} h={22} tone="b" />
          </TG>
          <TG t={index}>
            <Fingertip w={16} h={20} tone="b" />
          </TG>
        </>
      )}
    </Stage>
  );
}

// ---------- Step 13: Cheekbones ----------
const CHEEK = { p0: { x: 112, y: 254 }, c: { x: 92, y: 246 }, p1: { x: 78, y: 214 } };
export function Cheekbones({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const u = useTransform(t, (v) => (reduced ? 1 : ease(seg(v, 0.05, 0.75))));
  const at = (k: number) => qBez(CHEEK.p0, CHEEK.c, CHEEK.p1, k);
  const hand = useTransform(u, (v) => {
    const p = at(v);
    return tf(p.x + 4, p.y + 14, -25, 0.75);
  });
  const handO = useTransform(t, (v) => (reduced ? 0 : v < 0.8 ? 1 : 1 - seg(v, 0.8, 0.95)));
  const trail = useTransform(u, (v) => partialPath(at, v));
  const side = (
    <g>
      <path d={partialPath(at, 1)} fill="none" stroke="var(--glow)" strokeWidth={2} strokeDasharray="3 5" opacity={0.5} />
      <motion.path d={trail} fill="none" stroke="var(--glow)" strokeWidth={9} strokeLinecap="round" opacity={0.8} filter="url(#mh-soft)" />
      <TG t={hand} opacity={handO}>
        {[-8, 8].map((dx) => (
          <g key={dx} transform={`translate(${dx} 0)`}>
            <Fingertip w={15} h={19} tone="b" />
          </g>
        ))}
      </TG>
      <path d="M58 240 L58 206 M48 216 L58 204 L68 216" fill="none" stroke="var(--glow)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  return (
    <Stage label="Closed eyes. Fingertips push upward along the cheekbones.">
      <FaceFront closed />
      {side}
      <Mirror>{side}</Mirror>
      <Caption x={150} y={30} size={11}>Bottom → top · both sides</Caption>
    </Stage>
  );
}

// ---------- Step 14: Palming ----------
export function Palming({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  const cup = useTransform(phase, (p) => (reduced ? 1 : ease(seg(p, 0, 0.4))));
  const breath = useTransform(t, (v) => (v < 0.5 ? ease(v * 2) : 1 - ease((v - 0.5) * 2)));
  const glowR = useTransform(breath, (b) => 40 + b * 30);
  const glowO = useTransform([breath, cup], ([b, c]: number[]) => c * (0.45 + b * 0.5));
  const palmL = useTransform(cup, (c) => `translate(${lerp(-80, 0, c)} ${lerp(80, 0, c)})`);
  const palmR = useTransform(cup, (c) => `translate(${lerp(80, 0, c)} ${lerp(80, 0, c)})`);
  const label = useTransform(t, (v): string => (v < 0.5 ? 'Inhale' : 'Exhale'));
  return (
    <Stage label="Warm palms cup over the closed eyes. A soft glow breathes in and out.">
      <FaceFront closed />
      <TG t={palmL}>
        <Palm cx={111} />
      </TG>
      <TG t={palmR}>
        <Palm cx={189} flip />
      </TG>
      <motion.circle cx={111} cy={182} r={glowR} fill="url(#mh-warm)" opacity={glowO} />
      <motion.circle cx={189} cy={182} r={glowR} fill="url(#mh-warm)" opacity={glowO} />
      {!reduced && (
        <motion.text x={150} y={34} textAnchor="middle" className="fill-[var(--ink)] text-[13px] font-semibold uppercase tracking-widest">
          {label}
        </motion.text>
      )}
    </Stage>
  );
}

function Palm({ cx, flip }: { cx: number; flip?: boolean }) {
  // Drawn for the left eye; mirrored for the right. Fingers rest on the forehead, leaning inwards.
  const s = flip ? -1 : 1;
  const fingers = [0, 1, 2, 3].map((k) => {
    const bx = -20 + k * 12;
    const by = -40 + Math.abs(k - 1.5) * 3;
    return { d: `M${bx} ${by} Q${bx + 4} ${by - 30} ${bx + 16} ${by - 52 + Math.abs(k - 1.5) * 8}` };
  });
  return (
    <g transform={`translate(${cx} 186) scale(${s} 1)`} opacity={0.95}>
      {fingers.map((f, i) => (
        <path key={`o${i}`} d={f.d} fill="none" stroke="var(--line)" strokeWidth={14} strokeLinecap="round" />
      ))}
      {fingers.map((f, i) => (
        <path key={`f${i}`} d={f.d} fill="none" stroke="var(--finger)" strokeWidth={11.5} strokeLinecap="round" />
      ))}
      <path d="M-34 -14 Q-38 -46 -8 -48 Q30 -50 34 -20 Q38 10 26 40 Q4 70 -22 58 Q-40 40 -34 -14 Z" fill="var(--finger)" stroke="var(--line)" strokeWidth={1.3} />
      <path d="M-30 6 Q-48 -6 -52 -30" fill="none" stroke="var(--line)" strokeWidth={15} strokeLinecap="round" />
      <path d="M-30 6 Q-48 -6 -52 -30" fill="none" stroke="var(--finger)" strokeWidth={12.5} strokeLinecap="round" />
    </g>
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
