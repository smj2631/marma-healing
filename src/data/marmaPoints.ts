/**
 * One map of named marma coordinates, shared by every step animation.
 * Coordinates are in the viewBox of the figure they belong to (all figures are 300 × 360).
 * The front face is drawn as a mirror image of the user: the user's LEFT side is on the
 * screen's LEFT. Bilateral points store the left-side coordinate; use mirrorX() for the right.
 */
export type Figure = 'face' | 'hand' | 'head';

export interface MarmaPoint {
  figure: Figure;
  x: number;
  y: number;
  bilateral?: boolean;
  label: string;
}

export const MARMA = {
  kurcha: { figure: 'hand', x: 196, y: 252, label: 'Kurcha' },
  kurchaThumbTip: { figure: 'hand', x: 262, y: 160, label: 'Thumb tip' },
  vidhura: { figure: 'head', x: 206, y: 214, label: 'Vidhura' },
  bhruhAntara: { figure: 'face', x: 133, y: 150, bilateral: true, label: 'Bhruh Antara' },
  bhruhMadhya: { figure: 'face', x: 111, y: 142, bilateral: true, label: 'Bhruh Madhya' },
  bhruhAgra: { figure: 'face', x: 88, y: 149, bilateral: true, label: 'Bhruh Agra' },
  ashruAntara: { figure: 'face', x: 130, y: 201, bilateral: true, label: 'Ashru Antara' },
  ashruMadhya: { figure: 'face', x: 111, y: 206, bilateral: true, label: 'Ashru Madhya' },
  ashruAgra: { figure: 'face', x: 91, y: 200, bilateral: true, label: 'Ashru Agra' },
  kaninaka: { figure: 'face', x: 136, y: 181, bilateral: true, label: 'Kaninaka' },
  apangaL: { figure: 'face', x: 86, y: 180, label: 'Apanga (left)' },
  apangaR: { figure: 'face', x: 214, y: 180, label: 'Apanga (right)' },
  nasaMula: { figure: 'face', x: 150, y: 170, label: 'Nasa Mula' },
  nasaAgra: { figure: 'face', x: 150, y: 236, label: 'Nasa Agra' },
  ganda: { figure: 'face', x: 92, y: 236, bilateral: true, label: 'Ganda' },
} satisfies Record<string, MarmaPoint>;

export type MarmaKey = keyof typeof MARMA;

export const FACE_CENTER_X = 150;
export const mirrorX = (x: number) => 2 * FACE_CENTER_X - x;

/** Eye geometry for FaceFront (left eye = screen left). */
export const EYES = {
  left: { cx: 111, cy: 181, rx: 24, ry: 11 },
  right: { cx: 189, cy: 181, rx: 24, ry: 11 },
};
