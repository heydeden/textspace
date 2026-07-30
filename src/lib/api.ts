import { NextResponse } from 'next/server';
import { getSession } from './auth';

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
