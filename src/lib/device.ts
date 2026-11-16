/** Screen Wake Lock + haptics helpers. */
type WakeLockSentinelLike = { release: () => Promise<void>; released?: boolean };
let sentinel: WakeLockSentinelLike | null = null;
let wanted = false;

async function acquire() {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } }).wakeLock;
    if (!wl || document.visibilityState !== 'visible') return;
    sentinel = await wl.request('screen');
  } catch {
    /* denied or unsupported */
  }
}

const onVisibility = () => {
  if (wanted && document.visibilityState === 'visible') void acquire();
};

export function keepAwake(on: boolean) {
  wanted = on;
  if (on) {
    document.addEventListener('visibilitychange', onVisibility);
    void acquire();
  } else {
    document.removeEventListener('visibilitychange', onVisibility);
    void sentinel?.release().catch(() => {});
    sentinel = null;
  }
}

export function vibrate(pattern: number | number[]) {
  try {
    const ua = (navigator as unknown as { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua && !ua.hasBeenActive) return;
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
