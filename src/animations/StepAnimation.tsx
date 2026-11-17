import { useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion';
import type { ComponentType } from 'react';
import type { AnimationKey, Step } from '../data/types';
import type { AnimProps } from './types';
import { KurchaPinch, VidhuraTap, RelaxHand } from './HandHead';
import { NearFar } from './NearFar';
import {
  Figure8,
  SideUpDown,
  BrowStroke,
  UnderEyeStroke,
  BrowPoints,
  UnderEyePoints,
  Kaninaka,
  KajuKatli,
  NasaMulaPinch,
  Cheekbones,
  Palming,
  CloseEyes,
} from './Face';

export const ANIMATIONS: Record<AnimationKey, ComponentType<AnimProps>> = {
  kurchaPinch: KurchaPinch,
  vidhuraTap: VidhuraTap,
  nearFar: NearFar,
  figure8: Figure8,
  sideUpDown: SideUpDown,
  browStroke: BrowStroke,
  underEyeStroke: UnderEyeStroke,
  browPoints: BrowPoints,
  underEyePoints: UnderEyePoints,
  kaninaka: Kaninaka,
  kajuKatli: KajuKatli,
  nasaMulaPinch: NasaMulaPinch,
  cheekbones: Cheekbones,
  palming: Palming,
  closeEyes: CloseEyes,
  relaxHand: RelaxHand,
};

/** Static frame shown when the user prefers reduced motion. */
const STILL_PHASE: Partial<Record<AnimationKey, number>> = { closeEyes: 1, relaxHand: 1, palming: 0.25 };

export function StepAnimation({ animationKey, phase, reps, step }: { animationKey: AnimationKey; phase: MotionValue<number>; reps: number; step?: Step }) {
  const reduced = !!useReducedMotion();
  const still = useMotionValue(STILL_PHASE[animationKey] ?? 0.45);
  const Anim = ANIMATIONS[animationKey];
  return <Anim phase={reduced ? still : phase} reps={reps} step={step} reduced={reduced} />;
}
