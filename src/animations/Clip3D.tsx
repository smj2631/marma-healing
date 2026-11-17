import { useEffect, useRef, useState } from 'react';
import type { MotionValue } from 'framer-motion';
import type { Step } from '../data/types';
import { groupOfIndex, phaseInfo } from '../lib/timeline';

/**
 * Realistic 3D clips (pre-rendered, one loop per rep). Variants cover the parts of a step that look
 * different: which hand, which point, which direction. Durations are the clip lengths in seconds.
 */
interface ClipSpec {
  variants: number;
  dur: number;
  pick: (idx: number, step: Step) => number;
}
const byGroup = (idx: number, step: Step) => groupOfIndex(step.pattern, idx);
const one = () => 0;
export const CLIPS_3D: Record<string, ClipSpec> = {
  kurcha: { variants: 2, dur: 3.5, pick: byGroup },
  vidhura: { variants: 1, dur: 3, pick: one },
  'near-far': { variants: 1, dur: 8, pick: one },
  'figure-8': { variants: 1, dur: 10, pick: one },
  'side-up-down': { variants: 2, dur: 9, pick: byGroup },
  'below-eyebrows': { variants: 1, dur: 4, pick: one },
  'under-eyes': { variants: 1, dur: 4, pick: one },
  'eyebrow-points': { variants: 3, dur: 3, pick: byGroup },
  'below-eye-points': { variants: 3, dur: 3, pick: byGroup },
  kaninaka: { variants: 1, dur: 3, pick: one },
  'kaju-katli': { variants: 4, dur: 8, pick: (idx) => idx % 4 },
  'nasa-mula': { variants: 1, dur: 3, pick: one },
  cheekbones: { variants: 1, dur: 4, pick: one },
  palming: { variants: 1, dur: 10, pick: one },
};

const urlFor = (id: string, v: number, ext: 'mp4' | 'jpg') => `${import.meta.env.BASE_URL}media/3d/${id}-${v}.${ext}`;

/** Load clips as blob URLs: Safari will not play range requests answered from the offline cache. */
function useBlobUrls(urls: string[], onError: () => void) {
  const [blobs, setBlobs] = useState<(string | null)[]>(() => urls.map(() => null));
  const key = urls.join('|');
  useEffect(() => {
    let alive = true;
    const made: string[] = [];
    setBlobs(urls.map(() => null));
    urls.forEach((u, i) =>
      fetch(u)
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((b) => {
          const o = URL.createObjectURL(b);
          made.push(o);
          if (alive) setBlobs((prev) => prev.map((x, k) => (k === i ? o : x)));
        })
        .catch(() => alive && onError()),
    );
    return () => {
      alive = false;
      made.forEach((o) => URL.revokeObjectURL(o));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return blobs;
}

export function Clip3D({ step, phase, reps, reduced, onFail }: { step: Step; phase: MotionValue<number>; reps: number; reduced: boolean; onFail: () => void }) {
  const spec = CLIPS_3D[step.id];
  const urls = Array.from({ length: spec.variants }, (_, v) => urlFor(step.id, v, 'mp4'));
  const blobs = useBlobUrls(urls, onFail);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    let lastP = phase.get();
    let lastT = performance.now();
    let speed = 0; // phase units per second, smoothed
    let cur = -1;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const p = phase.get();
      const dt = (now - lastT) / 1000;
      if (dt > 0) {
        const inst = Math.max(0, (p - lastP) / dt);
        speed = p < lastP ? speed : speed * 0.85 + inst * 0.15;
        if (inst === 0 && dt > 0) speed *= 0.6;
      }
      lastP = p;
      lastT = now;
      const { idx, t } = phaseInfo(p, reps);
      const v = Math.min(spec.pick(idx, step), spec.variants - 1);
      if (v !== cur) {
        cur = v;
        setActive(v);
        vids.current.forEach((el, k) => k !== v && el && !el.paused && el.pause());
      }
      const el = vids.current[v];
      if (!el || el.readyState < 2) return;
      const target = Math.min(t, 0.999) * spec.dur;
      const moving = !reduced && speed > 0.02 && p < reps;
      let drift = target - el.currentTime;
      if (drift > spec.dur / 2) drift -= spec.dur;
      if (drift < -spec.dur / 2) drift += spec.dur;
      if (!moving) {
        if (!el.paused) el.pause();
        if (Math.abs(drift) > 0.05) el.currentTime = target;
        return;
      }
      el.playbackRate = Math.min(4, Math.max(0.25, speed * spec.dur));
      if (Math.abs(drift) > 0.3) el.currentTime = target;
      if (el.paused) el.play().catch(() => undefined);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reps, reduced, spec, step]);

  return (
    <div className="relative flex h-full w-full items-center justify-center" role="img" aria-label={`Realistic demonstration of ${step.title}`}>
      {urls.map((u, v) => (
        <video
          key={u}
          ref={(el) => {
            vids.current[v] = el;
          }}
          src={blobs[v] ?? undefined}
          poster={urlFor(step.id, v, 'jpg')}
          className={`absolute max-h-full max-w-full rounded-3xl object-contain shadow-sm transition-opacity duration-300 ${v === active ? 'opacity-100' : 'opacity-0'}`}
          style={{ aspectRatio: '400 / 560' }}
          muted
          loop
          playsInline
          preload="auto"
          onError={() => blobs[v] && onFail()}
        />
      ))}
    </div>
  );
}
