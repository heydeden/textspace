export const NAME_EFFECTS = [
  { key: 'none', label: 'None' },
  { key: 'lightning', label: 'Lightning' },
  { key: 'neon', label: 'Neon' },
  { key: 'fire', label: 'Fire' },
  { key: 'aurora', label: 'Aurora' },
  { key: 'gold', label: 'Gold' },
  { key: 'rainbow', label: 'Rainbow' },
  { key: 'glow', label: 'Glow' },
] as const;

export type NameEffect = (typeof NAME_EFFECTS)[number]['key'];

const VALID = new Set<string>(NAME_EFFECTS.map(e => e.key));

export function validateNameEffect(input: unknown): NameEffect | null {
  if (typeof input !== 'string') return null;
  const v = input.trim();
  if (!VALID.has(v)) return null;
  return v as NameEffect;
}

export function nameEffectClass(effect?: string | null): string {
  if (!effect || effect === 'none' || !VALID.has(effect)) return '';
  return `name-effect-${effect}`;
}
