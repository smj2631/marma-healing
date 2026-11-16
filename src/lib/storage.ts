const PREFIX = 'marma.';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function loadRaw<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function remove(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

// ---------- Session progress (refresh-resume) ----------
export interface SessionProgress {
  protocolId: string;
  itemIndex: number;
  savedAt: number;
}

const MAX_RESUME_AGE = 1000 * 60 * 60 * 6; // 6 hours

export function getProgress(protocolId: string): SessionProgress | null {
  const p = loadRaw<SessionProgress>(`progress.${protocolId}`);
  if (!p || Date.now() - p.savedAt > MAX_RESUME_AGE) return null;
  return p;
}
export const saveProgress = (p: Omit<SessionProgress, 'savedAt'>) =>
  save(`progress.${p.protocolId}`, { ...p, savedAt: Date.now() });
export const clearProgress = (protocolId: string) => remove(`progress.${protocolId}`);

// ---------- History & streak ----------
export interface HistoryEntry {
  protocolId: string;
  completedAt: number;
  durationSec: number;
}

export const getHistory = (): HistoryEntry[] => loadRaw<HistoryEntry[]>('history') ?? [];

export function addHistory(entry: HistoryEntry) {
  const h = getHistory();
  h.push(entry);
  save('history', h.slice(-500));
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function getStats(protocolId?: string) {
  const h = getHistory().filter((e) => !protocolId || e.protocolId === protocolId);
  const last = h.length ? Math.max(...h.map((e) => e.completedAt)) : null;
  const days = new Set(h.map((e) => dayKey(e.completedAt)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  // A streak stays alive if you practised today or yesterday.
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { total: h.length, last, streak };
}
