export interface AvatarCategory {
  name: string;
  styles: string[];
}

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    name: 'Character',
    styles: [
      'adventurer', 'adventurer-neutral', 'avataaars', 'avataaars-neutral',
      'big-ears', 'big-ears-neutral', 'big-smile', 'croodles', 'croodles-neutral',
      'dylan', 'lorelei', 'lorelei-neutral', 'micah', 'miniavs', 'notionists',
      'notionists-neutral', 'open-peeps', 'personas', 'thumbs', 'toon-head', 'initial-face',
    ],
  },
];

export const ALL_AVATAR_STYLES: string[] = AVATAR_CATEGORIES.flatMap(c => c.styles);

export function isValidAvatarStyle(style: unknown): style is string {
  return typeof style === 'string' && ALL_AVATAR_STYLES.includes(style);
}

export const AVATAR_SEED_RE = /^[A-Za-z0-9_-]{1,50}$/;

export function avatarUrl(style: string, seed: string, size = 128): string {
  return `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

export function variantSeed(username: string, variant: number): string {
  return variant === 0 ? username : `${username}-${variant}`;
}
