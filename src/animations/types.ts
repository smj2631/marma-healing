import type { MotionValue } from 'framer-motion';
import type { Step } from '../data/types';

export interface AnimProps {
  /** Continuous clock phase, 0 → reps. */
  phase: MotionValue<number>;
  reps: number;
  step?: Step;
  /** prefers-reduced-motion: static diagram with glowing points. */
  reduced: boolean;
}
