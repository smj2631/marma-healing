import { useEffect, useState, type ReactNode } from 'react';
import { useSettings, type Tempo, type Theme, TEMPO_SECONDS } from '../lib/settings';
import { listVoices, onVoicesChanged, speak, speechSupported } from '../lib/speech';
import { Sheet } from './Sheet';

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-teal-900/10 py-3 last:border-0 dark:border-white/10">
      <div>
        <div className="font-semibold">{label}</div>
        {hint && <div className="text-sm opacity-70">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition ${on ? 'bg-teal-700 dark:bg-saffron-500' : 'bg-teal-900/20 dark:bg-white/20'}`}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 rounded-full bg-teal-900/10 p-1 dark:bg-white/10">
      {options.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`min-h-9 rounded-full px-3 text-sm font-semibold transition ${value === o.v ? 'bg-white text-teal-900 shadow dark:bg-saffron-400 dark:text-night-950' : ''}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings: s, update } = useSettings();
  const [voices, setVoices] = useState(() => listVoices());
  useEffect(() => onVoicesChanged(() => setVoices(listVoices())), []);
  const preview = () => s.voice && speak('Breathe in gently. And breathe out.', { rate: s.voiceRate });
  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <Row label="Voice guidance" hint={speechSupported() ? 'Reads each step and counts reps' : 'Not supported in this browser'}>
        <Toggle label="Voice guidance" on={s.voice} onChange={(v) => update({ voice: v })} />
      </Row>
      {voices.length > 0 && (
        <div className="border-b border-teal-900/10 py-3 dark:border-white/10">
          <label htmlFor="voice-pick" className="font-semibold">
            Voice
          </label>
          <div className="text-sm opacity-70">Voices marked Natural, Premium or Enhanced sound the calmest.</div>
          <div className="mt-2 flex gap-2">
            <select
              id="voice-pick"
              value={s.voiceURI}
              onChange={(e) => {
                update({ voiceURI: e.target.value });
                setTimeout(preview, 50);
              }}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-teal-900/20 bg-white px-3 text-teal-900 dark:border-white/20 dark:bg-night-800 dark:text-teal-200"
            >
              <option value="">Automatic (best available)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <button className="btn-ghost min-h-11 px-4 text-sm" onClick={preview}>
              Test
            </button>
          </div>
        </div>
      )}
      <Row label="Voice speed" hint={`${s.voiceRate.toFixed(2)}×`}>
        <input
          aria-label="Voice speed"
          type="range"
          min={0.6}
          max={1.3}
          step={0.05}
          value={s.voiceRate}
          onChange={(e) => update({ voiceRate: +e.target.value })}
          onPointerUp={preview}
          className="w-36 accent-teal-700 dark:accent-saffron-400"
        />
      </Row>
      <Row label="Counting" hint="Say the numbers, or chime only">
        <Segmented
          label="Counting"
          value={s.countAloud ? 'aloud' : 'chime'}
          options={[
            { v: 'aloud', l: 'Count aloud' },
            { v: 'chime', l: 'Chime only' },
          ]}
          onChange={(v) => update({ countAloud: v === 'aloud' })}
        />
      </Row>
      <Row label="Rep tempo" hint={`${TEMPO_SECONDS[s.tempo]} s per rep`}>
        <Segmented<Tempo>
          label="Rep tempo"
          value={s.tempo}
          options={[
            { v: 'slow', l: 'Slow' },
            { v: 'normal', l: 'Normal' },
            { v: 'quick', l: 'Quick' },
          ]}
          onChange={(v) => update({ tempo: v })}
        />
      </Row>
      <Row label="Subtitles" hint="Show what the voice says">
        <Toggle label="Subtitles" on={s.subtitles} onChange={(v) => update({ subtitles: v })} />
      </Row>
      <Row label="Calm background tone" hint="A soft drone during sessions">
        <Toggle label="Calm background tone" on={s.ambient} onChange={(v) => update({ ambient: v })} />
      </Row>
      <Row label="Chimes">
        <Toggle label="Chimes" on={s.chimes} onChange={(v) => update({ chimes: v })} />
      </Row>
      <Row label="Haptics" hint="Vibrate on each rep, where supported">
        <Toggle label="Haptics" on={s.haptics} onChange={(v) => update({ haptics: v })} />
      </Row>
      <Row label="Theme">
        <Segmented<Theme>
          label="Theme"
          value={s.theme}
          options={[
            { v: 'system', l: 'Auto' },
            { v: 'light', l: 'Light' },
            { v: 'dark', l: 'Dark' },
          ]}
          onChange={(v) => update({ theme: v })}
        />
      </Row>
    </Sheet>
  );
}
