import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";

const protectedPrefixes = ["/account", "/orders", "/checkout", "/cart"];
const authOnlyPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];

export const config = {
  matcher: ["/admin/:path*", "/login", "/signup", "/forgot-password", "/reset-password", "/account/:path*", "/account", "/orders/:path*", "/checkout/:path*", "/cart/:path*", "/cart"],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const isAdmin = pathname.startsWith("/admin");
  const needsAuth = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!token) {
    if (isAdmin || needsAuth) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
    return NextResponse.next();
  }

  if (authOnlyPaths.includes(pathname)) return NextResponse.redirect(new URL("/", request.url));

  if (isAdmin) {
    let roleStr = "";
    try {
      const payload: any = decodeJwt(token);
      const rawRole = payload.role ?? payload.roles;
      if (Array.isArray(rawRole)) {
        roleStr = rawRole.join(",").toUpperCase();
      } else {
        roleStr = String(rawRole ?? "").toUpperCase();
      }
    } catch {
      /* fallback parse */
    }

    if (!roleStr) {
      try {
        const userCookie = JSON.parse(decodeURIComponent(request.cookies.get("user")?.value ?? "{}"));
        roleStr = String(userCookie.role ?? "").toUpperCase();
      } catch {
        /* no role */
      }
    }

    const hasPermission = roleStr.includes("ADMIN") || roleStr.includes("EMPLOYEE");
    if (!hasPermission) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

