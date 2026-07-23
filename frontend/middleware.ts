import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";

export const config = {
  matcher: ["/admin/:path*", "/login", "/signup", "/account/:path*", "/account"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;
  const userCookie = request.cookies.get("user")?.value;

  // Routes yêu cầu đăng nhập để xem
  const protectedPaths = ["/account"];
  const isProtectedPath = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Routes chỉ dành cho khách (đã đăng nhập sẽ redirect về /)
  const authOnlyPaths = ["/login", "/signup"];
  const isAuthOnlyPath = authOnlyPaths.includes(pathname);

  const isAdminPath = pathname.startsWith("/admin");

  if (token) {
    let userRole = "";

    try {
      const payload = decodeJwt(token);
      userRole = (payload.role as string) || "";
    } catch {
      // token malformed
    }

    // Nếu không lấy được role từ JWT thì đọc từ cookie user
    if (!userRole && userCookie) {
      try {
        const decodedCookie = decodeURIComponent(userCookie);
        const parsedUser = JSON.parse(decodedCookie);
        userRole = parsedUser.role || "";
      } catch {
        // cookie malformed
      }
    }

    // Đã đăng nhập → không cho vào trang login/signup
    if (isAuthOnlyPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Đã đăng nhập nhưng không phải admin → không cho vào /admin
    if (isAdminPath && userRole !== "admin" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // Chưa đăng nhập → chặn /admin
  if (isAdminPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Chưa đăng nhập → chặn /account
  if (isProtectedPath) {
    return NextResponse.redirect(new URL("/login?redirect=" + encodeURIComponent(pathname), request.url));
  }

  return NextResponse.next();
}