import { motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { useId } from 'react';
import { EYES } from '../../data/marmaPoints';

interface Props {
  /** 0 = open, 1 = closed. */
  lid?: MotionValue<number>;
  closed?: boolean;
  /** -1..1 (screen left → right). */
  pupilX?: MotionValue<number>;
  /** -1..1 (up → down). */
  pupilY?: MotionValue<number>;
  /** 1 = normal pupil size. */
  pupilScale?: MotionValue<number>;
  /** 0..1: both eyes turn inwards and down (focusing on the nose tip). */
  converge?: MotionValue<number>;
}

/** Front-facing face, drawn as a mirror image of the user. Eyes and pupils are controllable. */
export function FaceFront({ lid, closed, pupilX, pupilY, pupilScale, converge }: Props) {
  const zero = useMotionValue(closed ? 1 : 0);
  const one = useMotionValue(1);
  const center = useMotionValue(0);
  const lidV = lid ?? zero;
  const px = pupilX ?? center;
  const py = pupilY ?? center;
  const ps = pupilScale ?? one;
  const cv = converge ?? center;
  const uid = useId().replace(/:/g, '');

  return (
    <g>
      {/* neck + shoulders */}
      <path d="M118 300 L118 340 Q150 352 182 340 L182 300 Z" fill="var(--skin-shade)" />
      <path d="M40 360 Q60 328 118 326 L182 326 Q240 328 260 360 Z" fill="var(--cloth)" />
      {/* ears */}
      <ellipse cx="56" cy="196" rx="13" ry="24" fill="var(--skin-shade)" stroke="var(--line)" strokeWidth="1.2" />
      <ellipse cx="244" cy="196" rx="13" ry="24" fill="var(--skin-shade)" stroke="var(--line)" strokeWidth="1.2" />
      {/* face */}
      <path
        d="M150 62 C 212 62 246 108 246 176 C 246 250 206 312 150 314 C 94 312 54 250 54 176 C 54 108 88 62 150 62 Z"
        fill="var(--skin)"
        stroke="var(--line)"
        strokeWidth="1.4"
      />
      {/* hair */}
      <path
        d="M56 168 C 46 92 96 50 152 52 C 214 52 256 98 244 168 C 236 128 214 104 184 98 C 160 112 118 116 92 108 C 72 122 60 140 56 168 Z"
        fill="var(--hair)"
      />
      {/* brows */}
      <path d="M134 152 Q112 138 84 150" fill="none" stroke="var(--hair)" strokeWidth="5" strokeLinecap="round" />
      <path d="M166 152 Q188 138 216 150" fill="none" stroke="var(--hair)" strokeWidth="5" strokeLinecap="round" />
      {/* eyes */}
      {[EYES.left, EYES.right].map((e, i) => (
        <Eye key={i} id={`${uid}-${i}`} e={e} lid={lidV} px={px} py={py} ps={ps} cv={cv} side={i === 0 ? 1 : -1} />
      ))}
      {/* nose */}
      <path d="M150 170 C 146 196 140 218 138 232 Q150 242 162 232 C 160 218 154 196 150 170" fill="var(--skin-shade)" opacity="0.55" />
      <path d="M138 234 Q150 244 162 234" fill="none" stroke="var(--line)" strokeWidth="1.4" strokeLinecap="round" />
      {/* cheeks */}
      <ellipse cx="92" cy="244" rx="18" ry="10" fill="#e8907a" opacity="0.18" />
      <ellipse cx="208" cy="244" rx="18" ry="10" fill="#e8907a" opacity="0.18" />
      {/* mouth */}
      <path d="M130 274 Q150 286 170 274" fill="none" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Eye({
  id,
  e,
  lid,
  px,
  py,
  ps,
  cv,
  side,
}: {
  cv: MotionValue<number>;
  side: number;
  id: string;
  e: { cx: number; cy: number; rx: number; ry: number };
  lid: MotionValue<number>;
  px: MotionValue<number>;
  py: MotionValue<number>;
  ps: MotionValue<number>;
}) {
  const irisX = useTransform([px, cv], ([v, c]: number[]) => e.cx + v * (e.rx - 10) + side * c * 9);
  const irisY = useTransform([py, cv], ([v, c]: number[]) => e.cy + v * (e.ry - 4) + c * 4);
  const pupilR = useTransform(ps, (v) => 3.6 * v);
  const hlX = useTransform(irisX, (v) => v - 3);
  const hlY = useTransform(irisY, (v) => v - 3);
  const lidH = useTransform(lid, (v) => (e.ry * 2 + 6) * v);
  const closedOpacity = useTransform(lid, [0.7, 1], [0, 1]);
  const lashY = useTransform(lid, (v) => e.cy - e.ry - 3 + (e.ry * 2 + 6) * v);
  const shape = `M${e.cx - e.rx} ${e.cy} Q${e.cx} ${e.cy - e.ry * 2} ${e.cx + e.rx} ${e.cy} Q${e.cx} ${e.cy + e.ry * 1.6} ${e.cx - e.rx} ${e.cy} Z`;
  return (
    <g>
      <clipPath id={id}>
        <path d={shape} />
      </clipPath>
      <path d={shape} fill="#fffdf8" />
      <g clipPath={`url(#${id})`}>
        <motion.circle cx={irisX} cy={irisY} r={9.5} fill="#5b3a25" />
        <motion.circle cx={irisX} cy={irisY} r={pupilR} fill="#1b120c" />
        <motion.circle cx={hlX} cy={hlY} r={1.6} fill="#fff" opacity={0.8} />
        <motion.rect x={e.cx - e.rx - 2} y={e.cy - e.ry - 3} width={e.rx * 2 + 4} height={lidH} fill="var(--skin)" />
        <motion.line x1={e.cx - e.rx} x2={e.cx + e.rx} y1={lashY} y2={lashY} stroke="var(--line)" strokeWidth={1.2} opacity={useTransform(lid, [0, 0.1, 0.9, 1], [0, 1, 1, 0])} />
      </g>
      <path d={shape} fill="none" stroke="var(--line)" strokeWidth="1.4" />
      {/* closed lid line */}
      <motion.path
        d={`M${e.cx - e.rx} ${e.cy} Q${e.cx} ${e.cy + e.ry * 1.2} ${e.cx + e.rx} ${e.cy}`}
        fill="none"
        stroke="var(--line)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={closedOpacity}
      />
    </g>
  );
}
