import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'bala-ganesh-association-fallback-secret-2026'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected application routes
  const protectedPrefixes = ['/dashboard', '/expenses', '/laddu', '/invitations', '/contribute', '/admin'];
  const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isProtected) {
    const token = request.cookies.get('bga_auth_session')?.value;

    if (!token) {
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/expenses/:path*',
    '/laddu/:path*',
    '/invitations/:path*',
    '/contribute/:path*',
    '/admin/:path*',
  ],
};
