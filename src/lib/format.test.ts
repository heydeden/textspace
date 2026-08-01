import { describe, it, expect } from 'vitest';
import { formatCount } from './format';

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
