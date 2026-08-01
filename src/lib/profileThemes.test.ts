import { describe, it, expect } from 'vitest';
import { PROFILE_THEMES, validateProfileTheme, themeClasses, themeClassNames } from './profileThemes';

describe('validateProfileTheme', () => {
  it('accepts all registered theme keys', () => {
    for (const t of PROFILE_THEMES) {
      expect(validateProfileTheme(t.key)).toBe(t.key);
    }
  });

  it('rejects unknown themes', () => {
    expect(validateProfileTheme('hacker')).toBeNull();
    expect(validateProfileTheme('rainbow-banner')).toBeNull();
  });

  it('rejects non-string input', () => {
    expect(validateProfileTheme(123)).toBeNull();
    expect(validateProfileTheme(null)).toBeNull();
    expect(validateProfileTheme(undefined)).toBeNull();
  });

  it('trims whitespace and is case-sensitive', () => {
    expect(validateProfileTheme('  crimson  ')).toBe('crimson');
    expect(validateProfileTheme('Crimson')).toBeNull();
  });
});

describe('themeClasses', () => {
  it('returns full class map for valid theme', () => {
    const t = themeClasses('crimson');
    expect(t.border).toContain('red');
    expect(t.banner).toContain('gradient');
    expect(t.ring).toContain('red');
  });

  it('falls back to default for invalid/missing', () => {
    const def = themeClasses('default');
    expect(themeClasses('bogus').border).toBe(def.border);
    expect(themeClasses(null).border).toBe(def.border);
    expect(themeClasses(undefined).border).toBe(def.border);
    expect(themeClasses('').border).toBe(def.border);
  });
});

describe('themeClassNames', () => {
  it('maps theme to css class', () => {
    expect(themeClassNames('crimson')).toBe('theme-crimson');
    expect(themeClassNames('gold')).toBe('theme-gold');
  });

  it('returns empty for default/invalid', () => {
    expect(themeClassNames('default')).toBe('');
    expect(themeClassNames(null)).toBe('');
    expect(themeClassNames('bogus')).toBe('');
  });
});
