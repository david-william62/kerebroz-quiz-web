import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, signAdminToken, COOKIE_NAME } from '@/lib/auth';

// POST /api/admin/login
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    console.log(password)

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const valid = await verifyAdminPassword(password);
    if (!valid) {
      // Small delay to deter brute force
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signAdminToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
