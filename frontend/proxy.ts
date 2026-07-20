import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const userProtectedPrefixes = ["/dashboard", "/profile", "/test", "/result"];
const adminProtectedPrefixes = ["/admin/dashboard"];

// This is an optimistic navigation guard. The Fastify API verifies the JWT and
// role again before allowing access to any account or protected application data.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isUserProtected = userProtectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAdminProtected = adminProtectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isAdminProtected) {
    const hasAdminSession = Boolean(request.cookies.get("nexband_admin_session")?.value);

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

  const hasSession = Boolean(request.cookies.get("nexband_session")?.value);

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
