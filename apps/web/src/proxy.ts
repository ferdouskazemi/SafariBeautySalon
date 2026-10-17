import { NextResponse, type NextRequest } from 'next/server';

/**
 * Optimistic gate for the admin panel: without a session cookie, go straight to login.
 * Real authorization happens in the API on every request.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has('sbs_rt')) return NextResponse.next();

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin', '/admin/((?!login).*)'],
};
