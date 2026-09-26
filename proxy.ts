import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CRON_SECRET validation for scheduled tasks
  if (pathname === "/api/settings/backup") {
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

  // Explicitly exempt dedicated machine-to-machine Agent Sync endpoint from owner/session cookie auth.
  // The route handler (/api/agent/sync/route.ts) authoritatively validates Authorization: Bearer <AGENT_SYNC_TOKEN>.
  if (pathname === "/api/agent/sync") {
    return NextResponse.next();
  }

  // Safeguard: completely bypass auth checks for public routes, tokenized parent portal, static assets, and APIs
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/api/parent") ||
    pathname === "/api/agent/sync" ||
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
    "/((?!login|api/auth|parent|api/parent|api/agent/sync|_next|icons|manifest\\.json|sw\\.js|favicon\\.ico|.*\\.).*)",
  ],
};
