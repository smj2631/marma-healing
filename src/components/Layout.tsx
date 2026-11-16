import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GearIcon, Lotus } from './Icons';
import { SettingsSheet } from './SettingsSheet';

export function Layout({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(false);
  const nav = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-teal-900/10 dark:bg-white/10' : 'opacity-75 hover:opacity-100'}`;
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-4 pb-[env(safe-area-inset-bottom)] sm:px-6">
      <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between bg-[var(--bg)]/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur sm:-mx-6 sm:px-6">
        <Link to="/" className="flex min-h-14 items-center gap-2 font-serif text-xl font-semibold">
          <Lotus size={30} className="text-teal-800 dark:text-saffron-300" />
          Marma Healing
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/protocols" className={nav}>
            Protocols
          </NavLink>
          <NavLink to="/about-marma" className={`${nav} hidden sm:inline-flex`}>
            About
          </NavLink>
          <button className="icon-btn" aria-label="Settings" onClick={() => setSettings(true)}>
            <GearIcon width={22} height={22} />
          </button>
        </nav>
      </header>
      <main className="flex-1 py-4">{children}</main>
      <footer className="py-8 text-center text-xs opacity-60">
        A complementary wellness practice, not medical treatment. ·{' '}
        <Link to="/about-marma" className="underline">
          About Marma
        </Link>
      </footer>
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}
