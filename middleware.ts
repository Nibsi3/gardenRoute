import { NextResponse, NextRequest } from "next/server";
import { logInfo, logWarn } from "@/lib/logger";

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // Protect all /admin routes except login page
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && pathname !== "/admin/logout") {
    // Check for admin session cookie using the built-in cookies helper
    const sessionCookie = req.cookies.get("admin-session");
    const hasSession = sessionCookie?.value === "true";

    logInfo(`Middleware: Checking ${pathname} | hasSession=${hasSession}`);

    if (!hasSession) {
      logWarn(`Middleware: Unauthorized access to ${pathname}. Redirecting to /admin/login`);
      const loginUrl = new URL("/admin/login", req.url);
      // Pass the original path as a redirect parameter if you want to support return-to
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    logInfo(`Middleware: Authorized access to ${pathname}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
