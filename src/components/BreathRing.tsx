import { motion, useTransform, type MotionValue } from 'framer-motion';

/** Expands on the inhale (first half of each rep) and contracts on the exhale. */
export function BreathRing({ phase, reps, size = 84 }: { phase: MotionValue<number>; reps: number; size?: number }) {
  const t = useTransform(phase, (p) => (p >= reps ? 1 : p - Math.floor(p)));
  const scale = useTransform(t, (v) => {
    const k = v < 0.5 ? v * 2 : 2 - v * 2;
    return 0.55 + 0.45 * (0.5 - 0.5 * Math.cos(Math.PI * k));
  });
  const label = useTransform(t, (v): string => (v < 0.5 ? 'Inhale' : 'Exhale'));
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border border-saffron-500/40" />
      <motion.div className="absolute inset-0 rounded-full bg-saffron-400/30" style={{ scale }} />
      <motion.span className="relative text-xs font-bold uppercase tracking-widest">{label}</motion.span>
    </div>
  );
}
