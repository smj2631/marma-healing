import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
});

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></svg>
);
export const PauseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" /><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" /></svg>
);
export const PrevIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M18 5 8 12l10 7z" fill="currentColor" /><path d="M6 5v14" /></svg>
);
export const NextIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m6 5 10 7-10 7z" fill="currentColor" /><path d="M18 5v14" /></svg>
);
export const RepeatIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
);
export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const GearIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
);
export const BackIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M15 18 9 12l6-6" /></svg>
);
export const ChevronIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m9 18 6-6-6-6" /></svg>
);
export const DownloadIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
);
export const SpeakerIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>
);
export const ShareIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3v13M7 8l5-5 5 5M5 13v7h14v-7" /></svg>
);

/** Little kaju katli (cashew fudge diamond with silver leaf). */
export const KajuKatliIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width={22} height={22} aria-label="Kaju katli" {...p}>
    <path d="M12 2 22 12 12 22 2 12z" fill="#f2dcb3" stroke="#c9a46a" strokeWidth="1.2" />
    <path d="M12 5 19 12 12 19 5 12z" fill="#e8e8ec" opacity="0.75" />
    <path d="M9 10l2 1M13 13l2-1M11 15l1 1" stroke="#fff" strokeWidth="0.8" />
  </svg>
);

/** Lotus mark used in the logo and loading screen. */
export const Lotus = ({ size = 48, className }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <path d="M32 12c6 7 8 15 0 30-8-15-6-23 0-30z" />
      <path d="M32 42c-6-10-14-15-24-14 2 10 10 15 24 14z" />
      <path d="M32 42c6-10 14-15 24-14-2 10-10 15-24 14z" />
      <path d="M12 46c6 4 13 5 20 4 7 1 14 0 20-4" />
    </g>
    <circle cx="32" cy="36" r="3.4" fill="#f4a226" />
  </svg>
);
