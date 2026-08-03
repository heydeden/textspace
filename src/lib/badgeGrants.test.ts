import { describe, it, expect } from 'vitest';
import {
  GRANT_PRESETS, GRANT_UNITS,
  grantDurationMs, isGrantPreset, grantExpiry, parseBadgeGrants, closestPreset,
} from './badgeGrants';

describe('GRANT_PRESETS / GRANT_UNITS', () => {
  it('has a permanen preset (value 0)', () => {
    expect(GRANT_PRESETS[0].value).toBe(0);
    expect(GRANT_PRESETS[0].label).toBe('Permanen');
  });

  it('presets cover all units and positive durations', () => {
    const units = new Set(GRANT_PRESETS.map(p => p.unit));
    expect([...units].sort()).toEqual([...GRANT_UNITS].sort());
    for (const p of GRANT_PRESETS.slice(1)) {
      expect(p.value).toBeGreaterThan(0);
    }
  });

  it('has 13 presets including permanen', () => {
    expect(GRANT_PRESETS).toHaveLength(13);
  });
});

describe('grantDurationMs', () => {
  it('value 0 → null (permanen), any unit', () => {
    expect(grantDurationMs(0, 'hour')).toBeNull();
    expect(grantDurationMs(0, 'month')).toBeNull();
  });

  it('1 hour = 3600000 ms', () => {
    expect(grantDurationMs(1, 'hour')).toBe(3600 * 1000);
  });

  it('1 day = 86400000 ms', () => {
    expect(grantDurationMs(1, 'day')).toBe(24 * 3600 * 1000);
  });

  it('1 week = 7 days', () => {
    expect(grantDurationMs(1, 'week')).toBe(7 * 24 * 3600 * 1000);
  });

  it('1 month = 30 days', () => {
    expect(grantDurationMs(1, 'month')).toBe(30 * 24 * 3600 * 1000);
  });

  it('multiples scale linearly', () => {
    expect(grantDurationMs(7, 'day')).toBe(7 * 86400000);
  });

  it('rejects negative and non-finite', () => {
    expect(grantDurationMs(-1, 'day')).toBeNull();
    expect(grantDurationMs(NaN, 'day')).toBeNull();
    expect(grantDurationMs(Infinity, 'day')).toBeNull();
  });
});

describe('isGrantPreset', () => {
  it('matches known presets', () => {
    expect(isGrantPreset(0, 'hour')).toBe(true);
    expect(isGrantPreset(7, 'day')).toBe(true);
    expect(isGrantPreset(6, 'month')).toBe(true);
  });

  it('rejects unknown combos', () => {
    expect(isGrantPreset(2, 'day')).toBe(false);
    expect(isGrantPreset(10, 'month')).toBe(false);
    expect(isGrantPreset(1, 'week')).toBe(true);
  });
});

describe('parseBadgeGrants', () => {
  const bid = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  it('string badge → permanen (null expiry)', () => {
    const g = parseBadgeGrants([bid]);
    expect(g).toHaveLength(1);
    expect(g![0].id).toBe(bid);
    expect(g![0].expiresAt).toBeNull();
  });

  it('object with value 0 → permanen', () => {
    const g = parseBadgeGrants([{ id: bid, value: 0, unit: 'day' }]);
    expect(g![0].expiresAt).toBeNull();
  });

  it('object with preset → set expiry', () => {
    const g = parseBadgeGrants([{ id: bid, value: 1, unit: 'week' }]);
    expect(g![0].expiresAt).not.toBeNull();
  });

  it('rejects too many grants', () => {
    const arr = Array(6).fill('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    expect(parseBadgeGrants(arr)).toBeNull();
  });

  it('rejects duplicate badge id', () => {
    expect(parseBadgeGrants([bid, bid])).toBeNull();
  });

  it('rejects non-preset duration', () => {
    expect(parseBadgeGrants([{ id: bid, value: 3, unit: 'day' }])).toBeNull();
  });

  it('rejects non-UUID badge id', () => {
    expect(parseBadgeGrants(['not-a-uuid'])).toBeNull();
    expect(parseBadgeGrants([{ id: '', value: 0, unit: 'day' }])).toBeNull();
    expect(parseBadgeGrants([{ id: 'a' }])).toBeNull();
  });

  it('rejects bad object shapes', () => {
    expect(parseBadgeGrants([{ id: 123 }])).toBeNull();
    expect(parseBadgeGrants([{ id: bid, value: 'x', unit: 'day' }])).toBeNull();
    expect(parseBadgeGrants('not-array')).toBeNull();
    expect(parseBadgeGrants([null])).toBeNull();
  });

  it('accepts mixed string + object up to 5', () => {
    const g = parseBadgeGrants([
      bid,
      { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', value: 7, unit: 'day' },
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', value: 1, unit: 'month' },
    ]);
    expect(g).toHaveLength(4);
  });
});

describe('closestPreset', () => {
  it('expired/zero → permanen', () => {
    expect(closestPreset(0)).toEqual({ value: 0, unit: 'hour' });
    expect(closestPreset(-1000)).toEqual({ value: 0, unit: 'hour' });
  });

  it('~1h sisa → 1 hour', () => {
    expect(closestPreset(3600 * 1000)).toEqual({ value: 1, unit: 'hour' });
  });

  it('~5d sisa → 7 day (preset terdekat)', () => {
    const c = closestPreset(5 * 24 * 3600 * 1000);
    expect(c).toEqual({ value: 7, unit: 'day' });
  });

  it('~2d sisa → 1 day', () => {
    expect(closestPreset(2 * 24 * 3600 * 1000)).toEqual({ value: 1, unit: 'day' });
  });

  it('hasil selalu preset valid (isGrantPreset true)', () => {
    for (const ms of [3600e3, 5 * 3600e3, 12 * 3600e3, 3 * 86400e3, 10 * 86400e3, 45 * 86400e3, 90 * 86400e3, 200 * 86400e3]) {
      const c = closestPreset(ms);
      expect(isGrantPreset(c.value, c.unit)).toBe(true);
    }
  });
});

describe('grantExpiry', () => {
  const from = new Date('2026-08-03T00:00:00.000Z');

  it('permanen → null', () => {
    expect(grantExpiry(from, 0, 'hour')).toBeNull();
  });

  it('1 day → +24h ISO', () => {
    expect(grantExpiry(from, 1, 'day')).toBe('2026-08-04T00:00:00.000Z');
  });

  it('1 hour → +1h', () => {
    expect(grantExpiry(from, 1, 'hour')).toBe('2026-08-03T01:00:00.000Z');
  });

  it('2 weeks → +14 days', () => {
    expect(grantExpiry(from, 2, 'week')).toBe('2026-08-17T00:00:00.000Z');
  });
});