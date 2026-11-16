import { Link } from 'react-router-dom';
import type { Protocol } from '../data/types';
import { BookIcon } from '../components/BookIcon';
import { ChevronIcon, KajuKatliIcon, PlayIcon } from '../components/Icons';
import { useSettings, tempoFactor } from '../lib/settings';
import { getStats } from '../lib/storage';
import { buildSequence, formatMin, protocolDurationSec } from '../lib/timeline';

export function ProtocolOverview({ protocol: p }: { protocol: Protocol }) {
  const { settings } = useSettings();
  const stats = getStats(p.id);
  const duration = protocolDurationSec(p, tempoFactor(settings.tempo), settings.voiceRate);
  const seq = buildSequence(p);
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <Link to="/protocols" className="text-sm font-semibold opacity-70 hover:opacity-100">
          ← All protocols
        </Link>
        <h1 className="mt-2 text-5xl font-semibold">{p.title}</h1>
        <p className="mt-2 text-lg opacity-80">{p.description}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Duration" value={`~${formatMin(duration)}`} />
          <Stat label="Steps" value={String(p.steps.length)} />
          <Stat label="Streak" value={stats.streak ? `${stats.streak} day${stats.streak > 1 ? 's' : ''}` : '—'} />
        </div>
        <p className="mt-2 text-sm opacity-70">
          Last practised: {stats.last ? new Date(stats.last).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : 'not yet'}
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to={`/protocols/${p.slug}/session`} className="btn-primary flex-1 text-lg">
          <PlayIcon width={20} height={20} /> Start Guided Session
        </Link>
        <Link to={`/protocols/${p.slug}/step/1`} className="btn-ghost flex-1 text-lg">
          <BookIcon /> Learn Step by Step
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-sans text-base font-bold">What you need</h2>
          <ul className="mt-2 space-y-1.5">
            {p.needs.map((n) => (
              <li key={n} className="flex gap-2">
                <span className="text-saffron-500">●</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
        <div className="card border-saffron-500/40 p-5">
          <h2 className="font-sans text-base font-bold">Safety</h2>
          <ul className="mt-2 space-y-1.5">
            {p.safety.map((n) => (
              <li key={n} className="flex gap-2">
                <span className="text-saffron-500">!</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-semibold">Steps</h2>
        <ol className="mt-3 space-y-2">
          {seq.map((it) =>
            it.kind === 'step' ? (
              <li key={it.step.id}>
                <Link to={`/protocols/${p.slug}/step/${it.step.number}`} className="card flex min-h-16 items-center gap-4 px-4 py-3 transition hover:shadow-md">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-900/10 font-serif text-lg font-semibold dark:bg-white/10">
                    {it.step.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-semibold">
                      {it.step.title}
                      {it.step.titleIcon === 'kajuKatli' && <KajuKatliIcon width={18} height={18} />}
                    </span>
                    <span className="block text-sm opacity-70">
                      {it.step.pattern ? it.step.pattern.groups.map((g) => g.count).join(' + ') : it.step.reps} reps · {it.step.posture === 'lying' ? 'lying' : 'sitting'} · eyes {it.step.eyes}
                    </span>
                  </span>
                  <ChevronIcon className="shrink-0 opacity-40" />
                </Link>
              </li>
            ) : (
              <li key={it.transition.id} className="px-4 py-1 text-center font-serif text-lg italic opacity-70">
                {it.transition.text}
              </li>
            ),
          )}
          <li className="px-4 py-1 text-center font-serif text-lg italic opacity-70">{p.completion.text}</li>
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-2 py-3">
      <div className="font-serif text-2xl font-semibold">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wider opacity-60">{label}</div>
    </div>
  );
}
