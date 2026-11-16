import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { InstallButton } from '../components/InstallButton';
import { Lotus, PlayIcon } from '../components/Icons';
import { ProtocolCard } from '../components/ProtocolCard';
import { PROTOCOLS } from '../data/protocols';
import { getStats } from '../lib/storage';

export function Home() {
  const stats = getStats();
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 px-6 py-10 text-sand-50 sm:px-10 sm:py-14">
        <motion.div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-saffron-400/25 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <Lotus size={56} className="relative text-saffron-300" />
        <h1 className="relative mt-4 text-5xl font-semibold leading-[1.05] sm:text-6xl">
          Ancient touch.
          <br />
          Gentle healing.
        </h1>
        <p className="relative mt-4 max-w-md text-lg text-sand-100/85">
          Guided Ayurvedic Marma self-care, one gentle step at a time. Voice, chimes and animations lead the way, even with your eyes closed.
        </p>
        <div className="relative mt-7 flex flex-wrap gap-3">
          <Link to="/protocols/eye" className="btn bg-saffron-400 text-night-950 shadow-glow hover:bg-saffron-300">
            <PlayIcon width={20} height={20} /> Start Eye Protocol
          </Link>
          <InstallButton className="!border-white/30 !bg-white/10 !text-sand-50 hover:!bg-white/20" />
        </div>
        {stats.total > 0 && (
          <p className="relative mt-5 text-sm text-sand-100/75">
            {stats.streak > 0 ? `🔥 ${stats.streak}-day streak · ` : ''}
            {stats.total} session{stats.total === 1 ? '' : 's'} completed
          </p>
        )}
      </section>

      <section className="grid gap-6 sm:grid-cols-2 sm:items-center">
        <div>
          <h2 className="text-3xl font-semibold">What is Marma?</h2>
          <p className="mt-3 leading-relaxed opacity-85">
            Marma points are 107 vital junctions described in the Sushruta Samhita, where muscle, vessels, ligaments, bones and joints meet. Gentle touch and breath on these points is a traditional way to calm the nervous system and support the body's own healing.
          </p>
          <Link to="/about-marma" className="mt-3 inline-block font-semibold text-teal-700 underline underline-offset-4 dark:text-saffron-300">
            Learn about Marma points
          </Link>
        </div>
        <div className="card p-5">
          <p className="font-serif text-xl italic leading-snug">“Ayurveda calls the mind the 108th marma.”</p>
          <p className="mt-2 text-sm opacity-70">Each session pairs touch with breath awareness, so body and mind settle together.</p>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-semibold">Protocols</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PROTOCOLS.map((p) => (
            <ProtocolCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
