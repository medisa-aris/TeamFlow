import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const NESTJS = process.env.NEXTJS_INTERNAL_URL;

async function proxyRequest(req, context, attempt = 0) {
  const { path } = await context.params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('tf_access')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const search = new URL(req.url).searchParams.toString();
  const url = `${NESTJS}/api/v1/${path.join('/')}${search ? '?' + search : ''}`;
  const method = req.method;

  let body;
  if (!['GET', 'HEAD'].includes(method)) {
    const text = await req.text();
    if (text) body = text;
  }

  let nestRes = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body,
  });

  if (nestRes.status === 401 && attempt === 0) {
    const refreshToken = cookieStore.get('tf_refresh')?.value;
    if (refreshToken) {
      const rr = await fetch(`${NESTJS}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (rr.ok) {
        const { accessToken: newToken } = await rr.json();
        const isProd = process.env.NODE_ENV === 'production';
        cookieStore.set('tf_access', newToken, { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 3600 });
        nestRes = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newToken}` },
          body,
        });
      }
    }
    if (nestRes.status === 401) {
      cookieStore.delete('tf_access');
      cookieStore.delete('tf_refresh');
      return NextResponse.json({ message: 'Session expired' }, { status: 401 });
    }
  }

  const resText = nestRes.status === 204 ? null : await nestRes.text();
  return new NextResponse(resText || null, {
    status: nestRes.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET    = (req, ctx) => proxyRequest(req, ctx);
export const POST   = (req, ctx) => proxyRequest(req, ctx);
export const PATCH  = (req, ctx) => proxyRequest(req, ctx);
export const DELETE = (req, ctx) => proxyRequest(req, ctx);
