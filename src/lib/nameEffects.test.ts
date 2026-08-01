import { describe, it, expect } from 'vitest';
import { NAME_EFFECT_THEMES, NAME_EFFECT_FX, validateNameEffectName, validateNameEffectTheme, validateNameEffectFx, nameEffectClass } from './nameEffects';

describe('validateNameEffectName', () => {
  it('accepts 1-24 chars after trim', () => {
    expect(validateNameEffectName('Electric')).toBe('Electric');
    expect(validateNameEffectName('x'.repeat(24))).toBe('x'.repeat(24));
  });

  it('rejects empty, too long, control chars, non-string', () => {
    expect(validateNameEffectName('')).toBeNull();
    expect(validateNameEffectName('x'.repeat(25))).toBeNull();
    expect(validateNameEffectName('a\u0001b')).toBeNull();
    expect(validateNameEffectName(123)).toBeNull();
    expect(validateNameEffectName(null)).toBeNull();
  });
});

describe('validateNameEffectTheme (katalog sama badge)', () => {
  it('accepts all registered themes', () => {
    for (const t of NAME_EFFECT_THEMES) expect(validateNameEffectTheme(t.key)).toBe(t.key);
  });

  it('rejects unknown', () => {
    expect(validateNameEffectTheme('hacker')).toBeNull();
    expect(validateNameEffectTheme(42)).toBeNull();
    expect(validateNameEffectTheme('Violet')).toBeNull();
  });
});

describe('validateNameEffectFx', () => {
  it('accepts all registered effects', () => {
    for (const e of NAME_EFFECT_FX) expect(validateNameEffectFx(e.key)).toBe(e.key);
  });

  it('rejects unknown', () => {
    expect(validateNameEffectFx('explode')).toBeNull();
    expect(validateNameEffectFx(null)).toBeNull();
  });
});

describe('nameEffectClass', () => {
  it('combines theme + effect classes', () => {
    expect(nameEffectClass('gold', 'shimmer')).toBe('name-theme-gold name-fx-shimmer');
    expect(nameEffectClass('cyan', 'neon')).toBe('name-theme-cyan name-fx-neon');
  });

  it('theme only / effect only', () => {
    expect(nameEffectClass('red', 'none')).toBe('name-theme-red');
    expect(nameEffectClass('red', null)).toBe('name-theme-red');
  });

  it('empty for missing/invalid', () => {
    expect(nameEffectClass(null, null)).toBe('');
    expect(nameEffectClass('bogus', 'shimmer')).toBe('name-fx-shimmer');
    expect(nameEffectClass('red', 'bogus')).toBe('name-theme-red');
    expect(nameEffectClass(undefined, undefined)).toBe('');
  });
});
