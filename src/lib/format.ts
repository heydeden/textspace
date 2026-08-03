// Sisa waktu sampai expires_at (ISO). null = permanen. Sudah lewat = 'Expired'.
export function formatRemaining(expiresAt: string | null, now: Date = new Date()): string {
  if (!expiresAt) return 'Permanen';
  const target = new Date(expiresAt).getTime();
  const ms = target - now.getTime();
  if (ms <= 0) return 'Expired';
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${h}h`;
  const d = Math.floor(ms / 86400000);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  return `${mo}mo`;
}

export function formatCount(n: number | string): string {
  const num = Number(n);
  if (isNaN(num)) return String(n);
  const abs = Math.abs(num);
  if (abs < 1000) return String(num);
  const sign = num < 0 ? '-' : '';
  let value: number;
  let suffix: string;
  if (abs >= 1e9) { value = abs / 1e9; suffix = 'B'; }
  else if (abs >= 1e6) { value = abs / 1e6; suffix = 'M'; }
  else { value = abs / 1e3; suffix = 'k'; }
  const rounded = Math.round(value * 10) / 10;
  return `${sign}${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}${suffix}`;
}
