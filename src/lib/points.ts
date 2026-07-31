export function pointsLevel(pts: number): string {
  if (pts >= 1000) return 'Platinum';
  if (pts >= 500) return 'Gold';
  if (pts >= 200) return 'Silver';
  if (pts >= 50) return 'Bronze';
  return 'Newcomer';
}

export function pointsBadgeClass(pts: number): string {
  const level = pointsLevel(pts);
  switch (level) {
    case 'Platinum': return 'bg-violet-500/20 text-violet-300';
    case 'Gold': return 'bg-amber-500/20 text-amber-400';
    case 'Silver': return 'bg-zinc-400/20 text-zinc-300';
    case 'Bronze': return 'bg-orange-500/20 text-orange-400';
    default: return 'bg-zinc-600/20 text-zinc-400';
  }
}
