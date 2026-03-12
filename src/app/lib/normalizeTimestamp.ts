/** Normalize a timestamp that may be a number or a Firebase serverTimestamp object. */
export function normalizeTimestamp(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'object' && raw !== null && 'seconds' in raw) {
    return (raw as { seconds: number }).seconds * 1000;
  }
  return Date.now();
}
