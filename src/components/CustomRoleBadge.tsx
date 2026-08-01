import { roleColor } from '@/lib/customRoles';

export default function CustomRoleBadge({ name }: { name: string }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${roleColor(name)}`} title={name}>
      {name}
    </span>
  );
}
