import { describe, it, expect } from 'vitest';
import {
  GROUP_NAME_MAX, GROUP_SLUG_MAX,
  validateGroupName, validateGroupSlug, validateGroupPrivacy, validateGroupRole,
  validateGroupDescription, canManageGroup,
} from './groups';

describe('validateGroupName', () => {
  it('accepts trimmed 1-40 chars', () => {
    expect(validateGroupName('Nuansa')).toBe('Nuansa');
    expect(validateGroupName('  Anime Lovers  ')).toBe('Anime Lovers');
    expect(validateGroupName('x'.repeat(GROUP_NAME_MAX))).toBe('x'.repeat(GROUP_NAME_MAX));
  });

  it('rejects empty, too long, control chars, non-string', () => {
    expect(validateGroupName('')).toBeNull();
    expect(validateGroupName('   ')).toBeNull();
    expect(validateGroupName('x'.repeat(GROUP_NAME_MAX + 1))).toBeNull();
    expect(validateGroupName('ab')).toBeNull();
    expect(validateGroupName('ab')).toBeNull();
    expect(validateGroupName(123)).toBeNull();
    expect(validateGroupName(null)).toBeNull();
  });
});

describe('validateGroupSlug', () => {
  it('accepts lowercase alnum with optional single dashes', () => {
    expect(validateGroupSlug('nuansa')).toBe('nuansa');
    expect(validateGroupSlug('  Anime-Lovers ')).toBe('anime-lovers');
    expect(validateGroupSlug('web-dev')).toBe('web-dev');
    expect(validateGroupSlug('a'.repeat(GROUP_SLUG_MAX))).toBe('a'.repeat(GROUP_SLUG_MAX));
  });

  it('rejects too short, bad chars, leading/trailing/double dash, non-string', () => {
    expect(validateGroupSlug('a')).toBeNull();
    expect(validateGroupSlug('-dev')).toBeNull();
    expect(validateGroupSlug('dev-')).toBeNull();
    expect(validateGroupSlug('dev--web')).toBeNull();
    expect(validateGroupSlug('has space')).toBeNull();
    expect(validateGroupSlug('UPPER')).toBe('upper'); // tolok lowercase
    expect(validateGroupSlug('web_dev')).toBeNull();
    expect(validateGroupSlug('a'.repeat(GROUP_SLUG_MAX + 1))).toBeNull();
    expect(validateGroupSlug(42)).toBeNull();
  });
});

describe('validateGroupPrivacy', () => {
  it('accepts public/private', () => {
    expect(validateGroupPrivacy('public')).toBe('public');
    expect(validateGroupPrivacy('private')).toBe('private');
  });

  it('rejects unknown', () => {
    expect(validateGroupPrivacy('secret')).toBeNull();
    expect(validateGroupPrivacy('PUBLIC')).toBeNull();
    expect(validateGroupPrivacy(1)).toBeNull();
  });
});

describe('validateGroupRole', () => {
  it('accepts admin/user', () => {
    expect(validateGroupRole('admin')).toBe('admin');
    expect(validateGroupRole('user')).toBe('user');
  });

  it('rejects unknown', () => {
    expect(validateGroupRole('mod')).toBeNull();
    expect(validateGroupRole(0)).toBeNull();
  });
});

describe('validateGroupDescription', () => {
  it('trims and caps at 300', () => {
    expect(validateGroupDescription('  halo  ')).toBe('halo');
    expect(validateGroupDescription('x'.repeat(500))).toHaveLength(300);
    expect(validateGroupDescription(undefined)).toBe('');
    expect(validateGroupDescription(42)).toBe('');
  });

  it('rejects control chars', () => {
    expect(validateGroupDescription('ab')).toBe('');
    expect(validateGroupDescription('\nhi')).toBe('hi');
    expect(validateGroupDescription('ok')).toBe('ok');
  });
});

describe('canManageGroup', () => {
  it('only admin can manage', () => {
    expect(canManageGroup('admin')).toBe(true);
    expect(canManageGroup('user')).toBe(false);
    expect(canManageGroup(null)).toBe(false);
    expect(canManageGroup(undefined)).toBe(false);
  });
});
