import { motion, useTransform } from 'framer-motion';
import type { AnimProps } from './types';
import { Stage, ease, seg, useRepT } from '../components/svg/primitives';

/** Step 3 — focus shifts between a distant horizon and a thumb in the foreground. */
export function NearFar({ phase, reps, reduced }: AnimProps) {
  const t = useRepT(phase, reps);
  // near = 0 → focus far (first half), near = 1 → focus on thumb (second half)
  const near = useTransform(t, (v) => (reduced ? 0.5 : v < 0.5 ? 1 - ease(seg(v, 0, 0.12)) : ease(seg(v, 0.5, 0.62))));
  const farSharp = useTransform(near, (n) => 1 - n);
  const thumbSharp = near;
  const pupil = useTransform(near, (n) => 7 - n * 3.4);
  const farLabel = useTransform(near, [0, 0.5, 1], [1, 0.2, 0]);
  const nearLabel = useTransform(near, [0, 0.5, 1], [0, 0.2, 1]);

  const mountains = (
    <g>
      <path d="M0 150 L50 104 L84 130 L134 76 L190 136 L226 108 L300 150 L300 172 L0 172 Z" fill="var(--mountain)" />
      <path d="M134 76 L150 92 L140 92 L130 84 Z M50 104 L60 114 L44 112 Z" fill="#fff" opacity={0.7} />
      <path d="M0 160 L60 140 L120 158 L180 138 L240 156 L300 142 L300 180 L0 180 Z" fill="var(--hill)" />
      <circle cx={240} cy={70} r={16} fill="#ffd27a" opacity={0.9} />
    </g>
  );
  const thumb = (
    <g>
      <path d="M120 360 L122 250 Q122 196 150 192 Q178 196 178 250 L180 360 Z" fill="var(--line)" />
      <path d="M123 360 L125 252 Q125 199 150 195 Q175 199 175 252 L177 360 Z" fill="var(--finger)" />
      <path d="M134 214 Q134 200 150 200 Q166 200 166 214 L166 236 Q150 242 134 236 Z" fill="var(--nail)" opacity={0.9} />
      <path d="M130 290 q20 6 40 0" fill="none" stroke="var(--line)" strokeWidth={1.2} opacity={0.5} />
    </g>
  );

  return (
    <Stage label="A distant mountain horizon and a thumb in the foreground. Focus moves between far and near.">
      <rect x={0} y={0} width={300} height={190} fill="var(--sky)" />
      <rect x={0} y={180} width={300} height={180} fill="var(--ground)" />
      {/* blurred + sharp layers crossfade to show focus */}
      <g filter="url(#mh-blur)">{mountains}</g>
      <motion.g opacity={farSharp}>{mountains}</motion.g>
      <g filter="url(#mh-blur)">{thumb}</g>
      <motion.g opacity={thumbSharp}>{thumb}</motion.g>

      <motion.g opacity={farLabel}>
        <rect x={110} y={22} width={80} height={26} rx={13} fill="var(--glow)" />
        <text x={150} y={40} textAnchor="middle" className="fill-[#1b120c] text-[13px] font-bold tracking-widest">FAR</text>
        <text x={150} y={64} textAnchor="middle" className="fill-[var(--ink)] text-[10px] font-semibold">3–6 m · 10–20 ft</text>
      </motion.g>
      <motion.g opacity={nearLabel}>
        <rect x={190} y={214} width={84} height={26} rx={13} fill="var(--glow)" />
        <text x={232} y={232} textAnchor="middle" className="fill-[#1b120c] text-[13px] font-bold tracking-widest">NEAR</text>
        <text x={232} y={256} textAnchor="middle" className="fill-[var(--ink)] text-[10px] font-semibold">25 cm · 10 in</text>
      </motion.g>

      {/* eye inset: pupil dilates for far, constricts for near */}
      <g transform="translate(46 300)">
        <circle r={30} fill="var(--stage)" stroke="var(--line)" strokeWidth={1.2} />
        <path d="M-22 0 Q0 -16 22 0 Q0 16 -22 0 Z" fill="#fffdf8" stroke="var(--line)" strokeWidth={1.2} />
        <circle r={8.5} fill="#5b3a25" />
        <motion.circle r={pupil} fill="#1b120c" />
      </g>
    </Stage>
  );
}
