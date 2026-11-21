/**
 * Middleware Next.js — gerbang rute.
 *
 * Tugasnya hanya memastikan ada cookie sesi & mengarahkan ke /login bila tidak ada.
 * Validasi sesi sebenarnya (DB) dilakukan di layer page/route via getSession().
 * Middleware berjalan di Edge: tidak mengakses DB (cukup cek keberadaan cookie).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  // Boleh diakses tanpa login:
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Butuh login: area operasional & portal.
  if (!token && (pathname.startsWith("/app") || pathname.startsWith("/portal"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/portal/:path*"],
};
