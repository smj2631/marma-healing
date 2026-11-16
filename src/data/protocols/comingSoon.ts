import type { Protocol } from '../types';

/**
 * Scaffolds for the next protocols. They share the exact Protocol shape as the Eye Protocol:
 * to launch one, fill in `steps` (+ optional `transitions`), add animations for new
 * animationKeys in src/animations, and set status to 'available'.
 */
const base = {
  status: 'coming-soon' as const,
  needs: ['A quiet place'],
  safety: ['Use light pressure only. Stop if anything hurts.'],
  steps: [],
  transitions: [],
  completion: { text: 'Rest quietly for a moment.', voiceScript: 'Your session is complete.' },
  intro: { voiceScript: '' },
};

export const sleepProtocol: Protocol = {
  ...base,
  id: 'sleep',
  slug: 'sleep',
  title: 'Sleep Protocol',
  shortTitle: 'Sleep',
  tagline: 'Calm the mind for deep rest',
  description: 'A slow evening sequence of touch and breath to settle the mind before sleep.',
  accent: '#6f7fd6',
};

export const emotionalProtocol: Protocol = {
  ...base,
  id: 'emotional-wellness',
  slug: 'emotional-wellness',
  title: 'Emotional Wellness Protocol',
  shortTitle: 'Emotional Wellness',
  tagline: 'Ease and balance emotions',
  description: 'Gentle points and breath to soften tension and bring emotional balance.',
  accent: '#d9728a',
};

export const energyProtocol: Protocol = {
  ...base,
  id: 'energy-heal',
  slug: 'energy-heal',
  title: 'Energy / Heal Protocol',
  shortTitle: 'Energy / Heal',
  tagline: 'Restore vitality',
  description: 'An uplifting sequence to wake up circulation and restore energy.',
  accent: '#3f9e7a',
};
