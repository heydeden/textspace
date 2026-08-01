// Name effect registry — admin-defined seperti badge.
// Katalog tema & efek SAMA dengan badge (satu sumber di badges.ts).
import { BADGE_THEMES, BADGE_EFFECTS, isBadgeTheme, isBadgeEffect, validateBadgeName } from './badges';

export const NAME_EFFECT_THEMES = BADGE_THEMES;
export const NAME_EFFECT_FX = BADGE_EFFECTS;

export const MAX_NAME_EFFECT_LENGTH = 24;

export const validateNameEffectName = validateBadgeName;

export function validateNameEffectTheme(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const v = input.trim();
  return isBadgeTheme(v) ? v : null;
}

export function validateNameEffectFx(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const v = input.trim();
  return isBadgeEffect(v) ? v : null;
}

export interface NameEffectDef {
  id: string;
  name: string;
  theme: string;
  effect: string;
  active?: boolean;
}

export function nameEffectClass(theme?: string | null, effect?: string | null): string {
  const t = isBadgeTheme(theme) ? `name-theme-${theme}` : '';
  const fx = effect && effect !== 'none' && isBadgeEffect(effect) ? `name-fx-${effect}` : '';
  return [t, fx].filter(Boolean).join(' ');
}
