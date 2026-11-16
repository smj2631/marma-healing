import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Lotus } from './Icons';

const BREATH = 4; // seconds per full breath cycle

export function LoadingScreen() {
  const reduced = useReducedMotion();
  const [inhale, setInhale] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setInhale((v) => !v), (BREATH / 2) * 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-gradient-to-b from-teal-900 via-teal-800 to-[#2a5a5c] text-sand-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.7 } }}
      aria-label="Loading Marma Healing"
    >
      <div className="relative flex h-64 w-64 items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full border border-saffron-300/50"
            style={{ width: 90 + i * 55, height: 90 + i * 55 }}
            animate={reduced ? undefined : { scale: [0.8, 1.12, 0.8], opacity: [0.25, 0.8, 0.25] }}
            transition={{ duration: BREATH, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
          />
        ))}
        <motion.span
          className="absolute h-24 w-24 rounded-full bg-saffron-400/30 blur-xl"
          animate={reduced ? undefined : { scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: BREATH, repeat: Infinity, ease: 'easeInOut' }}
        />
        <Lotus size={72} className="relative text-sand-50" />
      </div>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-wide">Marma Healing</h1>
      <p className="mt-2 text-sand-200/80">Ancient touch. Gentle healing.</p>
      <motion.p key={String(inhale)} initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} className="mt-10 font-serif text-xl italic">
        {inhale ? 'Breathe in…' : 'Breathe out…'}
      </motion.p>
    </motion.div>
  );
}
