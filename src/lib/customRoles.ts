export const ROLE_COLORS = [
  'bg-violet-500/20 text-violet-300',
  'bg-pink-500/20 text-pink-300',
  'bg-emerald-500/20 text-emerald-300',
  'bg-orange-500/20 text-orange-300',
  'bg-cyan-500/20 text-cyan-300',
  'bg-rose-500/20 text-rose-300',
  'bg-lime-500/20 text-lime-300',
  'bg-sky-500/20 text-sky-300',
  'bg-fuchsia-500/20 text-fuchsia-300',
  'bg-teal-500/20 text-teal-300',
] as const;

export const MAX_CUSTOM_ROLES = 5;
export const MAX_CUSTOM_ROLE_LENGTH = 24;

export function validateCustomRoles(input: unknown): string[] | null {
  if (input === null || input === undefined) return null;
  if (!Array.isArray(input)) return null;
  if (input.length > MAX_CUSTOM_ROLES) return null;

  const roles: string[] = [];
  for (const item of input) {
    if (typeof item !== 'string') return null;
    const trimmed = item.trim();
    if (trimmed.length < 1 || trimmed.length > MAX_CUSTOM_ROLE_LENGTH) return null;
    if (/[\u0000-\u001f\u007f]/.test(trimmed)) return null;
    if (roles.includes(trimmed)) return null;
    roles.push(trimmed);
  }
  return roles;
}

export function roleColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return ROLE_COLORS[hash % ROLE_COLORS.length];
}
