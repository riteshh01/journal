import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('journal_access_token')?.value;
  const refreshToken = request.cookies.get('journal_refresh_token')?.value;
  const hasSession = Boolean(accessToken || refreshToken);

  const isLoginPage = pathname === '/login';

  // If already authenticated and visiting /login, redirect to dashboard
  if (isLoginPage && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If not authenticated and visiting protected routes, redirect to /login
  if (!isLoginPage && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled directly or proxied to backend)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
