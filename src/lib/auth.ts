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

export function getSession(): UserPayload | null {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSession(user: UserPayload) {
  const token = createToken(user);
  cookies().set('session', token, {
    httpOnly: true, secure: true, sameSite: 'lax',
    maxAge: 7 * 86400, path: '/',
  });
}

export function clearSession() {
  cookies().set('session', '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' });
}
