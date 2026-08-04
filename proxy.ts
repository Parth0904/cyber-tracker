import authMiddleware from "next-auth/middleware";

export function proxy(req: any, event: any) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.nextUrl?.protocol || (host.includes("localhost") || host.includes("127.0.0.1") ? "http:" : "https:");
  const baseUrl = `${protocol}//${host}`;
  process.env.NEXTAUTH_URL = baseUrl;
  process.env.AUTH_URL = baseUrl;

  return authMiddleware(req, event);
}

export const config = {
  matcher: [
    "/((?!login|api/auth|api/learning/sessions/\\d+/terminate|_next|icons|manifest\\.json|sw\\.js|favicon\\.ico|.*\\.).*)",
  ],
};

