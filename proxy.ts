import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, verifyAgentToken } from "./lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Agent sync API authentication (Bearer token)
  if (pathname.startsWith("/api/agent/")) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing Bearer token for agent sync" },
        { status: 401 }
      );
    }
    const token = authHeader.slice(7);
    if (!verifyAgentToken(token)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid agent sync token" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // CRON_SECRET validation for scheduled tasks
  if (pathname === "/api/reviews/parent-report-cron" || pathname === "/api/settings/backup") {
    const cronSecret = process.env.CRON_SECRET;
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && !cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized: CRON_SECRET is not configured in production" },
        { status: 401 }
      );
    }

    if (cronSecret) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.next();
  }

  // Safeguard: completely bypass auth checks for public routes, static assets, and APIs
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.includes(".") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get("session")?.value;

  if (sessionToken) {
    const isAuthorized = verifySessionToken(sessionToken);
    if (isAuthorized) {
      return NextResponse.next();
    }
  }

  // If session is missing, expired, or malformed:
  const response = pathname.startsWith("/api/")
    ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    : NextResponse.redirect(new URL("/login", req.url));

  if (sessionToken) {
    response.cookies.delete("session");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!login|api/auth|_next|icons|manifest\\.json|sw\\.js|favicon\\.ico|.*\\.).*)",
  ],
};
