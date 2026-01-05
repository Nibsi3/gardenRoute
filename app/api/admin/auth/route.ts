import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { logInfo, logError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    logInfo(`Auth attempt for user: ${username}`);

    const user = await authenticateUser(username, password);

    if (user) {
      logInfo(`Auth success for user: ${username}`);
      const response = NextResponse.json({ success: true, user });
      
      // Set the session cookie from the server side for better reliability
      response.cookies.set("admin-session", "true", {
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      
      return response;
    } else {
      logError(`Auth failed: Invalid credentials for ${username}`);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
  } catch (error) {
    logError("Authentication failed:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
