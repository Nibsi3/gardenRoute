import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const { pathname } = new URL(req.url);

  // Protect all /admin routes except login page
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    // Check for admin session cookie
    const cookies = req.headers.get("cookie") || "";
    const hasSession = cookies.includes("admin-session=true");

    if (!hasSession) {
      // Redirect to login page
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
