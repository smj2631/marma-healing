import { Link } from 'react-router-dom';
import { PROTOCOLS, eyeProtocol } from '../data/protocols';

const BENEFITS = [
  'Relaxation and stress relief',
  'Eased eye strain and screen fatigue',
  'Better sleep',
  'Emotional balance',
  'More energy and better circulation',
  'Deeper body–mind awareness',
];

/** Glossary built from the Eye Protocol step data. */
function glossary() {
  const map = new Map<string, { location: string; steps: number[] }>();
  for (const s of eyeProtocol.steps) {
    const entries = s.points ?? (s.marma ? [s.marma] : []);
    for (const m of entries) {
      const cur = map.get(m.name);
      if (cur) cur.steps.push(s.number);
      else map.set(m.name, { location: m.location, steps: [s.number] });
    }
  }
  return [...map.entries()];
}

export function AboutMarma() {
  return (
    <article className="mx-auto max-w-2xl space-y-10">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-saffron-600 dark:text-saffron-300">About</p>
        <h1 className="mt-1 text-5xl font-semibold">What are Marma points?</h1>
      </header>

      <section className="space-y-3 text-lg leading-relaxed">
        <p>
          Marma points are <b>107 vital points</b> described in the <i>Sushruta Samhita</i>, a classical Ayurvedic text. They lie where muscle, vessels, ligaments, bones and joints meet.
        </p>
        <p>
          Each is considered a junction of <b>prana</b>, or life energy, similar in idea to acupressure points. Ayurveda calls the mind itself the <b>108th marma</b>.
        </p>
      </section>

      <section>
        <h2 className="text-3xl font-semibold">Why we use them</h2>
        <p className="mt-3 text-lg leading-relaxed">
          Gentle touch, pressure and strokes on these points, practised with breath awareness, are traditionally used to release blocked energy, calm the nervous system, balance the doshas (Vata, Pitta and Kapha) and support the body's own healing.
        </p>
      </section>

      <section>
        <h2 className="text-3xl font-semibold">Traditional benefits</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <li key={b} className="card flex items-center gap-3 px-4 py-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-saffron-500 shadow-glow" />
              {b}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-3xl font-semibold">Points in the Eye Protocol</h2>
        <dl className="mt-4 divide-y divide-teal-900/10 dark:divide-white/10">
          {glossary().map(([name, g]) => (
            <div key={name} className="py-3">
              <dt className="font-serif text-xl font-semibold">{name}</dt>
              <dd className="opacity-80">{g.location}</dd>
              <dd className="mt-1 text-xs font-semibold uppercase tracking-wider opacity-60">
                {g.steps.map((n) => (
                  <Link key={n} to={`/protocols/eye/step/${n}`} className="mr-2 underline underline-offset-2">
                    Step {n}
                  </Link>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="text-3xl font-semibold">The four protocols</h2>
        <ol className="mt-4 space-y-2">
          {PROTOCOLS.map((p, i) => (
            <li key={p.id}>
              <Link to={`/protocols/${p.slug}`} className="card flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  <b>
                    {i + 1}. {p.title}
                  </b>
                  <span className="block text-sm opacity-75">{p.tagline}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${p.status === 'available' ? 'bg-saffron-400/25 text-saffron-600 dark:text-saffron-300' : 'bg-teal-900/10 dark:bg-white/10'}`}>
                  {p.status === 'available' ? 'Available' : 'Coming soon'}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <aside className="rounded-3xl border border-saffron-500/40 bg-saffron-400/10 p-5">
        <h2 className="font-sans text-base font-bold">Disclaimer</h2>
        <p className="mt-1 leading-relaxed opacity-85">
          Marma is a complementary wellness practice, not medical treatment. Scientific research on its benefits is still limited. Consult a doctor for any medical or eye condition.
        </p>
      </aside>
      <p className="text-xs opacity-60">
        Guidance voice generated with Piper text-to-speech using the LibriTTS voice model (CC BY 4.0, speaker 436).
      </p>
    </article>
  );
}
