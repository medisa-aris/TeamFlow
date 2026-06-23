import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

export async function POST(req) {
  const { email, password } = await req.json();

  let nestRes;
  try {
    nestRes = await fetchWithTimeout(`${process.env.NEXTJS_INTERNAL_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, 8000);
  } catch {
    return NextResponse.json({ message: 'Login timed out, please try again' }, { status: 504 });
  }

  if (!nestRes.ok) {
    const err = await nestRes.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Login gagal');
    return NextResponse.json({ message: msg }, { status: nestRes.status });
  }

  const data = await nestRes.json();
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  const baseOpts = { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' };

  cookieStore.set('tf_access', data.accessToken, { ...baseOpts, maxAge: 900 });
  cookieStore.set('tf_refresh', data.refreshToken, { ...baseOpts, maxAge: 7 * 24 * 3600 });

  const u = data.user;
  return NextResponse.json({
    user: {
      id: u.id,
      name: u.fullName,
      first: u.fullName.split(' ')[0],
      email: u.email,
      role: u.role === 'CEO' ? 'CEO' : 'Member',
    },
  });
}
