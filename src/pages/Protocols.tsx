import { ProtocolCard } from '../components/ProtocolCard';
import { PROTOCOLS } from '../data/protocols';

export function Protocols() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-5xl font-semibold">Protocols</h1>
      <p className="mt-2 opacity-75">Four guided sequences. The Eye Protocol is ready; the others are on their way.</p>
      <div className="mt-6 grid gap-3">
        {PROTOCOLS.map((p) => (
          <ProtocolCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
