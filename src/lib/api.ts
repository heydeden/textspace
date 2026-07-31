import { NextResponse } from 'next/server';
import { getSession, type UserPayload } from './auth';
import { sql } from './db';

const NO_STORE: HeadersInit = { 'Cache-Control': 'private, no-store' };

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status, headers: NO_STORE });
}

export function err(msg: string, status = 400) {
  return NextResponse.json({ success: false, error: msg }, { status, headers: NO_STORE });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUUID(id: string): boolean {
  return UUID_RE.test(id);
}

export function withUser(handler: (req: Request, user: NonNullable<UserPayload>) => Promise<Response>) {
  return async (req: Request) => {
    const user = await getSession();
    if (!user) return err('Unauthorized', 401);
    const rows = await sql`SELECT banned FROM profiles WHERE id = ${user.id}`;
    if (rows.length === 0) return err('Unauthorized', 401);
    if (rows[0].banned) return err('Account suspended', 403);
    return handler(req, user);
  };
}

export function withAdmin(handler: (req: Request, user: NonNullable<UserPayload>) => Promise<Response>) {
  return async (req: Request) => {
    const user = await getSession();
    if (!user) return err('Unauthorized', 401);
    const rows = await sql`SELECT role, banned FROM profiles WHERE id = ${user.id}`;
    if (rows.length === 0) return err('User not found', 404);
    if (rows[0].banned) return err('Account suspended', 403);
    if (rows[0].role !== 'admin') return err('Forbidden', 403);
    return handler(req, user);
  };
}
