export const BADGE_THEMES = [
  { key: 'violet', label: 'Violet', cls: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { key: 'pink', label: 'Pink', cls: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { key: 'emerald', label: 'Emerald', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { key: 'orange', label: 'Orange', cls: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { key: 'cyan', label: 'Cyan', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { key: 'rose', label: 'Rose', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { key: 'lime', label: 'Lime', cls: 'bg-lime-500/20 text-lime-300 border-lime-500/30' },
  { key: 'sky', label: 'Sky', cls: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { key: 'fuchsia', label: 'Fuchsia', cls: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' },
  { key: 'teal', label: 'Teal', cls: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { key: 'red', label: 'Red', cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { key: 'blue', label: 'Blue', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { key: 'indigo', label: 'Indigo', cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { key: 'amber', label: 'Amber', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { key: 'purple', label: 'Purple', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { key: 'green', label: 'Green', cls: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { key: 'gold', label: 'Gold', cls: 'bg-gradient-to-r from-yellow-500/25 to-amber-500/25 text-yellow-300 border-yellow-500/40' },
  { key: 'fire', label: 'Fire', cls: 'bg-gradient-to-r from-orange-500/25 to-red-500/25 text-orange-300 border-orange-500/40' },
  { key: 'ocean', label: 'Ocean', cls: 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border-cyan-500/40' },
  { key: 'violetgrad', label: 'Violet Grad', cls: 'bg-gradient-to-r from-violet-500/25 to-fuchsia-500/25 text-violet-300 border-violet-500/40' },
] as const;

export const BADGE_EFFECTS = [
  { key: 'none', label: 'None' },
  { key: 'glow', label: 'Glow' },
  { key: 'pulse', label: 'Pulse' },
  { key: 'shimmer', label: 'Shimmer' },
  { key: 'sparkle', label: 'Sparkle' },
  { key: 'fire', label: 'Fire' },
  { key: 'neon', label: 'Neon' },
  { key: 'rainbow', label: 'Rainbow' },
  { key: 'aurora', label: 'Aurora' },
  { key: 'lightning', label: 'Lightning' },
  { key: 'bounce', label: 'Bounce' },
  { key: 'wiggle', label: 'Wiggle' },
  { key: 'pop', label: 'Pop' },
] as const;

export type BadgeTheme = (typeof BADGE_THEMES)[number]['key'];
export type BadgeEffect = (typeof BADGE_EFFECTS)[number]['key'];

export const MAX_BADGES_PER_USER = 5;
export const MAX_BADGE_NAME_LENGTH = 24;

const THEME_KEYS = new Set<string>(BADGE_THEMES.map(t => t.key));
const EFFECT_KEYS = new Set<string>(BADGE_EFFECTS.map(e => e.key));

export function isBadgeTheme(key: unknown): key is BadgeTheme {
  return typeof key === 'string' && THEME_KEYS.has(key);
}

export function isBadgeEffect(key: unknown): key is BadgeEffect {
  return typeof key === 'string' && EFFECT_KEYS.has(key);
}

export interface BadgeDef {
  id: string;
  name: string;
  theme: BadgeTheme;
  effect: BadgeEffect;
  active?: boolean;
}

export function validateBadgeName(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const v = input.trim();
  if (v.length < 1 || v.length > MAX_BADGE_NAME_LENGTH) return null;
  if (/[\u0000-\u001f\u007f]/.test(v)) return null;
  return v;
}

export function validateBadgeTheme(input: unknown): BadgeTheme | null {
  if (typeof input !== 'string') return null;
  const v = input.trim();
  if (!THEME_KEYS.has(v)) return null;
  return v as BadgeTheme;
}

export function validateBadgeEffect(input: unknown): BadgeEffect | null {
  if (typeof input !== 'string') return null;
  const v = input.trim();
  if (!EFFECT_KEYS.has(v)) return null;
  return v as BadgeEffect;
}

export function validateBadgeAssignments(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length > MAX_BADGES_PER_USER) return null;
  if (new Set(input).size !== input.length) return null;
  const ids: string[] = [];
  for (const item of input) {
    if (typeof item !== 'string') return null;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item)) return null;
    ids.push(item);
  }
  return ids;
}

export function badgeThemeClass(theme?: string | null): string {
  if (!theme) return BADGE_THEMES[0].cls;
  const t = BADGE_THEMES.find(x => x.key === theme);
  return t ? t.cls : BADGE_THEMES[0].cls;
}

export function badgeEffectClass(effect?: string | null): string {
  if (!effect || effect === 'none' || !EFFECT_KEYS.has(effect)) return '';
  return `badge-effect-${effect}`;
}
