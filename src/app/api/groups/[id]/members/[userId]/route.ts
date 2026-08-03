import { query } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withUser } from '@/lib/api';
import { validateGroupRole, canManageGroup } from '@/lib/groups';

// Admin-only: approve/tolak member pending, kick member, ganti role.
// action: 'approve' | 'reject' | 'kick' | 'role' (role ganti via `role` field)
export const PATCH = withUser(async (req, user) => {
  const parts = new URL(req.url).pathname.split('/');
  const id = parts[3];
  const targetId = parts[5];
  if (!isUUID(id) || !isUUID(targetId)) return err('Invalid id');

  const me = await query(`SELECT role, status FROM group_members WHERE group_id = $1 AND user_id = $2`, [id, user.id]);
  if (me.length === 0 || me[0].status !== 'active') return err('Not a member', 403);
  if (!canManageGroup(me[0].role)) return err('Only group admin can do this', 403);

  const { action, role } = await req.json();
  if (!['approve', 'reject', 'kick', 'role'].includes(action)) return err('Invalid action');

  const target = await query(`SELECT role, status FROM group_members WHERE group_id = $1 AND user_id = $2`, [id, targetId]);
  if (target.length === 0) return err('Member not found', 404);

  if (action === 'approve') {
    if (target[0].status !== 'pending') return err('Not pending');
    await query(`UPDATE group_members SET status = 'active' WHERE group_id = $1 AND user_id = $2`, [id, targetId]);
    return ok({ status: 'active' });
  }

  if (action === 'reject') {
    if (target[0].status !== 'pending') return err('Not pending');
    await query(`DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`, [id, targetId]);
    return ok({ deleted: true });
  }

  if (action === 'kick') {
    if (target[0].role === 'admin') return err('Cannot kick an admin', 403);
    await query(`DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`, [id, targetId]);
    return ok({ deleted: true });
  }

  // action === 'role'
  if (target[0].status !== 'active') return err('Only active members can hold a role', 400);
  const newRole = validateGroupRole(role);
  if (newRole === null) return err('Invalid role');
  if (target[0].role === 'admin' && newRole !== 'admin') {
    // Demote admin → pastikan masih ada admin lain.
    const otherAdmins = await query(
      `SELECT COUNT(*)::int as c FROM group_members WHERE group_id = $1 AND role = 'admin' AND status = 'active' AND user_id != $2`,
      [id, targetId]
    );
    if (otherAdmins[0].c === 0) return err('Cannot demote last admin', 403);
  }
  await query(`UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3`, [newRole, id, targetId]);
  return ok({ role: newRole });
});

export const dynamic = 'force-dynamic';
