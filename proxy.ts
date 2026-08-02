import authMiddleware from "next-auth/middleware";

export function proxy(req: any, event: any) {
  return authMiddleware(req, event);
}

export const config = {
  matcher: [
    "/((?!login|api/auth|_next|icons|manifest\\.json|sw\\.js|favicon\\.ico|.*\\.).*)",
  ],
};
