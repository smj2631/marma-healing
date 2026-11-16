import { motion, useTransform } from 'framer-motion';
import type { AnimProps } from './types';
import { FaceFront } from '../components/svg/FaceFront';
import { Stage, ease, seg, useRepT } from '../components/svg/primitives';
import { MARMA } from '../data/marmaPoints';

/** Step 3 — focus shifts between a distant horizon and the tip of your own nose. */
export function NearFar({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  // near = 0 → focus far (first half), near = 1 → focus on the nose tip (second half)
  const near = useTransform(t, (v) => (reduced ? 0.5 : v < 0.5 ? 1 - ease(seg(v, 0, 0.12)) : ease(seg(v, 0.5, 0.62))));
  const farSharp = useTransform(near, (n) => 1 - n);
  const pupil = useTransform(near, (n) => 1.25 - n * 0.5);
  const farLabel = useTransform(near, [0, 0.5, 1], [1, 0.15, 0]);
  const nearLabel = useTransform(near, [0, 0.5, 1], [0, 0.15, 1]);
  const noseGlow = useTransform(near, [0, 1], [0.1, 1]);
  const lineO = useTransform(near, [0, 1], [0.7, 0]);
  const lineNearO = useTransform(near, [0, 1], [0, 0.8]);

  // Face sits in the lower half: scale 0.62, translated.
  const S = 0.62;
  const FX = 150 - 150 * S;
  const FY = 128;
  const nose = { x: FX + MARMA.nasaAgra.x * S, y: FY + MARMA.nasaAgra.y * S };
  const eyes = [
    { x: FX + 111 * S, y: FY + 181 * S },
    { x: FX + 189 * S, y: FY + 181 * S },
  ];

  const mountains = (
    <g>
      <path d="M0 96 L50 56 L84 78 L134 34 L190 84 L226 60 L300 96 L300 120 L0 120 Z" fill="var(--mountain)" />
      <path d="M134 34 L150 50 L140 50 L130 42 Z M50 56 L60 66 L44 64 Z" fill="#fff" opacity={0.7} />
      <path d="M0 108 L60 92 L120 106 L180 90 L240 104 L300 94 L300 130 L0 130 Z" fill="var(--hill)" />
      <circle cx={244} cy={34} r={13} fill="#ffd27a" opacity={0.9} />
    </g>
  );

  return (
    <Stage label="A distant mountain horizon above a face. Focus moves between the far horizon and the tip of the nose.">
      <rect x={0} y={0} width={300} height={132} fill="var(--sky)" />
      <g filter="url(#mh-blur)">{mountains}</g>
      <motion.g opacity={farSharp}>{mountains}</motion.g>

      <g transform={`translate(${FX} ${FY}) scale(${S})`}>
        <FaceFront pupilScale={pupil} converge={near} />
      </g>

      {/* gaze lines */}
      {eyes.map((e, i) => (
        <g key={i}>
          <motion.line x1={e.x} y1={e.y} x2={e.x + (i ? 30 : -30)} y2={70} stroke="var(--glow)" strokeWidth={1.5} strokeDasharray="3 4" opacity={lineO} />
          <motion.line x1={e.x} y1={e.y} x2={nose.x} y2={nose.y} stroke="var(--glow)" strokeWidth={1.5} strokeDasharray="3 4" opacity={lineNearO} />
        </g>
      ))}
      <motion.circle cx={nose.x} cy={nose.y} r={14} fill="url(#mh-glow)" opacity={noseGlow} />

      <motion.g opacity={farLabel}>
        <rect x={110} y={8} width={80} height={24} rx={12} fill="var(--glow)" />
        <text x={150} y={25} textAnchor="middle" className="fill-[#1b120c] text-[12px] font-bold tracking-widest">FAR</text>
        <text x={150} y={46} textAnchor="middle" className="fill-[var(--ink)] text-[10px] font-semibold">3–6 m · 10–20 ft away</text>
      </motion.g>
      <motion.g opacity={nearLabel}>
        <rect x={200} y={262} width={92} height={24} rx={12} fill="var(--glow)" />
        <text x={246} y={279} textAnchor="middle" className="fill-[#1b120c] text-[11px] font-bold tracking-wider">NOSE TIP</text>
      </motion.g>
    </Stage>
  );
}
