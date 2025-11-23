
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Periksa cookie otentikasi Firebase. Nama cookie ini mungkin perlu disesuaikan
  // tergantung pada bagaimana Anda mengaturnya di sisi klien.
  const hasToken = request.cookies.has('firebaseIdToken');

  const isLoginPage = pathname === '/login';

  // Jika pengguna belum login (tidak ada token) dan mencoba mengakses halaman apa pun selain halaman login,
  // arahkan mereka ke halaman login.
  if (!hasToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika pengguna sudah login (ada token) dan mencoba mengakses halaman login,
  // arahkan mereka ke halaman utama (dashboard).
  if (hasToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Lanjutkan ke halaman yang diminta jika tidak ada kondisi di atas yang terpenuhi.
  return NextResponse.next();
}

export const config = {
  // Jalankan middleware untuk semua path kecuali yang secara eksplisit dikecualikan.
  // Ini mencegah middleware berjalan pada file statis, gambar, atau rute API,
  // yang dapat meningkatkan performa.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
