import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('tf_refresh')?.value;

  if (refreshToken) {
    const accessToken = cookieStore.get('tf_access')?.value;
    await fetchWithTimeout(`${process.env.NEXTJS_INTERNAL_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    }, 5000).catch(() => {});
  }

  cookieStore.delete('tf_access');
  cookieStore.delete('tf_refresh');
  return NextResponse.json({ ok: true });
}
