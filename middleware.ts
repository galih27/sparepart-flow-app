
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Nama cookie ini mungkin perlu Anda sesuaikan.
  // Di aplikasi Firebase, cookie sesi sering kali memiliki nama seperti `__session` atau
  // yang Anda atur secara kustom. Untuk tujuan pengembangan dengan Auth client-side,
  // kita akan mencari cookie yang menandakan adanya token.
  // Di sini, kita akan berasumsi ada cookie bernama 'firebaseIdToken' yang disimpan setelah login.
  const hasToken = request.cookies.has('firebaseIdToken');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // Jika tidak ada token dan pengguna tidak berada di halaman login,
  // alihkan ke halaman login.
  if (!hasToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika ada token dan pengguna mencoba mengakses halaman login,
  // alihkan ke halaman utama.
  if (hasToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Jika tidak ada kondisi di atas yang terpenuhi, lanjutkan seperti biasa.
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
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
