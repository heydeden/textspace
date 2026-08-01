export const PROFILE_THEMES = [
  { key: 'default', label: 'Default' },
  { key: 'crimson', label: 'Crimson' },
  { key: 'emerald', label: 'Emerald' },
  { key: 'violet', label: 'Violet' },
  { key: 'ocean', label: 'Ocean' },
  { key: 'sunset', label: 'Sunset' },
  { key: 'gold', label: 'Gold' },
  { key: 'midnight', label: 'Midnight' },
] as const;

export type ProfileTheme = (typeof PROFILE_THEMES)[number]['key'];

const VALID = new Set<string>(PROFILE_THEMES.map(t => t.key));

export function validateProfileTheme(input: unknown): ProfileTheme | null {
  if (typeof input !== 'string') return null;
  const v = input.trim();
  if (!VALID.has(v)) return null;
  return v as ProfileTheme;
}

export interface ThemeClasses {
  border: string;
  borderHover: string;
  banner: string;
  ring: string;
  ringSm: string;
  accentButton: string;
  accentButtonOutline: string;
  accentText: string;
}

const THEME_CLASSES: Record<ProfileTheme, ThemeClasses> = {
  default: {
    border: 'border-zinc-800',
    borderHover: 'hover:border-zinc-700',
    banner: 'bg-gradient-to-r from-blue-600/40 via-sky-600/30 to-zinc-900',
    ring: 'ring-blue-500',
    ringSm: 'ring-blue-500/60',
    accentButton: 'bg-blue-600 text-white hover:bg-blue-700',
    accentButtonOutline: 'border-zinc-700 text-zinc-300 hover:border-blue-500 hover:text-blue-400',
    accentText: 'text-blue-400 hover:text-blue-300',
  },
  crimson: {
    border: 'border-red-900/60',
    borderHover: 'hover:border-red-700',
    banner: 'bg-gradient-to-r from-red-800/60 via-rose-700/40 to-zinc-900',
    ring: 'ring-red-500',
    ringSm: 'ring-red-500/60',
    accentButton: 'bg-red-600 text-white hover:bg-red-700',
    accentButtonOutline: 'border-zinc-700 text-zinc-300 hover:border-red-500 hover:text-red-400',
    accentText: 'text-red-400 hover:text-red-300',
  },
  emerald: {
    border: 'border-emerald-900/60',
    borderHover: 'hover:border-emerald-700',
    banner: 'bg-gradient-to-r from-emerald-800/60 via-green-700/40 to-zinc-900',
    ring: 'ring-emerald-500',
    ringSm: 'ring-emerald-500/60',
    accentButton: 'bg-emerald-600 text-white hover:bg-emerald-700',
    accentButtonOutline: 'border-zinc-700 text-zinc-300 hover:border-emerald-500 hover:text-emerald-400',
    accentText: 'text-emerald-400 hover:text-emerald-300',
  },
  violet: {
    border: 'border-violet-900/60',
    borderHover: 'hover:border-violet-700',
    banner: 'bg-gradient-to-r from-violet-800/60 via-purple-700/40 to-zinc-900',
    ring: 'ring-violet-500',
    ringSm: 'ring-violet-500/60',
    accentButton: 'bg-violet-600 text-white hover:bg-violet-700',
    accentButtonOutline: 'border-zinc-700 text-zinc-300 hover:border-violet-500 hover:text-violet-400',
    accentText: 'text-violet-400 hover:text-violet-300',
  },
  ocean: {
    border: 'border-cyan-900/60',
    borderHover: 'hover:border-cyan-700',
    banner: 'bg-gradient-to-r from-cyan-700/60 via-sky-600/40 to-zinc-900',
    ring: 'ring-cyan-400',
    ringSm: 'ring-cyan-400/60',
    accentButton: 'bg-cyan-600 text-white hover:bg-cyan-700',
    accentButtonOutline: 'border-zinc-700 text-zinc-300 hover:border-cyan-500 hover:text-cyan-400',
    accentText: 'text-cyan-400 hover:text-cyan-300',
  },
  sunset: {
    border: 'border-orange-900/60',
    borderHover: 'hover:border-orange-700',
    banner: 'bg-gradient-to-r from-orange-700/60 via-rose-600/40 to-zinc-900',
    ring: 'ring-orange-400',
    ringSm: 'ring-orange-400/60',
    accentButton: 'bg-orange-600 text-white hover:bg-orange-700',
    accentButtonOutline: 'border-zinc-700 text-zinc-300 hover:border-orange-500 hover:text-orange-400',
    accentText: 'text-orange-400 hover:text-orange-300',
  },
  gold: {
    border: 'border-yellow-900/60',
    borderHover: 'hover:border-yellow-700',
    banner: 'bg-gradient-to-r from-yellow-700/60 via-amber-600/40 to-zinc-900',
    ring: 'ring-yellow-400',
    ringSm: 'ring-yellow-400/60',
    accentButton: 'bg-yellow-600 text-white hover:bg-yellow-700',
    accentButtonOutline: 'border-zinc-700 text-zinc-300 hover:border-yellow-500 hover:text-yellow-400',
    accentText: 'text-yellow-400 hover:text-yellow-300',
  },
  midnight: {
    border: 'border-indigo-900/60',
    borderHover: 'hover:border-indigo-700',
    banner: 'bg-gradient-to-r from-indigo-900/70 via-blue-800/40 to-zinc-900',
    ring: 'ring-indigo-400',
    ringSm: 'ring-indigo-400/60',
    accentButton: 'bg-indigo-600 text-white hover:bg-indigo-700',
    accentButtonOutline: 'border-zinc-700 text-zinc-300 hover:border-indigo-500 hover:text-indigo-400',
    accentText: 'text-indigo-400 hover:text-indigo-300',
  },
};

export function themeClasses(theme?: string | null): ThemeClasses {
  const key = theme && VALID.has(theme) ? (theme as ProfileTheme) : 'default';
  return THEME_CLASSES[key];
}

export function themeClassNames(theme?: string | null): string {
  const key = theme && VALID.has(theme) ? (theme as ProfileTheme) : 'default';
  return key === 'default' ? '' : `theme-${key}`;
}
