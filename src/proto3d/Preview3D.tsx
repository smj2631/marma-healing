import { Link } from 'react-router-dom';
import { Character3D } from './Character3D';

export default function Preview3D() {
  const qs = new URLSearchParams(location.search);
  const debug = qs.has('debug');
  const live = qs.has('live');
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-sand-100 to-sand-200 dark:from-night-950 dark:to-teal-950">
      <header className="px-5 pt-5">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-60">3D preview · Step 14</div>
        <h1 className="font-serif text-3xl">Palming</h1>
        <p className="mt-1 text-sm opacity-75">Heel of the palm over the closed eyes, fingers resting on the forehead.  </p>
      </header>
      <div className="relative min-h-[440px] flex-1">
        <div className="absolute inset-0">
        {debug || live ? (
            <Character3D debug={debug} onReady={() => document.body.setAttribute('data-3d-ready', '1')} />
          ) : (
            <video
              className="mx-auto h-full w-auto max-w-full object-contain"
              src={import.meta.env.BASE_URL + 'media/palming-3d.mp4'}
              poster={import.meta.env.BASE_URL + 'media/palming-3d.jpg'}
              autoPlay
              muted
              loop
              playsInline
            />
          )}
        </div>
      </div>
      <footer className="px-5 pb-6 text-sm">
        <Link className="font-semibold text-teal-700 underline dark:text-saffron-300" to="/protocols/eye/step/14">
          Compare with the current version
        </Link>
        <p className="mt-2 text-xs opacity-60">Character: Microsoft Rocketbox avatar library (MIT).</p>
      </footer>
    </div>
  );
}
