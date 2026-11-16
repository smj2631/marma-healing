import type { Protocol } from '../types';

/**
 * Eye Protocol — the single source of truth for every step.
 * Edit text, counts, timing and point names here; components read from this file only.
 * tempoSec is seconds per rep at the "normal" tempo (4 s). Slow/quick settings scale it.
 */
export const eyeProtocol: Protocol = {
  id: 'eye',
  slug: 'eye',
  title: 'Eye Protocol',
  shortTitle: 'Eye',
  tagline: 'Relieve eye strain, refresh the eyes',
  description:
    'Fourteen gentle steps of touch, movement and breath to ease screen fatigue and refresh tired eyes.',
  status: 'available',
  accent: '#f4a226',
  needs: [
    'A quiet place',
    'Clean hands and short nails',
    'A mat or bed to lie down on from step 4',
  ],
  safety: [
    'Remove glasses and contact lenses.',
    'Use light pressure only. Never press on the eyeball.',
    'Skip this protocol with an active eye infection, or after eye surgery or injury.',
    'Stop if anything hurts.',
  ],
  intro: {
    voiceScript: 'Welcome to the Eye Protocol. Sit comfortably, remove your glasses, and let your shoulders soften.',
  },
  steps: [
    {
      id: 'kurcha',
      number: 1,
      title: 'Kurcha Marma',
      marma: {
        name: 'Kurcha',
        location: 'At the base of the thumb on the palm side, the fleshy thumb mound.',
        note: 'Traditionally linked to eyesight.',
      },
      posture: 'sitting',
      eyes: 'open',
      shortInstruction: 'Pinch the left thumb: tip, middle, then the Kurcha point. Lift between pinches.',
      instruction:
        'Interlock your right hand with your left hand. With your right thumb and index finger, gently pinch your left thumb, starting at the tip and ending at the Kurcha point at its base: pinch, release, lift and move down. Do not slide. 7 times, with normal breath.',
      reps: 7,
      breath: 'normal',
      tempoSec: 4,
      animationKey: 'kurchaPinch',
      voiceScript:
        'Step one. Kurcha marma. Interlock your right hand with your left. With your right thumb and index finger, gently pinch your left thumb. Start at the tip, and pinch your way down to the fleshy mound at its base. Pinch and release. Do not slide. Seven times.',
    },
    {
      id: 'vidhura',
      number: 2,
      title: 'Vidhura Marma',
      marma: {
        name: 'Vidhura',
        location: 'Behind and just below each ear, beside the bony bulge (the mastoid).',
      },
      posture: 'sitting',
      eyes: 'open',
      shortInstruction: 'Tap behind both ears with bunched fingertips.',
      instruction:
        'Find the bony bulge behind each ear. Join all five fingertips together and tap gently on both sides at once. 7 times, with normal breath.',
      reps: 7,
      breath: 'normal',
      tempoSec: 3,
      bothSides: true,
      animationKey: 'vidhuraTap',
      voiceScript:
        'Step two. Vidhura marma. Find the bony bulge behind each ear. Join all five fingertips and tap gently on both sides together. Seven times.',
    },
    {
      id: 'near-far',
      number: 3,
      title: 'Near and far focus',
      posture: 'sitting',
      eyes: 'open',
      shortInstruction: 'Focus far away, then on the tip of your nose.',
      instruction:
        'Focus on something 3 to 6 m (10 to 20 feet) away. Then bring your focus to the tip of your nose. 3 rounds, with normal breath.',
      reps: 3,
      breath: 'normal',
      cues: ['Look far away', 'Now the tip of your nose'],
      tempoSec: 8,
      animationKey: 'nearFar',
      voiceScript:
        'Step three. Near and far focus. Look at something far away. Then bring your focus to the tip of your nose. Three rounds.',
    },
    {
      id: 'figure-8',
      number: 4,
      title: 'Figure 8',
      posture: 'lying',
      eyes: 'open',
      shortInstruction: 'Head still. Draw a big 8 with your eyes only.',
      instruction:
        'Lie down. Keeping your head still, slowly draw a big "8" with your eyes only, at least 1 foot (30 cm) tall. 3 times.',
      reps: 3,
      breath: 'normal',
      tempoSec: 10,
      animationKey: 'figure8',
      voiceScript:
        'Step four. Please lie down now. Keep your head still and slowly draw a big figure eight with your eyes only. Three times.',
    },
    {
      id: 'side-up-down',
      number: 5,
      title: 'Side to side, up and down',
      posture: 'lying',
      eyes: 'open',
      shortInstruction: 'Move only the eyes, in rhythm with the breath.',
      instruction:
        'Move your eyes right then left for 3 rounds, then top then bottom for 3 rounds. One direction on the inhale, back on the exhale.',
      reps: 6,
      breath: 'synced',
      pattern: {
        unit: 'Set',
        groups: [
          // Breath pairing is editable: [inhale cue, exhale cue]
          { name: 'Right ↔ Left', count: 3, cues: ['look right', 'look left'] },
          { name: 'Up ↔ Down', count: 3, cues: ['look up', 'look down'] },
        ],
      },
      tempoSec: 7,
      animationKey: 'sideUpDown',
      voiceScript:
        'Step five. Still lying down. Move only your eyes, with your breath. First right and left, then up and down. Three rounds each.',
    },
    {
      id: 'below-eyebrows',
      number: 6,
      title: 'Below the eyebrows',
      posture: 'lying',
      eyes: 'closed',
      shortInstruction: '4 fingertips glide just below the brows, inside to outside.',
      instruction:
        'Using all 4 fingers together, gently massage just below the eyebrows, from the inner end to the outer end. 7 strokes, both sides together.',
      reps: 7,
      breath: 'normal',
      tempoSec: 4,
      bothSides: true,
      animationKey: 'browStroke',
      voiceScript:
        'Step six. Below the eyebrows. Place four fingers of each hand just below your eyebrows. Glide gently from the inside to the outside. Seven strokes.',
    },
    {
      id: 'under-eyes',
      number: 7,
      title: 'Under the eyes',
      posture: 'lying',
      eyes: 'closed',
      shortInstruction: '4 fingertips along the bony rim under the eyes, inside to outside.',
      instruction:
        'Rest the same 4 fingertips on the bony rim below the eyes (the top of the cheekbone), not on the eyes. Stroke gently from inside to outside. 7 strokes. Never press on the eyeball.',
      reps: 7,
      breath: 'normal',
      tempoSec: 4,
      bothSides: true,
      animationKey: 'underEyeStroke',
      voiceScript:
        'Step seven. Under the eyes. Move your fingertips down onto the bony rim below your eyes, not on the eyes themselves. Stroke gently from the inside to the outside. Seven strokes.',
    },
    {
      id: 'eyebrow-points',
      number: 8,
      title: 'Eyebrow points',
      marma: {
        name: 'Bhruh Antara · Madhya · Agra',
        location:
          'Three points along each eyebrow: 1 at the inner end (Antara), 2 in the middle (Madhya), 3 at the outer end (Agra).',
      },
      points: [
        { name: 'Bhruh Antara', location: 'The inner end of the eyebrow.' },
        { name: 'Bhruh Madhya', location: 'The middle of the eyebrow.' },
        { name: 'Bhruh Agra', location: 'The outer end of the eyebrow.' },
      ],
      posture: 'lying',
      eyes: 'closed',
      shortInstruction: 'Thumbs pull and release at each point, centre outwards.',
      instruction:
        'With your thumbs, gently pull and release at each point, working from the centre outwards: point 1 × 7, point 2 × 7, point 3 × 7 = 21. Both sides together.',
      reps: 21,
      breath: 'normal',
      pattern: {
        unit: 'Point',
        groups: [
          { name: 'Bhruh Antara', count: 7 },
          { name: 'Bhruh Madhya', count: 7 },
          { name: 'Bhruh Agra', count: 7 },
        ],
      },
      tempoSec: 3,
      bothSides: true,
      animationKey: 'browPoints',
      voiceScript:
        'Step eight. Eyebrow points. Place your thumbs at the inner ends of your eyebrows. Gently pull and release, seven times at each of three points, moving outwards.',
    },
    {
      id: 'below-eye-points',
      number: 9,
      title: 'Below-eye points',
      marma: {
        name: 'Ashru Antara · Madhya · Agra',
        location: 'Three points along the bone below each eye: inner (Antara), middle (Madhya) and outer (Agra).',
      },
      points: [
        { name: 'Ashru Antara', location: 'Inner point on the bone below the eye.' },
        { name: 'Ashru Madhya', location: 'Middle point on the bone below the eye.' },
        { name: 'Ashru Agra', location: 'Outer point on the bone below the eye.' },
      ],
      posture: 'lying',
      eyes: 'closed',
      shortInstruction: 'Pull and release at 3 points on the bone below the eyes.',
      instruction:
        'Same technique as the eyebrow points, on the bone below each eye: inner point × 7, middle × 7, outer × 7 = 21. Both sides together.',
      reps: 21,
      breath: 'normal',
      pattern: {
        unit: 'Point',
        groups: [
          { name: 'Ashru Antara', count: 7 },
          { name: 'Ashru Madhya', count: 7 },
          { name: 'Ashru Agra', count: 7 },
        ],
      },
      tempoSec: 3,
      bothSides: true,
      animationKey: 'underEyePoints',
      voiceScript:
        'Step nine. Below-eye points. Move to the bone below your eyes, near the nose. Pull and release seven times at each of three points, moving outwards.',
    },
    {
      id: 'kaninaka',
      number: 10,
      title: 'Kaninaka',
      marma: {
        name: 'Kaninaka',
        location: 'The inner corner of the eye, beside the nose.',
      },
      posture: 'lying',
      eyes: 'closed',
      shortInstruction: 'Gently pull and release at the inner corners.',
      instruction: 'At the inner corner of each eye, beside the nose, gently pull and release. 7 times.',
      reps: 7,
      breath: 'normal',
      tempoSec: 3,
      bothSides: true,
      animationKey: 'kaninaka',
      voiceScript:
        'Step ten. Kaninaka. Rest a fingertip at the inner corner of each eye, beside the nose. Gently pull and release. Seven times.',
    },
    {
      id: 'kaju-katli',
      number: 11,
      title: 'Kaju Katli diamond',
      titleIcon: 'kajuKatli',
      marma: {
        name: 'Nasa Mula · Apanga · Nasa Agra',
        location:
          'Nasa Mula: root of the nose, between the eyes. Apanga: outer corner of each eye. Nasa Agra: tip of the nose.',
      },
      points: [
        { name: 'Nasa Mula', location: 'Root of the nose, between the eyes.' },
        { name: 'Apanga', location: 'Outer corner of each eye.' },
        { name: 'Nasa Agra', location: 'Tip of the nose.' },
      ],
      posture: 'lying',
      eyes: 'closed',
      shortInstruction: 'Tap each point gently, one breath per point. Lift and move; no tracing.',
      instruction:
        'With one fingertip, gently tap the four points of a diamond, shaped like a kaju katli sweet, taking one full breath at each point: Nasa Mula (root of the nose) → Apanga (outer corner of the left eye) → Nasa Agra (tip of the nose) → Apanga (outer corner of the right eye), then back to Nasa Mula. Do not slide between points: lift your finger and move to the next point. 3 rounds.',
      reps: 12,
      breath: 'synced',
      pattern: {
        unit: 'Round',
        groups: [
          { name: 'Round 1', count: 4 },
          { name: 'Round 2', count: 4 },
          { name: 'Round 3', count: 4 },
        ],
      },
      pointCycle: ['Nasa Mula, root of the nose', 'Apanga, left eye corner', 'Nasa Agra, tip of the nose', 'Apanga, right eye corner'],
      tempoSec: 6,
      animationKey: 'kajuKatli',
      voiceScript:
        'Step eleven. The kaju katli diamond. With one fingertip, you will gently tap four points, taking one breath at each: the root of the nose, the outer corner of the left eye, the tip of the nose, and the outer corner of the right eye. Lift your finger to move between points. Three rounds.',
    },
    {
      id: 'nasa-mula',
      number: 12,
      title: 'Nasa Mula pinch',
      marma: {
        name: 'Nasa Mula',
        location: 'The root of the nose, the bridge between the eyes.',
      },
      posture: 'lying',
      eyes: 'closed',
      shortInstruction: 'Pinch the bridge of the nose gently.',
      instruction:
        'Hold the root of the nose (the bridge between the eyes) between thumb and index finger and pinch gently. 7 times, with normal breath.',
      reps: 7,
      breath: 'normal',
      tempoSec: 3,
      animationKey: 'nasaMulaPinch',
      voiceScript:
        'Step twelve. Nasa mula. Hold the bridge of your nose between thumb and index finger. Pinch gently, and release. Seven times.',
    },
    {
      id: 'cheekbones',
      number: 13,
      title: 'Cheekbones',
      marma: {
        name: 'Ganda region',
        location: 'Along the cheekbones: the bony ridge below the outer part of each eye.',
      },
      posture: 'lying',
      eyes: 'closed',
      shortInstruction: 'Fingertips on the cheekbones. Push gently upward along the bone.',
      instruction:
        'Place your fingertips on the cheekbones: the bony ridge below the outer part of each eye, well above the mouth. Gently push along the bone from bottom to top. 7 times.',
      reps: 7,
      breath: 'normal',
      tempoSec: 4,
      bothSides: true,
      animationKey: 'cheekbones',
      voiceScript:
        'Step thirteen. Cheekbones. Place your fingertips on the bony ridge of your cheekbones, below the outer part of each eye. Gently push upward along the bone, from bottom to top. Seven times.',
    },
    {
      id: 'palming',
      number: 14,
      title: 'Palming',
      posture: 'lying',
      eyes: 'closed',
      shortInstruction: 'Base of the warm palms over closed eyes. 7 slow breaths.',
      instruction:
        'Optional: rub your palms together until warm. Place the base (heel) of each palm gently over your closed eyes, with your fingers resting on your forehead. No pressure on the eyeballs. Take 7 slow breaths.',
      reps: 7,
      breath: 'synced',
      tempoSec: 9,
      animationKey: 'palming',
      voiceScript:
        'Step fourteen. Palming. If you like, rub your palms together until warm. Then rest the base of each palm gently over your closed eyes, fingers on your forehead. No pressure. Take seven slow breaths.',
    },
  ],
  transitions: [
    {
      id: 'close-eyes',
      afterStep: 5,
      text: 'Now close your eyes.',
      voiceScript:
        'Now, gently close your eyes. Keep them closed from here. Simply follow my voice and the chimes.',
      animationKey: 'closeEyes',
      durationSec: 9,
    },
    {
      id: 'relax-hand',
      afterStep: 10,
      text: 'Now relax your left hand.',
      voiceScript: 'Now relax your left hand.',
      animationKey: 'relaxHand',
      durationSec: 5,
    },
  ],
  completion: {
    text: 'Sit quietly for a moment, then slowly open your eyes.',
    voiceScript:
      'Your eye protocol is complete. Rest here for a moment. When you are ready, sit up quietly and slowly open your eyes.',
  },
};
