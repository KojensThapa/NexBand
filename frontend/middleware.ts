import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const userProtectedPrefixes = ["/dashboard", "/profile", "/test", "/result"];
const adminProtectedPrefixes = ["/admin/dashboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isUserProtected = userProtectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAdminProtected = adminProtectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isAdminProtected) {
    const hasAdminSession = request.cookies.has("nexband_admin_session");

    if (!hasAdminSession) {
      const signIn = new URL("/admin/auth/signin", request.url);
      signIn.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signIn);
    }

    return NextResponse.next();
  }

  if (!isUserProtected) {
    return NextResponse.next();
  }

  // TODO: validate session cookie / JWT when auth is wired
  const hasSession = request.cookies.has("nexband_session");

  if (!hasSession) {
    const signIn = new URL("/auth/signin", request.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/test/:path*",
    "/result/:path*",
    "/admin/dashboard/:path*",
  ],
};
