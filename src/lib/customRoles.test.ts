import { describe, it, expect } from 'vitest';
import { validateCustomRoles, roleColor, ROLE_COLORS } from './customRoles';

describe('validateCustomRoles', () => {
  it('accepts a valid list of roles', () => {
    expect(validateCustomRoles(['Veteran', 'Artist'])).toEqual(['Veteran', 'Artist']);
  });

  it('accepts a single role', () => {
    expect(validateCustomRoles(['Admin'])).toEqual(['Admin']);
  });

  it('trims whitespace around names', () => {
    expect(validateCustomRoles(['  Artist  '])).toEqual(['Artist']);
  });

  it('accepts empty array (clears roles)', () => {
    expect(validateCustomRoles([])).toEqual([]);
  });

  it('accepts null/undefined (no change)', () => {
    expect(validateCustomRoles(null)).toBeNull();
    expect(validateCustomRoles(undefined)).toBeNull();
  });

  it('rejects more than 5 roles', () => {
    expect(validateCustomRoles(['a', 'b', 'c', 'd', 'e', 'f'])).toBeNull();
  });

  it('rejects names longer than 24 chars', () => {
    expect(validateCustomRoles(['x'.repeat(25)])).toBeNull();
  });

  it('allows exactly 24 chars', () => {
    expect(validateCustomRoles(['x'.repeat(24)])).toEqual(['x'.repeat(24)]);
  });

  it('rejects empty names', () => {
    expect(validateCustomRoles([''])).toBeNull();
    expect(validateCustomRoles(['   '])).toBeNull();
  });

  it('rejects duplicates', () => {
    expect(validateCustomRoles(['Artist', 'Artist'])).toBeNull();
  });

  it('rejects control characters', () => {
    expect(validateCustomRoles(['Bad\nRole'])).toBeNull();
  });

  it('rejects non-string items', () => {
    expect(validateCustomRoles([42])).toBeNull();
    expect(validateCustomRoles(['ok', {}])).toBeNull();
  });

  it('rejects non-array input', () => {
    expect(validateCustomRoles('Veteran')).toBeNull();
    expect(validateCustomRoles(123)).toBeNull();
  });
});

describe('roleColor', () => {
  it('is deterministic for the same name', () => {
    expect(roleColor('Artist')).toBe(roleColor('Artist'));
  });

  it('always returns a valid palette entry', () => {
    const samples = ['a', 'Veteran', 'Long Role Name Here', 'zz', 'Admin', '中文角色'];
    for (const s of samples) {
      expect(ROLE_COLORS).toContain(roleColor(s));
    }
  });

  it('spreads across different palette entries', () => {
    const unique = new Set(['Veteran', 'Artist', 'OG', 'Founder', 'Helper', 'Moderator'].map(roleColor));
    expect(unique.size).toBeGreaterThan(1);
  });
});
