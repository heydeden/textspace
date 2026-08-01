import PtsBadge from './PtsBadge';
import VerifiedBadge from './VerifiedBadge';
import CustomRoleBadge from './CustomRoleBadge';

export default function UserIdentity({ displayName, verified, role, pts, customRoles, size = 'sm' }: {
  displayName: string;
  verified?: boolean;
  role?: string;
  pts?: number;
  customRoles?: string[];
  size?: 'sm' | 'md';
}) {
  const nameWidth = size === 'md' ? 'max-w-48' : 'max-w-40';
  const nameSize = size === 'md' ? 'text-sm' : 'text-sm';

  return (
    <div className="min-w-0">
      <div className="flex items-center min-w-0">
        <span title={displayName} className={`${nameWidth} ${nameSize} font-medium text-white truncate`}>{displayName}</span>
        {(verified || role === 'admin') ? <VerifiedBadge /> : null}
      </div>
      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
        {role === 'admin' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">Admin</span>}
        {role === 'mod' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">Mod</span>}
        {(customRoles || []).map(r => <CustomRoleBadge key={r} name={r} />)}
        <PtsBadge pts={pts} />
      </div>
    </div>
  );
}
