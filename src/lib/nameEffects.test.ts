import { describe, it, expect } from 'vitest';
import { NAME_EFFECTS, validateNameEffect, nameEffectClass } from './nameEffects';

describe('validateNameEffect', () => {
  it('accepts all registered effect keys', () => {
    for (const e of NAME_EFFECTS) {
      expect(validateNameEffect(e.key)).toBe(e.key);
    }
  });

  it('accepts none (removal)', () => {
    expect(validateNameEffect('none')).toBe('none');
  });

  it('rejects unknown effects', () => {
    expect(validateNameEffect('hacker')).toBeNull();
    expect(validateNameEffect('injection')).toBeNull();
  });

  it('rejects non-string input', () => {
    expect(validateNameEffect(123)).toBeNull();
    expect(validateNameEffect(null)).toBeNull();
    expect(validateNameEffect(undefined)).toBeNull();
    expect(validateNameEffect({})).toBeNull();
  });

  it('is case-sensitive', () => {
    expect(validateNameEffect('Lightning')).toBeNull();
  });

  it('trims surrounding whitespace', () => {
    expect(validateNameEffect('  lightning  ')).toBe('lightning');
  });
});

describe('nameEffectClass', () => {
  it('maps effect to css class', () => {
    expect(nameEffectClass('lightning')).toBe('name-effect-lightning');
    expect(nameEffectClass('gold')).toBe('name-effect-gold');
  });

  it('returns empty for none/unknown/missing', () => {
    expect(nameEffectClass('none')).toBe('');
    expect(nameEffectClass(null)).toBe('');
    expect(nameEffectClass(undefined)).toBe('');
    expect(nameEffectClass('bogus')).toBe('');
    expect(nameEffectClass('')).toBe('');
  });
});
