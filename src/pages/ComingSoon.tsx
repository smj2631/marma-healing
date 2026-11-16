import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Protocol } from '../data/types';
import { Lotus } from '../components/Icons';

export function ComingSoon({ protocol: p }: { protocol: Protocol }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
      <motion.div
        className="flex h-32 w-32 items-center justify-center rounded-full"
        style={{ background: `${p.accent}22`, color: p.accent }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Lotus size={64} />
      </motion.div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] opacity-60">Coming soon</p>
      <h1 className="mt-1 text-5xl font-semibold">{p.title}</h1>
      <p className="mt-3 text-lg opacity-80">{p.tagline}.</p>
      <p className="mt-2 opacity-70">{p.description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/protocols/eye" className="btn-primary">
          Try the Eye Protocol
        </Link>
        <Link to="/protocols" className="btn-ghost">
          All protocols
        </Link>
      </div>
    </div>
  );
}
