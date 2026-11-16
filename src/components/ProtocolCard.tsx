import { Link } from 'react-router-dom';
import type { Protocol } from '../data/types';
import { formatMin, protocolDurationSec } from '../lib/timeline';
import { ChevronIcon } from './Icons';

const GLYPHS: Record<string, string> = { eye: '◉', sleep: '☾', 'emotional-wellness': '❀', 'energy-heal': '✺' };

export function ProtocolCard({ p }: { p: Protocol }) {
  const available = p.status === 'available';
  return (
    <Link
      to={`/protocols/${p.slug}`}
      className="card group flex min-h-24 items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
        style={{ background: `${p.accent}26`, color: p.accent }}
        aria-hidden
      >
        {GLYPHS[p.id] ?? '•'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-serif text-xl font-semibold">{p.title}</span>
          {!available && <span className="rounded-full bg-teal-900/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider dark:bg-white/10">Coming soon</span>}
        </span>
        <span className="block text-sm opacity-75">{p.tagline}</span>
        {available && (
          <span className="mt-1 block text-xs font-semibold opacity-60">
            {p.steps.length} steps · about {formatMin(protocolDurationSec(p))}
          </span>
        )}
      </span>
      <ChevronIcon className="shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-80" />
    </Link>
  );
}
