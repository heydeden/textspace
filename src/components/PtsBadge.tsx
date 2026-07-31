import { pointsLevel, pointsBadgeClass } from '@/lib/points';

export default function PtsBadge({ pts }: { pts?: number }) {
  if (pts === undefined || pts === null) return null;
  return (
    <span
      title={`${pts} pts`}
      className={`text-[10px] px-2 py-0.5 rounded-full ml-2 ${pointsBadgeClass(pts)}`}
    >
      {pointsLevel(pts)}
    </span>
  );
}
