import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET = process.env.JWT_SECRET || 'textspace-dev-secret-key-change-in-prod';

export interface UserPayload {
  id: string;
  username: string;
  display_name: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(user: UserPayload): string {
  return jwt.sign(user, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, SECRET) as UserPayload;
  } catch { return null; }
}

export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSession(user: UserPayload) {
  const token = createToken(user);
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true, secure: true, sameSite: 'lax',
    maxAge: 7 * 86400, path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' });
}
