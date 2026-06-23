import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const hasToken = req.cookies.has('tf_access');

  const isPublic = pathname === '/login';

  if (!hasToken && !isPublic) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasToken && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth|api/sse|api/proxy).*)'],
};
