import { motion } from 'framer-motion';

/** Large ring that fills as reps progress. */
export function RepCounter({ rep, reps, size = 112, sub }: { rep: number; reps: number; size?: number; sub?: string }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const frac = reps ? rep / reps : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-live="polite" aria-label={`Rep ${rep} of ${reps}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="6" className="stroke-teal-900/10 dark:stroke-white/10" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          stroke="var(--glow)"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - frac) }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span key={rep} initial={{ scale: 1.25, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="font-serif font-semibold leading-none" style={{ fontSize: size * 0.36 }}>
          {rep}
        </motion.span>
        <span className="font-semibold opacity-60" style={{ fontSize: Math.max(11, size * 0.11) }}>
          {sub ?? `of ${reps}`}
        </span>
      </div>
    </div>
  );
}
