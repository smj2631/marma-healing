import { useState } from 'react';
import type { Step } from '../data/types';
import { Sheet } from './Sheet';

export function MarmaChip({ step, className = '' }: { step: Step; className?: string }) {
  const [open, setOpen] = useState(false);
  if (!step.marma) return null;
  return (
    <>
      <button
        data-nogesture
        className={`chip ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`About ${step.marma.name}`}
      >
        <span className="h-2 w-2 rounded-full bg-saffron-500 shadow-glow" />
        {step.marma.name}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={step.marma.name}>
        <p className="text-lg leading-relaxed">{step.marma.location}</p>
        {step.marma.note && <p className="mt-3 text-teal-700 dark:text-teal-400">{step.marma.note}</p>}
        {step.points && (
          <ul className="mt-4 space-y-2">
            {step.points.map((p) => (
              <li key={p.name} className="rounded-2xl bg-saffron-400/10 p-3">
                <span className="font-semibold">{p.name}</span>
                <span className="block text-sm opacity-80">{p.location}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 text-sm opacity-70">Use light pressure only. Never press on the eyeball.</p>
      </Sheet>
    </>
  );
}
