import { describe, it, expect } from 'vitest';
import { formatCount, formatRemaining } from './format';

describe('formatCount', () => {
  it('returns string as-is for NaN input', () => {
    expect(formatCount('abc')).toBe('abc');
  });

  it('keeps numbers under 1000 unchanged', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(999)).toBe('999');
  });

  it('formats thousands with k', () => {
    expect(formatCount(1000)).toBe('1k');
    expect(formatCount(1500)).toBe('1.5k');
    expect(formatCount(12500)).toBe('12.5k');
  });

  it('formats millions with M', () => {
    expect(formatCount(1_000_000)).toBe('1M');
    expect(formatCount(2_450_000)).toBe('2.5M');
  });

  it('formats billions with B', () => {
    expect(formatCount(1_000_000_000)).toBe('1B');
  });

  it('handles negative values', () => {
    expect(formatCount(-2500)).toBe('-2.5k');
  });

  it('accepts numeric strings', () => {
    expect(formatCount('12345')).toBe('12.3k');
  });
});

describe('formatRemaining', () => {
  const now = new Date('2026-08-03T00:00:00.000Z');

  it('null → Permanen', () => {
    expect(formatRemaining(null, now)).toBe('Permanen');
  });

  it('minutes when < 1h', () => {
    expect(formatRemaining('2026-08-03T00:30:00.000Z', now)).toBe('30m');
  });

  it('hours when < 24h', () => {
    expect(formatRemaining('2026-08-03T05:00:00.000Z', now)).toBe('5h');
  });

  it('days when < 30d', () => {
    expect(formatRemaining('2026-08-10T00:00:00.000Z', now)).toBe('7d');
  });

  it('months when >= 30 days', () => {
    expect(formatRemaining('2026-10-01T00:00:00.000Z', now)).toBe('1mo');
  });

  it('past / expired', () => {
    expect(formatRemaining('2026-07-01T00:00:00.000Z', now)).toBe('Expired');
  });
});
