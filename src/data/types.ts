export type Posture = 'sitting' | 'lying';
export type EyeState = 'open' | 'closed';
export type Breath = 'normal' | 'synced';

export type AnimationKey =
  | 'kurchaPinch'
  | 'vidhuraTap'
  | 'nearFar'
  | 'figure8'
  | 'sideUpDown'
  | 'browStroke'
  | 'underEyeStroke'
  | 'browPoints'
  | 'underEyePoints'
  | 'kaninaka'
  | 'kajuKatli'
  | 'nasaMulaPinch'
  | 'cheekbones'
  | 'palming'
  // transitions
  | 'closeEyes'
  | 'relaxHand';

export interface MarmaInfo {
  name: string;
  /** Plain-language location shown in the info sheet. */
  location: string;
  /** Optional extra note (tradition, benefit). */
  note?: string;
}

/** A group inside a step's pattern, e.g. "Point 1 · Bhruh Antara × 7". */
export interface RepGroup {
  name: string;
  count: number;
  /** Spoken/displayed cues for the first and second half of each rep (e.g. inhale/exhale pairing). */
  cues?: [string, string];
}

export interface Pattern {
  /** Label of one group, e.g. "Point" or "Round". Used in "Point 2 of 3". */
  unit: string;
  groups: RepGroup[];
}

export interface Step {
  id: string;
  number: number;
  title: string;
  /** Optional icon shown beside the title. */
  titleIcon?: 'kajuKatli';
  marma?: MarmaInfo;
  /** Extra points used by this step (for the glossary). */
  points?: MarmaInfo[];
  posture: Posture;
  eyes: EyeState;
  /** One-line instruction shown under the animation. */
  shortInstruction: string;
  /** Full instruction (learn mode, info). */
  instruction: string;
  reps: number;
  pattern?: Pattern;
  breath: Breath;
  /** Cues for the two halves of each rep when there is no pattern (e.g. far / near). */
  cues?: [string, string];
  /** Seconds per rep at "normal" tempo. Scaled by the tempo setting. */
  tempoSec: number;
  animationKey: AnimationKey;
  /** What the voice says before the reps begin. */
  voiceScript: string;
  /** Points visited in order, one per rep (repeats). Spoken and shown instead of a count. */
  pointCycle?: string[];
  /** Shows a "Both sides together" label. */
  bothSides?: boolean;
  tip?: string;
}

export interface Transition {
  id: string;
  /** The transition plays after this step number. */
  afterStep: number;
  text: string;
  voiceScript: string;
  animationKey: AnimationKey;
  durationSec: number;
}

export interface Protocol {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  status: 'available' | 'coming-soon';
  accent: string;
  needs: string[];
  safety: string[];
  steps: Step[];
  transitions: Transition[];
  completion: { text: string; voiceScript: string };
  intro: { voiceScript: string };
}
