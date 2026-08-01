import { describe, it, expect } from 'vitest';
import {
  BADGE_THEMES, BADGE_EFFECTS,
  validateBadgeName, validateBadgeTheme, validateBadgeEffect, validateBadgeAssignments,
  badgeThemeClass, badgeEffectClass, MAX_BADGES_PER_USER,
} from './badges';

describe('validateBadgeName', () => {
  it('accepts 1-24 chars after trim', () => {
    expect(validateBadgeName('OG')).toBe('OG');
    expect(validateBadgeName('  Veteran Artist  ')).toBe('Veteran Artist');
    expect(validateBadgeName('x'.repeat(24))).toBe('x'.repeat(24));
  });

  it('rejects empty, too long, control chars, non-string', () => {
    expect(validateBadgeName('')).toBeNull();
    expect(validateBadgeName('   ')).toBeNull();
    expect(validateBadgeName('x'.repeat(25))).toBeNull();
    expect(validateBadgeName('a\u0001b')).toBeNull();
    expect(validateBadgeName(123)).toBeNull();
    expect(validateBadgeName(null)).toBeNull();
  });
});

describe('validateBadgeTheme', () => {
  it('accepts all registered themes', () => {
    for (const t of BADGE_THEMES) expect(validateBadgeTheme(t.key)).toBe(t.key);
  });

  it('rejects unknown themes', () => {
    expect(validateBadgeTheme('hacker')).toBeNull();
    expect(validateBadgeTheme(42)).toBeNull();
    expect(validateBadgeTheme('Violet')).toBeNull();
  });
});

describe('validateBadgeEffect', () => {
  it('accepts all registered effects', () => {
    for (const e of BADGE_EFFECTS) expect(validateBadgeEffect(e.key)).toBe(e.key);
  });

  it('rejects unknown effects', () => {
    expect(validateBadgeEffect('explode')).toBeNull();
    expect(validateBadgeEffect(null)).toBeNull();
  });
});

describe('validateBadgeAssignments', () => {
  it('accepts array of uuids up to max', () => {
    const ids = ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'];
    expect(validateBadgeAssignments(ids)).toHaveLength(MAX_BADGES_PER_USER);
    expect(validateBadgeAssignments([])).toEqual([]);
  });

  it('rejects too many, duplicates, bad ids, non-array', () => {
    const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    expect(validateBadgeAssignments(Array(6).fill(id))).toBeNull();
    expect(validateBadgeAssignments([id, id])).toBeNull();
    expect(validateBadgeAssignments(['not-a-uuid'])).toBeNull();
    expect(validateBadgeAssignments([123])).toBeNull();
    expect(validateBadgeAssignments('x')).toBeNull();
    expect(validateBadgeAssignments(null)).toBeNull();
  });
});

describe('badgeThemeClass', () => {
  it('maps theme to classes, defaults to violet', () => {
    expect(badgeThemeClass('gold')).toContain('yellow');
    expect(badgeThemeClass('bogus')).toBe(badgeThemeClass('violet'));
    expect(badgeThemeClass(null)).toContain('violet');
  });
});

describe('badgeEffectClass', () => {
  it('maps effect to css class', () => {
    expect(badgeEffectClass('shimmer')).toBe('badge-effect-shimmer');
    expect(badgeEffectClass('sparkle')).toBe('badge-effect-sparkle');
  });

  it('returns empty for none/unknown/missing', () => {
    expect(badgeEffectClass('none')).toBe('');
    expect(badgeEffectClass('bogus')).toBe('');
    expect(badgeEffectClass(null)).toBe('');
    expect(badgeEffectClass(undefined)).toBe('');
  });
});
