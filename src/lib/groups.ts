// Grup: validasi nama/slug/privacy + aturan role (admin/user).

export const GROUP_NAME_MAX = 40;
export const GROUP_SLUG_MAX = 40;
export const GROUP_DESCRIPTION_MAX = 300;
export const GROUP_ROLES = ['admin', 'user'] as const;
export const GROUP_PRIVACIES = ['public', 'private'] as const;

export type GroupRole = (typeof GROUP_ROLES)[number];
export type GroupPrivacy = (typeof GROUP_PRIVACIES)[number];

// Cek karakter kontrol (U+0000–U+001F, U+007F).
function hasControl(s: string): boolean {
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c <= 0x1f || c === 0x7f) return true;
  }
  return false;
}

export function validateGroupName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (s.length === 0 || s.length > GROUP_NAME_MAX || hasControl(s)) return null;
  return s;
}

// Slug: lowercase alnum + dash, 2-40 chars, tidak mulai/akhir dash.
export function validateGroupSlug(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (s.length < 2 || s.length > GROUP_SLUG_MAX) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return null;
  return s;
}

export function validateGroupPrivacy(v: unknown): GroupPrivacy | null {
  if (typeof v !== 'string') return null;
  return (GROUP_PRIVACIES as readonly string[]).includes(v) ? (v as GroupPrivacy) : null;
}

export function validateGroupRole(v: unknown): GroupRole | null {
  if (typeof v !== 'string') return null;
  return (GROUP_ROLES as readonly string[]).includes(v) ? (v as GroupRole) : null;
}

export function validateGroupDescription(v: unknown): string {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  if (hasControl(s)) return '';
  return s.slice(0, GROUP_DESCRIPTION_MAX);
}

// Siapa boleh manage (edit/kick/role/approve/hapus post anggota):
// hanya admin grup (creator jadi admin). Non-anggota tidak bisa.
export function canManageGroup(role: unknown): role is GroupRole {
  return role === 'admin';
}
