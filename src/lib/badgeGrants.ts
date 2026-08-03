// Badge grant expiry — durasi pemberian badge + kalkulasi waktu kadaluarsa.
// expires_at null = permanen (badge biasa).
import { MAX_BADGES_PER_USER } from './badges';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type GrantUnit = 'hour' | 'day' | 'week' | 'month';

export const GRANT_UNITS: GrantUnit[] = ['hour', 'day', 'week', 'month'];

export const GRANT_PRESETS: { value: number; unit: GrantUnit; label: string }[] = [
  { value: 0, unit: 'hour', label: 'Permanen' },
  { value: 1, unit: 'hour', label: '1 jam' },
  { value: 4, unit: 'hour', label: '4 jam' },
  { value: 12, unit: 'hour', label: '12 jam' },
  { value: 1, unit: 'day', label: '1 hari' },
  { value: 7, unit: 'day', label: '7 hari' },
  { value: 30, unit: 'day', label: '30 hari' },
  { value: 1, unit: 'week', label: '1 minggu' },
  { value: 2, unit: 'week', label: '2 minggu' },
  { value: 4, unit: 'week', label: '4 minggu' },
  { value: 1, unit: 'month', label: '1 bulan' },
  { value: 3, unit: 'month', label: '3 bulan' },
  { value: 6, unit: 'month', label: '6 bulan' },
];

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

// Durasi yang ditukar ke ms. value=0 → null (permanen).
export function grantDurationMs(value: number, unit: GrantUnit): number | null {
  if (value === 0) return null;
  if (value < 0 || !Number.isFinite(value)) return null;
  const base: Record<GrantUnit, number> = {
    hour: HOUR_MS,
    day: DAY_MS,
    week: WEEK_MS,
    month: MONTH_MS,
  };
  return value * base[unit];
}

// Preset mana yang cocok dengan (value, unit); null kalau tak ada. value=0 = permanen (unit apa pun).
export function isGrantPreset(value: number, unit: GrantUnit): boolean {
  if (value === 0) return GRANT_UNITS.includes(unit);
  return GRANT_PRESETS.some(p => p.value === value && p.unit === unit);
}

// expires_at dari `from` + durasi. value=0/unit apa pun → null (permanen).
export function grantExpiry(from: Date, value: number, unit: GrantUnit): string | null {
  const ms = grantDurationMs(value, unit);
  if (ms === null) return null;
  return new Date(from.getTime() + ms).toISOString();
}

// Preset yang expires-nya paling dekat dengan sisa waktu msLeft (dipakai openAction
// untuk re-pick durasi badge yang masih aktif). msLeft<=0 atau 0 ms → permanen.
// Kalau tak ada preset cocok → 0 (permanen), supaya Save selalu valid.
export function closestPreset(msLeft: number): { value: number; unit: GrantUnit } {
  if (msLeft <= 0) return { value: 0, unit: 'hour' };
  let best = { value: 0, unit: 'hour' as GrantUnit };
  let bestDiff = Infinity;
  for (const p of GRANT_PRESETS) {
    const pms = grantDurationMs(p.value, p.unit);
    if (pms === null) continue; // permanen
    const diff = Math.abs(msLeft - pms);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = { value: p.value, unit: p.unit };
    }
  }
  return best;
}

// Badge grant dari payload admin. Badge bisa: id string (permanen) atau {id, value, unit}.
// Return null kalau format invalid (badge ids tidak divalidasi uuid di sini).
export interface BadgeGrant {
  id: string;
  expiresAt: string | null;
}

export function parseBadgeGrants(input: unknown): BadgeGrant[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length > MAX_BADGES_PER_USER) return null;
  const ids = new Set<string>();
  const grants: BadgeGrant[] = [];
  for (const item of input) {
    let id: string;
    let value: number;
    let unit: GrantUnit;
    if (typeof item === 'string') {
      id = item;
      value = 0;
      unit = 'hour';
    } else if (item && typeof item === 'object') {
      const obj = item as { id?: unknown; value?: unknown; unit?: unknown };
      if (typeof obj.id !== 'string') return null;
      id = obj.id;
      if (obj.value === undefined && obj.unit === undefined) {
        value = 0;
        unit = 'hour';
      } else {
        if (typeof obj.value !== 'number' || typeof obj.unit !== 'string') return null;
        if (!isGrantPreset(obj.value, obj.unit as GrantUnit)) return null;
        value = obj.value;
        unit = obj.unit as GrantUnit;
      }
    } else {
      return null;
    }
    // Validasi UUID id — kalau bukan, error 400 bukan 500 dari Postgres ANY($1::uuid[]).
    if (!UUID_RE.test(id)) return null;
    if (ids.has(id)) return null;
    ids.add(id);
    grants.push({ id, expiresAt: grantExpiry(new Date(), value, unit) });
  }
  return grants;
}