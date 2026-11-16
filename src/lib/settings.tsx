import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { load, save } from './storage';
import { setVoiceGender, setVoiceURI, type VoiceGender } from './speech';

export type Tempo = 'slow' | 'normal' | 'quick';
export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  voice: boolean;
  voiceRate: number;
  countAloud: boolean; // false = chime only
  tempo: Tempo;
  haptics: boolean;
  chimes: boolean;
  theme: Theme;
  subtitles: boolean;
  /** '' = automatic (best available voice). */
  voiceURI: string;
  /** Background music. */
  ambient: boolean;
  voiceGender: VoiceGender;
}

export const DEFAULT_SETTINGS: Settings = {
  voice: true,
  voiceRate: 0.85,
  countAloud: true,
  tempo: 'normal',
  haptics: true,
  chimes: true,
  theme: 'system',
  subtitles: true,
  voiceURI: '',
  ambient: true,
  voiceGender: 'male',
};

export const TEMPO_SECONDS: Record<Tempo, number> = { slow: 5, normal: 4, quick: 3 };
/** Multiplier applied to every step's tempoSec (which is authored at "normal" = 4 s). */
export const tempoFactor = (t: Tempo) => TEMPO_SECONDS[t] / TEMPO_SECONDS.normal;

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => load('settings', DEFAULT_SETTINGS));

  useEffect(() => {
    save('settings', settings);
    setVoiceGender(settings.voiceGender);
    setVoiceURI(settings.voiceURI);
  }, [settings]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0f14' : '#123a3f');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme]);

  return (
    <SettingsContext.Provider value={{ settings, update: (p) => setSettings((s) => ({ ...s, ...p })) }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const c = useContext(SettingsContext);
  if (!c) throw new Error('useSettings outside provider');
  return c;
}
