import { badgeThemeClass, badgeEffectClass } from '@/lib/badges';

export interface BadgeData {
  id: string;
  name: string;
  theme?: string;
  effect?: string;
}

export default function Badge({ badge }: { badge: BadgeData }) {
  return (
    <span
      title={badge.name}
      className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap border ${badgeThemeClass(badge.theme)} ${badgeEffectClass(badge.effect)}`}
    >
      {badge.name}
    </span>
  );
}
