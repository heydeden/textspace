export function formatCount(n: number | string): string {
  const num = Number(n);
  if (isNaN(num)) return String(n);
  if (num < 1000) return String(num);
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  let value: number;
  let suffix: string;
  if (abs >= 1e9) { value = abs / 1e9; suffix = 'B'; }
  else if (abs >= 1e6) { value = abs / 1e6; suffix = 'M'; }
  else { value = abs / 1e3; suffix = 'k'; }
  const rounded = Math.round(value * 10) / 10;
  return `${sign}${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}${suffix}`;
}
