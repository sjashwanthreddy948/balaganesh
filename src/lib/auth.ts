import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'bala-ganesh-association-fallback-secret-2026'
);

export const AUTH_COOKIE_NAME = 'bga_auth_session';

export interface UserSession {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'VOLUNTEER';
  canAddExpenses?: boolean;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export async function createAuthToken(user: UserSession): Promise<string> {
  return new SignJWT({
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    canAddExpenses: user.canAddExpenses || false,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(JWT_SECRET);
}

export async function verifyAuthToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (
      payload.sub &&
      payload.username &&
      payload.name &&
      payload.role &&
      typeof payload.sub === 'string' &&
      typeof payload.username === 'string' &&
      typeof payload.name === 'string' &&
      (payload.role === 'ADMIN' || payload.role === 'VOLUNTEER')
    ) {
      return {
        id: payload.sub,
        username: payload.username,
        name: payload.name,
        role: payload.role as 'ADMIN' | 'VOLUNTEER',
        canAddExpenses: !!payload.canAddExpenses,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getUserSession(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}

export async function requireAdminSession(): Promise<UserSession | null> {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') return null;
  return session;
}
