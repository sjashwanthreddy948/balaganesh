import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';
import { comparePassword, createAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Please enter both username and password.' },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;
    const cleanUsername = username.trim().toLowerCase();

    // Lookup user case-insensitively (handles mobile auto-capitalization like "Admin")
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: 'insensitive',
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Create session token with role & permissions
    const token = await createAuthToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as 'ADMIN' | 'VOLUNTEER',
      canAddExpenses: user.canAddExpenses,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        canAddExpenses: user.canAddExpenses,
      },
    });

    // Detect if running on localhost (HTTP) vs production cloud (HTTPS)
    const host = req.headers.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';
    const isSecure = isHttps || (!isLocal && process.env.NODE_ENV === 'production');

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 14 * 24 * 60 * 60, // 14 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    let errorMessage = 'Something went wrong. Please try again.';

    if (!process.env.DATABASE_URL) {
      errorMessage = 'Database configuration missing: DATABASE_URL is not set in Vercel Environment Variables.';
    } else if (error?.message?.includes("Can't reach database server") || error?.code === 'P1001') {
      errorMessage = 'Cannot reach database server. Please check your Supabase connection string in Vercel.';
    } else if (error?.message?.includes('authentication failed') || error?.code === 'P1000') {
      errorMessage = 'Database authentication failed. Please verify your database password in Vercel.';
    } else if (error?.message) {
      errorMessage = `Database error: ${error.message}`;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
