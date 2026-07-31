import { BadgeCheck } from 'lucide-react';

export default function VerifiedBadge() {
  return (
    <span role="img" aria-label="Verified" title="Verified" className="inline-flex ml-1 align-middle">
      <BadgeCheck className="w-4 h-4 fill-sky-500 text-white" />
    </span>
  );
}
