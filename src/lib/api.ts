import { NextResponse } from 'next/server';
import { getSession } from './auth';
import { sql } from './db';

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(msg: string, status = 400) {
  return NextResponse.json({ success: false, error: msg }, { status });
}

export function withUser(handler: (req: Request, user: NonNullable<ReturnType<typeof getSession>>) => Promise<Response>) {
  return async (req: Request) => {
    const user = getSession();
    if (!user) return err('Unauthorized', 401);
    return handler(req, user);
  };
}

export function withAdmin(handler: (req: Request, user: NonNullable<ReturnType<typeof getSession>>) => Promise<Response>) {
  return async (req: Request) => {
    const user = getSession();
    if (!user) return err('Unauthorized', 401);
    const rows = await sql`SELECT role, banned FROM profiles WHERE id = ${user.id}`;
    if (rows.length === 0) return err('User not found', 404);
    if (rows[0].banned) return err('Account suspended', 403);
    if (rows[0].role !== 'admin') return err('Forbidden', 403);
    return handler(req, user);
  };
}
