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
  {
    name: 'Robot',
    styles: ['bottts', 'bottts-neutral', 'disco'],
  },
  {
    name: 'Pixel Art',
    styles: ['pixel-art', 'pixel-art-neutral'],
  },
  {
    name: 'Geometric',
    styles: ['identicon', 'shapes', 'shape-grid', 'rings', 'glass', 'stripes', 'triangles', 'glyphs'],
  },
  {
    name: 'Emoji',
    styles: ['fun-emoji'],
  },
  {
    name: 'Icons',
    styles: ['icons'],
  },
  {
    name: 'Initials',
    styles: ['initials'],
  },
];

export const ALL_AVATAR_STYLES: string[] = AVATAR_CATEGORIES.flatMap(c => c.styles);

export function isValidAvatarStyle(style: unknown): style is string {
  return typeof style === 'string' && ALL_AVATAR_STYLES.includes(style);
}

export function avatarUrl(style: string, seed: string, size = 128): string {
  return `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}
