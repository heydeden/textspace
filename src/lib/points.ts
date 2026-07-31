export function pointsLevel(pts: number): string {
  if (pts >= 1000) return 'Platinum';
  if (pts >= 500) return 'Gold';
  if (pts >= 200) return 'Silver';
  if (pts >= 50) return 'Bronze';
  return 'Newcomer';
}
