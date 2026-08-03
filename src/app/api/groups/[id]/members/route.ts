import { query } from '@/lib/db';
import { ok, err, isUUID } from '@/lib/api';
import { withUser } from '@/lib/api';

// Join grup. Publik → langsung aktif. Privat → status pending (menunggu approve admin).
export const POST = withUser(async (req, user) => {
  const id = new URL(req.url).pathname.split('/')[3];
  if (!isUUID(id)) return err('Invalid group id');

  const group = await query(`SELECT privacy FROM groups WHERE id = $1`, [id]);
  if (group.length === 0) return err('Group not found', 404);

  const existing = await query(`SELECT status FROM group_members WHERE group_id = $1 AND user_id = $2`, [id, user.id]);
  if (existing.length > 0) return err('Already joined or pending', 409);

  const status = group[0].privacy === 'private' ? 'pending' : 'active';
  await query(
    `INSERT INTO group_members (group_id, user_id, role, status) VALUES ($1, $2, 'user', $3)`,
    [id, user.id, status]
  );
  return ok({ status }, status === 'active' ? 200 : 201);
});

// Leave / batalkan join (pending).
export const DELETE = withUser(async (req, user) => {
  const id = new URL(req.url).pathname.split('/')[3];
  if (!isUUID(id)) return err('Invalid group id');

  const members = await query(`SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`, [id, user.id]);
  if (members.length === 0) return err('Not a member', 404);

  // Creator tidak boleh leave sendirian — harus ada admin lain, atau hapus grup.
  if (members[0].role === 'admin') {
    const otherAdmins = await query(
      `SELECT COUNT(*)::int as c FROM group_members WHERE group_id = $1 AND role = 'admin' AND status = 'active' AND user_id != $2`,
      [id, user.id]
    );
    if (otherAdmins[0].c === 0) return err('Only admin — delete the group or transfer ownership', 403);
  }

  await query(`DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`, [id, user.id]);
  return ok({ left: true });
});

export const dynamic = 'force-dynamic';
