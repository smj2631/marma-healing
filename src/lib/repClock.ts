import { useEffect, useRef, useState } from 'react';
import { useMotionValue, type MotionValue } from 'framer-motion';

/**
 * The central "rep clock". One requestAnimationFrame loop drives a continuous phase
 * (0 → reps) that every animation reads, and fires onRep / onHalf / onDone callbacks
 * that the player uses for the counter, voice, chimes and haptics, so they never drift.
 */
export interface RepClockOpts {
  reps: number;
  tempoSec: number;
  running: boolean;
  /** Changing this resets the clock to 0. */
  resetKey: string | number;
  onRep?: (rep: number) => void; // 1-based, fired at the start of each rep
  onHalf?: (rep: number) => void; // fired half-way through each rep
  onDone?: () => void;
}

export interface RepClock {
  phase: MotionValue<number>;
  rep: number;
  done: boolean;
  elapsedSec: number;
}

export function useRepClock(o: RepClockOpts): RepClock {
  const phase = useMotionValue(0);
  const [rep, setRep] = useState(0);
  const [done, setDone] = useState(false);
  const elapsed = useRef(0);
  const fired = useRef({ rep: 0, half: 0, done: false });
  const cb = useRef(o);
  cb.current = o;

  // Reset
  useEffect(() => {
    elapsed.current = 0;
    fired.current = { rep: 0, half: 0, done: false };
    phase.set(0);
    setRep(0);
    setDone(false);
  }, [o.resetKey, phase]);

  useEffect(() => {
    if (!o.running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Clamp dt so a backgrounded tab doesn't skip several reps at once.
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      const { reps, tempoSec } = cb.current;
      const f = fired.current;
      if (!f.done) {
        elapsed.current += dt;
        const p = Math.min(elapsed.current / tempoSec, reps);
        phase.set(p);
        const current = Math.min(Math.floor(p) + 1, reps);
        if (current > f.rep) {
          f.rep = current;
          setRep(current);
          cb.current.onRep?.(current);
        }
        if (p - Math.floor(p) >= 0.5 && f.half < current && p < reps) {
          f.half = current;
          cb.current.onHalf?.(current);
        }
        if (p >= reps) {
          f.done = true;
          setDone(true);
          cb.current.onDone?.();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [o.running, o.resetKey, phase]);

  return { phase, rep, done, elapsedSec: elapsed.current };
}
