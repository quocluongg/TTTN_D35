import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";

export const config = {
  matcher: ["/admin/:path*", "/login", "/register"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const token = request.cookies.get("token")?.value;
  const userCookie = request.cookies.get("user")?.value;

  const authPaths = ["/login", "/register"];
  const isAuthPath = authPaths.includes(pathname);
  const isAdminPath = pathname.startsWith("/admin");

  if (token) {
    let userRole = "";

    try {
      const payload = decodeJwt(token);
      userRole = payload.role as string;
    } catch (error) {
    }

    if (!userRole && userCookie) {
      try {
        const decodedCookie = decodeURIComponent(userCookie);
        const parsedUser = JSON.parse(decodedCookie);
        userRole = parsedUser.role;
      } catch (e) {
      }
    }

    if (isAuthPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isAdminPath && userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (isAdminPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}