import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/login' || pathname === '/';
  const isRegisterPage = pathname === '/register';

  // If there is no session and the user is not on login or register page, redirect to root (which is login)
  if (!session && !isLoginPage && !isRegisterPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If there is a session and the user is on login or register page, redirect to dashboard
  if (session && (isLoginPage || isRegisterPage)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)',
  ],
};
