import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizeTimestamp } from '@/app/lib/normalizeTimestamp';

describe('normalizeTimestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-12T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the value as-is when it is a number', () => {
    expect(normalizeTimestamp(1700000000000)).toBe(1700000000000);
  });

  it('converts a Firebase serverTimestamp object (seconds) to milliseconds', () => {
    const serverTs = { seconds: 1700000000, nanoseconds: 0 };
    expect(normalizeTimestamp(serverTs)).toBe(1700000000000);
  });

  it('falls back to Date.now() for null', () => {
    expect(normalizeTimestamp(null)).toBe(Date.now());
  });

  it('falls back to Date.now() for undefined', () => {
    expect(normalizeTimestamp(undefined)).toBe(Date.now());
  });

  it('falls back to Date.now() for a string', () => {
    expect(normalizeTimestamp('not-a-timestamp')).toBe(Date.now());
  });

  it('falls back to Date.now() for an object without seconds', () => {
    expect(normalizeTimestamp({ foo: 'bar' })).toBe(Date.now());
  });
});
