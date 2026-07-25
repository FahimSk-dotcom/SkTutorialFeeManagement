import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_token")?.value;

  const isAuthRoute = pathname.startsWith("/login");
  const isApiRoute = pathname.startsWith("/api");
  const isPublicAsset = pathname.startsWith("/_next") || pathname.includes(".");

  if (isPublicAsset) {
    return NextResponse.next();
  }

  // If user tries to access login while already logged in
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect all dashboard pages (excluding /login and /api/auth)
  if (!isAuthRoute && !token && !pathname.startsWith("/api/auth/login") && !pathname.startsWith("/api/auth/setup")) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
